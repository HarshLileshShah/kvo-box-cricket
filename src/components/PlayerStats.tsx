'use client';

import React, { useState } from 'react';
import { Match, Team, PlayerCategory, PlayerPerformancePoints } from '@/types/cricket';
import { calculateTournamentPerformancePoints } from '@/lib/statsService';
import {
  Award,
  Flame,
  Zap,
  Search,
  Trophy,
  Sparkles,
  Shield,
  Info,
  ChevronDown,
  ChevronUp,
  Medal,
  CheckCircle2,
  X,
  Target
} from 'lucide-react';

interface PlayerStatsProps {
  teams: Team[];
  matches: Match[];
  isSuperAdmin?: boolean;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({ teams, matches, isSuperAdmin = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [leagueOnly, setLeagueOnly] = useState<boolean>(true);
  const [showRulesSheet, setShowRulesSheet] = useState<boolean>(false);
  const [selectedPlayerModal, setSelectedPlayerModal] = useState<PlayerPerformancePoints | null>(null);

  // Compute performance points according to official rules
  const { playerPoints, awards } = calculateTournamentPerformancePoints(teams, matches, { leagueOnly });

  const filteredPoints = playerPoints.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || p.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const getCategoryBadge = (cat: PlayerCategory) => {
    switch (cat) {
      case 'FEMALE':
        return <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">Female</span>;
      case 'SENIOR':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">Senior</span>;
      case 'KID':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded">Kid</span>;
      default:
        return <span className="bg-slate-700/60 text-slate-300 border border-slate-600/40 text-[10px] font-bold px-1.5 py-0.5 rounded">Male</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Stage Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Tournament Awards 2026</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Official Points System
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center space-x-2.5">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Best Player Awards & Performance Leaderboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Individual performance scoring across batting, bowling, and fielding. 4 Best Player category awards.
          </p>
        </div>

        {/* Filter Toggle: League Only vs All Matches */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
          <button
            onClick={() => setLeagueOnly(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              leagueOnly
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>3 League Matches (Official)</span>
          </button>
          <button
            onClick={() => setLeagueOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              !leagueOnly
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>All Matches (Incl. Playoffs)</span>
          </button>
        </div>
      </div>

      {/* 4 BEST PLAYER CATEGORY AWARDS (Male, Female, Kids, Senior) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <Medal className="w-4 h-4 text-amber-400" />
            <span>Best Player Leaders in All 4 Categories</span>
          </h3>
          <span className="text-[11px] text-slate-500 italic">
            {leagueOnly ? 'Scored across official 3 league matches' : 'Scored across all matches'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. BEST MALE PLAYER */}
          <div className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs font-black uppercase text-amber-400 tracking-wider">
                <span className="flex items-center space-x-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Best Male Player</span>
                </span>
                <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black text-[10px]">Leader</span>
              </div>

              <div className="mt-3.5">
                <h4 className="text-xl font-black text-white truncate">{awards.bestMale?.name || 'No Data'}</h4>
                <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                  <span>{awards.bestMale?.teamName || 'Team'}</span>
                  <span>•</span>
                  <span>{awards.bestMale?.matchesPlayed || 0} matches</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80">
              {isSuperAdmin ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Total Points</span>
                    <span className="text-3xl font-black text-amber-400">{awards.bestMale?.totalPoints || 0}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-center font-bold">
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Bat: <span className="text-emerald-400">{awards.bestMale?.battingPoints || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Bowl: <span className="text-purple-400">{awards.bestMale?.bowlingPoints || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Field: <span className="text-blue-400">{awards.bestMale?.fieldingPoints || 0}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Runs Scored</span>
                      <span className="text-xl font-black text-emerald-400">{awards.bestMale?.actualRunsScored || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Wickets Taken</span>
                      <span className="text-xl font-black text-purple-400">{awards.bestMale?.wicketsCount || 0}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-400/80 text-center font-medium">
                    🔒 Official Points: Super Admin Only
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. BEST FEMALE PLAYER */}
          <div className="bg-gradient-to-br from-pink-950/50 via-slate-900 to-slate-900 border border-pink-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs font-black uppercase text-pink-400 tracking-wider">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Best Female Player</span>
                </span>
                <span className="bg-pink-500 text-white px-2 py-0.5 rounded-full font-black text-[10px]">Leader</span>
              </div>

              <div className="mt-3.5">
                <h4 className="text-xl font-black text-white truncate">{awards.bestFemale?.name || 'No Data'}</h4>
                <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                  <span>{awards.bestFemale?.teamName || 'Team'}</span>
                  <span>•</span>
                  <span>{awards.bestFemale?.matchesPlayed || 0} matches</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80">
              {isSuperAdmin ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Total Points</span>
                    <span className="text-3xl font-black text-pink-400">{awards.bestFemale?.totalPoints || 0}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-center font-bold">
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Bat: <span className="text-emerald-400">{awards.bestFemale?.battingPoints || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Bowl: <span className="text-purple-400">{awards.bestFemale?.bowlingPoints || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Field: <span className="text-blue-400">{awards.bestFemale?.fieldingPoints || 0}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Runs Scored</span>
                      <span className="text-xl font-black text-pink-400">{awards.bestFemale?.actualRunsScored || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Wickets Taken</span>
                      <span className="text-xl font-black text-purple-400">{awards.bestFemale?.wicketsCount || 0}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-pink-400/80 text-center font-medium">
                    🔒 Official Points: Super Admin Only
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. BEST KID PLAYER */}
          <div className="bg-gradient-to-br from-cyan-950/50 via-slate-900 to-slate-900 border border-cyan-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs font-black uppercase text-cyan-400 tracking-wider">
                <span className="flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Best Kid Player</span>
                </span>
                <span className="bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full font-black text-[10px]">Leader</span>
              </div>

              <div className="mt-3.5">
                <h4 className="text-xl font-black text-white truncate">{awards.bestKid?.name || 'No Data'}</h4>
                <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                  <span>{awards.bestKid?.teamName || 'Team'}</span>
                  <span>•</span>
                  <span>{awards.bestKid?.matchesPlayed || 0} matches</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80">
              {isSuperAdmin ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Total Points</span>
                    <span className="text-3xl font-black text-cyan-400">{awards.bestKid?.totalPoints || 0}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-center font-bold">
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Bat: <span className="text-emerald-400">{awards.bestKid?.battingPoints || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Bowl: <span className="text-purple-400">{awards.bestKid?.bowlingPoints || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Field: <span className="text-blue-400">{awards.bestKid?.fieldingPoints || 0}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Runs Scored</span>
                      <span className="text-xl font-black text-cyan-400">{awards.bestKid?.actualRunsScored || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Wickets Taken</span>
                      <span className="text-xl font-black text-purple-400">{awards.bestKid?.wicketsCount || 0}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-cyan-400/80 text-center font-medium">
                    🔒 Official Points: Super Admin Only
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. BEST SENIOR PLAYER */}
          <div className="bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-900 border border-purple-500/40 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs font-black uppercase text-purple-400 tracking-wider">
                <span className="flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>Best Senior Player</span>
                </span>
                <span className="bg-purple-500 text-white px-2 py-0.5 rounded-full font-black text-[10px]">Leader</span>
              </div>

              <div className="mt-3.5">
                <h4 className="text-xl font-black text-white truncate">{awards.bestSenior?.name || 'No Data'}</h4>
                <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                  <span>{awards.bestSenior?.teamName || 'Team'}</span>
                  <span>•</span>
                  <span>{awards.bestSenior?.matchesPlayed || 0} matches</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80">
              {isSuperAdmin ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-semibold">Total Points</span>
                    <span className="text-3xl font-black text-purple-400">{awards.bestSenior?.totalPoints || 0}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-center font-bold">
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Bat: <span className="text-emerald-400">{awards.bestSenior?.battingPoints || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Bowl: <span className="text-purple-400">{awards.bestSenior?.bowlingPoints || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-1 rounded border border-slate-800 text-slate-300">
                      Field: <span className="text-blue-400">{awards.bestSenior?.fieldingPoints || 0}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Runs Scored</span>
                      <span className="text-xl font-black text-purple-400">{awards.bestSenior?.actualRunsScored || 0}</span>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Wickets Taken</span>
                      <span className="text-xl font-black text-amber-400">{awards.bestSenior?.wicketsCount || 0}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-purple-400/80 text-center font-medium">
                    🔒 Official Points: Super Admin Only
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Rules & Points System Cheat Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
        <button
          onClick={() => setShowRulesSheet(!showRulesSheet)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition"
        >
          <div className="flex items-center space-x-2.5">
            <Info className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-bold text-white">
              Official Scoring System & Performance Points Formula (Click to {showRulesSheet ? 'collapse' : 'view rules'})
            </span>
          </div>
          {showRulesSheet ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showRulesSheet && (
          <div className="p-5 border-t border-slate-800 space-y-4 bg-slate-950/50 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Batting */}
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                <h5 className="font-bold text-amber-400 uppercase text-[11px] pb-1 border-b border-slate-800">
                  🏏 Batting Points
                </h5>
                <div className="flex justify-between text-slate-300"><span>Every actual run scored:</span><strong className="text-emerald-400">+1 pt</strong></div>
                <div className="flex justify-between text-slate-300"><span>Four (additional bonus):</span><strong className="text-emerald-400">+2 pts (6 total)</strong></div>
                <div className="flex justify-between text-slate-300"><span>Six (additional bonus):</span><strong className="text-emerald-400">+3 pts (9 total)</strong></div>
                <div className="flex justify-between text-slate-300"><span>1D:</span><strong className="text-emerald-400">+1 pt</strong></div>
                <div className="flex justify-between text-slate-300"><span>2D:</span><strong className="text-emerald-400">+2 pts</strong></div>
                <div className="flex justify-between text-slate-300"><span>Every dismissal (out):</span><strong className="text-rose-400">-5 pts</strong></div>
                <div className="flex justify-between text-slate-300"><span>Dot ball:</span><strong className="text-slate-400">0 pts</strong></div>
              </div>

              {/* Bowling */}
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                <h5 className="font-bold text-purple-400 uppercase text-[11px] pb-1 border-b border-slate-800">
                  🎯 Bowling Points
                </h5>
                <div className="flex justify-between text-slate-300"><span>Wicket (excl. run-outs):</span><strong className="text-emerald-400">+10 pts</strong></div>
                <div className="flex justify-between text-slate-300"><span>Dot ball:</span><strong className="text-emerald-400">+2 pts</strong></div>
                <div className="flex justify-between text-slate-300"><span>Wide:</span><strong className="text-rose-400">-2 pts</strong></div>
                <div className="flex justify-between text-slate-300"><span>No-ball:</span><strong className="text-rose-400">-2 pts</strong></div>
                <div className="flex justify-between text-slate-300"><span>Actual run off bat:</span><strong className="text-rose-400">-0.5 pts / run</strong></div>
              </div>

              {/* Fielding */}
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                <h5 className="font-bold text-emerald-400 uppercase text-[11px] pb-1 border-b border-slate-800">
                  🧤 Fielding Points
                </h5>
                <div className="flex justify-between text-slate-300"><span>Catch:</span><strong className="text-emerald-400">+5 pts</strong></div>
                <div className="flex justify-between text-slate-300"><span>Direct run-out:</span><strong className="text-emerald-400">+8 pts</strong></div>
                <div className="flex justify-between text-slate-300"><span>Assisted run-out (each):</span><strong className="text-emerald-400">+4 pts</strong></div>
                <div className="flex justify-between text-slate-300"><span>Stumping:</span><strong className="text-emerald-400">+5 pts</strong></div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900 p-3 rounded-xl border border-slate-800 leading-relaxed">
              • <b>Scoring rule:</b> Exclude Power Over and special batting multipliers (runs calculated on actual base runs).
              <br />• <b>1D / 2D:</b> Count runs only once, within actual runs.
              <br />• <b>Matches:</b> Only three league matches count for tournament awards. Excludes Super Over.
              <br />• <b>Tie-breaker order:</b> Higher wickets, actual runs, fielding points, then fewer dismissals.
            </div>
          </div>
        )}
      </div>

      {/* Search & Category Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Players' },
            { id: 'REGULAR', label: 'Male' },
            { id: 'FEMALE', label: 'Female' },
            { id: 'KID', label: 'Kids' },
            { id: 'SENIOR', label: 'Senior' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Full Performance Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-white flex items-center space-x-2">
            <span>Overall Performance Leaderboard ({filteredPoints.length} players)</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {isSuperAdmin ? 'Click on any row to view full points breakdown' : 'Official match statistics'}
          </span>
        </div>

        {!isSuperAdmin && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center space-x-2">
            <span>🔒 Official Award Performance Points are confidential & visible to Super Admin only. Displaying player runs, wickets, and match statistics.</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[850px]">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider text-[11px]">
              {isSuperAdmin ? (
                <tr>
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3">Player</th>
                  <th className="p-3">Team</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">M</th>
                  <th className="p-3 text-right">Bat Pts</th>
                  <th className="p-3 text-right">Bowl Pts</th>
                  <th className="p-3 text-right">Field Pts</th>
                  <th className="p-3 text-right bg-amber-500/10 text-amber-300">TOTAL PTS</th>
                  <th className="p-3 text-center">POTM</th>
                </tr>
              ) : (
                <tr>
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3">Player</th>
                  <th className="p-3">Team</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">M</th>
                  <th className="p-3 text-right text-emerald-400">Runs</th>
                  <th className="p-3 text-right">4s</th>
                  <th className="p-3 text-right">6s</th>
                  <th className="p-3 text-right text-purple-400">Wkts</th>
                  <th className="p-3 text-right">Dots</th>
                  <th className="p-3 text-right">Catches</th>
                  <th className="p-3 text-right">RO</th>
                  <th className="p-3 text-center">POTM</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredPoints.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 10 : 13} className="p-8 text-center text-slate-500 text-xs">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPoints.map((p, idx) => (
                  <tr
                    key={p.playerId}
                    onClick={() => isSuperAdmin && setSelectedPlayerModal(p)}
                    className={`transition ${isSuperAdmin ? 'hover:bg-slate-800/60 cursor-pointer' : 'hover:bg-slate-800/30'}`}
                  >
                    <td className="p-3 text-center font-mono font-bold text-slate-400">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </td>
                    <td className="p-3 font-bold text-white text-sm">
                      <div className="flex items-center space-x-1.5">
                        <span>{p.name}</span>
                        {p.potmCount > 0 && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-black border border-amber-500/30" title="Player of the Match awards">
                            ⭐x{p.potmCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        {teams.find(t => t.id === p.teamId)?.logoUrl && (
                          <img
                            src={teams.find(t => t.id === p.teamId)?.logoUrl}
                            alt={p.teamName}
                            className="w-4 h-4 object-contain rounded shrink-0 bg-slate-950 p-0.5"
                          />
                        )}
                        <span>{p.teamName}</span>
                      </div>
                    </td>
                    <td className="p-3">{getCategoryBadge(p.category)}</td>
                    <td className="p-3 text-right text-slate-400">{p.matchesPlayed}</td>

                    {isSuperAdmin ? (
                      <>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          {p.battingPoints > 0 ? `+${p.battingPoints}` : p.battingPoints}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-purple-400">
                          {p.bowlingPoints > 0 ? `+${p.bowlingPoints}` : p.bowlingPoints}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-blue-400">
                          {p.fieldingPoints > 0 ? `+${p.fieldingPoints}` : p.fieldingPoints}
                        </td>
                        <td className="p-3 text-right font-black font-mono text-amber-400 text-base bg-amber-500/10">
                          {p.totalPoints}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                          {p.actualRunsScored}
                        </td>
                        <td className="p-3 text-right text-slate-300">{p.foursCount}</td>
                        <td className="p-3 text-right text-slate-300">{p.sixesCount}</td>
                        <td className="p-3 text-right font-mono font-bold text-purple-400 text-sm">
                          {p.wicketsCount}
                        </td>
                        <td className="p-3 text-right text-slate-400">{p.dotBallsCount}</td>
                        <td className="p-3 text-right text-blue-300">{p.catchesCount}</td>
                        <td className="p-3 text-right text-amber-300">{p.directRunOutsCount + p.assistedRunOutsCount}</td>
                      </>
                    )}

                    <td className="p-3 text-center">
                      {p.potmCount > 0 ? (
                        <span className="font-bold text-amber-400 text-xs">{p.potmCount}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INDIVIDUAL PLAYER BREAKDOWN MODAL */}
      {selectedPlayerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setSelectedPlayerModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-bold text-amber-400">{selectedPlayerModal.teamName}</span>
                <span>•</span>
                {getCategoryBadge(selectedPlayerModal.category)}
              </div>
              <h3 className="text-2xl font-black text-white mt-1">{selectedPlayerModal.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Performance Points Breakdown ({leagueOnly ? '3 League Matches' : 'All Matches'})</p>
            </div>

            {/* Total Points Big Display */}
            <div className="bg-gradient-to-r from-amber-500/20 via-slate-800 to-amber-500/20 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold">Total Points</span>
                <div className="text-3xl font-black text-amber-400">{selectedPlayerModal.totalPoints} pts</div>
              </div>
              <div className="text-right text-xs text-slate-300 space-y-0.5">
                <div>Matches: <b>{selectedPlayerModal.matchesPlayed}</b></div>
                <div>Player of Match: <b>{selectedPlayerModal.potmCount}</b></div>
              </div>
            </div>

            {/* Category Sub-Breakdowns */}
            <div className="space-y-3 text-xs">
              {/* Batting */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-amber-400 uppercase">🏏 Batting Points</span>
                  <span className="font-black font-mono text-emerald-400">{selectedPlayerModal.battingPoints} pts</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] pt-1">
                  <div>Actual Runs: <b>{selectedPlayerModal.actualRunsScored}</b> (+{selectedPlayerModal.actualRunsScored} pts)</div>
                  <div>Fours: <b>{selectedPlayerModal.foursCount}</b> (+{selectedPlayerModal.foursCount * 2} bonus pts)</div>
                  <div>Sixes: <b>{selectedPlayerModal.sixesCount}</b> (+{selectedPlayerModal.sixesCount * 3} bonus pts)</div>
                  <div>Dismissals: <b>{selectedPlayerModal.dismissalsCount}</b> ({selectedPlayerModal.dismissalsCount * -5} pts)</div>
                </div>
              </div>

              {/* Bowling */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-purple-400 uppercase">🎯 Bowling Points</span>
                  <span className="font-black font-mono text-purple-400">{selectedPlayerModal.bowlingPoints} pts</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] pt-1">
                  <div>Wickets (excl. RO): <b>{selectedPlayerModal.wicketsCount}</b> (+{selectedPlayerModal.wicketsCount * 10} pts)</div>
                  <div>Dot Balls: <b>{selectedPlayerModal.dotBallsCount}</b> (+{selectedPlayerModal.dotBallsCount * 2} pts)</div>
                  <div>Wides: <b>{selectedPlayerModal.widesCount}</b> ({selectedPlayerModal.widesCount * -2} pts)</div>
                  <div>No-Balls: <b>{selectedPlayerModal.noBallsCount}</b> ({selectedPlayerModal.noBallsCount * -2} pts)</div>
                  <div className="col-span-2">Runs off bat conceded: <b>{selectedPlayerModal.runsConcededOffBat}</b> ({selectedPlayerModal.runsConcededOffBat * -0.5} pts)</div>
                </div>
              </div>

              {/* Fielding */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-blue-400 uppercase">🧤 Fielding Points</span>
                  <span className="font-black font-mono text-blue-400">{selectedPlayerModal.fieldingPoints} pts</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] pt-1">
                  <div>Catches: <b>{selectedPlayerModal.catchesCount}</b> (+{selectedPlayerModal.catchesCount * 5} pts)</div>
                  <div>Direct Run-Outs: <b>{selectedPlayerModal.directRunOutsCount}</b> (+{selectedPlayerModal.directRunOutsCount * 8} pts)</div>
                  <div>Assisted Run-Outs: <b>{selectedPlayerModal.assistedRunOutsCount}</b> (+{selectedPlayerModal.assistedRunOutsCount * 4} pts)</div>
                  <div>Stumpings: <b>{selectedPlayerModal.stumpingsCount}</b> (+{selectedPlayerModal.stumpingsCount * 5} pts)</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPlayerModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
