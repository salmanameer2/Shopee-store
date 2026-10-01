import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FiCheckCircle,
  FiShoppingBag,
  FiPackage,
  FiTruck,
  FiMapPin,
  FiPhone,
  FiDollarSign,
  FiCalendar,
  FiArrowRight,
  FiCheck,
  FiClock,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrderById } from '../services/orderService.js';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If order wasn't passed via navigation state, fetch from Supabase
    if (!order && orderId) {
      const fetchOrder = async () => {
        setLoading(true);
        try {
          const res = await getOrderById(orderId, user?.id);
          if (res.success && res.order) {
            setOrder(res.order);
          } else {
            setError(res.error || 'Unable to retrieve order details.');
          }
        } catch (err) {
          console.error('Error fetching order:', err);
          setError('Failed to load order confirmation.');
        } finally {
          setLoading(false);
        }
      };

      fetchOrder();
    }
  }, [orderId, order, user]);

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center min-h-[65vh]">
        <LoadingSpinner size="lg" text="Loading your order confirmation..." />
      </div>
    );
  }

  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <div className="py-10 sm:py-16 bg-neutral-50/50 min-h-[85vh]">
      <Container>
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header Card */}
          <ScrollReveal variant="scale-up">
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-12 text-center shadow-xs space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm"
              >
                <FiCheckCircle className="w-10 h-10" />
              </motion.div>

              <div className="space-y-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
                  Order Confirmed
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                  Your order has been placed successfully.
                </h1>
                <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                  Thank you for shopping with Shopee. We have received your Cash on Delivery request and our team is preparing your package.
                </p>
              </div>

              {/* Order Reference Pill */}
              <div className="inline-flex flex-wrap items-center justify-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-700">
                <span className="text-neutral-400">Order Reference:</span>
                <code className="text-neutral-900 font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-neutral-200">
                  {order?.id || orderId}
                </code>
                <span className="text-neutral-300">•</span>
                <span className="flex items-center gap-1 text-neutral-500">
                  <FiCalendar className="w-3.5 h-3.5" /> {orderDate}
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* COD Instruction & Timeline */}
          <ScrollReveal variant="fade-up" delay={0.1}>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-3xl border border-orange-200/80 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5722] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                  <FiDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Cash on Delivery Instructions</h3>
                  <p className="text-xs text-neutral-600">Please prepare exact cash for the delivery rider upon arrival.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-neutral-700">
                <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-orange-100 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900">Order Verification</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Automated SMS / phone dispatch confirmation.</p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-orange-100 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900">Courier Dispatch</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Estimated delivery within 2-4 business days.</p>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-orange-100 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-neutral-900">Doorstep Handover</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Inspect parcel and pay Rs. {Number(order?.total || 0).toLocaleString()}.</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Detailed Order Summary */}
          {order && (
            <ScrollReveal variant="fade-up" delay={0.15}>
              <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
                <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2 pb-4 border-b border-neutral-100">
                  <FiPackage className="w-5 h-5 text-[#FF5722]" /> Order Details & Delivery Summary
                </h3>

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Recipient Name</p>
                    <p className="font-bold text-neutral-900">{order.shippingName}</p>
                    <p className="text-xs text-neutral-500 flex items-center gap-1.5 pt-1">
                      <FiPhone className="w-3.5 h-3.5 text-neutral-400" /> {order.shippingPhone}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Delivery Destination</p>
                    <p className="font-medium text-neutral-900 leading-snug">{order.shippingAddress}</p>
                    <p className="text-xs font-bold text-[#FF5722] flex items-center gap-1 pt-0.5">
                      <FiMapPin className="w-3.5 h-3.5" /> {order.shippingCity}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ordered Items</h4>
                    <div className="space-y-2.5">
                      {order.items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between p-3 bg-neutral-50/70 rounded-2xl border border-neutral-100 text-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.product?.image && (
                              <img
                                src={item.product.image}
                                alt={item.productName}
                                className="w-12 h-12 rounded-xl object-cover border border-neutral-200 bg-white flex-shrink-0"
                              />
                            )}
                            <div className="truncate">
                              <p className="font-bold text-neutral-900 truncate">{item.productName}</p>
                              <p className="text-xs text-neutral-500">
                                Qty: <span className="font-semibold text-neutral-800">{item.quantity}</span>
                                {item.selectedSize && <> • Size: {item.selectedSize}</>}
                                {item.selectedColor && <> • Color: {item.selectedColor}</>}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 ml-4">
                            <span className="font-bold text-neutral-900">
                              Rs. {Number(item.subtotal || item.productPrice * item.quantity).toLocaleString()}
                            </span>
                            <p className="text-[11px] text-neutral-400">
                              Rs. {item.productPrice.toLocaleString()} each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost Breakdown */}
                <div className="pt-4 border-t border-neutral-100 space-y-2.5 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-neutral-900">Rs. {Number(order.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping Fee</span>
                    <span className="font-semibold text-neutral-900">
                      {order.shippingFee === 0 ? 'FREE' : `Rs. ${Number(order.shippingFee).toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Payment Method</span>
                    <span className="font-semibold text-neutral-900 capitalize">Cash on Delivery</span>
                  </div>
                  <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                    <span className="text-base font-bold text-neutral-900">Amount Due on Delivery</span>
                    <span className="text-2xl font-black text-[#FF5722]">
                      Rs. {Number(order.total).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Action Buttons */}
          <ScrollReveal variant="fade-up" delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to="/orders" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-lg shadow-[#FF5722]/20">
                  <FiPackage className="w-4 h-4" /> View My Orders
                </Button>
              </Link>
              <Link to="/products" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <FiShoppingBag className="w-4 h-4" /> Continue Shopping
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </div>
  );
}
