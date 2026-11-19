import { Match, Team, TournamentRulesConfig } from '@/types/cricket';

export const OFFICIAL_TOURNAMENT_RULES: TournamentRulesConfig = {
  tournamentName: 'ADIOR STONE Presents KVO BOX CRICKET TOURNAMENT',
  leagueOvers: 8,
  semiFinalOvers: 9,
  playersPerTeam: 9,
  maxLeagueMatchesPerTeam: 3,
  mandatoryCompulsoryPlayers: {
    females: 2,
    seniors: 1,
    kids: 1,
    captain: 1,
  },
  battingRules: {
    oversPerPair: 2,
    femalePairOvers: [1, 2],
    seniorMinBalls: 6,
    juniorBatBeforeOver: 6,
    runsDeductionPerDismissal: 2,
    powerOverDismissalDeduction: 5,
    femaleCatchInPowerOverDeduction: 7,
  },
  bonusRules: {
    femaleRunsMultiplier: 2,
    femaleFourExtra: 1,
    femaleSixExtra: 2,
    seniorFourExtra: 1,
    seniorSixExtra: 2,
    kidFourExtra: 1,
    kidSixExtra: 2,
  },
  sideNetDeclarationRuns: {
    normalRuns: 1,
    femaleRuns: 2,
  },
};

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-royal-strikers',
    name: 'Royal Strikers',
    shortName: 'RS',
    color: '#3b82f6',
    players: [
      { id: 'rs-1', name: 'Aarav Shah', category: 'REGULAR', isCaptain: true },
      { id: 'rs-2', name: 'Pooja Mehta', category: 'FEMALE' },
      { id: 'rs-3', name: 'Kavita Patel', category: 'FEMALE' },
      { id: 'rs-4', name: 'Mansukhbhai Gada', category: 'SENIOR' },
      { id: 'rs-5', name: 'Devansh Savla', category: 'KID' },
      { id: 'rs-6', name: 'Jigar Gala', category: 'REGULAR' },
      { id: 'rs-7', name: 'Bhavin Chheda', category: 'REGULAR' },
      { id: 'rs-8', name: 'Ketan Vora', category: 'REGULAR' },
      { id: 'rs-9', name: 'Nirav Dedhia', category: 'REGULAR' },
    ],
  },
  {
    id: 'team-kutch-warriors',
    name: 'Kutch Warriors',
    shortName: 'KW',
    color: '#e11d48',
    players: [
      { id: 'kw-1', name: 'Paras Dedhia', category: 'REGULAR', isCaptain: true },
      { id: 'kw-2', name: 'Neha Vora', category: 'FEMALE' },
      { id: 'kw-3', name: 'Drashti Gala', category: 'FEMALE' },
      { id: 'kw-4', name: 'Ratilal Savla', category: 'SENIOR' },
      { id: 'kw-5', name: 'Veer Chheda', category: 'KID' },
      { id: 'kw-6', name: 'Ronak Shah', category: 'REGULAR' },
      { id: 'kw-7', name: 'Hiren Gada', category: 'REGULAR' },
      { id: 'kw-8', name: 'Tejas Patel', category: 'REGULAR' },
      { id: 'kw-9', name: 'Sagar Mehta', category: 'REGULAR' },
    ],
  },
  {
    id: 'team-adior-titans',
    name: 'Adior Titans',
    shortName: 'AT',
    color: '#8b5cf6',
    players: [
      { id: 'at-1', name: 'Kunal Savla', category: 'REGULAR', isCaptain: true },
      { id: 'at-2', name: 'Heena Shah', category: 'FEMALE' },
      { id: 'at-3', name: 'Rupal Gada', category: 'FEMALE' },
      { id: 'at-4', name: 'Damjibhai Chheda', category: 'SENIOR' },
      { id: 'at-5', name: 'Aayush Gala', category: 'KID' },
      { id: 'at-6', name: 'Samir Vora', category: 'REGULAR' },
      { id: 'at-7', name: 'Pratik Dedhia', category: 'REGULAR' },
      { id: 'at-8', name: 'Hardik Mehta', category: 'REGULAR' },
      { id: 'at-9', name: 'Darshan Patel', category: 'REGULAR' },
    ],
  },
  {
    id: 'team-box-blasters',
    name: 'Box Blasters',
    shortName: 'BB',
    color: '#10b981',
    players: [
      { id: 'bb-1', name: 'Chintan Gala', category: 'REGULAR', isCaptain: true },
      { id: 'bb-2', name: 'Bhoomi Savla', category: 'FEMALE' },
      { id: 'bb-3', name: 'Kinjal Dedhia', category: 'FEMALE' },
      { id: 'bb-4', name: 'Jayantilal Mehta', category: 'SENIOR' },
      { id: 'bb-5', name: 'Moksh Shah', category: 'KID' },
      { id: 'bb-6', name: 'Mayur Gada', category: 'REGULAR' },
      { id: 'bb-7', name: 'Amit Patel', category: 'REGULAR' },
      { id: 'bb-8', name: 'Vipul Chheda', category: 'REGULAR' },
      { id: 'bb-9', name: 'Sunny Vora', category: 'REGULAR' },
    ],
  },
  {
    id: 'team-super-challengers',
    name: 'Super Challengers',
    shortName: 'SC',
    color: '#f59e0b',
    players: [
      { id: 'sc-1', name: 'Dipen Mehta', category: 'REGULAR', isCaptain: true },
      { id: 'sc-2', name: 'Tanvi Gada', category: 'FEMALE' },
      { id: 'sc-3', name: 'Riddhi Shah', category: 'FEMALE' },
      { id: 'sc-4', name: 'Kantilal Vora', category: 'SENIOR' },
      { id: 'sc-5', name: 'Krish Savla', category: 'KID' },
      { id: 'sc-6', name: 'Alkesh Dedhia', category: 'REGULAR' },
      { id: 'sc-7', name: 'Prashant Gala', category: 'REGULAR' },
      { id: 'sc-8', name: 'Nikunj Chheda', category: 'REGULAR' },
      { id: 'sc-9', name: 'Gaurav Patel', category: 'REGULAR' },
    ],
  },
  {
    id: 'team-metro-smashers',
    name: 'Metro Smashers',
    shortName: 'MS',
    color: '#06b6d4',
    players: [
      { id: 'ms-1', name: 'Jayesh Chheda', category: 'REGULAR', isCaptain: true },
      { id: 'ms-2', name: 'Shraddha Patel', category: 'FEMALE' },
      { id: 'ms-3', name: 'Payal Vora', category: 'FEMALE' },
      { id: 'ms-4', name: 'Harakhchand Gala', category: 'SENIOR' },
      { id: 'ms-5', name: 'Vivaan Shah', category: 'KID' },
      { id: 'ms-6', name: 'Ritesh Savla', category: 'REGULAR' },
      { id: 'ms-7', name: 'Manoj Gada', category: 'REGULAR' },
      { id: 'ms-8', name: 'Tushar Dedhia', category: 'REGULAR' },
      { id: 'ms-9', name: 'Nilesh Mehta', category: 'REGULAR' },
    ],
  },
];

