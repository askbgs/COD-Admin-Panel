import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Truck, MapPin, MessageSquare, Clipboard } from 'lucide-react';
import { Order } from '../supabase';

interface StatusPromptModalProps {
  isOpen: boolean;
  order: Order | null;
  newStatus: Order['status'] | null;
  onClose: () => void;
  onConfirm: (order: Order, status: Order['status'], additionalFields: { cancellation_reason?: string; address?: string }) => void;
}

export default function StatusPromptModal({
  isOpen,
  order,
  newStatus,
  onClose,
  onConfirm,
}: StatusPromptModalProps) {
  const [cancellationReason, setCancellationReason] = useState('');
  const [shippingOption, setShippingOption] = useState<'existing' | 'custom'>('existing');
  const [customAddress, setCustomAddress] = useState('');
  const [error, setError] = useState('');

  // Reset local state when opened or order/status changes
  useEffect(() => {
    if (order) {
      setCancellationReason(order.cancellation_reason || '');
      setCustomAddress(order.address || '');
      setShippingOption('existing');
      setError('');
    }
  }, [order, newStatus, isOpen]);

  if (!isOpen || !order || !newStatus) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newStatus === 'Cancelled') {
      if (!cancellationReason.trim()) {
        setError('Please provide a reason for cancelling this order.');
        return;
      }
      onConfirm(order, 'Cancelled', { cancellation_reason: cancellationReason.trim() });
    } else if (newStatus === 'Shipped') {
      const addressToUse = shippingOption === 'existing' ? order.address : customAddress.trim();
      if (!addressToUse) {
        setError('Please provide a valid shipping address.');
        return;
      }
      onConfirm(order, 'Shipped', { address: addressToUse });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="status-prompt-backdrop">
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
          className="relative w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-10 flex flex-col"
          id="status-prompt-card"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100" id="prompt-header">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                newStatus === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-purple-50 text-purple-600 border border-purple-100'
              }`}>
                {newStatus === 'Cancelled' ? <AlertTriangle className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {newStatus === 'Cancelled' ? 'Cancel Order Verification' : 'Ship Order Address Verification'}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">Ref: #{order.id || 'N/A'} • {order.customer_name}</p>
              </div>
            </div>
            <button
              id="close-prompt-modal"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4" id="status-prompt-form">
            {newStatus === 'Cancelled' && (
              <div className="space-y-3" id="cancel-form-block">
                <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800 font-medium leading-relaxed">
                    You are marking this order as <strong>Cancelled</strong>. Providing a cancellation reason is required for logistics analysis.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block pl-0.5">
                    Reason for Cancellation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="cancellation-reason-input"
                    rows={3}
                    placeholder="e.g. Customer requested cancellation / Wrong contact details / Product out of stock"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            )}

            {newStatus === 'Shipped' && (
              <div className="space-y-3" id="shipped-form-block">
                <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg flex gap-2">
                  <Truck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-800 font-medium leading-relaxed">
                    Verifying shipping destination details before handing over order to logistics carrier.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-gray-700 block pl-0.5">
                    Select Shipping Destination Address
                  </label>

                  {/* Options layout */}
                  <div className="space-y-2">
                    {/* Existing Address Option */}
                    <button
                      type="button"
                      onClick={() => setShippingOption('existing')}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                        shippingOption === 'existing'
                          ? 'border-blue-500 bg-blue-50/20 shadow-xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800">Use Customer's Current Address</span>
                        <input
                          type="radio"
                          checked={shippingOption === 'existing'}
                          readOnly
                          className="text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <p className="text-gray-600 font-medium mt-1 leading-relaxed">
                        {order.address}, <span className="font-bold text-blue-700">{order.city}</span>
                      </p>
                    </button>

                    {/* Custom Address Option */}
                    <button
                      type="button"
                      onClick={() => setShippingOption('custom')}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                        shippingOption === 'custom'
                          ? 'border-blue-500 bg-blue-50/20 shadow-xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-gray-800">Enter New / Updated Shipping Address</span>
                        <input
                          type="radio"
                          checked={shippingOption === 'custom'}
                          readOnly
                          className="text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <p className="text-gray-500 text-[10px] font-medium mb-1">Select this to specify a corrected courier routing address.</p>
                    </button>
                  </div>

                  {shippingOption === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1.5 pt-1"
                    >
                      <label className="text-xs font-semibold text-gray-700 block pl-0.5">
                        New Shipping Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="custom-address-input"
                        rows={2}
                        placeholder="Specify street number, neighborhood, and delivery landmarks..."
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        required={shippingOption === 'custom'}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-semibold" id="prompt-error-box">
                {error}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-2 flex gap-2" id="prompt-footer-actions">
              <button
                type="button"
                id="cancel-prompt-btn"
                onClick={onClose}
                className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center"
              >
                Go Back
              </button>
              <button
                type="submit"
                id="confirm-prompt-btn"
                className={`flex-1 py-2 px-3 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center shadow-xs ${
                  newStatus === 'Cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {newStatus === 'Cancelled' ? 'Confirm & Cancel Order' : 'Confirm & Ship Order'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
