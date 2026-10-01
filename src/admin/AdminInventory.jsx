import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiLayers,
  FiArrowLeft,
  FiSearch,
  FiCheck,
  FiAlertTriangle,
  FiXCircle,
  FiRefreshCw,
  FiAlertCircle,
  FiPackage,
  FiCheckCircle,
  FiTrendingUp,
} from 'react-icons/fi';
import Button from '../components/common/Button.jsx';
import StockStatusBadge from '../components/admin/StockStatusBadge.jsx';
import {
  getAdminProducts,
  updateProductStock,
  ALLOWED_CATEGORIES,
} from '../services/adminProductService.js';
import { formatPrice } from '../utils/index.js';

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');

  // Quick edit state: maps productId -> { value: number|string, isSaving: boolean, isSaved: boolean, error: string }
  const [stockEdits, setStockEdits] = useState({});

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchInventory = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await getAdminProducts({
        category: selectedCategory,
        stockStatus:
          selectedStockStatus === 'Normal'
            ? 'normal'
            : selectedStockStatus === 'Low Stock'
            ? 'low'
            : selectedStockStatus === 'Out of Stock'
            ? 'out_of_stock'
            : 'All',
        searchTerm,
        sortBy: 'stock-asc', // lowest stock first for quick attention
      });

      if (res.success && res.data) {
        setProducts(res.data);

        // Prepopulate stock edits dictionary with current stock
        const initialEdits = {};
        res.data.forEach((p) => {
          initialEdits[p.id] = {
            value: String(p.stock),
            isSaving: false,
            isSaved: false,
            error: '',
          };
        });
        setStockEdits(initialEdits);
      } else {
        setError(res.error || 'Unable to load inventory.');
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Unable to load inventory.');
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedStockStatus, searchTerm]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Overall metric counts (from full list or loaded products)
  const totalCount = products.length;
  const outOfStockCount = products.filter((p) => Number(p.stock) <= 0).length;
  const lowStockCount = products.filter(
    (p) => Number(p.stock) > 0 && Number(p.stock) <= 5
  ).length;
  const normalStockCount = products.filter((p) => Number(p.stock) >= 6).length;

  // Handle stock value change in inline input
  const handleStockInputChange = (productId, val) => {
    setStockEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        value: val,
        isSaved: false,
        error: '',
      },
    }));
  };

  // Adjust by increment (+1 or -1)
  const handleStockStep = (productId, delta) => {
    setStockEdits((prev) => {
      const currentVal = parseInt(prev[productId]?.value || '0', 10);
      const nextVal = Math.max(0, (isNaN(currentVal) ? 0 : currentVal) + delta);
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          value: String(nextVal),
          isSaved: false,
          error: '',
        },
      };
    });
  };

  // Save Quick Stock to Supabase
  const handleSaveStock = async (product) => {
    const edit = stockEdits[product.id];
    const val = edit?.value;

    const num = Number(val);
    if (val === '' || isNaN(num) || !Number.isInteger(num) || num < 0) {
      setStockEdits((prev) => ({
        ...prev,
        [product.id]: {
          ...prev[product.id],
          error: 'Integer &ge; 0 only',
        },
      }));
      return;
    }

    setStockEdits((prev) => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        isSaving: true,
        error: '',
      },
    }));

    try {
      const res = await updateProductStock(product.id, num);
      if (res.success) {
        // Update product in local state
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock: num } : p))
        );

        setStockEdits((prev) => ({
          ...prev,
          [product.id]: {
            value: String(num),
            isSaving: false,
            isSaved: true,
            error: '',
          },
        }));

        showToast(`Stock updated to ${num} for "${product.name}"`);

        // Reset saved indicator after 2.5 seconds
        setTimeout(() => {
          setStockEdits((prev) => {
            if (!prev[product.id]) return prev;
            return {
              ...prev,
              [product.id]: {
                ...prev[product.id],
                isSaved: false,
              },
            };
          });
        }, 2500);
      } else {
        setStockEdits((prev) => ({
          ...prev,
          [product.id]: {
            ...prev[product.id],
            isSaving: false,
            error: res.error || 'Update failed',
          },
        }));
        showToast(res.error || 'Failed to update stock', 'error');
      }
    } catch (err) {
      console.error('Error saving stock:', err);
      setStockEdits((prev) => ({
        ...prev,
        [product.id]: {
          ...prev[product.id],
          isSaving: false,
          error: 'Server error',
        },
      }));
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-300 ${
            toast.type === 'error'
              ? 'bg-rose-950 border-rose-800 text-rose-200'
              : 'bg-emerald-950 border-emerald-800 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <FiAlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          ) : (
            <FiCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
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
              Inventory & Stock Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/20">
              Live Database
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time stock quantities and fast inline replenishment directly linked to Supabase
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInventory(true)}
            disabled={refreshing || loading}
            className="border-neutral-800 bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700 text-xs font-bold gap-1.5"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Inventory'}</span>
          </Button>
        </div>
      </div>

      {/* Inventory Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Listed */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Total Products</span>
            <FiPackage className="w-4 h-4 text-neutral-500" />
          </div>
          <p className="text-2xl font-black text-white">{loading ? '-' : totalCount}</p>
          <p className="text-[11px] text-neutral-500">Catalog items evaluated</p>
        </div>

        {/* Normal Stock */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">In Stock (Normal)</span>
            <FiCheckCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white">{loading ? '-' : normalStockCount}</p>
          <p className="text-[11px] text-emerald-500/80">Stock &ge; 6 units</p>
        </div>

        {/* Low Stock */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-medium">Low Stock Alerts</span>
            <FiAlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white">{loading ? '-' : lowStockCount}</p>
          <p className="text-[11px] text-amber-500/80">1 to 5 units remaining</p>
        </div>

        {/* Out of Stock */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-1">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-medium">Out of Stock</span>
            <FiXCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white">{loading ? '-' : outOfStockCount}</p>
          <p className="text-[11px] text-rose-500/80">Stock &le; 0 units</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <FiSearch className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product name or brand..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none transition-colors"
            >
              <option value="All">All Categories</option>
              {ALLOWED_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none transition-colors"
            >
              <option value="All">All Stock Levels</option>
              <option value="Normal">Normal Stock (&ge; 6)</option>
              <option value="Low Stock">Low Stock (1 &ndash; 5)</option>
              <option value="Out of Stock">Out of Stock (&le; 0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="bg-neutral-900 rounded-3xl border border-rose-500/30 p-8 text-center max-w-lg mx-auto space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Unable to load inventory.</h3>
            <p className="text-xs text-neutral-400">{error}</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => fetchInventory(false)}
            className="text-xs font-bold gap-2 mx-auto"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-16 text-center space-y-3">
          <FiRefreshCw className="w-8 h-8 text-[#FF5722] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-neutral-300">Loading live inventory...</p>
          <p className="text-xs text-neutral-500">Retrieving real-time stock levels from Supabase</p>
        </div>
      )}

      {/* INVENTORY TABLE */}
      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
                <FiLayers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No inventory items match filter</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No products found for the selected category or stock criteria.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedStockStatus('All');
                }}
                className="border-neutral-800 bg-neutral-800 text-neutral-300 hover:text-white text-xs mt-2"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="bg-neutral-900 rounded-3xl border border-neutral-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/40 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-4 pl-6 pr-3">Product</th>
                      <th className="py-4 px-3">Category</th>
                      <th className="py-4 px-3">Price</th>
                      <th className="py-4 px-3">Inventory Status</th>
                      <th className="py-4 px-3">Storefront</th>
                      <th className="py-4 px-3">Quick Stock Update</th>
                      <th className="py-4 pl-3 pr-6 text-right">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {products.map((p) => {
                      const edit = stockEdits[p.id] || {
                        value: String(p.stock),
                        isSaving: false,
                        isSaved: false,
                        error: '',
                      };
                      const hasChanged = String(edit.value) !== String(p.stock);

                      return (
                        <tr key={p.id} className="hover:bg-neutral-800/30 transition-colors">
                          {/* Product Image & Name */}
                          <td className="py-3.5 pl-6 pr-3 max-w-[280px]">
                            <div className="flex items-center gap-3">
                              {p.imageUrl || p.image ? (
                                <img
                                  src={p.imageUrl || p.image}
                                  alt={p.name}
                                  className="w-12 h-12 rounded-xl object-cover bg-neutral-950 border border-neutral-800 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-600 flex-shrink-0">
                                  <FiPackage className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-white truncate text-xs" title={p.name}>
                                  {p.name}
                                </p>
                                <p className="text-[11px] text-neutral-400 truncate">
                                  {p.brand || 'Shopee'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700/60">
                              {p.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3.5 px-3 whitespace-nowrap font-bold text-white">
                            {formatPrice(p.price)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <StockStatusBadge stock={p.stock} showUnits={true} size="xs" />
                          </td>

                          {/* Storefront Active / Inactive */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {p.isActive ? (
                              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                              </span>
                            ) : (
                              <span className="text-[11px] text-neutral-500 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" /> Inactive
                              </span>
                            )}
                          </td>

                          {/* Quick Stock Update Controller */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                {/* Minus Step */}
                                <button
                                  type="button"
                                  onClick={() => handleStockStep(p.id, -1)}
                                  disabled={edit.isSaving || Number(edit.value) <= 0}
                                  className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                  title="Decrease by 1"
                                >
                                  -
                                </button>

                                {/* Direct Input */}
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={edit.value}
                                  onChange={(e) => handleStockInputChange(p.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveStock(p);
                                    }
                                  }}
                                  disabled={edit.isSaving}
                                  className={`w-16 bg-neutral-950 border ${
                                    edit.error
                                      ? 'border-rose-500'
                                      : hasChanged
                                      ? 'border-[#FF5722]'
                                      : 'border-neutral-800'
                                  } rounded-lg px-2 py-1 text-center text-xs text-white font-mono focus:outline-none`}
                                />

                                {/* Plus Step */}
                                <button
                                  type="button"
                                  onClick={() => handleStockStep(p.id, 1)}
                                  disabled={edit.isSaving}
                                  className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                                  title="Increase by 1"
                                >
                                  +
                                </button>

                                {/* Save Button */}
                                <button
                                  type="button"
                                  onClick={() => handleSaveStock(p)}
                                  disabled={edit.isSaving || (!hasChanged && !edit.error)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                    edit.isSaved
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : hasChanged
                                      ? 'bg-[#FF5722] hover:bg-[#F4511E] text-white shadow-sm'
                                      : 'bg-neutral-800 text-neutral-500 border border-neutral-700/50 cursor-not-allowed'
                                  }`}
                                  title={hasChanged ? 'Save stock to database' : 'No changes'}
                                >
                                  {edit.isSaving ? (
                                    <FiRefreshCw className="w-3 h-3 animate-spin" />
                                  ) : edit.isSaved ? (
                                    <>
                                      <FiCheck className="w-3 h-3" /> Saved
                                    </>
                                  ) : (
                                    <span>Save</span>
                                  )}
                                </button>
                              </div>

                              {edit.error && (
                                <p className="text-[10px] text-rose-400">{edit.error}</p>
                              )}
                            </div>
                          </td>

                          {/* Last Updated */}
                          <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap text-neutral-400 font-mono text-[11px]">
                            {formatDate(p.updatedAt || p.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
