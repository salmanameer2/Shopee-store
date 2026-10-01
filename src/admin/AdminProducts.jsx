import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBox,
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheck,
  FiAlertCircle,
  FiTag,
  FiStar,
  FiPackage,
} from 'react-icons/fi';
import Button from '../components/common/Button.jsx';
import StockStatusBadge from '../components/admin/StockStatusBadge.jsx';
import ProductForm from '../components/admin/ProductForm.jsx';
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  setProductActive,
  deleteProduct,
  ALLOWED_CATEGORIES,
} from '../services/adminProductService.js';
import { formatPrice } from '../utils/index.js';

export default function AdminProducts() {
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedStock, setSelectedStock] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteBlockedByOrders, setDeleteBlockedByOrders] = useState(false);

  // Toast / Feedback message
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch products directly from Supabase
  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await getAdminProducts({
        category: selectedCategory,
        status: selectedStatus.toLowerCase(),
        stockStatus:
          selectedStock === 'In Stock'
            ? 'normal'
            : selectedStock === 'Low Stock'
            ? 'low'
            : selectedStock === 'Out of Stock'
            ? 'out_of_stock'
            : 'All',
        searchTerm,
        sortBy,
      });

      if (res.success && res.data) {
        setProducts(res.data);
      } else {
        setError(res.error || 'Unable to load products.');
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
      setError('Unable to load products.');
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedStatus, selectedStock, searchTerm, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open Add Product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  // Open Edit Product
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingProduct?.id) {
        // Update product
        const res = await updateProduct(editingProduct.id, formData);
        if (res.success) {
          showToast(`Product "${formData.name}" updated successfully!`);
          setIsFormOpen(false);
          setEditingProduct(null);
          fetchProducts(true);
        } else {
          showToast(res.error || 'Failed to update product.', 'error');
        }
      } else {
        // Create product
        const res = await createProduct(formData);
        if (res.success) {
          showToast(`Product "${formData.name}" created successfully!`);
          setIsFormOpen(false);
          fetchProducts(true);
        } else {
          showToast(res.error || 'Failed to create product.', 'error');
        }
      }
    } catch (err) {
      console.error('Exception during product save:', err);
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active / Inactive
  const handleToggleActive = async (product) => {
    const newStatus = !product.isActive;
    const res = await setProductActive(product.id, newStatus);
    if (res.success) {
      showToast(
        `"${product.name}" has been ${newStatus ? 'activated' : 'deactivated'}.`
      );
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: newStatus } : p))
      );
    } else {
      showToast(res.error || 'Failed to update product status.', 'error');
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (product) => {
    setProductToDelete(product);
    setDeleteError(null);
    setDeleteBlockedByOrders(false);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteBlockedByOrders(false);

    try {
      const res = await deleteProduct(productToDelete.id, productToDelete.imageUrl);
      if (res.success) {
        showToast(`Product "${productToDelete.name}" deleted successfully.`);
        setProductToDelete(null);
        fetchProducts(true);
      } else {
        setDeleteError(res.error);
        if (res.blockedByOrders) {
          setDeleteBlockedByOrders(true);
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      setDeleteError('An unexpected error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  // If deletion is blocked by orders, offer quick Deactivate alternative
  const handleDeactivateInstead = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await setProductActive(productToDelete.id, false);
      if (res.success) {
        showToast(`Product "${productToDelete.name}" deactivated to preserve order history.`);
        setProductToDelete(null);
        fetchProducts(true);
      } else {
        setDeleteError(res.error || 'Failed to deactivate product.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback Notification */}
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

      {/* Top Header Bar */}
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
              Product Catalog
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
              {loading ? '...' : `${products.length} Items`}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Authoritative product inventory managed directly in Supabase
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProducts(true)}
            disabled={refreshing || loading}
            className="border-neutral-800 bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700 text-xs font-bold gap-1.5"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleOpenAdd}
            className="text-xs font-bold gap-1.5 shadow-md shadow-[#FF5722]/20"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add New Product</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <FiSearch className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, brand, or category..."
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

          {/* Status Filter (Active / Inactive) */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none transition-colors"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none transition-colors"
            >
              <option value="All">All Inventory</option>
              <option value="In Stock">In Stock (&ge; 6)</option>
              <option value="Low Stock">Low Stock (1-5)</option>
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
            <h3 className="text-base font-bold text-white">Unable to load products.</h3>
            <p className="text-xs text-neutral-400">{error}</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => fetchProducts(false)}
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
          <p className="text-sm font-semibold text-neutral-300">Loading catalog products...</p>
          <p className="text-xs text-neutral-500">Querying Supabase public.products</p>
        </div>
      )}

      {/* PRODUCTS TABLE / CARDS */}
      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
                <FiBox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No products found</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                No items match your search or filter criteria. Try adjusting your query or create a new product.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setSelectedStatus('All');
                  setSelectedStock('All');
                }}
                className="border-neutral-800 bg-neutral-800 text-neutral-300 hover:text-white text-xs mt-2"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="bg-neutral-900 rounded-3xl border border-neutral-800 shadow-xl overflow-hidden">
              {/* Desktop Table View */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/40 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-4 pl-6 pr-3">Product</th>
                      <th className="py-4 px-3">Category</th>
                      <th className="py-4 px-3">Price</th>
                      <th className="py-4 px-3">Stock</th>
                      <th className="py-4 px-3">Status</th>
                      <th className="py-4 px-3">Flags</th>
                      <th className="py-4 pl-3 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {products.map((p) => (
                      <tr
                        key={p.id}
                        className={`hover:bg-neutral-800/30 transition-colors ${
                          !p.isActive ? 'opacity-70 bg-neutral-950/20' : ''
                        }`}
                      >
                        {/* Product Image & Title */}
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

                        {/* Price & Discount */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <p className="font-bold text-white">{formatPrice(p.price)}</p>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="line-through text-neutral-500">
                                  {formatPrice(p.originalPrice)}
                                </span>
                                {p.discount > 0 && (
                                  <span className="text-[#FF5722] font-semibold">
                                    {p.discount}% off
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Stock & Stock Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <StockStatusBadge stock={p.stock} showUnits={true} size="xs" />
                        </td>

                        {/* Active / Inactive Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {p.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" /> Inactive
                            </span>
                          )}
                        </td>

                        {/* Flags: Featured, New */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {p.featured && (
                              <span
                                className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                title="Featured item"
                              >
                                <FiStar className="w-3 h-3" />
                              </span>
                            )}
                            {p.isNew && (
                              <span
                                className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/20 uppercase"
                                title="New Arrival"
                              >
                                New
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Active / Inactive */}
                            <button
                              type="button"
                              onClick={() => handleToggleActive(p)}
                              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                p.isActive
                                  ? 'text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10'
                                  : 'text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={p.isActive ? 'Deactivate product' : 'Activate product'}
                              aria-label={p.isActive ? 'Deactivate product' : 'Activate product'}
                            >
                              {p.isActive ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Edit product details"
                              aria-label="Edit product details"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(p)}
                              className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete product safely"
                              aria-label="Delete product safely"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Product Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleFormSubmit}
        initialProduct={editingProduct}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal with Reference Safety Check */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <FiAlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Delete Product</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Are you sure you want to delete <strong className="text-neutral-200">{productToDelete.name}</strong>?
              </p>
            </div>

            {/* Error or Block Warning */}
            {deleteError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2">
                <p className="flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{deleteError}</span>
                </p>

                {deleteBlockedByOrders && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeactivateInstead}
                    disabled={isDeleting}
                    className="w-full mt-1 border-rose-500/40 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 text-xs font-bold"
                  >
                    Deactivate Product Instead (Recommended)
                  </Button>
                )}
              </div>
            )}

            {!deleteBlockedByOrders && (
              <p className="text-[11px] text-neutral-500">
                Notice: Historical order records are preserved. If this product is part of customer order history, deletion will be blocked and deactivation is recommended instead.
              </p>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="border-neutral-800 bg-neutral-800 text-neutral-300 text-xs"
              >
                Cancel
              </Button>

              {!deleteBlockedByOrders && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-3.5 h-3.5" />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
