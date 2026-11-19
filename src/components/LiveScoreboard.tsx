'use client';

import React, { useState } from 'react';
import { Match, Team, PlayerCategory } from '@/types/cricket';
import { 
  Tv, 
  Flame, 
  Zap, 
  Sparkles, 
  Trophy, 
  Timer, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  Award
} from 'lucide-react';

interface LiveScoreboardProps {
  match: Match;
  teams: Team[];
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({ match, teams }) => {
  const [showFullScorecard, setShowFullScorecard] = useState(false);
  const currentInnings = match.innings[match.currentInningsIndex];
  const battingTeam = teams.find(t => t.id === currentInnings.battingTeamId);
  const bowlingTeam = teams.find(t => t.id === currentInnings.bowlingTeamId);

  const teamA = teams.find(t => t.id === match.teamAId);
  const teamB = teams.find(t => t.id === match.teamBId);

  const currentOverNumber = currentInnings.completedOvers + 1;
  const isPowerOver = currentInnings.powerOverDeclaredNumber === currentOverNumber;

  const striker = battingTeam?.players.find(p => p.id === currentInnings.currentPair.strikerId);
  const nonStriker = battingTeam?.players.find(p => p.id === currentInnings.currentPair.nonStrikerId);
  const bowler = bowlingTeam?.players.find(p => p.id === currentInnings.currentBowlerId);

  const strikerStats = striker ? currentInnings.batsmanStats[striker.id] : null;
  const nonStrikerStats = nonStriker ? currentInnings.batsmanStats[nonStriker.id] : null;
  const bowlerStats = bowler ? currentInnings.bowlerStats[bowler.id] : null;

  // Run rates
  const totalBallsBowled = currentInnings.completedOvers * 6 + currentInnings.currentOverBalls;
  const currentRunRate = totalBallsBowled > 0 ? ((currentInnings.totalRuns / totalBallsBowled) * 6).toFixed(2) : '0.00';

  let requiredRunRate = '0.00';
  let runsNeeded = 0;
  let ballsRemaining = 0;

  if (match.currentInningsIndex === 1) {
    const target = match.innings[0].totalRuns + 1;
    runsNeeded = Math.max(0, target - currentInnings.totalRuns);
    ballsRemaining = Math.max(0, (match.totalOvers * 6) - totalBallsBowled);
    if (ballsRemaining > 0) {
      requiredRunRate = ((runsNeeded / ballsRemaining) * 6).toFixed(2);
    }
  }

  const getCategoryBadge = (cat?: PlayerCategory) => {
    switch (cat) {
      case 'FEMALE':
        return <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Female (2x)</span>;
      case 'SENIOR':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Senior</span>;
      case 'KID':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Junior</span>;
      default:
        return null;
    }
  };

  const mStageDisplay = match.stage === 'LEAGUE' ? 'League Match' : match.stage === 'SEMI_FINAL' ? 'Semi-Final' : 'Grand Final';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Broadcast Live Screen Header */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Live Ribbon */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-rose-400">
              {match.status === 'COMPLETED' ? 'Match Finished' : match.status === 'TIED' ? 'Match Tied (Super Over)' : 'LIVE MATCH'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-300 font-semibold">{match.boxVenue || 'Box Turf'}</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-semibold border border-slate-700">
              {mStageDisplay}
            </span>
            <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md font-bold border border-amber-500/30">
              {match.totalOvers} Overs
            </span>
          </div>
        </div>

        {/* Power Over Alert Banner */}
        {isPowerOver && (
          <div className="mt-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 border border-purple-500/50 rounded-xl p-3 text-white text-center shadow-lg animate-pulse flex items-center justify-center space-x-3">
            <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            <span className="text-sm font-black tracking-wider uppercase">
              ⚡ POWER OVER IN PROGRESS (OVER {currentOverNumber}) — ALL RUNS OFF BAT ARE DOUBLED! ⚡
            </span>
            <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          </div>
        )}

        {/* Scorecard Hero Numbers */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              Currently Batting ({match.currentInningsIndex === 0 ? '1st Innings' : '2nd Innings'})
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1 flex items-center space-x-3">
              <span>{battingTeam?.name}</span>
            </h2>

            {/* Innings 1 Summary if in 2nd Innings */}
            {match.currentInningsIndex === 1 && (
              <div className="text-xs text-slate-400 mt-1">
                {bowlingTeam?.shortName}: <strong className="text-white">{match.innings[0].totalRuns}/{match.innings[0].totalWickets}</strong> ({match.innings[0].completedOvers}.{match.innings[0].currentOverBalls} ov)
              </div>
            )}
          </div>

          <div className="flex flex-col sm:items-end justify-center">
            <div className="flex items-baseline space-x-3">
              <span className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight">
                {currentInnings.totalRuns}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-rose-400">
                /{currentInnings.totalWickets}
              </span>
            </div>
            <div className="text-slate-300 font-semibold text-sm sm:text-base mt-1">
              Overs: <span className="text-white font-bold">{currentInnings.completedOvers}.{currentInnings.currentOverBalls}</span> / {match.totalOvers}
              <span className="text-slate-500 mx-2">•</span>
              CRR: <span className="text-emerald-400 font-bold">{currentRunRate}</span>
            </div>
          </div>
        </div>

        {/* Target & Equations for 2nd Innings */}
        {match.currentInningsIndex === 1 && match.status !== 'COMPLETED' && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
            <div className="text-slate-300">
              Need <span className="text-amber-400 font-black text-lg">{runsNeeded}</span> runs from <span className="text-white font-bold">{ballsRemaining}</span> balls
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-400">Required Run Rate (RRR): <strong className="text-emerald-400 font-bold">{requiredRunRate}</strong></span>
              <span className="text-slate-400">Target: <strong className="text-white font-bold">{match.innings[0].totalRuns + 1}</strong></span>
            </div>
          </div>
        )}

        {/* Match Result Banner if Completed */}
        {match.status === 'COMPLETED' && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-center text-amber-300 font-black text-base sm:text-lg flex items-center justify-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>
              {teams.find(t => t.id === match.winnerId)?.name} won the match!
            </span>
          </div>
        )}
      </div>

      {/* Live Batter & Bowler Current Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Batters at Crease */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Current Batting Pair (Overs {(Math.floor(currentInnings.completedOvers / 2) * 2) + 1}-{(Math.floor(currentInnings.completedOvers / 2) * 2) + 2})</span>
            </h3>
            <span className="text-[11px] text-slate-500">2 overs per pair rule</span>
          </div>

          {/* Striker */}
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-amber-500/30">
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-bold text-xs">▶</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">{striker?.name || 'Striker'}</span>
                  {getCategoryBadge(striker?.category)}
                </div>
                <div className="text-[11px] text-slate-400">
                  SR: {strikerStats?.ballsFaced ? ((strikerStats.runs / strikerStats.ballsFaced) * 100).toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-amber-400">{strikerStats?.runs || 0}</span>
              <span className="text-xs text-slate-400 block">
                ({strikerStats?.ballsFaced || 0}b, {strikerStats?.fours || 0}x4, {strikerStats?.sixes || 0}x6)
              </span>
            </div>
          </div>

          {/* Non Striker */}
          <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-slate-600 font-bold text-xs">○</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200 text-sm">{nonStriker?.name || 'Non-Striker'}</span>
                  {getCategoryBadge(nonStriker?.category)}
                </div>
                <div className="text-[11px] text-slate-400">
                  SR: {nonStrikerStats?.ballsFaced ? ((nonStrikerStats.runs / nonStrikerStats.ballsFaced) * 100).toFixed(1) : '0.0'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-slate-200">{nonStrikerStats?.runs || 0}</span>
              <span className="text-xs text-slate-400 block">
                ({nonStrikerStats?.ballsFaced || 0}b, {nonStrikerStats?.fours || 0}x4, {nonStrikerStats?.sixes || 0}x6)
              </span>
            </div>
          </div>
        </div>

        {/* Current Bowler */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Current Bowler</span>
            </h3>
            <span className="text-[11px] text-slate-500">1 over mandatory per player</span>
          </div>

          <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-xl border border-emerald-500/30">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base">{bowler?.name || 'Bowler'}</span>
                {getCategoryBadge(bowler?.category)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Econ: {bowlerStats?.oversBowled ? (bowlerStats.runsConceded / bowlerStats.oversBowled).toFixed(2) : '0.00'} • Wides: {bowlerStats?.wides || 0} • NB: {bowlerStats?.noBalls || 0}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-emerald-400">
                {bowlerStats?.wickets || 0} - {bowlerStats?.runsConceded || 0}
              </div>
              <div className="text-xs text-slate-400">
                ({bowlerStats?.legalBalls || 0} balls / {bowlerStats?.oversBowled || 0} ov)
              </div>
            </div>
          </div>

          {/* Current Over Balls Timeline */}
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-2">This Over Deliveries:</span>
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
              {currentInnings.balls.filter(b => b.overNumber === currentOverNumber).length === 0 ? (
                <span className="text-xs text-slate-500 italic">Over starting...</span>
              ) : (
                currentInnings.balls
                  .filter(b => b.overNumber === currentOverNumber)
                  .map(b => (
                    <div
                      key={b.id}
                      className={`min-w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border ${
                        b.dismissal
                          ? 'bg-rose-600 border-rose-400 text-white'
                          : b.outcomeType === 'SIX'
                          ? 'bg-amber-500 border-amber-300 text-slate-950'
                          : b.outcomeType === 'FOUR'
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : b.outcomeType === 'WIDE' || b.outcomeType === 'NO_BALL'
                          ? 'bg-amber-900 border-amber-600 text-amber-200'
                          : b.outcomeType === 'DECLARATION_1D'
                          ? 'bg-purple-800 border-purple-500 text-purple-200'
                          : b.effectiveRuns === 0
                          ? 'bg-slate-800 border-slate-700 text-slate-400'
                          : 'bg-emerald-800 border-emerald-600 text-white'
                      }`}
                      title={b.commentary}
                    >
                      {b.dismissal ? 'W' : b.outcomeType === 'WIDE' ? 'WD' : b.outcomeType === 'NO_BALL' ? 'NB' : b.outcomeType === 'DECLARATION_1D' ? '1D' : b.effectiveRuns}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ball by Ball Commentary Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Timer className="w-4 h-4 text-amber-400" />
            <span>Ball-by-Ball Live Commentary</span>
          </h3>
          <span className="text-xs text-slate-500">{currentInnings.balls.length} deliveries</span>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {currentInnings.balls.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4">Waiting for the match to commence.</p>
          ) : (
            [...currentInnings.balls].reverse().map((b) => (
              <div
                key={b.id}
                className="flex items-start space-x-3 text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80"
              >
                <div className="font-mono font-bold text-amber-400 bg-slate-800/80 px-2 py-1 rounded min-w-[3rem] text-center">
                  {b.overNumber}.{b.ballNumber}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{b.bowlerName}</span>
                    <span className="text-slate-400">to</span>
                    <span className="font-bold text-amber-300">{b.batsmanName}</span>
                    {getCategoryBadge(b.batsmanCategory)}
                    {b.isPowerOver && (
                      <span className="bg-purple-900/60 text-purple-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-purple-700">
                        Power Over
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 mt-1">{b.commentary}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block font-black text-xs px-2 py-1 rounded ${
                      b.dismissal
                        ? 'bg-rose-600 text-white'
                        : b.outcomeType === 'SIX'
                        ? 'bg-amber-500 text-slate-950'
                        : b.outcomeType === 'FOUR'
                        ? 'bg-blue-600 text-white'
                        : b.effectiveRuns > 0
                        ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {b.dismissal ? `${b.dismissal.pointsDeducted} (W)` : `+${b.effectiveRuns}`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Collapsible Full Scorecard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <button
          onClick={() => setShowFullScorecard(!showFullScorecard)}
          className="w-full p-4 flex items-center justify-between text-left bg-slate-800/60 hover:bg-slate-800 transition"
        >
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white">Full Team Scorecards & Player Breakdowns</span>
          </div>
          {showFullScorecard ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showFullScorecard && (
          <div className="p-5 space-y-6">
            {match.innings.map((inn, innIdx) => {
              const innBatTeam = teams.find(t => t.id === inn.battingTeamId);
              const innBowlTeam = teams.find(t => t.id === inn.bowlingTeamId);
              const mStageDisplay = match.stage === 'LEAGUE' ? 'League Match' : match.stage === 'SEMI_FINAL' ? 'Semi-Final' : 'Grand Final';

  return (
                <div key={innIdx} className="space-y-4 border-b border-slate-800 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-amber-400">
                      Innings {innIdx + 1}: {innBatTeam?.name} ({inn.totalRuns}/{inn.totalWickets} in {inn.completedOvers}.{inn.currentOverBalls} ov)
                    </h4>
                  </div>

                  {/* Batting Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="p-2">Batter</th>
                          <th className="p-2">Category</th>
                          <th className="p-2 text-right">R</th>
                          <th className="p-2 text-right">B</th>
                          <th className="p-2 text-right">4s</th>
                          <th className="p-2 text-right">6s</th>
                          <th className="p-2 text-right">SR</th>
                          <th className="p-2 text-right">Outs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {Object.values(inn.batsmanStats).map(b => (
                          <tr key={b.playerId} className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white">{b.name}</td>
                            <td className="p-2">{getCategoryBadge(b.category)}</td>
                            <td className="p-2 text-right font-black text-amber-300">{b.runs}</td>
                            <td className="p-2 text-right">{b.ballsFaced}</td>
                            <td className="p-2 text-right">{b.fours}</td>
                            <td className="p-2 text-right">{b.sixes}</td>
                            <td className="p-2 text-right">{b.ballsFaced > 0 ? ((b.runs / b.ballsFaced) * 100).toFixed(1) : '0.0'}</td>
                            <td className="p-2 text-right text-rose-400 font-semibold">{b.dismissalsCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bowling Table */}
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="p-2">Bowler ({innBowlTeam?.shortName})</th>
                          <th className="p-2 text-right">O</th>
                          <th className="p-2 text-right">Balls</th>
                          <th className="p-2 text-right">R</th>
                          <th className="p-2 text-right">W</th>
                          <th className="p-2 text-right">Econ</th>
                          <th className="p-2 text-right">WD</th>
                          <th className="p-2 text-right">NB</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {Object.values(inn.bowlerStats).map(bowl => (
                          <tr key={bowl.playerId} className="hover:bg-slate-800/40">
                            <td className="p-2 font-bold text-white">{bowl.name}</td>
                            <td className="p-2 text-right">{bowl.oversBowled}</td>
                            <td className="p-2 text-right">{bowl.legalBalls}</td>
                            <td className="p-2 text-right">{bowl.runsConceded}</td>
                            <td className="p-2 text-right font-black text-emerald-400">{bowl.wickets}</td>
                            <td className="p-2 text-right">{bowl.oversBowled > 0 ? (bowl.runsConceded / bowl.oversBowled).toFixed(2) : '0.00'}</td>
                            <td className="p-2 text-right">{bowl.wides}</td>
                            <td className="p-2 text-right">{bowl.noBalls}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
