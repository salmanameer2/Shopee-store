import React, { useState } from 'react';
import {
  FiX,
  FiShoppingBag,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiClock,
  FiCopy,
  FiCheck,
  FiLayers,
  FiTruck,
} from 'react-icons/fi';
import Button from '../common/Button.jsx';
import OrderStatusBadge from './OrderStatusBadge.jsx';
import { formatPrice } from '../../utils/index.js';
import {
  ORDER_STATUS_CONFIG,
  ALLOWED_STATUS_TRANSITIONS,
} from '../../services/adminOrderService.js';

export default function OrderDetailsModal({
  isOpen,
  order,
  onClose,
  onStatusUpdate,
  isUpdating = false,
}) {
  const [copied, setCopied] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const currentStatus = (order.status || 'pending').toLowerCase();
  const allowedNextTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  const isTerminalStatus = allowedNextTransitions.length === 0;

  // Handle Action Trigger
  const handleTriggerAction = (targetStatus) => {
    if (!allowedNextTransitions.includes(targetStatus)) return;
    setSelectedNewStatus(targetStatus);
    setShowStatusConfirm(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedNewStatus) return;
    await onStatusUpdate(order.id, selectedNewStatus);
    setShowStatusConfirm(false);
    setSelectedNewStatus('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-20">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5722]/10 border border-[#FF5722]/20 flex items-center justify-center text-[#FF5722]">
              <FiShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Order Details
                </h2>
                <OrderStatusBadge status={currentStatus} size="sm" />
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mt-0.5">
                <span>ID: {order.id}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="p-1 hover:text-white transition-colors"
                  title="Copy full UUID"
                >
                  {copied ? (
                    <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <FiCopy className="w-3.5 h-3.5" />
                  )}
                </button>
                {copied && (
                  <span className="text-[10px] text-emerald-400 font-sans">
                    Copied!
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
            aria-label="Close dialog"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Fulfillment Status Banner / Workflow Progress */}
          <div className="bg-neutral-950/70 rounded-2xl border border-neutral-800/80 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Fulfillment Status
                </p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {ORDER_STATUS_CONFIG[currentStatus]?.description || currentStatus}
                </p>
              </div>

              {/* Order Timestamps */}
              <div className="text-left sm:text-right text-xs text-neutral-400">
                <p>Placed: <span className="text-neutral-200 font-medium">{formatDate(order.createdAt)}</span></p>
                {order.updatedAt && (
                  <p className="mt-0.5">Updated: <span className="text-neutral-300 font-medium">{formatDate(order.updatedAt)}</span></p>
                )}
              </div>
            </div>

            {/* Visual Workflow Steps (Placed -> Confirmed -> Completed) */}
            <div className="pt-4">
              {['cancelled', 'rejected'].includes(currentStatus) ? (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs">
                  <FiAlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block text-white">
                      Order Status: {currentStatus} (Terminal State)
                    </span>
                    <span className="text-neutral-400">
                      This order is in terminal state. No further status changes are permitted.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 relative">
                  {/* Step 1: Placed */}
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-emerald-500/20">
                      <FiCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Order Placed</p>
                      <p className="text-[10px] text-neutral-400">Cash on Delivery</p>
                    </div>
                  </div>

                  {/* Step 2: Confirmed */}
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        ['confirmed', 'completed'].includes(currentStatus)
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      {['confirmed', 'completed'].includes(currentStatus) ? (
                        <FiCheck className="w-4 h-4" />
                      ) : (
                        <FiClock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold ${
                          ['confirmed', 'completed'].includes(currentStatus)
                            ? 'text-white'
                            : 'text-neutral-400'
                        }`}
                      >
                        Confirmed
                      </p>
                      <p className="text-[10px] text-neutral-500">Ready for delivery</p>
                    </div>
                  </div>

                  {/* Step 3: Completed */}
                  <div className="flex flex-col items-center text-center space-y-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        currentStatus === 'completed'
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      {currentStatus === 'completed' ? (
                        <FiCheck className="w-4 h-4" />
                      ) : (
                        <FiTruck className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold ${
                          currentStatus === 'completed'
                            ? 'text-emerald-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        Completed
                      </p>
                      <p className="text-[10px] text-neutral-500">Delivered &amp; Paid</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Status Workflow Action Buttons (Filtered to allowed transitions only) */}
            <div className="mt-5 pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 mr-1">
                  Actions:
                </span>

                {isTerminalStatus ? (
                  <span className="text-xs text-neutral-500 italic">
                    No status actions available (Terminal state).
                  </span>
                ) : (
                  <>
                    {/* If Pending: Allowed transitions are confirmed, rejected, cancelled */}
                    {currentStatus === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleTriggerAction('confirmed')}
                          disabled={isUpdating}
                          className="bg-sky-600 hover:bg-sky-500 text-white gap-1.5 text-xs font-bold shadow-md shadow-sky-600/20"
                        >
                          <FiCheckCircle className="w-3.5 h-3.5" /> Confirm Order
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTriggerAction('rejected')}
                          disabled={isUpdating}
                          className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 gap-1.5 text-xs font-bold"
                        >
                          <FiAlertTriangle className="w-3.5 h-3.5" /> Reject
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTriggerAction('cancelled')}
                          disabled={isUpdating}
                          className="text-neutral-400 hover:text-white hover:bg-neutral-800 gap-1.5 text-xs font-bold"
                        >
                          <FiXCircle className="w-3.5 h-3.5" /> Cancel
                        </Button>
                      </>
                    )}

                    {/* If Confirmed: Allowed transitions are completed, cancelled */}
                    {currentStatus === 'confirmed' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleTriggerAction('completed')}
                          disabled={isUpdating}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs font-bold shadow-md shadow-emerald-600/20"
                        >
                          <FiCheck className="w-3.5 h-3.5" /> Mark Completed (Paid)
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTriggerAction('cancelled')}
                          disabled={isUpdating}
                          className="border-neutral-700 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 gap-1.5 text-xs font-bold"
                        >
                          <FiXCircle className="w-3.5 h-3.5" /> Cancel Order
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Change Confirmation Sub-panel */}
          {showStatusConfirm && (
            <div className="bg-neutral-950 border border-[#FF5722]/40 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiAlertTriangle className="w-4 h-4 text-[#FF5722]" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Confirm Status Change
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStatusConfirm(false)}
                  className="text-neutral-400 hover:text-white text-xs"
                >
                  Dismiss
                </button>
              </div>

              <p className="text-xs text-neutral-300">
                Are you sure you want to change order status from{' '}
                <span className="font-bold text-white uppercase">{currentStatus}</span> to{' '}
                <span className="font-bold text-[#FF5722] uppercase">{selectedNewStatus}</span>?
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStatusConfirm(false)}
                  disabled={isUpdating}
                  className="text-xs border-neutral-700 text-neutral-300"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmStatusChange}
                  loading={isUpdating}
                  className="text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white"
                >
                  Confirm &amp; Update
                </Button>
              </div>
            </div>
          )}

          {/* Grid Layout: Customer & Shipping (Left) + Items & Finances (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Customer, Shipping & Payment (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Customer Information Card */}
              <div className="bg-neutral-950/60 rounded-2xl border border-neutral-800 p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-800 text-white font-bold text-xs uppercase tracking-wider">
                  <FiUser className="w-4 h-4 text-[#FF5722]" />
                  <span>Customer Details</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Recipient Name</span>
                    <span className="font-bold text-white text-sm">{order.shippingName}</span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[11px]">Contact Phone</span>
                    <a
                      href={`tel:${order.shippingPhone}`}
                      className="font-semibold text-[#FF5722] hover:underline inline-flex items-center gap-1.5"
                    >
                      <FiPhone className="w-3.5 h-3.5" />
                      <span>{order.shippingPhone}</span>
                    </a>
                  </div>

                  {order.customerProfile?.email && (
                    <div>
                      <span className="text-neutral-400 block text-[11px]">Account Email</span>
                      <a
                        href={`mailto:${order.customerProfile.email}`}
                        className="text-neutral-200 hover:text-white hover:underline inline-flex items-center gap-1.5"
                      >
                        <FiMail className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{order.customerProfile.email}</span>
                      </a>
                    </div>
                  )}

                  <div>
                    <span className="text-neutral-400 block text-[11px]">Customer User ID</span>
                    <span className="font-mono text-[11px] text-neutral-400 truncate block">
                      {order.userId || 'Guest / Not Registered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address Card */}
              <div className="bg-neutral-950/60 rounded-2xl border border-neutral-800 p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-800 text-white font-bold text-xs uppercase tracking-wider">
                  <FiMapPin className="w-4 h-4 text-[#FF5722]" />
                  <span>Shipping Address</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-neutral-400 block text-[11px]">City</span>
                    <span className="font-bold text-white">{order.shippingCity}</span>
                  </div>

                  <div>
                    <span className="text-neutral-400 block text-[11px]">Street Address</span>
                    <p className="text-neutral-200 leading-relaxed font-medium">
                      {order.shippingAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Delivery Notes */}
              <div className="bg-neutral-950/60 rounded-2xl border border-neutral-800 p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <FiFileText className="w-4 h-4 text-amber-400" />
                  <span>Customer Delivery Instructions</span>
                </div>

                {order.notes ? (
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-xs text-neutral-300 whitespace-pre-line leading-relaxed">
                    {order.notes}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 italic">
                    No special delivery instructions provided.
                  </p>
                )}
              </div>

              {/* Payment Method Card */}
              <div className="bg-neutral-950/60 rounded-2xl border border-neutral-800 p-4 sm:p-5 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <FiDollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Payment Method</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-sm font-bold text-white">Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-neutral-400">
                      Payment is collected in cash upon courier delivery.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    COD
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Ordered Products & Financial Breakdown (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Ordered Items List (Historical Snapshots Preserved) */}
              <div className="bg-neutral-950/60 rounded-2xl border border-neutral-800 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <FiLayers className="w-4 h-4 text-[#FF5722]" />
                    <span>Ordered Products ({order.items?.length || 0})</span>
                  </div>
                  <span className="text-xs text-neutral-400 font-semibold">
                    {order.itemsCount} total units
                  </span>
                </div>

                <div className="divide-y divide-neutral-800/60 space-y-3">
                  {(order.items || []).map((item, idx) => {
                    const thumb =
                      item.product?.imageUrl ||
                      item.product?.image_url ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';

                    return (
                      <div
                        key={item.id || idx}
                        className="pt-3 first:pt-0 flex items-start gap-3.5"
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                          <img
                            src={thumb}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80';
                            }}
                          />
                        </div>

                        {/* Product Info & Selected Variants */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">
                            {item.productName}
                          </h4>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {item.selectedSize && (
                              <span className="px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-[10px] font-bold text-neutral-300">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            {item.selectedColor && (
                              <span className="px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-[10px] font-bold text-neutral-300">
                                Color: {item.selectedColor}
                              </span>
                            )}
                            {item.product?.category && (
                              <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-[10px] text-neutral-400">
                                {item.product.category}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs mt-2 text-neutral-400">
                            <span>
                              {formatPrice(item.productPrice)} &times; {item.quantity}
                            </span>
                            <span className="font-bold text-white">
                              {formatPrice(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="bg-neutral-950/60 rounded-2xl border border-neutral-800 p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-800 text-white font-bold text-xs uppercase tracking-wider">
                  <FiDollarSign className="w-4 h-4 text-[#FF5722]" />
                  <span>Financial Breakdown</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Subtotal</span>
                    <span className="font-semibold text-white">
                      {formatPrice(order.subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span>Shipping Fee</span>
                    <span className="font-semibold text-emerald-400">
                      {order.shippingFee > 0
                        ? formatPrice(order.shippingFee)
                        : 'Free Shipping'}
                    </span>
                  </div>

                  {order.discount > 0 && (
                    <div className="flex items-center justify-between text-neutral-300">
                      <span>Discount</span>
                      <span className="font-semibold text-rose-400">
                        -{formatPrice(order.discount)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white block">Grand Total</span>
                      <span className="text-[11px] text-neutral-400">Payable via COD</span>
                    </div>
                    <span className="text-xl font-extrabold text-[#FF5722]">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500 hidden sm:block">
            Order changes are committed immediately to Supabase PostgreSQL.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
