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
  ShieldCheck,
  Database
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
  onOpenDbConfig?: () => void;
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
  onOpenDbConfig,
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Tournament Name */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('live-viewer')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-md shrink-0">
              <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="text-[9px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-amber-400 font-semibold truncate max-w-[90px] sm:max-w-none">
                  Adior Stone
                </span>
                <span className="inline-flex items-center px-1 sm:px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  2026
                </span>
              </div>
              <h1 className="text-xs sm:text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent leading-tight truncate max-w-[130px] sm:max-w-none">
                KVO Box Cricket
              </h1>
            </div>
          </div>

          {/* Right Controls: Match Selector + Admin Status */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Match Quick Selector */}
            <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 shadow-inner">
              <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
              <select
                id="navbar-match-select"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-white focus:outline-none cursor-pointer max-w-[95px] sm:max-w-[200px] md:max-w-[240px] truncate"
              >
                {matches.map((m) => {
                  const tA = teams.find(t => t.id === m.teamAId);
                  const tB = teams.find(t => t.id === m.teamBId);
                  const isLive = m.status === 'LIVE';
                  return (
                    <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                      {isLive ? '🔴 ' : ''}
                      {tA?.shortName || tA?.name || 'TBD'} vs {tB?.shortName || tB?.name || 'TBD'} ({m.status})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Admin Login / Logout Button */}
            {isAdmin ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                {onOpenDbConfig && (
                  <button
                    onClick={onOpenDbConfig}
                    className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl px-2 sm:px-2.5 py-1.5 text-xs font-bold transition shadow-sm"
                    title="Configure Cloud Database Connection"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Database</span>
                  </button>
                )}
                <div className="flex items-center space-x-1.5 bg-emerald-950/70 border border-emerald-600/50 rounded-xl px-2 sm:px-3 py-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center space-x-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold transition shadow-sm"
              >
                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Admin Login</span>
                <span className="sm:hidden text-[11px]">Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/80 text-xs sm:text-sm font-medium touch-pan-x">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-all duration-150 ${isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : item.highlight
                    ? 'bg-emerald-950/70 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-700/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.requiresAdmin && !isAdmin && (
                  <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Multi-Live Matches Sub-Bar (when 2 or more matches are LIVE) */}
        {matches.filter(m => m.status === 'LIVE').length > 1 && (
          <div className="py-2 border-t border-slate-800/60 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
            <span className="flex items-center space-x-1.5 text-rose-400 font-black uppercase text-[11px] whitespace-nowrap">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span>Live Parallel:</span>
            </span>
            {matches.filter(m => m.status === 'LIVE').map(lm => {
              const mA = teams.find(t => t.id === lm.teamAId);
              const mB = teams.find(t => t.id === lm.teamBId);
              const isSelected = lm.id === selectedMatchId;
              const curInn = lm.innings[lm.currentInningsIndex];
              return (
                <button
                  key={lm.id}
                  onClick={() => setSelectedMatchId(lm.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap border ${isSelected
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md font-black'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                    }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mA?.color || '#3b82f6' }} />
                  <span>{mA?.name || 'T1'} vs {mB?.name || 'T2'}</span>
                  <span className="font-mono text-[10px] opacity-80">
                    ({curInn?.totalRuns}/{curInn?.totalWickets})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
