/**
 * Utility helper functions for Shopee Storefront
 */

/**
 * Format numerical price into Pakistani Rupee (PKR) standard format
 * e.g., 2499 -> "Rs. 2,499"
 */
export const formatPrice = (amount) => {
  if (amount === undefined || amount === null) return 'Rs. 0';
  const num = Number(amount);
  return `Rs. ${num.toLocaleString('en-PK')}`;
};

/**
 * Format currency with custom prefix (defaults to PKR)
 */
export const formatCurrency = (amount, currency = 'PKR') => {
  if (amount === undefined || amount === null) return `${currency} 0`;
  const num = Number(amount);
  return `${currency} ${num.toLocaleString('en-PK')}`;
};

/**
 * Calculate discounted price from original price and percentage
 */
export const calculateDiscount = (originalPrice, currentPrice) => {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

export default {
  formatPrice,
  formatCurrency,
  calculateDiscount,
};
