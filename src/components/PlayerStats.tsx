'use client';

import React, { useState } from 'react';
import { Match, Team } from '@/types/cricket';
import { aggregatePlayerStats, AggregatedPlayerStats } from '@/lib/statsService';
import { 
  Award, 
  Flame, 
  Zap, 
  Search, 
  Trophy, 
  Sparkles, 
  Shield 
} from 'lucide-react';

interface PlayerStatsProps {
  teams: Team[];
  matches: Match[];
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({ teams, matches }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const allStats = aggregatePlayerStats(teams, matches);

  // Leaderboard Highlights
  const orangeCap = [...allStats].sort((a, b) => b.runs - a.runs)[0];
  const purpleCap = [...allStats].sort((a, b) => b.wickets - a.wickets)[0];
  const topFemale = [...allStats].filter(s => s.category === 'FEMALE').sort((a, b) => b.runs - a.runs)[0];
  const topSenior = [...allStats].filter(s => s.category === 'SENIOR').sort((a, b) => b.runs - a.runs)[0];
  const topKid = [...allStats].filter(s => s.category === 'KID').sort((a, b) => b.runs - a.runs)[0];

  const filteredStats = allStats.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || s.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
          <Award className="w-6 h-6 text-amber-400" />
          <span>Tournament Player Statistics & Leaderboards</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Individual player batting and bowling performances across the KVO Box Cricket Tournament.
        </p>
      </div>

      {/* Cap Cards & Category Awards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Orange Cap */}
        <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-black uppercase text-amber-400 tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Orange Cap (Top Scorer)</span>
            </span>
            <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black text-[10px]">Leader</span>
          </div>

          <div className="mt-3">
            <h3 className="text-xl font-black text-white truncate">{orangeCap?.name || 'No Data'}</h3>
            <span className="text-xs text-slate-400">{orangeCap?.teamName} • {orangeCap?.category}</span>
            <div className="flex items-baseline space-x-3 mt-2">
              <span className="text-3xl font-black text-amber-400">{orangeCap?.runs || 0}</span>
              <span className="text-xs text-slate-400">runs ({orangeCap?.ballsFaced || 0} balls, SR {orangeCap?.strikeRate || 0})</span>
            </div>
          </div>
        </div>

        {/* Purple Cap */}
        <div className="bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-black uppercase text-purple-400 tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-purple-400 fill-purple-400" />
              <span>Purple Cap (Top Wickets)</span>
            </span>
            <span className="bg-purple-500 text-white px-2 py-0.5 rounded font-black text-[10px]">Leader</span>
          </div>

          <div className="mt-3">
            <h3 className="text-xl font-black text-white truncate">{purpleCap?.name || 'No Data'}</h3>
            <span className="text-xs text-slate-400">{purpleCap?.teamName} • {purpleCap?.category}</span>
            <div className="flex items-baseline space-x-3 mt-2">
              <span className="text-3xl font-black text-purple-400">{purpleCap?.wickets || 0}</span>
              <span className="text-xs text-slate-400">wickets ({purpleCap?.runsConceded || 0} runs, Econ {purpleCap?.economy || 0})</span>
            </div>
          </div>
        </div>

        {/* Special Category MVP */}
        <div className="bg-gradient-to-br from-pink-950/60 via-slate-900 to-slate-900 border border-pink-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-black uppercase text-pink-400 tracking-wider">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Top Female Batter</span>
            </span>
            <span className="bg-pink-500 text-white px-2 py-0.5 rounded font-black text-[10px]">2x Bonus</span>
          </div>

          <div className="mt-3">
            <h3 className="text-xl font-black text-white truncate">{topFemale?.name || 'No Data'}</h3>
            <span className="text-xs text-slate-400">{topFemale?.teamName}</span>
            <div className="flex items-baseline space-x-3 mt-2">
              <span className="text-3xl font-black text-pink-400">{topFemale?.runs || 0}</span>
              <span className="text-xs text-slate-400">runs ({topFemale?.fours || 0}x4, {topFemale?.sixes || 0}x6)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto no-scrollbar">
          {['ALL', 'FEMALE', 'SENIOR', 'KID', 'REGULAR'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat === 'ALL' ? 'All Players' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Full Player Statistics Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-3">Player</th>
                <th className="p-3">Team</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Runs</th>
                <th className="p-3 text-right">Balls</th>
                <th className="p-3 text-right">SR</th>
                <th className="p-3 text-right">4s</th>
                <th className="p-3 text-right">6s</th>
                <th className="p-3 text-right">Wickets</th>
                <th className="p-3 text-right">Econ</th>
                <th className="p-3 text-right">Outs (-2r)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredStats.map(s => (
                <tr key={s.playerId} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white text-sm">{s.name}</td>
                  <td className="p-3 font-semibold text-slate-400">{s.teamName}</td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                      {s.category}
                    </span>
                  </td>
                  <td className="p-3 text-right font-black text-amber-400 text-sm">{s.runs}</td>
                  <td className="p-3 text-right">{s.ballsFaced}</td>
                  <td className="p-3 text-right font-mono">{s.strikeRate}</td>
                  <td className="p-3 text-right text-blue-400 font-semibold">{s.fours}</td>
                  <td className="p-3 text-right text-amber-400 font-semibold">{s.sixes}</td>
                  <td className="p-3 text-right font-black text-purple-400 text-sm">{s.wickets}</td>
                  <td className="p-3 text-right font-mono">{s.oversBowled > 0 ? s.economy : '-'}</td>
                  <td className="p-3 text-right text-rose-400 font-semibold">{s.dismissalsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
