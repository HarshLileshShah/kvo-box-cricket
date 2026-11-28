'use client';

import React, { useState } from 'react';
import { Match, Team, MatchStage, MatchStatus } from '@/types/cricket';
import { createInitialInnings, TOURNAMENT_EVENT_SCHEDULE } from '@/lib/mockData';
import {
  CalendarDays,
  Plus,
  Gamepad2,
  Clock,
  Coins,
  Trophy,
  CheckCircle2,
  Flame,
  AlertTriangle,
  ShieldCheck,
  Users,
  Lock,
  Radio,
  RotateCcw,
  MapPin,
  Coffee,
  Mic,
  Sparkles,
  Camera,
  BookOpen,
  Utensils,
  Ticket,
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Medal,
  Award,
  Layers
} from 'lucide-react';

interface ScheduleManagerProps {
  matches: Match[];
  teams: Team[];
  onSaveMatch: (match: Match) => Promise<void>;
  onSelectMatch: (matchId: string) => void;
  setActiveTab: (tab: string) => void;
  onOpenPlaying8Modal: (match: Match) => void;
  onSetMatchStatus?: (matchId: string, status: MatchStatus) => Promise<void>;
  onResetMatch?: (matchId: string) => void;
  onSyncOfficialSchedule?: () => Promise<void>;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  matches,
  teams,
  onSaveMatch,
  onSelectMatch,
  setActiveTab,
  onOpenPlaying8Modal,
  onSetMatchStatus,
  onResetMatch,
  onSyncOfficialSchedule,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'FIXTURES' | 'POSTER' | 'TIMELINE'>('FIXTURES');
  const [filterStage, setFilterStage] = useState<'ALL' | 'LEAGUE' | 'PLAYOFFS'>('ALL');
  const [showAddMatchModal, setShowAddMatchModal] = useState(false);
  const [showTossModal, setShowTossModal] = useState(false);
  const [selectedMatchForToss, setSelectedMatchForToss] = useState<Match | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // New Match State
  const [newTeamAId, setNewTeamAId] = useState(teams[0]?.id || '');
  const [newTeamBId, setNewTeamBId] = useState(teams[1]?.id || '');
  const [newStage, setNewStage] = useState<MatchStage>('LEAGUE');
  const [newDate, setNewDate] = useState('2026-11-29');
  const [newTime, setNewTime] = useState('09:00 - 10:00 AM');
  const [newVenue, setNewVenue] = useState('BCU Basecamp - Turf 1');
  const [newOvers, setNewOvers] = useState(8);

  // Toss State
  const [tossWinnerId, setTossWinnerId] = useState('');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');

  // Calculate league match counts per team (max 3 matches rule!)
  const leagueMatchCounts: Record<string, number> = {};
  teams.forEach(t => {
    leagueMatchCounts[t.id] = 0;
  });

  matches.filter(m => m.stage === 'LEAGUE').forEach(m => {
    if (leagueMatchCounts[m.teamAId] !== undefined) leagueMatchCounts[m.teamAId] += 1;
    if (leagueMatchCounts[m.teamBId] !== undefined) leagueMatchCounts[m.teamBId] += 1;
  });

