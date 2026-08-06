import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, ShieldCheck, LogIn } from 'lucide-react';
import { supabase } from '../supabase';

interface LoginProps {
  onLogin: (email: string) => void;
  appName: string;
}

export default function Login({ onLogin, appName }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      
      if (data.user) {
        onLogin(data.user.email || email.trim());
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your network or credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4" id="login-container">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] bg-white rounded-xl border border-gray-200 p-8 shadow-sm"
        id="login-card"
      >
        <div className="flex flex-col items-center text-center mb-8" id="login-header">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 border border-blue-100" id="logo-badge">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight" id="login-title">
            {appName || "COD Order Hub"}
          </h1>
          <p className="text-xs text-gray-500 mt-1.5 font-medium" id="login-subtitle">
            Secure Administrator Access Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
          <div className="space-y-1.5" id="field-email-container">
            <label className="text-xs font-semibold text-gray-700 block pl-0.5">
              Administrator Email
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email-input"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-1.5" id="field-password-container">
            <label className="text-xs font-semibold text-gray-700 block pl-0.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400 text-gray-800"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-600 font-semibold" id="login-error-box">
              {error}
            </div>
          )}

          <div className="pt-2" id="login-actions">
            <button
              id="submit-login-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <span>
                {isLoading ? 'Verifying access...' : 'Authenticate'}
              </span>
              {!isLoading && <LogIn className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
