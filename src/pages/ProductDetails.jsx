import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FiShoppingBag,
  FiHeart,
  FiShield,
  FiTruck,
  FiRotateCcw,
  FiStar,
  FiCheck,
  FiChevronRight,
  FiAlertCircle,
} from 'react-icons/fi';
import Container from '../components/common/Container.jsx';
import Button from '../components/common/Button.jsx';
import ProductGrid from '../components/product/ProductGrid.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ScrollReveal from '../components/common/ScrollReveal.jsx';
import { getProductById, getRelatedProducts } from '../services/productService.js';
import { useCart } from '../context/CartContext.jsx';
import { formatPrice } from '../utils/index.js';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems, actionLoading, toastMessage } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProductData() {
      try {
        setLoading(true);
        setError(null);
        const item = await getProductById(id);

        if (!item) {
          if (isMounted) {
            setProduct(null);
            setError('Product not found in Supabase database.');
          }
          return;
        }

        if (isMounted) {
          setProduct(item);
          setSelectedSize(item.sizes && item.sizes.length > 0 ? item.sizes[0] : null);
          setSelectedColor(item.colors && item.colors.length > 0 ? item.colors[0] : null);
          setQuantity(1);

          // Fetch related products
          const related = await getRelatedProducts(item.category, item.id, 4);
          if (isMounted) {
            setRelatedProducts(related);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching product from Supabase:', err);
          setError('Failed to load product details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProductData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="py-24">
        <Container>
          <LoadingSpinner fullPage={false} message="Loading product details from Supabase..." />
        </Container>
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="py-20 text-center">
        <Container>
          <EmptyState
            icon={FiAlertCircle}
            title="Product Unavailable"
            description={error || "We couldn't find the product you're looking for."}
            actionText="Back to Products Catalog"
            actionLink="/products"
          />
        </Container>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    const res = await addToCart(product, {
      quantity,
      size: selectedSize,
      color: selectedColor,
    });

    if (res.requireLogin) {
      navigate('/login');
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock || actionLoading) return;

    // Determine currently selected variants (or defaults)
    const activeSize = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
    const activeColor = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : null);

    // Check if the selected product/variant already exists in cart
    const isAlreadyInCart = cartItems?.some((item) => {
      const isSameProduct = item.productId === product.id || item.product?.id === product.id;
      const isSameSize = (item.selectedSize || null) === (activeSize || null);
      const isSameColor = (item.selectedColor || null) === (activeColor || null);
      return isSameProduct && isSameSize && isSameColor;
    });

    if (isAlreadyInCart) {
      // Scenario: Product is ALREADY in the cart.
      // Do NOT call addToCart(), do NOT increment quantity, proceed to /cart.
      navigate('/cart');
      return;
    }

    // Scenario: Product is NOT already in the cart.
    // Add selected product/quantity ONCE and navigate to /cart upon success.
    const res = await addToCart(product, {
      quantity,
      size: activeSize,
      color: activeColor,
    });

    if (res.success) {
      navigate('/cart');
    } else if (res.requireLogin) {
      navigate('/login');
    }
  };

  return (
    <div className="py-8 space-y-12 min-h-[75vh]">
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
        {/* Breadcrumb Navigation */}
        <ScrollReveal variant="fade-up" duration={0.5}>
          <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 flex-wrap">
            <Link to="/" className="hover:text-neutral-900 transition-colors">
              Home
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <Link to="/products" className="hover:text-neutral-900 transition-colors">
              Products
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <Link
              to={`/category/${product.categorySlug}`}
              className="hover:text-neutral-900 transition-colors capitalize"
            >
              {product.category}
            </Link>
            <FiChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold text-neutral-900 truncate max-w-[200px] sm:max-w-xs">
              {product.name}
            </span>
          </nav>
        </ScrollReveal>

        {/* Main Product Showcase Card */}
        <ScrollReveal variant="fade-up" delay={0.1}>
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
              {/* Left: Product Image Gallery */}
              <div className="lg:col-span-6 space-y-4">
                <div className="relative aspect-square w-full rounded-2xl bg-neutral-100 overflow-hidden border border-neutral-200 shadow-sm group">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                    {product.discount > 0 && (
                      <span className="bg-[#FF5722] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                        {product.discount}% OFF
                      </span>
                    )}
                    {product.isNew && (
                      <span className="bg-neutral-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md uppercase">
                        New Arrival
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`absolute top-4 right-4 p-3 rounded-2xl shadow-md transition-colors cursor-pointer ${
                      isWishlisted
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-white text-neutral-600 hover:text-rose-600'
                    }`}
                    aria-label="Wishlist product"
                  >
                    <FiHeart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Thumbnails preview strip */}
                <div className="grid grid-cols-4 gap-3">
                  {[product.image, product.image, product.image, product.image].map((img, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 ${
                        idx === 0 ? 'border-[#FF5722]' : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Product Meta & Purchase Form */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  {/* Brand & Category header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FF5722] uppercase tracking-wider">
                      {product.brand} &bull; {product.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex items-center text-amber-400">
                        <FiStar className="w-4 h-4 fill-current" />
                      </div>
                      <span className="font-bold text-neutral-800 tabular-nums">
                        {product.rating}
                      </span>
                      <span className="text-neutral-400">({product.reviewsCount} customer reviews)</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight leading-snug">
                    {product.name}
                  </h1>

                  {/* Price Display */}
                  <div className="flex items-baseline gap-3 pt-1">
                    <span className="text-3xl sm:text-4xl font-black text-neutral-900 tabular-nums">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-base sm:text-lg text-neutral-400 line-through tabular-nums">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                    {product.discount > 0 && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        Save {formatPrice(product.originalPrice - product.price)}
                      </span>
                    )}
                  </div>

                  {/* Stock status indicator */}
                  <div className="pt-1">
                    {isOutOfStock ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                        <span>Unavailable &bull; Out of Stock</span>
                      </div>
                    ) : isLowStock ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                        <span>Low Stock &bull; Only {product.stock} items remaining</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <FiCheck className="w-3.5 h-3.5" />
                        <span>In Stock ({product.stock} available)</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed pt-2">
                    {product.description}
                  </p>

                  {/* Color Selector */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-neutral-800 block">
                        Color:{' '}
                        <span className="font-normal text-neutral-600">{selectedColor}</span>
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              selectedColor === color
                                ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Selector */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-neutral-800 block">
                        Size / Option:{' '}
                        <span className="font-normal text-neutral-600">{selectedSize}</span>
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              selectedSize === size
                                ? 'border-[#FF5722] bg-[#FF5722] text-white shadow-sm'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity & CTA Buttons */}
                  <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-4">
                      {/* Quantity counter */}
                      <div className="flex items-center border border-neutral-300 rounded-xl bg-neutral-50 p-1">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={isOutOfStock || quantity <= 1}
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-neutral-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-sm text-neutral-900 tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => (product.stock ? Math.min(product.stock, q + 1) : q + 1))}
                          disabled={isOutOfStock || (product.stock && quantity >= product.stock)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-neutral-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Add to Cart */}
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock || actionLoading === 'add'}
                        className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                          isOutOfStock
                            ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                            : 'bg-[#FF5722] text-white hover:bg-[#E64A19] active:scale-98 shadow-[#FF5722]/30'
                        }`}
                      >
                        <FiShoppingBag className="w-5 h-5" />
                        {isOutOfStock
                          ? 'Out of Stock'
                          : actionLoading === 'add'
                          ? 'Saving to Cart...'
                          : 'Add to Shopping Cart'}
                      </button>
                    </div>

                    {/* Buy Now Button */}
                    {!isOutOfStock && (
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={handleBuyNow}
                        disabled={Boolean(actionLoading)}
                        className="w-full py-3.5 hover:scale-[1.01] active:scale-[0.99] transition-all"
                      >
                        Proceed to Checkout Now
                      </Button>
                    )}
                  </div>
                </div>

                {/* Guarantees Row */}
                <div className="pt-6 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-600">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[#FF5722]">
                      <FiTruck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 block">Express Delivery</span>
                      <span>2-3 business days</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[#FF5722]">
                      <FiRotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 block">7-Day Returns</span>
                      <span>Easy doorstep pick-up</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-[#FF5722]">
                      <FiShield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 block">Authentic Item</span>
                      <span>100% Quality Guaranteed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Product Details Tabs */}
        <ScrollReveal variant="fade-up" delay={0.15}>
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex border-b border-neutral-200 gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'description'
                    ? 'border-[#FF5722] text-[#FF5722]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Product Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'specs'
                    ? 'border-[#FF5722] text-[#FF5722]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shipping')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'shipping'
                    ? 'border-[#FF5722] text-[#FF5722]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Shipping & Returns
              </button>
            </div>

            <div className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-3xl">
              {activeTab === 'description' && (
                <div className="space-y-3">
                  <p>{product.description}</p>
                  <p>
                    Every piece undergoes stringent quality control. Whether dressing for an active workday, casual weekend, or elevating your gadget setup, Shopee delivers authentic performance.
                  </p>
                </div>
              )}
              {activeTab === 'specs' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-neutral-50 rounded-xl">
                    <span className="text-neutral-400 text-xs block">Brand</span>
                    <span className="font-bold text-neutral-800">{product.brand}</span>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl">
                    <span className="text-neutral-400 text-xs block">Category</span>
                    <span className="font-bold text-neutral-800">{product.category}</span>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl">
                    <span className="text-neutral-400 text-xs block">Database ID</span>
                    <span className="font-mono text-xs font-bold text-neutral-800 break-all">{product.id}</span>
                  </div>
                </div>
              )}
              {activeTab === 'shipping' && (
                <div className="space-y-2">
                  <p>
                    <strong>Standard Nationwide Delivery:</strong> 2–4 business days across Karachi, Lahore, Islamabad, and all major cities.
                  </p>
                  <p>
                    <strong>Cash on Delivery (COD):</strong> Pay cash to the courier upon safe receipt.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <ScrollReveal variant="fade-up" delay={0.2}>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-neutral-900">
                Related {product.category} Products
              </h3>
              <ProductGrid products={relatedProducts} columns={4} />
            </div>
          </ScrollReveal>
        )}
      </Container>
    </div>
  );
}
