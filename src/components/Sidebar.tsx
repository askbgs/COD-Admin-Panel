import { ShoppingBag, Settings, LogOut, ShieldCheck, Database, Menu, X, Landmark } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  appName: string;
  activeTab: 'orders' | 'settings';
  onChangeTab: (tab: 'orders' | 'settings') => void;
  ordersCount: number;
  adminUser: string;
  onLogout: () => void;
  isLocalMode: boolean;
}

export default function Sidebar({
  appName,
  activeTab,
  onChangeTab,
  ordersCount,
  adminUser,
  onLogout,
  isLocalMode,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      id: 'orders' as const,
      label: 'Orders Directory',
      icon: ShoppingBag,
      badge: ordersCount > 0 ? ordersCount : undefined,
    },
    {
      id: 'settings' as const,
      label: 'System Settings',
      icon: Settings,
    },
  ];

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <>
      {/* Mobile Top Header (only visible on mobile screens) */}
      <header className="md:hidden w-full bg-white border-b border-neutral-200/80 px-5 py-3.5 flex items-center justify-between z-40 sticky top-0" id="mobile-nav-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
            <Landmark className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-neutral-900 tracking-tight text-sm">
            {appName}
          </span>
        </div>

        <button
          id="mobile-menu-toggle"
          onClick={toggleMobile}
          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar container - Responsive */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40 flex flex-col justify-between transform md:transform-none transition-transform duration-300 md:sticky md:top-0 md:h-screen shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Upper Navigation section */}
        <div className="space-y-6 pt-6 px-4">
          
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-2" id="sidebar-brand">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              <Landmark className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-neutral-900 text-sm leading-tight tracking-tight max-w-[150px] truncate" title={appName}>
                {appName}
              </h1>
              <span className="text-[10px] text-gray-400 font-medium">SwiftCOD Admin</span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1" id="sidebar-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  id={`sidebar-tab-btn-${item.id}`}
                  onClick={() => {
                    onChangeTab(item.id);
                    setMobileOpen(false); // Auto close mobile overlay
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Admin / Footer section */}
        <div className="p-4 border-t border-gray-100 space-y-4" id="sidebar-footer-info">
          
          {/* Diagnostics mini-block */}
          <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200/80 text-[10px] space-y-1">
            <div className="flex items-center justify-between font-bold text-gray-400 uppercase tracking-wider">
              <span>Sync status</span>
              <span className={`h-1.5 w-1.5 rounded-full ${isLocalMode ? 'bg-amber-400' : 'bg-emerald-500'}`} />
            </div>
            <p className="text-gray-600 font-medium">
              {isLocalMode ? 'Offline Sandbox Mode' : 'Connected to Supabase'}
            </p>
          </div>

          {/* Admin Profile Details */}
          <div className="flex items-center justify-between gap-2" id="admin-profile-badge">
            <div className="flex items-center gap-2 max-w-[150px]">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 border border-blue-200">
                {adminUser ? adminUser.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate text-xs">
                <p className="font-semibold text-gray-900 truncate">
                  {adminUser || 'Admin User'}
                </p>
                <span className="text-[10px] text-gray-400">Main Logistics Desk</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              id="logout-action-btn"
              onClick={onLogout}
              className="p-2 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-400 hover:text-gray-700 cursor-pointer active:scale-95 transition-all"
              title="Terminate Admin Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-backdrop"
          onClick={toggleMobile}
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-30 md:hidden"
        />
      )}
    </>
  );
}
