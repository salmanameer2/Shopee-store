import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { normalizeProduct } from './productService.js';

export const ALLOWED_CATEGORIES = ['Men', 'Women', 'Kids', 'Electronic Gadgets'];

export const STOCK_STATUS = {
  OUT_OF_STOCK: 'Out of Stock',
  LOW_STOCK: 'Low Stock',
  NORMAL: 'Normal',
};

/**
 * Returns inventory status classification for a given stock number
 * Rule:
 *   stock <= 0 -> Out of Stock
 *   stock > 0 && stock <= 5 -> Low Stock
 *   stock >= 6 -> Normal / In Stock
 */
export const getStockStatus = (stock) => {
  const num = Number(stock || 0);
  if (num <= 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (num <= 5) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.NORMAL;
};

/**
 * Extracts storage file path from a Supabase product-images public URL
 */
export const extractStoragePathFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const marker = '/product-images/';
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const rawPath = url.substring(idx + marker.length);
    // Strip query parameters if any
    return rawPath.split('?')[0];
  }
  return null;
};

/**
 * Validates product payload before database submission
 */
export const validateProductInput = (data, isNew = true) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Product name is required.';
  }

  if (!data.category || !ALLOWED_CATEGORIES.includes(data.category)) {
    errors.category = `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`;
  }

  if (!data.brand || !data.brand.trim()) {
    errors.brand = 'Brand name is required.';
  }

  if (!data.description || !data.description.trim()) {
    errors.description = 'Product description is required.';
  }

  const priceNum = Number(data.price);
  if (isNaN(priceNum) || priceNum <= 0) {
    errors.price = 'Price must be greater than 0.';
  }

  if (data.originalPrice !== undefined && data.originalPrice !== null && data.originalPrice !== '') {
    const origNum = Number(data.originalPrice);
    if (isNaN(origNum) || origNum < 0) {
      errors.originalPrice = 'Original price cannot be negative.';
    } else if (origNum > 0 && origNum < priceNum) {
      errors.originalPrice = 'Original price must be greater than or equal to current price.';
    }
  }

  const stockNum = Number(data.stock);
  if (data.stock === undefined || data.stock === null || data.stock === '' || isNaN(stockNum)) {
    errors.stock = 'Stock quantity is required.';
  } else if (!Number.isInteger(stockNum) || stockNum < 0) {
    errors.stock = 'Stock must be a non-negative integer (0 or more).';
  }

  if (isNew && (!data.imageUrl || !data.imageUrl.trim())) {
    errors.image = 'Product image is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Calculates derived discount percentage
 * If original_price > price: round(((original_price - price) / original_price) * 100)
 * Else: 0
 */
export const calculateDiscount = (price, originalPrice) => {
  const p = Number(price || 0);
  const orig = Number(originalPrice || 0);
  if (orig > p && orig > 0) {
    return Math.round(((orig - p) / orig) * 100);
  }
  return 0;
};

/**
 * Sanitizes array fields like sizes, colors, tags
 */
export const sanitizeStringArray = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return Array.from(
      new Set(
        input
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      )
    );
  }
  if (typeof input === 'string') {
    return Array.from(
      new Set(
        input
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      )
    );
  }
  return [];
};

/**
 * Fetch all products for admin management with optional filters & search
 * Single source of truth: public.products
 *
 * @param {Object} options
 * @param {string} options.category - 'All' | 'Men' | 'Women' | 'Kids' | 'Electronic Gadgets'
 * @param {string} options.status - 'All' | 'active' | 'inactive'
 * @param {string} options.stockStatus - 'All' | 'normal' | 'low' | 'out_of_stock'
 * @param {string} options.searchTerm - Search by name, brand, or category
 * @param {string} options.sortBy - 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'
 * @returns {Promise<{ success: boolean, data?: Array, error?: string }>}
 */
