import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { normalizeOrder, formatOrderError } from './orderService.js';

export const ALLOWED_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'rejected',
];

/**
 * Strict server-and-client state machine transitions:
 * pending   -> confirmed, rejected, cancelled
 * confirmed -> completed, cancelled
 * completed -> terminal
 * rejected  -> terminal
 * cancelled -> terminal
 */
export const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: [],
};

/**
 * Checks whether transitioning from currentStatus to targetStatus is valid
 */
export const isValidStatusTransition = (currentStatus, targetStatus) => {
  const curr = (currentStatus || '').toLowerCase();
  const target = (targetStatus || '').toLowerCase();

  if (curr === target) return true; // Noop

  const allowed = ALLOWED_STATUS_TRANSITIONS[curr];
  if (!allowed || !Array.isArray(allowed)) return false;

  return allowed.includes(target);
};

export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    description: 'Order placed, awaiting admin verification',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    allowedTransitions: ['confirmed', 'rejected', 'cancelled'],
  },
  confirmed: {
    label: 'Confirmed',
    description: 'Order confirmed and ready for dispatch/delivery',
    color: 'sky',
    badgeClass: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    allowedTransitions: ['completed', 'cancelled'],
  },
  completed: {
    label: 'Completed',
    description: 'Order delivered and payment collected via Cash on Delivery',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    allowedTransitions: [], // Terminal status
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Order cancelled by customer or administrator',
    color: 'neutral',
    badgeClass: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
    allowedTransitions: [], // Terminal status
  },
  rejected: {
    label: 'Rejected',
    description: 'Order declined by admin (e.g. invalid contact, out of stock, unserviceable)',
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    allowedTransitions: [], // Terminal status
  },
};

/**
 * Normalizes an admin order row with joined customer profile and item snapshots
 */
export const normalizeAdminOrder = (orderRow, itemsRows = [], profileRow = null) => {
  const baseOrder = normalizeOrder(orderRow, itemsRows);
  if (!baseOrder) return null;

  return {
    ...baseOrder,
    customerProfile: profileRow
      ? {
          id: profileRow.id,
          fullName: profileRow.full_name || orderRow.shipping_name,
          email: profileRow.email || null,
          phone: profileRow.phone || orderRow.shipping_phone,
          avatarUrl: profileRow.avatar_url || null,
        }
      : null,
  };
};

/**
 * Fetches all orders with item count, customer profile, and real-time status summary.
 * Admin RLS grants complete access to public.orders and public.order_items.
 *
 * @param {Object} options
 * @param {string} [options.status='all'] - 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
 * @param {string} [options.searchTerm=''] - Search across order ID, customer name, phone, city, notes
 * @param {string} [options.sortBy='newest'] - 'newest' | 'oldest' | 'highest_total' | 'lowest_total'
 * @returns {Promise<{ success: boolean, data?: Array, stats?: Object, error?: string }>}
 */
export const getAdminOrders = async ({
  status = 'all',
  searchTerm = '',
  sortBy = 'newest',
} = {}) => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      data: [],
      stats: {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        rejected: 0,
        totalRevenue: 0,
      },
      error: 'Supabase database is not configured.',
    };
  }

  try {
    // 1. Fetch all orders with profiles joined
    let query = supabase
      .from('orders')
      .select('*, profiles:user_id(id, email, full_name, phone)');

    // Sort order
    if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sortBy === 'highest_total') {
      query = query.order('total', { ascending: false });
    } else if (sortBy === 'lowest_total') {
      query = query.order('total', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: rawOrders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching admin orders:', ordersError);
      return {
        success: false,
        data: [],
        error: formatOrderError(ordersError),
      };
    }

    const allOrders = rawOrders || [];

    // 2. Fetch all order items for these orders to compute item counts and previews
    const orderIds = allOrders.map((o) => o.id);
    let itemsByOrderId = new Map();

    if (orderIds.length > 0) {
      try {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('id, order_id, product_id, product_name, product_price, quantity, subtotal, selected_size, selected_color, products(id, name, image_url, category, brand)')
          .in('order_id', orderIds);

        if (!itemsError && itemsData) {
          itemsData.forEach((item) => {
            const list = itemsByOrderId.get(item.order_id) || [];
            list.push(item);
            itemsByOrderId.set(item.order_id, list);
          });
        }
      } catch (err) {
        console.warn('Could not fetch items for all orders:', err);
      }
    }

    // 3. Compute accurate real-time stats across ALL orders
    const stats = {
      total: allOrders.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0,
      totalRevenue: 0,
    };

    allOrders.forEach((ord) => {
      const s = ord.status;
      if (stats[s] !== undefined) {
        stats[s] += 1;
      }
      if (s === 'completed') {
        stats.totalRevenue += Number(ord.total || 0);
      }
    });

    // 4. Apply status filter
    let filteredOrders = allOrders;
    if (status && status !== 'all') {
      filteredOrders = filteredOrders.filter((ord) => ord.status === status);
    }

    // 5. Apply search term filter
    const cleanSearch = (searchTerm || '').trim().toLowerCase();
    if (cleanSearch) {
      filteredOrders = filteredOrders.filter((ord) => {
        const idMatch = (ord.id || '').toLowerCase().includes(cleanSearch);
        const nameMatch = (ord.shipping_name || '').toLowerCase().includes(cleanSearch);
        const phoneMatch = (ord.shipping_phone || '').toLowerCase().includes(cleanSearch);
        const cityMatch = (ord.shipping_city || '').toLowerCase().includes(cleanSearch);
        const notesMatch = (ord.notes || '').toLowerCase().includes(cleanSearch);
        const emailMatch = ord.profiles?.email?.toLowerCase().includes(cleanSearch);

        // Also check product names in order
        const items = itemsByOrderId.get(ord.id) || [];
        const itemMatch = items.some((item) =>
          (item.product_name || '').toLowerCase().includes(cleanSearch)
        );

        return idMatch || nameMatch || phoneMatch || cityMatch || notesMatch || emailMatch || itemMatch;
      });
    }

    // 6. Normalize results
    const normalizedData = filteredOrders.map((ord) => {
      const items = itemsByOrderId.get(ord.id) || [];
      return normalizeAdminOrder(ord, items, ord.profiles);
    });

    return {
      success: true,
      data: normalizedData,
      stats,
    };
  } catch (error) {
    console.error('Unexpected error in getAdminOrders:', error);
    return {
      success: false,
      data: [],
      error: formatOrderError(error),
    };
  }
};

