export type UserRole = 'ADMIN' | 'SCORER';

export interface AuthUser {
  loginId: string;
  name: string;
  role: UserRole;
}

export type PlayerCategory = 'FEMALE' | 'SENIOR' | 'KID' | 'REGULAR';

export interface Player {
  id: string;
  name: string;
  category: PlayerCategory;
  isCaptain?: boolean;
  phone?: string;
  jerseyNumber?: string;
  jerseyName?: string;
  tShirtSize?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logoUrl?: string;
  players: Player[];
  group?: string; // Optional legacy
}

export type BallOutcomeType = 
  | 'DOT' 
  | 'RUN_1' 
  | 'RUN_2' 
  | 'RUN_3' 
  | 'FOUR' 
  | 'SIX' 
  | 'DECLARATION_1D' 
  | 'WIDE' 
  | 'NO_BALL' 
  | 'BYE' 
  | 'WICKET';

export type DismissalType = 
  | 'BOWLED' 
  | 'CAUGHT' 
  | 'RUN_OUT' 
  | 'STUMPED' 
  | 'HIT_WICKET';

export interface BallRecord {
  id: string;
  ballNumber: number; // 1 to 6 in over
  overNumber: number; // 1-indexed (1 to 8, or 1 to 9 in semis/finals)
  batsmanId: string;
  batsmanName: string;
  batsmanCategory: PlayerCategory;
  nonStrikerId: string;
  bowlerId: string;
  bowlerName: string;
  isPowerOver: boolean;
  outcomeType: BallOutcomeType;
  rawRuns: number; // base runs scored (e.g. 1, 2, 4, 6)
  effectiveRuns: number; // calculated runs added or deducted (e.g. -2 for wicket, 14 for female six)
  isLegalDelivery: boolean; // false for wide / no-ball
  isFreeHit: boolean;
  isWide?: boolean;
  isNoBall?: boolean;
  noBallType?: 'NORMAL' | 'LEG_UPLIFT';
  isBye?: boolean;
  dismissal?: {
    type: DismissalType;
    dismissedPlayerId: string;
    caughtByFemale?: boolean;
    fielderName?: string;
    fielderId?: string;
    assistedFielderId?: string;
    assistedFielderName?: string;
    runOutType?: 'DIRECT' | 'ASSISTED';
    pointsDeducted: number; // e.g. -2 normal, -5 power, -7 if caught by female in power over
  };
  commentary: string;
  timestamp: string;
}

export interface BattingPair {
  pairNumber: number;
  strikerId: string;
  nonStrikerId: string;
}

export interface BatsmanInningsStats {
  playerId: string;
  name: string;
  category: PlayerCategory;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  dismissalsCount: number;
  isRetired?: boolean;
}

export interface BowlerInningsStats {
  playerId: string;
  name: string;
  oversBowled: number;
  legalBalls: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
}

export interface Innings {
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  completedOvers: number;
  currentOverBalls: number;
  balls: BallRecord[];
  powerOverDeclaredNumber?: number;
  powerOverOptedOut?: boolean;
  startedAt?: string;
  completedAt?: string;
  currentPair: {
    strikerId: string;
    nonStrikerId: string;
  };
  currentBowlerId: string;
  batsmanStats: Record<string, BatsmanInningsStats>;
  bowlerStats: Record<string, BowlerInningsStats>;
  isCompleted: boolean;
}

export type MatchStage = 'LEAGUE' | 'SEMI_FINAL' | 'FINAL';
export type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'TIED';

export interface Match {
  id: string;
  stage: MatchStage;
  teamAId: string;
  teamBId: string;
  date: string;
  time: string;
  boxVenue?: string;
  totalOvers: number; // 8 for league, 9 for semis/finals
  status: MatchStatus;
  tossWinnerId?: string;
  tossDecision?: 'BAT' | 'BOWL';
  currentInningsIndex: 0 | 1;
  innings: [Innings, Innings];
  winnerId?: string;
  superOverRequired?: boolean;
  notes?: string;
  teamAPlaying8Ids?: string[];
  teamBPlaying8Ids?: string[];
  lineupSubmitted?: boolean;
  startedAt?: string;
  completedAt?: string;
  group?: string; // Optional legacy
}

export interface LeagueStanding {
  rank?: number;
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  totalRunsScored: number;
  totalOversBatted: number;
  totalRunsConceded: number;
  totalOversBowled: number;
  netRunRate: number;
  isQualifiedForSemis?: boolean;
}

export interface TournamentRulesConfig {
  tournamentName: string;
  leagueOvers: number;
  semiFinalOvers: number;
  playersPerTeam: number;
  maxLeagueMatchesPerTeam: number;
  mandatoryCompulsoryPlayers: {
    females: number;
    seniors: number;
    kids: number;
    captain: number;
  };
  battingRules: {
    oversPerPair: number;
    femalePairOvers: [number, number];
    seniorMinBalls: number;
    juniorBatBeforeOver: number;
    runsDeductionPerDismissal: number;
    powerOverDismissalDeduction: number;
    femaleCatchInPowerOverDeduction: number;
  };
  bonusRules: {
    femaleRunsMultiplier: number;
    femaleFourExtra: number;
    femaleSixExtra: number;
    seniorFourExtra: number;
    seniorSixExtra: number;
    kidFourExtra: number;
    kidSixExtra: number;
  };
  sideNetDeclarationRuns: {
    normalRuns: number;
    femaleRuns: number;
  };
}

/**
 * Individual Performance Points as per KVO Box Cricket 2026 scoring rules
 */
export interface PlayerPerformancePoints {
  playerId: string;
  name: string;
  teamId: string;
  teamName: string;
  category: PlayerCategory;
  matchesPlayed: number;

  // Batting (Every actual run = 1, Four = +2 bonus, Six = +3 bonus, 1D = 1, 2D = 2, Dismissal = -5, Dot = 0)
  actualRunsScored: number;
  foursCount: number;
  sixesCount: number;
  dismissalsCount: number;
  battingPoints: number;

  // Bowling (Wicket excl. run-outs = 10, Dot = 2, Wide = -2, No-ball = -2, Actual run off bat = -0.5)
  wicketsCount: number; // excluding run-outs
  dotBallsCount: number;
  widesCount: number;
  noBallsCount: number;
  runsConcededOffBat: number;
  bowlingPoints: number;

  // Fielding (Catch = 5, Direct run-out = 8, Assisted run-out = 4 each, Stumping = 5)
  catchesCount: number;
  directRunOutsCount: number;
  assistedRunOutsCount: number;
  stumpingsCount: number;
  fieldingPoints: number;

  // Total
  totalPoints: number;

  // Match Honors
  potmCount: number;
}

export interface CategoryAwardsSummary {
  bestMale: PlayerPerformancePoints | null;
  bestFemale: PlayerPerformancePoints | null;
  bestKid: PlayerPerformancePoints | null;
  bestSenior: PlayerPerformancePoints | null;
}
