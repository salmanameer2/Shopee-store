import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FiSearch, FiFilter, FiX, FiRefreshCw } from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import ProductGrid from '../components/product/ProductGrid.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import { getProducts } from '../services/productService.js';
import { useCart } from '../context/CartContext.jsx';

export default function Products() {
  const { addToCart, toastMessage } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update searchTerm if URL query parameter changes
  useEffect(() => {
    const urlQuery = searchParams.get('search');
    if (urlQuery !== null && urlQuery !== searchTerm) {
      setSearchTerm(urlQuery);
    }
  }, [searchParams]);

  const categories = ['All', 'Men', 'Women', 'Kids', 'Electronic Gadgets'];

  // Fetch products from Supabase via productService whenever filters change
  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        setLoading(true);
        const data = await getProducts({
          category: selectedCategory,
          searchTerm,
          inStockOnly,
          sortBy,
        });

        if (isMounted) {
          setProducts(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load products from Supabase:', err);
          setError('Could not connect to Supabase products table.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchTerm, inStockOnly, sortBy]);

  const handleAddToCart = async (product) => {
    const res = await addToCart(product, { quantity: 1 });
    if (res.requireLogin) {
      navigate('/login');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSortBy('featured');
    setInStockOnly(false);
    setSearchParams({});
  };

  return (
    <div className="py-8 sm:py-12 space-y-8 min-h-[75vh]">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-20 z-50 bg-neutral-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm border border-white/10"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Container>
        {/* Header */}
        <ScrollReveal variant="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
            <div>
              <span className="text-xs font-bold text-[#FF5722] tracking-wider uppercase">
                Supabase Product Catalog
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
                All Products
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Explore items across Men, Women, Kids, and Electronic Gadgets
              </p>
            </div>

            <div className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3.5 py-1.5 rounded-full self-start md:self-auto">
              Showing <strong className="text-neutral-900 tabular-nums">{products.length}</strong> Products
            </div>
          </div>
        </ScrollReveal>

        {/* Filter Controls Bar */}
        <ScrollReveal variant="fade-up" delay={0.1} className="mt-6 mb-8">
          <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-sm space-y-4">
            {/* Top Row: Category Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-wrap items-center gap-2 p-1 bg-neutral-100 rounded-2xl">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {(searchTerm || selectedCategory !== 'All' || inStockOnly || sortBy !== 'featured') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <FiX className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}
            </div>

            {/* Bottom Row: Search, In Stock Toggle, Sort By */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-neutral-100">
              {/* Search Input */}
              <div className="relative w-full sm:max-w-md">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSearchParams(e.target.value ? { search: e.target.value } : {});
                  }}
                  placeholder="Search by name, brand, or description..."
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] transition-all"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* In Stock Toggle */}
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer select-none bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 text-[#FF5722] rounded accent-[#FF5722] cursor-pointer"
                  />
                  <span>In Stock Only</span>
                </label>

                {/* Sort By Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 font-medium hidden sm:inline">
                    Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Product Grid / Loading / Error States */}
        {loading ? (
          <LoadingSpinner fullPage={false} message="Fetching catalog from Supabase..." className="py-20" />
        ) : error ? (
          <div className="p-8 bg-amber-50 rounded-3xl border border-amber-200 text-center space-y-3 max-w-xl mx-auto">
            <h3 className="text-base font-bold text-amber-900">Notice</h3>
            <p className="text-xs text-amber-700">{error}</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 cursor-pointer"
            >
              <FiRefreshCw className="w-3.5 h-3.5" /> Retry Fetch
            </button>
          </div>
        ) : (
          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
            emptyTitle="No products match your criteria"
            emptyDescription="Try resetting your filters, searching for a different keyword, or exploring another category."
          />
        )}
      </Container>
    </div>
  );
}
