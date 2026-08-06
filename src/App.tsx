import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, Order, getNormalizedStatus } from './supabase';
import { INITIAL_MOCK_ORDERS } from './mockData';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import StatsGrid from './components/StatsGrid';
import OrderTable from './components/OrderTable';
import OrderDetailModal from './components/OrderDetailModal';
import OrderFormModal from './components/OrderFormModal';
import SettingsView from './components/SettingsView';
import StatusPromptModal from './components/StatusPromptModal';
import { AlertCircle, CheckCircle2, ShieldCheck, Database, ShoppingBag, PlusCircle, LogOut } from 'lucide-react';

export default function App() {
  // Brand Configuration State
  const [appName, setAppName] = useState(() => {
    return localStorage.getItem('cod_portal_name') || 'Atlas COD Logistics';
  });

  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);

  // Database Mode State (Fallback to local persistence if Supabase has issues or requested)
  const [isLocalMode, setIsLocalMode] = useState(() => {
    return localStorage.getItem('cod_local_mode_active') === 'true';
  });

  // Core Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // UI Flow States
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ order: Order; newStatus: Order['status'] } | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Submitting States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Trigger Toast Notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync / Fetch from Supabase or LocalStorage
  const fetchOrders = async () => {
    setIsLoading(true);
    setDbError(null);

    if (isLocalMode) {
      // Load from LocalStorage
      try {
        const localData = localStorage.getItem('cod_local_orders');
        if (localData) {
          const parsed = JSON.parse(localData);
          const normalized = parsed.map((o: any) => ({
            ...o,
            status: getNormalizedStatus(o.status)
          }));
          setOrders(normalized);
        } else {
          // Default mock data seed in local storage
          localStorage.setItem('cod_local_orders', JSON.stringify(INITIAL_MOCK_ORDERS));
          setOrders(INITIAL_MOCK_ORDERS);
        }
      } catch (err) {
        showToast('Failed to parse persistent local state.', 'error');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Live Supabase Sync Mode
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (data) {
        const normalized = data.map((o: any) => ({
          ...o,
          status: getNormalizedStatus(o.status)
        }));
        setOrders(normalized);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Unknown database issue';
      setDbError(errMsg);
      showToast(`Database sync error: ${errMsg}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Track real Supabase Auth Session
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          setAdminUser(session.user.email || '');
        } else {
          setIsAuthenticated(false);
          setAdminUser('');
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        setSessionLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setAdminUser(session.user.email || '');
      } else {
        setIsAuthenticated(false);
        setAdminUser('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Run on initial load and when connection modes change
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, isLocalMode]);

  // Save local orders whenever state changes in local mode
  useEffect(() => {
    if (isLocalMode && isAuthenticated && orders.length > 0) {
      localStorage.setItem('cod_local_orders', JSON.stringify(orders));
    }
  }, [orders, isLocalMode, isAuthenticated]);

  // Update App Branding Name globally
  const handleUpdateAppName = (newName: string) => {
    setAppName(newName);
    localStorage.setItem('cod_portal_name', newName);
    showToast('Dashboard branding updated successfully!');
  };

  // Change Local/Live state
  const handleToggleLocalMode = (enabled: boolean) => {
    setIsLocalMode(enabled);
    localStorage.setItem('cod_local_mode_active', String(enabled));
    showToast(
      enabled ? 'Enabled offline sandbox local storage.' : 'Connected live to Supabase production cluster.'
    );
  };

  // Auth Functions
  const handleLogin = (username: string) => {
    setIsAuthenticated(true);
    setAdminUser(username);
    showToast(`Access Granted. Welcome back, Admin!`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setAdminUser('');
      showToast('Logged out of active session.', 'info');
    } catch (err: any) {
      showToast(`Error signing out: ${err.message}`, 'error');
    }
  };

  // Status transitions
  const handleStatusUpdate = async (
    order: Order, 
    newStatus: Order['status'], 
    additionalFields?: { cancellation_reason?: string; address?: string }
  ) => {
    // Intercept if Cancelled or Shipped to collect additional details
    if (newStatus === 'Cancelled' && !additionalFields?.cancellation_reason) {
      setPendingStatusUpdate({ order, newStatus });
      return;
    }
    if (newStatus === 'Shipped' && !additionalFields?.address) {
      setPendingStatusUpdate({ order, newStatus });
      return;
    }

    setIsUpdatingStatus(true);
    
    // Quick local state update for instant UI response
    const updatedOrders = orders.map((o) => {
      if (o.id === order.id) {
        return { 
          ...o, 
          status: newStatus,
          ...(additionalFields?.cancellation_reason ? { cancellation_reason: additionalFields.cancellation_reason } : {}),
          ...(additionalFields?.address ? { address: additionalFields.address } : {})
        };
      }
      return o;
    });

    if (isLocalMode) {
      // Local Storage Write
      setOrders(updatedOrders);
      localStorage.setItem('cod_local_orders', JSON.stringify(updatedOrders));
      
      // Update currently viewed detailed order
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ 
          ...selectedOrder, 
          status: newStatus,
          ...(additionalFields?.cancellation_reason ? { cancellation_reason: additionalFields.cancellation_reason } : {}),
          ...(additionalFields?.address ? { address: additionalFields.address } : {})
        });
      }
      
      showToast(`Order #${order.id} status transitioned to: ${newStatus}`);
      setIsUpdatingStatus(false);
      setPendingStatusUpdate(null);
      return;
    }

    // Live Supabase Write
    try {
      const updatePayload: any = { status: newStatus };
      if (additionalFields?.cancellation_reason) {
        updatePayload.cancellation_reason = additionalFields.cancellation_reason;
      }
      if (additionalFields?.address) {
        updatePayload.address = additionalFields.address;
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (error) {
        // Fallback in case table doesn't have cancellation_reason column
        if (additionalFields?.cancellation_reason) {
          console.warn('Failing to write cancellation_reason, retrying without it:', error.message);
          const { error: retryError } = await supabase
            .from('orders')
            .update({ 
              status: newStatus,
              ...(additionalFields.address ? { address: additionalFields.address } : {})
            })
            .eq('id', order.id);
          
          if (retryError) {
            throw new Error(retryError.message);
          }
        } else {
          throw new Error(error.message);
        }
      }

      setOrders(updatedOrders);
      
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ 
          ...selectedOrder, 
          status: newStatus,
          ...(additionalFields?.cancellation_reason ? { cancellation_reason: additionalFields.cancellation_reason } : {}),
          ...(additionalFields?.address ? { address: additionalFields.address } : {})
        });
      }

      showToast(`Order #${order.id} status written to database as ${newStatus}!`);
    } catch (err: any) {
      console.error('Supabase write failed, applying session fallback:', err);
      // Seamless Session Fallback: If DB write fails, apply the change in local state anyway
      // so the app is 100% functional, and notify the user about the DB constraint.
      setOrders(updatedOrders);
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ 
          ...selectedOrder, 
          status: newStatus,
          ...(additionalFields?.cancellation_reason ? { cancellation_reason: additionalFields.cancellation_reason } : {}),
          ...(additionalFields?.address ? { address: additionalFields.address } : {})
        });
      }
      showToast(`Updated locally (Supabase: ${err.message})`, 'info');
    } finally {
      setIsUpdatingStatus(false);
      setPendingStatusUpdate(null);
    }
  };

  // Logging COD Orders
  const handleCreateOrder = async (newOrder: Omit<Order, 'id' | 'created_at'>): Promise<boolean> => {
    setIsSubmitting(true);
    
    if (isLocalMode) {
      // Local generate id & date
      const generatedId = Math.floor(Math.random() * 9000) + 1000; // 4 digits
      const orderWithMeta: Order = {
        ...newOrder,
        id: generatedId,
        created_at: new Date().toISOString()
      };

      const updated = [orderWithMeta, ...orders];
      setOrders(updated);
      localStorage.setItem('cod_local_orders', JSON.stringify(updated));
      
      showToast(`Successfully logged COD order #${generatedId}!`);
      setIsSubmitting(false);
      return true;
    }

    // Live Supabase Insert
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          customer_name: newOrder.customer_name,
          email: newOrder.email || null,
          phone: newOrder.phone,
          city: newOrder.city,
          address: newOrder.address,
          product_variant: newOrder.product_variant,
          quantity: newOrder.quantity,
          status: newOrder.status,
          // created_at is handled by DB defaults, but we can supply or wait for refresh
        }])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      showToast(`Logged and synchronized order to Supabase table!`);
      fetchOrders(); // Reload fresh database rows
      setIsSubmitting(false);
      return true;
    } catch (err: any) {
      showToast(`Failed to insert order: ${err.message}`, 'error');
      setIsSubmitting(false);
      return false;
    }
  };

  // Seed simulated orders directly to DB/Local
  const handleSeedOrders = async () => {
    setIsSeeding(true);
    
    if (isLocalMode) {
      // Simply override local orders
      setOrders(INITIAL_MOCK_ORDERS);
      localStorage.setItem('cod_local_orders', JSON.stringify(INITIAL_MOCK_ORDERS));
      showToast('Offline state seeded with 10 pristine COD orders.');
      setIsSeeding(false);
      return;
    }

    // Write to Live Supabase
    try {
      // Strip IDs before database insertion so Supabase generates unique values correctly
      const databasePayload = INITIAL_MOCK_ORDERS.map(({ id, created_at, ...rest }) => ({
        ...rest,
        // Optional custom timestamp variation
      }));

      const { data, error } = await supabase
        .from('orders')
        .insert(databasePayload)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      showToast('Successfully seeded 10 fresh COD bookings into Supabase!');
      fetchOrders();
    } catch (err: any) {
      showToast(`Seeding failed: ${err.message}`, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Clear orders (Reset database)
  const handleClearOrders = async () => {
    if (!window.confirm('Are you absolutely sure you want to clear COD orders? This cannot be undone.')) {
      return;
    }
    
    setIsClearing(true);

    if (isLocalMode) {
      setOrders([]);
      localStorage.setItem('cod_local_orders', JSON.stringify([]));
      showToast('Offline sandbox state cleared.');
      setIsClearing(false);
      return;
    }

    // Delete from Live Supabase
    try {
      // In Supabase client, to delete all, we can filter using `not.is` or matching keys if RLS permits
      // Let's delete where id is not null (which targets everything)
      const { error } = await supabase
        .from('orders')
        .delete()
        .neq('customer_name', 'DELETE_NONE_TARGET_SAFE_GUARD_KEY'); // safely targeting everything

      if (error) {
        throw new Error(error.message);
      }

      showToast('All orders purged from Supabase table.');
      setOrders([]);
    } catch (err: any) {
      showToast(`Failed to purge database: ${err.message}`, 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSelectDetailedOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Establishing Secure Session...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render auth page
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} appName={appName} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col md:flex-row text-neutral-800 antialiased font-sans" id="app-root-container">
      
      {/* Sidebar Navigation Panel */}
      <Sidebar
        appName={appName}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        ordersCount={orders.length}
        adminUser={adminUser}
        onLogout={handleLogout}
        isLocalMode={isLocalMode}
      />

      {/* Main Panel Content area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6" id="dashboard-main-canvas">
        
        {/* Dynamic header summary row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/50 pb-5" id="main-header">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
              {activeTab === 'orders' ? 'COD Orders Dispatch' : 'System Console Settings'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              {activeTab === 'orders' 
                ? `Oversee, authenticate, and dispatch bookings. Connected as ${adminUser}` 
                : 'Modify branding profiles, seed data tables, and inspect cluster links.'}
            </p>
          </div>

          <div className="flex items-center gap-3" id="header-interactive-actions">
            {/* Supabase Connection Status pill in Header */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isLocalMode 
                ? 'bg-amber-50 text-amber-700 border-amber-200/50' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{isLocalMode ? 'Local Sandbox Sandbox' : 'Supabase Connected'}</span>
            </div>

            {activeTab === 'orders' && (
              <button
                id="book-order-trigger-btn"
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Book COD Order</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB RENDERING */}
        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
              id="orders-tab-view"
            >
              {/* Stats Widgets */}
              <StatsGrid
                orders={orders}
                activeStatusFilter={statusFilter}
                onSelectStatusFilter={setStatusFilter}
              />

              {/* Order Filtering Grid & Main Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> Live Bookings Directory
                  </h3>
                  {statusFilter !== 'all' && (
                    <span className="text-xs text-neutral-500">
                      Filtered by status: <strong className="text-neutral-800 font-semibold">{statusFilter}</strong>
                    </span>
                  )}
                </div>

                <OrderTable
                  orders={orders}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  onViewOrder={handleSelectDetailedOrder}
                  onFastStatusUpdate={handleStatusUpdate}
                  isLoading={isLoading}
                  onRefresh={fetchOrders}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              id="settings-tab-view"
            >
              <SettingsView
                appName={appName}
                onUpdateAppName={handleUpdateAppName}
                isLocalMode={isLocalMode}
                onToggleLocalMode={handleToggleLocalMode}
                onSeedOrders={handleSeedOrders}
                isSeeding={isSeeding}
                onClearOrders={handleClearOrders}
                isClearing={isClearing}
                ordersCount={orders.length}
                dbError={dbError}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 1. Modal detailed slide-over */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={handleStatusUpdate}
        isUpdating={isUpdatingStatus}
      />

      {/* 2. Order Logging Modal Form */}
      <OrderFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateOrder}
        isSubmitting={isSubmitting}
      />

      {/* 3. Status prompt verification dialog */}
      <StatusPromptModal
        isOpen={pendingStatusUpdate !== null}
        order={pendingStatusUpdate?.order || null}
        newStatus={pendingStatusUpdate?.newStatus || null}
        onClose={() => setPendingStatusUpdate(null)}
        onConfirm={(order, status, fields) => handleStatusUpdate(order, status, fields)}
      />

      {/* Universal Floating Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            id="toast-notification"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm max-w-[340px]"
            style={{
              backgroundColor: toast.type === 'error' ? '#FEF2F2' : toast.type === 'info' ? '#EFF6FF' : '#F0FDF4',
              color: toast.type === 'error' ? '#991B1B' : toast.type === 'info' ? '#1E40AF' : '#166534',
              borderColor: toast.type === 'error' ? '#FEE2E2' : toast.type === 'info' ? '#DBEAFE' : '#DCFCE7'
            }}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium leading-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
