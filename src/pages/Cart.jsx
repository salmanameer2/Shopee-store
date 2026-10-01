import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FiShoppingBag,
  FiTrash2,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiTruck,
  FiRotateCcw,
  FiCheck,
  FiAlertCircle,
  FiUser,
  FiRefreshCw,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/index.js';

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const {
    cartItems,
    cartCount,
    cartSubtotal,
    loading,
    actionLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
    toastMessage,
    showToast,
  } = useCart();

  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Financial calculations for Phase 6 (shipping_fee = 0, discount = 0, total = subtotal)
  const shipping = 0;
  const grandTotal = Number(cartSubtotal || 0);

  const handleProceedToCheckout = () => {
    // Check if any items are out of stock
    const hasOutOfStock = cartItems.some((item) => item.isOutOfStock || !item.isAvailable);
    if (hasOutOfStock) {
      showToast('Please remove out of stock items before proceeding.');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    navigate('/checkout');
  };

  // Loading state during initial cart load
  if (loading) {
    return (
      <div className="py-24 min-h-[70vh] flex items-center justify-center">
        <Container>
          <LoadingSpinner fullPage={false} size="lg" message="Loading your shopping cart from Supabase..." />
        </Container>
      </div>
    );
  }

  // Logged-out State
  if (!isAuthenticated) {
    return (
      <div className="py-12 sm:py-16 min-h-[75vh] flex items-center">
        <Container>
          <ScrollReveal variant="fade-up">
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-14 text-center max-w-xl mx-auto shadow-sm space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF5722] flex items-center justify-center mx-auto border border-orange-100">
                <FiUser className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
                  Sign In to Access Your Cart
                </h2>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Your shopping cart is persistently synced to your Supabase account. Sign in to view saved items or continue shopping.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full justify-center shadow-lg shadow-[#FF5722]/20">
                    Sign In to Account <FiArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/products" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full justify-center">
                    Browse Storefront
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 space-y-8 min-h-[75vh]">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 sm:right-10 z-50 bg-neutral-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm border border-white/10"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Container>
        {/* Header with Cart Count and Clear Action */}
        <ScrollReveal variant="fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
            <div>
              <span className="text-xs font-bold text-[#FF5722] tracking-wider uppercase">
                Supabase Persistent Cart
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                Shopping Cart
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Review your items and proceed to secure checkout
              </p>
            </div>

            {cartItems.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3.5 py-1.5 rounded-full">
                  <strong className="text-neutral-900 tabular-nums">{cartCount}</strong> {cartCount === 1 ? 'Item' : 'Items'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={actionLoading === 'clear'}
                  className="text-xs font-semibold text-neutral-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FiTrash2 className="w-3.5 h-3.5" /> Clear Cart
                </button>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Clear Confirmation Dialog Modal */}
        <AnimatePresence>
          {showClearConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-neutral-200 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <FiTrash2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Clear entire shopping cart?
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  All items in your cart will be removed from your Supabase account.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 bg-rose-600 hover:bg-rose-700"
                    onClick={async () => {
                      setShowClearConfirm(false);
                      await clearCart();
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Cart Contents or Empty State */}
        {cartItems.length === 0 ? (
          <ScrollReveal variant="scale-up" delay={0.1}>
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-sm space-y-4 mt-6">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF5722] flex items-center justify-center mx-auto border border-orange-100">
                <FiShoppingBag className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-neutral-900">
                Your shopping cart is empty
              </h3>

              <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                Explore our catalog across Men, Women, Kids, and Electronic Gadgets to find what you love!
              </p>

              <div className="pt-4 flex items-center justify-center gap-4">
                <Link to="/products">
                  <Button variant="primary" size="lg" className="shadow-lg shadow-[#FF5722]/20">
                    <FiShoppingBag className="w-4 h-4" /> Start Shopping Now
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              <ScrollReveal variant="fade-up" delay={0.05}>
                <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm divide-y divide-neutral-100">
                  {cartItems.map((item) => {
                    const product = item.product;
                    const isItemBusy = actionLoading === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                          item.isOutOfStock ? 'bg-rose-50/40' : 'hover:bg-neutral-50/50'
                        }`}
                      >
                        {/* Left: Product Media & Meta */}
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <Link
                            to={product ? `/product/${product.id}` : '#'}
                            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-neutral-100 overflow-hidden shrink-0 border border-neutral-200 group block"
                          >
                            <img
                              src={product?.image || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=200'}
                              alt={product?.name || 'Product'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {item.isOutOfStock && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-bold text-white uppercase text-center px-1">
                                Out of Stock
                              </div>
                            )}
                          </Link>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-[#FF5722] uppercase tracking-wider">
                                {product?.category || 'Shopee'}
                              </span>
                              <span className="text-neutral-300">&bull;</span>
                              <span className="text-[11px] text-neutral-400 font-medium">
                                {product?.brand || 'Shopee'}
                              </span>
                            </div>

                            <Link
                              to={product ? `/product/${product.id}` : '#'}
                              className="block text-sm sm:text-base font-bold text-neutral-900 hover:text-[#FF5722] transition-colors truncate"
                              title={product?.name || 'Product'}
                            >
                              {product?.name || 'Curated Catalog Item'}
                            </Link>

                            {/* Selected Variants */}
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              {item.selectedSize && (
                                <span className="inline-flex items-center text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                              {item.selectedColor && (
                                <span className="inline-flex items-center text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                                  Color: {item.selectedColor}
                                </span>
                              )}
                            </div>

                            {/* Stock warning notifications */}
                            {item.isOutOfStock ? (
                              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                                <FiAlertCircle className="w-3 h-3" /> Item currently out of stock
                              </p>
                            ) : item.isOverStock ? (
                              <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                                <FiAlertCircle className="w-3 h-3" /> Only {item.maxStock} items available in stock
                              </p>
                            ) : null}

                            {/* Unit Price on Mobile */}
                            <div className="sm:hidden text-xs font-semibold text-neutral-500 pt-1">
                              Unit: {formatPrice(item.unitPrice)}
                            </div>
                          </div>
                        </div>

                        {/* Right: Quantity Counter, Price & Delete */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-neutral-300 rounded-xl bg-neutral-50 p-1">
                            <button
                              type="button"
                              disabled={isItemBusy}
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.maxStock)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-neutral-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-xs text-neutral-900 tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isItemBusy || (product && item.quantity >= item.maxStock)}
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.maxStock)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-neutral-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          {/* Line Total */}
                          <div className="text-right min-w-[90px]">
                            <span className="text-sm sm:text-base font-black text-neutral-900 block tabular-nums">
                              {formatPrice(item.itemTotal)}
                            </span>
                            <span className="text-[10px] text-neutral-400 hidden sm:block">
                              {item.quantity} &times; {formatPrice(item.unitPrice)}
                            </span>
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            disabled={isItemBusy}
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            aria-label="Remove item from cart"
                            title="Remove item"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollReveal>

              {/* Continue Shopping Link */}
              <div className="flex items-center justify-between pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 hover:text-[#FF5722] transition-colors"
                >
                  <FiArrowLeft className="w-4 h-4" /> Continue Shopping
                </Link>
                <span className="text-xs text-neutral-400">
                  Cart synced securely to Supabase
                </span>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <ScrollReveal variant="fade-left" delay={0.1}>
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-5 sticky top-28">
                  <h3 className="text-lg font-bold text-neutral-900 pb-3 border-b border-neutral-100">
                    Order Summary
                  </h3>

                  {/* Pricing Breakdown (Phase 6: shipping = 0, discount = 0, total = subtotal) */}
                  <div className="space-y-3 pt-1 text-xs text-neutral-600">
                    <div className="flex items-center justify-between">
                      <span>Cart Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
                      <span className="font-bold text-neutral-900 tabular-nums">
                        {formatPrice(cartSubtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Delivery Fee</span>
                      <span className="font-bold text-emerald-600">FREE</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Payment Method</span>
                      <span className="font-semibold text-neutral-900">Cash on Delivery</span>
                    </div>
                  </div>

                  {/* Grand Total */}
                  <div className="pt-4 border-t border-neutral-200 flex items-baseline justify-between">
                    <div>
                      <span className="text-sm font-bold text-neutral-900 block">Total Amount</span>
                      <span className="text-[11px] text-neutral-400">All local taxes included</span>
                    </div>
                    <span className="text-2xl font-black text-neutral-900 tabular-nums">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>

                  {/* Checkout CTA */}
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleProceedToCheckout}
                    className="w-full py-3.5 shadow-lg shadow-[#FF5722]/20 justify-center hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Proceed to Checkout <FiArrowRight className="w-4 h-4" />
                  </Button>

                  {/* Trust guarantees */}
                  <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-[11px] text-neutral-500">
                    <div className="flex items-center gap-2">
                      <FiShield className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>100% Authentic Products from Supabase Catalog</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiRotateCcw className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>7-Day Doorstep Replacement Policy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiTruck className="w-4 h-4 text-[#FF5722] shrink-0" />
                      <span>Free Delivery on Orders Over Rs. 2,000</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
