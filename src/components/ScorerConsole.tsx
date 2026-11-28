'use client';

import React, { useState, useEffect } from 'react';
import { 
  Match, 
  Team, 
  Player, 
  BallRecord,
  BallOutcomeType, 
  DismissalType, 
  PlayerCategory,
  UserRole
} from '@/types/cricket';
import { checkRuleCompliance } from '@/lib/rulesEngine';
import { formatDuration } from '@/lib/timerUtils';
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
  Users,
  History,
  Edit3,
  Trash2,
  Lock,
  X,
  ShieldAlert,
  Clock,
  Award
} from 'lucide-react';

interface ScorerConsoleProps {
  match: Match;
  teams: Team[];
  allMatches?: Match[];
  currentUser?: { loginId: string; name: string; role?: UserRole } | null;
  onRecordBall: (params: any) => Promise<void>;
  onUndoBall: (matchId: string) => Promise<void>;
  onUpdateParticipants: (params: any) => Promise<void>;
  onOpenPlaying8Modal?: () => void;
  onEditBall?: (params: any) => Promise<void>;
  onDeleteBall?: (params: any) => Promise<void>;
  onResetMatch?: (matchId: string) => void;
}

export const ScorerConsole: React.FC<ScorerConsoleProps> = ({
  match,
  teams,
  allMatches = [],
  currentUser,
  onRecordBall,
  onUndoBall,
  onUpdateParticipants,
  onOpenPlaying8Modal,
  onEditBall,
  onDeleteBall,
  onResetMatch,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState<DismissalType>('CAUGHT');
  const [isCatchByFemale, setIsCatchByFemale] = useState(false);
  const [dismissedWho, setDismissedWho] = useState<'STRIKER' | 'NON_STRIKER'>('STRIKER');
  const [fielderId, setFielderId] = useState('');
  const [assistedFielderId, setAssistedFielderId] = useState('');
  const [runOutType, setRunOutType] = useState<'DIRECT' | 'ASSISTED'>('DIRECT');
  
  // No-Ball Modal State (Leg Uplift vs Normal)
  const [showNoBallModal, setShowNoBallModal] = useState(false);
  const [noBallType, setNoBallType] = useState<'NORMAL' | 'LEG_UPLIFT'>('NORMAL');
  const [noBallExtraBatRuns, setNoBallExtraBatRuns] = useState(0);

  // Over History & Ball Editor State
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
  
  const [showChangePairModal, setShowChangePairModal] = useState(false);
  const [selectedNewStrikerId, setSelectedNewStrikerId] = useState('');
  const [selectedNewNonStrikerId, setSelectedNewNonStrikerId] = useState('');
  const [selectedNewBowlerId, setSelectedNewBowlerId] = useState('');

  // Live Timer ticker state
  const [, setTimerTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTimerTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Bye Modal state (multiple runs)
  const [showByeModal, setShowByeModal] = useState(false);
  const [byeRuns, setByeRuns] = useState<number>(1);

  // Power Over Pre-Match Mandate Modal state
  const [showPowerOverModal, setShowPowerOverModal] = useState(false);
  const [selectedPowerOverNum, setSelectedPowerOverNum] = useState<number>(4);

  // Mandatory Over Up Bowler Change Modal state
  const [showOverUpBowlerModal, setShowOverUpBowlerModal] = useState(false);
  const [overUpBowlerId, setOverUpBowlerId] = useState('');

  // Mandatory Pair Change Modal (End of 2 overs)
  const [showMandatoryPairModal, setShowMandatoryPairModal] = useState(false);
  const [mandatoryPairStrikerId, setMandatoryPairStrikerId] = useState('');
  const [mandatoryPairNonStrikerId, setMandatoryPairNonStrikerId] = useState('');
  const [mandatoryPairBowlerId, setMandatoryPairBowlerId] = useState('');

  const currentInnings = match.innings[match.currentInningsIndex];
  const teamA = teams.find(t => t.id === match.teamAId);
  const teamB = teams.find(t => t.id === match.teamBId);
  const battingTeam = teams.find(t => t.id === currentInnings.battingTeamId);
  const bowlingTeam = teams.find(t => t.id === currentInnings.bowlingTeamId);

  // Check if semifinals are locked (relaxed for testing mode)
  const isSemifinalOrFinal = match.stage === 'SEMI_FINAL' || match.stage === 'FINAL';
  const leagueMatches = allMatches.filter(m => m.stage === 'LEAGUE');
  const completedLeagueCount = leagueMatches.filter(m => m.status === 'COMPLETED').length;
  const isLeagueIncomplete = false; // Enabled for testing: allows officiating and scoring semifinals ahead of league completion

  // Free hit status on this ball: Only true if previous delivery was a NORMAL No-Ball (Leg Uplift = NO free hit per rulebook!)
  const lastBall = currentInnings.balls[currentInnings.balls.length - 1];
  const isFreeHitDelivery = !!lastBall && lastBall.outcomeType === 'NO_BALL' && lastBall.noBallType !== 'LEG_UPLIFT';

  // Role permissions:
  // Super Admin ('admin') can edit ANY past ball from ANY over.
  // Scorers ('sagar', 'bhavin') have full access to current match scoring, but can ONLY edit the current active over.
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
  const isOver5SemiFinal = isSemiOrFinal && currentOverNumber === 5;

  // Senior Citizen Players for Over 5 Auto-Handle in Semi/Final
  const seniorBatter = (eligibleBatters.find(p => p.category === 'SENIOR')) || battingTeam?.players.find(p => p.category === 'SENIOR');
  const seniorBowler = (eligibleBowlers.find(p => p.category === 'SENIOR')) || bowlingTeam?.players.find(p => p.category === 'SENIOR');

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

  // Auto-set Over 5 Senior Bowler and Solo Senior Batter in Semi/Finals
  useEffect(() => {
    if (isOver5SemiFinal && !currentInnings.isCompleted && seniorBatter && seniorBowler) {
      if (currentInnings.currentBowlerId !== seniorBowler.id || currentInnings.currentPair.strikerId !== seniorBatter.id) {
        onUpdateParticipants({
          matchId: match.id,
          strikerId: seniorBatter.id,
          nonStrikerId: seniorBatter.id,
          bowlerId: seniorBowler.id,
        }).catch(() => {});
      }
    }
  }, [isOver5SemiFinal, currentInnings.currentBowlerId, currentInnings.currentPair.strikerId, seniorBatter?.id, seniorBowler?.id, currentInnings.isCompleted, match.id]);

  // Bowler past overs tracking (Rule 10: 1 over per bowler max)
  const bowledBowlerIds = new Set<string>();
  const bowlerOversMap: Record<string, number[]> = {};
  for (const b of currentInnings.balls) {
    if (b.overNumber < currentOverNumber && b.bowlerId) {
      bowledBowlerIds.add(b.bowlerId);
      if (!bowlerOversMap[b.bowlerId]) bowlerOversMap[b.bowlerId] = [];
      if (!bowlerOversMap[b.bowlerId].includes(b.overNumber)) {
        bowlerOversMap[b.bowlerId].push(b.overNumber);
      }
    }
  }

  // Previous over info (Rule 7)
  const prevOverNumber = currentOverNumber - 1;
  const prevOverBalls = currentInnings.balls.filter(b => b.overNumber === prevOverNumber);
  const prevBowlerId = prevOverBalls.length > 0 ? prevOverBalls[prevOverBalls.length - 1].bowlerId : null;
  const prevBowler = bowlingTeam?.players.find(p => p.id === prevBowlerId);

  // Current over balls & statistics (Rule 7)
  const currentOverBallsList = currentInnings.balls.filter(b => b.overNumber === currentOverNumber);
  const currentOverRuns = currentOverBallsList.reduce((sum, b) => sum + b.effectiveRuns, 0);
  const currentOverWickets = currentOverBallsList.filter(b => !!b.dismissal).length;

  const prevOverRuns = prevOverBalls.reduce((sum, b) => sum + b.effectiveRuns, 0);
  const prevOverWickets = prevOverBalls.filter(b => !!b.dismissal).length;

  // Over boundary checks (Rule 3)
  const isOverBoundary = currentInnings.completedOvers > 0 && currentInnings.currentOverBalls === 0;

  // Check if current bowler needs to change (must not be same as previous bowler, and must not have bowled before)
  // In Semi/Final Over 5, bowler is auto-handled to Senior Bowler, so do not pop up generic over-up modal!
  const bowlerHasAlreadyBowled = !!currentInnings.currentBowlerId && bowledBowlerIds.has(currentInnings.currentBowlerId);
  const bowlerIsSameAsPrev = !!currentInnings.currentBowlerId && currentInnings.currentBowlerId === prevBowlerId;
  const needsBowlerChange = isOverBoundary && !isOver5SemiFinal && (!currentInnings.currentBowlerId || bowlerHasAlreadyBowled || bowlerIsSameAsPrev);

  // Batting pairs cycle check:
  // In League: Overs 1-2 (Pair 1), 3-4 (Pair 2), 5-6 (Pair 3), 7-8 (Pair 4) -> boundaries at 2, 4, 6 overs.
  // In Semi/Finals: Overs 1-2 (Pair 1), 3-4 (Pair 2), Over 5 (Senior Solo), Overs 6-7 (Pair 3), Overs 8-9 (Pair 4)
  // -> boundaries at completedOvers: 2, 5 (after senior solo finishes), and 7.
  const isPairBoundary = isSemiOrFinal
    ? ((currentInnings.completedOvers === 2 || currentInnings.completedOvers === 5 || currentInnings.completedOvers === 7) && currentInnings.currentOverBalls === 0)
    : ((currentInnings.completedOvers === 2 || currentInnings.completedOvers === 4 || currentInnings.completedOvers === 6) && currentInnings.currentOverBalls === 0);
  
  // Find batters who batted in preceding overs
  const prevOversToCheck = (isSemiOrFinal && currentInnings.completedOvers === 5)
    ? [3, 4, 5]
    : [currentInnings.completedOvers - 1, currentInnings.completedOvers];
  const prevOversBalls = currentInnings.balls.filter(b => prevOversToCheck.includes(b.overNumber));
  const prevPairBatterIds = new Set<string>();
  for (const b of prevOversBalls) {
    if (b.batsmanId) prevPairBatterIds.add(b.batsmanId);
    if (b.nonStrikerId) prevPairBatterIds.add(b.nonStrikerId);
  }
  const needsPairChange = isPairBoundary && !isOver5SemiFinal && (
    prevPairBatterIds.has(currentInnings.currentPair.strikerId) ||
    prevPairBatterIds.has(currentInnings.currentPair.nonStrikerId)
  );

  // Check Power Over declaration before ball 1 (Rule 1)
  const needsPowerOverDeclaration = currentInnings.balls.length === 0 && !currentInnings.powerOverDeclaredNumber && !currentInnings.powerOverOptedOut;

  // Female mandate in Overs 1 & 2 (Rule 5)
  const isOver1Or2 = currentOverNumber <= 2;
  const currentPairHasFemale = striker?.category === 'FEMALE' || nonStriker?.category === 'FEMALE';

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

    // Semi/Final Over 5 Auto-Handle: Over 5 must be bowled by Senior and faced solo by opposing Senior
    if (isOver5SemiFinal && seniorBatter && seniorBowler) {
      if (currentInnings.currentBowlerId !== seniorBowler.id || currentInnings.currentPair.strikerId !== seniorBatter.id) {
        await onUpdateParticipants({
          matchId: match.id,
          strikerId: seniorBatter.id,
          nonStrikerId: seniorBatter.id,
          bowlerId: seniorBowler.id,
        });
      }
    }

    // Rule 1: Mandate Power Over declaration before ball 1 of the innings
    if (needsPowerOverDeclaration) {
      setShowPowerOverModal(true);
      return;
    }

    // Rule 4: Mandate Batsman Change after 2 overs (Overs 2, 4, 6 completed)
    if (needsPairChange) {
      setMandatoryPairStrikerId('');
      setMandatoryPairNonStrikerId('');
      setMandatoryPairBowlerId('');
      setShowMandatoryPairModal(true);
      return;
    }

    // Rule 3: Mandate Bowler Change at over boundary
    if (needsBowlerChange) {
      setOverUpBowlerId('');
      setShowOverUpBowlerModal(true);
      return;
    }

    // Rule 5: Mandate Female batter in Overs 1 & 2
    if (isOver1Or2 && !currentPairHasFemale) {
      alert("⚠️ Mandatory Female Rule: Overs 1 & 2 must include a Female batter in the batting pair. Please change the pair before scoring.");
      setSelectedNewStrikerId(striker?.id || '');
      setSelectedNewNonStrikerId(nonStriker?.id || '');
      setSelectedNewBowlerId(bowler?.id || '');
      setShowChangePairModal(true);
      return;
    }

    // Rule 2: Bye modal with multiple runs option
    if (outcomeType === 'BYE') {
      setByeRuns(1);
      setShowByeModal(true);
      return;
    }

    if (outcomeType === 'WICKET') {
      setShowWicketModal(true);
      return;
    }

    if (outcomeType === 'NO_BALL') {
      setNoBallType('NORMAL');
      setNoBallExtraBatRuns(0);
      setShowNoBallModal(true);
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

  const submitBye = async () => {
    try {
      setIsSubmitting(true);
      await onRecordBall({
        matchId: match.id,
        outcomeType: 'BYE',
        byeRuns,
      });
      setShowByeModal(false);
      setByeRuns(1);
    } catch (err: any) {
      alert(`Error recording bye: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPowerOverDeclaration = async (overNumber?: number, optOut?: boolean) => {
    try {
      setIsSubmitting(true);
      await onUpdateParticipants({
        matchId: match.id,
        powerOverDeclaredNumber: optOut ? undefined : (overNumber || selectedPowerOverNum),
        powerOverOptedOut: !!optOut,
      });
      setShowPowerOverModal(false);
    } catch (err: any) {
      alert(`Error setting power over: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitMandatoryBowler = async () => {
    if (!overUpBowlerId) {
      alert('Please select a bowler to continue.');
      return;
    }
    if (bowledBowlerIds.has(overUpBowlerId)) {
      alert('Rule Violation: This player has already bowled an over in this innings. Each bowler is limited to 1 over maximum.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onUpdateParticipants({
        matchId: match.id,
        bowlerId: overUpBowlerId,
      });
      setShowOverUpBowlerModal(false);
    } catch (err: any) {
      alert(`Error setting bowler: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitMandatoryPair = async () => {
    if (!mandatoryPairStrikerId || !mandatoryPairNonStrikerId) {
      alert('Please select both Striker and Non-Striker.');
      return;
    }
    if (mandatoryPairStrikerId === mandatoryPairNonStrikerId) {
      alert('Striker and Non-Striker cannot be the same player.');
      return;
    }
    if (mandatoryPairBowlerId && bowledBowlerIds.has(mandatoryPairBowlerId)) {
      alert('Rule Violation: Selected bowler has already bowled an over in this innings. Each player can only bowl 1 over.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onUpdateParticipants({
        matchId: match.id,
        strikerId: mandatoryPairStrikerId,
        nonStrikerId: mandatoryPairNonStrikerId,
        bowlerId: mandatoryPairBowlerId || undefined,
      });
      setShowMandatoryPairModal(false);
    } catch (err: any) {
      alert(`Error updating pair: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNoBall = async () => {
    try {
      setIsSubmitting(true);
      await onRecordBall({
        matchId: match.id,
        outcomeType: 'NO_BALL',
        noBallType,
        extraBatRunsOnNoBall: noBallExtraBatRuns,
      });
      setShowNoBallModal(false);
      setNoBallType('NORMAL');
      setNoBallExtraBatRuns(0);
    } catch (err: any) {
      alert(`Error recording no-ball: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditBall = (ball: BallRecord, innIdx: number = selectedInningsFilter) => {
    if (isScorer && !isCurrentActiveOver(ball.overNumber, innIdx)) {
      alert(`🔒 Access Restricted: As Scorer (${currentUser?.name || currentUser?.loginId || 'Official'}), you can only edit deliveries in the current active over (Over ${currentInnings.completedOvers + 1}). Past overs require Super Admin credentials.`);
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
    if (!confirm('Are you sure you want to delete this ball? The scorecard and all player stats will be recalculated automatically.')) return;
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
        fielderId: (wicketType === 'CAUGHT' || wicketType === 'RUN_OUT' || wicketType === 'STUMPED') ? fielderId : undefined,
        assistedFielderId: (wicketType === 'RUN_OUT' && runOutType === 'ASSISTED') ? assistedFielderId : undefined,
        runOutType: wicketType === 'RUN_OUT' ? runOutType : undefined,
      });
      setShowWicketModal(false);
      setIsCatchByFemale(false);
      setFielderId('');
      setAssistedFielderId('');
      setRunOutType('DIRECT');
    } catch (err: any) {
      alert(`Error recording wicket: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwapStrike = async () => {
    if (isOver5SemiFinal) {
      alert("⚠️ Semi/Final Rule: Over 5 is faced solo by the opposing Senior Citizen player. Strike cannot be swapped.");
      return;
    }
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
    const sId = selectedNewStrikerId || striker?.id;
    const nsId = selectedNewNonStrikerId || nonStriker?.id;
    const bId = selectedNewBowlerId || bowler?.id;

    if (sId && nsId && sId === nsId) {
      alert('Striker and Non-Striker cannot be the same player.');
      return;
    }

    // Rule 5: Check female mandate in Overs 1 & 2
    if (currentOverNumber <= 2) {
      const sPlayer = battingTeam?.players.find(p => p.id === sId);
      const nsPlayer = battingTeam?.players.find(p => p.id === nsId);
      const hasFemale = sPlayer?.category === 'FEMALE' || nsPlayer?.category === 'FEMALE';
      if (!hasFemale) {
        alert('⚠️ Rule Violation: Overs 1 & 2 must include a Female batter in the batting pair. Scorers cannot change batting pair to all-male.');
        return;
      }
    }

    // Rule 10: Check bowler limit (1 over per bowler max)
    if (bId && bId !== bowler?.id && bowledBowlerIds.has(bId)) {
      alert('⚠️ Rule Violation: This player has already bowled an over in this innings. Each player is limited to 1 over maximum.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdateParticipants({
        matchId: match.id,
        strikerId: sId,
        nonStrikerId: nsId,
        bowlerId: bId,
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

        <div className={`flex flex-col gap-4 ${isPowerOver ? 'mt-4' : ''}`}>
          {/* Prominent Matchup: Who is Playing With Whom */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-3 sm:pb-4">
            <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-2">
              {/* Team A */}
              <div className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl border min-w-0 ${
                currentInnings.battingTeamId === teamA?.id 
                  ? 'bg-slate-800 border-amber-500/60 ring-2 ring-amber-500/20' 
                  : 'bg-slate-950/80 border-slate-800'
              }`}>
                <span className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20 shrink-0" style={{ backgroundColor: teamA?.color || '#3b82f6' }} />
                <div className="min-w-0">
                  <span className="text-sm sm:text-lg font-black text-white block leading-tight truncate">{teamA?.name || 'Team A'}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    currentInnings.battingTeamId === teamA?.id ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}>
                    {currentInnings.battingTeamId === teamA?.id ? '🏏 Currently Batting' : '⚾ Currently Bowling/Fielding'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center py-0.5 sm:py-0">
                <span className="text-amber-400 font-black text-xs sm:text-sm italic px-2 py-0.5 bg-slate-950 rounded-full border border-slate-800">VS</span>
              </div>

              {/* Team B */}
              <div className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl border min-w-0 ${
                currentInnings.battingTeamId === teamB?.id 
                  ? 'bg-slate-800 border-amber-500/60 ring-2 ring-amber-500/20' 
                  : 'bg-slate-950/80 border-slate-800'
              }`}>
                <span className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20 shrink-0" style={{ backgroundColor: teamB?.color || '#ef4444' }} />
                <div className="min-w-0">
                  <span className="text-sm sm:text-lg font-black text-white block leading-tight truncate">{teamB?.name || 'Team B'}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    currentInnings.battingTeamId === teamB?.id ? 'text-amber-400 font-bold' : 'text-slate-400'
                  }`}>
                    {currentInnings.battingTeamId === teamB?.id ? '🏏 Currently Batting' : '⚾ Currently Bowling/Fielding'}
                  </span>
                </div>
              </div>
            </div>

            {/* Toss Info & Venue */}
            <div className="w-full lg:w-auto text-xs text-slate-300 bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl space-y-0.5">
              <div>
                <span className="text-slate-400">Toss: </span>
                {match.tossWinnerId ? (
                  <strong className="text-amber-300">
                    {teams.find(t => t.id === match.tossWinnerId)?.name} elected to {match.tossDecision}
                  </strong>
                ) : (
                  <span className="text-slate-500 italic">Toss pending</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                📍 {match.boxVenue || 'Box Arena'} • {match.stage === 'LEAGUE' ? 'League Match' : match.stage.replace('_', ' ')} • Innings {match.currentInningsIndex + 1}/2
              </div>
            </div>
          </div>

          {/* Live Timer Strip (Rule 6: Match and Innings Duration) */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Match Duration:</span>
                <span className="font-mono font-bold text-amber-300">
                  {formatDuration(match.startedAt, match.completedAt)}
                </span>
              </div>
              <div className="h-3 w-[1px] bg-slate-800 hidden sm:block" />
              <div className="flex items-center space-x-1.5 text-slate-300">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Innings 1:</span>
                <span className="font-mono font-bold text-white">
                  {formatDuration(match.innings[0]?.startedAt, match.innings[0]?.completedAt)}
                </span>
              </div>
              {match.innings[1]?.startedAt && (
                <>
                  <div className="h-3 w-[1px] bg-slate-800 hidden sm:block" />
                  <div className="flex items-center space-x-1.5 text-slate-300">
                    <span className="text-slate-400 font-semibold uppercase text-[10px]">Innings 2:</span>
                    <span className="font-mono font-bold text-white">
                      {formatDuration(match.innings[1]?.startedAt, match.innings[1]?.completedAt)}
                    </span>
                  </div>
                </>
              )}
            </div>
            {match.status === 'LIVE' && (
              <span className="flex items-center space-x-1 text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                <span>LIVE TIMER</span>
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3">
              {battingTeam?.logoUrl && (
                <img
                  src={battingTeam.logoUrl}
                  alt={battingTeam.name}
                  className="w-10 h-10 object-contain rounded-xl p-0.5 bg-slate-950 border border-slate-800 shadow-md shrink-0"
                />
              )}
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Batting Innings</span>
                <h3 className="text-xl sm:text-3xl font-black text-white mt-0.5">{battingTeam?.name}</h3>
              </div>
            </div>

            {/* Current Score Display */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between sm:justify-start space-x-4 sm:space-x-6 shadow-inner w-full sm:w-auto">
              <div className="text-left sm:text-right">
                <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-semibold">Total Score</div>
                <div className="text-2xl sm:text-4xl font-black text-amber-400">
                  {currentInnings.totalRuns}
                  <span className="text-base text-rose-400 font-bold"> / {currentInnings.totalWickets}w</span>
                </div>
              </div>
              <div className="h-9 w-[1px] bg-slate-800" />
              <div>
                <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-semibold">Overs</div>
                <div className="text-xl sm:text-3xl font-black text-white">
                  {currentInnings.completedOvers}.{currentInnings.currentOverBalls}
                  <span className="text-xs text-slate-400 font-normal"> / {match.totalOvers} ov</span>
                </div>
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
        <div className={`bg-slate-900 border rounded-xl p-4 shadow-lg relative ${isOver5SemiFinal ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-700/80'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {isOver5SemiFinal ? 'SOLO BATSMAN' : 'NON-STRIKER'}
            </span>
            {isOver5SemiFinal ? (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                Solo Over 5
              </span>
            ) : (
              getCategoryBadge(nonStriker?.category)
            )}
          </div>
          <div className="mt-2">
            <h3 className="text-lg font-bold text-white truncate">
              {isOver5SemiFinal ? 'Facing Solo (No Non-Striker)' : (nonStriker?.name || 'Select Non-Striker')}
            </h3>
            {isOver5SemiFinal ? (
              <p className="text-xs text-amber-300/80 mt-1">
                Senior Citizen faces all 6 deliveries. No strike rotation active.
              </p>
            ) : (
              nonStriker && currentInnings.batsmanStats[nonStriker.id] && (
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
              )
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

          {/* Over Log & Edit Button */}
          <button
            onClick={() => {
              setSelectedOverFilter(currentOverNumber);
              setShowOverHistoryModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition active:scale-95 shadow-sm"
            title="Inspect or edit any ball in any specific over"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>Over Log & Edit</span>
          </button>

          {/* Reset Match Button (Individual match reset) */}
          {onResetMatch && (
            <button
              onClick={() => onResetMatch(match.id)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 transition active:scale-95 shadow-sm"
              title="Reset this match back to 0 (requires admin password)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Match</span>
            </button>
          )}
        </div>

        {/* Power Over Controls (Rule 1: Pre-match mandate & locking after ball 1) */}
        <div className="flex items-center space-x-2 text-xs">
          {currentInnings.balls.length > 0 ? (
            isSuperAdmin ? (
              <div className="flex items-center space-x-1.5 bg-purple-950/80 border border-purple-500/70 rounded-xl px-2.5 py-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold text-amber-300">Admin Override:</span>
                <select
                  value={currentInnings.powerOverOptedOut ? 'OPT_OUT' : (currentInnings.powerOverDeclaredNumber || 4)}
                  onChange={(e) => {
                    if (e.target.value === 'OPT_OUT') {
                      submitPowerOverDeclaration(undefined, true);
                    } else {
                      submitPowerOverDeclaration(Number(e.target.value), false);
                    }
                  }}
                  className="bg-slate-900 border border-purple-700 text-purple-200 rounded-lg px-2 py-0.5 font-bold focus:outline-none text-xs"
                >
                  <option value="OPT_OUT">No Power Over (Opt Out)</option>
                  {[3, 4, 5, 6, 7, 8].map(ov => (
                    <option key={ov} value={ov}>
                      Over {ov} {isSemiOrFinal && ov === 5 ? '(Solo Senior)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-950/50 border border-purple-800/60 text-purple-300 text-xs font-semibold shadow-inner">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  Power Over:{' '}
                  <strong className="text-white">
                    {currentInnings.powerOverOptedOut 
                      ? 'None (Opted Out)' 
                      : currentInnings.powerOverDeclaredNumber 
                      ? `Over ${currentInnings.powerOverDeclaredNumber}` 
                      : 'None'}
                  </strong>
                </span>
                <span className="text-[10px] bg-purple-900/80 text-purple-200 px-1.5 py-0.5 rounded font-black border border-purple-700/50">
                  LOCKED
                </span>
              </div>
            )
          ) : (
            <button
              onClick={() => setShowPowerOverModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md shadow-purple-600/30 transition active:scale-95 animate-pulse"
              title="Declare Power Over before 1st ball is bowled"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>
                {currentInnings.powerOverOptedOut
                  ? '⚡ Power Over: Opted Out'
                  : currentInnings.powerOverDeclaredNumber
                  ? `⚡ Power Over: Over ${currentInnings.powerOverDeclaredNumber}`
                  : '⚡ Declare Power Over (Mandatory)'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Free Hit Delivery Alert Banner */}
      {isFreeHitDelivery && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider text-center shadow-lg animate-pulse flex items-center justify-center space-x-2">
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>⚡ FREE HIT ACTIVE ON THIS BALL! (Batter cannot be out except Run-Out) ⚡</span>
          <Zap className="w-4 h-4 fill-slate-950" />
        </div>
      )}

      {/* Semifinals Gating Warning Banner */}
      {isLeagueIncomplete && (
        <div className="bg-rose-950/80 border-2 border-rose-500/80 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white">Playoff Match Officiating Locked</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">
            Per official tournament regulations, all 9 league matches must be completed before starting or scoring Semifinals. Currently, only <strong>{completedLeagueCount} of {leagueMatches.length}</strong> league matches are completed.
          </p>
          <div className="pt-1 text-xs text-slate-400 font-medium">
            Please finish the remaining league matches in the Schedule tab first.
          </div>
        </div>
      )}

      {/* Semi/Final Over 5 Senior Solo Clash Banner */}
      {isOver5SemiFinal && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center space-x-2 text-amber-400 font-black text-xs sm:text-sm uppercase tracking-wider">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Semi/Final Rule: Over 5 Senior Citizen Solo Clash (Auto-Handled)</span>
            </span>
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow">
              Auto Handled
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Per official tournament regulations: <strong>Over 5 must be bowled by the Senior Citizen player</strong>, and <strong>must be faced solo by the opposing Senior Citizen player</strong>. Strike does not rotate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/40 space-y-0.5">
              <div className="text-[10px] text-amber-400 font-black uppercase flex items-center space-x-1">
                <span>🏏 Solo Batsman ({battingTeam?.shortName || battingTeam?.name})</span>
              </div>
              <div className="text-white font-bold text-sm truncate">{seniorBatter?.name || 'Senior Citizen'}</div>
              <div className="text-[11px] text-slate-400">Faces all 6 deliveries • Boundary bonus: 4+1=5, 6+2=8</div>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/40 space-y-0.5">
              <div className="text-[10px] text-emerald-400 font-black uppercase flex items-center space-x-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>⚾ Mandatory Bowler ({bowlingTeam?.shortName || bowlingTeam?.name})</span>
              </div>
              <div className="text-white font-bold text-sm truncate">{seniorBowler?.name || 'Senior Citizen'}</div>
              <div className="text-[11px] text-slate-400">Over 5 designated bowler • Max 1 over limit</div>
            </div>
          </div>
        </div>
      )}

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
            disabled={isSubmitting || currentInnings.isCompleted || isLeagueIncomplete}
            className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-sm transition active:scale-95 disabled:opacity-50"
          >
            <span>No Ball (Overstep / Leg Uplift)</span>
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

      {/* Over & Previous Over Separate Breakup (Rule 7) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center space-x-1.5">
              <History className="w-4 h-4 text-amber-400" />
              <span>Over Deliveries Breakdown</span>
            </span>
            <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              💡 Tap any ball to edit
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setSelectedInningsFilter(match.currentInningsIndex);
                setSelectedOverFilter(currentOverNumber);
                setShowOverHistoryModal(true);
              }}
              className="text-amber-400 hover:text-amber-300 text-xs font-bold underline flex items-center space-x-1"
            >
              <History className="w-3.5 h-3.5" />
              <span>Browse All Overs ({match.totalOvers} ov)</span>
            </button>
            <span className="text-xs text-slate-500">{currentInnings.balls.length} deliveries</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Current Over Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                  Current Over (Over {currentOverNumber})
                </span>
                {isPowerOver && (
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-500/30">
                    ⚡ Power Over
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-300">
                Bowler: <b className="text-white">{bowler?.name || 'Unassigned'}</b>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Progress: <b>{currentInnings.currentOverBalls}/6 balls</b></span>
              <span className="font-semibold text-emerald-400">
                Score: +{currentOverRuns} runs • {currentOverWickets} wkts
              </span>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-1 visual-scrollbar min-h-10">
              {currentOverBallsList.length === 0 ? (
                <span className="text-xs text-slate-500 italic py-1">No balls bowled yet in Over {currentOverNumber}.</span>
              ) : (
                currentOverBallsList.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleOpenEditBall(b, match.currentInningsIndex)}
                    className={`min-w-9 h-9 rounded-full flex flex-col items-center justify-center font-bold text-xs border shadow-sm transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                      b.dismissal
                        ? 'bg-rose-600 border-rose-400 text-white ring-1 ring-rose-400/50'
                        : b.outcomeType === 'SIX'
                        ? 'bg-amber-500 border-amber-300 text-slate-950 font-black ring-1 ring-amber-300/50'
                        : b.outcomeType === 'FOUR'
                        ? 'bg-blue-600 border-blue-400 text-white font-black ring-1 ring-blue-400/50'
                        : b.outcomeType === 'WIDE' || b.outcomeType === 'NO_BALL'
                        ? 'bg-amber-900/60 border-amber-600/80 text-amber-300'
                        : b.outcomeType === 'DECLARATION_1D'
                        ? 'bg-purple-800 border-purple-500 text-purple-200'
                        : b.effectiveRuns === 0
                        ? 'bg-slate-800 border-slate-700 text-slate-400'
                        : 'bg-emerald-800 border-emerald-600 text-emerald-100 ring-1 ring-emerald-400/30'
                    }`}
                    title={`Click to edit ball ${b.overNumber}.${b.ballNumber}: ${b.commentary} (${b.batsmanName})`}
                  >
                    <span>
                      {b.dismissal ? 'W' : b.outcomeType === 'WIDE' ? 'WD' : b.outcomeType === 'NO_BALL' ? 'NB' : b.outcomeType === 'DECLARATION_1D' ? '1D' : b.effectiveRuns}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Previous Over Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                Previous Over {prevOverNumber > 0 ? `(Over ${prevOverNumber})` : ''}
              </span>
              {prevOverNumber > 0 && (
                <span className="text-xs text-slate-300">
                  Bowler: <b className="text-white">{prevBowler?.name || 'Previous Bowler'}</b>
                </span>
              )}
            </div>

            {prevOverNumber > 0 ? (
              <>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Completed: <b>6/6 balls</b></span>
                  <span className="font-semibold text-slate-300">
                    Finished: +{prevOverRuns} runs • {prevOverWickets} wkts
                  </span>
                </div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 visual-scrollbar min-h-10">
                  {prevOverBalls.map((b) => {
                    const isLocked = isScorer && !isCurrentActiveOver(b.overNumber, match.currentInningsIndex);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleOpenEditBall(b, match.currentInningsIndex)}
                        className={`min-w-9 h-9 rounded-full flex flex-col items-center justify-center font-bold text-xs border shadow-sm transition-all relative ${
                          isLocked ? 'cursor-pointer hover:scale-105 opacity-85' : 'cursor-pointer hover:scale-110 active:scale-95'
                        } ${
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
                        title={isLocked ? `🔒 Ball ${b.overNumber}.${b.ballNumber}: Past Over (Super Admin to edit)` : `Click to edit ball ${b.overNumber}.${b.ballNumber}`}
                      >
                        <span className="relative">
                          {b.dismissal ? 'W' : b.outcomeType === 'WIDE' ? 'WD' : b.outcomeType === 'NO_BALL' ? 'NB' : b.outcomeType === 'DECLARATION_1D' ? '1D' : b.effectiveRuns}
                          {isLocked && <span className="absolute -top-2.5 -right-2 text-[8px]">🔒</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-5 text-center text-xs text-slate-500 italic">
                Innings has just begun — previous over breakdown will appear once Over 1 is completed.
              </div>
            )}
          </div>
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

            {/* Special Female Catch Checkbox & Fielder attribution */}
            {wicketType === 'CAUGHT' && (
              <div className="space-y-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Caught By Fielder (+5 Fielding Pts)
                  </label>
                  <select
                    value={fielderId}
                    onChange={(e) => {
                      const fId = e.target.value;
                      setFielderId(fId);
                      const chosen = bowlingTeam?.players.find(p => p.id === fId);
                      if (chosen?.category === 'FEMALE') {
                        setIsCatchByFemale(true);
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Fielder who took the catch --</option>
                    {bowlingTeam?.players.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start space-x-3 bg-pink-950/30 border border-pink-500/30 p-2.5 rounded-lg cursor-pointer">
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
              </div>
            )}

            {/* Run Out Fielders attribution */}
            {wicketType === 'RUN_OUT' && (
              <div className="space-y-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                    Run Out Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRunOutType('DIRECT')}
                      className={`p-2 rounded-lg border text-xs font-bold text-center transition ${
                        runOutType === 'DIRECT'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span>Direct Hit (+8 pts)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRunOutType('ASSISTED')}
                      className={`p-2 rounded-lg border text-xs font-bold text-center transition ${
                        runOutType === 'ASSISTED'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span>Assisted (+4 pts each)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    {runOutType === 'DIRECT' ? 'Fielder (Direct Hit +8 pts)' : 'Primary Fielder (Thrower +4 pts)'}
                  </label>
                  <select
                    value={fielderId}
                    onChange={(e) => setFielderId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Fielder --</option>
                    {bowlingTeam?.players.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                {runOutType === 'ASSISTED' && (
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                      Secondary Fielder (At Stumps / Keeper / Bowler +4 pts)
                    </label>
                    <select
                      value={assistedFielderId}
                      onChange={(e) => setAssistedFielderId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Select Secondary Fielder --</option>
                      {bowlingTeam?.players.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Stumped Attribution */}
            {wicketType === 'STUMPED' && (
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Wicketkeeper / Fielder who Stumped (+5 Fielding Pts)
                </label>
                <select
                  value={fielderId}
                  onChange={(e) => setFielderId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Select Keeper / Fielder --</option>
                  {bowlingTeam?.players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Bowled / Hit Wicket note */}
            {(wicketType === 'BOWLED' || wicketType === 'HIT_WICKET') && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-300">
                ⚡ Credit awarded to bowler <b>{bowler?.name}</b> (+10 Bowling Points).
              </div>
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
              <p>• <strong>Overs 1 & 2:</strong> Female pair & female bowler mandatory (cannot be changed away from female).</p>
              <p>• <strong>Bowling Rule:</strong> Each player can only bowl 1 over max (no consecutive or duplicate overs).</p>
            </div>

            {currentOverNumber <= 2 && (
              <div className="bg-pink-950/40 border border-pink-500/40 p-2.5 rounded-xl text-xs text-pink-300 font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-pink-400 shrink-0" />
                <span>Mandatory Female Rule (Overs 1 & 2): Either Striker or Non-Striker MUST be a Female player.</span>
              </div>
            )}

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
                    const hasBowled = bowledBowlerIds.has(p.id);
                    const isPrev = isOverBoundary && p.id === prevBowlerId;
                    const isDisabled = hasBowled || isPrev;
                    return (
                      <option key={p.id} value={p.id} disabled={isDisabled}>
                        {p.name} [{p.category}] - {hasBowled ? `(Already Bowled Over ${bowlerOversMap[p.id]?.join(',') || ''} - 1 Over Limit)` : isPrev ? '(Just Bowled Previous Over)' : bStat ? `${bStat.oversBowled} ov bowled` : '0 ov'}
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

      {/* NO-BALL TYPE MODAL (Overstep vs Leg Uplift) */}
      {showNoBallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Record No-Ball Infringement</span>
              </h3>
              <button onClick={() => setShowNoBallModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Select the infringement reason per official KVO tournament rules:
            </div>

            {/* Infringement Type Choice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNoBallType('NORMAL')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  noBallType === 'NORMAL'
                    ? 'bg-amber-950/60 border-amber-500 text-white ring-2 ring-amber-500/30'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-black text-amber-300 flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Normal / Overstep</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  +1 Run penalty + <strong>FREE HIT</strong> awarded on next ball.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNoBallType('LEG_UPLIFT')}
                className={`p-3.5 rounded-xl border text-left transition ${
                  noBallType === 'LEG_UPLIFT'
                    ? 'bg-orange-950/60 border-orange-500 text-white ring-2 ring-orange-500/30'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-black text-orange-400 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Leg Uplift / Foot Lift</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                  +1 Run penalty. <strong>NO Free Hit</strong> per official rulebook.
                </div>
              </button>
            </div>

            {/* Extra Bat Runs on No-Ball */}
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Extra Runs Hit Off Bat (if any)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 4, 6].map(runs => (
                  <button
                    key={runs}
                    type="button"
                    onClick={() => setNoBallExtraBatRuns(runs)}
                    className={`py-2 rounded-lg text-xs font-bold border transition ${
                      noBallExtraBatRuns === runs
                        ? 'bg-amber-500 border-amber-400 text-slate-950'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {runs === 0 ? '0' : `+${runs}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNoBallModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNoBall}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
              >
                Confirm No Ball ({noBallType === 'LEG_UPLIFT' ? 'No Free Hit' : 'Free Hit Next'})
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* BYE MODAL (Rule 2: Option to add multiple runs) */}
      {showByeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Record Bye Runs</span>
              </h3>
              <button onClick={() => setShowByeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Select the number of bye runs taken by the batting pair on this delivery:
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {[1, 2, 3, 4].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setByeRuns(r)}
                  className={`py-3.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    byeRuns === r
                      ? 'bg-amber-500 border-amber-400 text-slate-950 font-black ring-2 ring-amber-500/30'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 font-bold'
                  }`}
                >
                  <span className="text-lg font-black">{r}</span>
                  <span className="text-[10px] uppercase opacity-80 font-bold">
                    {r === 1 ? 'Single' : r === 4 ? 'Boundary' : 'Runs'}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowByeModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitBye}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
              >
                Confirm Bye (+{byeRuns} runs)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POWER OVER DECLARATION MODAL (Rule 1: Pre-match mandate before ball 1) */}
      {showPowerOverModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-purple-500/70 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                  <Zap className="w-5 h-5 fill-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Power Over Declaration</h3>
                  <span className="text-[11px] text-purple-300 font-semibold block">Mandatory Before Ball 1</span>
                </div>
              </div>
              <button onClick={() => setShowPowerOverModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200 space-y-1.5">
              <p className="font-bold text-white flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Official Tournament Rule:</span>
              </p>
              <p>
                Each batting team must declare their chosen Power Over before the innings first ball is bowled.
              </p>
              <p className="text-amber-300 font-semibold">
                🔒 Once the 1st ball is bowled, this selection will be LOCKED for Scorers (only Super Admin can modify).
              </p>
              <p className="text-slate-300">
                If not declared now, the innings will proceed with <strong>NO Power Over</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Power Over (Batting Team: {battingTeam?.name})
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5, 6, 7, 8].map((ov) => {
                  const isRestrictedInSemi = isSemiOrFinal && ov === 5;
                  return (
                    <button
                      key={ov}
                      type="button"
                      disabled={isRestrictedInSemi}
                      onClick={() => !isRestrictedInSemi && setSelectedPowerOverNum(ov)}
                      className={`py-3 px-2 rounded-xl border text-center transition ${
                        isRestrictedInSemi
                          ? 'bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                          : selectedPowerOverNum === ov
                          ? 'bg-purple-600 border-purple-400 text-white font-black shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/50'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 font-bold'
                      }`}
                    >
                      <span className="block text-sm">Over {ov}</span>
                      {isRestrictedInSemi ? (
                        <span className="text-[9px] text-rose-400 block font-bold">Restricted (Solo)</span>
                      ) : isSemiOrFinal && ov === 5 ? (
                        <span className="text-[9px] text-amber-300 block">Solo Senior</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => submitPowerOverDeclaration(selectedPowerOverNum, false)}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm shadow-lg shadow-purple-600/30 transition active:scale-95 flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Confirm Power Over as Over {selectedPowerOverNum}</span>
              </button>

              <button
                type="button"
                onClick={() => submitPowerOverDeclaration(undefined, true)}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-xs border border-slate-700 transition"
              >
                Opt Out / No Power Over for this Innings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY OVER UP BOWLER MODAL (Rule 3 & Rule 10: Bowler change mandatory, 1 over per bowler limit) */}
      {showOverUpBowlerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Over {currentOverNumber} Begins</h3>
                  <span className="text-[11px] text-emerald-400 font-semibold block">Mandatory Bowler Change</span>
                </div>
              </div>
              <button onClick={() => setShowOverUpBowlerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200 space-y-1">
              <p className="font-bold text-white">Official Over Up & Bowling Regulations:</p>
              <p>• <strong>Mandatory Change:</strong> Over {prevOverNumber} has completed. A new bowler must be chosen.</p>
              <p>• <strong>1 Over Max Rule:</strong> In an 8-over match, every player bowls exactly 1 over. Bowlers who have already bowled cannot bowl again.</p>
              {prevBowler && (
                <p className="text-slate-400 text-[11px] pt-1">
                  Previous Bowler: <b>{prevBowler.name}</b> (completed Over {prevOverNumber})
                </p>
              )}
            </div>

            <div>
              <label htmlFor="overup-bowler-select" className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Select Bowler for Over {currentOverNumber} ({bowlingTeam?.name})
              </label>
              <select
                id="overup-bowler-select"
                value={overUpBowlerId}
                onChange={(e) => setOverUpBowlerId(e.target.value)}
                className="w-full bg-slate-800 border-2 border-emerald-500/60 rounded-xl p-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-400"
              >
                <option value="">-- Choose New Bowler --</option>
                {eligibleBowlers.map(p => {
                  const bStat = currentInnings.bowlerStats[p.id];
                  const hasBowled = bowledBowlerIds.has(p.id);
                  const isPrev = p.id === prevBowlerId;
                  const isDisabled = hasBowled || isPrev;
                  return (
                    <option key={p.id} value={p.id} disabled={isDisabled}>
                      {p.name} [{p.category}] - {hasBowled ? `(Already Bowled Over ${bowlerOversMap[p.id]?.join(',') || ''} - Max 1 Over)` : isPrev ? '(Just Bowled Over ' + prevOverNumber + ')' : bStat ? `${bStat.oversBowled} ov bowled` : '0 ov'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="pt-2 flex justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowOverUpBowlerModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMandatoryBowler}
                disabled={isSubmitting || !overUpBowlerId}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-40"
              >
                Confirm Bowler for Over {currentOverNumber}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY PAIR CHANGE MODAL (Rule 4: Batsman change mandatory after 2 overs) */}
      {showMandatoryPairModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Over {currentOverNumber} Begins (2 Overs Complete)</h3>
                  <span className="text-[11px] text-amber-400 font-semibold block">Mandatory Batsman Change (New Pair)</span>
                </div>
              </div>
              <button onClick={() => setShowMandatoryPairModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 space-y-1">
              <p className="font-bold text-white">Pair Batting Regulations:</p>
              <p>• <strong>2-Over Cycle Finished:</strong> The previous pair has completed their 2 overs. A new batting pair is mandatory.</p>
              <p>• <strong>Bowler Change:</strong> A new bowler must also be selected for Over {currentOverNumber} (1 over limit per bowler).</p>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="mand-striker-select" className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  New Striker ({battingTeam?.name})
                </label>
                <select
                  id="mand-striker-select"
                  value={mandatoryPairStrikerId}
                  onChange={(e) => setMandatoryPairStrikerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-semibold focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Choose New Striker --</option>
                  {eligibleBatters.map(p => {
                    const wasInPrevPair = prevPairBatterIds.has(p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.category}] {wasInPrevPair ? '(Just Batted in Previous Pair)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="mand-nonstriker-select" className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  New Non-Striker ({battingTeam?.name})
                </label>
                <select
                  id="mand-nonstriker-select"
                  value={mandatoryPairNonStrikerId}
                  onChange={(e) => setMandatoryPairNonStrikerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-semibold focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Choose New Non-Striker --</option>
                  {eligibleBatters.map(p => {
                    const wasInPrevPair = prevPairBatterIds.has(p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.category}] {wasInPrevPair ? '(Just Batted in Previous Pair)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label htmlFor="mand-bowler-select" className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  New Bowler ({bowlingTeam?.name})
                </label>
                <select
                  id="mand-bowler-select"
                  value={mandatoryPairBowlerId}
                  onChange={(e) => setMandatoryPairBowlerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-semibold focus:outline-none focus:border-emerald-400"
                >
                  <option value="">-- Choose Bowler for Over {currentOverNumber} --</option>
                  {eligibleBowlers.map(p => {
                    const bStat = currentInnings.bowlerStats[p.id];
                    const hasBowled = bowledBowlerIds.has(p.id);
                    const isPrev = p.id === prevBowlerId;
                    const isDisabled = hasBowled || isPrev;
                    return (
                      <option key={p.id} value={p.id} disabled={isDisabled}>
                        {p.name} [{p.category}] - {hasBowled ? `(Already Bowled Over ${bowlerOversMap[p.id]?.join(',') || ''} - 1 Over Limit)` : isPrev ? '(Just Bowled Previous Over)' : bStat ? `${bStat.oversBowled} ov bowled` : '0 ov'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowMandatoryPairModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitMandatoryPair}
                disabled={isSubmitting || !mandatoryPairStrikerId || !mandatoryPairNonStrikerId}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-40"
              >
                Confirm Pair & Bowler for Over {currentOverNumber}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
