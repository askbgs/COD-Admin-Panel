import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, CheckCircle2, AlertTriangle, ShieldCheck, Database, RefreshCw, Smartphone, HelpCircle, Save } from 'lucide-react';
import { POPULAR_CITIES, PRODUCT_PRICES } from '../supabase';

interface SettingsViewProps {
  appName: string;
  onUpdateAppName: (newName: string) => void;
  isLocalMode: boolean;
  onToggleLocalMode: (enabled: boolean) => void;
  onSeedOrders: () => Promise<void>;
  isSeeding: boolean;
  onClearOrders: () => Promise<void>;
  isClearing: boolean;
  ordersCount: number;
  dbError: string | null;
}

export default function SettingsView({
  appName,
  onUpdateAppName,
  isLocalMode,
  onToggleLocalMode,
  onSeedOrders,
  isSeeding,
  onClearOrders,
  isClearing,
  ordersCount,
  dbError,
}: SettingsViewProps) {
  const [tempName, setTempName] = useState(appName);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmitName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdateAppName(tempName.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-6" id="settings-view-panel">
      
      {/* Title */}
      <div id="settings-header">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          System Administration Settings
        </h2>
        <p className="text-xs text-gray-500 mt-1 font-medium">
          Configure application naming, manage database connections, and run simulated test actions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="settings-content-grid">
        
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Custom App Name block */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs" id="block-branding">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-600" /> Portal Branding Configuration
            </h3>

            <form onSubmit={handleSubmitName} className="space-y-4" id="branding-form">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 block pl-0.5">
                  Application Display Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="settings-appname-input"
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="e.g. Atlas COD Logistics"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  <button
                    id="save-branding-btn"
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 pl-0.5 font-medium">
                  This custom branding will display across the sidebar headers, login gate, and administrative reports.
                </p>
              </div>

              {isSaved && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-1.5" id="branding-saved-notice">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Branding title saved locally as "{appName}"!</span>
                </div>
              )}
            </form>
          </div>

          {/* Database management and seed actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs" id="block-database-ops">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-600" /> Database Seeding & Recovery Operations
            </h3>

            <div className="space-y-4 text-xs text-gray-600 font-medium">
              <p>
                To help you test this application, use the seed tool below. If your Supabase table is blank or hasn't been populated yet, clicking **"Seed 10 Demo Orders"** will write realistic test bookings directly to your Supabase table.
              </p>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between" id="db-stats-summary">
                <div>
                  <span className="font-bold text-gray-800 block">Current Database Count:</span>
                  <span className="text-gray-500 mt-0.5 font-semibold">{ordersCount} entries found in `orders`</span>
                </div>
                <span className={`h-2.5 w-2.5 rounded-full ${ordersCount > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1" id="database-actions">
                <button
                  id="seed-orders-btn"
                  onClick={onSeedOrders}
                  disabled={isSeeding || isClearing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                >
                  {isSeeding ? (
                    <>
                      <div className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Writing to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Seed 10 Demo Orders</span>
                    </>
                  )}
                </button>

                <button
                  id="clear-orders-btn"
                  onClick={onClearOrders}
                  disabled={isClearing || isSeeding || ordersCount === 0}
                  className="px-4 py-2 border border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 rounded-lg font-bold disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  {isClearing ? (
                    <>
                      <div className="w-3 h-3 border border-red-400/20 border-t-red-600 rounded-full animate-spin" />
                      <span>Deleting entries...</span>
                    </>
                  ) : (
                    <span>Clear Orders</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Connection Diagnostics */}
        <div className="space-y-6">
          
          {/* Connection diagnostics card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs" id="block-diagnostics">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Connection Diagnostics
            </h3>

            <div className="space-y-4" id="diagnostics-summary">
              {/* Status indicator */}
              <div className="flex items-center gap-3 p-3 rounded-lg border" style={{
                backgroundColor: isLocalMode ? '#FEF3C7' : dbError ? '#FEE2E2' : '#ECFDF5',
                borderColor: isLocalMode ? '#FDE68A' : dbError ? '#FCA5A5' : '#A7F3D0'
              }}>
                {isLocalMode ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                ) : dbError ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}

                <div className="text-xs">
                  <span className="font-bold block text-gray-800">
                    {isLocalMode ? 'State: Local Offline Demo' : dbError ? 'State: Connection Error' : 'State: Supabase Live'}
                  </span>
                  <span className="text-gray-500 text-[10px] block mt-0.5 font-semibold">
                    {isLocalMode 
                      ? 'Simulated storage with 100% reactive state' 
                      : dbError 
                      ? 'RLS policy or database issue' 
                      : 'Connected to publishable client'}
                  </span>
                </div>
              </div>

              {/* Param specifications */}
              <div className="space-y-2 text-xs font-mono text-gray-500 bg-gray-50/50 p-3 rounded-lg border border-gray-200" id="db-param-logs">
                <div>
                  <span className="text-gray-400 block text-[10px] font-sans font-bold uppercase">DATABASE ENDPOINT</span>
                  <span className="truncate block font-semibold mt-0.5 text-gray-700">ancuzwijqbhqhzwncaqo</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-400 block text-[10px] font-sans font-bold uppercase">TABLE NAME</span>
                  <span className="block font-semibold mt-0.5 text-gray-700">orders</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-400 block text-[10px] font-sans font-bold uppercase">API ACCESS KEY</span>
                  <span className="block font-semibold mt-0.5 text-gray-700">sb_publishable_dMnCT...</span>
                </div>
              </div>

              {/* Mode Toggler */}
              <div className="pt-2" id="toggle-sandbox">
                <button
                  id="sandbox-mode-toggle"
                  onClick={() => onToggleLocalMode(!isLocalMode)}
                  className={`w-full py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer text-center transition-all ${
                    isLocalMode 
                      ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-xs' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isLocalMode ? 'Enable Live Supabase Sync' : 'Switch to Sandboxed Local Storage'}
                </button>
              </div>
            </div>
          </div>

          {/* MENA COD helper card */}
          <div className="bg-blue-50/30 rounded-xl border border-blue-100/70 p-5" id="block-cod-playbook">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" /> COD Operational Playbook
            </h3>

            <div className="text-[11px] text-blue-900/80 space-y-3 leading-relaxed font-semibold">
              <p>
                <strong>Cash-on-Delivery (COD)</strong> operations thrive on active confirmation calls. Up to 30% of booked orders are usually invalid or double entries.
              </p>
              <p>
                1. <strong>Verification Stage (Pending)</strong>: Admins must telephone or WhatsApp customers immediately to confirm their physical street address and verbal intent.
              </p>
              <p>
                2. <strong>Logistics Dispatches (Shipped)</strong>: Packaged items are given to carriers. The driver collects cash physically from the client at the doorstep.
              </p>
              <p>
                3. <strong>Cash Reconciliation (Delivered)</strong>: Collected cash is wire-transferred back to the merchant on set schedules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
