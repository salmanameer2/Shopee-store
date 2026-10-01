import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { getStockStatus, STOCK_STATUS } from '../../services/adminProductService.js';

export default function StockStatusBadge({ stock, showUnits = false, size = 'sm' }) {
  const stockNum = Number(stock || 0);
  const status = getStockStatus(stockNum);

  const sizeClasses =
    size === 'xs'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-xs';

  if (status === STOCK_STATUS.OUT_OF_STOCK) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}
        title={`Out of stock (${stockNum} units)`}
      >
        <FiXCircle className="w-3 h-3 flex-shrink-0" />
        <span>Out of Stock</span>
        {showUnits && <span className="opacity-80 font-mono">(0)</span>}
      </span>
    );
  }

  if (status === STOCK_STATUS.LOW_STOCK) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}
        title={`Low stock (${stockNum} units remaining)`}
      >
        <FiAlertTriangle className="w-3 h-3 flex-shrink-0" />
        <span>Low Stock</span>
        {showUnits && <span className="opacity-90 font-mono font-bold">({stockNum})</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}
      title={`Normal stock (${stockNum} units)`}
    >
      <FiCheckCircle className="w-3 h-3 flex-shrink-0" />
      <span>In Stock</span>
      {showUnits && <span className="opacity-80 font-mono">({stockNum})</span>}
    </span>
  );
}