/**
 * Fetches an individual order with complete item snapshots, joined product details,
 * and customer profile information.
 *
 * @param {string} orderId - Order UUID
 * @returns {Promise<{ success: boolean, order?: Object, error?: string }>}
 */
export const getAdminOrderById = async (orderId) => {
  if (!orderId) {
    return { success: false, error: 'Order ID is required.' };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase database is not configured.' };
  }

  try {
    // 1. Fetch order + customer profile
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, profiles:user_id(id, email, full_name, phone, avatar_url, role)')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      console.error('Error fetching order by ID:', orderError);
      return { success: false, error: formatOrderError(orderError) };
    }

    if (!orderData) {
      return { success: false, error: 'Order not found.' };
    }

    // 2. Fetch order items with live product link
    let itemsData = [];
    const { data: itemRows, error: itemsError } = await supabase
      .from('order_items')
      .select('*, products:product_id(id, name, image_url, category, brand, stock, is_active, price)')
      .eq('order_id', orderId);

    if (!itemsError && itemRows) {
      itemsData = itemRows;
    }

    const normalized = normalizeAdminOrder(orderData, itemsData, orderData.profiles);

    return {
      success: true,
      order: normalized,
    };
  } catch (error) {
    console.error('Unexpected error in getAdminOrderById:', error);
    return { success: false, error: formatOrderError(error) };
  }
};

/**
 * Updates an order status with strict state machine validation and server-side authorization.
 *
 * IMPORTANT STOCK SAFETY RULES (Phase 11 Correction):
 * - Status changes MUST NOT perform client-side stock deduction or restoration.
 * - Changing 'pending' -> 'confirmed' does NOT modify stock.
 * - Changing 'confirmed' -> 'completed' does NOT modify stock.
 * - Changing 'pending' -> 'rejected' does NOT modify stock.
 * - Changing to 'cancelled' does NOT perform client-side stock restoration.
 * - No browser-side inventory arithmetic (stock + quantity or stock - quantity).
 * - Customer delivery notes in `orders.notes` are preserved untouched.
 *
 * @param {string} orderId - Order UUID
 * @param {string} newStatus - 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
 * @returns {Promise<{ success: boolean, order?: Object, message?: string, error?: string }>}
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  if (!orderId) {
    return { success: false, error: 'Order ID is required.' };
  }

  const cleanStatus = (newStatus || '').toLowerCase();

  if (!ALLOWED_ORDER_STATUSES.includes(cleanStatus)) {
    return {
      success: false,
      error: `Invalid status "${cleanStatus}". Allowed: ${ALLOWED_ORDER_STATUSES.join(', ')}`,
    };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase database is not configured.' };
  }

  try {
    // 1. Fetch current order from database to check current status
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, notes')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchError || !currentOrder) {
      return { success: false, error: 'Order not found or inaccessible.' };
    }

    const previousStatus = currentOrder.status;

    if (previousStatus === cleanStatus) {
      return {
        success: true,
        message: `Order is already in "${cleanStatus}" status.`,
      };
    }

    // 2. Strict State Machine Validation
    if (!isValidStatusTransition(previousStatus, cleanStatus)) {
      return {
        success: false,
        error: `Invalid status transition: Cannot change order status from "${previousStatus}" to "${cleanStatus}".`,
      };
    }

    // 3. Execute server-side transactional RPC (enforces database-level state machine & admin authorization)
    const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_order_status', {
      p_order_id: orderId,
      p_new_status: cleanStatus,
    });

    if (rpcError) {
      console.error('Server-side RPC error updating order status:', rpcError);
      return { success: false, error: formatOrderError(rpcError) };
    }

    // 4. Fetch refreshed full order details
    const refreshRes = await getAdminOrderById(orderId);

    const statusLabels = {
      pending: 'marked as Pending',
      confirmed: 'confirmed for processing',
      completed: 'completed (delivered & paid)',
      cancelled: 'cancelled',
      rejected: 'rejected',
    };

    return {
      success: true,
      order: refreshRes.order || null,
      message: `Order #${orderId.slice(0, 8)} has been ${statusLabels[cleanStatus] || cleanStatus}.`,
    };
  } catch (error) {
    console.error('Unexpected error in updateOrderStatus:', error);
    return { success: false, error: formatOrderError(error) };
  }
};

/**
 * Convenient shortcut helpers for valid workflow transitions
 */
export const confirmAdminOrder = (orderId) =>
  updateOrderStatus(orderId, 'confirmed');

export const completeAdminOrder = (orderId) =>
  updateOrderStatus(orderId, 'completed');

export const rejectAdminOrder = (orderId) =>
  updateOrderStatus(orderId, 'rejected');

export const cancelAdminOrder = (orderId) =>
  updateOrderStatus(orderId, 'cancelled');

export default {
  ALLOWED_ORDER_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  ORDER_STATUS_CONFIG,
  isValidStatusTransition,
  normalizeAdminOrder,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  confirmAdminOrder,
  completeAdminOrder,
  rejectAdminOrder,
  cancelAdminOrder,
};
