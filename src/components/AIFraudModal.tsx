import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldAlert, AlertTriangle, CheckCircle, Brain, Sparkles, RefreshCw, Trash2, ChevronRight, Ban } from 'lucide-react';
import { Order } from '../supabase';

interface AIFraudModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onCancelOrder: (order: Order, reason: string) => Promise<boolean>;
}

interface FraudResult {
  id: string;
  is_suspicious: boolean;
  confidence_score: number;
  risk_level: 'High' | 'Medium' | 'Low';
  risk_reasons: string[];
}

export default function AIFraudModal({ isOpen, onClose, orders, onCancelOrder }: AIFraudModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [results, setResults] = useState<FraudResult[] | null>(null);
  const [isAiPowered, setIsAiPowered] = useState(true);
  const [apiMessage, setApiMessage] = useState('');
  const [cancellingId, setCancellingId] = useState<string | number | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  // Rotate loading sub-messages during scan
  useEffect(() => {
    if (!isScanning) return;
    
    const messages = [
      "Consulting Gemini cognitive neural models...",
      "Analyzing spelling entropy on customer names...",
      "Parsing contact phone digits for structural validation...",
      "Verifying email domain configurations...",
      "Cross-referencing delivery address details...",
      "Checking cash-on-delivery purchase quantities..."
    ];

    setScanMessage(messages[0]);
    let index = 1;
    const interval = setInterval(() => {
      setScanMessage(messages[index % messages.length]);
      index++;
    }, 2500);

    return () => clearInterval(interval);
  }, [isScanning]);

  const handleStartScan = async () => {
    setIsScanning(true);
    setResults(null);
    try {
      // Filter out already cancelled or delivered orders for a cleaner audit
      const activeOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Delivered');

      const response = await fetch('/api/gemini/analyze-fraud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: activeOrders }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
      setIsAiPowered(data.is_ai_powered ?? true);
      setApiMessage(data.message || '');
    } catch (err: any) {
      console.error("Failed to run AI fraud audit:", err);
      // Construct fallback results locally
      const mockAnalysis = runLocalHeuristicAnalysis(orders);
      setResults(mockAnalysis);
      setIsAiPowered(false);
      setApiMessage(`Error calling AI service (${err.message}). Deployed local risk-heuristic engine.`);
    } finally {
      setIsScanning(false);
    }
  };

  // Local rules-based engine for immediate rendering if API fails or is loading
  const runLocalHeuristicAnalysis = (activeOrders: Order[]): FraudResult[] => {
    return activeOrders.map(order => {
      const reasons: string[] = [];
      let score = 0;

      const name = (order.customer_name || '').toLowerCase().trim();
      const email = (order.email || '').toLowerCase().trim();
      const phone = (order.phone || '').toLowerCase().trim();
      const address = (order.address || '').toLowerCase().trim();
      const qty = Number(order.quantity) || 1;

      if (name.length < 3) {
        reasons.push("Customer name is unusually short.");
        score += 30;
      }
      const dummyNames = ['test', 'dummy', 'asdf', 'ghjk', 'fake', 'john doe', 'jane doe', 'nobody', 'abc', 'xyz', 'none'];
      if (dummyNames.some(d => name.includes(d))) {
        reasons.push("Name resembles a placeholder or dummy profile.");
        score += 55;
      }
      if (email) {
        if (email.includes('test') || email.includes('fake') || email.startsWith('a@') || email.startsWith('test@')) {
          reasons.push("Email address resembles a placeholder format.");
          score += 40;
        }
      }
      const digitsOnly = phone.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 6) {
        reasons.push("Phone number is too short to be genuine.");
        score += 40;
      }
      if (/^(.)\1+$/.test(digitsOnly) || digitsOnly === '12345678' || digitsOnly === '123456789' || digitsOnly === '0123456789') {
        reasons.push("Phone number contains repetitive digits or a simple sequential sequence.");
        score += 55;
      }
      if (address.length < 5) {
        reasons.push("Shipping address lacks sufficient geographic resolution.");
        score += 35;
      }
      const dummyAddresses = ['test', 'dummy', 'none', 'na', 'n/a', 'somewhere', 'address', 'street', 'city', 'house'];
      if (dummyAddresses.some(d => address === d)) {
        reasons.push("Address contains clear placeholder descriptors.");
        score += 45;
      }
      if (qty > 5) {
        reasons.push(`Abnormally high COD item volume (Qty: ${qty}) requested.`);
        score += 25;
      }

      score = Math.min(score, 100);
      let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
      if (score >= 60) riskLevel = 'High';
      else if (score >= 30) riskLevel = 'Medium';

      return {
        id: String(order.id),
        is_suspicious: score >= 30,
        confidence_score: score,
        risk_level: riskLevel,
        risk_reasons: reasons
      };
    });
  };

  const handleCancelSuspiciousOrder = async (orderId: string | number) => {
    const matchedOrder = orders.find(o => String(o.id) === String(orderId));
    if (!matchedOrder) return;

    setCancellingId(orderId);
    try {
      const reason = "Flagged as fake/fraudulent booking by Gemini AI Fraud Guard.";
      const success = await onCancelOrder(matchedOrder, reason);
      if (success) {
        // Update local results list so it is removed or marked as cancelled
        if (results) {
          setResults(results.map(r => r.id === String(orderId) ? { ...r, is_suspicious: false } : r));
        }
        setSuccessCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to cancel suspicious order:", err);
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelAllHighRisk = async () => {
    if (!results) return;
    const highRiskMatches = results.filter(r => r.is_suspicious && r.risk_level === 'High');
    if (highRiskMatches.length === 0) return;

    if (!window.confirm(`Are you sure you want to cancel all ${highRiskMatches.length} high-risk fake bookings identified by AI?`)) {
      return;
    }

    for (const match of highRiskMatches) {
      await handleCancelSuspiciousOrder(match.id);
    }
  };

  const activeSuspicious = results ? results.filter(r => r.is_suspicious) : [];
  const highRiskCount = activeSuspicious.filter(r => r.risk_level === 'High').length;
  const mediumRiskCount = activeSuspicious.filter(r => r.risk_level === 'Medium').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs" id="ai-fraud-modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        id="ai-fraud-modal-content"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-neutral-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-semibold text-base flex items-center gap-1.5">
                Gemini AI Fraud & Fake Order Guard
                <span className="text-[10px] bg-indigo-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  Real-time Scan
                </span>
              </h2>
              <p className="text-[11px] text-neutral-300/85">Audit COD bookings to filter dummy, fictitious, or suspicious accounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            id="ai-fraud-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main Action Banner */}
          {results === null && !isScanning && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="font-semibold text-neutral-900 text-sm">Initialize AI Cognitive Security Scan</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Analyze active pending bookings for fraudulent phone configurations, low address resolution, repeat spelling anomalies, and high-volume COD order patterns.
                </p>
              </div>
              <div>
                <button
                  onClick={handleStartScan}
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 mx-auto cursor-pointer shadow-sm active:scale-95 transition-all"
                  id="start-ai-scan-btn"
                >
                  <Brain className="w-4 h-4" />
                  <span>Scan Active Bookings ({orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Delivered').length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading / Scanning state */}
          {isScanning && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <Brain className="w-6 h-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-800 animate-pulse">Running Fraud Assessment Suite...</p>
                <p className="text-[11px] text-neutral-400 font-medium italic">{scanMessage}</p>
              </div>
            </div>
          )}

          {/* Results dashboard view */}
          {results !== null && !isScanning && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Stats Summary Panel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-100 text-neutral-600 rounded-lg flex items-center justify-center font-bold text-sm">
                    {results.length}
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Scanned Active</h4>
                    <p className="text-xs font-bold text-neutral-800">Pending & Confirmed</p>
                  </div>
                </div>

                <div className={`border rounded-xl p-4 flex items-center gap-3 ${
                  highRiskCount > 0 ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    highRiskCount > 0 ? 'bg-rose-100' : 'bg-emerald-100'
                  }`}>
                    {highRiskCount}
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-wider opacity-80">High Risk</h4>
                    <p className="text-xs font-bold">Fake/Suspicious Profile</p>
                  </div>
                </div>

                <div className={`border rounded-xl p-4 flex items-center gap-3 ${
                  mediumRiskCount > 0 ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-neutral-50 border-neutral-100 text-neutral-600'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    mediumRiskCount > 0 ? 'bg-amber-100' : 'bg-neutral-100'
                  }`}>
                    {mediumRiskCount}
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-wider opacity-80">Medium Risk</h4>
                    <p className="text-xs font-bold">Low Resolution details</p>
                  </div>
                </div>
              </div>

              {/* API Diagnostics Bar */}
              <div className={`p-3 rounded-lg flex items-center justify-between text-[11px] font-medium border ${
                isAiPowered 
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                  : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5" />
                  <span>{apiMessage || "Scanned successfully using Gemini AI models."}</span>
                </div>
                {!isAiPowered && (
                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">Fallback Engaged</span>
                )}
              </div>

              {/* Cancel actions summary row */}
              {highRiskCount > 0 && (
                <div className="flex items-center justify-between bg-rose-50 border border-rose-100/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 animate-bounce" />
                    <span className="text-xs text-rose-800 font-semibold">Bulk action available for {highRiskCount} high-risk fraudulent entries.</span>
                  </div>
                  <button
                    onClick={handleCancelAllHighRisk}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm cursor-pointer active:scale-95 transition-all"
                    id="bulk-cancel-high-risk-btn"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel All High-Risk Bookings</span>
                  </button>
                </div>
              )}

              {/* Blocked or Suspicious List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Identified Risk List</h3>
                
                {activeSuspicious.length === 0 ? (
                  <div className="border border-neutral-100 rounded-xl p-8 text-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <h4 className="text-xs font-bold text-neutral-800">Clear Audit Trail</h4>
                    <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                      No active bookings triggered suspicious markers! All scanned entries appear authentic and legitimate.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-xl overflow-hidden bg-white">
                    {activeSuspicious.map((risk) => {
                      const matchedOrder = orders.find(o => String(o.id) === String(risk.id));
                      if (!matchedOrder) return null;

                      const isHigh = risk.risk_level === 'High';

                      return (
                        <div key={risk.id} className="p-4 hover:bg-neutral-50/40 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            {/* Order summary header */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-neutral-900">
                                #{matchedOrder.id}
                              </span>
                              <ChevronRight className="w-3 h-3 text-neutral-300" />
                              <span className="text-xs font-semibold text-neutral-700">
                                {matchedOrder.customer_name}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {risk.risk_level} Risk ({risk.confidence_score}% Confidence)
                              </span>
                            </div>

                            {/* Contact info metadata row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-neutral-500">
                              <div><strong className="text-neutral-700">Phone:</strong> {matchedOrder.phone}</div>
                              <div><strong className="text-neutral-700">Email:</strong> {matchedOrder.email || 'N/A'}</div>
                              <div className="sm:col-span-2"><strong className="text-neutral-700">Address:</strong> {matchedOrder.address}, {matchedOrder.city}</div>
                              <div className="sm:col-span-2"><strong className="text-neutral-700">Booking:</strong> {matchedOrder.product_variant} (Qty: {matchedOrder.quantity})</div>
                            </div>

                            {/* AI Risk Reasons */}
                            <div className="bg-neutral-50 rounded-lg p-2.5 border border-neutral-100/50 space-y-1">
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" /> Detected Risk Indicators:
                              </p>
                              <ul className="list-disc pl-4 text-[10px] text-neutral-600 space-y-0.5 leading-relaxed">
                                {risk.risk_reasons.map((reason, idx) => (
                                  <li key={idx}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Individual Cancel Action */}
                          <div className="flex md:self-center">
                            <button
                              onClick={() => handleCancelSuspiciousOrder(risk.id)}
                              disabled={cancellingId === risk.id}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                                cancellingId === risk.id
                                  ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                  : 'bg-neutral-900 hover:bg-neutral-800 text-white active:scale-95 cursor-pointer shadow-xs'
                              }`}
                              id={`cancel-suspicious-btn-${risk.id}`}
                            >
                              {cancellingId === risk.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>Cancel Bookings</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rerun Scan Action bar */}
              <div className="flex justify-between items-center text-xs text-neutral-500 pt-2 border-t border-neutral-100">
                <span>Completed successfully. {successCount > 0 && <span className="text-emerald-600 font-bold">Cancelled {successCount} orders.</span>}</span>
                <button
                  onClick={handleStartScan}
                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  id="rerun-ai-scan-btn"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rerun Fresh Scan</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
            id="close-ai-modal-btn"
          >
            Done
          </button>
        </div>

      </motion.div>
    </div>
  );
}
