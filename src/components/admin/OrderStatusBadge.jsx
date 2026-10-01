import React from 'react';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiCheck,
  FiPackage,
} from 'react-icons/fi';
import { ORDER_STATUS_CONFIG } from '../../services/adminOrderService.js';

export default function OrderStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) {
  const normStatus = (status || 'pending').toLowerCase();
  const config = ORDER_STATUS_CONFIG[normStatus] || {
    label: normStatus,
    badgeClass: 'bg-neutral-800 text-neutral-400 border border-neutral-700',
  };

  const getIcon = () => {
    switch (normStatus) {
      case 'pending':
        return <FiClock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      case 'confirmed':
        return <FiPackage className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      case 'completed':
        return <FiCheckCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      case 'cancelled':
        return <FiXCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      case 'rejected':
        return <FiAlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      default:
        return <FiClock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
    }
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full uppercase tracking-wider border transition-colors ${
        config.badgeClass
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
      title={config.description}
    >
      {showIcon && getIcon()}
      <span>{config.label}</span>
    </span>
  );
}
