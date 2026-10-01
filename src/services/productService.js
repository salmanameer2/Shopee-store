import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { products as referenceProducts } from '../assets/assets.js';

/**
 * Category Slug <-> Database Category Name Mapper
 */
const CATEGORY_MAP = {
  men: 'Men',
  women: 'Women',
  kids: 'Kids',
  'electronic-gadgets': 'Electronic Gadgets',
};

export const normalizeCategorySlug = (slug) => {
  if (!slug) return '';
  return CATEGORY_MAP[slug.toLowerCase()] || slug;
};

export const categoryToSlug = (category) => {
  if (!category) return '';
  return category.toLowerCase().replace(/\s+/g, '-');
};

/**
 * Normalizes a raw database product row into clean camelCase format
 * compatible with all React UI components
 */
export const normalizeProduct = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categorySlug: categoryToSlug(row.category),
    brand: row.brand || 'Shopee',
    description: row.description || '',
    price: Number(row.price || 0),
    originalPrice: row.original_price ? Number(row.original_price) : null,
    discount: row.discount ? Number(row.discount) : 0,
    image: row.image_url || row.image || '',
    imageUrl: row.image_url || '',
    stock: Number(row.stock || 0),
    rating: Number(row.rating || 0),
    reviewsCount: Number(row.reviews_count || row.reviewsCount || 0),
    sizes: row.sizes || [],
    colors: row.colors || [],
    tags: row.tags || [],
    featured: Boolean(row.featured),
    isNew: Boolean(row.is_new !== undefined ? row.is_new : row.isNew),
    isActive: Boolean(row.is_active !== undefined ? row.is_active : row.isActive),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
};

/**
 * Fallback in-memory search/filter for when Supabase is not configured yet
 */
const fallbackFilter = ({ category, searchTerm, inStockOnly, sortBy, limit }) => {
  let list = [...referenceProducts];

  if (category && category !== 'All') {
    const targetCat = normalizeCategorySlug(category);
    list = list.filter((p) => p.category.toLowerCase() === targetCat.toLowerCase());
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(term)))
    );
  }

  if (inStockOnly) {
    list = list.filter((p) => p.stock > 0);
  }

  switch (sortBy) {
    case 'price-low':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      list.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      break;
    default:
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
  }

  if (limit && limit > 0) {
    list = list.slice(0, limit);
  }

  return list.map(normalizeProduct);
};

/**
 * Fetch all active products from Supabase with optional filters & sorting
 */
export const getProducts = async ({
  category = 'All',
  searchTerm = '',
  inStockOnly = false,
  sortBy = 'featured',
  limit = null,
} = {}) => {
  // If Supabase is not connected in the environment, use safe normalized fallback
  if (!isSupabaseConfigured() || !supabase) {
    return fallbackFilter({ category, searchTerm, inStockOnly, sortBy, limit });
  }

  try {
    let query = supabase.from('products').select('*').eq('is_active', true);

    if (category && category !== 'All') {
      const normalizedCat = normalizeCategorySlug(category);
      query = query.eq('category', normalizedCat);
    }

    if (inStockOnly) {
      query = query.gt('stock', 0);
    }

    if (searchTerm && searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      query = query.or(`name.ilike.${term},brand.ilike.${term},description.ilike.${term}`);
    }

    switch (sortBy) {
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
        break;
    }

    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase query error:', error.message);
      throw error;
    }

    return (data || []).map(normalizeProduct);
  } catch (err) {
    console.warn('Supabase request failed:', err);
    throw err;
  }
};

/**
 * Fetch a single product by UUID or ID
 */
export const getProductById = async (id) => {
  if (!id) return null;

  if (!isSupabaseConfigured() || !supabase) {
    const found = referenceProducts.find((p) => p.id === id);
    return normalizeProduct(found);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching product from Supabase:', error.message);
      throw error;
    }

    if (!data) {
      return null;
    }

    return normalizeProduct(data);
  } catch (err) {
    console.warn('Exception in getProductById:', err);
    throw err;
  }
};

/**
 * Fetch products for a specific category slug (men, women, kids, electronic-gadgets)
 */
export const getProductsByCategory = async (categorySlug, options = {}) => {
  const categoryName = normalizeCategorySlug(categorySlug);
  return getProducts({ ...options, category: categoryName });
};

/**
 * Fetch featured products for homepage/showcase
 */
export const getFeaturedProducts = async (limit = 4) => {
  if (!isSupabaseConfigured() || !supabase) {
    return referenceProducts
      .filter((p) => p.featured)
      .slice(0, limit)
      .map(normalizeProduct);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('featured', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching featured products:', error.message);
      return [];
    }

    return (data || []).map(normalizeProduct);
  } catch (err) {
    console.warn('Exception in getFeaturedProducts:', err);
    return [];
  }
};

/**
 * Fetch New Arrival products
 */
export const getNewArrivals = async (limit = 4) => {
  if (!isSupabaseConfigured() || !supabase) {
    return referenceProducts
      .filter((p) => p.isNew || p.featured)
      .slice(0, limit)
      .map(normalizeProduct);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .or('is_new.eq.true,featured.eq.true')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching new arrivals:', error.message);
      return [];
    }

    return (data || []).map(normalizeProduct);
  } catch (err) {
    console.warn('Exception in getNewArrivals:', err);
    return [];
  }
};

/**
 * Fetch Best Seller products (highest rated)
 */
export const getBestSellers = async (limit = 4) => {
  if (!isSupabaseConfigured() || !supabase) {
    return referenceProducts
      .filter((p) => p.rating >= 4.8)
      .slice(0, limit)
      .map(normalizeProduct);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching best sellers:', error.message);
      return [];
    }

    return (data || []).map(normalizeProduct);
  } catch (err) {
    console.warn('Exception in getBestSellers:', err);
    return [];
  }
};

/**
 * Fetch related products from the same category
 */
export const getRelatedProducts = async (category, currentProductId, limit = 4) => {
  if (!category) return [];

  if (!isSupabaseConfigured() || !supabase) {
    return referenceProducts
      .filter((p) => p.category === category && p.id !== currentProductId)
      .slice(0, limit)
      .map(normalizeProduct);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .neq('id', currentProductId)
      .limit(limit);

    if (error) {
      console.warn('Error fetching related products:', error.message);
      return [];
    }

    return (data || []).map(normalizeProduct);
  } catch (err) {
    console.warn('Exception in getRelatedProducts:', err);
    return [];
  }
};

export default {
  getProducts,
  getProductById,
  getProductsByCategory,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getRelatedProducts,
  normalizeCategorySlug,
  categoryToSlug,
  normalizeProduct,
};