export function createInitialInnings(battingTeamId: string, bowlingTeamId: string, teamPlayers: Team[], playingPlayerIds?: string[]): Match['innings'][0] {
  const battingTeam = teamPlayers.find(t => t.id === battingTeamId);
  const bowlingTeam = teamPlayers.find(t => t.id === bowlingTeamId);

  const battingRoster = playingPlayerIds && playingPlayerIds.length > 0 
    ? (battingTeam?.players.filter(p => playingPlayerIds.includes(p.id)) || [])
    : (battingTeam?.players || []);

  const bowlingRoster = bowlingTeam?.players || [];

  // Female pair for Overs 1 & 2
  const femalePlayers = battingRoster.filter(p => p.category === 'FEMALE');
  const strikerId = femalePlayers[0]?.id || battingRoster[0]?.id || '';
  const nonStrikerId = femalePlayers[1]?.id || battingRoster[1]?.id || '';

  // Female bowler for Overs 1 & 2
  const bowlingFemales = bowlingRoster.filter(p => p.category === 'FEMALE');
  const currentBowlerId = bowlingFemales[0]?.id || bowlingRoster[0]?.id || '';

  const batsmanStats: Record<string, any> = {};
  battingTeam?.players.forEach(p => {
    batsmanStats[p.id] = {
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

  const bowlerStats: Record<string, any> = {};
  bowlingTeam?.players.forEach(p => {
    bowlerStats[p.id] = {
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

  return {
    battingTeamId,
    bowlingTeamId,
    totalRuns: 0,
    totalWickets: 0,
    completedOvers: 0,
    currentOverBalls: 0,
    balls: [],
    powerOverDeclaredNumber: 4,
    currentPair: {
      strikerId,
      nonStrikerId,
    },
    currentBowlerId,
    batsmanStats,
    bowlerStats,
    isCompleted: false,
  };
}

/**
 * 9 League Matches scheduled such that EACH TEAM PLAYS EXACTLY 3 MATCHES!
 * Matrix:
 * RS (plays KW, AT, BB) - 3
 * KW (plays RS, SC, MS) - 3
 * AT (plays BB, RS, SC) - 3
 * BB (plays AT, MS, RS) - 3
 * SC (plays MS, KW, AT) - 3
 * MS (plays SC, BB, KW) - 3
 */
export const INITIAL_MATCHES: Match[] = [
  // Round 1
  {
    id: 'match-1',
    stage: 'LEAGUE',
    teamAId: 'team-royal-strikers',
    teamBId: 'team-kutch-warriors',
    date: '2026-11-20',
    time: '18:00',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'LIVE',
    tossWinnerId: 'team-royal-strikers',
    tossDecision: 'BAT',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-royal-strikers', 'team-kutch-warriors', INITIAL_TEAMS),
      createInitialInnings('team-kutch-warriors', 'team-royal-strikers', INITIAL_TEAMS),
    ],
    notes: 'League Match 1 (8 overs)',
  },
  {
    id: 'match-2',
    stage: 'LEAGUE',
    teamAId: 'team-adior-titans',
    teamBId: 'team-box-blasters',
    date: '2026-11-20',
    time: '19:15',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-adior-titans', 'team-box-blasters', INITIAL_TEAMS),
      createInitialInnings('team-box-blasters', 'team-adior-titans', INITIAL_TEAMS),
    ],
    notes: 'League Match 2 (8 overs)',
  },
  {
    id: 'match-3',
    stage: 'LEAGUE',
    teamAId: 'team-super-challengers',
    teamBId: 'team-metro-smashers',
    date: '2026-11-20',
    time: '20:30',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-super-challengers', 'team-metro-smashers', INITIAL_TEAMS),
      createInitialInnings('team-metro-smashers', 'team-super-challengers', INITIAL_TEAMS),
    ],
    notes: 'League Match 3 (8 overs)',
  },

  // Round 2
  {
    id: 'match-4',
    stage: 'LEAGUE',
    teamAId: 'team-royal-strikers',
    teamBId: 'team-adior-titans',
    date: '2026-11-21',
    time: '18:00',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-royal-strikers', 'team-adior-titans', INITIAL_TEAMS),
      createInitialInnings('team-adior-titans', 'team-royal-strikers', INITIAL_TEAMS),
    ],
    notes: 'League Match 4 (8 overs)',
  },
  {
    id: 'match-5',
    stage: 'LEAGUE',
    teamAId: 'team-kutch-warriors',
    teamBId: 'team-super-challengers',
    date: '2026-11-21',
    time: '19:15',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-kutch-warriors', 'team-super-challengers', INITIAL_TEAMS),
      createInitialInnings('team-super-challengers', 'team-kutch-warriors', INITIAL_TEAMS),
    ],
    notes: 'League Match 5 (8 overs)',
  },
  {
    id: 'match-6',
    stage: 'LEAGUE',
    teamAId: 'team-box-blasters',
    teamBId: 'team-metro-smashers',
    date: '2026-11-21',
    time: '20:30',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-box-blasters', 'team-metro-smashers', INITIAL_TEAMS),
      createInitialInnings('team-metro-smashers', 'team-box-blasters', INITIAL_TEAMS),
    ],
    notes: 'League Match 6 (8 overs)',
  },

  // Round 3
  {
    id: 'match-7',
    stage: 'LEAGUE',
    teamAId: 'team-royal-strikers',
    teamBId: 'team-box-blasters',
    date: '2026-11-22',
    time: '14:00',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-royal-strikers', 'team-box-blasters', INITIAL_TEAMS),
      createInitialInnings('team-box-blasters', 'team-royal-strikers', INITIAL_TEAMS),
    ],
    notes: 'League Match 7 (8 overs)',
  },
  {
    id: 'match-8',
    stage: 'LEAGUE',
    teamAId: 'team-kutch-warriors',
    teamBId: 'team-metro-smashers',
    date: '2026-11-22',
    time: '15:15',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-kutch-warriors', 'team-metro-smashers', INITIAL_TEAMS),
      createInitialInnings('team-metro-smashers', 'team-kutch-warriors', INITIAL_TEAMS),
    ],
    notes: 'League Match 8 (8 overs)',
  },
  {
    id: 'match-9',
    stage: 'LEAGUE',
    teamAId: 'team-adior-titans',
    teamBId: 'team-super-challengers',
    date: '2026-11-22',
    time: '16:30',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-adior-titans', 'team-super-challengers', INITIAL_TEAMS),
      createInitialInnings('team-super-challengers', 'team-adior-titans', INITIAL_TEAMS),
    ],
    notes: 'League Match 9 (8 overs)',
  },

  // Playoff: Top 4 Advance to Semifinals
  // Semi-Final 1: Rank 1 vs Rank 4
  {
    id: 'match-semi-1',
    stage: 'SEMI_FINAL',
    teamAId: 'team-royal-strikers', // Rank 1
    teamBId: 'team-box-blasters', // Rank 4
    date: '2026-11-22',
    time: '18:00',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 9,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-royal-strikers', 'team-box-blasters', INITIAL_TEAMS),
      createInitialInnings('team-box-blasters', 'team-royal-strikers', INITIAL_TEAMS),
    ],
    notes: 'Semi-Final 1: Rank 1 vs Rank 4 (9 overs)',
  },

  // Semi-Final 2: Rank 2 vs Rank 3
  {
    id: 'match-semi-2',
    stage: 'SEMI_FINAL',
    teamAId: 'team-kutch-warriors', // Rank 2
    teamBId: 'team-adior-titans', // Rank 3
    date: '2026-11-22',
    time: '19:15',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 9,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-kutch-warriors', 'team-adior-titans', INITIAL_TEAMS),
      createInitialInnings('team-adior-titans', 'team-kutch-warriors', INITIAL_TEAMS),
    ],
    notes: 'Semi-Final 2: Rank 2 vs Rank 3 (9 overs)',
  },

  // Grand Final: Winner SF1 vs Winner SF2
  {
    id: 'match-final',
    stage: 'FINAL',
    teamAId: 'team-royal-strikers',
    teamBId: 'team-kutch-warriors',
    date: '2026-11-22',
    time: '20:45',
    boxVenue: 'Decathlon Turf Arena - Main Box',
    totalOvers: 9,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-royal-strikers', 'team-kutch-warriors', INITIAL_TEAMS),
      createInitialInnings('team-kutch-warriors', 'team-royal-strikers', INITIAL_TEAMS),
    ],
    notes: 'GRAND FINAL: Winner SF1 vs Winner SF2 (9 overs)',
  },
];
