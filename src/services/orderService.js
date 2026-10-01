import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { normalizeProduct } from './productService.js';

/**
 * Phase 6 & 7 Shipping & Financial Constants
 * shipping_fee = 0, discount = 0, total = subtotal
 */
export const STANDARD_SHIPPING_FEE = 0;

/**
 * Friendly error message formatter for Order and RPC operations
 */
export const formatOrderError = (error) => {
  if (!error) return 'An unexpected error occurred while processing your order.';
  const msg = typeof error === 'string' ? error : error.message || error.details || '';
  const lower = msg.toLowerCase();

  if (lower.includes('empty')) {
    return 'Your shopping cart is empty. Please add products before placing an order.';
  }
  if (lower.includes('out of stock') || lower.includes('sold out')) {
    return 'One or more items in your cart is currently out of stock.';
  }
  if (lower.includes('available') || lower.includes('unit(s)')) {
    return msg; // User-friendly formatted message from RPC with exact stock counts
  }
  if (lower.includes('inactive') || lower.includes('not active')) {
    return 'One or more items in your cart is currently inactive and cannot be ordered.';
  }
  if (lower.includes('unauthorized') || lower.includes('must be logged in')) {
    return 'You must be logged in to access this order. Please sign in.';
  }
  if (lower.includes('cannot be cancelled') || lower.includes('already')) {
    return msg || 'This order cannot be cancelled in its current state.';
  }
  if (lower.includes('violates row-level security') || lower.includes('policy')) {
    return 'You do not have permission to view or modify this order.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }

  return msg || 'Failed to process order request. Please try again.';
};

/**
 * Normalizes an order row with camelCase properties and historical item snapshots
 */
export const normalizeOrder = (orderRow, itemsRows = []) => {
  if (!orderRow) return null;

  const normalizedItems = (itemsRows || []).map((item) => ({
    id: item.id,
    orderId: item.order_id,
    productId: item.product_id,
    // Historical snapshots preserved directly from order_items table
    productName: item.product_name,
    productPrice: Number(item.product_price || 0),
    selectedSize: item.selected_size || null,
    selectedColor: item.selected_color || null,
    quantity: Number(item.quantity || 1),
    subtotal: Number(item.subtotal || 0),
    createdAt: item.created_at || null,
    // Optional joined current product data for presentation (e.g. thumbnail image)
    product: item.products ? normalizeProduct(item.products) : null,
  }));

  return {
    id: orderRow.id || orderRow.order_id,
    userId: orderRow.user_id,
    shippingName: orderRow.shipping_name,
    shippingPhone: orderRow.shipping_phone,
    shippingAddress: orderRow.shipping_address,
    shippingCity: orderRow.shipping_city,
    notes: orderRow.notes || '',
    paymentMethod: orderRow.payment_method || 'cash_on_delivery',
    status: orderRow.status || 'pending',
    // Historical financial calculations preserved directly from database order record
    subtotal: Number(orderRow.subtotal || 0),
    shippingFee: Number(orderRow.shipping_fee || 0),
    discount: Number(orderRow.discount || 0),
    total: Number(orderRow.total || 0),
    createdAt: orderRow.created_at || new Date().toISOString(),
    updatedAt: orderRow.updated_at || null,
    items: normalizedItems,
    itemsCount: orderRow.items_count || normalizedItems.reduce((acc, item) => acc + item.quantity, 0),
  };
};

/**
 * Executes an atomic checkout transaction via Supabase PostgreSQL RPC `create_order_from_cart`.
 * Preserved from Phase 6.
 *
 * @param {Object} params
 * @param {Object} params.shippingInfo - Customer shipping details
 * @returns {Promise<{ success: boolean, order?: Object, error?: string }>}
 */
export const createOrder = async ({ shippingInfo }) => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Database connection is not configured.',
    };
  }

  const { shippingName, shippingPhone, shippingAddress, shippingCity, notes } = shippingInfo || {};

  if (!shippingName || !shippingName.trim()) {
    return { success: false, error: 'Recipient full name is required.' };
  }
  if (!shippingPhone || !shippingPhone.trim() || shippingPhone.trim().length < 8) {
    return { success: false, error: 'A valid contact phone number is required for Cash on Delivery.' };
  }
  if (!shippingAddress || !shippingAddress.trim() || shippingAddress.trim().length < 5) {
    return { success: false, error: 'Complete street delivery address is required.' };
  }
  if (!shippingCity || !shippingCity.trim()) {
    return { success: false, error: 'Delivery city is required.' };
  }

  try {
    const { data, error } = await supabase.rpc('create_order_from_cart', {
      p_shipping_name: shippingName.trim(),
      p_shipping_phone: shippingPhone.trim(),
      p_shipping_address: shippingAddress.trim(),
      p_shipping_city: shippingCity.trim(),
      p_notes: notes ? notes.trim() : null,
    });

    if (error) {
      console.error('Atomic checkout RPC failed:', error);
      return {
        success: false,
        error: formatOrderError(error),
      };
    }

    if (!data || !data.order_id) {
      return {
        success: false,
        error: 'Order could not be created. Please try again.',
      };
    }

    const orderDetailsRes = await getMyOrderById(data.user_id, data.order_id);
    const finalOrder = orderDetailsRes.success && orderDetailsRes.order
      ? orderDetailsRes.order
      : normalizeOrder(data);

    return {
      success: true,
      order: finalOrder,
      message: 'Your order has been placed successfully.',
    };
  } catch (err) {
    console.error('Unexpected exception during atomic checkout:', err);
    return {
      success: false,
      error: formatOrderError(err),
    };
  }
};

