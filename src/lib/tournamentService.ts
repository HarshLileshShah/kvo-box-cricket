import fs from 'fs';
import path from 'path';
import { Match, Team, MatchStatus, Innings, TournamentRulesConfig, BallOutcomeType, DismissalType, PlayerCategory } from '@/types/cricket';
import { INITIAL_TEAMS, INITIAL_MATCHES, OFFICIAL_TOURNAMENT_RULES, createInitialInnings } from './mockData';
import { calculateBallOutcome } from './rulesEngine';

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
  globalThis.__tournamentState = state;
}

export function getTournamentState(): TournamentState {
  if (globalThis.__tournamentState) {
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
  saveTournamentState(fallback);
  return fallback;
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
  extraBatRunsOnNoBall?: number;
  noBallType?: 'NORMAL' | 'LEG_UPLIFT';
  newStrikerId?: string;
  newNonStrikerId?: string;
  newBowlerId?: string;
  powerOverDeclaredNumber?: number;
}) {
  const state = getTournamentState();
  const matchIndex = state.matches.findIndex(m => m.id === params.matchId);
  if (matchIndex === -1) throw new Error('Match not found');

  const match = state.matches[matchIndex];

  // Guard: Cannot score semifinals or finals before all league matches are finished
  if (match.stage === 'SEMI_FINAL' || match.stage === 'FINAL') {
    const incompleteLeague = state.matches.filter(m => m.stage === 'LEAGUE' && m.status !== 'COMPLETED');
    if (incompleteLeague.length > 0) {
      throw new Error(`Cannot score semifinals! All ${state.matches.filter(m => m.stage === 'LEAGUE').length} league matches must be completed first.`);
    }
  }

  const inn = match.innings[match.currentInningsIndex];
  if (inn.isCompleted) throw new Error('Innings is already completed');

  if (params.powerOverDeclaredNumber) {
    inn.powerOverDeclaredNumber = params.powerOverDeclaredNumber;
  }

  const battingTeam = state.teams.find(t => t.id === inn.battingTeamId);
  const bowlingTeam = state.teams.find(t => t.id === inn.bowlingTeamId);

  const currentOverNumber = inn.completedOvers + 1;
  const isPowerOver = inn.powerOverDeclaredNumber === currentOverNumber;

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
  });

  const ballNumber = calc.isLegalDelivery ? inn.currentOverBalls + 1 : inn.currentOverBalls;

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
          pointsDeducted: calc.effectiveTeamRuns,
        }
      : undefined,
    commentary: calc.commentary,
    timestamp: new Date().toISOString(),
  };

  inn.balls.push(ballRecord);

  // Update total runs (allows negative score when dismissed at 0!)
  inn.totalRuns = inn.totalRuns + calc.effectiveTeamRuns;

  if (calc.isWicket) {
    inn.totalWickets += 1;
  }

  // Update Batsman Stats
  if (striker && inn.batsmanStats[striker.id]) {
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
  if (bowler && inn.bowlerStats[bowler.id]) {
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

    if (calc.rawRuns === 1 || calc.rawRuns === 3) {
      const temp = inn.currentPair.strikerId;
      inn.currentPair.strikerId = inn.currentPair.nonStrikerId;
      inn.currentPair.nonStrikerId = temp;
    }

    if (inn.currentOverBalls >= 6) {
      inn.completedOvers += 1;
      inn.currentOverBalls = 0;

      const temp = inn.currentPair.strikerId;
      inn.currentPair.strikerId = inn.currentPair.nonStrikerId;
      inn.currentPair.nonStrikerId = temp;

      if (inn.completedOvers >= match.totalOvers) {
        inn.isCompleted = true;
        if (match.currentInningsIndex === 0) {
          match.currentInningsIndex = 1;
        } else {
          match.status = 'COMPLETED';
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

  if (params.newStrikerId) inn.currentPair.strikerId = params.newStrikerId;
  if (params.newNonStrikerId) inn.currentPair.nonStrikerId = params.newNonStrikerId;
  if (params.newBowlerId) inn.currentBowlerId = params.newBowlerId;

  if (match.currentInningsIndex === 1 && !inn.isCompleted) {
    const target = match.innings[0].totalRuns + 1;
    if (inn.totalRuns >= target) {
      inn.isCompleted = true;
      match.status = 'COMPLETED';
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
}) {
  const state = getTournamentState();
  const match = state.matches.find(m => m.id === params.matchId);
  if (!match) throw new Error('Match not found');

  const inn = match.innings[match.currentInningsIndex];
  if (params.strikerId) inn.currentPair.strikerId = params.strikerId;
  if (params.nonStrikerId) inn.currentPair.nonStrikerId = params.nonStrikerId;
  if (params.bowlerId) inn.currentBowlerId = params.bowlerId;
  if (params.powerOverDeclaredNumber) inn.powerOverDeclaredNumber = params.powerOverDeclaredNumber;

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
  saveTournamentState(state);
  return state.teams;
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

  // Guard: all league matches must be completed
  const incompleteLeague = state.matches.filter(m => m.stage === 'LEAGUE' && m.status !== 'COMPLETED');
  if (incompleteLeague.length > 0) {
    throw new Error(`Cannot finalize Semifinals! ${incompleteLeague.length} league matches are still remaining.`);
  }

  const semi1 = state.matches.find(m => m.id === 'match-semi-1');
  const semi2 = state.matches.find(m => m.id === 'match-semi-2');
  const finalMatch = state.matches.find(m => m.id === 'match-final');

  if (semi1) {
    semi1.teamAId = params.semi1TeamAId;
    semi1.teamBId = params.semi1TeamBId;
    semi1.innings = [
      createInitialInnings(params.semi1TeamAId, params.semi1TeamBId, state.teams),
      createInitialInnings(params.semi1TeamBId, params.semi1TeamAId, state.teams),
    ];
  }

  if (semi2) {
    semi2.teamAId = params.semi2TeamAId;
    semi2.teamBId = params.semi2TeamBId;
    semi2.innings = [
      createInitialInnings(params.semi2TeamAId, params.semi2TeamBId, state.teams),
      createInitialInnings(params.semi2TeamBId, params.semi2TeamAId, state.teams),
    ];
  }

  if (finalMatch && params.finalTeamAId && params.finalTeamBId) {
    finalMatch.teamAId = params.finalTeamAId;
    finalMatch.teamBId = params.finalTeamBId;
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

  // Guard against starting semifinals if league matches are not done
  if ((match.stage === 'SEMI_FINAL' || match.stage === 'FINAL') && params.status === 'LIVE') {
    const incomplete = state.matches.filter(m => m.stage === 'LEAGUE' && m.status !== 'COMPLETED');
    if (incomplete.length > 0) {
      throw new Error(`Cannot start Semifinals! All ${state.matches.filter(m => m.stage === 'LEAGUE').length} league matches must be completed first.`);
    }
  }

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

  if (params.effectiveRuns !== undefined) {
    targetBall.effectiveRuns = params.effectiveRuns;
  }

  if (params.commentary) {
    targetBall.commentary = params.commentary;
  }

  if (params.outcomeType === 'WICKET') {
    const deduction = targetBall.isPowerOver
      ? (params.isCatchByFemale ? -7 : -5)
      : (params.isCatchByFemale ? -4 : -2);
    targetBall.effectiveRuns = deduction;
    targetBall.dismissal = {
      type: params.dismissalType || 'CAUGHT',
      dismissedPlayerId: targetBall.batsmanId,
      caughtByFemale: params.isCatchByFemale,
      pointsDeducted: deduction,
    };
  } else if (params.outcomeType) {
    targetBall.dismissal = undefined;
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
}) {
  const state = getTournamentState();
  const match = state.matches.find(m => m.id === params.matchId);
  if (!match) throw new Error('Match not found');

  let targetInnings: Innings | undefined;
  for (const inn of match.innings) {
    const idx = inn.balls.findIndex(b => b.id === params.ballId);
    if (idx >= 0) {
      inn.balls.splice(idx, 1);
      targetInnings = inn;
      break;
    }
  }

  if (!targetInnings) throw new Error('Ball not found');

  recalculateInningsStats(targetInnings, match, state.teams);
  saveTournamentState(state);
  return { match };
}
