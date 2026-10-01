import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FiPackage,
  FiShoppingBag,
  FiTruck,
  FiCalendar,
  FiMapPin,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiAlertCircle,
  FiRefreshCw,
  FiExternalLink,
  FiEye,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import SectionHeading from '../components/common/SectionHeading.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getMyOrders, cancelMyOrder } from '../services/orderService.js';

export default function Orders() {
  const { profile, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null); // stores order object to cancel

  const customerName = profile?.fullName || user?.user_metadata?.full_name || 'Valued Customer';

  const fetchOrders = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMyOrders(user.id);
      if (res.success) {
        setOrders(res.orders || []);
      } else {
        setError(res.error || 'Unable to fetch your order history.');
      }
    } catch (err) {
      console.error('Error in fetchOrders:', err);
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const handleCancelOrder = async () => {
    if (!showCancelModal || cancellingId) return;
    const orderToCancel = showCancelModal;
    setCancellingId(orderToCancel.id);
    setCancelError(null);

    try {
      const res = await cancelMyOrder(user.id, orderToCancel.id);
      if (res.success) {
        setShowCancelModal(null);
        setCancelError(null);
        await fetchOrders();
      } else {
        setCancelError(res.error || 'Failed to cancel order.');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
      setCancelError('Network error while cancelling order.');
    } finally {
      setCancellingId(null);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'pending';
    if (activeTab === 'confirmed') return order.status === 'confirmed';
    if (activeTab === 'delivered' || activeTab === 'completed') return order.status === 'completed';
    if (activeTab === 'cancelled') return order.status === 'cancelled' || order.status === 'rejected';
    return true;
  });

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

  return (
    <div className="py-8 sm:py-12 bg-neutral-50/40 min-h-[80vh]">
      <Container>
        {/* Header and Refresh Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <ScrollReveal variant="fade-up">
            <SectionHeading
              title="My Order History"
              subtitle={`Hello ${customerName}, review your past purchases and track current deliveries`}
              align="left"
            />
          </ScrollReveal>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="self-start sm:self-auto gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-200 bg-white"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Orders
          </Button>
        </div>

        {/* Filter tabs */}
        <ScrollReveal variant="fade-up" delay={0.05}>
          <div className="flex items-center gap-2 p-1.5 bg-neutral-100 rounded-2xl w-fit mb-6 overflow-x-auto max-w-full">
            {[
              { key: 'all', label: 'All Orders', count: orders.length },
              { key: 'pending', label: 'Pending', count: orders.filter((o) => o.status === 'pending').length },
              { key: 'confirmed', label: 'Confirmed', count: orders.filter((o) => o.status === 'confirmed').length },
              { key: 'delivered', label: 'Delivered', count: orders.filter((o) => o.status === 'completed').length },
              {
                key: 'cancelled',
                label: 'Cancelled',
                count: orders.filter((o) => o.status === 'cancelled' || o.status === 'rejected').length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    activeTab === tab.key ? 'bg-orange-100 text-[#FF5722]' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </ScrollReveal>

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
                  Are you sure you want to cancel Order <code className="font-mono text-neutral-800 font-bold">{showCancelModal.id.slice(0, 8)}...</code>? This operation cannot be undone.
                </p>

                {cancelError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                    {cancelError}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setShowCancelModal(null);
                      setCancelError(null);
                    }}
                    disabled={cancellingId !== null}
                  >
                    Keep Order
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 bg-rose-600 hover:bg-rose-700"
                    onClick={handleCancelOrder}
                    disabled={cancellingId !== null}
                  >
                    {cancellingId ? 'Cancelling...' : 'Yes, Cancel'}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <div className="py-16 flex justify-center items-center">
            <LoadingSpinner size="lg" text="Fetching your order history..." />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 flex items-center gap-3 max-w-2xl mx-auto my-6">
            <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold">Failed to load orders</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchOrders} className="bg-white">
              Retry
            </Button>
          </div>
        )}

        {/* Empty Orders State */}
        {!loading && !error && filteredOrders.length === 0 && (
          <ScrollReveal variant="scale-up" delay={0.1}>
            <div className="bg-white rounded-3xl border border-neutral-200 p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF5722] flex items-center justify-center mx-auto border border-orange-100">
                <FiPackage className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-neutral-900">
                {orders.length === 0
                  ? "You haven't placed any orders yet"
                  : `No ${activeTab} orders found`}
              </h3>

              <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                {orders.length === 0
                  ? 'When you order products with Cash on Delivery, they will appear here with live status updates.'
                  : 'Try selecting a different filter tab above to view other order milestones.'}
              </p>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                <Link to="/products">
                  <Button variant="primary" size="lg" className="shadow-lg shadow-[#FF5722]/20">
                    <FiShoppingBag className="w-4 h-4" /> Start Shopping Now
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Orders List */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const formattedDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent Order';

              const isEligibleForCancel = order.status === 'pending' || order.status === 'confirmed';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-2xs hover:border-neutral-300 transition-all"
                >
                  {/* Order Top Bar */}
                  <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-50/60 border-b border-neutral-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-[#FF5722] shadow-2xs">
                        <FiPackage className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 font-semibold">Order:</span>
                          <code className="text-xs font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded-md border border-neutral-200">
                            {order.id.slice(0, 13)}...
                          </code>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                          <FiCalendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-between md:justify-end">
                      <div>{getStatusBadge(order.status)}</div>

                      <div className="text-right">
                        <span className="text-xs text-neutral-400 block">Total Due (COD)</span>
                        <span className="text-base sm:text-lg font-black text-[#FF5722]">
                          Rs. {Number(order.total).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Dedicated Order Details Link */}
                        <Link to={`/orders/${order.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs text-neutral-700 hover:text-[#FF5722] hover:border-[#FF5722] bg-white"
                          >
                            <FiEye className="w-3.5 h-3.5" /> Details
                          </Button>
                        </Link>

                        {/* Quick Accordion Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(order.id)}
                          className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-white rounded-xl transition-colors cursor-pointer border border-transparent hover:border-neutral-200"
                          aria-label="Toggle quick preview"
                        >
                          {isExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary Preview / Thumbnails */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-600">
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                        <span className="font-medium truncate">
                          Delivering to: <strong className="text-neutral-900">{order.shippingName}</strong>, {order.shippingCity}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 font-semibold rounded-lg">
                          Cash on Delivery
                        </span>
                        <span className="text-neutral-400">•</span>
                        <span>{order.itemsCount || order.items?.length || 1} item(s)</span>
                      </div>
                    </div>

                    {/* Ordered Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {order.items.slice(0, isExpanded ? order.items.length : 2).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex items-center gap-3 p-2.5 bg-neutral-50 rounded-2xl border border-neutral-100"
                          >
                            <img
                              src={item.product?.imageUrl || item.product?.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200'}
                              alt={item.productName}
                              className="w-12 h-12 rounded-xl object-cover border border-neutral-200 bg-white flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1 text-xs">
                              <h5 className="font-bold text-neutral-900 truncate">{item.productName}</h5>
                              <p className="text-neutral-500 truncate mt-0.5">
                                Qty: <strong className="text-neutral-800">{item.quantity}</strong>
                                {item.selectedSize && <> • Size: {item.selectedSize}</>}
                                {item.selectedColor && <> • Color: {item.selectedColor}</>}
                              </p>
                              <p className="font-bold text-[#FF5722] mt-0.5">
                                Rs. {(item.productPrice * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {order.items && order.items.length > 2 && !isExpanded && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(order.id)}
                        className="text-xs font-bold text-[#FF5722] hover:underline cursor-pointer"
                      >
                        + {order.items.length - 2} more item(s)... Click to expand quick preview
                      </button>
                    )}

                    {/* Expanded Full Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-4 mt-4 border-t border-neutral-100 space-y-4 overflow-hidden"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                            <div>
                              <p className="font-bold text-neutral-400 uppercase tracking-wider mb-1">Shipping Details</p>
                              <p className="font-bold text-neutral-900">{order.shippingName}</p>
                              <p className="text-neutral-600 mt-0.5">{order.shippingAddress}</p>
                              <p className="text-neutral-600">{order.shippingCity}</p>
                              <p className="text-neutral-600 mt-1 flex items-center gap-1">
                                <FiPhone className="w-3.5 h-3.5 text-neutral-400" /> {order.shippingPhone}
                              </p>
                              {order.notes && (
                                <p className="text-neutral-500 italic mt-1.5 pt-1.5 border-t border-neutral-200">
                                  Notes: "{order.notes}"
                                </p>
                              )}
                            </div>

                            <div className="space-y-2 border-t sm:border-t-0 sm:border-l sm:pl-4 border-neutral-200 pt-3 sm:pt-0">
                              <p className="font-bold text-neutral-400 uppercase tracking-wider">Payment Breakdown</p>
                              <div className="flex justify-between text-neutral-600">
                                <span>Subtotal</span>
                                <span>Rs. {Number(order.subtotal).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-neutral-600">
                                <span>Shipping Fee</span>
                                <span>{order.shippingFee === 0 ? 'FREE' : `Rs. ${Number(order.shippingFee).toLocaleString()}`}</span>
                              </div>
                              <div className="flex justify-between text-neutral-600">
                                <span>Payment Type</span>
                                <span className="font-bold text-neutral-900">Cash on Delivery</span>
                              </div>
                              <div className="flex justify-between font-bold text-sm text-neutral-900 pt-2 border-t border-neutral-200">
                                <span>Total Payable</span>
                                <span className="text-[#FF5722]">Rs. {Number(order.total).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Cancellation Button if Pending or Confirmed */}
                          <div className="flex items-center justify-between pt-2">
                            <Link to={`/orders/${order.id}`}>
                              <span className="text-xs font-bold text-[#FF5722] hover:underline inline-flex items-center gap-1">
                                Open Full Order Page <FiExternalLink className="w-3 h-3" />
                              </span>
                            </Link>

                            {isEligibleForCancel && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCancelError(null);
                                  setShowCancelModal(order);
                                }}
                                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              >
                                Cancel Order
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
