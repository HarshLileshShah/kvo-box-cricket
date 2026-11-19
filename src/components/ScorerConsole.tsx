'use client';

import React, { useState } from 'react';
import { 
  Match, 
  Team, 
  Player, 
  BallOutcomeType, 
  DismissalType, 
  PlayerCategory 
} from '@/types/cricket';
import { checkRuleCompliance } from '@/lib/rulesEngine';
import { 
  Zap, 
  RotateCcw, 
  ArrowLeftRight, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  Flame, 
  Undo2, 
  Info,
  CheckCircle2,
  AlertCircle,
  Users
} from 'lucide-react';

interface ScorerConsoleProps {
  match: Match;
  teams: Team[];
  onRecordBall: (params: any) => Promise<void>;
  onUndoBall: (matchId: string) => Promise<void>;
  onUpdateParticipants: (params: any) => Promise<void>;
  onOpenPlaying8Modal?: () => void;
}

export const ScorerConsole: React.FC<ScorerConsoleProps> = ({
  match,
  teams,
  onRecordBall,
  onUndoBall,
  onUpdateParticipants,
  onOpenPlaying8Modal,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState<DismissalType>('CAUGHT');
  const [isCatchByFemale, setIsCatchByFemale] = useState(false);
  const [dismissedWho, setDismissedWho] = useState<'STRIKER' | 'NON_STRIKER'>('STRIKER');
  
  const [showChangePairModal, setShowChangePairModal] = useState(false);
  const [selectedNewStrikerId, setSelectedNewStrikerId] = useState('');
  const [selectedNewNonStrikerId, setSelectedNewNonStrikerId] = useState('');
  const [selectedNewBowlerId, setSelectedNewBowlerId] = useState('');

  const currentInnings = match.innings[match.currentInningsIndex];
  const battingTeam = teams.find(t => t.id === currentInnings.battingTeamId);
  const bowlingTeam = teams.find(t => t.id === currentInnings.bowlingTeamId);

  const battingPlayingIds = currentInnings.battingTeamId === match.teamAId ? match.teamAPlaying8Ids : match.teamBPlaying8Ids;
  const bowlingPlayingIds = currentInnings.bowlingTeamId === match.teamAId ? match.teamAPlaying8Ids : match.teamBPlaying8Ids;

  const eligibleBatters = (battingPlayingIds && battingPlayingIds.length >= 2)
    ? (battingTeam?.players.filter(p => battingPlayingIds.includes(p.id)) || battingTeam?.players || [])
    : (battingTeam?.players || []);

  const eligibleBowlers = (bowlingPlayingIds && bowlingPlayingIds.length >= 1)
    ? (bowlingTeam?.players.filter(p => bowlingPlayingIds.includes(p.id)) || bowlingTeam?.players || [])
    : (bowlingTeam?.players || []);

  const striker = battingTeam?.players.find(p => p.id === currentInnings.currentPair.strikerId);
  const nonStriker = battingTeam?.players.find(p => p.id === currentInnings.currentPair.nonStrikerId);
  const bowler = bowlingTeam?.players.find(p => p.id === currentInnings.currentBowlerId);

  const currentOverNumber = currentInnings.completedOvers + 1;
  const isPowerOver = currentInnings.powerOverDeclaredNumber === currentOverNumber;
  const isSemiOrFinal = match.stage === 'SEMI_FINAL' || match.stage === 'FINAL';

  // Stats for senior / junior compliance
  const seniorPlayer = battingTeam?.players.find(p => p.category === 'SENIOR');
  const seniorStats = seniorPlayer ? currentInnings.batsmanStats[seniorPlayer.id] : null;
  const seniorBallsFaced = seniorStats?.ballsFaced || 0;

  const juniorPlayer = battingTeam?.players.find(p => p.category === 'KID');
  const juniorStats = juniorPlayer ? currentInnings.batsmanStats[juniorPlayer.id] : null;
  const juniorHasBatted = (juniorStats?.ballsFaced || 0) > 0 || 
    currentInnings.currentPair.strikerId === juniorPlayer?.id || 
    currentInnings.currentPair.nonStrikerId === juniorPlayer?.id;

  const compliance = checkRuleCompliance({
    currentOver: currentOverNumber,
    isSemiFinalOrFinal: isSemiOrFinal,
    strikerCategory: striker?.category || 'REGULAR',
    nonStrikerCategory: nonStriker?.category || 'REGULAR',
    bowlerCategory: bowler?.category || 'REGULAR',
    seniorBallsFaced,
    juniorHasBatted,
  });

  const strikerCategory = striker?.category || 'REGULAR';

  // Helper to preview runs for buttons based on striker category & power over
  const getOutcomePreview = (outcome: BallOutcomeType): { label: string; runsNote: string } => {
    if (outcome === 'RUN_1') {
      let r = strikerCategory === 'FEMALE' ? 2 : 1;
      if (isPowerOver) r *= 2;
      return { label: '1 Run', runsNote: `+${r}` };
    }
    if (outcome === 'RUN_2') {
      let r = strikerCategory === 'FEMALE' ? 4 : 2;
      if (isPowerOver) r *= 2;
      return { label: '2 Runs', runsNote: `+${r}` };
    }
    if (outcome === 'RUN_3') {
      let r = strikerCategory === 'FEMALE' ? 6 : 3;
      if (isPowerOver) r *= 2;
      return { label: '3 Runs', runsNote: `+${r}` };
    }
    if (outcome === 'FOUR') {
      let r = 4;
      if (strikerCategory === 'FEMALE') r = 9; // (4x2)+1
      else if (strikerCategory === 'SENIOR' || strikerCategory === 'KID') r = 5; // 4+1
      if (isPowerOver) r *= 2;
      return { label: '4 FOUR', runsNote: `+${r}` };
    }
    if (outcome === 'SIX') {
      let r = 6;
      if (strikerCategory === 'FEMALE') r = 14; // (6x2)+2
      else if (strikerCategory === 'SENIOR' || strikerCategory === 'KID') r = 8; // 6+2
      if (isPowerOver) r *= 2;
      return { label: '6 SIX', runsNote: `+${r}` };
    }
    if (outcome === 'DECLARATION_1D') {
      let r = strikerCategory === 'FEMALE' ? 2 : 1;
      if (isPowerOver) r *= 2;
      return { label: strikerCategory === 'FEMALE' ? '2D Side Net' : '1D Side Net', runsNote: `+${r}` };
    }
    return { label: outcome, runsNote: '' };
  };

  const handleBallClick = async (outcomeType: BallOutcomeType) => {
    if (isSubmitting || currentInnings.isCompleted) return;

    if (outcomeType === 'WICKET') {
      setShowWicketModal(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await onRecordBall({
        matchId: match.id,
        outcomeType,
      });
    } catch (err: any) {
      alert(`Error recording ball: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitWicket = async () => {
    try {
      setIsSubmitting(true);
      const dismissedPlayerId = dismissedWho === 'STRIKER' ? striker?.id : nonStriker?.id;
      await onRecordBall({
        matchId: match.id,
        outcomeType: 'WICKET',
        dismissalType: wicketType,
        isCatchByFemale,
        dismissedPlayerId,
      });
      setShowWicketModal(false);
      setIsCatchByFemale(false);
    } catch (err: any) {
      alert(`Error recording wicket: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwapStrike = async () => {
    if (!striker || !nonStriker) return;
    await onUpdateParticipants({
      matchId: match.id,
      strikerId: nonStriker.id,
      nonStrikerId: striker.id,
    });
  };

  const handleUndo = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onUndoBall(match.id);
    } catch (err: any) {
      alert(`Undo failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveParticipants = async () => {
    try {
      setIsSubmitting(true);
      await onUpdateParticipants({
        matchId: match.id,
        strikerId: selectedNewStrikerId || striker?.id,
        nonStrikerId: selectedNewNonStrikerId || nonStriker?.id,
        bowlerId: selectedNewBowlerId || bowler?.id,
      });
      setShowChangePairModal(false);
    } catch (err: any) {
      alert(`Error updating players: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPowerOver = async (overNum: number) => {
    await onUpdateParticipants({
      matchId: match.id,
      powerOverDeclaredNumber: overNum,
    });
  };

  // Recent balls in this over or last 8 balls
  const recentBalls = currentInnings.balls.slice(-8);

  const getCategoryBadge = (cat?: PlayerCategory) => {
    switch (cat) {
      case 'FEMALE':
        return <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Female (2x Runs)</span>;
      case 'SENIOR':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Senior (+1/+2 Bnd)</span>;
      case 'KID':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Junior (+1/+2 Bnd)</span>;
      default:
        return <span className="bg-slate-700/60 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-medium">Regular</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner: Match Context & Power Over Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700 p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {isPowerOver && (
          <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white text-center py-1 px-4 text-xs font-black tracking-widest uppercase shadow-md animate-pulse flex items-center justify-center space-x-2">
            <Zap className="w-4 h-4 fill-white" />
            <span>🔥 POWER OVER ACTIVE! ALL BAT RUNS DOUBLED • WICKET = -5 RUNS (-7 IF FEMALE CATCH) 🔥</span>
            <Zap className="w-4 h-4 fill-white" />
          </div>
        )}

        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isPowerOver ? 'mt-4' : ''}`}>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                {match.stage === 'LEAGUE' ? 'League Match' : match.stage}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-amber-400">
                Innings {match.currentInningsIndex + 1} of 2
              </span>
            </div>
            <div className="flex items-baseline space-x-3 mt-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white">{battingTeam?.name}</h2>
              <span className="text-slate-400 text-sm font-medium">vs {bowlingTeam?.name}</span>
            </div>
          </div>

          {/* Current Score Display */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-5 py-3 flex items-center space-x-6 shadow-inner">
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Total Score</div>
              <div className="text-3xl sm:text-4xl font-black text-amber-400">
                {currentInnings.totalRuns}
                <span className="text-base text-rose-400 font-bold"> / {currentInnings.totalWickets}w</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-800" />
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Overs</div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {currentInnings.completedOvers}.{currentInnings.currentOverBalls}
                <span className="text-xs text-slate-400 font-normal"> / {match.totalOvers} ov</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2nd Innings Target Banner if applicable */}
        {match.currentInningsIndex === 1 && (
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-300">
              Target: <span className="text-amber-300 font-bold">{match.innings[0].totalRuns + 1} runs</span> from {match.totalOvers} overs.
            </div>
            <div className="text-slate-300">
              Need: <span className="text-emerald-400 font-bold">{Math.max(0, match.innings[0].totalRuns + 1 - currentInnings.totalRuns)} runs</span> from {((match.totalOvers - currentInnings.completedOvers) * 6 - currentInnings.currentOverBalls)} balls.
            </div>
          </div>
        )}
      </div>

      {/* Rule Compliance Alerts / Guidance */}
      {compliance.warnings.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-rose-300 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            {compliance.warnings.map((w, idx) => (
              <p key={idx} className="font-semibold">{w}</p>
            ))}
          </div>
        </div>
      )}

      {compliance.info.length > 0 && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-emerald-300 text-xs flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-0.5">
            {compliance.info.map((inf, idx) => (
              <p key={idx}>{inf}</p>
            ))}
          </div>
        </div>
      )}

      {/* Active Batting Pair & Bowler Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Striker Card */}
        <div className="bg-slate-900 border-2 border-amber-500/60 rounded-xl p-4 shadow-lg relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ON STRIKE</span>
            </span>
            {getCategoryBadge(striker?.category)}
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-bold text-white truncate">{striker?.name || 'Select Striker'}</h3>
            {striker && currentInnings.batsmanStats[striker.id] && (
              <div className="text-xs text-slate-300 mt-1 flex items-center space-x-3">
                <span className="font-bold text-amber-300 text-sm">
                  {currentInnings.batsmanStats[striker.id].runs}
                </span>
                <span className="text-slate-400">
                  ({currentInnings.batsmanStats[striker.id].ballsFaced} balls, {currentInnings.batsmanStats[striker.id].fours}x4, {currentInnings.batsmanStats[striker.id].sixes}x6)
                </span>
                {currentInnings.batsmanStats[striker.id].dismissalsCount > 0 && (
                  <span className="text-rose-400 font-semibold text-[11px]">
                    {currentInnings.batsmanStats[striker.id].dismissalsCount} out
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Non-Striker Card */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-lg relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">NON-STRIKER</span>
            {getCategoryBadge(nonStriker?.category)}
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-bold text-white truncate">{nonStriker?.name || 'Select Non-Striker'}</h3>
            {nonStriker && currentInnings.batsmanStats[nonStriker.id] && (
              <div className="text-xs text-slate-300 mt-1 flex items-center space-x-3">
                <span className="font-bold text-slate-200 text-sm">
                  {currentInnings.batsmanStats[nonStriker.id].runs}
                </span>
                <span className="text-slate-400">
                  ({currentInnings.batsmanStats[nonStriker.id].ballsFaced} balls, {currentInnings.batsmanStats[nonStriker.id].fours}x4, {currentInnings.batsmanStats[nonStriker.id].sixes}x6)
                </span>
                {currentInnings.batsmanStats[nonStriker.id].dismissalsCount > 0 && (
                  <span className="text-rose-400 font-semibold text-[11px]">
                    {currentInnings.batsmanStats[nonStriker.id].dismissalsCount} out
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bowler Card */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-lg relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>BOWLER (Over {currentOverNumber})</span>
            </span>
            {getCategoryBadge(bowler?.category)}
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-bold text-white truncate">{bowler?.name || 'Select Bowler'}</h3>
            {bowler && currentInnings.bowlerStats[bowler.id] && (
              <div className="text-xs text-slate-300 mt-1 flex items-center space-x-3">
                <span className="font-bold text-emerald-300">
                  {currentInnings.bowlerStats[bowler.id].wickets}w - {currentInnings.bowlerStats[bowler.id].runsConceded}r
                </span>
                <span className="text-slate-400">
                  ({currentInnings.bowlerStats[bowler.id].legalBalls} balls / {currentInnings.bowlerStats[bowler.id].oversBowled} ov)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Controls: Swap Strike & Change Participants & Declare Power Over */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSwapStrike}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
            <span>Swap Strike</span>
          </button>

          <button
            onClick={() => {
              setSelectedNewStrikerId(striker?.id || '');
              setSelectedNewNonStrikerId(nonStriker?.id || '');
              setSelectedNewBowlerId(bowler?.id || '');
              setShowChangePairModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Change Pair / Bowler</span>
          </button>

          {onOpenPlaying8Modal && (
            <button
              onClick={onOpenPlaying8Modal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Playing 8 ({match.lineupSubmitted ? 'Locked' : 'Select'})</span>
            </button>
          )}

          <button
            onClick={handleUndo}
            disabled={isSubmitting || currentInnings.balls.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-800/50 transition disabled:opacity-40"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo Ball</span>
          </button>
        </div>

        {/* Power Over Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <label htmlFor="power-over-select" className="text-slate-400 font-medium">Power Over:</label>
          <select
            id="power-over-select"
            value={currentInnings.powerOverDeclaredNumber || 4}
            onChange={(e) => handleSetPowerOver(Number(e.target.value))}
            className="bg-purple-950/60 border border-purple-700/60 text-purple-200 rounded-lg px-2 py-1 font-bold focus:outline-none"
          >
            {[3, 4, 5, 6, 7, 8].map(ov => (
              <option key={ov} value={ov} className="bg-slate-900 text-white">
                Over {ov} {isSemiOrFinal && ov === 5 ? '(Solo Senior)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Scoring Keypad */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <span>Score Input Pad</span>
            {strikerCategory === 'FEMALE' && (
              <span className="text-pink-400 text-xs normal-case font-semibold bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
                ✨ Female Batter: Runs are doubled!
              </span>
            )}
          </h4>
          <span className="text-xs text-slate-400">
            Ball {currentInnings.currentOverBalls + 1} of Over {currentOverNumber}
          </span>
        </div>

        {/* Run Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Dot Ball */}
          <button
            onClick={() => handleBallClick('DOT')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-xl transition active:scale-95 shadow-md disabled:opacity-50"
          >
            <span>0</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Dot Ball</span>
          </button>

          {/* 1 Run */}
          <button
            onClick={() => handleBallClick('RUN_1')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 font-black text-xl transition active:scale-95 shadow-md disabled:opacity-50"
          >
            <span>1</span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase mt-0.5">
              {getOutcomePreview('RUN_1').runsNote} Runs
            </span>
          </button>

          {/* 2 Runs */}
          <button
            onClick={() => handleBallClick('RUN_2')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 font-black text-xl transition active:scale-95 shadow-md disabled:opacity-50"
          >
            <span>2</span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase mt-0.5">
              {getOutcomePreview('RUN_2').runsNote} Runs
            </span>
          </button>

          {/* 3 Runs */}
          <button
            onClick={() => handleBallClick('RUN_3')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 font-black text-xl transition active:scale-95 shadow-md disabled:opacity-50"
          >
            <span>3</span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase mt-0.5">
              {getOutcomePreview('RUN_3').runsNote} Runs
            </span>
          </button>

          {/* FOUR */}
          <button
            onClick={() => handleBallClick('FOUR')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-600/70 text-blue-300 font-black text-xl transition active:scale-95 shadow-md disabled:opacity-50"
          >
            <span>4</span>
            <span className="text-[10px] text-blue-300 font-black uppercase mt-0.5">
              {getOutcomePreview('FOUR').runsNote} (Four)
            </span>
          </button>

          {/* SIX */}
          <button
            onClick={() => handleBallClick('SIX')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500 text-amber-300 font-black text-xl transition active:scale-95 shadow-md disabled:opacity-50"
          >
            <span>6</span>
            <span className="text-[10px] text-amber-300 font-black uppercase mt-0.5">
              {getOutcomePreview('SIX').runsNote} (Six)
            </span>
          </button>

          {/* Side Net 1D / 2D */}
          <button
            onClick={() => handleBallClick('DECLARATION_1D')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex flex-col items-center justify-center py-4 px-2 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-700/60 text-purple-300 font-black text-lg transition active:scale-95 shadow-md disabled:opacity-50"
          >
            <span>{strikerCategory === 'FEMALE' ? '2D' : '1D'}</span>
            <span className="text-[10px] text-purple-300 font-bold uppercase mt-0.5">
              {getOutcomePreview('DECLARATION_1D').runsNote} (Side Net)
            </span>
          </button>
        </div>

        {/* Extras & Wicket Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {/* WIDE */}
          <button
            onClick={() => handleBallClick('WIDE')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-sm transition active:scale-95 disabled:opacity-50"
          >
            <span>Wide (+1 run)</span>
          </button>

          {/* NO BALL */}
          <button
            onClick={() => handleBallClick('NO_BALL')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-sm transition active:scale-95 disabled:opacity-50"
          >
            <span>No Ball (+1 & Free Hit)</span>
          </button>

          {/* BYE */}
          <button
            onClick={() => handleBallClick('BYE')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-sm transition active:scale-95 disabled:opacity-50"
          >
            <span>Bye (+1 run)</span>
          </button>

          {/* WICKET (-2 runs or -5/-7 runs in Power Over) */}
          <button
            onClick={() => handleBallClick('WICKET')}
            disabled={isSubmitting || currentInnings.isCompleted}
            className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm transition active:scale-95 shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>WICKET {isPowerOver ? '(-5 runs)' : '(-2 runs)'}</span>
          </button>
        </div>
      </div>

      {/* Recent Deliveries Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Balls</span>
          <span className="text-xs text-slate-500">{currentInnings.balls.length} total deliveries</span>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {recentBalls.length === 0 ? (
            <span className="text-xs text-slate-500 italic">No balls bowled yet in this innings.</span>
          ) : (
            recentBalls.map((b) => (
              <div
                key={b.id}
                className={`min-w-9 h-9 rounded-full flex flex-col items-center justify-center font-bold text-xs border shadow-sm ${
                  b.dismissal
                    ? 'bg-rose-600 border-rose-400 text-white'
                    : b.outcomeType === 'SIX'
                    ? 'bg-amber-500 border-amber-300 text-slate-950 font-black'
                    : b.outcomeType === 'FOUR'
                    ? 'bg-blue-600 border-blue-400 text-white font-black'
                    : b.outcomeType === 'WIDE' || b.outcomeType === 'NO_BALL'
                    ? 'bg-amber-900/60 border-amber-600/80 text-amber-300'
                    : b.outcomeType === 'DECLARATION_1D'
                    ? 'bg-purple-800 border-purple-500 text-purple-200'
                    : b.effectiveRuns === 0
                    ? 'bg-slate-800 border-slate-700 text-slate-400'
                    : 'bg-emerald-800 border-emerald-600 text-emerald-100'
                }`}
                title={`${b.commentary} (${b.batsmanName})`}
              >
                <span>
                  {b.dismissal ? 'W' : b.outcomeType === 'WIDE' ? 'WD' : b.outcomeType === 'NO_BALL' ? 'NB' : b.outcomeType === 'DECLARATION_1D' ? '1D' : b.effectiveRuns}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* WICKET MODAL */}
      {showWicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-rose-400 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>Record Dismissal</span>
              </h3>
              <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
                Batters continue batting
              </span>
            </div>

            <div className="text-xs text-slate-300 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <p className="font-semibold text-white">Official KVO Box Cricket Dismissal Rule:</p>
              <p className="mt-1">
                Batters continue batting even after getting out.
                {isPowerOver ? (
                  <span className="text-purple-300 font-bold block mt-1">
                    Power Over: -5 runs deducted (-7 runs if caught by a female player)!
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold block mt-1">
                    Standard Over: -2 runs deducted (-4 runs if caught by a female player: -2 wicket + -2 catch reduction)!
                  </span>
                )}
              </p>
            </div>

            {/* Who was dismissed */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Dismissed Player
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDismissedWho('STRIKER')}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-left transition ${
                    dismissedWho === 'STRIKER'
                      ? 'bg-rose-950 border-rose-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="block text-[10px] text-slate-400">Striker</span>
                  <span className="truncate">{striker?.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDismissedWho('NON_STRIKER')}
                  className={`p-2.5 rounded-lg border text-xs font-bold text-left transition ${
                    dismissedWho === 'NON_STRIKER'
                      ? 'bg-rose-950 border-rose-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="block text-[10px] text-slate-400">Non-Striker</span>
                  <span className="truncate">{nonStriker?.name}</span>
                </button>
              </div>
            </div>

            {/* Dismissal Type */}
            <div>
              <label htmlFor="wicket-type-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Dismissal Type
              </label>
              <select
                id="wicket-type-select"
                value={wicketType}
                onChange={(e) => setWicketType(e.target.value as DismissalType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-semibold focus:outline-none focus:border-rose-500"
              >
                <option value="BOWLED">Bowled</option>
                <option value="CAUGHT">Caught</option>
                <option value="RUN_OUT">Run Out</option>
                <option value="STUMPED">Stumped</option>
                <option value="HIT_WICKET">Hit Wicket</option>
              </select>
            </div>

            {/* Special Female Catch Checkbox */}
            {wicketType === 'CAUGHT' && (
              <label className="flex items-start space-x-3 bg-pink-950/30 border border-pink-500/30 p-3 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCatchByFemale}
                  onChange={(e) => setIsCatchByFemale(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-pink-600 focus:ring-pink-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-pink-300 block">Caught by Female Player?</span>
                  <span className="text-slate-400 text-[11px]">
                    {isPowerOver
                      ? 'Rule: 5 + 2 = 7 runs deducted in Power Over (-7)!'
                      : 'Rule: 2 + 2 = 4 runs deducted (-2 dismissal + -2 female catch reduction)!'}
                  </span>
                </div>
              </label>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowWicketModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitWicket}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
              >
                Confirm Wicket ({isPowerOver ? (isCatchByFemale ? '-7 runs' : '-5 runs') : (isCatchByFemale ? '-4 runs' : '-2 runs')})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PAIR / BOWLER MODAL */}
      {showChangePairModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span>Rotate Batting Pair or Bowler</span>
              </h3>
              <span className="text-xs text-slate-400">Over {currentOverNumber}</span>
            </div>

            <div className="text-xs text-slate-300 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 space-y-1">
              <p>• <strong>Pair Batting Rule:</strong> Each pair bats for 2 overs.</p>
              <p>• <strong>Overs 1 & 2:</strong> Female pair & female bowler mandatory.</p>
              <p>• <strong>Bowling Rule:</strong> Everyone must bowl one over. No consecutive overs.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="new-striker-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Striker ({battingTeam?.name})
                </label>
                <select
                  id="new-striker-select"
                  value={selectedNewStrikerId}
                  onChange={(e) => setSelectedNewStrikerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-semibold focus:outline-none"
                >
                  {eligibleBatters.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.category}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="new-nonstriker-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Non-Striker ({battingTeam?.name})
                </label>
                <select
                  id="new-nonstriker-select"
                  value={selectedNewNonStrikerId}
                  onChange={(e) => setSelectedNewNonStrikerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-semibold focus:outline-none"
                >
                  {eligibleBatters.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.category}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="new-bowler-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Bowler ({bowlingTeam?.name})
                </label>
                <select
                  id="new-bowler-select"
                  value={selectedNewBowlerId}
                  onChange={(e) => setSelectedNewBowlerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-semibold focus:outline-none"
                >
                  {eligibleBowlers.map(p => {
                    const bStat = currentInnings.bowlerStats[p.id];
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.category}] - {bStat ? `${bStat.oversBowled} ov bowled` : '0 ov'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowChangePairModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveParticipants}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
