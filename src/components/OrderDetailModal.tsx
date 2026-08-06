import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, MapPin, Package, Calendar, Clock, ArrowRight, Clipboard, ExternalLink, HelpCircle } from 'lucide-react';
import { Order, getProductPrice, getNormalizedStatus } from '../supabase';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (order: Order, newStatus: Order['status']) => void;
  isUpdating: boolean;
}

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  isUpdating,
}: OrderDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!order || !isOpen) return null;

  const itemPrice = getProductPrice(order.product_variant);
  const orderTotal = itemPrice * (order.quantity || 1);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusWorkflow: Order['status'][] = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
  const normalizedStatus = getNormalizedStatus(order.status);
  const isCancelled = normalizedStatus === 'Cancelled';

  // Helper to get state sequence
  const currentStepIndex = statusWorkflow.indexOf(normalizedStatus);

  // Status-specific explanation text for the admin
  const getStatusInstruction = (status: Order['status']) => {
    const norm = getNormalizedStatus(status);
    switch (norm) {
      case 'Pending':
        return 'Call or message the customer to verify name, city, and correct physical address before confirmation.';
      case 'Confirmed':
        return 'Order confirmed and registered in warehouse. Prepare invoice, pack the item, and assign a local courier.';
      case 'Shipped':
        return 'Parcel handed over to logistics. Driver is in transit. Cash will be collected physically upon receipt.';
      case 'Delivered':
        return 'Customer received item and successfully paid in cash. Funds should be reconciled with the carrier.';
      case 'Cancelled':
        return 'This COD order was cancelled. No delivery attempts or collections will be executed.';
      default:
        return 'Update status as the order progresses.';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="order-detail-backdrop">
        {/* Soft backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-10 flex flex-col max-h-[90vh]"
          id="order-detail-card"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100" id="detail-header">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Order Management
              </span>
              <h2 className="text-base font-bold text-gray-900 mt-0.5">
                Ref ID: #{order.id || 'N/A'}
              </h2>
            </div>
            <button
              id="close-detail-modal"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-gray-700" id="detail-content">
            
            {/* Status Visual Tracker */}
            {!isCancelled ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200/80" id="delivery-tracker">
                <p className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider text-center">
                  Cash-on-Delivery Progress Tracker
                </p>
                <div className="flex items-center justify-between relative px-2">
                  {/* Progress Line Bar */}
                  <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-200 -z-10" />
                  <div 
                    className="absolute top-3 left-6 h-0.5 bg-blue-600 -z-10 transition-all duration-500" 
                    style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (statusWorkflow.length - 1)) * 100 : 0}%` }}
                  />

                  {statusWorkflow.map((stepName, idx) => {
                    const isDone = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div key={stepName} className="flex flex-col items-center gap-1.5 relative">
                        <div
                          className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-50 shadow-xs'
                              : isDone
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white text-gray-400 border-gray-200'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className={`text-[10px] font-semibold tracking-tight ${
                          isCurrent ? 'text-blue-700 font-bold' : isDone ? 'text-gray-700' : 'text-gray-400'
                        }`}>
                          {stepName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-center" id="cancelled-banner">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wider">
                  Order Cancelled
                </p>
                {order.cancellation_reason && (
                  <p className="text-xs text-red-800 mt-2 font-semibold bg-white/60 p-2.5 rounded border border-red-100/50 text-left">
                    <span className="text-red-500 font-bold block uppercase tracking-wider text-[9px] mb-0.5">Cancellation Reason:</span>
                    {order.cancellation_reason}
                  </p>
                )}
                <p className="text-[11px] text-red-600 mt-2 font-medium">
                  This transaction is locked and inactive. Re-create the order if necessary.
                </p>
              </div>
            )}

            {/* Quick action helper card */}
            <div className="bg-blue-50/50 border border-blue-100/70 rounded-lg p-3 flex gap-2.5 items-start">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-blue-800 uppercase text-[10px] tracking-wider block mb-0.5">Admin Action Playbook:</span>
                <p className="text-blue-900/80 font-medium">{getStatusInstruction(order.status)}</p>
              </div>
            </div>

            {/* Customer coordinates Section */}
            <div className="space-y-3" id="customer-info-section">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" /> Customer Identity & Contact
              </h3>
              
              <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {order.customer_name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      {order.email || 'No email registered'}
                    </p>
                  </div>
                  {order.email && (
                    <a
                      id="mailto-link"
                      href={`mailto:${order.email}`}
                      className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                      title="Send email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-gray-800 font-bold">
                      {order.phone || 'No phone'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <a
                      id="tel-link"
                      href={`tel:${order.phone}`}
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Call Mobile
                    </a>
                    <a
                      id="whatsapp-link"
                      href={`https://wa.me/${order.phone?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      WhatsApp <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Logistics */}
            <div className="space-y-3" id="shipping-details-section">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Shipping Destination (COD Delivery)
              </h3>
              
              <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-blue-700 inline-block bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {order.city}
                    </p>
                    <p className="text-xs text-gray-600 font-semibold pt-1">
                      {order.address}
                    </p>
                  </div>

                  <button
                    id="copy-address-btn"
                    onClick={() => copyToClipboard(`${order.address}, ${order.city}`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs text-gray-600 bg-white hover:bg-gray-50 transition-colors font-semibold cursor-pointer shrink-0"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Product & Pricing details */}
            <div className="space-y-3" id="product-details-section">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-blue-600" /> Ordered Product details
              </h3>
              
              <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center border border-gray-200">
                      <Package className="w-3 h-3 text-gray-500" />
                    </div>
                    <span className="font-bold text-gray-800">{order.product_variant}</span>
                  </div>
                  <span className="text-gray-500 font-semibold">Qty: {order.quantity || 1}</span>
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-semibold">Unit Price:</span>
                  <span className="text-gray-800 font-bold">LKR {itemPrice.toLocaleString()}</span>
                </div>

                <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">COD Collection Amount:</span>
                  <span className="text-base font-extrabold text-blue-700">LKR {orderTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer - Status transitions */}
          <div className="bg-gray-50 p-5 border-t border-gray-100 flex flex-col gap-3" id="detail-actions-footer">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Transit Action Panel
            </p>

            <div className="flex flex-wrap gap-2" id="action-transition-buttons">
              {isUpdating ? (
                <div className="w-full py-2 bg-gray-200 rounded-lg text-center text-xs text-gray-500 font-semibold flex items-center justify-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin" />
                  <span>Updating Database record...</span>
                </div>
              ) : (
                <>
                  {/* Conditional Status transition workflows */}
                  {normalizedStatus === 'Pending' && (
                    <button
                      id="action-btn-confirm"
                      onClick={() => onStatusUpdate(order, 'Confirmed')}
                      className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>Approve & Confirm</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {normalizedStatus === 'Confirmed' && (
                    <button
                      id="action-btn-ship"
                      onClick={() => onStatusUpdate(order, 'Shipped')}
                      className="flex-1 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>Handover to Logistics (Ship)</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {normalizedStatus === 'Shipped' && (
                    <div className="flex w-full gap-2">
                      <button
                        id="action-btn-deliver"
                        onClick={() => onStatusUpdate(order, 'Delivered')}
                        className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span>Confirm Paid & Delivered</span>
                      </button>
                      <button
                        id="action-btn-cancel-ship"
                        onClick={() => onStatusUpdate(order, 'Cancelled')}
                        className="py-2.5 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Failed Delivery / Cancel
                      </button>
                    </div>
                  )}

                  {normalizedStatus !== 'Delivered' && normalizedStatus !== 'Cancelled' && normalizedStatus !== 'Shipped' && (
                    <button
                      id="action-btn-cancel-generic"
                      onClick={() => onStatusUpdate(order, 'Cancelled')}
                      className="py-2 px-3 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}

                  {(normalizedStatus === 'Delivered' || normalizedStatus === 'Cancelled') && (
                    <button
                      id="action-btn-revert"
                      onClick={() => onStatusUpdate(order, 'Pending')}
                      className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Re-open Order (Set to Pending)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
