import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield,
  FiBox,
  FiShoppingBag,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiArrowRight,
  FiTrendingUp,
  FiAlertCircle,
  FiPackage,
  FiSlash,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';
import { getAdminDashboardOverview } from '../services/adminDashboardService.js';
import Button from '../components/common/Button.jsx';
import { formatPrice } from '../utils/index.js';

export default function AdminDashboard() {
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [overviewData, setOverviewData] = useState(null);

  const adminEmail = profile?.email || user?.email || 'admin@shopee.example.com';
  const role = profile?.role === 'admin' ? 'Administrator' : profile?.role || 'Administrator';

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await getAdminDashboardOverview();
      if (res.success && res.data) {
        setOverviewData(res.data);
      } else {
        setOverviewData(null);
        setError(res.error || 'Unable to load dashboard data.');
      }
    } catch (err) {
      console.error('Error in AdminDashboard loadData:', err);
      setOverviewData(null);
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <FiClock className="w-3 h-3" /> Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FiCheckCircle className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FiCheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <FiSlash className="w-3 h-3" /> Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-700/50 text-neutral-300 border border-neutral-600">
            <FiXCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
            {status}
          </span>
        );
    }
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome Card */}
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF5722]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[11px] font-bold rounded-full uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5" /> Authenticated Administrator
              </span>
              <span className="px-2.5 py-0.5 bg-[#FF5722]/10 text-[#FF5722] text-[11px] font-bold rounded-full uppercase tracking-wider border border-[#FF5722]/20">
                Database Source of Truth
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Admin Overview Dashboard
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-400 pt-1">
              <p>
                Email: <strong className="text-neutral-200 font-semibold">{adminEmail}</strong>
              </p>
              <span className="text-neutral-600">•</span>
              <p>
                Role: <span className="text-[#FF5722] font-bold">{role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="border-neutral-700 bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700 text-xs font-bold gap-2"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ERROR STATE: DISPLAY EXPLICIT RETRY IF SUPABASE DATA CANNOT BE LOADED */}
      {error && !loading && (
        <div className="bg-neutral-900 rounded-3xl border border-rose-500/30 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <FiAlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Unable to load dashboard data.</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">{error}</p>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => loadData(false)}
              className="text-xs font-bold gap-2 mx-auto"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </Button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="bg-neutral-900/60 rounded-3xl border border-neutral-800 p-16 text-center space-y-3">
          <FiRefreshCw className="w-8 h-8 text-[#FF5722] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-neutral-300">Loading Supabase Dashboard Metrics...</p>
          <p className="text-xs text-neutral-500">Querying authoritative database tables (public.products, public.orders)</p>
        </div>
      )}

      {/* SUCCESS STATE WITH AUTHENTIC DATABASE METRICS */}
      {!loading && !error && overviewData && (
        <>
          {/* SECTION 1: CATALOG & ORDER METRICS */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <FiTrendingUp className="w-4 h-4 text-[#FF5722]" /> Product & Order Statistics
            </h2>

            {/* Product Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/admin/products"
                className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-1.5 hover:border-neutral-700 hover:bg-neutral-850 transition-all block group"
              >
                <div className="flex items-center justify-between text-neutral-400 group-hover:text-white transition-colors">
                  <span className="text-xs font-medium">Total Products</span>
                  <FiBox className="w-4 h-4 text-neutral-500 group-hover:text-[#FF5722]" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {overviewData.products.total}
                </p>
                <p className="text-[11px] text-neutral-500">All catalog products &rarr;</p>
              </Link>

              <Link
                to="/admin/products"
                className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-1.5 hover:border-neutral-700 hover:bg-neutral-850 transition-all block group"
              >
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-xs font-medium">Active Products</span>
                  <FiCheckCircle className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {overviewData.products.active}
                </p>
                <p className="text-[11px] text-emerald-500/80">is_active = true &rarr;</p>
              </Link>

              <Link
                to="/admin/inventory"
                className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-1.5 hover:border-neutral-700 hover:bg-neutral-850 transition-all block group"
              >
                <div className="flex items-center justify-between text-amber-400">
                  <span className="text-xs font-medium">Low Stock</span>
                  <FiAlertTriangle className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {overviewData.products.lowStock}
                </p>
                <p className="text-[11px] text-amber-500/80">1 to 5 units in stock &rarr;</p>
              </Link>

              <Link
                to="/admin/inventory"
                className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-1.5 hover:border-neutral-700 hover:bg-neutral-850 transition-all block group"
              >
                <div className="flex items-center justify-between text-rose-400">
                  <span className="text-xs font-medium">Out of Stock</span>
                  <FiXCircle className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {overviewData.products.outOfStock}
                </p>
                <p className="text-[11px] text-rose-500/80">stock &le; 0 &rarr;</p>
              </Link>
            </div>

            {/* Order Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-1.5 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="text-xs font-medium">Total Orders</span>
                  <FiShoppingBag className="w-4 h-4 text-neutral-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {overviewData.orders.total}
                </p>
                <p className="text-[11px] text-neutral-500">public.orders count</p>
              </div>

              <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-1.5 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between text-amber-400">
                  <span className="text-xs font-medium">Pending</span>
                  <FiClock className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {overviewData.orders.pending}
                </p>
                <p className="text-[11px] text-amber-500/80">status = &apos;pending&apos;</p>
              </div>

              <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-1.5 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between text-blue-400">
                  <span className="text-xs font-medium">Confirmed</span>
                  <FiCheckCircle className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {overviewData.orders.confirmed}
                </p>
                <p className="text-[11px] text-blue-500/80">status = &apos;confirmed&apos;</p>
              </div>

              <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-1.5 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="text-xs font-medium">Completed</span>
                  <FiCheckCircle className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {overviewData.orders.completed}
                </p>
                <p className="text-[11px] text-emerald-500/80">status = &apos;completed&apos;</p>
              </div>

              <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-1.5 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between text-rose-400">
                  <span className="text-xs font-medium">Cancelled</span>
                  <FiXCircle className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {overviewData.orders.cancelled}
                </p>
                <p className="text-[11px] text-rose-500/80">status = &apos;cancelled&apos;</p>
              </div>

              <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-5 space-y-1.5 hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between text-rose-300">
                  <span className="text-xs font-medium">Rejected</span>
                  <FiSlash className="w-4 h-4" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {overviewData.orders.rejected || 0}
                </p>
                <p className="text-[11px] text-rose-400/80">status = &apos;rejected&apos;</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: RECENT ORDERS & LOW-STOCK PRODUCTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Orders Table */}
            <div className="lg:col-span-2 bg-neutral-900 rounded-3xl border border-neutral-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FiShoppingBag className="w-4 h-4 text-[#FF5722]" /> Recent Orders
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Authoritative orders from public.orders</p>
                </div>
                <Link
                  to="/admin/orders"
                  className="text-xs font-bold text-[#FF5722] hover:text-[#FF7043] flex items-center gap-1 transition-colors"
                >
                  View All Orders <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {overviewData.recentOrders.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
                    <FiShoppingBag className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-300">No orders placed yet</p>
                  <p className="text-xs text-neutral-500">
                    Real customer orders from Supabase will be displayed here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pr-4">Order ID</th>
                        <th className="pb-3 px-4">Customer</th>
                        <th className="pb-3 px-4">Date</th>
                        <th className="pb-3 px-4">Items</th>
                        <th className="pb-3 px-4">Total</th>
                        <th className="pb-3 pl-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {overviewData.recentOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-neutral-800/30 transition-colors">
                          <td className="py-3.5 pr-4 font-mono font-medium text-neutral-300 truncate max-w-[100px]">
                            #{ord.id.slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-white truncate max-w-[130px]">
                            {ord.shippingName}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap">
                            {formatDate(ord.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 text-neutral-300">
                            {ord.itemsCount} {ord.itemsCount === 1 ? 'item' : 'items'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-white">
                            {formatPrice(ord.total)}
                          </td>
                          <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                            {getOrderStatusBadge(ord.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low-Stock Products List */}
            <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FiAlertTriangle className="w-4 h-4 text-amber-400" /> Low Stock Alerts
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Products with 1 &ndash; 5 units in stock</p>
                </div>
                <Link
                  to="/admin/inventory"
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  Inventory <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {overviewData.lowStockList.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <FiCheckCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-300">No Low-Stock Products</p>
                  <p className="text-xs text-neutral-500">
                    All products in public.products have adequate stock (&gt; 5 units).
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overviewData.lowStockList.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/50 border border-neutral-800 hover:border-neutral-700 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {prod.imageUrl ? (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-10 h-10 rounded-xl object-cover bg-neutral-950 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-neutral-950 flex items-center justify-center text-neutral-600 flex-shrink-0">
                            <FiPackage className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                          <p className="text-[10px] text-neutral-400">{prod.category} • {formatPrice(prod.price)}</p>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {prod.stock} {prod.stock === 1 ? 'unit' : 'units'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
