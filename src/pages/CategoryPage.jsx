import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FiSearch, FiChevronRight } from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import ProductGrid from '../components/product/ProductGrid.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import { categories } from '../assets/assets.js';
import { getProductsByCategory, normalizeCategorySlug } from '../services/productService.js';
import { useCart } from '../context/CartContext.jsx';

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const { addToCart, toastMessage } = useCart();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Find category metadata
  const currentCategory = categories.find((c) => c.slug === categorySlug) || {
    name: normalizeCategorySlug(categorySlug),
    description: 'Explore curated collection for this department.',
    slug: categorySlug,
  };

  useEffect(() => {
    let isMounted = true;

    async function loadCategoryItems() {
      try {
        setLoading(true);
        const data = await getProductsByCategory(categorySlug, {
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
          console.error('Failed to load category products:', err);
          setError('Could not connect to Supabase for this category.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCategoryItems();

    return () => {
      isMounted = false;
    };
  }, [categorySlug, searchTerm, inStockOnly, sortBy]);

  const handleAddToCart = async (product) => {
    const res = await addToCart(product, { quantity: 1 });
    if (res.requireLogin) {
      navigate('/login');
    }
  };

  return (
    <div className="py-8 space-y-8 min-h-[70vh]">
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
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
          <Link to="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <FiChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <Link to="/products" className="hover:text-neutral-900 transition-colors">
            Departments
          </Link>
          <FiChevronRight className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-neutral-900 capitalize">
            {currentCategory.name}
          </span>
        </nav>

        {/* Category Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white p-8 sm:p-12 mb-8 shadow-md">
          {currentCategory.bannerImage && (
            <img
              src={currentCategory.bannerImage}
              alt={currentCategory.name}
              className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
            />
          )}
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-bold tracking-widest text-[#FF5722] uppercase">
              Shopee Department Collection &bull; Supabase Live
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {currentCategory.name}
            </h1>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              {currentCategory.description}
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-neutral-400">
              <span className="font-bold text-white tabular-nums">
                {products.length}
              </span>{' '}
              matching products in this category
            </div>
          </div>
        </div>

        {/* Controls: Search, Stock Filter, Sort */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search within ${currentCategory.name}...`}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722] transition-all"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer select-none bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-200">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-[#FF5722] rounded accent-[#FF5722] focus:ring-0"
              />
              <span>In Stock Only</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF5722]/30 focus:border-[#FF5722]"
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

        {/* Product Grid / Loading State */}
        {loading ? (
          <LoadingSpinner fullPage={false} message={`Loading ${currentCategory.name} collection...`} className="py-20" />
        ) : error ? (
          <div className="p-8 bg-amber-50 rounded-3xl border border-amber-200 text-center text-xs text-amber-800 max-w-lg mx-auto">
            {error}
          </div>
        ) : (
          <ProductGrid
            products={products}
            onAddToCart={handleAddToCart}
            emptyTitle={`No products found in ${currentCategory.name}`}
            emptyDescription="Try clearing your search terms or unchecking the in-stock filter."
          />
        )}
      </Container>
    </div>
  );
}
