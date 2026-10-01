import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiUploadCloud,
  FiImage,
  FiCheck,
  FiAlertCircle,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiTag,
  FiLayers,
} from 'react-icons/fi';
import Button from '../common/Button.jsx';
import {
  ALLOWED_CATEGORIES,
  calculateDiscount,
  uploadProductImage,
  replaceProductImage,
} from '../../services/adminProductService.js';
import { formatPrice } from '../../utils/index.js';

export default function ProductForm({
  isOpen,
  onClose,
  onSubmit,
  initialProduct = null,
  isSubmitting = false,
}) {
  const isEditing = Boolean(initialProduct?.id);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Men',
    brand: 'Shopee Studio',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    imageUrl: '',
    sizes: [],
    colors: [],
    tags: [],
    featured: false,
    isNew: true,
    isActive: true,
  });

  // Array Chip Inputs Temporary State
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  // Populate or reset form whenever initialProduct changes or modal opens
  useEffect(() => {
    if (initialProduct && isEditing) {
      setFormData({
        name: initialProduct.name || '',
        category: initialProduct.category || 'Men',
        brand: initialProduct.brand || 'Shopee',
        description: initialProduct.description || '',
        price: initialProduct.price !== undefined ? String(initialProduct.price) : '',
        originalPrice:
          initialProduct.originalPrice !== undefined && initialProduct.originalPrice !== null
            ? String(initialProduct.originalPrice)
            : '',
        stock: initialProduct.stock !== undefined ? String(initialProduct.stock) : '0',
        imageUrl: initialProduct.imageUrl || initialProduct.image || '',
        sizes: Array.isArray(initialProduct.sizes) ? [...initialProduct.sizes] : [],
        colors: Array.isArray(initialProduct.colors) ? [...initialProduct.colors] : [],
        tags: Array.isArray(initialProduct.tags) ? [...initialProduct.tags] : [],
        featured: Boolean(initialProduct.featured),
        isNew: Boolean(initialProduct.isNew),
        isActive: initialProduct.isActive !== undefined ? Boolean(initialProduct.isActive) : true,
      });
      setImagePreview(initialProduct.imageUrl || initialProduct.image || '');
    } else {
      setFormData({
        name: '',
        category: 'Men',
        brand: 'Shopee Studio',
        description: '',
        price: '',
        originalPrice: '',
        stock: '10',
        imageUrl: '',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'White', 'Navy'],
        tags: ['New Arrival'],
        featured: false,
        isNew: true,
        isActive: true,
      });
      setImagePreview('');
    }
    setImageFile(null);
    setImageUploadError('');
    setErrors({});
  }, [initialProduct, isEditing, isOpen]);

  if (!isOpen) return null;

  // Handle simple input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Live discount preview calculation
  const computedDiscount = calculateDiscount(formData.price, formData.originalPrice);

  // Array Add / Remove helpers
  const handleAddChip = (field, value, setter) => {
    if (!value || !value.trim()) return;
    const clean = value.trim();
    if (!formData[field].includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], clean],
      }));
    }
    setter('');
  };

  const handleRemoveChip = (field, indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== indexToRemove),
    }));
  };

  // Image Selection & Auto-Upload
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImageUploadError('');

    // Local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    // Auto-upload file to Supabase storage bucket
    setUploadingImage(true);
    try {
      let res;
      if (isEditing && initialProduct?.imageUrl) {
        res = await replaceProductImage(file, initialProduct.imageUrl);
      } else {
        res = await uploadProductImage(file);
      }

      if (res.success && res.publicUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: res.publicUrl }));
        setImagePreview(res.publicUrl);
        if (errors.image) {
          setErrors((prev) => {
            const copy = { ...prev };
            delete copy.image;
            return copy;
          });
        }
      } else {
        setImageUploadError(res.error || 'Failed to upload image. Please try again.');
      }
    } catch (err) {
      console.error('Upload exception:', err);
      setImageUploadError('Network error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Form Validation & Submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required.';
    }

    if (!formData.category || !ALLOWED_CATEGORIES.includes(formData.category)) {
      newErrors.category = 'Please select a valid category.';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required.';
    }

    const priceNum = Number(formData.price);
    if (!formData.price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = 'Price must be a valid number greater than 0.';
    }

    if (formData.originalPrice !== '' && formData.originalPrice !== null) {
      const origNum = Number(formData.originalPrice);
      if (isNaN(origNum) || origNum < 0) {
        newErrors.originalPrice = 'Original price cannot be negative.';
      } else if (origNum > 0 && origNum < priceNum) {
        newErrors.originalPrice = 'Original price must be greater than or equal to current price.';
      }
    }

    const stockNum = Number(formData.stock);
    if (formData.stock === '' || isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
      newErrors.stock = 'Stock must be a non-negative integer (0 or more).';
    }

    if (!formData.imageUrl.trim()) {
      newErrors.image = 'Product image is required. Please upload an image.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Call submit with validated clean payload
    onSubmit({
      ...formData,
      price: priceNum,
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
      stock: stockNum,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isEditing
                ? 'Update catalog details, pricing, stock, and imagery'
                : 'Create and publish a new item to the store catalog'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-800">
              <FiTag className="w-3.5 h-3.5 text-[#FF5722]" /> General Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Classic Oxford Slim-Fit Button Down Shirt"
                  className={`w-full bg-neutral-950 border ${
                    errors.name ? 'border-rose-500' : 'border-neutral-800 focus:border-[#FF5722]'
                  } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-colors`}
                />
                {errors.name && <p className="text-[11px] text-rose-400">{errors.name}</p>}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                >
                  {ALLOWED_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-[11px] text-rose-400">{errors.category}</p>}
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Shopee Studio"
                  className={`w-full bg-neutral-950 border ${
                    errors.brand ? 'border-rose-500' : 'border-neutral-800 focus:border-[#FF5722]'
                  } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-colors`}
                />
                {errors.brand && <p className="text-[11px] text-rose-400">{errors.brand}</p>}
              </div>

              {/* Description */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description of features, materials, and highlights..."
                  className={`w-full bg-neutral-950 border ${
                    errors.description
                      ? 'border-rose-500'
                      : 'border-neutral-800 focus:border-[#FF5722]'
                  } rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none transition-colors resize-none`}
                />
                {errors.description && (
                  <p className="text-[11px] text-rose-400">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Pricing & Inventory */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-800">
              <FiLayers className="w-3.5 h-3.5 text-[#FF5722]" /> Pricing & Stock
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Current Price (PKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  min="1"
                  step="1"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g. 2499"
                  className={`w-full bg-neutral-950 border ${
                    errors.price ? 'border-rose-500' : 'border-neutral-800 focus:border-[#FF5722]'
                  } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-colors`}
                />
                {errors.price && <p className="text-[11px] text-rose-400">{errors.price}</p>}
              </div>

              {/* Original Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Original Price (PKR)
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  min="0"
                  step="1"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  placeholder="Optional (e.g. 3499)"
                  className={`w-full bg-neutral-950 border ${
                    errors.originalPrice
                      ? 'border-rose-500'
                      : 'border-neutral-800 focus:border-[#FF5722]'
                  } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-colors`}
                />
                {errors.originalPrice && (
                  <p className="text-[11px] text-rose-400">{errors.originalPrice}</p>
                )}
                {computedDiscount > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <FiCheck className="w-3 h-3" /> Auto-calculated discount: {computedDiscount}% OFF
                  </span>
                )}
              </div>

              {/* Stock Quantity */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Initial Stock <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="stock"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="e.g. 15"
                  className={`w-full bg-neutral-950 border ${
                    errors.stock ? 'border-rose-500' : 'border-neutral-800 focus:border-[#FF5722]'
                  } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none transition-colors`}
                />
                {errors.stock && <p className="text-[11px] text-rose-400">{errors.stock}</p>}
                <p className="text-[10px] text-neutral-500">
                  {Number(formData.stock) <= 0
                    ? 'Status: Out of Stock'
                    : Number(formData.stock) <= 5
                    ? 'Status: Low Stock (<= 5)'
                    : 'Status: Normal Stock'}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Product Image Upload */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-800">
              <FiImage className="w-3.5 h-3.5 text-[#FF5722]" /> Product Image <span className="text-rose-500">*</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* Image Preview Box */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-2 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-36 object-contain rounded-xl"
                  />
                ) : (
                  <div className="text-center p-4 text-neutral-600 space-y-1">
                    <FiImage className="w-8 h-8 mx-auto" />
                    <p className="text-[11px]">No image selected</p>
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <FiRefreshCw className="w-5 h-5 text-[#FF5722] animate-spin" />
                    <span className="text-[11px] text-neutral-300 font-semibold">
                      Uploading to Storage...
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="sm:col-span-2 space-y-3">
                <label className="border-2 border-dashed border-neutral-800 hover:border-[#FF5722]/50 bg-neutral-950 hover:bg-neutral-900/40 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
                  <FiUploadCloud className="w-6 h-6 text-neutral-400 group-hover:text-[#FF5722] transition-colors" />
                  <p className="text-xs font-bold text-white mt-1">
                    Click to browse or drop product photo
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    JPG, PNG, WebP or SVG up to 5MB (stored in bucket: <code className="text-neutral-400">product-images</code>)
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={handleImageFileChange}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>

                {/* Direct Image URL input for flexibility */}
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-400">Or use public Image URL</label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      handleChange(e);
                      setImagePreview(e.target.value);
                    }}
                    placeholder="https://..."
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                  />
                </div>

                {imageUploadError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {imageUploadError}
                  </p>
                )}
                {errors.image && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {errors.image}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 4. Sizes, Colors & Tags */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-neutral-800">
              <FiTag className="w-3.5 h-3.5 text-[#FF5722]" /> Sizes, Colors & Tags
            </h3>

            {/* Sizes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Available Sizes
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChip('sizes', sizeInput, setSizeInput);
                    }
                  }}
                  placeholder="e.g. S, M, L, XL, 32, 42mm"
                  className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddChip('sizes', sizeInput, setSizeInput)}
                  className="border-neutral-800 bg-neutral-800 hover:bg-neutral-700 text-xs"
                >
                  <FiPlus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                {formData.sizes.map((sz, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-neutral-800 text-neutral-200 border border-neutral-700"
                  >
                    {sz}
                    <button
                      type="button"
                      onClick={() => handleRemoveChip('sizes', idx)}
                      className="text-neutral-400 hover:text-rose-400 ml-0.5"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Available Colors
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChip('colors', colorInput, setColorInput);
                    }
                  }}
                  placeholder="e.g. Navy, Jet Black, Forest Green"
                  className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddChip('colors', colorInput, setColorInput)}
                  className="border-neutral-800 bg-neutral-800 hover:bg-neutral-700 text-xs"
                >
                  <FiPlus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                {formData.colors.map((col, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-neutral-800 text-neutral-200 border border-neutral-700"
                  >
                    {col}
                    <button
                      type="button"
                      onClick={() => handleRemoveChip('colors', idx)}
                      className="text-neutral-400 hover:text-rose-400 ml-0.5"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Tags & Keywords
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChip('tags', tagInput, setTagInput);
                    }
                  }}
                  placeholder="e.g. Bestseller, Summer, Wireless, Formal"
                  className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-[#FF5722] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddChip('tags', tagInput, setTagInput)}
                  className="border-neutral-800 bg-neutral-800 hover:bg-neutral-700 text-xs"
                >
                  <FiPlus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[26px]">
                {formData.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-neutral-800 text-neutral-200 border border-neutral-700"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveChip('tags', idx)}
                      className="text-neutral-400 hover:text-rose-400 ml-0.5"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Toggles: Featured, Is New, Is Active */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider pb-1 border-b border-neutral-800">
              Visibility & Flags
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Active / Inactive */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#FF5722] focus:ring-[#FF5722] bg-neutral-900 border-neutral-700"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Active Status</span>
                  <span className="text-[10px] text-neutral-400">
                    {formData.isActive ? 'Visible in store' : 'Hidden from store'}
                  </span>
                </div>
              </label>

              {/* Featured */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#FF5722] focus:ring-[#FF5722] bg-neutral-900 border-neutral-700"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Featured</span>
                  <span className="text-[10px] text-neutral-400">Highlighted on Home</span>
                </div>
              </label>

              {/* Is New */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="isNew"
                  checked={formData.isNew}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-[#FF5722] focus:ring-[#FF5722] bg-neutral-900 border-neutral-700"
                />
                <div>
                  <span className="text-xs font-bold text-white block">New Arrival</span>
                  <span className="text-[10px] text-neutral-400">Show &apos;NEW&apos; badge</span>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-end gap-3 sticky bottom-0">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting || uploadingImage}
            className="border-neutral-800 bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700 text-xs font-bold"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingImage}
            className="text-xs font-bold gap-2 min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiCheck className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save Changes' : 'Create Product'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
