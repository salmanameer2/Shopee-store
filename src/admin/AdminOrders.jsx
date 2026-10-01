import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShoppingBag,
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiClock,
  FiCopy,
  FiCheck,
  FiPackage,
  FiDollarSign,
  FiTruck,
  FiChevronRight,
  FiX,
  FiExternalLink,
} from 'react-icons/fi';
import Button from '../components/common/Button.jsx';
import OrderStatusBadge from '../components/admin/OrderStatusBadge.jsx';
import OrderDetailsModal from '../components/admin/OrderDetailsModal.jsx';
import {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  ALLOWED_ORDER_STATUSES,
} from '../services/adminOrderService.js';
import { formatPrice } from '../utils/index.js';

export default function AdminOrders() {
  // Main Data States
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Details Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Quick Action in Table State
  const [quickActionOrderId, setQuickActionOrderId] = useState(null);

  // Copied ID state
  const [copiedId, setCopiedId] = useState(null);

  // Feedback Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch Orders from Supabase
  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await getAdminOrders({
        status: statusFilter,
        searchTerm,
        sortBy,
      });

      if (res.success) {
        setOrders(res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
      } else {
        setError(res.error || 'Unable to load orders data.');
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch admin orders:', err);
      setError('Unable to load orders data.');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchTerm, sortBy]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle Opening Order Details
  const handleOpenDetails = async (orderId) => {
    try {
      setIsUpdatingStatus(true);
      const res = await getAdminOrderById(orderId);
      if (res.success && res.order) {
        setSelectedOrder(res.order);
        setIsModalOpen(true);
      } else {
        showToast(res.error || 'Failed to open order details.', 'error');
      }
    } catch (err) {
      showToast('Error opening order details.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Status Update (From modal or table quick actions)
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setIsUpdatingStatus(true);
      setQuickActionOrderId(orderId);

      const res = await updateOrderStatus(orderId, newStatus);

      if (res.success) {
        showToast(res.message || `Order updated to ${newStatus}.`, 'success');
        // If modal is open with this order, update selectedOrder
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(res.order);
        }
        // Refresh orders list
        await fetchOrders(true);
      } else {
        showToast(res.error || 'Failed to update order status.', 'error');
      }
    } catch (err) {
      showToast('Unexpected error updating order status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
      setQuickActionOrderId(null);
    }
  };

  const handleCopyId = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || sortBy !== 'newest';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 sm:right-8 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-slideIn border ${
            toast.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-800'
              : 'bg-emerald-950 text-emerald-200 border-emerald-800'
          }`}
        >
          {toast.type === 'error' ? (
            <FiAlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white mb-2 transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Order Management &amp; Fulfillment
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/20">
              COD Fulfillment
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Manage live orders, verify Cash on Delivery dispatches, and control lifecycle transitions.
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchOrders(true)}
            disabled={loading || refreshing}
            className="border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 gap-2 text-xs"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FF5722]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Live Data'}</span>
          </Button>
        </div>
      </div>

      {/* Real-Time Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Orders */}
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-neutral-900 border-[#FF5722] shadow-lg shadow-[#FF5722]/10'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
            <FiShoppingBag className="w-4 h-4 text-neutral-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.total}</p>
          <span className="text-[10px] text-neutral-400 mt-0.5 block">All customer orders</span>
        </button>

        {/* Pending Orders */}
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
            <FiClock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-400">{stats.pending}</p>
          <span className="text-[10px] text-amber-300/70 mt-0.5 block">Requires verification</span>
        </button>

        {/* Confirmed Orders */}
        <button
          type="button"
          onClick={() => setStatusFilter('confirmed')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'confirmed'
              ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-500/10'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-sky-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed</span>
            <FiPackage className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-sky-400">{stats.confirmed}</p>
          <span className="text-[10px] text-sky-300/70 mt-0.5 block">Ready for dispatch</span>
        </button>

        {/* Completed Orders */}
        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'completed'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <FiCheckCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{stats.completed}</p>
          <span className="text-[10px] text-emerald-300/70 mt-0.5 block">Delivered &amp; Paid</span>
        </button>

        {/* Cancelled / Rejected */}
        <button
          type="button"
          onClick={() => setStatusFilter('cancelled')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'cancelled'
              ? 'bg-neutral-800 border-neutral-600 shadow-lg'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cancelled</span>
            <FiXCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-neutral-400">{stats.cancelled}</p>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">{stats.rejected} rejected</span>
        </button>

        {/* Total Realized COD Revenue */}
        <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">COD Revenue</span>
            <FiDollarSign className="w-4 h-4" />
          </div>
          <p className="text-lg sm:text-xl font-black text-white truncate" title={formatPrice(stats.totalRevenue)}>
            {formatPrice(stats.totalRevenue)}
          </p>
          <span className="text-[10px] text-neutral-400 mt-0.5 block">From completed orders</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <FiSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order ID, customer name, phone, city, notes, or product..."
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-950 border border-neutral-700/80 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#FF5722] transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-950 border border-neutral-700/80 rounded-xl text-xs text-neutral-200 px-3 py-2 font-medium focus:outline-none focus:border-[#FF5722]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest_total">Highest Total</option>
                <option value="lowest_total">Lowest Total</option>
              </select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-800/80">
          <span className="text-xs font-bold text-neutral-400 mr-2 flex items-center gap-1.5">
            <FiFilter className="w-3.5 h-3.5" /> Status:
          </span>

          {[
            { id: 'all', label: 'All Orders', count: stats.total },
            { id: 'pending', label: 'Pending', count: stats.pending, color: 'text-amber-400' },
            { id: 'confirmed', label: 'Confirmed', count: stats.confirmed, color: 'text-sky-400' },
            { id: 'completed', label: 'Completed', count: stats.completed, color: 'text-emerald-400' },
            { id: 'cancelled', label: 'Cancelled', count: stats.cancelled, color: 'text-neutral-400' },
            { id: 'rejected', label: 'Rejected', count: stats.rejected, color: 'text-rose-400' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#FF5722] text-white shadow-md shadow-[#FF5722]/20 font-bold'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Orders Table / Card List */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 shadow-xl overflow-hidden">
        {loading ? (
          /* Loading State */
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-[#FF5722]">
              <FiRefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-neutral-200">
              Loading orders directly from Supabase...
            </p>
            <p className="text-xs text-neutral-500">
              Verifying live database records under admin RLS policies.
            </p>
          </div>
        ) : error ? (
          /* Explicit Error State — No Mock Fallbacks Allowed */
          <div className="py-16 px-6 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <FiAlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Unable to load orders data.
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Supabase database could not return order records. Real data from public.orders is required.
            </p>
            <Button
              onClick={() => fetchOrders(true)}
              className="bg-[#FF5722] hover:bg-[#F4511E] text-white text-xs gap-2 font-bold"
            >
              <FiRefreshCw className="w-3.5 h-3.5" /> Retry
            </Button>
          </div>
        ) : orders.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 text-neutral-500 flex items-center justify-center mx-auto">
              <FiShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No Orders Found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No orders match your current search or status filter criteria.'
                : 'There are currently no customer orders in the public.orders table.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs border-neutral-700 text-neutral-300"
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          /* Table of Orders */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[11px] bg-neutral-950/60">
                  <th className="py-4 pl-6 pr-3">Order ID</th>
                  <th className="py-4 px-3">Customer</th>
                  <th className="py-4 px-3">Date</th>
                  <th className="py-4 px-3">Items</th>
                  <th className="py-4 px-3">Total</th>
                  <th className="py-4 px-3">Payment</th>
                  <th className="py-4 px-3">Status</th>
                  <th className="py-4 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {orders.map((ord) => {
                  const isQuickUpdating = quickActionOrderId === ord.id;
                  const isCopied = copiedId === ord.id;

                  return (
                    <tr
                      key={ord.id}
                      onClick={() => handleOpenDetails(ord.id)}
                      className="hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Order ID */}
                      <td className="py-4 pl-6 pr-3 font-mono font-medium text-neutral-300">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold group-hover:text-[#FF5722] transition-colors">
                            #{ord.id.slice(0, 8)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(ord.id, e)}
                            className="p-1 text-neutral-500 hover:text-white transition-colors"
                            title="Copy full UUID"
                          >
                            {isCopied ? (
                              <FiCheck className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <FiCopy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {isCopied && (
                          <span className="text-[10px] text-emerald-400 block font-sans">
                            Copied
                          </span>
                        )}
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-3">
                        <div className="font-bold text-white text-xs max-w-[150px] truncate">
                          {ord.shippingName}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {ord.shippingPhone}
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate max-w-[150px]">
                          {ord.shippingCity}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-3 whitespace-nowrap text-neutral-300">
                        <div>{formatDate(ord.createdAt)}</div>
                        <div className="text-[10px] text-neutral-500">
                          {formatDateTime(ord.createdAt).split(',')[1] || ''}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-3">
                        <span className="font-semibold text-neutral-200">
                          {ord.itemsCount} {ord.itemsCount === 1 ? 'item' : 'items'}
                        </span>
                        {ord.items?.[0] && (
                          <p className="text-[11px] text-neutral-400 truncate max-w-[160px] mt-0.5">
                            {ord.items[0].productName}
                            {ord.items.length > 1 && ` +${ord.items.length - 1} more`}
                          </p>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="font-bold text-white text-sm">
                          {formatPrice(ord.total)}
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          COD
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-3 whitespace-nowrap">
                        <OrderStatusBadge status={ord.status} size="sm" />
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 pl-3 pr-6 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Workflow Action: Confirm button for pending */}
                          {ord.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(ord.id, 'confirmed')}
                              disabled={isQuickUpdating}
                              className="text-[11px] py-1 px-2.5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 font-bold gap-1"
                            >
                              <FiCheck className="w-3 h-3" /> Confirm
                            </Button>
                          )}

                          {/* Quick Workflow Action: Complete button for confirmed */}
                          {ord.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(ord.id, 'completed')}
                              disabled={isQuickUpdating}
                              className="text-[11px] py-1 px-2.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold gap-1"
                            >
                              <FiCheckCircle className="w-3 h-3" /> Complete
                            </Button>
                          )}

                          {/* View Details Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDetails(ord.id)}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-1.5 rounded-xl"
                            title="View Full Order Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Summary */}
        {!loading && !error && orders.length > 0 && (
          <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400">
            <div>
              Showing <span className="text-white font-bold">{orders.length}</span> orders
              {statusFilter !== 'all' && ` with status "${statusFilter}"`}
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
            <div className="flex items-center gap-4">
              <span>All records verified in Supabase PostgreSQL</span>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        order={selectedOrder}
        onClose={() => setIsModalOpen(false)}
        onStatusUpdate={handleStatusUpdate}
        isUpdating={isUpdatingStatus}
      />
    </div>
  );
}
