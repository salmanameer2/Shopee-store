import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.jsx';
import {
  getCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart as clearCartService,
  formatCartError,
} from '../services/cartService.js';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export function CartProvider({ children }) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // 'add', 'clear', or cartItemId
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? '' : current));
    }, duration);
  }, []);

  // Fetch cart items from Supabase for current authenticated user
  const refreshCart = useCallback(async () => {
    if (!user?.id) {
      setCartItems([]);
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      const res = await getCartItems(user.id);
      if (res.success) {
        setCartItems(res.items || []);
        return res.items || [];
      } else {
        console.warn('Failed to fetch cart items:', res.error);
        return [];
      }
    } catch (err) {
      console.error('Cart fetch error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Synchronize cart with authentication lifecycle
  useEffect(() => {
    let isMounted = true;

    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user?.id) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const loadUserCart = async () => {
      setLoading(true);
      try {
        const res = await getCartItems(user.id);
        if (isMounted) {
          if (res.success) {
            setCartItems(res.items || []);
          } else {
            setCartItems([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading cart for user:', err);
          setCartItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUserCart();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isAuthenticated, authLoading]);

  /**
   * Adds product to authenticated user's cart in Supabase
   * @param {Object} product - Product data object
   * @param {Object} [options={}] - { size, color, quantity = 1 }
   * @returns {Promise<{ success: boolean, requireLogin?: boolean, message?: string, error?: string }>}
   */
  const addToCart = async (product, options = {}) => {
    if (!isAuthenticated || !user?.id) {
      showToast('Please sign in to save items to your cart.');
      return {
        success: false,
        requireLogin: true,
        message: 'Please sign in to add items to your cart.',
      };
    }

    if (!product || !product.id) {
      showToast('Invalid product selected.');
      return { success: false, error: 'Invalid product.' };
    }

    const stock = Number(product.stock !== undefined ? product.stock : 999);
    if (stock <= 0) {
      showToast('This product is currently out of stock.');
      return { success: false, error: 'Product out of stock.' };
    }

    const qty = Math.max(1, Number(options.quantity || 1));
    const size = options.size || (product.sizes?.length ? product.sizes[0] : null);
    const color = options.color || (product.colors?.length ? product.colors[0] : null);

    try {
      setActionLoading('add');
      const res = await addCartItem({
        userId: user.id,
        productId: product.id,
        selectedSize: size,
        selectedColor: color,
        quantity: qty,
        currentStock: stock,
      });

      if (!res.success) {
        showToast(res.error || 'Could not add item to cart.');
        return { success: false, error: res.error };
      }

      await refreshCart();
      const successMsg = `Added "${product.name}" to cart!`;
      showToast(successMsg);
      return { success: true, message: successMsg };
    } catch (err) {
      const errFormatted = formatCartError(err);
      showToast(errFormatted);
      return { success: false, error: errFormatted };
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Updates quantity of a cart item
   * @param {string} cartItemId
   * @param {number} newQuantity
   * @param {number} [maxStock=999]
   */
  const updateQuantity = async (cartItemId, newQuantity, maxStock = 999) => {
    if (!isAuthenticated || !user?.id || !cartItemId) return;

    if (newQuantity <= 0) {
      return removeFromCart(cartItemId);
    }

    if (newQuantity > maxStock) {
      showToast(`Only ${maxStock} items available in stock.`);
      return;
    }

    try {
      setActionLoading(cartItemId);
      const res = await updateCartItemQuantity({
        cartItemId,
        userId: user.id,
        quantity: newQuantity,
        maxStock,
      });

      if (!res.success) {
        showToast(res.error || 'Failed to update quantity.');
        return;
      }

      await refreshCart();
    } catch (err) {
      showToast(formatCartError(err));
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Removes a specific cart item
   * @param {string} cartItemId
   */
  const removeFromCart = async (cartItemId) => {
    if (!isAuthenticated || !user?.id || !cartItemId) return;

    try {
      setActionLoading(cartItemId);
      const res = await removeCartItem({
        cartItemId,
        userId: user.id,
      });

      if (!res.success) {
        showToast(res.error || 'Could not remove item.');
        return;
      }

      await refreshCart();
      showToast('Item removed from cart.');
    } catch (err) {
      showToast(formatCartError(err));
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Clears all items in the user's cart
   */
  const clearCart = async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      setActionLoading('clear');
      const res = await clearCartService(user.id);
      if (!res.success) {
        showToast(res.error || 'Could not clear cart.');
        return;
      }

      setCartItems([]);
      showToast('Shopping cart cleared.');
    } catch (err) {
      showToast(formatCartError(err));
    } finally {
      setActionLoading(null);
    }
  };

  // Derived calculations
  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cartItems]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = Number(item.product?.price || item.unitPrice || 0);
      const qty = Number(item.quantity || 0);
      return sum + price * qty;
    }, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    cartCount,
    cartSubtotal,
    loading,
    actionLoading,
    toastMessage,
    showToast,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    isAuthenticated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartContext;
