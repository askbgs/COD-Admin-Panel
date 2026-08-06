import React, { useState, useMemo } from 'react';
import { Search, MapPin, Package, Calendar, Phone, Mail, ChevronLeft, ChevronRight, Edit3, ArrowUpDown, RefreshCw, Layers } from 'lucide-react';
import { Order, getProductPrice, getNormalizedStatus } from '../supabase';

interface OrderTableProps {
  orders: Order[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onViewOrder: (order: Order) => void;
  onFastStatusUpdate: (order: Order, newStatus: Order['status']) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function OrderTable({
  orders,
  statusFilter,
  onStatusFilterChange,
  onViewOrder,
  onFastStatusUpdate,
  isLoading,
  onRefresh,
}: OrderTableProps) {
  // Filters & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedVariant, setSelectedVariant] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'qty-high' | 'qty-low'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dynamically extract unique cities & variants from orders to populate filters
  const cities = useMemo(() => {
    const list = new Set<string>();
    orders.forEach(o => o.city && list.add(o.city));
    return Array.from(list).sort();
  }, [orders]);

  const variants = useMemo(() => {
    const list = new Set<string>();
    orders.forEach(o => o.product_variant && list.add(o.product_variant));
    return Array.from(list).sort();
  }, [orders]);

  // Reset page when filters change
  const handleFilterChange = (type: 'search' | 'city' | 'variant' | 'status', value: string) => {
    setCurrentPage(1);
    if (type === 'search') setSearchQuery(value);
    if (type === 'city') setSelectedCity(value);
    if (type === 'variant') setSelectedVariant(value);
    if (type === 'status') onStatusFilterChange(value);
  };

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Status Filter
      if (statusFilter !== 'all' && getNormalizedStatus(order.status) !== getNormalizedStatus(statusFilter as any)) return false;

      // 2. City Filter
      if (selectedCity !== 'all' && order.city !== selectedCity) return false;

      // 3. Variant Filter
      if (selectedVariant !== 'all' && order.product_variant !== selectedVariant) return false;

      // 4. Search Query (matches name, phone, email, address, or city)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = order.customer_name?.toLowerCase().includes(query);
        const emailMatch = order.email?.toLowerCase().includes(query);
        const phoneMatch = order.phone?.toLowerCase().includes(query);
        const cityMatch = order.city?.toLowerCase().includes(query);
        const addressMatch = order.address?.toLowerCase().includes(query);
        return nameMatch || emailMatch || phoneMatch || cityMatch || addressMatch;
      }

      return true;
    });
  }, [orders, statusFilter, selectedCity, selectedVariant, searchQuery]);

  // Sorting Logic
  const sortedOrders = useMemo(() => {
    const copy = [...filteredOrders];
    if (sortBy === 'newest') {
      copy.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    } else if (sortBy === 'oldest') {
      copy.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
    } else if (sortBy === 'qty-high') {
      copy.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
    } else if (sortBy === 'qty-low') {
      copy.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
    }
    return copy;
  }, [filteredOrders, sortBy]);

  // Pagination Logic
  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(start, start + itemsPerPage);
  }, [sortedOrders, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  // Status Style Resolver
  const getStatusBadge = (status: Order['status']) => {
    const norm = getNormalizedStatus(status);
    const styles = {
      Pending: {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      },
      Confirmed: {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      },
      Shipped: {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
      },
      Delivered: {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      },
      Cancelled: {
        bg: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
      },
    };

    const style = styles[norm] || styles.Pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${style.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {norm}
      </span>
    );
  };

  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden" id="order-table-panel">
      
      {/* Table Toolbar & Search Filters */}
      <div className="p-5 border-b border-gray-100 space-y-4" id="table-toolbar">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="order-search-input"
              type="text"
              placeholder="Search customers, phone, city, address..."
              value={searchQuery}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap" id="toolbar-actions">
            <button
              id="refresh-btn"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Portal</span>
            </button>

            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="qty-high">Sort: Quantity High-Low</option>
              <option value="qty-low">Sort: Quantity Low-High</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap gap-3 items-center pt-1" id="extended-filters">
          <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider pr-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Refine BY:</span>
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-600">City:</span>
            <select
              id="city-filter"
              value={selectedCity}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              className="px-3 py-1 text-xs rounded-full border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Product Variant Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-600">Product:</span>
            <select
              id="variant-filter"
              value={selectedVariant}
              onChange={(e) => handleFilterChange('variant', e.target.value)}
              className="px-3 py-1 text-xs rounded-full border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer max-w-[160px]"
            >
              <option value="all">All Products</option>
              {variants.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Clear filters button if active */}
          {(statusFilter !== 'all' || selectedCity !== 'all' || selectedVariant !== 'all' || searchQuery !== '') && (
            <button
              id="clear-filters-btn"
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('all');
                setSelectedVariant('all');
                onStatusFilterChange('all');
              }}
              className="text-xs text-red-600 hover:text-red-700 font-semibold pl-2 cursor-pointer hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto" id="table-container">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3" id="loading-placeholder">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-semibold">Syncing with remote database...</p>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="p-16 text-center" id="empty-results-placeholder">
            <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center mx-auto mb-3 border border-gray-100">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No matching orders found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-medium">
              We couldn't find any orders matching your active filter criteria. Try resetting the filters or modifying your search text.
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm" id="orders-html-table">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 border-b border-gray-100 uppercase tracking-wider">
                <th className="py-3.5 px-5">Customer Info</th>
                <th className="py-3.5 px-5">City & Destination</th>
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">Booking Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {paginatedOrders.map((order) => {
                const itemPrice = getProductPrice(order.product_variant);
                const orderTotal = itemPrice * (order.quantity || 1);
                const orderNormStatus = getNormalizedStatus(order.status);

                return (
                  <tr
                    key={order.id}
                    id={`order-row-${order.id}`}
                    className="hover:bg-gray-50/50 transition-all duration-150 group"
                  >
                    {/* Customer Info */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-100">
                          {order.customer_name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                            {order.customer_name}
                          </p>
                          <div className="flex flex-col gap-0.5 mt-0.5 text-xs text-gray-500">
                            <span className="flex items-center gap-1 font-medium">
                              <Phone className="w-3 h-3 text-gray-400" /> {order.phone || 'No phone'}
                            </span>
                            {order.email && (
                              <span className="flex items-center gap-1 font-medium">
                                <Mail className="w-3 h-3 text-gray-400" /> {order.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* City & Address */}
                    <td className="py-3.5 px-5 max-w-[200px]">
                      <div className="text-xs">
                        <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mb-1">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          {order.city}
                        </span>
                        <p className="text-gray-500 line-clamp-2 pl-1 font-medium" title={order.address}>
                          {order.address}
                        </p>
                      </div>
                    </td>

                    {/* Item Details */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-gray-800 text-xs flex items-center gap-1 max-w-[160px] truncate" title={order.product_variant}>
                          <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {order.product_variant}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 pl-4.5 font-medium">
                          Qty: <span className="font-bold text-gray-800">{order.quantity || 1}</span> 
                          <span className="mx-1">×</span> 
                          LKR {itemPrice.toLocaleString()}
                        </p>
                        <p className="text-xs font-bold text-gray-900 mt-0.5 pl-4.5">
                          Total: LKR {orderTotal.toLocaleString()}
                        </p>
                      </div>
                    </td>

                    {/* Booking Date */}
                    <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Action transitions */}
                        {orderNormStatus === 'Pending' && (
                          <button
                            id={`quick-confirm-${order.id}`}
                            onClick={() => onFastStatusUpdate(order, 'Confirmed')}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100/75 transition-colors cursor-pointer"
                          >
                            Confirm
                          </button>
                        )}
                        {orderNormStatus === 'Confirmed' && (
                          <button
                            id={`quick-ship-${order.id}`}
                            onClick={() => onFastStatusUpdate(order, 'Shipped')}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100/75 transition-colors cursor-pointer"
                          >
                            Ship
                          </button>
                        )}
                        {orderNormStatus === 'Shipped' && (
                          <div className="flex gap-1">
                            <button
                                id={`quick-deliver-${order.id}`}
                                onClick={() => onFastStatusUpdate(order, 'Delivered')}
                                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/75 transition-colors cursor-pointer"
                              >
                                Deliver
                              </button>
                              <button
                                id={`quick-cancel-${order.id}`}
                                onClick={() => onFastStatusUpdate(order, 'Cancelled')}
                                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100/75 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                          </div>
                        )}

                        <button
                          id={`view-order-btn-${order.id}`}
                          onClick={() => onViewOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all cursor-pointer"
                          title="Manage order"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && sortedOrders.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-150 flex items-center justify-between" id="table-pagination">
          <p className="text-xs text-gray-500 font-semibold">
            Showing <span className="text-gray-900 font-bold">{startIndex}</span> to{' '}
            <span className="text-gray-900 font-bold">{endIndex}</span> of{' '}
            <span className="text-gray-900 font-bold">{totalItems}</span> orders
          </p>

          <div className="flex items-center gap-1.5">
            <button
              id="prev-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-600 font-bold px-2">
              Page <span className="text-blue-700">{currentPage}</span> of {totalPages}
            </span>
            <button
              id="next-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
