import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FiArrowLeft,
  FiPackage,
  FiTruck,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiUser,
  FiFileText,
  FiRefreshCw,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyOrderById, cancelMyOrder } from '../services/orderService.js';

export default function OrderDetails() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchOrder = async () => {
    if (!orderId || !user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyOrderById(user.id, orderId);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError(res.error || 'Order not found or you do not have permission to view it.');
      }
    } catch (err) {
      console.error('Error in fetchOrder:', err);
      setError('Unable to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId, user?.id]);

  const handleConfirmCancel = async () => {
    if (!order?.id || cancelling) return;
    setCancelling(true);
    setActionFeedback(null);
    try {
      const res = await cancelMyOrder(user.id, order.id);
      if (res.success) {
        setShowCancelModal(false);
        setActionFeedback({
          type: 'success',
          message: res.message || 'Your order has been cancelled successfully.',
        });
        if (res.order) {
          setOrder(res.order);
        } else {
          await fetchOrder();
        }
      } else {
        setActionFeedback({
          type: 'error',
          message: res.error || 'Failed to cancel order.',
        });
      }
    } catch (err) {
      console.error('Cancellation exception:', err);
      setActionFeedback({
        type: 'error',
        message: 'A network error occurred while cancelling the order.',
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            <FiCheckCircle className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            <FiCheckCircle className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
            <FiXCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-200 text-neutral-700">
            <FiXCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <FiClock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center items-center min-h-[65vh]">
        <LoadingSpinner size="lg" text="Loading order details from Supabase..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-16 sm:py-24 bg-neutral-50/40 min-h-[75vh]">
        <Container>
          <div className="max-w-md mx-auto text-center bg-white p-8 sm:p-12 rounded-3xl border border-neutral-200 shadow-xs space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <FiAlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">Order Not Found or Unauthorized</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {error || 'This order does not exist or you do not have permission to view it.'}
            </p>
            <div className="pt-2">
              <Link to="/orders">
                <Button variant="primary" size="md" className="w-full justify-center">
                  <FiArrowLeft className="w-4 h-4" /> Back to My Orders
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recent Order';

  const isEligibleForCancel = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="py-8 sm:py-12 bg-neutral-50/40 min-h-[85vh]">
      <Container>
        {/* Navigation & Actions Top Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-[#FF5722] transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Orders List
          </Link>

          <div className="flex items-center gap-3">
            {isEligibleForCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
              >
                Cancel Order
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchOrder}
              disabled={loading}
              className="gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 bg-white"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        <AnimatePresence>
          {actionFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm shadow-xs border ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {actionFeedback.type === 'success' ? (
                <FiCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <FiAlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <span className="font-semibold">{actionFeedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Confirmation Modal */}
        <AnimatePresence>
          {showCancelModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-neutral-200 text-center space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                  <FiXCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Cancel this order?
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Are you sure you want to cancel Order <code className="font-mono text-neutral-800 font-bold">{order.id.slice(0, 8)}...</code>? This operation cannot be undone.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowCancelModal(false)}
                    disabled={cancelling}
                  >
                    Keep Order
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 bg-rose-600 hover:bg-rose-700"
                    onClick={handleConfirmCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Order Master Card */}
        <div className="space-y-8">
          <ScrollReveal variant="fade-up">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-400">Order Reference:</span>
                    <code className="text-sm font-mono font-bold text-neutral-900 bg-neutral-100 px-2.5 py-0.5 rounded-lg border border-neutral-200">
                      {order.id}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 pt-1">
                    <FiCalendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Placed on {formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Delivery Details & Payment Method Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Shipping info */}
                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2.5">
                  <h4 className="font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiMapPin className="text-[#FF5722]" /> Shipping Address
                  </h4>
                  <div className="space-y-1 pt-1 text-neutral-700">
                    <p className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
                      <FiUser className="w-3.5 h-3.5 text-neutral-400" /> {order.shippingName}
                    </p>
                    <p className="leading-relaxed">{order.shippingAddress}</p>
                    <p className="font-semibold text-neutral-900">{order.shippingCity}</p>
                    <p className="flex items-center gap-1.5 text-neutral-600 pt-1">
                      <FiPhone className="w-3.5 h-3.5 text-neutral-400" /> {order.shippingPhone}
                    </p>
                    {order.notes && (
                      <p className="text-neutral-500 italic pt-2 border-t border-neutral-200 mt-2 flex items-start gap-1">
                        <FiFileText className="w-3.5 h-3.5 text-neutral-400 mt-0.5 flex-shrink-0" />
                        <span>Instructions: "{order.notes}"</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2.5">
                  <h4 className="font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FiDollarSign className="text-[#FF5722]" /> Payment Summary
                  </h4>
                  <div className="space-y-2 pt-1 text-neutral-600">
                    <div className="flex justify-between">
                      <span>Payment Option</span>
                      <span className="font-bold text-neutral-900 capitalize">Cash on Delivery</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-semibold text-neutral-900">Rs. {Number(order.subtotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="font-semibold text-neutral-900">
                        {order.shippingFee === 0 ? 'FREE' : `Rs. ${Number(order.shippingFee).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span className="font-semibold text-neutral-900">Rs. {Number(order.discount).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline font-bold text-neutral-900">
                      <span className="text-sm">Total Due (COD)</span>
                      <span className="text-lg text-[#FF5722]">Rs. {Number(order.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Itemized Snapshot Table */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiPackage className="text-[#FF5722]" /> Ordered Items ({order.itemsCount || order.items?.length || 0})
                </h4>

                <div className="space-y-3">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between p-3.5 sm:p-4 bg-neutral-50/80 rounded-2xl border border-neutral-100 text-xs sm:text-sm gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={item.product?.imageUrl || item.product?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200'}
                            alt={item.productName}
                            className="w-14 h-14 object-cover rounded-xl border border-neutral-200 bg-white flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-neutral-900 truncate">{item.productName}</h5>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Quantity: <strong className="text-neutral-900">{item.quantity}</strong>
                              {item.selectedSize && <> • Size: {item.selectedSize}</>}
                              {item.selectedColor && <> • Color: {item.selectedColor}</>}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                              Historical Snapshot Price: Rs. {item.productPrice.toLocaleString()} each
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="font-bold text-sm text-neutral-900">
                            Rs. {Number(item.subtotal || item.productPrice * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-500 italic p-4 bg-neutral-50 rounded-2xl">
                      Item breakdown details are loaded directly from the database snapshot.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </div>
  );
}
