'use client';

import React, { useState, useEffect } from 'react';
import { Database, Server, CheckCircle2, AlertCircle, Loader2, X, Lock, ExternalLink, ShieldCheck } from 'lucide-react';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminPassword?: string;
  onSuccess?: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
  adminPassword = '',
  onSuccess,
}) => {
  const [dbType, setDbType] = useState<'mongodb' | 'postgres' | 'redis'>('mongodb');
  const [mongoUri, setMongoUri] = useState('');
  const [postgresUrl, setPostgresUrl] = useState('');
  const [redisUrl, setRedisUrl] = useState('');
  const [redisToken, setRedisToken] = useState('');
  const [password, setPassword] = useState(adminPassword);

  const [currentStatus, setCurrentStatus] = useState<{
    configured: boolean;
    type: string;
    connected: boolean;
    source: string;
    maskedUrl?: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/database');
      if (res.ok) {
        const data = await res.json();
        setCurrentStatus(data);
        if (data.type && data.type !== 'none') {
          setDbType(data.type);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPayloadCreds = () => {
    if (dbType === 'mongodb') {
      return { type: 'mongodb', mongoUri: mongoUri.trim() };
    }
    if (dbType === 'postgres') {
      return { type: 'postgres', postgresUrl: postgresUrl.trim() };
    }
    return { type: 'redis', redisUrl: redisUrl.trim(), redisToken: redisToken.trim() };
  };

  const handleTest = async () => {
    setStatusMessage(null);
    setIsTesting(true);
    try {
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_CONNECTION',
          password: password || 'admin',
          creds: getPayloadCreds(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: data.message || 'Connection test successful!' });
      } else {
        setStatusMessage({ type: 'error', text: data.message || data.error || 'Connection failed' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Test connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_CONNECTION',
          password: password || 'admin',
          creds: getPayloadCreds(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: data.message || 'Database connected and synchronized successfully!' });
        await fetchStatus();
        onSuccess?.();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save database connection' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Database Configuration</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect a real cloud database to make tournament data 100% constant across all users and devices.
            </p>
          </div>
        </div>

        {/* Current Connection Status Box */}
        {currentStatus && (
          <div className={`p-4 rounded-2xl border mb-6 flex items-start justify-between gap-3 ${
            currentStatus.connected 
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
              : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
          }`}>
            <div className="flex items-start space-x-3">
              {currentStatus.connected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Server className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <span className="font-black uppercase tracking-wider block">
                  {currentStatus.connected ? 'Active Database' : 'Storage Mode'}
                </span>
                <span className="text-slate-300 font-semibold text-sm">
                  {currentStatus.source}
                </span>
                {currentStatus.maskedUrl && (
                  <span className="block text-[11px] font-mono text-slate-400 truncate mt-0.5">
                    {currentStatus.maskedUrl}
                  </span>
                )}
              </div>
            </div>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              currentStatus.connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {currentStatus.connected ? 'ONLINE' : 'LOCAL ONLY'}
            </span>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3.5 rounded-xl text-xs mb-5 flex items-start space-x-2 border ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200' 
              : 'bg-rose-950/60 border-rose-500 text-rose-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Database Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setDbType('mongodb')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              dbType === 'mongodb' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MongoDB Atlas
          </button>
          <button
            type="button"
            onClick={() => setDbType('postgres')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              dbType === 'postgres' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PostgreSQL (Neon)
          </button>
          <button
            type="button"
            onClick={() => setDbType('redis')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              dbType === 'redis' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upstash / KV
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {dbType === 'mongodb' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                MongoDB Connection String (URI)
              </label>
              <input
                type="text"
                value={mongoUri}
                onChange={e => setMongoUri(e.target.value)}
                placeholder="mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Free on <a href="https://www.mongodb.com/cloud/atlas/register" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">MongoDB Atlas <ExternalLink className="w-2.5 h-2.5" /></a> (M0 Free Tier). Auto-creates collection.
              </span>
            </div>
          )}

          {dbType === 'postgres' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                PostgreSQL Connection URL (DATABASE_URL)
              </label>
              <input
                type="text"
                value={postgresUrl}
                onChange={e => setPostgresUrl(e.target.value)}
                placeholder="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Works with <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-0.5">Neon.tech <ExternalLink className="w-2.5 h-2.5" /></a> or Supabase. Auto-creates state table.
              </span>
            </div>
          )}

          {dbType === 'redis' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Upstash REST URL
                </label>
                <input
                  type="text"
                  value={redisUrl}
                  onChange={e => setRedisUrl(e.target.value)}
                  placeholder="https://<id>.upstash.io"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Upstash REST Token
                </label>
                <input
                  type="password"
                  value={redisToken}
                  onChange={e => setRedisToken(e.target.value)}
                  placeholder="AX..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Admin Password Confirmation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password to authorize..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || isLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center space-x-1.5 border border-slate-700"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              <span>Test Connection</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isLoading || isTesting}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1.5 shadow-lg shadow-emerald-900/40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting & Syncing...</span>
                  </>
                ) : (
                  <span>Connect & Sync State</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
