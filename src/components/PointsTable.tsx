'use client';

import React, { useState } from 'react';
import { Match, Team } from '@/types/cricket';
import { calculateLeagueStandings } from '@/lib/statsService';
import {
  Trophy,
  ArrowRight,
  Sparkles,
  Medal,
  CheckCircle2,
  Settings2,
  Calendar,
  Flame,
  Award,
  Lock
} from 'lucide-react';

interface PointsTableProps {
  teams: Team[];
  matches: Match[];
  onSetPlayoffTeams: (params: any) => Promise<void>;
  onSelectMatch: (matchId: string) => void;
  setActiveTab: (tab: string) => void;
}

export const PointsTable: React.FC<PointsTableProps> = ({
  teams,
  matches,
  onSetPlayoffTeams,
  onSelectMatch,
  setActiveTab,
}) => {
  const standings = calculateLeagueStandings(teams, matches);

  const leagueMatches = matches.filter(m => m.stage === 'LEAGUE');
  const completedLeagueMatches = leagueMatches.filter(m => m.status === 'COMPLETED');
  const isLeagueCompleted = leagueMatches.length > 0 && completedLeagueMatches.length === leagueMatches.length;

  const semi1Match = matches.find(m => m.id === 'match-semi-1');
  const semi2Match = matches.find(m => m.id === 'match-semi-2');
  const finalMatch = matches.find(m => m.id === 'match-final');

  const [semi1TeamA, setSemi1TeamA] = useState(semi1Match?.teamAId || standings[0]?.teamId || '');
  const [semi1TeamB, setSemi1TeamB] = useState(semi1Match?.teamBId || standings[3]?.teamId || '');
  const [semi2TeamA, setSemi2TeamA] = useState(semi2Match?.teamAId || standings[1]?.teamId || '');
  const [semi2TeamB, setSemi2TeamB] = useState(semi2Match?.teamBId || standings[2]?.teamId || '');

  const [isUpdatingPlayoffs, setIsUpdatingPlayoffs] = useState(false);

  // Auto-Qualify Top 4 Teams (Only permitted after all league matches complete)
  const handleAutoAssignPlayoffs = async () => {
    if (!isLeagueCompleted) {
      alert(`Cannot seed Semifinals yet! All 9 league matches must be completed first (${completedLeagueMatches.length}/9 done).`);
      return;
    }

    const s1A = standings[0]?.teamId || teams[0]?.id;
    const s1B = standings[3]?.teamId || teams[3]?.id;
    const s2A = standings[1]?.teamId || teams[1]?.id;
    const s2B = standings[2]?.teamId || teams[2]?.id;

    setSemi1TeamA(s1A);
    setSemi1TeamB(s1B);
    setSemi2TeamA(s2A);
    setSemi2TeamB(s2B);

    try {
      setIsUpdatingPlayoffs(true);
      await onSetPlayoffTeams({
        semi1TeamAId: s1A,
        semi1TeamBId: s1B,
        semi2TeamAId: s2A,
        semi2TeamBId: s2B,
      });
      alert('Top 4 teams seeded into Semifinals! (1 vs 4, 2 vs 3)');
    } catch (err: any) {
      alert(`Error assigning playoff teams: ${err.message}`);
    } finally {
      setIsUpdatingPlayoffs(false);
    }
  };

  const handleManualApplyPlayoffs = async () => {
    if (!isLeagueCompleted) {
      alert(`Cannot update Semifinals yet! All 9 league matches must be completed first (${completedLeagueMatches.length}/9 done).`);
      return;
    }

    try {
      setIsUpdatingPlayoffs(true);
      await onSetPlayoffTeams({
        semi1TeamAId: semi1TeamA,
        semi1TeamBId: semi1TeamB,
        semi2TeamAId: semi2TeamA,
        semi2TeamBId: semi2TeamB,
      });
      alert('Playoff matchups updated successfully!');
    } catch (err: any) {
      alert(`Error updating playoff teams: ${err.message}`);
    } finally {
      setIsUpdatingPlayoffs(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Tournament Points Table</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Single league table. Each team plays a maximum of 3 matches. <strong>Top 4 teams advance to the Semifinals.</strong>
          </p>
        </div>

        <button
          onClick={handleAutoAssignPlayoffs}
          disabled={isUpdatingPlayoffs}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Auto-Qualify Top 4 to Semifinals</span>
        </button>
      </div>

      {/* Unified League Points Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-black text-sm sm:text-base text-white flex items-center space-x-2">
            <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span>Overall League Standings</span>
          </h3>
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 text-[11px] sm:text-xs bg-emerald-500/10 text-emerald-400 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400"></span>
              <span>Top 4 Qualify for Semis</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[620px]">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-3.5">Rank</th>
                <th className="p-3.5">Team</th>
                <th className="p-3.5 text-center">Played (Max 3)</th>
                <th className="p-3.5 text-center">Won</th>
                <th className="p-3.5 text-center">Lost</th>
                <th className="p-3.5 text-center">Tied</th>
                <th className="p-3.5 text-center">NRR</th>
                <th className="p-3.5 text-right font-black">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {standings.map((s, idx) => {
                const isTop4 = idx < 4;
                return (
                  <tr
                    key={s.teamId}
                    className={`transition ${isTop4
                        ? 'bg-emerald-950/10 hover:bg-emerald-950/25 border-l-4 border-emerald-500'
                        : 'hover:bg-slate-800/40'
                      }`}
                  >
                    <td className="p-3.5 font-bold">
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0
                            ? 'bg-amber-500 text-slate-950'
                            : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                                ? 'bg-amber-700 text-white'
                                : isTop4
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400'
                          }`}>
                          {idx + 1}
                        </span>
                        {isTop4 && (
                          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            Q
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-black text-white text-sm">{s.teamName}</span>
                    </td>
                    <td className="p-3.5 text-center font-semibold">
                      <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-xs">
                        {s.played} / 3
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-emerald-400 font-bold">{s.won}</td>
                    <td className="p-3.5 text-center text-rose-400 font-bold">{s.lost}</td>
                    <td className="p-3.5 text-center">{s.tied}</td>
                    <td className="p-3.5 text-center font-mono">
                      {s.netRunRate > 0 ? `+${s.netRunRate.toFixed(3)}` : s.netRunRate.toFixed(3)}
                    </td>
                    <td className="p-3.5 text-right font-black text-amber-400 text-base">{s.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Semifinals & Finals Playoff Bracket */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Semifinals & Grand Final Bracket (Top 4 Playoff)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Top 4 from the league advance. Semi 1: <strong>Rank 1 vs Rank 4</strong>. Semi 2: <strong>Rank 2 vs Rank 3</strong>.
            </p>
          </div>
        </div>

        {/* League Completion Gating Banner */}
        {!isLeagueCompleted ? (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 text-amber-300 text-xs flex items-center space-x-2.5 shadow-sm">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Semifinal Fixtures Locked:</strong> Playoff fixtures and qualification will officially unlock once all 9 league matches are completed (<strong>{completedLeagueMatches.length} of 9</strong> completed so far).
            </span>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 text-emerald-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>League Stage Completed!</strong> Top 4 teams officially confirmed for Semifinals.
              </span>
            </div>
            <button
              onClick={handleAutoAssignPlayoffs}
              disabled={isUpdatingPlayoffs}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-md transition active:scale-95 whitespace-nowrap"
            >
              {isUpdatingPlayoffs ? 'Seeding...' : 'Auto-Seed Top 4 into Semis'}
            </button>
          </div>
        )}

        {/* Visual Bracket Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Semi-Final 1 */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
              <span>Semi-Final 1 (Rank 1 vs 4)</span>
              <span className="text-amber-400 font-semibold">{semi1Match?.status}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-white truncate mr-2">
                  1. {isLeagueCompleted && semi1Match?.teamAId ? (teams.find(t => t.id === semi1Match.teamAId)?.name || 'Rank 1') : 'Rank 1 (To Be Decided)'}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {isLeagueCompleted ? (semi1Match?.innings[0]?.totalRuns ?? '-') : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-white truncate mr-2">
                  4. {isLeagueCompleted && semi1Match?.teamBId ? (teams.find(t => t.id === semi1Match.teamBId)?.name || 'Rank 4') : 'Rank 4 (To Be Decided)'}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {isLeagueCompleted ? (semi1Match?.innings[1]?.totalRuns ?? '-') : '-'}
                </span>
              </div>
            </div>

            {isLeagueCompleted ? (
              <button
                onClick={() => {
                  if (semi1Match) {
                    onSelectMatch(semi1Match.id);
                    setActiveTab('scorer');
                  }
                }}
                className="w-full py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/50 rounded-lg text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1 transition"
              >
                <span>Score Semi-Final 1</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="w-full py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-500 text-xs font-bold flex items-center justify-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Locked ({completedLeagueMatches.length}/9 league done)</span>
              </div>
            )}
          </div>

          {/* Semi-Final 2 */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
              <span>Semi-Final 2 (Rank 2 vs 3)</span>
              <span className="text-amber-400 font-semibold">{semi2Match?.status}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-white truncate mr-2">
                  2. {isLeagueCompleted && semi2Match?.teamAId ? (teams.find(t => t.id === semi2Match.teamAId)?.name || 'Rank 2') : 'Rank 2 (To Be Decided)'}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {isLeagueCompleted ? (semi2Match?.innings[0]?.totalRuns ?? '-') : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-white truncate mr-2">
                  3. {isLeagueCompleted && semi2Match?.teamBId ? (teams.find(t => t.id === semi2Match.teamBId)?.name || 'Rank 3') : 'Rank 3 (To Be Decided)'}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {isLeagueCompleted ? (semi2Match?.innings[1]?.totalRuns ?? '-') : '-'}
                </span>
              </div>
            </div>

            {isLeagueCompleted ? (
              <button
                onClick={() => {
                  if (semi2Match) {
                    onSelectMatch(semi2Match.id);
                    setActiveTab('scorer');
                  }
                }}
                className="w-full py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/50 rounded-lg text-emerald-300 text-xs font-bold flex items-center justify-center space-x-1 transition"
              >
                <span>Score Semi-Final 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="w-full py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-500 text-xs font-bold flex items-center justify-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Locked ({completedLeagueMatches.length}/9 league done)</span>
              </div>
            )}
          </div>

          {/* Grand Final */}
          <div className="bg-gradient-to-b from-amber-950/30 via-slate-950 to-slate-950 border-2 border-amber-500/50 rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs text-amber-400 font-black uppercase">
              <span className="flex items-center space-x-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>GRAND FINAL</span>
              </span>
              <span className="text-amber-300 font-semibold">{finalMatch?.status}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-white truncate mr-2">
                  {isLeagueCompleted && finalMatch?.teamAId ? (teams.find(t => t.id === finalMatch.teamAId)?.name || 'Winner Semi 1') : 'Winner Semi 1 (TBD)'}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {isLeagueCompleted ? (finalMatch?.innings[0]?.totalRuns ?? '-') : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-white truncate mr-2">
                  {isLeagueCompleted && finalMatch?.teamBId ? (teams.find(t => t.id === finalMatch.teamBId)?.name || 'Winner Semi 2') : 'Winner Semi 2 (TBD)'}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {isLeagueCompleted ? (finalMatch?.innings[1]?.totalRuns ?? '-') : '-'}
                </span>
              </div>
            </div>

            {isLeagueCompleted && finalMatch?.teamAId && finalMatch?.teamBId ? (
              <button
                onClick={() => {
                  if (finalMatch) {
                    onSelectMatch(finalMatch.id);
                    setActiveTab('scorer');
                  }
                }}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 rounded-lg text-slate-950 text-xs font-black flex items-center justify-center space-x-1 shadow-md shadow-amber-500/20 transition"
              >
                <span>Score Grand Final</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="w-full py-2 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-500 text-xs font-bold flex items-center justify-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Locked (Pending Semifinals)</span>
              </div>
            )}
          </div>
        </div>

        {/* Manual Qualification Selection Form */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Settings2 className="w-4 h-4 text-slate-400" />
              <span>Manual Semifinal Team Selection</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="sf1-rank1-select" className="text-[11px] font-semibold text-slate-400 block mb-1">Semi 1 - Slot 1 (Rank 1)</label>
              <select
                id="sf1-rank1-select"
                value={semi1TeamA}
                onChange={(e) => setSemi1TeamA(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sf1-rank4-select" className="text-[11px] font-semibold text-slate-400 block mb-1">Semi 1 - Slot 2 (Rank 4)</label>
              <select
                id="sf1-rank4-select"
                value={semi1TeamB}
                onChange={(e) => setSemi1TeamB(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sf2-rank2-select" className="text-[11px] font-semibold text-slate-400 block mb-1">Semi 2 - Slot 1 (Rank 2)</label>
              <select
                id="sf2-rank2-select"
                value={semi2TeamA}
                onChange={(e) => setSemi2TeamA(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sf2-rank3-select" className="text-[11px] font-semibold text-slate-400 block mb-1">Semi 2 - Slot 2 (Rank 3)</label>
              <select
                id="sf2-rank3-select"
                value={semi2TeamB}
                onChange={(e) => setSemi2TeamB(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleManualApplyPlayoffs}
              disabled={isUpdatingPlayoffs}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-bold transition"
            >
              Update Selected Teams
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
