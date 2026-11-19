'use client';

import React from 'react';
import {
  Trophy,
  Tv,
  Gamepad2,
  TableProperties,
  CalendarDays,
  Users,
  Award,
  BookOpen,
  Flame,
  Lock,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { Match, Team } from '@/types/cricket';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  matches: Match[];
  teams: Team[];
  selectedMatchId: string;
  setSelectedMatchId: (id: string) => void;
  isAdmin: boolean;
  adminUser: { loginId: string; name: string } | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  matches,
  teams,
  selectedMatchId,
  setSelectedMatchId,
  isAdmin,
  adminUser,
  onOpenLogin,
  onLogout,
}) => {
  const activeMatch = matches.find(m => m.id === selectedMatchId);

  const navItems = [
    { id: 'live-viewer', label: 'Live Score', icon: Tv },
    {
      id: 'scorer',
      label: 'Admin Scorer',
      icon: Gamepad2,
      highlight: true,
      requiresAdmin: true
    },
    { id: 'standings', label: 'Points Table & Semis', icon: TableProperties },
    { id: 'schedule', label: 'Fixtures', icon: CalendarDays },
    { id: 'teams', label: 'Teams & Rosters', icon: Users },
    { id: 'stats', label: 'Player Stats', icon: Award },
    { id: 'rules', label: 'PDF Rulebook', icon: BookOpen },
  ];

  const handleTabClick = (item: typeof navItems[0]) => {
    if (item.requiresAdmin && !isAdmin) {
      onOpenLogin();
      return;
    }
    setActiveTab(item.id);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Top Bar with Brand, Match Selector & Admin Auth */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tournament Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('live-viewer')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-md">
              <Trophy className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Adior Stone Presents</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  KVO 2026
                </span>
              </div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                KVO Box Cricket Tournament
              </h1>
            </div>
          </div>

          {/* Right Controls: Match Selector + Admin Status */}
          <div className="flex items-center space-x-3">
            {/* Match Quick Selector */}
            <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-inner">
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
              <label htmlFor="navbar-match-select" className="text-xs text-slate-400 font-medium hidden sm:inline">Match:</label>
              <select
                id="navbar-match-select"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
              >
                {matches.map((m) => {
                  const tA = teams.find(t => t.id === m.teamAId);
                  const tB = teams.find(t => t.id === m.teamBId);
                  return (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {m.stage === 'SEMI_FINAL' ? '[Semi] ' : m.stage === 'FINAL' ? '[Final] ' : '[League] '}
                      {tA?.shortName || 'T1'} vs {tB?.shortName || 'T2'} ({m.status})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Admin Login / Logout Button */}
            {isAdmin ? (
              <div className="flex items-center space-x-2 bg-emerald-950/70 border border-emerald-600/50 rounded-xl px-3 py-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 hidden md:inline">
                  Admin: {adminUser?.loginId || 'Scorer'}
                </span>
                <button
                  onClick={onLogout}
                  className="text-xs text-slate-400 hover:text-rose-400 p-0.5 rounded transition"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2.5 no-scrollbar border-t border-slate-800/80 text-xs sm:text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all duration-150 ${isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : item.highlight
                    ? 'bg-emerald-950/70 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-700/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.requiresAdmin && !isAdmin && (
                  <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