  const filteredMatches = matches.filter(m => {
    if (filterStage === 'LEAGUE') return m.stage === 'LEAGUE';
    if (filterStage === 'PLAYOFFS') return m.stage === 'SEMI_FINAL' || m.stage === 'FINAL';
    return true;
  });

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamAId === newTeamBId) {
      alert('Team A and Team B must be different');
      return;
    }

    if (newStage === 'LEAGUE') {
      if ((leagueMatchCounts[newTeamAId] || 0) >= 3) {
        alert(`${teams.find(t => t.id === newTeamAId)?.name} already has 3 scheduled league matches (max 3 allowed).`);
        return;
      }
      if ((leagueMatchCounts[newTeamBId] || 0) >= 3) {
        alert(`${teams.find(t => t.id === newTeamBId)?.name} already has 3 scheduled league matches (max 3 allowed).`);
        return;
      }
    }

    const matchId = `match-${Date.now()}`;
    const newMatch: Match = {
      id: matchId,
      stage: newStage,
      teamAId: newTeamAId,
      teamBId: newTeamBId,
      date: newDate,
      time: newTime,
      boxVenue: newVenue,
      totalOvers: newOvers,
      status: 'UPCOMING',
      currentInningsIndex: 0,
      innings: [
        createInitialInnings(newTeamAId, newTeamBId, teams),
        createInitialInnings(newTeamBId, newTeamAId, teams),
      ],
      notes: `${newStage} Match - ${newOvers} overs`,
    };

    await onSaveMatch(newMatch);
    setShowAddMatchModal(false);
  };

  const openTossModal = (match: Match) => {
    setSelectedMatchForToss(match);
    setTossWinnerId(match.teamAId);
    setTossDecision('BAT');
    setShowTossModal(true);
  };

  const handleApplyToss = async () => {
    if (!selectedMatchForToss) return;

    const battingFirstId = tossDecision === 'BAT'
      ? tossWinnerId
      : (tossWinnerId === selectedMatchForToss.teamAId ? selectedMatchForToss.teamBId : selectedMatchForToss.teamAId);
    const bowlingFirstId = battingFirstId === selectedMatchForToss.teamAId ? selectedMatchForToss.teamBId : selectedMatchForToss.teamAId;

    const updatedMatch: Match = {
      ...selectedMatchForToss,
      status: 'LIVE',
      tossWinnerId,
      tossDecision,
      currentInningsIndex: 0,
      innings: [
        createInitialInnings(battingFirstId, bowlingFirstId, teams),
        createInitialInnings(bowlingFirstId, battingFirstId, teams),
      ],
    };

    await onSaveMatch(updatedMatch);
    setShowTossModal(false);
    onSelectMatch(updatedMatch.id);
    setActiveTab('scorer');
  };

  const handleTriggerSync = async () => {
    if (!onSyncOfficialSchedule) return;
    if (!confirm('Sync tournament fixtures with the official match poster? (This will align match timings, venues and pairings to the Sunday, 29th Nov schedule)')) return;
    try {
      setIsSyncing(true);
      await onSyncOfficialSchedule();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              BCU Basecamp • Sunday, 29th Nov 2026
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2 mt-1">
            <CalendarDays className="w-6 h-6 text-amber-400 shrink-0" />
            <span>Tournament Schedule & Fixtures</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Official 9 League Matches (Max 3 matches/team across Turf 1 & Turf 2) + Semi-Finals & Grand Final.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-stretch sm:self-auto">
          {onSyncOfficialSchedule && (
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition active:scale-95 disabled:opacity-50"
              title="Reset or Align schedule with official poster"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Official Poster'}</span>
            </button>
          )}

          <button
            onClick={() => setShowAddMatchModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Schedule Match</span>
          </button>
        </div>
      </div>

      {/* Main Mode Navigation (Fixtures vs Official Poster vs Day Timeline) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap sm:flex-nowrap gap-1 shadow-md">
        <button
          onClick={() => setActiveSubTab('FIXTURES')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeSubTab === 'FIXTURES'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gamepad2 className="w-4 h-4 shrink-0" />
          <span>Match Fixtures ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('POSTER')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeSubTab === 'POSTER'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ImageIcon className="w-4 h-4 shrink-0" />
          <span>Official Match Schedule Poster</span>
        </button>

        <button
          onClick={() => setActiveSubTab('TIMELINE')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
            activeSubTab === 'TIMELINE'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Event Day Timeline (7:30 AM - 5 PM)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: FIXTURES LIST                                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'FIXTURES' && (
        <div className="space-y-6">
          {/* Max 3 Matches per Team Compliance Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>League Schedule Quota (Exact 3 Matches per Team)</span>
              </span>
              <span className="text-[11px] text-slate-400">Total League: {matches.filter(m => m.stage === 'LEAGUE').length}/9</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {teams.map(t => {
                const count = leagueMatchCounts[t.id] || 0;
                const isFull = count === 3;
                const isOver = count > 3;
                return (
                  <div
                    key={t.id}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition ${
                      isOver
                        ? 'bg-rose-950/40 border-rose-600/50 text-rose-300'
                        : isFull
                          ? 'bg-slate-950 border-emerald-500/30 text-slate-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 min-w-0">
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt={t.name} className="w-4 h-4 object-contain rounded shrink-0" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color || '#3b82f6' }} />
                      )}
                      <span className="font-bold truncate text-[11px]">{t.name}</span>
                    </div>
                    <span className={`text-xs font-black mt-1.5 ${isFull ? 'text-emerald-400' : isOver ? 'text-rose-400' : 'text-amber-400'}`}>
                      {count} / 3 matches
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Stage Pills */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
            {(['ALL', 'LEAGUE', 'PLAYOFFS'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterStage(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterStage === tab
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'ALL' ? 'All Fixtures' : tab === 'LEAGUE' ? 'League Stage (9 Matches)' : 'Playoffs (Top 4 Semis & Final)'}
              </button>
            ))}
          </div>

          {/* Fixtures Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map(m => {
              const isPlayoff = m.stage === 'SEMI_FINAL' || m.stage === 'FINAL';
              const tA = teams.find(t => t.id === m.teamAId);
              const tB = teams.find(t => t.id === m.teamBId);
              const isLive = m.status === 'LIVE';
              const isCompleted = m.status === 'COMPLETED';
              const isTurf1 = m.boxVenue?.includes('Turf 1');

              const teamAName = tA?.name || 'TBD';
              const teamBName = tB?.name || 'TBD';

              return (
                <div
                  key={m.id}
                  className={`bg-slate-900 rounded-2xl p-3.5 sm:p-5 border transition shadow-lg ${
                    isLive
                      ? 'border-rose-500/60 ring-2 ring-rose-500/20'
                      : isCompleted
                        ? 'border-slate-800 opacity-90'
                        : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header: Stage + Turf + Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5 sm:pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        {m.stage === 'LEAGUE' ? 'League Match' : m.stage.replace('_', ' ')}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isTurf1
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{m.boxVenue || 'Turf'}</span>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{m.totalOvers} Ov</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isLive
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                            : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>

                      {/* Live Toggle */}
                      {onSetMatchStatus && (
                        m.status !== 'LIVE' ? (
                          <button
                            onClick={() => onSetMatchStatus(m.id, 'LIVE')}
                            className="px-2 py-0.5 rounded-md bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-700/60 text-[10px] font-black transition flex items-center space-x-1"
                            title="Run this match as LIVE"
                          >
                            <Radio className="w-2.5 h-2.5 text-rose-400" />
                            <span>Make Live</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onSetMatchStatus(m.id, 'UPCOMING')}
                            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-semibold transition"
                            title="Set back to UPCOMING"
                          >
                            Set Upcoming
                          </button>
                        )
                      )}

                      {/* Reset Match Button */}
                      {onResetMatch && (
                        <button
                          onClick={() => onResetMatch(m.id)}
                          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 text-[10px] font-bold transition flex items-center space-x-1"
                          title="Reset this match"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Teams & Scores */}
                  <div className="py-3.5 space-y-3">
                    {/* Team A */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {tA?.logoUrl ? (
                          <img
                            src={tA.logoUrl}
                            alt={tA.name}
                            className="w-8 h-8 object-contain rounded-lg p-0.5 bg-slate-950 border border-slate-800 shrink-0 shadow-sm"
                          />
                        ) : (
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: tA?.color || '#3b82f6' }}
                          />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-white text-sm sm:text-base block truncate leading-tight">
                            {teamAName}
                          </span>
                          {tA?.shortName && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {tA.shortName}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-black text-amber-400 text-lg">
                        {m.innings[0]?.totalRuns ?? '-'}
                        {m.innings[0]?.totalRuns !== undefined && (
                          <span className="text-xs text-rose-400">/{m.innings[0].totalWickets}</span>
                        )}
                      </span>
                    </div>

                    {/* Team B */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {tB?.logoUrl ? (
                          <img
                            src={tB.logoUrl}
                            alt={tB.name}
                            className="w-8 h-8 object-contain rounded-lg p-0.5 bg-slate-950 border border-slate-800 shrink-0 shadow-sm"
                          />
                        ) : (
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: tB?.color || '#ef4444' }}
                          />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-white text-sm sm:text-base block truncate leading-tight">
                            {teamBName}
                          </span>
                          {tB?.shortName && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {tB.shortName}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-black text-amber-400 text-lg">
                        {m.innings[1]?.totalRuns ?? '-'}
                        {m.innings[1]?.totalRuns !== undefined && (
                          <span className="text-xs text-rose-400">/{m.innings[1].totalWickets}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Match Meta: Date, Time & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center space-x-2 font-semibold text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{m.time}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onOpenPlaying8Modal(m)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 text-xs transition"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {isPlayoff
                            ? (m.lineupSubmitted ? 'Playing 9 ✓' : 'Playing 9 (All 9)')
                            : (m.lineupSubmitted ? 'Playing 8 ✓' : 'Playing 8')}
                        </span>
                      </button>

                      {m.status === 'UPCOMING' && (
                        <button
                          onClick={() => openTossModal(m)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 text-xs transition"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Toss</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onSelectMatch(m.id);
                          setActiveTab(isLive ? 'scorer' : 'live-viewer');
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition"
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>{isLive ? 'Score Live' : 'View Match'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: OFFICIAL MATCH SCHEDULE POSTER & MATRIX                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'POSTER' && (
        <div className="space-y-6">
          {/* Tournament Overview Card */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 block">
                  ADIOR STONES PRESENTS
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  KVO Box Cricket Tournament Schedule
                </h3>
                <p className="text-xs text-slate-300 mt-1 flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>BCU Basecamp • Sunday, 29th November 2026</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Simultaneous Arenas</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 font-black text-xs">
                    Turf 1 (Box 1)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-xs">
                    Turf 2 (Box 2)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Simultaneous Match Schedule Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Official Time Slot & Turf Allocation Matrix
              </span>
              <span className="text-[11px] text-slate-400">9 League Matches + Playoffs</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-3.5 w-36">Time Slot</th>
                    <th className="p-3.5 bg-sky-950/20 text-sky-400 border-l border-slate-800">
                      Turf 1 (Court 1)
                    </th>
                    <th className="p-3.5 bg-emerald-950/20 text-emerald-400 border-l border-slate-800">
                      Turf 2 (Court 2)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {/* Slot 1: 9:00 - 10:00 AM */}
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-amber-400 whitespace-nowrap">
                      09:00 AM – 10:00 AM
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-2">
                        <img src="/logos/truflo-strikers.png" alt="TS" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Truflo Strikers</span>
                        <span className="text-slate-500 font-black text-xs">VS</span>
                        <img src="/logos/amsteel-inferno.png" alt="AI" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Amsteel Inferno</span>
                      </div>
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-2">
                        <img src="/logos/kraftech-titans.png" alt="KT" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Kraftech Titans</span>
                        <span className="text-slate-500 font-black text-xs">VS</span>
                        <img src="/logos/mavericks-royals.png" alt="MR" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Mavericks Royals</span>
                      </div>
                    </td>
                  </tr>

                  {/* Slot 2: 10:00 - 11:00 AM */}
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-amber-400 whitespace-nowrap">
                      10:00 AM – 11:00 AM
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-2">
                        <img src="/logos/truflo-strikers.png" alt="TS" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Truflo Strikers</span>
                        <span className="text-slate-500 font-black text-xs">VS</span>
                        <img src="/logos/leo-fanatics.png" alt="LF" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Leo Fanatics</span>
                      </div>
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-2">
                        <img src="/logos/kraftech-titans.png" alt="KT" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Kraftech Titans</span>
                        <span className="text-slate-500 font-black text-xs">VS</span>
                        <img src="/logos/party-hunterz.png" alt="PH" className="w-8 h-5 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Party Hunterz</span>
                      </div>
                    </td>
                  </tr>

                  {/* Slot 3: 11:00 AM - 12:00 PM */}
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-amber-400 whitespace-nowrap">
                      11:00 AM – 12:00 PM
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-2">
                        <img src="/logos/amsteel-inferno.png" alt="AI" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Amsteel Inferno</span>
                        <span className="text-slate-500 font-black text-xs">VS</span>
                        <img src="/logos/party-hunterz.png" alt="PH" className="w-8 h-5 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Party Hunterz</span>
                      </div>
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-2">
                        <img src="/logos/mavericks-royals.png" alt="MR" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Mavericks Royals</span>
                        <span className="text-slate-500 font-black text-xs">VS</span>
                        <img src="/logos/leo-fanatics.png" alt="LF" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Leo Fanatics</span>
                      </div>
                    </td>
                  </tr>

                  {/* Slot 4: 12:00 PM - 01:00 PM */}
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-amber-400 whitespace-nowrap">
                      12:00 PM – 01:00 PM
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-2">
                        <img src="/logos/amsteel-inferno.png" alt="AI" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Amsteel Inferno</span>
                        <span className="text-slate-500 font-black text-xs">VS</span>
                        <img src="/logos/kraftech-titans.png" alt="KT" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Kraftech Titans</span>
                      </div>
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-2">
                        <img src="/logos/truflo-strikers.png" alt="TS" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Truflo Strikers</span>
                        <span className="text-slate-500 font-black text-xs">VS</span>
                        <img src="/logos/mavericks-royals.png" alt="MR" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Mavericks Royals</span>
                      </div>
                    </td>
                  </tr>

                  {/* Slot 5: 01:00 PM - 02:00 PM */}
                  <tr className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-amber-400 whitespace-nowrap">
                      01:00 PM – 02:00 PM
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-2">
                        <img src="/logos/party-hunterz.png" alt="PH" className="w-8 h-5 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Party Hunterz</span>
                        <span className="text-slate-500 font-black text-xs">VS</span>
                        <img src="/logos/leo-fanatics.png" alt="LF" className="w-6 h-6 object-contain rounded bg-slate-950 p-0.5" />
                        <span className="font-bold text-white">Leo Fanatics</span>
                      </div>
                    </td>
                    <td className="p-3.5 border-l border-slate-800 text-slate-500 italic font-semibold">
                      NO MATCH (Lunch Break on Turf 2)
                    </td>
                  </tr>

                  {/* Slot 6: 02:30 PM - 03:45 PM (Semi-Finals) */}
                  <tr className="bg-amber-950/10 hover:bg-amber-950/20 transition">
                    <td className="p-3.5 font-black text-amber-400 whitespace-nowrap">
                      02:30 PM – 03:45 PM
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-1.5 font-black text-emerald-400">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>SEMI-FINAL 1 (Rank 1 vs Rank 4)</span>
                      </div>
                    </td>
                    <td className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-1.5 font-black text-emerald-400">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>SEMI-FINAL 2 (Rank 2 vs Rank 3)</span>
                      </div>
                    </td>
                  </tr>

                  {/* Slot 7: 04:00 PM - 05:00 PM (Grand Final) */}
                  <tr className="bg-gradient-to-r from-amber-500/10 to-transparent">
                    <td className="p-3.5 font-black text-amber-400 whitespace-nowrap">
                      04:00 PM – 05:00 PM
                    </td>
                    <td colSpan={2} className="p-3.5 border-l border-slate-800">
                      <div className="flex items-center space-x-2 font-black text-amber-300 text-sm">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <span>🏆 GRAND FINAL (Winner SF 1 vs Winner SF 2) • Turf 1</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Poster Graphic Showcase */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-white text-base">Official Match Schedule Poster Graphic</h4>
                <p className="text-xs text-slate-400">Designed and released by Organizing Committee</p>
              </div>
              <a
                href="/logos/match-schedule-poster.jpg"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20"
              >
                <span>View Full Size</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex justify-center bg-slate-950 p-2 sm:p-4 rounded-xl border border-slate-800">
              <img
                src="/logos/match-schedule-poster.jpg"
                alt="KVO Box Cricket Match Schedule Poster"
                className="max-h-[700px] w-auto rounded-lg shadow-2xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: FULL DAY PROGRAM TIMELINE (7:30 AM - 5:00 PM)                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'TIMELINE' && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xl font-black text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Full Event Day Timeline & Ceremonies</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Complete schedule of reporting, breakfast, opening ceremony, match blocks, rolling lunch, tambola, playoffs, high tea, and prize distribution.
            </p>
          </div>

          {/* Timeline List */}
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-800 before:z-0">
            {TOURNAMENT_EVENT_SCHEDULE.map((item, index) => {
              const isCeremony = item.category === 'ceremony';
              const isCricket = item.category === 'cricket';
              const isFood = item.category === 'food';
              const isActivity = item.category === 'activity';

              return (
                <div
                  key={index}
                  className={`relative z-10 rounded-2xl p-4 border transition shadow-md ml-1 sm:ml-2 pl-12 ${
                    item.highlight
                      ? 'bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/40 ring-1 ring-amber-500/20'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  {/* Left Icon Dot */}
                  <div
                    className={`absolute left-3 top-4 w-7 h-7 rounded-xl flex items-center justify-center shadow-md ${
                      isCricket
                        ? 'bg-amber-500 text-slate-950'
                        : isCeremony
                          ? 'bg-indigo-600 text-white'
                          : isFood
                            ? 'bg-orange-500 text-white'
                            : 'bg-rose-500 text-white'
                    }`}
                  >
                    {isCricket && <Trophy className="w-3.5 h-3.5 font-bold" />}
                    {isCeremony && <Mic className="w-3.5 h-3.5" />}
                    {isFood && <Coffee className="w-3.5 h-3.5" />}
                    {isActivity && <Ticket className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block font-mono">
                        {item.time}
                      </span>
                      <h4 className="text-base font-black text-white mt-0.5">{item.program}</h4>
                      {item.details && (
                        <p className="text-xs text-slate-400 mt-1">{item.details}</p>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full self-start sm:self-center border shrink-0 ${
                        isCricket
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isCeremony
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : isFood
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {item.category?.toUpperCase() || 'EVENT'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SCHEDULE NEW MATCH                                                 */}
      {/* ========================================================================= */}
      {showAddMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white">Schedule Custom Match</h3>

            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Team A</label>
                  <select
                    value={newTeamAId}
                    onChange={e => setNewTeamAId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({leagueMatchCounts[t.id] || 0}/3)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Team B</label>
                  <select
                    value={newTeamBId}
                    onChange={e => setNewTeamBId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({leagueMatchCounts[t.id] || 0}/3)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Stage</label>
                  <select
                    value={newStage}
                    onChange={e => setNewStage(e.target.value as MatchStage)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="LEAGUE">League Match</option>
                    <option value="SEMI_FINAL">Semi-Final</option>
                    <option value="FINAL">Grand Final</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Overs</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newOvers}
                    onChange={e => setNewOvers(parseInt(e.target.value) || 8)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    placeholder="e.g. 09:00 - 10:00 AM"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Venue / Turf</label>
                <input
                  type="text"
                  value={newVenue}
                  onChange={e => setNewVenue(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMatchModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md"
                >
                  Create Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TOSS                                                               */}
      {/* ========================================================================= */}
      {showTossModal && selectedMatchForToss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>Conduct Match Toss</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Toss Winner</label>
                <select
                  value={tossWinnerId}
                  onChange={e => setTossWinnerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                >
                  <option value={selectedMatchForToss.teamAId}>
                    {teams.find(t => t.id === selectedMatchForToss.teamAId)?.name}
                  </option>
                  <option value={selectedMatchForToss.teamBId}>
                    {teams.find(t => t.id === selectedMatchForToss.teamBId)?.name}
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Elected To</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTossDecision('BAT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      tossDecision === 'BAT'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    🏏 BAT FIRST
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossDecision('BOWL')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      tossDecision === 'BOWL'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    ⚾ BOWL FIRST
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTossModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyToss}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md"
              >
                Start Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
