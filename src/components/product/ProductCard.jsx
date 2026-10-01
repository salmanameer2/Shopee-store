import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FiStar, FiShoppingBag, FiHeart, FiEye, FiCheck } from 'react-icons/fi';
import { useCart } from '../../context/CartContext.jsx';
import { formatPrice } from '../../utils/index.js';

export default function ProductCard({ product, onAddToCart }) {
  const { addToCart, isAuthenticated } = useCart();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    if (onAddToCart) {
      onAddToCart(product);
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1500);
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Default variant if available
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : null;
    const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0] : null;

    const res = await addToCart(product, {
      quantity: 1,
      size: defaultSize,
      color: defaultColor,
    });

    if (res.success) {
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 1500);
    } else if (res.requireLogin) {
      navigate('/login');
    }
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
      className="group relative bg-white rounded-2xl border border-neutral-200/80 hover:border-neutral-300 hover:shadow-2xl transition-shadow duration-300 flex flex-col overflow-hidden h-full"
    >
      {/* Badges Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {product.discount > 0 && (
          <span className="bg-[#FF5722] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-sm tracking-wide">
            -{product.discount}%
          </span>
        )}
        {product.isNew && (
          <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
            New
          </span>
        )}
        {isOutOfStock && (
          <span className="bg-neutral-800 text-neutral-200 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider">
            Sold Out
          </span>
        )}
      </div>

      {/* Top Right Wishlist Button */}
      <button
        type="button"
        onClick={handleLike}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isLiked
            ? 'bg-rose-50 text-rose-600 shadow-sm'
            : 'bg-white/90 backdrop-blur-md text-neutral-500 hover:text-rose-600 hover:bg-white shadow-sm'
        }`}
        aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <FiHeart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
      </button>

      {/* Image Container with Link to Product Details */}
      <Link
        to={`/product/${product.id}`}
        className="relative block aspect-[4/3] sm:aspect-square w-full bg-neutral-100 overflow-hidden"
      >
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-neutral-400 bg-neutral-100 text-center">
            <FiShoppingBag className="w-8 h-8 mb-2 text-neutral-300" />
            <span className="text-xs font-medium text-neutral-500">{product.name}</span>
          </div>
        )}

        {/* Quick Details Floating Overlay */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 text-neutral-900 text-xs font-bold shadow-md transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
            <FiEye className="w-3.5 h-3.5" /> View Details
          </span>
        </div>
      </Link>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category & Brand */}
          <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
            <span className="font-medium hover:text-[#FF5722] transition-colors">
              {product.category}
            </span>
            <span className="text-neutral-400 text-[11px]">{product.brand}</span>
          </div>

          {/* Product Title */}
          <Link
            to={`/product/${product.id}`}
            className="block text-sm font-bold text-neutral-900 line-clamp-2 hover:text-[#FF5722] transition-colors leading-snug"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center text-amber-400">
              <FiStar className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="text-xs font-bold text-neutral-800 tabular-nums">
              {product.rating}
            </span>
            <span className="text-[11px] text-neutral-400">
              ({product.reviewsCount})
            </span>
          </div>
        </div>

        {/* Price & Action Section */}
        <div className="pt-2 border-t border-neutral-100 flex items-end justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-neutral-900 tabular-nums">
                {formatPrice(product.price)}
              </span>
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="text-[11px] text-neutral-400 line-through tabular-nums">
                {formatPrice(product.originalPrice)}
              </div>
            )}
            {/* Stock indicators */}
            <div className="pt-0.5">
              {isOutOfStock ? (
                <span className="text-[11px] font-semibold text-rose-600">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="text-[11px] font-semibold text-amber-600">
                  Only {product.stock} left!
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-600">
                  In Stock
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart CTA Button */}
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-200 shadow-sm cursor-pointer ${
              isOutOfStock
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                : addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-900 text-white hover:bg-[#FF5722] active:scale-95'
            }`}
            aria-label={isOutOfStock ? 'Product out of stock' : 'Add to cart'}
          >
            {addedAnimation ? (
              <>
                <FiCheck className="w-3.5 h-3.5" /> Added
              </>
            ) : (
              <>
                <FiShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
