import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Phone, Mail, MapPin, Package, AlertCircle, PlusCircle } from 'lucide-react';
import { Order, POPULAR_CITIES, PRODUCT_VARIANTS, getProductPrice } from '../supabase';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newOrder: Omit<Order, 'id' | 'created_at'>) => Promise<boolean>;
  isSubmitting: boolean;
}

export default function OrderFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: OrderFormModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState(POPULAR_CITIES[0]);
  const [customCity, setCustomCity] = useState('');
  const [useCustomCity, setUseCustomCity] = useState(false);
  const [address, setAddress] = useState('');
  const [productVariant, setProductVariant] = useState(PRODUCT_VARIANTS[0]);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<Order['status']>('Pending');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!customerName.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Customer contact phone is required.');
      return;
    }
    if (!address.trim()) {
      setFormError('Complete physical address is required for COD logistics.');
      return;
    }

    const finalCity = useCustomCity ? customCity.trim() : city;
    if (!finalCity) {
      setFormError('City is required.');
      return;
    }

    const payload: Omit<Order, 'id' | 'created_at'> = {
      customer_name: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city: finalCity,
      address: address.trim(),
      product_variant: productVariant,
      quantity: Math.max(1, quantity),
      status,
    };

    const success = await onSubmit(payload);
    if (success) {
      // Clear Form
      setCustomerName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setQuantity(1);
      setUseCustomCity(false);
      setCustomCity('');
      onClose();
    } else {
      setFormError('Failed to record order. Please verify database availability.');
    }
  };

  const calculatedPrice = getProductPrice(productVariant);
  const calculatedTotal = calculatedPrice * quantity;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="order-form-backdrop">
        {/* Backdrop filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
        />

        {/* Modal body */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-10 flex flex-col max-h-[90vh]"
          id="order-form-card"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100" id="form-header">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Booking Portal
              </span>
              <h2 className="text-base font-bold text-gray-900 mt-0.5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                  <PlusCircle className="w-4 h-4" />
                </div>
                Book New COD Order
              </h2>
            </div>
            <button
              id="close-form-modal"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto" id="order-html-form">
            {/* Scrollable Fields */}
            <div className="p-6 space-y-5 text-sm text-gray-700" id="form-fields-container">
              
              {formError && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-600 font-semibold flex items-center gap-1.5" id="form-error-alert">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Customer Coordinates Group */}
              <div className="space-y-3" id="customer-coordinates-group">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  1. Customer Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 pl-0.5">
                      Customer Full Name *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        id="form-customer-name"
                        type="text"
                        placeholder="e.g. Youssef El Alami"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Customer Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 pl-0.5">
                      Contact Phone *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        id="form-customer-phone"
                        type="tel"
                        placeholder="e.g. +212 661-234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 pl-0.5">
                    Customer Email (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="form-customer-email"
                      type="email"
                      placeholder="youssef.alami@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Coordinates Group */}
              <div className="space-y-3" id="delivery-coordinates-group">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  2. Destination & Logistics Address
                </h3>

                {/* City Selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 pl-0.5">
                      Select Shipping City
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <select
                        id="form-city-select"
                        disabled={useCustomCity}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {POPULAR_CITIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center h-10">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={useCustomCity}
                        onChange={(e) => setUseCustomCity(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Use custom city</span>
                    </label>
                  </div>
                </div>

                {/* Custom City input if checkbox ticked */}
                {useCustomCity && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 pl-0.5">
                      Enter Custom City Name *
                    </label>
                    <input
                      id="form-custom-city"
                      type="text"
                      placeholder="e.g. Oujda"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      required={useCustomCity}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                )}

                {/* Complete Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 pl-0.5">
                    Delivery Address * (Complete physical route detail for dispatch driver)
                  </label>
                  <textarea
                    id="form-address"
                    rows={2}
                    placeholder="e.g. 24 Rue de la Liberté, Gauthier, Apartment 3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-medium"
                  />
                </div>
              </div>

              {/* Product Variant Details Group */}
              <div className="space-y-3" id="product-variant-details-group">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  3. Product Selection & Initial Status
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Variant Selection */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 pl-0.5">
                      Product Variant
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Package className="w-4 h-4" />
                      </span>
                      <select
                        id="form-variant-select"
                        value={productVariant}
                        onChange={(e) => setProductVariant(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                      >
                        {PRODUCT_VARIANTS.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quantity Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 pl-0.5">
                      Quantity
                    </label>
                    <input
                      id="form-quantity"
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      required
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2">
                  {/* Status Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 pl-0.5">
                      Initial Verification Status
                    </label>
                    <select
                      id="form-status-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                    >
                      <option value="Pending">Pending Confirmation</option>
                      <option value="Confirmed">Pre-Confirmed</option>
                      <option value="Shipped">In Shipped Logistics</option>
                    </select>
                  </div>

                  {/* Estimated Price calculations banner */}
                  <div className="bg-blue-50/50 rounded-lg p-3.5 border border-blue-100 flex flex-col justify-center h-full">
                    <div className="flex justify-between items-center text-xs text-blue-600 font-semibold">
                      <span>Calculated Value:</span>
                      <span>{quantity} × ${calculatedPrice}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-blue-700 mt-1">
                      <span>COD Total Value:</span>
                      <span>${calculatedTotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions Footer */}
            <div className="bg-gray-50 p-5 border-t border-gray-150 flex items-center justify-end gap-3" id="form-actions-footer">
              <button
                id="cancel-form-btn"
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition-colors cursor-pointer animate-none"
              >
                Cancel
              </button>
              <button
                id="submit-form-btn"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving order...</span>
                  </>
                ) : (
                  <span>Log COD Order</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
