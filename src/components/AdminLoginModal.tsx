'use client';

import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, KeyRound, X, CheckCircle2 } from 'lucide-react';
import { UserRole } from '@/types/cricket';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { loginId: string; name: string; role?: UserRole }) => void;
}

const PRESET_ACCOUNTS = [
  { id: 'sagar', label: 'Sagar', role: 'Scorer', desc: 'Current Over Edit & Match Scoring', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: 'bhavin', label: 'Bhavin', role: 'Scorer', desc: 'Current Over Edit & Match Scoring', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: 'admin', label: 'Admin', role: 'Super Admin', desc: 'Full Access (All Past Overs Edit)', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
];

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [loginId, setLoginId] = useState('sagar');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN',
          loginId: loginId.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('kvo_admin_auth', JSON.stringify(data.user));
        onLoginSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Scorer & Admin Login</h3>
            <p className="text-xs text-slate-400 mt-0.5">Select your account or enter credentials</p>
          </div>
        </div>

        {/* Quick Account Selector Chips */}
        <div className="mb-5 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Select Scorer / Admin Account
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_ACCOUNTS.map((acc) => {
              const isSelected = loginId.toLowerCase() === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    setLoginId(acc.id);
                    setError('');
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col items-start relative ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs capitalize">{acc.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <span className={`text-[10px] px-1 py-0.2 rounded border font-semibold mt-1 ${acc.badgeColor}`}>
                    {acc.role}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mt-2">
            {loginId.toLowerCase() === 'admin' ? (
              <span className="text-amber-300 font-medium">
                🛡️ <b>Super Admin:</b> Full access to edit & delete any past ball from any over.
              </span>
            ) : (
              <span className="text-emerald-300 font-medium">
                🏏 <b>Official Scorer ({loginId}):</b> Full scoring & ball controls for current over. Past overs require Super Admin.
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-rose-950/50 border border-rose-500/50 text-rose-300 text-xs p-3 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Login ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="sagar / bhavin / admin"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              <span className="text-[10px] text-slate-500">Default: kvo@2026</span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : `Sign In as ${loginId || 'User'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
