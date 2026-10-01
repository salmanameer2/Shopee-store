import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FiCheckCircle,
  FiShoppingBag,
  FiTruck,
  FiShield,
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiUser,
  FiFileText,
  FiAlertCircle,
  FiLock,
  FiDollarSign,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { createOrder } from '../services/orderService.js';

const POPULAR_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Peshawar',
  'Multan',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
];

export default function Checkout() {
  const { user, profile } = useAuth();
  const { cartItems, cartSubtotal, cartCount, loading: cartLoading, refreshCart } = useCart();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Initialize form with user's profile information
  useEffect(() => {
    if (user || profile) {
      setFormData((prev) => ({
        ...prev,
        shippingName: prev.shippingName || profile?.fullName || user?.user_metadata?.full_name || '',
        shippingPhone: prev.shippingPhone || profile?.phone || '',
      }));
    }
  }, [user, profile]);

  // Phase 6 Agreed Rules: shipping_fee = 0, discount = 0, total = subtotal
  const subtotal = Number(cartSubtotal || 0);
  const shippingFee = 0;
  const discount = 0;
  const totalAmount = subtotal;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError(null);
  };

  const handleCitySelect = (cityName) => {
    setFormData((prev) => ({ ...prev, shippingCity: cityName }));
    if (formErrors.shippingCity) {
      setFormErrors((prev) => ({ ...prev, shippingCity: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.shippingName.trim()) {
      errors.shippingName = 'Recipient full name is required.';
    } else if (formData.shippingName.trim().length < 2) {
      errors.shippingName = 'Please enter a valid full name.';
    }

    if (!formData.shippingPhone.trim()) {
      errors.shippingPhone = 'Contact phone number is required.';
    } else if (formData.shippingPhone.trim().length < 8) {
      errors.shippingPhone = 'Please enter a valid phone number (min 8 digits).';
    }

    if (!formData.shippingAddress.trim()) {
      errors.shippingAddress = 'Street address is required.';
    } else if (formData.shippingAddress.trim().length < 5) {
      errors.shippingAddress = 'Please provide your full street / house address.';
    }

    if (!formData.shippingCity.trim()) {
      errors.shippingCity = 'Please specify your delivery city.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      const firstErrorKey = Object.keys(formErrors)[0];
      const element = document.getElementsByName(firstErrorKey)[0];
      if (element) element.focus();
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setServerError('Your cart is empty. Please add products before placing an order.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      // Calls atomic PostgreSQL RPC
      const result = await createOrder({
        shippingInfo: formData,
      });

      if (result.success && result.order) {
        // Refresh local cart context only after confirmed atomic RPC success
        await refreshCart();

        // Navigate to confirmation page
        navigate(`/order-success/${result.order.id}`, {
          state: { order: result.order },
          replace: true,
        });
      } else {
        // Keep cart intact on error, display friendly message
        setServerError(result.error || 'Failed to place order. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setServerError('An unexpected network error occurred. Please check your connection and retry.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartLoading && (!cartItems || cartItems.length === 0)) {
    return (
      <div className="py-20 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading checkout details..." />
      </div>
    );
  }

  if (!cartLoading && (!cartItems || cartItems.length === 0)) {
    return (
      <div className="py-16 sm:py-24">
        <Container>
          <div className="max-w-lg mx-auto text-center bg-white p-8 sm:p-12 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF5722] flex items-center justify-center mx-auto">
              <FiShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">Your Cart is Empty</h2>
            <p className="text-sm text-neutral-500">
              There are no items in your shopping cart to checkout. Please explore our store catalog and add items first.
            </p>
            <div className="pt-2">
              <Link to="/products">
                <Button variant="primary" size="lg" className="w-full shadow-lg shadow-[#FF5722]/20">
                  <FiShoppingBag className="w-4 h-4" /> Browse Catalog
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 bg-neutral-50/50 min-h-[85vh]">
      <Container>
        {/* Breadcrumb & Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-[#FF5722] transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" /> Return to Cart
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200 shadow-2xs">
            <FiLock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 256-Bit SSL Checkout</span>
          </div>
        </div>

        <ScrollReveal variant="fade-up">
          <SectionHeading
            title="Customer Checkout"
            subtitle="Complete your shipping information and confirm your Cash on Delivery order"
            align="left"
          />
        </ScrollReveal>

        {/* Server Error Alert */}
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-3 shadow-xs"
          >
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1 text-sm">
              <p className="font-bold">Checkout Notice</p>
              <p className="mt-0.5 leading-relaxed">{serverError}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Shipping Details & Payment Form */}
          <div className="lg:col-span-7 space-y-6">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-6">
              {/* Step 1: Shipping Information Card */}
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                  <div className="w-8 h-8 rounded-xl bg-[#FF5722] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Shipping Details</h3>
                    <p className="text-xs text-neutral-500">Where should we deliver your order?</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Recipient Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                        <FiUser className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="shippingName"
                        value={formData.shippingName}
                        onChange={handleInputChange}
                        placeholder="e.g. Muhammad Salman"
                        className={`w-full pl-10 pr-4 py-3 bg-neutral-50 hover:bg-white focus:bg-white border rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 transition-all outline-none ${
                          formErrors.shippingName
                            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-neutral-200 focus:border-[#FF5722] focus:ring-2 focus:ring-orange-100'
                        }`}
                      />
                    </div>
                    {formErrors.shippingName && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <FiAlertCircle className="w-3.5 h-3.5" /> {formErrors.shippingName}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Contact Phone Number (For Courier) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                        <FiPhone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        name="shippingPhone"
                        value={formData.shippingPhone}
                        onChange={handleInputChange}
                        placeholder="e.g. 0300 1234567"
                        className={`w-full pl-10 pr-4 py-3 bg-neutral-50 hover:bg-white focus:bg-white border rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 transition-all outline-none ${
                          formErrors.shippingPhone
                            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-neutral-200 focus:border-[#FF5722] focus:ring-2 focus:ring-orange-100'
                        }`}
                      />
                    </div>
                    {formErrors.shippingPhone && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <FiAlertCircle className="w-3.5 h-3.5" /> {formErrors.shippingPhone}
                      </p>
                    )}
                    <p className="text-[11px] text-neutral-400">
                      Rider will call this number before arrival to confirm drop-off.
                    </p>
                  </div>

                  {/* Street Address */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Complete Street Address / House / Apt <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute top-3.5 left-3.5 pointer-events-none text-neutral-400">
                        <FiMapPin className="w-4 h-4" />
                      </div>
                      <textarea
                        name="shippingAddress"
                        rows={2}
                        value={formData.shippingAddress}
                        onChange={handleInputChange}
                        placeholder="e.g. House # 14-B, Block 5, Gulshan-e-Iqbal, Near Main Market"
                        className={`w-full pl-10 pr-4 py-3 bg-neutral-50 hover:bg-white focus:bg-white border rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 transition-all outline-none resize-none ${
                          formErrors.shippingAddress
                            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-neutral-200 focus:border-[#FF5722] focus:ring-2 focus:ring-orange-100'
                        }`}
                      />
                    </div>
                    {formErrors.shippingAddress && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <FiAlertCircle className="w-3.5 h-3.5" /> {formErrors.shippingAddress}
                      </p>
                    )}
                  </div>

                  {/* Delivery City */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Destination City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="shippingCity"
                      value={formData.shippingCity}
                      onChange={handleInputChange}
                      placeholder="e.g. Karachi"
                      className={`w-full px-4 py-3 bg-neutral-50 hover:bg-white focus:bg-white border rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 transition-all outline-none ${
                        formErrors.shippingCity
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-neutral-200 focus:border-[#FF5722] focus:ring-2 focus:ring-orange-100'
                      }`}
                    />
                    {formErrors.shippingCity && (
                      <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                        <FiAlertCircle className="w-3.5 h-3.5" /> {formErrors.shippingCity}
                      </p>
                    )}

                    {/* Quick City Pills */}
                    <div className="pt-1">
                      <p className="text-[11px] font-semibold text-neutral-400 mb-1.5">Quick Select:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_CITIES.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => handleCitySelect(city)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              formData.shippingCity.toLowerCase() === city.toLowerCase()
                                ? 'bg-[#FF5722] text-white shadow-xs'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Order Notes */}
                  <div className="sm:col-span-2 space-y-1.5 pt-2">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Special Delivery Instructions (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute top-3.5 left-3.5 pointer-events-none text-neutral-400">
                        <FiFileText className="w-4 h-4" />
                      </div>
                      <textarea
                        name="notes"
                        rows={2}
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="e.g. Please leave package with guard if unavailable / call before delivery."
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-[#FF5722] focus:ring-2 focus:ring-orange-100 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 transition-all outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Payment Method Card */}
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                  <div className="w-8 h-8 rounded-xl bg-[#FF5722] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Payment Option</h3>
                    <p className="text-xs text-neutral-500">100% Risk-Free Cash on Delivery</p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl border-2 border-[#FF5722] bg-orange-50/40 relative flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5722] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <FiDollarSign className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base font-bold text-neutral-900 flex items-center gap-2">
                        Cash on Delivery (COD)
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">
                          Standard
                        </span>
                      </span>
                      <FiCheckCircle className="w-5 h-5 text-[#FF5722]" />
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Pay with physical cash directly to the courier agent when your package arrives at your door.
                      No online credit/debit card required.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-2.5">
                    <FiShield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs text-neutral-600 font-medium">Safe doorstep parcel inspection</span>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center gap-2.5">
                    <FiTruck className="w-4 h-4 text-[#FF5722] flex-shrink-0" />
                    <span className="text-xs text-neutral-600 font-medium">Fast nationwide courier dispatch</span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT: Order Summary & Review */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-7 shadow-xs space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <FiShoppingBag className="w-5 h-5 text-[#FF5722]" />
                  Order Summary
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-neutral-100 rounded-full text-neutral-700">
                  {cartCount} item{cartCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Items Scroll Area */}
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 bg-neutral-50/70 rounded-2xl border border-neutral-100"
                  >
                    <img
                      src={item.product?.image || item.product?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300'}
                      alt={item.product?.name || 'Product'}
                      className="w-14 h-14 object-cover rounded-xl bg-white border border-neutral-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 truncate">
                        {item.product?.name || 'Product'}
                      </h4>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        Qty: <span className="font-semibold text-neutral-700">{item.quantity}</span>
                        {item.selectedSize && <> • Size: {item.selectedSize}</>}
                        {item.selectedColor && <> • {item.selectedColor}</>}
                      </p>
                      <p className="text-xs font-bold text-[#FF5722] mt-1">
                        Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-3 pt-2 text-sm border-t border-neutral-100">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900">Rs. {subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Payment Method</span>
                  <span className="font-semibold text-neutral-900">Cash on Delivery</span>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-bold text-neutral-900">Total Payable</span>
                    <p className="text-[11px] text-neutral-400">Inclusive of all local taxes</p>
                  </div>
                  <span className="text-2xl font-black text-[#FF5722]">
                    Rs. {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order Placement CTA */}
              <div className="pt-2 space-y-3">
                <Button
                  type="submit"
                  form="checkout-form"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full py-4 text-base font-bold shadow-xl shadow-[#FF5722]/25 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" color="white" />
                      <span>Placing Order Atomically...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <FiCheckCircle className="w-5 h-5" />
                      <span>Confirm Order (Rs. {totalAmount.toLocaleString()})</span>
                    </div>
                  )}
                </Button>

                <p className="text-center text-[11px] text-neutral-400">
                  By clicking Place Order, your Cash on Delivery order is created atomically in Supabase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