/**
 * Fetches all orders belonging to the authenticated customer
 * RLS in PostgreSQL strictly guarantees no cross-customer order leakage.
 *
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{ success: boolean, orders: Array, error?: string }>}
 */
export const getMyOrders = async (userId) => {
  if (!userId) {
    return { success: true, orders: [] };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      orders: [],
      error: 'Supabase database is not configured.',
    };
  }

  try {
    // 1. Fetch user orders (enforced by RLS auth.uid() = user_id)
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Failed to fetch customer orders:', ordersError);
      return {
        success: false,
        orders: [],
        error: formatOrderError(ordersError),
      };
    }

    if (!ordersData || ordersData.length === 0) {
      return { success: true, orders: [] };
    }

    const orderIds = ordersData.map((o) => o.id);

    // 2. Fetch order items snapshots
    let orderItemsData = [];
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(id, name, image_url, category, brand)')
        .in('order_id', orderIds);

      if (!itemsError && itemsData) {
        orderItemsData = itemsData;
      } else {
        const { data: plainItems } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);
        orderItemsData = plainItems || [];
      }
    } catch (err) {
      console.warn('Error fetching order items:', err);
    }

    // Group items by order_id
    const itemsByOrderId = new Map();
    orderItemsData.forEach((item) => {
      const list = itemsByOrderId.get(item.order_id) || [];
      list.push(item);
      itemsByOrderId.set(item.order_id, list);
    });

    const normalizedOrders = ordersData.map((order) => {
      const items = itemsByOrderId.get(order.id) || [];
      return normalizeOrder(order, items);
    });

    return {
      success: true,
      orders: normalizedOrders,
    };
  } catch (error) {
    console.error('Unexpected error in getMyOrders:', error);
    return {
      success: false,
      orders: [],
      error: formatOrderError(error),
    };
  }
};

/**
 * Backward compatibility alias for getMyOrders
 */
export const getUserOrders = getMyOrders;

/**
 * Fetches an individual order by ID for the authenticated customer
 * RLS enforces that a customer can only read their own order.
 *
 * @param {string} [userId] - Optional user UUID for verification
 * @param {string} orderId - Order UUID
 * @returns {Promise<{ success: boolean, order?: Object, error?: string }>}
 */