export const getAdminProducts = async ({
  category = 'All',
  status = 'All',
  stockStatus = 'All',
  searchTerm = '',
  sortBy = 'newest',
} = {}) => {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      error: 'Database connection is not configured.',
    };
  }

  try {
    let query = supabase.from('products').select('*');

    // 1. Category Filter
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    // 2. Active/Inactive Status Filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // 3. Stock Status Filter
    if (stockStatus === 'out_of_stock') {
      query = query.lte('stock', 0);
    } else if (stockStatus === 'low') {
      query = query.gt('stock', 0).lte('stock', 5);
    } else if (stockStatus === 'normal' || stockStatus === 'in_stock') {
      query = query.gte('stock', 6);
    }

    // 4. Search Filter (by name, brand, or category)
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim();
      query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%,category.ilike.%${term}%`);
    }

    // 5. Sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'stock-asc':
        query = query.order('stock', { ascending: true });
        break;
      case 'stock-desc':
        query = query.order('stock', { ascending: false });
        break;
      case 'name-asc':
        query = query.order('name', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin products:', error);
      return {
        success: false,
        error: `Unable to load products: ${error.message}`,
      };
    }

    const normalized = (data || []).map(normalizeProduct);
    return {
      success: true,
      data: normalized,
    };
  } catch (err) {
    console.error('Exception in getAdminProducts:', err);
    return {
      success: false,
      error: 'Unable to load products. Please check your connection and try again.',
    };
  }
};

/**
 * Creates a new product in public.products
 *
 * @param {Object} productData
 * @returns {Promise<{ success: boolean, data?: Object, error?: string, validationErrors?: Object }>}
 */
export const createProduct = async (productData) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database connection is not configured.' };
  }

  const validation = validateProductInput(productData, true);
  if (!validation.isValid) {
    return {
      success: false,
      error: 'Please correct the validation errors in the form.',
      validationErrors: validation.errors,
    };
  }

  try {
    const priceNum = Number(productData.price);
    const origPriceNum =
      productData.originalPrice !== undefined &&
      productData.originalPrice !== null &&
      productData.originalPrice !== ''
        ? Number(productData.originalPrice)
        : null;
    const discount = calculateDiscount(priceNum, origPriceNum);
    const stockNum = Math.max(0, parseInt(productData.stock, 10));

    const insertPayload = {
      name: productData.name.trim(),
      category: productData.category,
      brand: (productData.brand || 'Shopee').trim(),
      description: productData.description.trim(),
      price: priceNum,
      original_price: origPriceNum,
      discount: discount,
      image_url: productData.imageUrl.trim(),
      stock: stockNum,
      rating: 0,
      reviews_count: 0,
      sizes: sanitizeStringArray(productData.sizes),
      colors: sanitizeStringArray(productData.colors),
      tags: sanitizeStringArray(productData.tags),
      featured: Boolean(productData.featured),
      is_new: Boolean(productData.isNew !== undefined ? productData.isNew : true),
      is_active: Boolean(productData.isActive !== undefined ? productData.isActive : true),
    };

    const { data, error } = await supabase
      .from('products')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Error inserting product into Supabase:', error);
      return {
        success: false,
        error: `Failed to create product: ${error.message}`,
      };
    }

    return {
      success: true,
      data: normalizeProduct(data),
    };
  } catch (err) {
    console.error('Exception in createProduct:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while creating the product.',
    };
  }
};

/**
 * Updates an existing product in public.products
 *
 * @param {string} productId - UUID of the product
 * @param {Object} productData
 * @returns {Promise<{ success: boolean, data?: Object, error?: string, validationErrors?: Object }>}
 */
export const updateProduct = async (productId, productData) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database connection is not configured.' };
  }

  if (!productId) {
    return { success: false, error: 'Product ID is required for update.' };
  }

  const validation = validateProductInput(productData, false);
  if (!validation.isValid) {
    return {
      success: false,
      error: 'Please correct the validation errors in the form.',
      validationErrors: validation.errors,
    };
  }

  try {
    const priceNum = Number(productData.price);
    const origPriceNum =
      productData.originalPrice !== undefined &&
      productData.originalPrice !== null &&
      productData.originalPrice !== ''
        ? Number(productData.originalPrice)
        : null;
    const discount = calculateDiscount(priceNum, origPriceNum);
    const stockNum = Math.max(0, parseInt(productData.stock, 10));

    const updatePayload = {
      name: productData.name.trim(),
      category: productData.category,
      brand: (productData.brand || 'Shopee').trim(),
      description: productData.description.trim(),
      price: priceNum,
      original_price: origPriceNum,
      discount: discount,
      stock: stockNum,
      sizes: sanitizeStringArray(productData.sizes),
      colors: sanitizeStringArray(productData.colors),
      tags: sanitizeStringArray(productData.tags),
      featured: Boolean(productData.featured),
      is_new: Boolean(productData.isNew),
      is_active: Boolean(productData.isActive),
      updated_at: new Date().toISOString(),
    };

    if (productData.imageUrl && productData.imageUrl.trim()) {
      updatePayload.image_url = productData.imageUrl.trim();
    }

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product in Supabase:', error);
      return {
        success: false,
        error: `Failed to update product: ${error.message}`,
      };
    }

    return {
      success: true,
      data: normalizeProduct(data),
    };
  } catch (err) {
    console.error('Exception in updateProduct:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while updating the product.',
    };
  }
};

/**
 * Quickly updates product stock quantity
 *
 * @param {string} productId
 * @param {number|string} newStock
 * @returns {Promise<{ success: boolean, stock?: number, error?: string }>}
 */
export const updateProductStock = async (productId, newStock) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database connection is not configured.' };
  }

  const stockNum = Number(newStock);
  if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
    return { success: false, error: 'Stock must be a non-negative integer (0 or higher).' };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        stock: stockNum,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select('id, stock')
      .single();

    if (error) {
      console.error('Error updating stock in Supabase:', error);
      return { success: false, error: `Failed to update stock: ${error.message}` };
    }

    return { success: true, stock: data.stock };
  } catch (err) {
    console.error('Exception in updateProductStock:', err);
    return { success: false, error: 'An unexpected error occurred while updating stock.' };
  }
};

/**
 * Toggles product is_active status (deactivate / reactivate)
 *
 * @param {string} productId
 * @param {boolean} isActive
 * @returns {Promise<{ success: boolean, isActive?: boolean, error?: string }>}
 */
export const setProductActive = async (productId, isActive) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database connection is not configured.' };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .update({
        is_active: Boolean(isActive),
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select('id, is_active')
      .single();

    if (error) {
      console.error('Error changing product status:', error);
      return { success: false, error: `Failed to update status: ${error.message}` };
    }

    return { success: true, isActive: data.is_active };
  } catch (err) {
    console.error('Exception in setProductActive:', err);
    return { success: false, error: 'An error occurred while updating product status.' };
  }
};

/**
 * Deletes a product safely.
 * Checks whether the product is referenced in historical customer order items.
 * If referenced, blocks deletion and advises deactivation to protect order integrity.
 *
 * @param {string} productId
 * @param {string} [imageUrl] - Optional current image URL to clean up if unused
 * @returns {Promise<{ success: boolean, error?: string, blockedByOrders?: boolean }>}
 */
export const deleteProduct = async (productId, imageUrl = null) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database connection is not configured.' };
  }

  try {
    // 1. Check for historical order items referencing this product
    const { count: orderItemsCount, error: checkError } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);

    if (checkError) {
      console.warn('Warning during order items reference check:', checkError.message);
    }

    if (orderItemsCount && orderItemsCount > 0) {
      return {
        success: false,
        blockedByOrders: true,
        error: `Cannot delete product: It is referenced in ${orderItemsCount} historical customer order item(s). To preserve order audit history, please deactivate the product instead.`,
      };
    }

    // 2. Clean up any active cart items for this product
    try {
      await supabase.from('cart_items').delete().eq('product_id', productId);
    } catch (cartErr) {
      console.warn('Note: Cart items cleanup notice:', cartErr);
    }

    // 3. Delete product from public.products
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      console.error('Error deleting product from Supabase:', deleteError);
      return {
        success: false,
        error: `Failed to delete product: ${deleteError.message}`,
      };
    }

    // 4. Clean up storage image if it was hosted in product-images
    if (imageUrl) {
      const storagePath = extractStoragePathFromUrl(imageUrl);
      if (storagePath) {
        deleteProductImage(storagePath).catch((cleanErr) => {
          console.warn('Notice: Image cleanup skipped or non-critical error:', cleanErr);
        });
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in deleteProduct:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the product.',
    };
  }
};

/**
 * Uploads a product image file to the Supabase Storage 'product-images' bucket
 *
 * @param {File} file - Browser File object
 * @returns {Promise<{ success: boolean, publicUrl?: string, path?: string, error?: string }>}
 */
export const uploadProductImage = async (file) => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database connection is not configured.' };
  }

  if (!file) {
    return { success: false, error: 'No file selected for upload.' };
  }

  // 1. Validate file type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid file format. Please upload a JPEG, PNG, WebP, GIF, or SVG image.',
    };
  }

  // 2. Validate file size (max 5MB)
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      success: false,
      error: 'File size exceeds 5MB limit. Please upload an image under 5MB.',
    };
  }

  try {
    // 3. Generate collision-resistant unique filename
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const sanitizedBase = file.name
      .split('.')[0]
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 20);
    const filePath = `${timestamp}_${sanitizedBase}_${randomSuffix}.${extension}`;

    // 4. Upload to product-images bucket
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading product image to Supabase Storage:', error);
      return {
        success: false,
        error: `Image upload failed: ${error.message}`,
      };
    }

    // 5. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return {
      success: true,
      publicUrl: publicUrlData.publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error('Exception in uploadProductImage:', err);
    return {
      success: false,
      error: 'An unexpected error occurred during image upload.',
    };
  }
};

/**
 * Removes an image from the product-images storage bucket safely
 *
 * @param {string} pathOrUrl - Storage relative path or full public URL
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const deleteProductImage = async (pathOrUrl) => {
  if (!isSupabaseConfigured() || !supabase || !pathOrUrl) {
    return { success: false };
  }

  try {
    const path = pathOrUrl.includes('http')
      ? extractStoragePathFromUrl(pathOrUrl)
      : pathOrUrl;

    if (!path) return { success: false };

    const { error } = await supabase.storage.from('product-images').remove([path]);
    if (error) {
      console.warn('Warning deleting storage image:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.warn('Exception during image removal:', err);
    return { success: false };
  }
};

/**
 * Replaces an existing product image:
 * 1. Uploads new image to product-images
 * 2. If successful, gets new public URL
 * 3. Attempts safe deletion of old image if it resided in product-images
 *
 * @param {File} newFile
 * @param {string} [oldImageUrl]
 * @returns {Promise<{ success: boolean, publicUrl?: string, path?: string, error?: string }>}
 */
export const replaceProductImage = async (newFile, oldImageUrl = null) => {
  const uploadResult = await uploadProductImage(newFile);
  if (!uploadResult.success) {
    return uploadResult;
  }

  // Attempt old file cleanup safely in background (does not fail the new upload)
  if (oldImageUrl) {
    deleteProductImage(oldImageUrl).catch((err) => {
      console.warn('Notice: Background cleanup of replaced image encountered an issue:', err);
    });
  }

  return uploadResult;
};

export default {
  ALLOWED_CATEGORIES,
  STOCK_STATUS,
  getStockStatus,
  calculateDiscount,
  validateProductInput,
  getAdminProducts,
  createProduct,
  updateProduct,
  updateProductStock,
  setProductActive,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
  replaceProductImage,
};
