import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { normalizeProduct } from './productService.js';

/**
 * Friendly error message formatter for Cart operations
 */
export const formatCartError = (error) => {
  if (!error) return 'An unexpected cart error occurred. Please try again.';
  const msg = typeof error === 'string' ? error : error.message || '';
  const lower = msg.toLowerCase();

  if (lower.includes('violates row-level security') || lower.includes('policy')) {
    return 'Please sign in with a valid account to manage your shopping cart.';
  }
  if (lower.includes('unique') || lower.includes('duplicate')) {
    return 'This item is already in your cart.';
  }
  if (lower.includes('stock') || lower.includes('quantity')) {
    return 'This item is no longer available in the requested quantity.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  return msg || 'Unable to update your cart. Please try again.';
};

/**
 * Normalizes a cart item row combined with its product data
 */
export const normalizeCartItem = (row, productMap = {}) => {
  if (!row) return null;

  // Extract joined product or lookup from productMap
  const rawProduct = row.products || row.product || productMap[row.product_id] || null;
  const product = rawProduct ? normalizeProduct(rawProduct) : null;

  const quantity = Math.max(1, Number(row.quantity || 1));
  const unitPrice = Number(product?.price || 0);
  const itemTotal = quantity * unitPrice;
  const maxStock = Number(product?.stock !== undefined ? product.stock : 999);
  const isAvailable = Boolean(product && product.isActive && maxStock > 0);
  const isOutOfStock = Boolean(!product || maxStock === 0);
  const isOverStock = Boolean(product && quantity > maxStock);

  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    selectedSize: row.selected_size || null,
    selectedColor: row.selected_color || null,
    quantity,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    product,
    unitPrice,
    itemTotal,
    maxStock,
    isAvailable,
    isOutOfStock,
    isOverStock,
  };
};

/**
 * Fetches all cart items for the authenticated user from Supabase
 * Joined with live products table
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{ success: boolean, items: Array, error?: string }>}
 */
export const getCartItems = async (userId) => {
  if (!userId) {
    return { success: true, items: [] };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      items: [],
      error: 'Supabase database is not configured.',
    };
  }

  try {
    // Attempt joined query first
    const { data: cartData, error: cartError } = await supabase
      .from('cart_items')
      .select('id, user_id, product_id, selected_size, selected_color, quantity, created_at, updated_at, products(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (cartError) {
      // Fallback: If relation query fails, query cart_items and products separately
      console.warn('Joined cart query failed, falling back to 2-step query:', cartError.message);

      const { data: rawCart, error: rawError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (rawError) {
        return {
          success: false,
          items: [],
          error: formatCartError(rawError),
        };
      }

      if (!rawCart || rawCart.length === 0) {
        return { success: true, items: [] };
      }

      const productIds = rawCart.map((i) => i.product_id).filter(Boolean);
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      const productMap = {};
      (productsData || []).forEach((p) => {
        productMap[p.id] = p;
      });

      const normalized = rawCart.map((row) => normalizeCartItem(row, productMap));
      return { success: true, items: normalized };
    }

    const normalized = (cartData || []).map((row) => normalizeCartItem(row));
    return { success: true, items: normalized };
  } catch (err) {
    console.error('Error fetching cart items:', err);
    return {
      success: false,
      items: [],
      error: formatCartError(err),
    };
  }
};

/**
 * Adds an item to the user's cart in Supabase
 * Handles existing items by updating quantity up to available stock.
 * @param {Object} params
 * @param {string} params.userId - Authenticated user UUID
 * @param {string} params.productId - Product UUID
 * @param {string} [params.selectedSize] - Chosen size
 * @param {string} [params.selectedColor] - Chosen color
 * @param {number} [params.quantity=1] - Quantity to add
 * @param {number} [params.currentStock=999] - Maximum available product stock
 * @returns {Promise<{ success: boolean, item?: Object, message?: string, error?: string }>}
 */
