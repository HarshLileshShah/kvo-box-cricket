'use client';

import React, { useState } from 'react';
import { ShieldAlert, Lock, AlertTriangle, Eye, EyeOff, Loader2, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  warningNote?: string;
  confirmButtonText?: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  title,
  description,
  warningNote = 'Team names, colors, and player rosters will remain safely intact.',
  confirmButtonText = 'Confirm Reset',
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Admin password is required to authorize this reset.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Incorrect admin password or authorization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white leading-tight">{title}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Reassurance Warning Box */}
        {warningNote && (
          <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200 leading-snug">{warningNote}</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-rose-950/80 border border-rose-500/60 rounded-xl p-3 text-xs text-rose-200">
            {error}
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Enter Admin Password to Authorize</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Admin password..."
                disabled={isLoading}
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition border border-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !password}
              className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white transition flex items-center space-x-1.5 shadow-lg shadow-rose-900/40 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <span>{confirmButtonText}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
