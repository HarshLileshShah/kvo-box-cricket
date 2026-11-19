'use client';

import React, { useState } from 'react';
import { Match, Team, MatchStage, MatchStatus } from '@/types/cricket';
import { createInitialInnings } from '@/lib/mockData';
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
  Users
} from 'lucide-react';

interface ScheduleManagerProps {
  matches: Match[];
  teams: Team[];
  onSaveMatch: (match: Match) => Promise<void>;
  onSelectMatch: (matchId: string) => void;
  setActiveTab: (tab: string) => void;
  onOpenPlaying8Modal: (match: Match) => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  matches,
  teams,
  onSaveMatch,
  onSelectMatch,
  setActiveTab,
  onOpenPlaying8Modal,
}) => {
  const [filterStage, setFilterStage] = useState<'ALL' | 'LEAGUE' | 'PLAYOFFS'>('ALL');
  const [showAddMatchModal, setShowAddMatchModal] = useState(false);
  const [showTossModal, setShowTossModal] = useState(false);
  const [selectedMatchForToss, setSelectedMatchForToss] = useState<Match | null>(null);

  // New Match State
  const [newTeamAId, setNewTeamAId] = useState(teams[0]?.id || '');
  const [newTeamBId, setNewTeamBId] = useState(teams[1]?.id || '');
  const [newStage, setNewStage] = useState<MatchStage>('LEAGUE');
  const [newDate, setNewDate] = useState('2026-11-20');
  const [newTime, setNewTime] = useState('18:00');
  const [newVenue, setNewVenue] = useState('Decathlon Turf Arena - Box 1');
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <CalendarDays className="w-6 h-6 text-amber-400" />
            <span>Tournament Schedule & Fixtures</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            League matches scheduled for a <strong>maximum of 3 matches per team</strong>.
          </p>
        </div>

        <button
          onClick={() => setShowAddMatchModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Schedule New Match</span>
        </button>
      </div>

      {/* Max 3 Matches per Team Compliance Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>League Match Schedule Quota (Max 3 Matches / Team)</span>
          </span>
          <span className="text-[11px] text-slate-400">Total League Fixtures: {matches.filter(m => m.stage === 'LEAGUE').length}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {teams.map(t => {
            const count = leagueMatchCounts[t.id] || 0;
            const isFull = count === 3;
            const isOver = count > 3;
            return (
              <div
                key={t.id}
                className={`p-2 rounded-xl border text-xs flex flex-col justify-between ${
                  isOver
                    ? 'bg-rose-950/40 border-rose-600/50 text-rose-300'
                    : isFull
                    ? 'bg-slate-950 border-emerald-500/30 text-slate-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-bold truncate text-[11px]">{t.name}</span>
                <span className={`text-xs font-black mt-1 ${isFull ? 'text-emerald-400' : isOver ? 'text-rose-400' : 'text-amber-400'}`}>
                  {count} / 3 matches
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        {(['ALL', 'LEAGUE', 'PLAYOFFS'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterStage(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterStage === tab
                ? 'bg-slate-800 text-amber-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'ALL' ? 'All Fixtures' : tab === 'LEAGUE' ? 'League Stage' : 'Playoffs (Top 4 Semis & Final)'}
          </button>
        ))}
      </div>

      {/* Fixtures Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMatches.map(m => {
          const tA = teams.find(t => t.id === m.teamAId);
          const tB = teams.find(t => t.id === m.teamBId);
          const isLive = m.status === 'LIVE';
          const isCompleted = m.status === 'COMPLETED';

          return (
            <div
              key={m.id}
              className={`bg-slate-900 rounded-2xl p-5 border transition shadow-lg ${
                isLive
                  ? 'border-rose-500/60 ring-2 ring-rose-500/20'
                  : isCompleted
                  ? 'border-slate-800 opacity-90'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    {m.stage === 'LEAGUE' ? 'League Match' : m.stage.replace('_', ' ')}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] text-slate-400 font-semibold">{m.totalOvers} Overs</span>
                </div>

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
              </div>

              {/* Teams & Scores */}
              <div className="py-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tA?.color || '#3b82f6' }}
                    />
                    <span className="font-bold text-white text-base">{tA?.name}</span>
                  </div>
                  <span className="font-mono font-black text-amber-400 text-lg">
                    {m.innings[0]?.totalRuns ?? '-'}
                    {m.innings[0]?.totalRuns !== undefined && (
                      <span className="text-xs text-rose-400">/{m.innings[0].totalWickets}</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tB?.color || '#ef4444' }}
                    />
                    <span className="font-bold text-white text-base">{tB?.name}</span>
                  </div>
                  <span className="font-mono font-black text-amber-400 text-lg">
                    {m.innings[1]?.totalRuns ?? '-'}
                    {m.innings[1]?.totalRuns !== undefined && (
                      <span className="text-xs text-rose-400">/{m.innings[1].totalWickets}</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Match Meta: Date, Time, Venue */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{m.date} {m.time}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onOpenPlaying8Modal(m)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 text-xs transition"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>{m.lineupSubmitted ? 'Playing 8 ✓' : 'Submit Playing 8'}</span>
                  </button>

                  {m.status === 'UPCOMING' && (
                    <button
                      onClick={() => openTossModal(m)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 text-xs transition"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Conduct Toss</span>
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

      {/* SCHEDULE MATCH MODAL */}
      {showAddMatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateMatch} className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-amber-400" />
              <span>Schedule New Fixture</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sched-team-a-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Team A</label>
                <select
                  id="sched-team-a-select"
                  value={newTeamAId}
                  onChange={(e) => setNewTeamAId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({leagueMatchCounts[t.id] || 0}/3 matches)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sched-team-b-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Team B</label>
                <select
                  id="sched-team-b-select"
                  value={newTeamBId}
                  onChange={(e) => setNewTeamBId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({leagueMatchCounts[t.id] || 0}/3 matches)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sched-stage-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Stage</label>
                <select
                  id="sched-stage-select"
                  value={newStage}
                  onChange={(e) => {
                    const st = e.target.value as MatchStage;
                    setNewStage(st);
                    if (st === 'SEMI_FINAL' || st === 'FINAL') setNewOvers(9);
                    else setNewOvers(8);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold"
                >
                  <option value="LEAGUE">League (Max 3 / team)</option>
                  <option value="SEMI_FINAL">Semi-Final (Top 4)</option>
                  <option value="FINAL">Grand Final</option>
                </select>
              </div>

              <div>
                <label htmlFor="sched-overs-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Overs</label>
                <select
                  id="sched-overs-select"
                  value={newOvers}
                  onChange={(e) => setNewOvers(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold"
                >
                  <option value={8}>8 Overs (League)</option>
                  <option value={9}>9 Overs (Playoffs)</option>
                  <option value={6}>6 Overs</option>
                  <option value={10}>10 Overs</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sched-date-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Date</label>
                <input
                  id="sched-date-input"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold"
                />
              </div>

              <div>
                <label htmlFor="sched-time-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Time</label>
                <input
                  id="sched-time-input"
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sched-venue-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Box / Turf Venue</label>
              <input
                id="sched-venue-input"
                type="text"
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddMatchModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20"
              >
                Schedule Fixture
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONDUCT TOSS MODAL */}
      {showTossModal && selectedMatchForToss && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>Conduct Toss</span>
            </h3>

            <p className="text-xs text-slate-300">
              Select which captain won the toss and their decision to bat or bowl first.
            </p>

            <div>
              <label htmlFor="conduct-toss-winner-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Toss Winner
              </label>
              <select
                id="conduct-toss-winner-select"
                value={tossWinnerId}
                onChange={(e) => setTossWinnerId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold"
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
              <label htmlFor="conduct-toss-decision-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Decision
              </label>
              <select
                id="conduct-toss-decision-select"
                value={tossDecision}
                onChange={(e) => setTossDecision(e.target.value as 'BAT' | 'BOWL')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold"
              >
                <option value="BAT">Elected to BAT first</option>
                <option value="BOWL">Elected to BOWL first</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTossModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyToss}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20"
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