export const addCartItem = async ({
  userId,
  productId,
  selectedSize = null,
  selectedColor = null,
  quantity = 1,
  currentStock = 999,
}) => {
  if (!userId) {
    return {
      success: false,
      requireLogin: true,
      error: 'Please sign in to add items to your cart.',
    };
  }

  if (!productId) {
    return {
      success: false,
      error: 'Invalid product selected.',
    };
  }

  if (currentStock <= 0) {
    return {
      success: false,
      error: 'This product is currently out of stock.',
    };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Database connection is not configured.',
    };
  }

  try {
    // 1. Check if product is already in user's cart (enforcing unique user_id, product_id)
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('id, quantity, selected_size, selected_color')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.warn('Error checking existing cart item:', checkError.message);
    }

    if (existingItem) {
      // Product exists: calculate incremented quantity bounded by stock
      const requestedQty = Number(existingItem.quantity || 0) + Number(quantity || 1);
      const finalQuantity = Math.max(1, Math.min(requestedQty, currentStock));

      if (existingItem.quantity >= currentStock) {
        return {
          success: false,
          error: `You already have the maximum available quantity (${currentStock}) in your cart.`,
        };
      }

      const { data: updatedData, error: updateError } = await supabase
        .from('cart_items')
        .update({
          quantity: finalQuantity,
          selected_size: selectedSize || existingItem.selected_size || null,
          selected_color: selectedColor || existingItem.selected_color || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingItem.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          error: formatCartError(updateError),
        };
      }

      return {
        success: true,
        item: updatedData,
        message: 'Cart item quantity updated.',
      };
    }

    // Product does not exist yet: insert new cart row
    const finalQuantity = Math.max(1, Math.min(Number(quantity || 1), currentStock));

    const { data: insertedData, error: insertError } = await supabase
      .from('cart_items')
      .insert({
        user_id: userId,
        product_id: productId,
        selected_size: selectedSize || null,
        selected_color: selectedColor || null,
        quantity: finalQuantity,
      })
      .select()
      .single();

    if (insertError) {
      return {
        success: false,
        error: formatCartError(insertError),
      };
    }

    return {
      success: true,
      item: insertedData,
      message: 'Item added to your cart.',
    };
  } catch (err) {
    console.error('Add to cart exception:', err);
    return {
      success: false,
      error: formatCartError(err),
    };
  }
};

/**
 * Updates quantity of a specific cart item
 * If quantity <= 0, automatically removes the item.
 * @param {Object} params
 * @param {string} params.cartItemId - Cart Item UUID
 * @param {string} params.userId - Authenticated user UUID
 * @param {number} params.quantity - Target quantity
 * @param {number} [params.maxStock=999] - Product maximum stock limit
 */
export const updateCartItemQuantity = async ({
  cartItemId,
  userId,
  quantity,
  maxStock = 999,
}) => {
  if (!userId || !cartItemId) {
    return {
      success: false,
      error: 'Invalid cart update request.',
    };
  }

  // If quantity reaches 0 or below, remove item
  if (quantity <= 0) {
    return removeCartItem({ cartItemId, userId });
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Database connection is not configured.',
    };
  }

  const boundedQuantity = Math.max(1, Math.min(quantity, maxStock));

  try {
    const { data, error } = await supabase
      .from('cart_items')
      .update({
        quantity: boundedQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartItemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: formatCartError(error),
      };
    }

    return {
      success: true,
      item: data,
    };
  } catch (err) {
    console.error('Update cart item exception:', err);
    return {
      success: false,
      error: formatCartError(err),
    };
  }
};

/**
 * Removes a specific cart item from Supabase
 * @param {Object} params
 * @param {string} params.cartItemId - Cart Item UUID
 * @param {string} params.userId - Authenticated user UUID
 */
export const removeCartItem = async ({ cartItemId, userId }) => {
  if (!userId || !cartItemId) {
    return {
      success: false,
      error: 'Invalid cart item removal request.',
    };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Database connection is not configured.',
    };
  }

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', userId);

    if (error) {
      return {
        success: false,
        error: formatCartError(error),
      };
    }

    return {
      success: true,
      cartItemId,
    };
  } catch (err) {
    console.error('Remove cart item exception:', err);
    return {
      success: false,
      error: formatCartError(err),
    };
  }
};

/**
 * Clears all cart items for the authenticated user
 * @param {string} userId - Authenticated user UUID
 */
export const clearCart = async (userId) => {
  if (!userId) {
    return { success: true };
  }

  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Database connection is not configured.',
    };
  }

  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      return {
        success: false,
        error: formatCartError(error),
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Clear cart exception:', err);
    return {
      success: false,
      error: formatCartError(err),
    };
  }
};

export default {
  formatCartError,
  normalizeCartItem,
  getCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
