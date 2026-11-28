'use client';

import React, { useState, useEffect } from 'react';
import { Match, Team, PlayerCategory, BallRecord, BallOutcomeType, DismissalType, UserRole } from '@/types/cricket';
import { calculateSingleMatchPoints } from '@/lib/statsService';
import { formatDuration } from '@/lib/timerUtils';
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
  Award,
  Edit3,
  Trash2,
  History,
  X,
  Lock
} from 'lucide-react';

interface LiveScoreboardProps {
  match: Match;
  teams: Team[];
  allMatches?: Match[];
  onSelectMatch?: (id: string) => void;
  isAdmin?: boolean;
  currentUser?: { loginId: string; name: string; role?: UserRole } | null;
  onEditBall?: (params: any) => Promise<void>;
  onDeleteBall?: (params: any) => Promise<void>;
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({
  match,
  teams,
  allMatches = [],
  onSelectMatch,
  isAdmin = false,
  currentUser,
  onEditBall,
  onDeleteBall
}) => {
    const [showFullScorecard, setShowFullScorecard] = useState(false);
    
    // Admin Over History & Ball Editor State
    const [showOverHistoryModal, setShowOverHistoryModal] = useState(false);
    const [selectedInningsFilter, setSelectedInningsFilter] = useState<number>(match.currentInningsIndex);
    const [selectedOverFilter, setSelectedOverFilter] = useState(1);
    const [editingBall, setEditingBall] = useState<BallRecord | null>(null);
    const [editOutcomeType, setEditOutcomeType] = useState<BallOutcomeType>('DOT');
    const [editEffectiveRuns, setEditEffectiveRuns] = useState<number>(0);
    const [editNoBallType, setEditNoBallType] = useState<'NORMAL' | 'LEG_UPLIFT'>('NORMAL');
    const [editDismissalType, setEditDismissalType] = useState<DismissalType>('CAUGHT');
    const [editIsCatchByFemale, setEditIsCatchByFemale] = useState(false);
    const [editFielderId, setEditFielderId] = useState('');
    const [editAssistedFielderId, setEditAssistedFielderId] = useState('');
    const [editRunOutType, setEditRunOutType] = useState<'DIRECT' | 'ASSISTED'>('DIRECT');
    const [editBatsmanId, setEditBatsmanId] = useState('');
    const [editBowlerId, setEditBowlerId] = useState('');
    const [editIsPowerOver, setEditIsPowerOver] = useState(false);
    const [editCommentary, setEditCommentary] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isSuperAdmin = currentUser?.role === 'ADMIN' || currentUser?.loginId?.toLowerCase() === 'admin';
    const isScorer = !isSuperAdmin;

    const isCurrentActiveOver = (overNum: number, innIdx: number = selectedInningsFilter) => {
      if (innIdx !== match.currentInningsIndex) return false;
      const activeInn = match.innings[match.currentInningsIndex];
      if (!activeInn) return false;
      const curOv = activeInn.completedOvers + 1;
      if (overNum === curOv) return true;
      if (activeInn.currentOverBalls === 0 && overNum === activeInn.completedOvers && overNum > 0) {
        return true;
      }
      return false;
    };

    // Live Duration Timer Ticker
    const [, setTimerTick] = useState(0);
    useEffect(() => {
      if (match.status === 'LIVE') {
        const interval = setInterval(() => {
          setTimerTick(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [match.status]);

    const matchDuration = formatDuration(match.startedAt, match.completedAt);
    const inn1Duration = formatDuration(match.innings[0]?.startedAt, match.innings[0]?.completedAt);
    const inn2Duration = formatDuration(match.innings[1]?.startedAt, match.innings[1]?.completedAt);
    const currentInnDuration = formatDuration(match.innings[match.currentInningsIndex]?.startedAt, match.innings[match.currentInningsIndex]?.completedAt);

    const handleOpenEditBall = (ball: BallRecord, innIdx: number = selectedInningsFilter) => {
      if (isScorer && !isCurrentActiveOver(ball.overNumber, innIdx)) {
        alert(`🔒 Access Restricted: As Scorer (${currentUser?.name || currentUser?.loginId || 'Official'}), you can only edit balls in the active current over. Past overs require Super Admin credentials.`);
        return;
      }
      setEditingBall(ball);
      setEditOutcomeType(ball.outcomeType);
      setEditEffectiveRuns(ball.effectiveRuns);
      setEditNoBallType(ball.noBallType || 'NORMAL');
      setEditDismissalType(ball.dismissal?.type || 'CAUGHT');
      setEditIsCatchByFemale(!!ball.dismissal?.caughtByFemale);
      setEditFielderId(ball.dismissal?.fielderId || '');
      setEditAssistedFielderId(ball.dismissal?.assistedFielderId || '');
      setEditRunOutType(ball.dismissal?.runOutType || 'DIRECT');
      setEditBatsmanId(ball.batsmanId || '');
      setEditBowlerId(ball.bowlerId || '');
      setEditIsPowerOver(!!ball.isPowerOver);
      setEditCommentary(ball.commentary || '');
    };

    const handleEditOutcomeChange = (newOutcome: BallOutcomeType) => {
      setEditOutcomeType(newOutcome);
      const targetPlayer = teams.flatMap(t => t.players).find(p => p.id === (editBatsmanId || editingBall?.batsmanId));
      const cat = targetPlayer?.category || editingBall?.batsmanCategory;
      const isFemale = cat === 'FEMALE';
      const isSeniorOrKid = cat === 'SENIOR' || cat === 'KID';
      const isPwr = editIsPowerOver;

      let runs = 0;
      if (newOutcome === 'DOT') runs = 0;
      else if (newOutcome === 'RUN_1') runs = isFemale ? 2 : 1;
      else if (newOutcome === 'RUN_2') runs = isFemale ? 4 : 2;
      else if (newOutcome === 'RUN_3') runs = isFemale ? 6 : 3;
      else if (newOutcome === 'FOUR') runs = isFemale ? 9 : isSeniorOrKid ? 5 : 4;
      else if (newOutcome === 'SIX') runs = isFemale ? 14 : isSeniorOrKid ? 8 : 6;
      else if (newOutcome === 'DECLARATION_1D') runs = isFemale ? 2 : 1;
      else if (newOutcome === 'WIDE') runs = 1;
      else if (newOutcome === 'NO_BALL') runs = 1;
      else if (newOutcome === 'BYE') runs = 1;
      else if (newOutcome === 'WICKET') {
        runs = isPwr ? (editIsCatchByFemale ? -7 : -5) : (editIsCatchByFemale ? -4 : -2);
      }
      if (isPwr && runs > 0 && newOutcome !== 'WIDE' && newOutcome !== 'NO_BALL' && newOutcome !== 'BYE') {
        runs *= 2;
      }
      setEditEffectiveRuns(runs);
    };

    const handleSaveEditBall = async () => {
      if (!editingBall || !onEditBall) return;
      try {
        setIsSubmitting(true);
        await onEditBall({
          matchId: match.id,
          ballId: editingBall.id,
          outcomeType: editOutcomeType,
          effectiveRuns: editEffectiveRuns,
          noBallType: editNoBallType,
          dismissalType: editDismissalType,
          isCatchByFemale: editIsCatchByFemale,
          fielderId: editFielderId,
          assistedFielderId: editAssistedFielderId,
          runOutType: editRunOutType,
          batsmanId: editBatsmanId,
          bowlerId: editBowlerId,
          isPowerOver: editIsPowerOver,
          commentary: editCommentary,
        });
        setEditingBall(null);
      } catch (err: any) {
        alert(`Error updating ball: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleDeleteSelectedBall = async (ballId: string, overNum?: number, innIdx: number = selectedInningsFilter) => {
      if (!onDeleteBall) return;
      if (overNum !== undefined && isScorer && !isCurrentActiveOver(overNum, innIdx)) {
        alert(`🔒 Access Restricted: As Scorer (${currentUser?.name || currentUser?.loginId || 'Official'}), you cannot delete balls from past overs. Only Super Admin can modify past overs.`);
        return;
      }
      if (!confirm('Are you sure you want to delete this ball? All scorecard statistics will be recalculated.')) return;
      try {
        setIsSubmitting(true);
        await onDeleteBall({
          matchId: match.id,
          ballId,
        });
        if (editingBall?.id === ballId) setEditingBall(null);
      } catch (err: any) {
        alert(`Error deleting ball: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    };
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
        {/* Parallel Live Matches Selector (when multiple matches are LIVE) */}
        {allMatches.filter(m => m.status === 'LIVE').length > 1 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                Multiple Matches Live Now:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {allMatches.filter(m => m.status === 'LIVE').map(lm => {
                const mA = teams.find(t => t.id === lm.teamAId);
                const mB = teams.find(t => t.id === lm.teamBId);
                const isSelected = lm.id === match.id;
                const curInn = lm.innings[lm.currentInningsIndex];
                return (
                  <button
                    key={lm.id}
                    onClick={() => onSelectMatch?.(lm.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${isSelected
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/30 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mA?.color || '#3b82f6' }} />
                    <span>{mA?.shortName || 'T1'} vs {mB?.shortName || 'T2'}</span>
                    <span className="font-mono text-[11px] opacity-80">
                      ({curInn?.totalRuns}/{curInn?.totalWickets})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Broadcast Live Screen Header */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Glow Effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Live Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 sm:h-3 sm:w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-rose-500" />
              </span>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-rose-400">
                {match.status === 'COMPLETED' ? 'Match Finished' : match.status === 'TIED' ? 'Match Tied (Super Over)' : 'LIVE MATCH'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] sm:text-xs text-slate-300 font-semibold truncate max-w-[150px] sm:max-w-none">{match.boxVenue || 'Box Turf'}</span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] sm:text-xs">
              {isAdmin && onEditBall && (
                <button
                  onClick={() => {
                    setSelectedInningsFilter(match.currentInningsIndex);
                    setSelectedOverFilter(currentOverNumber);
                    setShowOverHistoryModal(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-md shadow flex items-center space-x-1 transition active:scale-95"
                  title="Admin: Edit any ball from any over"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Edit Overs & Balls</span>
                </button>
              )}
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md font-semibold border border-slate-700">
                {mStageDisplay}
              </span>
              <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md font-bold border border-amber-500/30">
                {match.totalOvers} Overs
              </span>
            </div>
          </div>

          {/* Match & Innings Duration Live Timers */}
          {(match.startedAt || currentInnings.startedAt) && (
            <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs">
              <div className="flex items-center space-x-2 text-amber-300 font-bold font-mono">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>⏱️ Match Duration: {matchDuration}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px]">
                <span>Inn 1: <strong className="text-white">{inn1Duration}</strong></span>
                {match.innings[1]?.startedAt && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span>Inn 2: <strong className="text-white">{inn2Duration}</strong></span>
                  </>
                )}
                {match.status === 'LIVE' && (
                  <span className="text-emerald-400 font-bold animate-pulse">● LIVE</span>
                )}
              </div>
            </div>
          )}

          {/* Prominent Matchup: Who is Playing With Whom */}
          <div className="mt-3.5 sm:mt-4 bg-slate-950/80 border border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
            <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-2">
              {/* Team A */}
              <div className={`flex items-center space-x-2.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border min-w-0 ${currentInnings.battingTeamId === teamA?.id
                  ? 'bg-slate-900 border-amber-500/60 ring-2 ring-amber-500/20'
                  : 'bg-slate-950 border-slate-800'
                }`}>
                {teamA?.logoUrl ? (
                  <img
                    src={teamA.logoUrl}
                    alt={teamA.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg p-0.5 bg-slate-900 border border-slate-800 shrink-0 shadow-sm"
                  />
                ) : (
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ring-2 ring-white/20 shrink-0" style={{ backgroundColor: teamA?.color || '#3b82f6' }} />
                )}
                <div className="min-w-0">
                  <span className="text-sm sm:text-lg font-black text-white block leading-tight truncate">{teamA?.name || 'Team A'}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${currentInnings.battingTeamId === teamA?.id ? 'text-amber-400 font-black' : 'text-slate-400'
                    }`}>
                    {currentInnings.battingTeamId === teamA?.id ? '🏏 BATTING' : '⚾ FIELDING / BOWLING'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center py-0.5 sm:py-0">
                <span className="text-amber-400 font-black text-xs sm:text-base italic px-2 py-0.5 bg-slate-900/80 rounded-full border border-slate-800">VS</span>
              </div>

              {/* Team B */}
              <div className={`flex items-center space-x-2.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border min-w-0 ${currentInnings.battingTeamId === teamB?.id
                  ? 'bg-slate-900 border-amber-500/60 ring-2 ring-amber-500/20'
                  : 'bg-slate-950 border-slate-800'
                }`}>
                {teamB?.logoUrl ? (
                  <img
                    src={teamB.logoUrl}
                    alt={teamB.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg p-0.5 bg-slate-900 border border-slate-800 shrink-0 shadow-sm"
                  />
                ) : (
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ring-2 ring-white/20 shrink-0" style={{ backgroundColor: teamB?.color || '#ef4444' }} />
                )}
                <div className="min-w-0">
                  <span className="text-sm sm:text-lg font-black text-white block leading-tight truncate">{teamB?.name || 'Team B'}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${currentInnings.battingTeamId === teamB?.id ? 'text-amber-400 font-black' : 'text-slate-400'
                    }`}>
                    {currentInnings.battingTeamId === teamB?.id ? '🏏 BATTING' : '⚾ FIELDING / BOWLING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Toss Info & Innings */}
            <div className="w-full md:w-auto text-xs text-slate-300 bg-slate-900 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-800 space-y-1">
              <div>
                <span className="text-slate-400">Toss: </span>
                {match.tossWinnerId ? (
                  <strong className="text-amber-300">
                    {teams.find(t => t.id === match.tossWinnerId)?.name} won toss & elected to {match.tossDecision}
                  </strong>
                ) : (
                  <span className="text-slate-500 italic">Pending toss</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                Innings: <strong className="text-white">{match.currentInningsIndex + 1} of 2</strong> ({match.totalOvers} overs match)
              </div>
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
                {battingTeam?.logoUrl && (
                  <img
                    src={battingTeam.logoUrl}
                    alt={battingTeam.name}
                    className="w-10 h-10 object-contain rounded-xl p-0.5 bg-slate-950 border border-slate-800 shadow-md shrink-0"
                  />
                )}
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
            <div className="mt-6 space-y-3">
              <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-center text-amber-300 font-black text-base sm:text-lg flex items-center justify-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>
                  {teams.find(t => t.id === match.winnerId)?.name} won the match!
                </span>
              </div>

              {/* Player of the Match Card */}
              {(() => {
                const singlePoints = calculateSingleMatchPoints(match, teams);
                const potm = Object.values(singlePoints).sort((a, b) => b.totalPoints - a.totalPoints)[0];
                if (!potm || potm.totalPoints <= 0) return null;
                return (
                  <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/20 border border-amber-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0 text-lg">
                        ⭐
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5 justify-center sm:justify-start">
                          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                            Player of the Match
                          </span>
                          <span className="text-xs text-slate-400">• {potm.teamName}</span>
                        </div>
                        <h4 className="text-lg font-black text-white">{potm.name}</h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-center sm:text-right">
                        <span className="text-xs text-slate-400 block font-semibold">Match Performance</span>
                        <div className="text-xs text-slate-300 font-bold space-x-2">
                          <span>Bat: <strong className="text-emerald-400">{potm.battingPoints}</strong></span>
                          <span>Bowl: <strong className="text-purple-400">{potm.bowlingPoints}</strong></span>
                          <span>Field: <strong className="text-blue-400">{potm.fieldingPoints}</strong></span>
                        </div>
                      </div>
                      <div className="border-l border-slate-700 pl-4 text-center sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total</span>
                        <span className="text-2xl font-black text-amber-400">{potm.totalPoints} pts</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
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

            {/* Over Breakup: Current Over & Previous Over Separately */}
            <div className="space-y-3 pt-2">
              {/* 1. CURRENT OVER BREAKUP */}
              {(() => {
                const currentOverBalls = currentInnings.balls.filter(b => b.overNumber === currentOverNumber);
                const currentOverRuns = currentOverBalls.reduce((s, b) => s + b.effectiveRuns, 0);
                const currentOverWkts = currentOverBalls.filter(b => b.dismissal).length;

                return (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                          Current Over (Over {currentOverNumber}):
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {currentOverBalls.length} balls • {currentOverRuns > 0 ? `+${currentOverRuns}` : currentOverRuns} runs{currentOverWkts > 0 ? ` • ${currentOverWkts} wkt` : ''}
                        </span>
                      </div>
                      {isAdmin && onEditBall && (
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          💡 Click ball to edit
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 visual-scrollbar">
                      {currentOverBalls.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">Over starting... Waiting for first delivery</span>
                      ) : (
                        currentOverBalls.map(b => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => isAdmin && onEditBall && handleOpenEditBall(b)}
                            className={`min-w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border transition ${
                              isAdmin && onEditBall ? 'cursor-pointer hover:scale-110 active:scale-95 ring-1 ring-amber-400/40' : 'cursor-default'
                            } ${b.dismissal
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
                            title={isAdmin && onEditBall ? `Admin: Click to edit ball ${b.overNumber}.${b.ballNumber}: ${b.commentary}` : b.commentary}
                          >
                            {b.dismissal ? 'W' : b.outcomeType === 'WIDE' ? 'WD' : b.outcomeType === 'NO_BALL' ? 'NB' : b.outcomeType === 'DECLARATION_1D' ? '1D' : b.effectiveRuns}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 2. PREVIOUS OVER BREAKUP */}
              {(() => {
                const prevOverNumber = currentOverNumber - 1;
                const prevOverBalls = prevOverNumber > 0 ? currentInnings.balls.filter(b => b.overNumber === prevOverNumber) : [];
                const prevOverRuns = prevOverBalls.reduce((s, b) => s + b.effectiveRuns, 0);
                const prevOverWkts = prevOverBalls.filter(b => b.dismissal).length;
                const prevOverBowler = prevOverBalls[0]?.bowlerName || '';

                return (
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/70">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Previous Over {prevOverNumber > 0 ? `(Over ${prevOverNumber})` : ''}:
                        </span>
                        {prevOverNumber > 0 ? (
                          <span className="text-[11px] text-slate-400 font-mono">
                            Bowled by <strong>{prevOverBowler || 'Bowler'}</strong> • {prevOverBalls.length} balls • {prevOverRuns > 0 ? `+${prevOverRuns}` : prevOverRuns} runs{prevOverWkts > 0 ? ` • ${prevOverWkts} wkt` : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 italic">None (First over of innings)</span>
                        )}
                      </div>
                    </div>
                    {prevOverNumber > 0 && (
                      <div className="flex items-center space-x-2 overflow-x-auto pb-1 visual-scrollbar">
                        {prevOverBalls.map(b => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => isAdmin && onEditBall && handleOpenEditBall(b)}
                            className={`min-w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border transition ${
                              isAdmin && onEditBall ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
                            } ${b.dismissal
                                ? 'bg-rose-600/80 border-rose-400 text-white'
                                : b.outcomeType === 'SIX'
                                  ? 'bg-amber-500/80 border-amber-300 text-slate-950'
                                  : b.outcomeType === 'FOUR'
                                    ? 'bg-blue-600/80 border-blue-400 text-white'
                                    : b.outcomeType === 'WIDE' || b.outcomeType === 'NO_BALL'
                                      ? 'bg-amber-900/80 border-amber-600 text-amber-200'
                                      : b.outcomeType === 'DECLARATION_1D'
                                        ? 'bg-purple-800/80 border-purple-500 text-purple-200'
                                        : b.effectiveRuns === 0
                                          ? 'bg-slate-800 border-slate-700 text-slate-400'
                                          : 'bg-emerald-800/80 border-emerald-600 text-white'
                              }`}
                            title={b.commentary}
                          >
                            {b.dismissal ? 'W' : b.outcomeType === 'WIDE' ? 'WD' : b.outcomeType === 'NO_BALL' ? 'NB' : b.outcomeType === 'DECLARATION_1D' ? '1D' : b.effectiveRuns}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Ball by Ball Commentary Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Timer className="w-4 h-4 text-amber-400" />
              <span>Ball-by-Ball Live Commentary</span>
            </h3>
            <div className="flex items-center space-x-3">
              {isAdmin && onEditBall && (
                <button
                  onClick={() => {
                    setSelectedInningsFilter(match.currentInningsIndex);
                    setSelectedOverFilter(currentOverNumber);
                    setShowOverHistoryModal(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 text-xs font-bold underline flex items-center space-x-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Over Log & Ball Editor</span>
                </button>
              )}
              <span className="text-xs text-slate-500">{currentInnings.balls.length} deliveries</span>
            </div>
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
                  <div className="text-right flex items-center space-x-2 shrink-0">
                    <span
                      className={`inline-block font-black text-xs px-2 py-1 rounded ${b.dismissal
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
                    {isAdmin && onEditBall && (
                      isScorer && !isCurrentActiveOver(b.overNumber, match.currentInningsIndex) ? (
                        <div
                          className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed"
                          title="Past over delivery: Only Super Admin can edit"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenEditBall(b, match.currentInningsIndex)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white transition"
                          title="Edit this delivery"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
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

        {/* OVER LOG & BALL EDITOR MODAL */}
        {showOverHistoryModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center space-x-2">
                    <History className="w-5 h-5 text-amber-400" />
                    <span>Over Ball Log & Full Editor</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select any over and innings to review, change outcome/runs, reassign batter/bowler, or delete accidental deliveries.
                  </p>
                </div>
                <button onClick={() => setShowOverHistoryModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Innings Selector Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5 flex-shrink-0 overflow-x-auto visual-scrollbar">
                {match.innings.map((inn, innIdx) => {
                  const innTeam = teams.find(t => t.id === inn.battingTeamId);
                  return (
                    <button
                      key={innIdx}
                      onClick={() => {
                        setSelectedInningsFilter(innIdx);
                        setSelectedOverFilter(1);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                        selectedInningsFilter === innIdx
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>Innings {innIdx + 1}: {innTeam?.shortName || innTeam?.name || `Team ${innIdx + 1}`}</span>
                      <span className="font-mono text-[10px] font-black opacity-80">
                        ({inn.totalRuns}/{inn.totalWickets} in {inn.completedOvers}.{inn.currentOverBalls} ov)
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Over Selector Tabs */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2.5 flex-shrink-0 visual-scrollbar">
                {Array.from({ length: match.totalOvers }, (_, i) => i + 1).map(ov => {
                  const targetInnings = match.innings[selectedInningsFilter] || currentInnings;
                  const ballsInOv = targetInnings.balls.filter(b => b.overNumber === ov);
                  const overRuns = ballsInOv.reduce((sum, b) => sum + b.effectiveRuns, 0);
                  const isSelected = selectedOverFilter === ov;
                  const isCur = isCurrentActiveOver(ov, selectedInningsFilter);
                  const isLockedForScorer = isScorer && !isCur;
                  return (
                    <button
                      key={ov}
                      onClick={() => setSelectedOverFilter(ov)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md'
                          : isLockedForScorer
                          ? 'bg-slate-900/90 border-slate-800 text-slate-400 hover:bg-slate-800/80'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isLockedForScorer && <Lock className="w-3 h-3 text-slate-500 shrink-0" />}
                      <span>Over {ov}</span>
                      <span className="text-[10px] opacity-80 font-normal">
                        ({ballsInOv.length}b • {overRuns > 0 ? `+${overRuns}` : overRuns}r)
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Scorer Read-Only Banner on Past Overs */}
              {isScorer && !isCurrentActiveOver(selectedOverFilter, selectedInningsFilter) && (
                <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <b>Past Over (Locked for Scorer):</b> As Scorer ({currentUser?.name || currentUser?.loginId || 'Official'}), you can only edit the active current over. Past overs require Super Admin credentials.
                    </span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-black border border-amber-500/30 text-amber-300">
                    LOCKED
                  </span>
                </div>
              )}

              {/* Balls in Selected Over List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {(() => {
                  const targetInnings = match.innings[selectedInningsFilter] || currentInnings;
                  const overBalls = targetInnings.balls.filter(b => b.overNumber === selectedOverFilter);
                  if (overBalls.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/60">
                        No deliveries recorded in Over {selectedOverFilter} of Innings {selectedInningsFilter + 1} yet.
                      </div>
                    );
                  }
                  const isOverLocked = isScorer && !isCurrentActiveOver(selectedOverFilter, selectedInningsFilter);
                  return overBalls.map((ball, idx) => (
                    <div
                      key={ball.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 font-mono text-xs font-black text-amber-400 flex items-center justify-center border border-slate-700 shrink-0">
                          {idx + 1}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase shrink-0 ${
                          ball.dismissal
                            ? 'bg-rose-600 text-white'
                            : ball.outcomeType === 'SIX'
                            ? 'bg-amber-500 text-slate-950'
                            : ball.outcomeType === 'FOUR'
                            ? 'bg-blue-600 text-white'
                            : ball.outcomeType === 'WIDE' || ball.outcomeType === 'NO_BALL'
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-600/40'
                            : 'bg-slate-800 text-slate-200'
                        }`}>
                          {ball.dismissal ? 'WICKET' : ball.outcomeType.replace('_', ' ')}
                        </span>

                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-1.5 flex-wrap">
                            <span>{ball.batsmanName}</span>
                            {getCategoryBadge(ball.batsmanCategory)}
                            <span className="text-slate-500">facing</span>
                            <span className="text-slate-300">{ball.bowlerName}</span>
                            {ball.isPowerOver && (
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30 font-bold">
                                ⚡ Power Over
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {ball.commentary}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                        <span className={`text-sm font-black font-mono ${
                          ball.effectiveRuns < 0 ? 'text-rose-400' : ball.effectiveRuns > 0 ? 'text-emerald-400' : 'text-slate-400'
                        }`}>
                          {ball.effectiveRuns > 0 ? `+${ball.effectiveRuns}` : ball.effectiveRuns} runs
                        </span>

                        <div className="flex items-center space-x-1.5">
                          {isOverLocked ? (
                            <div
                              className="flex items-center space-x-1 text-slate-500 text-xs font-semibold px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg cursor-not-allowed"
                              title="Past Over: Only Super Admin can edit or delete this delivery"
                            >
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span className="text-[11px]">Locked</span>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEditBall(ball, selectedInningsFilter)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1 transition active:scale-95"
                                title="Edit this ball"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSelectedBall(ball.id, ball.overNumber, selectedInningsFilter)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-white transition"
                                title="Delete this ball"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setShowOverHistoryModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT INDIVIDUAL BALL SUB-MODAL */}
        {editingBall && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-base font-black text-white flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Edit Delivery: Over {editingBall.overNumber}.{editingBall.ballNumber}</span>
                </h4>
                <button onClick={() => setEditingBall(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Batter & Bowler Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Batter Facing
                    </label>
                    <select
                      value={editBatsmanId}
                      onChange={(e) => {
                        setEditBatsmanId(e.target.value);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold focus:outline-none"
                    >
                      {teams.flatMap(t => t.players).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Bowler
                    </label>
                    <select
                      value={editBowlerId}
                      onChange={(e) => setEditBowlerId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold focus:outline-none"
                    >
                      {teams.flatMap(t => t.players).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Power Over Toggle */}
                <label className="flex items-center space-x-2 text-xs text-purple-300 cursor-pointer bg-purple-950/40 p-2.5 rounded-xl border border-purple-800/50">
                  <input
                    type="checkbox"
                    checked={editIsPowerOver}
                    onChange={(e) => {
                      setEditIsPowerOver(e.target.checked);
                    }}
                    className="rounded border-purple-700 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-bold">⚡ Power Over Delivery (Runs doubled off bat / -5 wicket)</span>
                </label>

                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Outcome Type
                  </label>
                  <select
                    value={editOutcomeType}
                    onChange={(e) => handleEditOutcomeChange(e.target.value as BallOutcomeType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold focus:outline-none"
                  >
                    <option value="DOT">Dot Ball (0 runs)</option>
                    <option value="RUN_1">1 Run</option>
                    <option value="RUN_2">2 Runs</option>
                    <option value="RUN_3">3 Runs</option>
                    <option value="FOUR">4 Four</option>
                    <option value="SIX">6 Six</option>
                    <option value="DECLARATION_1D">Side Net Declaration (1D/2D)</option>
                    <option value="WIDE">Wide (+1 run)</option>
                    <option value="NO_BALL">No Ball</option>
                    <option value="BYE">Bye (+1 run)</option>
                    <option value="WICKET">Wicket / Dismissal</option>
                  </select>
                </div>

                {/* If No-Ball */}
                {editOutcomeType === 'NO_BALL' && (
                  <div>
                    <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      No-Ball Infringement Reason
                    </label>
                    <select
                      value={editNoBallType}
                      onChange={(e) => setEditNoBallType(e.target.value as 'NORMAL' | 'LEG_UPLIFT')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-semibold focus:outline-none"
                    >
                      <option value="NORMAL">Normal / Overstep (+1 & Free Hit Next)</option>
                      <option value="LEG_UPLIFT">Leg Uplift (+1, NO Free Hit)</option>
                    </select>
                  </div>
                )}

                {/* If Wicket */}
                {editOutcomeType === 'WICKET' && (
                  <div className="space-y-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div>
                      <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                        Dismissal Type
                      </label>
                      <select
                        value={editDismissalType}
                        onChange={(e) => setEditDismissalType(e.target.value as DismissalType)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-semibold focus:outline-none"
                      >
                        <option value="CAUGHT">Caught</option>
                        <option value="BOWLED">Bowled</option>
                        <option value="RUN_OUT">Run Out</option>
                        <option value="STUMPED">Stumped</option>
                        <option value="HIT_WICKET">Hit Wicket</option>
                      </select>
                    </div>

                    {editDismissalType === 'CAUGHT' && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-amber-400 block">
                          Caught By Fielder (+5 Fielding Pts)
                        </label>
                        <select
                          value={editFielderId}
                          onChange={(e) => {
                            const fId = e.target.value;
                            setEditFielderId(fId);
                            const chosen = teams.flatMap(t => t.players).find(p => p.id === fId);
                            if (chosen?.category === 'FEMALE') {
                              setEditIsCatchByFemale(true);
                              const deduction = editIsPowerOver ? -7 : -4;
                              setEditEffectiveRuns(deduction);
                            }
                          }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-semibold focus:outline-none"
                        >
                          <option value="">-- Select Fielder --</option>
                          {teams.flatMap(t => t.players).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.category})
                            </option>
                          ))}
                        </select>

                        <label className="flex items-center space-x-2 text-xs text-pink-300 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={editIsCatchByFemale}
                            onChange={(e) => {
                              setEditIsCatchByFemale(e.target.checked);
                              if (editOutcomeType === 'WICKET') {
                                const deduction = editIsPowerOver
                                  ? (e.target.checked ? -7 : -5)
                                  : (e.target.checked ? -4 : -2);
                                setEditEffectiveRuns(deduction);
                              }
                            }}
                            className="rounded border-slate-700 text-pink-600 focus:ring-pink-500"
                          />
                          <span className="font-bold">Caught by Female Player (-4 standard / -7 power over)</span>
                        </label>
                      </div>
                    )}

                    {editDismissalType === 'RUN_OUT' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditRunOutType('DIRECT')}
                            className={`p-1.5 rounded text-xs font-bold ${
                              editRunOutType === 'DIRECT' ? 'bg-amber-500/20 border border-amber-500 text-amber-300' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            Direct Hit (+8 pts)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditRunOutType('ASSISTED')}
                            className={`p-1.5 rounded text-xs font-bold ${
                              editRunOutType === 'ASSISTED' ? 'bg-amber-500/20 border border-amber-500 text-amber-300' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            Assisted (+4 pts each)
                          </button>
                        </div>

                        <select
                          value={editFielderId}
                          onChange={(e) => setEditFielderId(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-semibold focus:outline-none"
                        >
                          <option value="">-- {editRunOutType === 'DIRECT' ? 'Select Direct Fielder (+8)' : 'Primary Fielder (+4)'} --</option>
                          {teams.flatMap(t => t.players).map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                          ))}
                        </select>

                        {editRunOutType === 'ASSISTED' && (
                          <select
                            value={editAssistedFielderId}
                            onChange={(e) => setEditAssistedFielderId(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-semibold focus:outline-none"
                          >
                            <option value="">-- Secondary Fielder (+4) --</option>
                            {teams.flatMap(t => t.players).map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {editDismissalType === 'STUMPED' && (
                      <div>
                        <label className="text-xs font-bold text-amber-400 block mb-1">
                          Keeper / Fielder who Stumped (+5)
                        </label>
                        <select
                          value={editFielderId}
                          onChange={(e) => setEditFielderId(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-semibold focus:outline-none"
                        >
                          <option value="">-- Select Keeper / Fielder --</option>
                          {teams.flatMap(t => t.players).map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Effective Team Runs (allows negative for wickets)
                  </label>
                  <input
                    type="number"
                    value={editEffectiveRuns}
                    onChange={(e) => setEditEffectiveRuns(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Commentary Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={editCommentary}
                    onChange={(e) => setEditCommentary(e.target.value)}
                    placeholder="e.g. Driven through covers for boundary"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteSelectedBall(editingBall.id)}
                  disabled={isSubmitting}
                  className="px-3 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/40 flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Ball</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingBall(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditBall}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                  >
                    Save & Recalculate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