export const getMyOrderById = async (userId, orderId) => {
  // Support both (userId, orderId) and (orderId) signatures
  const targetOrderId = orderId || userId;
  const targetUserId = orderId ? userId : null;

  if (!targetOrderId) {
    return { success: false, error: 'Order ID is required.' };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase database is not configured.' };
  }

  try {
    let query = supabase.from('orders').select('*').eq('id', targetOrderId);
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: orderData, error: orderError } = await query.maybeSingle();

    if (orderError) {
      console.error('Error fetching order by ID:', orderError);
      return {
        success: false,
        error: formatOrderError(orderError),
      };
    }

    if (!orderData) {
      return {
        success: false,
        error: 'Order not found or you do not have permission to view it.',
      };
    }

    // Fetch snapshot items with joined product image/metadata
    let itemsData = [];
    try {
      const { data: itemRows, error: itemError } = await supabase
        .from('order_items')
        .select('*, products(id, name, image_url, category, brand)')
        .eq('order_id', targetOrderId);

      if (!itemError && itemRows) {
        itemsData = itemRows;
      }
    } catch (itemErr) {
      console.warn('Error fetching order item snapshots:', itemErr);
    }

    const order = normalizeOrder(orderData, itemsData);

    return {
      success: true,
      order,
    };
  } catch (error) {
    console.error('Unexpected error in getMyOrderById:', error);
    return {
      success: false,
      error: formatOrderError(error),
    };
  }
};

/**
 * Backward compatibility alias for getMyOrderById
 */
export const getOrderById = (orderId, userId) => getMyOrderById(userId, orderId);

/**
 * Cancels an eligible customer order (must be 'pending' or 'confirmed')
 * Executes through secure RPC with fallback to direct RLS-guarded update.
 *
 * @param {string} [userId] - Authenticated user UUID
 * @param {string} orderId - Order UUID
 * @returns {Promise<{ success: boolean, order?: Object, message?: string, error?: string }>}
 */
export const cancelMyOrder = async (userId, orderId) => {
  const targetOrderId = orderId || userId;
  const targetUserId = orderId ? userId : null;

  if (!targetOrderId) {
    return { success: false, error: 'Order ID is required.' };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database connection is not configured.' };
  }

  try {
    // 1. Try atomic cancellation RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('cancel_customer_order', {
      p_order_id: targetOrderId,
    });

    if (!rpcError && rpcData?.success) {
      const refreshed = await getMyOrderById(targetUserId, targetOrderId);
      return {
        success: true,
        order: refreshed.order || null,
        message: 'Your order has been cancelled successfully.',
      };
    }

    // 2. If RPC is not available in database yet, execute standard RLS update
    let updateQuery = supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', targetOrderId)
      .in('status', ['pending', 'confirmed']);

    if (targetUserId) {
      updateQuery = updateQuery.eq('user_id', targetUserId);
    }

    const { data, error } = await updateQuery.select().maybeSingle();

    if (error) {
      return { success: false, error: formatOrderError(error) };
    }

    if (!data) {
      return {
        success: false,
        error: 'Order could not be cancelled. Only pending or confirmed orders can be cancelled.',
      };
    }

    const refreshed = await getMyOrderById(targetUserId, targetOrderId);
    return {
      success: true,
      order: refreshed.order || normalizeOrder(data),
      message: 'Your order has been cancelled successfully.',
    };
  } catch (err) {
    console.error('Cancel order exception:', err);
    return { success: false, error: formatOrderError(err) };
  }
};

/**
 * Backward compatibility alias for cancelMyOrder
 */
export const cancelOrder = (orderId, userId) => cancelMyOrder(userId, orderId);

export default {
  STANDARD_SHIPPING_FEE,
  formatOrderError,
  normalizeOrder,
  createOrder,
  getMyOrders,
  getUserOrders,
  getMyOrderById,
  getOrderById,
  cancelMyOrder,
  cancelOrder,
};
