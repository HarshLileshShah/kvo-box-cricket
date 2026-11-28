import fs from 'fs';
import path from 'path';
import { Match, Team, MatchStatus, Innings, TournamentRulesConfig, BallOutcomeType, DismissalType, PlayerCategory } from '@/types/cricket';
import { INITIAL_TEAMS, INITIAL_MATCHES, OFFICIAL_TOURNAMENT_RULES, createInitialInnings } from './mockData';
import { calculateBallOutcome, getCompletedBatters } from './rulesEngine';

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'tournament_state.json');
const TMP_STATE_FILE = '/tmp/tournament_state.json';

export interface TournamentState {
  rules: TournamentRulesConfig;
  teams: Team[];
  matches: Match[];
  lastUpdated: string;
}

// Global in-memory cache for serverless environments (e.g. Vercel)
declare global {
  // eslint-disable-next-line no-var
  var __tournamentState: TournamentState | undefined;
}

/**
 * REST-based KV helper (Vercel KV or Upstash Redis)
 */
export async function getKVTournamentState(): Promise<TournamentState | null> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!kvUrl || !kvToken) return null;

  try {
    const res = await fetch(`${kvUrl}/get/kvo_tournament_state`, {
      headers: {
        Authorization: `Bearer ${kvToken}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.result) {
      const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      return parsed;
    }
  } catch (err) {
    console.error('Error reading from KV:', err);
  }
  return null;
}

export async function setKVTournamentState(state: TournamentState): Promise<boolean> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!kvUrl || !kvToken) return false;

  try {
    const res = await fetch(`${kvUrl}/set/kvo_tournament_state`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(state)),
    });
    return res.ok;
  } catch (err) {
    console.error('Error writing to KV:', err);
    return false;
  }
}

export function setInMemoryTournamentState(state: TournamentState) {
  enrichStateWithOfficialLogosAndSchedule(state);
  ensurePlayoffsReady(state);
  globalThis.__tournamentState = state;
}

export function getTournamentState(): TournamentState {
  if (globalThis.__tournamentState) {
    enrichStateWithOfficialLogosAndSchedule(globalThis.__tournamentState);
    return globalThis.__tournamentState;
  }

  // 1. Try local project file (local development)
  if (fs.existsSync(STATE_FILE)) {
    try {
      const content = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (!parsed.rules?.maxLeagueMatchesPerTeam) {
        parsed.rules = OFFICIAL_TOURNAMENT_RULES;
      }
      enrichStateWithOfficialLogosAndSchedule(parsed);
      ensurePlayoffsReady(parsed);
      globalThis.__tournamentState = parsed;
      return parsed;
    } catch (err) {
      // ignore
    }
  }

  // 2. Try /tmp file (Vercel serverless /tmp container)
  if (fs.existsSync(TMP_STATE_FILE)) {
    try {
      const content = fs.readFileSync(TMP_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      enrichStateWithOfficialLogosAndSchedule(parsed);
      ensurePlayoffsReady(parsed);
      globalThis.__tournamentState = parsed;
      return parsed;
    } catch (err) {
      // ignore
    }
  }

  // 3. Fallback Initial State
  const fallback: TournamentState = {
    rules: OFFICIAL_TOURNAMENT_RULES,
    teams: INITIAL_TEAMS,
    matches: INITIAL_MATCHES,
    lastUpdated: new Date().toISOString(),
  };
  enrichStateWithOfficialLogosAndSchedule(fallback);
  ensurePlayoffsReady(fallback);
  saveTournamentState(fallback);
  return fallback;
}

const OFFICIAL_TEAM_ENRICHMENTS: Record<string, { name: string; shortName: string; color?: string; logoUrl: string }> = {
  'team-party-hunterz-warriors': {
    name: 'Party Hunterz',
    shortName: 'PH',
    color: '#3b82f6',
    logoUrl: '/logos/party-hunterz.png',
  },
  'team-amsteel-inferno': {
    name: 'Amsteel Inferno',
    shortName: 'AI',
    color: '#ef4444',
    logoUrl: '/logos/amsteel-inferno.png',
  },
  'team-kraftech-titans': {
    name: 'Kraftech Titans',
    shortName: 'KT',
    color: '#f59e0b',
    logoUrl: '/logos/kraftech-titans.png',
  },
  'team-leofans-fanatics': {
    name: 'Leo Fanatics',
    shortName: 'LF',
    color: '#eab308',
    logoUrl: '/logos/leo-fanatics.png',
  },
  'team-truflo-strikers': {
    name: 'Truflo Strikers',
    shortName: 'TS',
    color: '#e11d48',
    logoUrl: '/logos/truflo-strikers.png',
  },
  'team-mavericks': {
    name: 'Mavericks Royals',
    shortName: 'MR',
    color: '#2563eb',
    logoUrl: '/logos/mavericks-royals.png',
  },
};

export function enrichStateWithOfficialLogosAndSchedule(state: TournamentState) {
  if (!state || !state.teams) return;

  // 1. Enrich team names, short names, colors, and logos
  state.teams.forEach(team => {
    const enrichment = OFFICIAL_TEAM_ENRICHMENTS[team.id];
    if (enrichment) {
      team.logoUrl = enrichment.logoUrl;
      if (team.name === 'Party Hunterz Warriors') team.name = enrichment.name;
      if (team.name === 'LeoFans Fanatics') team.name = enrichment.name;
      if (team.name === 'Mavericks') team.name = enrichment.name;
      if (!team.shortName || team.shortName === 'PHW') team.shortName = enrichment.shortName;
      if (team.shortName === 'MAV') team.shortName = enrichment.shortName;
    }
  });

  // 2. If existing matches are still on the old schedule (e.g. Decathlon venue or old dates), auto-align to official fixtures!
  const hasOldSchedule = state.matches?.some(m => 
    m.boxVenue?.includes('Decathlon') || 
    m.date === '2026-11-20' ||
    m.date === '2026-11-21' ||
    m.date === '2026-11-22'
  );

  if (hasOldSchedule) {
    const anyMatchesPlayed = state.matches.some(m => m.innings?.some(inn => inn.balls?.length > 0));
    if (!anyMatchesPlayed) {
      state.matches = INITIAL_MATCHES;
    } else {
      INITIAL_MATCHES.forEach(officialM => {
        const existing = state.matches.find(m => m.id === officialM.id);
        if (existing) {
          existing.date = officialM.date;
          existing.time = officialM.time;
          existing.boxVenue = officialM.boxVenue;
          existing.notes = officialM.notes;
        }
      });
    }
  }
}

export function syncOfficialSchedule() {
  const state = getTournamentState();
  state.matches = INITIAL_MATCHES.map(m => ({
    ...m,
    innings: [
      createInitialInnings(m.teamAId, m.teamBId, state.teams),
      createInitialInnings(m.teamBId, m.teamAId, state.teams),
    ] as [Innings, Innings],
  }));
  enrichStateWithOfficialLogosAndSchedule(state);
  saveTournamentState(state);
  return state;
}

function ensurePlayoffsReady(state: TournamentState) {
  if (!state.matches || !state.teams || state.teams.length < 4) return;
  const semi1 = state.matches.find(m => m.id === 'match-semi-1');
  const semi2 = state.matches.find(m => m.id === 'match-semi-2');
  const finalMatch = state.matches.find(m => m.id === 'match-final');

  const setupPlayoffLineup = (m?: Match) => {
    if (!m) return;
    const tA = state.teams.find(t => t.id === m.teamAId);
    const tB = state.teams.find(t => t.id === m.teamBId);
    if (tA && (!m.teamAPlaying8Ids || m.teamAPlaying8Ids.length < 9)) {
      m.teamAPlaying8Ids = tA.players.map(p => p.id);
    }
    if (tB && (!m.teamBPlaying8Ids || m.teamBPlaying8Ids.length < 9)) {
      m.teamBPlaying8Ids = tB.players.map(p => p.id);
    }
    m.lineupSubmitted = true;
  };

  if (semi1) {
    if (!semi1.teamAId || !semi1.teamBId) {
      semi1.teamAId = state.teams[0].id;
      semi1.teamBId = state.teams[3].id;
      semi1.innings = [
        createInitialInnings(semi1.teamAId, semi1.teamBId, state.teams),
        createInitialInnings(semi1.teamBId, semi1.teamAId, state.teams),
      ];
    }
    setupPlayoffLineup(semi1);
  }

  if (semi2) {
    if (!semi2.teamAId || !semi2.teamBId) {
      semi2.teamAId = state.teams[1].id;
      semi2.teamBId = state.teams[2].id;
      semi2.innings = [
        createInitialInnings(semi2.teamAId, semi2.teamBId, state.teams),
        createInitialInnings(semi2.teamBId, semi2.teamAId, state.teams),
      ];
    }
    setupPlayoffLineup(semi2);
  }

  if (finalMatch) {
    if (!finalMatch.teamAId || !finalMatch.teamBId) {
      finalMatch.teamAId = semi1?.teamAId || state.teams[0].id;
      finalMatch.teamBId = semi2?.teamAId || state.teams[1].id;
      finalMatch.innings = [
        createInitialInnings(finalMatch.teamAId, finalMatch.teamBId, state.teams),
        createInitialInnings(finalMatch.teamBId, finalMatch.teamAId, state.teams),
      ];
    }
    setupPlayoffLineup(finalMatch);
  }
}

export function saveTournamentState(state: TournamentState) {
  state.lastUpdated = new Date().toISOString();
  globalThis.__tournamentState = state;

  // Try local file system first
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    return;
  } catch (err) {
    // Read-only filesystem in Vercel lambda (EROFS) - proceed to /tmp
  }

  // Fallback to /tmp in serverless lambda
  try {
    fs.writeFileSync(TMP_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    // In-memory state is already updated
  }
}

/**
 * Record a ball in a match
 */
export function recordBall(params: {
  matchId: string;
  outcomeType: BallOutcomeType;
  dismissalType?: DismissalType;
  dismissedPlayerId?: string;
  isCatchByFemale?: boolean;
  fielderId?: string;
  assistedFielderId?: string;
  runOutType?: 'DIRECT' | 'ASSISTED';
  extraBatRunsOnNoBall?: number;
  noBallType?: 'NORMAL' | 'LEG_UPLIFT';
  byeRuns?: number;
  newStrikerId?: string;
  newNonStrikerId?: string;
  newBowlerId?: string;
  powerOverDeclaredNumber?: number;
  powerOverOptedOut?: boolean;
  isSuperAdmin?: boolean;
}) {
  const state = getTournamentState();
  const matchIndex = state.matches.findIndex(m => m.id === params.matchId);
  if (matchIndex === -1) throw new Error('Match not found');

  const match = state.matches[matchIndex];

  // Testing enabled: Semifinals & Finals can be scored ahead of league completion
  // (Guard relaxed for testing before league)
  /*
  if (match.stage === 'SEMI_FINAL' || match.stage === 'FINAL') {
    const incompleteLeague = state.matches.filter(m => m.stage === 'LEAGUE' && m.status !== 'COMPLETED');
    if (incompleteLeague.length > 0) {
      throw new Error(`Cannot score semifinals! All ${state.matches.filter(m => m.stage === 'LEAGUE').length} league matches must be completed first.`);
    }
  }
  */

  const inn = match.innings[match.currentInningsIndex];
  if (inn.isCompleted) throw new Error('Innings is already completed');

  // Track start timestamps
  const nowIso = new Date().toISOString();
  if (inn.balls.length === 0) {
    if (!inn.startedAt) inn.startedAt = nowIso;
    if (!match.startedAt) match.startedAt = nowIso;
    if (match.status === 'UPCOMING') match.status = 'LIVE';
  }

  // Handle Power Over Declaration
  if (params.powerOverOptedOut) {
    inn.powerOverOptedOut = true;
    inn.powerOverDeclaredNumber = 0;
  } else if (params.powerOverDeclaredNumber !== undefined) {
    // If balls already bowled, only Super Admin can change it
    if (inn.balls.length > 0 && !params.isSuperAdmin) {
      // Keep existing locked power over
    } else {
      inn.powerOverDeclaredNumber = params.powerOverDeclaredNumber;
      if (params.powerOverDeclaredNumber > 0) inn.powerOverOptedOut = false;
    }
  }

  const battingTeam = state.teams.find(t => t.id === inn.battingTeamId);
  const bowlingTeam = state.teams.find(t => t.id === inn.bowlingTeamId);

  const currentOverNumber = inn.completedOvers + 1;
  const isPowerOver = inn.powerOverDeclaredNumber === currentOverNumber;
  const isSemiOrFinal = match.stage === 'SEMI_FINAL' || match.stage === 'FINAL';
  const isSemiFinalOrFinalOver5 = isSemiOrFinal && currentOverNumber === 5;

  // Auto-handle Semi/Final Over 5 Senior Solo Mandate:
  // Semi/Final Rule: Over 5 must be bowled by the Senior Citizen player.
  // Semi/Final Rule: Over 5 must be faced solo by the opposing Senior Citizen player.
  if (isSemiFinalOrFinalOver5) {
    const batPlayingIds = inn.battingTeamId === match.teamAId ? match.teamAPlaying8Ids : match.teamBPlaying8Ids;
    const seniorBatter = (batPlayingIds && batPlayingIds.length > 0
      ? battingTeam?.players.filter(p => batPlayingIds.includes(p.id))
      : battingTeam?.players)?.find(p => p.category === 'SENIOR') || battingTeam?.players.find(p => p.category === 'SENIOR');

    const bowlPlayingIds = inn.bowlingTeamId === match.teamAId ? match.teamAPlaying8Ids : match.teamBPlaying8Ids;
    const seniorBowler = (bowlPlayingIds && bowlPlayingIds.length > 0
      ? bowlingTeam?.players.filter(p => bowlPlayingIds.includes(p.id))
      : bowlingTeam?.players)?.find(p => p.category === 'SENIOR') || bowlingTeam?.players.find(p => p.category === 'SENIOR');

    if (seniorBatter) {
      inn.currentPair.strikerId = seniorBatter.id;
      inn.currentPair.nonStrikerId = seniorBatter.id;
    }
    if (seniorBowler) {
      inn.currentBowlerId = seniorBowler.id;
    }
  }

  const striker = battingTeam?.players.find(p => p.id === inn.currentPair.strikerId);
  const nonStriker = battingTeam?.players.find(p => p.id === inn.currentPair.nonStrikerId);
  const bowler = bowlingTeam?.players.find(p => p.id === inn.currentBowlerId);

  const strikerCategory: PlayerCategory = striker?.category || 'REGULAR';

  const calc = calculateBallOutcome({
    outcomeType: params.outcomeType,
    batsmanCategory: strikerCategory,
    isPowerOver,
    extraBatRunsOnNoBall: params.extraBatRunsOnNoBall,
    isCatchByFemale: params.isCatchByFemale,
    noBallType: params.noBallType,
    byeRuns: params.byeRuns,
  });

  const ballNumber = calc.isLegalDelivery ? inn.currentOverBalls + 1 : inn.currentOverBalls;

  const fielder = params.fielderId ? state.teams.flatMap(t => t.players).find(p => p.id === params.fielderId) : undefined;
  const assistedFielder = params.assistedFielderId ? state.teams.flatMap(t => t.players).find(p => p.id === params.assistedFielderId) : undefined;

  let customCommentary = calc.commentary;
  if (calc.isWicket) {
    const dType = params.dismissalType || 'CAUGHT';
    if (dType === 'CAUGHT') {
      customCommentary = `OUT! Caught by ${fielder?.name || 'fielder'}${params.isCatchByFemale ? ' (Female Catch: 2x reduction!)' : ''}`;
    } else if (dType === 'RUN_OUT') {
      if (params.runOutType === 'ASSISTED' && fielder && assistedFielder) {
        customCommentary = `OUT! Assisted Run Out by ${fielder.name} & ${assistedFielder.name}!`;
      } else {
        customCommentary = `OUT! Direct Hit Run Out by ${fielder?.name || 'fielder'}!`;
      }
    } else if (dType === 'STUMPED') {
      customCommentary = `OUT! Stumped by ${fielder?.name || 'wicketkeeper'}!`;
    } else if (dType === 'BOWLED') {
      customCommentary = `OUT! Clean bowled by ${bowler?.name || 'bowler'}!`;
    }
  }

  const ballRecord = {
    id: `ball-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ballNumber,
    overNumber: currentOverNumber,
    batsmanId: striker?.id || '',
    batsmanName: striker?.name || 'Unknown',
    batsmanCategory: strikerCategory,
    nonStrikerId: nonStriker?.id || '',
    bowlerId: bowler?.id || '',
    bowlerName: bowler?.name || 'Unknown',
    isPowerOver,
    outcomeType: params.outcomeType,
    rawRuns: calc.rawRuns,
    effectiveRuns: calc.effectiveTeamRuns,
    isLegalDelivery: calc.isLegalDelivery,
    isFreeHit: calc.isFreeHitNext || false,
    isWide: params.outcomeType === 'WIDE',
    isNoBall: params.outcomeType === 'NO_BALL',
    noBallType: params.noBallType,
    isBye: params.outcomeType === 'BYE',
    dismissal: calc.isWicket
      ? {
        type: params.dismissalType || 'CAUGHT',
        dismissedPlayerId: params.dismissedPlayerId || striker?.id || '',
        caughtByFemale: params.isCatchByFemale,
        fielderId: fielder?.id,
        fielderName: fielder?.name,
        assistedFielderId: assistedFielder?.id,
        assistedFielderName: assistedFielder?.name,
        runOutType: params.runOutType,
        pointsDeducted: calc.effectiveTeamRuns,
      }
      : undefined,
    commentary: customCommentary,
    timestamp: new Date().toISOString(),
  };

  inn.balls.push(ballRecord);

  // Update total runs (allows negative score when dismissed at 0!)
  inn.totalRuns = inn.totalRuns + calc.effectiveTeamRuns;

  if (calc.isWicket) {
    inn.totalWickets += 1;
  }

  // Update Batsman Stats
  if (striker) {
    if (!inn.batsmanStats[striker.id]) {
      inn.batsmanStats[striker.id] = {
        playerId: striker.id,
        name: striker.name,
        category: striker.category,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        dismissalsCount: 0,
      };
    }
    const bStats = inn.batsmanStats[striker.id];
    if (calc.isLegalDelivery) {
      bStats.ballsFaced += 1;
    }
    bStats.runs += calc.batsmanRuns;
    if (calc.isFour) bStats.fours += 1;
    if (calc.isSix) bStats.sixes += 1;
    if (calc.isWicket) bStats.dismissalsCount += 1;
  }

  // Update Bowler Stats
  if (bowler) {
    if (!inn.bowlerStats[bowler.id]) {
      inn.bowlerStats[bowler.id] = {
        playerId: bowler.id,
        name: bowler.name,
        oversBowled: 0,
        legalBalls: 0,
        runsConceded: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
      };
    }
    const bowlStats = inn.bowlerStats[bowler.id];
    if (params.outcomeType !== 'BYE') {
      bowlStats.runsConceded += calc.effectiveTeamRuns;
    }
    if (calc.isLegalDelivery) {
      bowlStats.legalBalls += 1;
      bowlStats.oversBowled = Number((Math.floor(bowlStats.legalBalls / 6) + (bowlStats.legalBalls % 6) / 10).toFixed(1));
    }
    if (calc.isWicket && params.dismissalType !== 'RUN_OUT') {
      bowlStats.wickets += 1;
    }
    if (params.outcomeType === 'WIDE') bowlStats.wides += 1;
    if (params.outcomeType === 'NO_BALL') bowlStats.noBalls += 1;
  }

  // Over Progression
  if (calc.isLegalDelivery) {
    inn.currentOverBalls += 1;

    // Strike rotation on odd runs (Disabled in Semi/Final Over 5: Senior faces solo!)
    if (!isSemiFinalOrFinalOver5 && (calc.rawRuns === 1 || calc.rawRuns === 3)) {
      const temp = inn.currentPair.strikerId;
      inn.currentPair.strikerId = inn.currentPair.nonStrikerId;
      inn.currentPair.nonStrikerId = temp;
    }

    if (inn.currentOverBalls >= 6) {
      inn.completedOvers += 1;
      inn.currentOverBalls = 0;

      // Strike rotation at over end (Disabled in Semi/Final Over 5: Senior faces all deliveries)
      if (!isSemiFinalOrFinalOver5) {
        const temp = inn.currentPair.strikerId;
        inn.currentPair.strikerId = inn.currentPair.nonStrikerId;
        inn.currentPair.nonStrikerId = temp;
      }

      if (inn.completedOvers >= match.totalOvers) {
        inn.isCompleted = true;
        inn.completedAt = nowIso;
        if (match.currentInningsIndex === 0) {
          match.currentInningsIndex = 1;
        } else {
          match.status = 'COMPLETED';
          match.completedAt = nowIso;
          const firstInnRuns = match.innings[0].totalRuns;
          const secondInnRuns = match.innings[1].totalRuns;
          if (secondInnRuns > firstInnRuns) {
            match.winnerId = match.innings[1].battingTeamId;
          } else if (firstInnRuns > secondInnRuns) {
            match.winnerId = match.innings[0].battingTeamId;
          } else {
            match.status = 'TIED';
            match.superOverRequired = true;
          }
        }
      }
    }
  }

  // Only allow manual overrides if NOT in the auto-handled Senior Solo Over 5
  if (!isSemiFinalOrFinalOver5) {
    if (params.newStrikerId) inn.currentPair.strikerId = params.newStrikerId;
    if (params.newNonStrikerId) inn.currentPair.nonStrikerId = params.newNonStrikerId;
    if (params.newBowlerId) inn.currentBowlerId = params.newBowlerId;
  }

  if (match.currentInningsIndex === 1 && !inn.isCompleted) {
    const target = match.innings[0].totalRuns + 1;
    if (inn.totalRuns >= target) {
      inn.isCompleted = true;
      inn.completedAt = nowIso;
      match.status = 'COMPLETED';
      match.completedAt = nowIso;
      match.winnerId = inn.battingTeamId;
    }
  }

  state.matches[matchIndex] = match;
  saveTournamentState(state);
  return { match, ballRecord };
}

/**
 * Undo last ball
 */
export function undoLastBall(matchId: string) {
  const state = getTournamentState();
  const matchIndex = state.matches.findIndex(m => m.id === matchId);
  if (matchIndex === -1) throw new Error('Match not found');

  const match = state.matches[matchIndex];
  let innIndex = match.currentInningsIndex;
  let inn = match.innings[innIndex];

  if (inn.balls.length === 0 && innIndex === 1) {
    innIndex = 0;
    match.currentInningsIndex = 0;
    inn = match.innings[innIndex];
    inn.isCompleted = false;
    match.status = 'LIVE';
    match.winnerId = undefined;
  }

  if (inn.balls.length === 0) {
    throw new Error('No balls to undo in this innings');
  }

  const popped = inn.balls.pop()!;
  inn.isCompleted = false;
  match.status = 'LIVE';
  match.winnerId = undefined;

  // Revert team runs (supports negative scores)
  inn.totalRuns = inn.totalRuns - popped.effectiveRuns;

  if (popped.dismissal) {
    inn.totalWickets = Math.max(0, inn.totalWickets - 1);
  }

  const batsmanStats = inn.batsmanStats[popped.batsmanId];
  if (batsmanStats) {
    if (popped.isLegalDelivery) {
      batsmanStats.ballsFaced = Math.max(0, batsmanStats.ballsFaced - 1);
    }
    batsmanStats.runs = Math.max(0, batsmanStats.runs - (popped.dismissal ? 0 : popped.effectiveRuns));
    if (popped.outcomeType === 'FOUR') batsmanStats.fours = Math.max(0, batsmanStats.fours - 1);
    if (popped.outcomeType === 'SIX') batsmanStats.sixes = Math.max(0, batsmanStats.sixes - 1);
    if (popped.dismissal) batsmanStats.dismissalsCount = Math.max(0, batsmanStats.dismissalsCount - 1);
  }

  const bowlerStats = inn.bowlerStats[popped.bowlerId];
  if (bowlerStats) {
    if (popped.outcomeType !== 'BYE') {
      bowlerStats.runsConceded = Math.max(0, bowlerStats.runsConceded - popped.effectiveRuns);
    }
    if (popped.isLegalDelivery) {
      bowlerStats.legalBalls = Math.max(0, bowlerStats.legalBalls - 1);
      bowlerStats.oversBowled = Number((Math.floor(bowlerStats.legalBalls / 6) + (bowlerStats.legalBalls % 6) / 10).toFixed(1));
    }
    if (popped.dismissal && popped.dismissal.type !== 'RUN_OUT') {
      bowlerStats.wickets = Math.max(0, bowlerStats.wickets - 1);
    }
    if (popped.outcomeType === 'WIDE') bowlerStats.wides = Math.max(0, bowlerStats.wides - 1);
    if (popped.outcomeType === 'NO_BALL') bowlerStats.noBalls = Math.max(0, bowlerStats.noBalls - 1);
  }

  if (popped.isLegalDelivery) {
    if (inn.currentOverBalls === 0 && inn.completedOvers > 0) {
      inn.completedOvers -= 1;
      inn.currentOverBalls = 5;
    } else {
      inn.currentOverBalls = Math.max(0, inn.currentOverBalls - 1);
    }
  }

  state.matches[matchIndex] = match;
  saveTournamentState(state);
  return { match, popped };
}

/**
 * Update active participants
 */
export function updateActiveParticipants(params: {
  matchId: string;
  strikerId?: string;
  nonStrikerId?: string;
  bowlerId?: string;
  powerOverDeclaredNumber?: number;
  powerOverOptedOut?: boolean;
  isSuperAdmin?: boolean;
}) {
  const state = getTournamentState();
  const match = state.matches.find(m => m.id === params.matchId);
  if (!match) throw new Error('Match not found');

  const inn = match.innings[match.currentInningsIndex];
  const isSemiOrFinal = match.stage === 'SEMI_FINAL' || match.stage === 'FINAL';
  const currentOverNumber = inn.completedOvers + 1;
  const isSemiFinalOrFinalOver5 = isSemiOrFinal && currentOverNumber === 5;

  if (isSemiOrFinal && params.powerOverDeclaredNumber === 5) {
    throw new Error('In Semi-Finals and Finals, Over 5 is reserved for Senior Solo and cannot be declared as Power Over.');
  }

  if (isSemiFinalOrFinalOver5) {
    const battingTeam = state.teams.find(t => t.id === inn.battingTeamId);
    const bowlingTeam = state.teams.find(t => t.id === inn.bowlingTeamId);
    const batPlayingIds = inn.battingTeamId === match.teamAId ? match.teamAPlaying8Ids : match.teamBPlaying8Ids;
    const seniorBatter = (batPlayingIds && batPlayingIds.length > 0
      ? battingTeam?.players.filter(p => batPlayingIds.includes(p.id))
      : battingTeam?.players)?.find(p => p.category === 'SENIOR') || battingTeam?.players.find(p => p.category === 'SENIOR');

    const bowlPlayingIds = inn.bowlingTeamId === match.teamAId ? match.teamAPlaying8Ids : match.teamBPlaying8Ids;
    const seniorBowler = (bowlPlayingIds && bowlPlayingIds.length > 0
      ? bowlingTeam?.players.filter(p => bowlPlayingIds.includes(p.id))
      : bowlingTeam?.players)?.find(p => p.category === 'SENIOR') || bowlingTeam?.players.find(p => p.category === 'SENIOR');

    if (seniorBatter) {
      inn.currentPair.strikerId = seniorBatter.id;
      inn.currentPair.nonStrikerId = seniorBatter.id;
    }
    if (seniorBowler) {
      inn.currentBowlerId = seniorBowler.id;
    }
  } else {
    // 1-Cycle Batting Rule: completed batters cannot bat again in this innings
    const { completedBatterIds, batterBlockMap } = getCompletedBatters(inn, isSemiOrFinal);
    if (params.strikerId && params.strikerId !== inn.currentPair.strikerId && completedBatterIds.has(params.strikerId)) {
      throw new Error(`Cannot select batsman: Player has already completed their batting cycle in ${batterBlockMap[params.strikerId] || 'earlier overs'}. Each batsman can only bat once.`);
    }
    if (params.nonStrikerId && params.nonStrikerId !== inn.currentPair.nonStrikerId && completedBatterIds.has(params.nonStrikerId)) {
      throw new Error(`Cannot select non-striker: Player has already completed their batting cycle in ${batterBlockMap[params.nonStrikerId] || 'earlier overs'}. Each batsman can only bat once.`);
    }

    if (params.strikerId) inn.currentPair.strikerId = params.strikerId;
    if (params.nonStrikerId) inn.currentPair.nonStrikerId = params.nonStrikerId;
    if (params.bowlerId) inn.currentBowlerId = params.bowlerId;
  }

  if (params.powerOverOptedOut) {
    if (inn.balls.length > 0 && !params.isSuperAdmin) {
      throw new Error('Power Over status is locked after first ball is bowled. Only Super Admin can change it.');
    }
    inn.powerOverOptedOut = true;
    inn.powerOverDeclaredNumber = 0;
  } else if (params.powerOverDeclaredNumber !== undefined) {
    if (inn.balls.length > 0 && !params.isSuperAdmin) {
      throw new Error('Power Over status is locked after first ball is bowled. Only Super Admin can change it.');
    }
    inn.powerOverDeclaredNumber = params.powerOverDeclaredNumber;
    if (params.powerOverDeclaredNumber > 0) inn.powerOverOptedOut = false;
  }

  saveTournamentState(state);
  return match;
}

/**
 * Submit Playing 8 Lineup for a Match
 */
export function submitPlayingLineup(params: {
  matchId: string;
  teamAPlaying8Ids: string[];
  teamBPlaying8Ids: string[];
}) {
  const state = getTournamentState();
  const match = state.matches.find(m => m.id === params.matchId);
  if (!match) throw new Error('Match not found');

  match.teamAPlaying8Ids = params.teamAPlaying8Ids;
  match.teamBPlaying8Ids = params.teamBPlaying8Ids;
  match.lineupSubmitted = true;

  const teamAPlayers = state.teams.find(t => t.id === match.teamAId)?.players || [];
  const teamBPlayers = state.teams.find(t => t.id === match.teamBId)?.players || [];

  const teamAPlaying = teamAPlayers.filter(p => params.teamAPlaying8Ids.includes(p.id));
  const teamBPlaying = teamBPlayers.filter(p => params.teamBPlaying8Ids.includes(p.id));

  const inn0 = match.innings[0];
  if (inn0.balls.length === 0) {
    const batPlaying = inn0.battingTeamId === match.teamAId ? teamAPlaying : teamBPlaying;
    const bowlPlaying = inn0.bowlingTeamId === match.teamAId ? teamAPlaying : teamBPlaying;

    const femaleBatters = batPlaying.filter(p => p.category === 'FEMALE');
    if (femaleBatters.length >= 2) {
      inn0.currentPair.strikerId = femaleBatters[0].id;
      inn0.currentPair.nonStrikerId = femaleBatters[1].id;
    } else if (batPlaying.length >= 2) {
      inn0.currentPair.strikerId = batPlaying[0].id;
      inn0.currentPair.nonStrikerId = batPlaying[1].id;
    }

    const femaleBowlers = bowlPlaying.filter(p => p.category === 'FEMALE');
    if (femaleBowlers.length >= 1) {
      inn0.currentBowlerId = femaleBowlers[0].id;
    } else if (bowlPlaying.length >= 1) {
      inn0.currentBowlerId = bowlPlaying[0].id;
    }
  }

  saveTournamentState(state);
  return match;
}

/**
 * Add / Update Team (Supports Name Change, Short Code, Theme Color, Players)
 */
export function saveTeam(team: Team) {
  const state = getTournamentState();
  const idx = state.teams.findIndex(t => t.id === team.id);
  if (idx >= 0) {
    state.teams[idx] = {
      ...state.teams[idx],
      ...team,
    };
  } else {
    state.teams.push(team);
  }

  // Update upcoming unplayed matches involving this team to reflect roster updates
  state.matches.forEach(m => {
    if ((m.teamAId === team.id || m.teamBId === team.id) && m.status === 'UPCOMING') {
      const hasBalls = m.innings.some(inn => inn.balls && inn.balls.length > 0);
      if (!hasBalls) {
        m.innings = [
          createInitialInnings(m.teamAId, m.teamBId, state.teams, m.teamAPlaying8Ids),
          createInitialInnings(m.teamBId, m.teamAId, state.teams, m.teamBPlaying8Ids),
        ];
      }
    }
  });

  saveTournamentState(state);
  return state.teams;
}

/**
 * Reset Individual Match:
 * Resets score, balls, wickets, toss, and lineups for this single match back to fresh state.
 * Fully preserves team rosters, player names, and all other matches.
 */
export function resetMatch(params: { matchId: string }) {
  const state = getTournamentState();
  const match = state.matches.find(m => m.id === params.matchId);
  if (!match) throw new Error('Match not found');

  match.status = 'UPCOMING';
  match.tossWinnerId = undefined;
  match.tossDecision = undefined;
  match.lineupSubmitted = false;
  match.teamAPlaying8Ids = undefined;
  match.teamBPlaying8Ids = undefined;
  match.currentInningsIndex = 0;

  // Recreate clean initial innings using the current team rosters
  match.innings = [
    createInitialInnings(match.teamAId, match.teamBId, state.teams),
    createInitialInnings(match.teamBId, match.teamAId, state.teams),
  ];

  saveTournamentState(state);
  return { match, matches: state.matches };
}

/**
 * Reset All Tournament Matches:
 * Resets all match scores, balls, and standings.
 * GUARANTEES team names and player rosters are PRESERVED!
 */
export function resetAllMatches(params?: { wipeTeams?: boolean }) {
  const state = getTournamentState();
  const preserveTeams = !params?.wipeTeams;
  const currentTeams = preserveTeams ? state.teams : INITIAL_TEAMS;

  const freshMatches = INITIAL_MATCHES.map(m => {
    // Keep initial teams (including playoffs) so semifinals & finals can be tested immediately
    const teamAId = m.teamAId;
    const teamBId = m.teamBId;
    const isPlayoff = m.stage === 'SEMI_FINAL' || m.stage === 'FINAL';
    const tA = currentTeams.find(t => t.id === teamAId);
    const tB = currentTeams.find(t => t.id === teamBId);
    const teamAPlaying8Ids = isPlayoff && tA ? tA.players.map(p => p.id) : undefined;
    const teamBPlaying8Ids = isPlayoff && tB ? tB.players.map(p => p.id) : undefined;
    const lineupSubmitted = isPlayoff;
    return {
      ...m,
      teamAId,
      teamBId,
      status: 'UPCOMING' as const,
      tossWinnerId: undefined,
      tossDecision: undefined,
      lineupSubmitted,
      teamAPlaying8Ids,
      teamBPlaying8Ids,
      currentInningsIndex: 0 as (0 | 1),
      innings: [
        createInitialInnings(teamAId, teamBId, currentTeams),
        createInitialInnings(teamBId, teamAId, currentTeams),
      ] as [Innings, Innings],
    };
  });

  const resetState: TournamentState = {
    rules: state.rules || OFFICIAL_TOURNAMENT_RULES,
    teams: currentTeams,
    matches: freshMatches,
    lastUpdated: new Date().toISOString(),
  };

  saveTournamentState(resetState);
  return resetState;
}

/**
 * Add / Update Match
 */
export function saveMatch(match: Match) {
  const state = getTournamentState();
  const idx = state.matches.findIndex(m => m.id === match.id);
  if (idx >= 0) {
    state.matches[idx] = match;
  } else {
    state.matches.push(match);
  }
  saveTournamentState(state);
  return state.matches;
}

/**
 * Semifinal qualification assignment:
 * SF1: Rank 1 vs Rank 4
 * SF2: Rank 2 vs Rank 3
 */
export function setPlayoffTeams(params: {
  semi1TeamAId: string; // e.g. Rank 1
  semi1TeamBId: string; // e.g. Rank 4
  semi2TeamAId: string; // e.g. Rank 2
  semi2TeamBId: string; // e.g. Rank 3
  finalTeamAId?: string;
  finalTeamBId?: string;
}) {
  const state = getTournamentState();

  // Guard relaxed for testing: allows seeding & scoring playoff matches ahead of league completion
  // const incompleteLeague = state.matches.filter(m => m.stage === 'LEAGUE' && m.status !== 'COMPLETED');
  // if (incompleteLeague.length > 0) {
  //   throw new Error(`Cannot finalize Semifinals! ${incompleteLeague.length} league matches are still remaining.`);
  // }

  const semi1 = state.matches.find(m => m.id === 'match-semi-1');
  const semi2 = state.matches.find(m => m.id === 'match-semi-2');
  const finalMatch = state.matches.find(m => m.id === 'match-final');

  if (semi1) {
    semi1.teamAId = params.semi1TeamAId;
    semi1.teamBId = params.semi1TeamBId;
    const tA = state.teams.find(t => t.id === params.semi1TeamAId);
    const tB = state.teams.find(t => t.id === params.semi1TeamBId);
    if (tA) semi1.teamAPlaying8Ids = tA.players.map(p => p.id);
    if (tB) semi1.teamBPlaying8Ids = tB.players.map(p => p.id);
    semi1.lineupSubmitted = true;
    semi1.innings = [
      createInitialInnings(params.semi1TeamAId, params.semi1TeamBId, state.teams),
      createInitialInnings(params.semi1TeamBId, params.semi1TeamAId, state.teams),
    ];
  }

  if (semi2) {
    semi2.teamAId = params.semi2TeamAId;
    semi2.teamBId = params.semi2TeamBId;
    const tA = state.teams.find(t => t.id === params.semi2TeamAId);
    const tB = state.teams.find(t => t.id === params.semi2TeamBId);
    if (tA) semi2.teamAPlaying8Ids = tA.players.map(p => p.id);
    if (tB) semi2.teamBPlaying8Ids = tB.players.map(p => p.id);
    semi2.lineupSubmitted = true;
    semi2.innings = [
      createInitialInnings(params.semi2TeamAId, params.semi2TeamBId, state.teams),
      createInitialInnings(params.semi2TeamBId, params.semi2TeamAId, state.teams),
    ];
  }

  if (finalMatch && params.finalTeamAId && params.finalTeamBId) {
    finalMatch.teamAId = params.finalTeamAId;
    finalMatch.teamBId = params.finalTeamBId;
    const tA = state.teams.find(t => t.id === params.finalTeamAId);
    const tB = state.teams.find(t => t.id === params.finalTeamBId);
    if (tA) finalMatch.teamAPlaying8Ids = tA.players.map(p => p.id);
    if (tB) finalMatch.teamBPlaying8Ids = tB.players.map(p => p.id);
    finalMatch.lineupSubmitted = true;
    finalMatch.innings = [
      createInitialInnings(params.finalTeamAId, params.finalTeamBId, state.teams),
      createInitialInnings(params.finalTeamBId, params.finalTeamAId, state.teams),
    ];
  }

  saveTournamentState(state);
  return state.matches;
}

/**
 * Set Match Status (UPCOMING, LIVE, COMPLETED, TIED)
 * Enables running 2 or more matches in parallel in LIVE mode!
 */
export function setMatchStatus(params: { matchId: string; status: MatchStatus }) {
  const state = getTournamentState();
  const match = state.matches.find(m => m.id === params.matchId);
  if (!match) throw new Error('Match not found');

  // Testing enabled: allow setting Semifinals & Finals to LIVE ahead of league completion
  // (Guard relaxed for testing before league)
  /*
  if ((match.stage === 'SEMI_FINAL' || match.stage === 'FINAL') && params.status === 'LIVE') {
    const incomplete = state.matches.filter(m => m.stage === 'LEAGUE' && m.status !== 'COMPLETED');
    if (incomplete.length > 0) {
      throw new Error(`Cannot start Semifinals! All ${state.matches.filter(m => m.stage === 'LEAGUE').length} league matches must be completed first.`);
    }
  }
  */

  match.status = params.status;
  saveTournamentState(state);
  return match;
}

/**
 * Recalculate Innings Stats from its balls array
 * Allows seamless over/ball editing in any over!
 */
export function recalculateInningsStats(inn: Innings, match: Match, teams: Team[]) {
  const battingTeam = teams.find(t => t.id === inn.battingTeamId);
  const bowlingTeam = teams.find(t => t.id === inn.bowlingTeamId);

  inn.totalRuns = 0;
  inn.totalWickets = 0;
  inn.completedOvers = 0;
  inn.currentOverBalls = 0;

  // Reset batsman stats
  const bStats: Record<string, any> = {};
  battingTeam?.players.forEach(p => {
    bStats[p.id] = {
      playerId: p.id,
      name: p.name,
      category: p.category,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      dismissalsCount: 0,
    };
  });
  inn.batsmanStats = bStats;

  // Reset bowler stats
  const bwStats: Record<string, any> = {};
  bowlingTeam?.players.forEach(p => {
    bwStats[p.id] = {
      playerId: p.id,
      name: p.name,
      oversBowled: 0,
      legalBalls: 0,
      runsConceded: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
    };
  });
  inn.bowlerStats = bwStats;

  // Replay all balls
  inn.balls.forEach((ball, idx) => {
    inn.totalRuns += ball.effectiveRuns;

    if (ball.dismissal || ball.outcomeType === 'WICKET') {
      inn.totalWickets += 1;
    }

    if (ball.isLegalDelivery) {
      inn.currentOverBalls += 1;
      if (inn.currentOverBalls >= 6) {
        inn.completedOvers += 1;
        inn.currentOverBalls = 0;
      }
    }

    // Assign over number and ball number
    ball.overNumber = inn.currentOverBalls === 0 && ball.isLegalDelivery ? inn.completedOvers : inn.completedOvers + 1;
    ball.ballNumber = ball.isLegalDelivery ? (inn.currentOverBalls === 0 ? 6 : inn.currentOverBalls) : inn.currentOverBalls;

    // Batter stats
    if (ball.batsmanId && inn.batsmanStats[ball.batsmanId]) {
      const bs = inn.batsmanStats[ball.batsmanId];
      if (ball.isLegalDelivery) {
        bs.ballsFaced += 1;
      }
      let r = 0;
      if (ball.outcomeType === 'RUN_1') r = ball.batsmanCategory === 'FEMALE' ? 2 : 1;
      else if (ball.outcomeType === 'RUN_2') r = ball.batsmanCategory === 'FEMALE' ? 4 : 2;
      else if (ball.outcomeType === 'RUN_3') r = ball.batsmanCategory === 'FEMALE' ? 6 : 3;
      else if (ball.outcomeType === 'FOUR') {
        r = ball.batsmanCategory === 'FEMALE' ? 9 : (ball.batsmanCategory === 'SENIOR' || ball.batsmanCategory === 'KID') ? 5 : 4;
      } else if (ball.outcomeType === 'SIX') {
        r = ball.batsmanCategory === 'FEMALE' ? 14 : (ball.batsmanCategory === 'SENIOR' || ball.batsmanCategory === 'KID') ? 8 : 6;
      } else if (ball.outcomeType === 'DECLARATION_1D') {
        r = ball.batsmanCategory === 'FEMALE' ? 2 : 1;
      } else if (ball.outcomeType === 'NO_BALL') {
        r = Math.max(0, ball.effectiveRuns - 1);
      }
      if (ball.isPowerOver && r > 0 && ball.outcomeType !== 'NO_BALL') {
        r *= 2;
      }
      bs.runs += r;
      if (ball.outcomeType === 'FOUR') bs.fours += 1;
      if (ball.outcomeType === 'SIX') bs.sixes += 1;
      if (ball.dismissal) bs.dismissalsCount += 1;
    }

    // Bowler stats
    if (ball.bowlerId && inn.bowlerStats[ball.bowlerId]) {
      const bws = inn.bowlerStats[ball.bowlerId];
      if (ball.outcomeType !== 'BYE') {
        bws.runsConceded += ball.effectiveRuns;
      }
      if (ball.isLegalDelivery) {
        bws.legalBalls += 1;
        bws.oversBowled = Number((Math.floor(bws.legalBalls / 6) + (bws.legalBalls % 6) / 10).toFixed(1));
      }
      if (ball.dismissal && ball.dismissal.type !== 'RUN_OUT') {
        bws.wickets += 1;
      }
      if (ball.outcomeType === 'WIDE') bws.wides += 1;
      if (ball.outcomeType === 'NO_BALL') bws.noBalls += 1;
    }

    if (idx === inn.balls.length - 1) {
      if (ball.bowlerId) inn.currentBowlerId = ball.bowlerId;
      if (ball.batsmanId && ball.nonStrikerId) {
        inn.currentPair = {
          strikerId: ball.batsmanId,
          nonStrikerId: ball.nonStrikerId,
        };
      }
    }
  });

  // Check completion
  if (inn.completedOvers >= match.totalOvers) {
    inn.isCompleted = true;
    if (match.currentInningsIndex === 1) {
      match.status = 'COMPLETED';
      const r1 = match.innings[0].totalRuns;
      const r2 = match.innings[1].totalRuns;
      if (r2 > r1) match.winnerId = match.innings[1].battingTeamId;
      else if (r1 > r2) match.winnerId = match.innings[0].battingTeamId;
      else match.status = 'TIED';
    }
  } else if (match.currentInningsIndex === 1) {
    const target = match.innings[0].totalRuns + 1;
    if (inn.totalRuns >= target) {
      inn.isCompleted = true;
      match.status = 'COMPLETED';
      match.winnerId = inn.battingTeamId;
    } else {
      inn.isCompleted = false;
      if (match.status === 'COMPLETED') match.status = 'LIVE';
    }
  } else {
    inn.isCompleted = false;
  }
}

/**
 * Helper to determine if a ball belongs to the active current over of the match.
 * Used for role-based authorization: Scorers can only edit/delete balls in the current over.
 */
export function isCurrentOver(
  innings: Innings,
  overNumber: number,
  inningsIndex?: number,
  currentInningsIndex?: number
): boolean {
  if (inningsIndex !== undefined && currentInningsIndex !== undefined && inningsIndex < currentInningsIndex) {
    return false;
  }
  const currentOver = innings.completedOvers + 1;
  if (overNumber === currentOver) {
    return true;
  }
  // If the over just completed (currentOverBalls === 0) and next over hasn't bowled any balls yet:
  if (innings.currentOverBalls === 0 && overNumber === innings.completedOvers && overNumber > 0) {
    return true;
  }
  return false;
}

/**
 * Edit a specific historical ball in any over
 */
export function updateBall(params: {
  matchId: string;
  ballId: string;
  outcomeType?: BallOutcomeType;
  effectiveRuns?: number;
  commentary?: string;
  noBallType?: 'NORMAL' | 'LEG_UPLIFT';
  dismissalType?: DismissalType;
  isCatchByFemale?: boolean;
  fielderId?: string;
  assistedFielderId?: string;
  runOutType?: 'DIRECT' | 'ASSISTED';
  batsmanId?: string;
  bowlerId?: string;
  isPowerOver?: boolean;
  loginId?: string;
  userRole?: 'ADMIN' | 'SCORER';
}) {
  const state = getTournamentState();
  const match = state.matches.find(m => m.id === params.matchId);
  if (!match) throw new Error('Match not found');

  let targetBall: any;
  let targetInnings: Innings | undefined;

  for (const inn of match.innings) {
    targetBall = inn.balls.find(b => b.id === params.ballId);
    if (targetBall) {
      targetInnings = inn;
      break;
    }
  }

  if (!targetBall || !targetInnings) throw new Error('Ball not found');

  // Role-based permission check:
  // Scorers (sagar, bhavin) can ONLY edit the current over!
  // Past overs require Super Admin ('admin')!
  const role = params.userRole || (params.loginId?.toLowerCase() === 'admin' ? 'ADMIN' : 'SCORER');
  if (role === 'SCORER') {
    const innIdx = match.innings.indexOf(targetInnings);
    const inCurrentOver = isCurrentOver(targetInnings, targetBall.overNumber, innIdx, match.currentInningsIndex);
    if (!inCurrentOver) {
      throw new Error(`Permission Denied: Scorer '${params.loginId || 'Scorer'}' cannot edit balls from past overs (Over ${targetBall.overNumber}). Only Super Admin can edit past overs.`);
    }
  }

  if (params.batsmanId) {
    const batsman = state.teams.flatMap(t => t.players).find(p => p.id === params.batsmanId);
    if (batsman) {
      targetBall.batsmanId = batsman.id;
      targetBall.batsmanName = batsman.name;
      targetBall.batsmanCategory = batsman.category;
    }
  }

  if (params.bowlerId) {
    const bowler = state.teams.flatMap(t => t.players).find(p => p.id === params.bowlerId);
    if (bowler) {
      targetBall.bowlerId = bowler.id;
      targetBall.bowlerName = bowler.name;
    }
  }

  if (params.isPowerOver !== undefined) {
    targetBall.isPowerOver = params.isPowerOver;
  }

  if (params.outcomeType) {
    targetBall.outcomeType = params.outcomeType;
    targetBall.isWide = params.outcomeType === 'WIDE';
    targetBall.isNoBall = params.outcomeType === 'NO_BALL';
    targetBall.isBye = params.outcomeType === 'BYE';
    targetBall.isLegalDelivery = params.outcomeType !== 'WIDE' && params.outcomeType !== 'NO_BALL';
  }

  if (params.noBallType !== undefined) {
    targetBall.noBallType = params.noBallType;
    targetBall.isFreeHit = params.noBallType !== 'LEG_UPLIFT';
  }

  if (params.outcomeType === 'WICKET') {
    const defaultDeduction = targetBall.isPowerOver
      ? (params.isCatchByFemale ? -7 : -5)
      : (params.isCatchByFemale ? -4 : -2);
    const deduction = params.effectiveRuns !== undefined ? params.effectiveRuns : defaultDeduction;
    targetBall.effectiveRuns = deduction;
    const fielder = params.fielderId ? state.teams.flatMap(t => t.players).find(p => p.id === params.fielderId) : undefined;
    const assistedFielder = params.assistedFielderId ? state.teams.flatMap(t => t.players).find(p => p.id === params.assistedFielderId) : undefined;

    targetBall.dismissal = {
      type: params.dismissalType || targetBall.dismissal?.type || 'CAUGHT',
      dismissedPlayerId: targetBall.batsmanId,
      caughtByFemale: params.isCatchByFemale !== undefined ? params.isCatchByFemale : targetBall.dismissal?.caughtByFemale,
      fielderId: params.fielderId !== undefined ? params.fielderId : targetBall.dismissal?.fielderId,
      fielderName: fielder ? fielder.name : (params.fielderId === '' ? undefined : targetBall.dismissal?.fielderName),
      assistedFielderId: params.assistedFielderId !== undefined ? params.assistedFielderId : targetBall.dismissal?.assistedFielderId,
      assistedFielderName: assistedFielder ? assistedFielder.name : (params.assistedFielderId === '' ? undefined : targetBall.dismissal?.assistedFielderName),
      runOutType: params.runOutType || targetBall.dismissal?.runOutType,
      pointsDeducted: deduction,
    };
  } else if (params.effectiveRuns !== undefined) {
    targetBall.effectiveRuns = params.effectiveRuns;
    if (params.outcomeType) {
      targetBall.dismissal = undefined;
    }
  } else if (params.outcomeType) {
    targetBall.dismissal = undefined;
  }

  if (params.commentary) {
    targetBall.commentary = params.commentary;
  }

  recalculateInningsStats(targetInnings, match, state.teams);
  saveTournamentState(state);
  return { match, ball: targetBall };
}

/**
 * Delete a specific ball in any over
 */
export function deleteBall(params: {
  matchId: string;
  ballId: string;
  loginId?: string;
  userRole?: 'ADMIN' | 'SCORER';
}) {
  const state = getTournamentState();
  const match = state.matches.find(m => m.id === params.matchId);
  if (!match) throw new Error('Match not found');

  let targetBall: any;
  let targetInnings: Innings | undefined;
  for (const inn of match.innings) {
    targetBall = inn.balls.find(b => b.id === params.ballId);
    if (targetBall) {
      targetInnings = inn;
      break;
    }
  }

  if (!targetBall || !targetInnings) throw new Error('Ball not found');

  const role = params.userRole || (params.loginId?.toLowerCase() === 'admin' ? 'ADMIN' : 'SCORER');
  if (role === 'SCORER') {
    const innIdx = match.innings.indexOf(targetInnings);
    const inCurrentOver = isCurrentOver(targetInnings, targetBall.overNumber, innIdx, match.currentInningsIndex);
    if (!inCurrentOver) {
      throw new Error(`Permission Denied: Scorer '${params.loginId || 'Scorer'}' cannot delete balls from past overs (Over ${targetBall.overNumber}). Only Super Admin can modify past overs.`);
    }
  }

  const idx = targetInnings.balls.findIndex(b => b.id === params.ballId);
  if (idx >= 0) {
    targetInnings.balls.splice(idx, 1);
  }

  recalculateInningsStats(targetInnings, match, state.teams);
  saveTournamentState(state);
  return { match };
}
