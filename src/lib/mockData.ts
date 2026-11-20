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
    id: 'team-party-hunterz-warriors',
    name: 'Party Hunterz Warriors',
    shortName: 'PHW',
    color: '#3b82f6',
    players: [
      { id: 'phw-1', name: 'Yuven Gala', category: 'KID', jerseyNumber: '01', jerseyName: 'Yuven', tShirtSize: 'S' },
      { id: 'phw-2', name: 'Aarthi Gala', category: 'FEMALE', jerseyNumber: '14', jerseyName: 'Aarthi', tShirtSize: 'XS' },
      { id: 'phw-3', name: 'Viral Savla', category: 'FEMALE', jerseyNumber: '09', jerseyName: 'Viral', tShirtSize: '3XL' },
      { id: 'phw-4', name: 'Punit Gala', category: 'REGULAR', jerseyNumber: '43', jerseyName: 'PS', tShirtSize: 'XL' },
      { id: 'phw-5', name: 'Chetan Gada', category: 'REGULAR', jerseyNumber: '11', jerseyName: 'Chetan', tShirtSize: 'L' },
      { id: 'phw-6', name: 'Vicky Chheda', category: 'REGULAR', jerseyNumber: '22', jerseyName: 'VICKY', tShirtSize: 'L' },
      { id: 'phw-7', name: 'Mahek Bheda', category: 'REGULAR', jerseyNumber: '', jerseyName: '', tShirtSize: '' },
      { id: 'phw-8', name: 'Sushil Sangoi', category: 'REGULAR', jerseyNumber: '04', jerseyName: 'SBS', tShirtSize: 'XL' },
      { id: 'phw-9', name: 'Jinay Sangoi', category: 'REGULAR', isCaptain: true, jerseyNumber: '15', jerseyName: 'Jinay', tShirtSize: 'M' },
    ],
  },
  {
    id: 'team-amsteel-inferno',
    name: 'Amsteel Inferno',
    shortName: 'AI',
    color: '#ef4444',
    players: [
      { id: 'ai-1', name: 'Naman Gala', category: 'KID', jerseyNumber: '07', jerseyName: 'Naman', tShirtSize: 'XS' },
      { id: 'ai-2', name: 'Khushboo Gala', category: 'FEMALE', jerseyNumber: '09', jerseyName: 'Khushboo', tShirtSize: 'M' },
      { id: 'ai-3', name: 'Avni Gala', category: 'FEMALE', jerseyNumber: '', jerseyName: '', tShirtSize: '' },
      { id: 'ai-4', name: 'Nainik Shah', category: 'REGULAR', jerseyNumber: '15', jerseyName: 'Nainik Shah', tShirtSize: 'M' },
      { id: 'ai-5', name: 'Harsh Shah', category: 'REGULAR', jerseyNumber: '06', jerseyName: 'Harsh', tShirtSize: '3XL' },
      { id: 'ai-6', name: 'Zeel Gala', category: 'REGULAR', jerseyNumber: '07', jerseyName: 'Zeel', tShirtSize: 'L' },
      { id: 'ai-7', name: 'Punit Shah', category: 'REGULAR', jerseyNumber: '16', jerseyName: 'Punit', tShirtSize: 'L' },
      { id: 'ai-8', name: 'Nirint Nagda', category: 'REGULAR', jerseyNumber: '04', jerseyName: 'Nirint', tShirtSize: 'M' },
      { id: 'ai-9', name: 'Ankit Shah', category: 'REGULAR', isCaptain: true, jerseyNumber: '06', jerseyName: 'Ankit', tShirtSize: 'L' },
    ],
  },
  {
    id: 'team-kraftech-titans',
    name: 'Kraftech Titans',
    shortName: 'KT',
    color: '#8b5cf6',
    players: [
      { id: 'kt-1', name: 'Vihaan Gada', category: 'KID', jerseyNumber: '28', jerseyName: 'Vihaan', tShirtSize: 'S' },
      { id: 'kt-2', name: 'Noopur Dedhia', category: 'FEMALE', jerseyNumber: '18', jerseyName: 'Noopur', tShirtSize: 'S' },
      { id: 'kt-3', name: 'Ekta Vira', category: 'FEMALE', jerseyNumber: '18', jerseyName: 'Vira', tShirtSize: 'M' },
      { id: 'kt-4', name: 'Mayur Chhadva', category: 'REGULAR', jerseyNumber: '12', jerseyName: 'PM', tShirtSize: 'XL' },
      { id: 'kt-5', name: 'Koushal Gada', category: 'REGULAR', jerseyNumber: '23', jerseyName: 'Koushal', tShirtSize: 'L' },
      { id: 'kt-6', name: 'Darshan Sawla', category: 'REGULAR', jerseyNumber: '25', jerseyName: 'DS', tShirtSize: 'L' },
      { id: 'kt-7', name: 'Parth Gangar', category: 'REGULAR', jerseyNumber: '24', jerseyName: 'Parth', tShirtSize: 'XXL' },
      { id: 'kt-8', name: 'Rajnikant Dedhia', category: 'REGULAR', jerseyNumber: '24', jerseyName: 'RAJ', tShirtSize: 'M' },
      { id: 'kt-9', name: 'Vicky Gangar', category: 'REGULAR', isCaptain: true, jerseyNumber: '18', jerseyName: 'Vicky', tShirtSize: 'L' },
    ],
  },
  {
    id: 'team-leofans-fanatics',
    name: 'LeoFans Fanatics',
    shortName: 'LF',
    color: '#f59e0b',
    players: [
      { id: 'lf-1', name: 'Hardik Phuria', category: 'KID', jerseyNumber: '33', jerseyName: 'HARDIK P', tShirtSize: 'L' },
      { id: 'lf-2', name: 'Dia Vira', category: 'FEMALE', jerseyNumber: '16', jerseyName: 'Dia', tShirtSize: 'S' },
      { id: 'lf-3', name: 'Ankita Dedhiya', category: 'FEMALE', jerseyNumber: '9', jerseyName: 'ANKITA', tShirtSize: 'L' },
      { id: 'lf-4', name: 'Arnav Vira', category: 'REGULAR', jerseyNumber: '12', jerseyName: 'Ari', tShirtSize: 'L' },
      { id: 'lf-5', name: 'Suryakumar Dedhiya', category: 'REGULAR', jerseyNumber: '01', jerseyName: 'SURYA', tShirtSize: 'L' },
      { id: 'lf-6', name: 'Pavan Savla', category: 'REGULAR', jerseyNumber: '25', jerseyName: 'Pavan', tShirtSize: 'XL' },
      { id: 'lf-7', name: 'Pratik Savla', category: 'REGULAR', jerseyNumber: '13', jerseyName: 'Prats', tShirtSize: 'M' },
      { id: 'lf-8', name: 'Jayesh Gala', category: 'REGULAR', jerseyNumber: '09', jerseyName: 'Jayesh', tShirtSize: 'L' },
      { id: 'lf-9', name: 'Jay Shah', category: 'REGULAR', isCaptain: true, jerseyNumber: '04', jerseyName: 'Jay', tShirtSize: 'XXL' },
    ],
  },
  {
    id: 'team-truflo-strikers',
    name: 'Truflo Strikers',
    shortName: 'TS',
    color: '#06b6d4',
    players: [
      { id: 'ts-1', name: 'Riyan Jigar Dedhia', category: 'KID', jerseyNumber: '14', jerseyName: 'RIYAN', tShirtSize: 'M' },
      { id: 'ts-2', name: 'Priyal Gada', category: 'FEMALE', jerseyNumber: '20', jerseyName: 'Priyal', tShirtSize: 'XL' },
      { id: 'ts-3', name: 'Kiran Dedhia', category: 'FEMALE', jerseyNumber: '19', jerseyName: 'Kiran', tShirtSize: '3XL' },
      { id: 'ts-4', name: 'Manthan Deepak Gala', category: 'REGULAR', jerseyNumber: '45', jerseyName: 'Manthan', tShirtSize: 'M' },
      { id: 'ts-5', name: 'Aditya Savla', category: 'REGULAR', jerseyNumber: '19', jerseyName: 'Savla', tShirtSize: 'L' },
      { id: 'ts-6', name: 'Umang J Gala', category: 'REGULAR', jerseyNumber: '26', jerseyName: 'Umang', tShirtSize: 'XXL' },
      { id: 'ts-7', name: 'Neel Visaria', category: 'REGULAR', jerseyNumber: '15', jerseyName: 'Neel', tShirtSize: 'L' },
      { id: 'ts-8', name: 'Deepak Vira', category: 'REGULAR', jerseyNumber: '12', jerseyName: 'Deepak', tShirtSize: 'XL' },
      { id: 'ts-9', name: 'Vishal Gala', category: 'REGULAR', isCaptain: true, jerseyNumber: '07', jerseyName: 'Vishal', tShirtSize: 'L' },
    ],
  },
  {
    id: 'team-mavericks',
    name: 'Mavericks',
    shortName: 'MAV',
    color: '#10b981',
    players: [
      { id: 'mav-1', name: 'Nihaar Chheda', category: 'KID', jerseyNumber: '09', jerseyName: 'Nihaar Chheda', tShirtSize: 'S' },
      { id: 'mav-2', name: 'Punyata Chhadva', category: 'FEMALE', jerseyNumber: '18', jerseyName: 'PM', tShirtSize: 'M' },
      { id: 'mav-3', name: 'Rupa Savla', category: 'FEMALE', jerseyNumber: '10', jerseyName: 'Rupa', tShirtSize: 'L' },
      { id: 'mav-4', name: 'Gautam Gala', category: 'REGULAR', jerseyNumber: '09', jerseyName: 'Gautam', tShirtSize: 'XL' },
      { id: 'mav-5', name: 'Mahek RV', category: 'REGULAR', jerseyNumber: '18', jerseyName: 'Mahek', tShirtSize: 'L' },
      { id: 'mav-6', name: 'Vaibhav Dedhia', category: 'REGULAR', jerseyNumber: '01', jerseyName: 'Vaibhav', tShirtSize: 'L' },
      { id: 'mav-7', name: 'Krishabh Gala', category: 'REGULAR', jerseyNumber: '24', jerseyName: 'Krishabh K Gala', tShirtSize: 'L' },
      { id: 'mav-8', name: 'Tarun Nagda', category: 'REGULAR', jerseyNumber: '05', jerseyName: 'TARUN', tShirtSize: 'XL' },
      { id: 'mav-9', name: 'Kevin Karani', category: 'REGULAR', isCaptain: true, jerseyNumber: '17', jerseyName: 'Kevin', tShirtSize: 'L' },
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
    teamAId: 'team-party-hunterz-warriors',
    teamBId: 'team-amsteel-inferno',
    date: '2026-11-20',
    time: '18:00',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'LIVE',
    tossWinnerId: 'team-party-hunterz-warriors',
    tossDecision: 'BAT',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-party-hunterz-warriors', 'team-amsteel-inferno', INITIAL_TEAMS),
      createInitialInnings('team-amsteel-inferno', 'team-party-hunterz-warriors', INITIAL_TEAMS),
    ],
    notes: 'League Match 1 (8 overs)',
  },
  {
    id: 'match-2',
    stage: 'LEAGUE',
    teamAId: 'team-kraftech-titans',
    teamBId: 'team-leofans-fanatics',
    date: '2026-11-20',
    time: '19:15',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-kraftech-titans', 'team-leofans-fanatics', INITIAL_TEAMS),
      createInitialInnings('team-leofans-fanatics', 'team-kraftech-titans', INITIAL_TEAMS),
    ],
    notes: 'League Match 2 (8 overs)',
  },
  {
    id: 'match-3',
    stage: 'LEAGUE',
    teamAId: 'team-truflo-strikers',
    teamBId: 'team-mavericks',
    date: '2026-11-20',
    time: '20:30',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-truflo-strikers', 'team-mavericks', INITIAL_TEAMS),
      createInitialInnings('team-mavericks', 'team-truflo-strikers', INITIAL_TEAMS),
    ],
    notes: 'League Match 3 (8 overs)',
  },

  // Round 2
  {
    id: 'match-4',
    stage: 'LEAGUE',
    teamAId: 'team-party-hunterz-warriors',
    teamBId: 'team-kraftech-titans',
    date: '2026-11-21',
    time: '18:00',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-party-hunterz-warriors', 'team-kraftech-titans', INITIAL_TEAMS),
      createInitialInnings('team-kraftech-titans', 'team-party-hunterz-warriors', INITIAL_TEAMS),
    ],
    notes: 'League Match 4 (8 overs)',
  },
  {
    id: 'match-5',
    stage: 'LEAGUE',
    teamAId: 'team-amsteel-inferno',
    teamBId: 'team-truflo-strikers',
    date: '2026-11-21',
    time: '19:15',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-amsteel-inferno', 'team-truflo-strikers', INITIAL_TEAMS),
      createInitialInnings('team-truflo-strikers', 'team-amsteel-inferno', INITIAL_TEAMS),
    ],
    notes: 'League Match 5 (8 overs)',
  },
  {
    id: 'match-6',
    stage: 'LEAGUE',
    teamAId: 'team-leofans-fanatics',
    teamBId: 'team-mavericks',
    date: '2026-11-21',
    time: '20:30',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-leofans-fanatics', 'team-mavericks', INITIAL_TEAMS),
      createInitialInnings('team-mavericks', 'team-leofans-fanatics', INITIAL_TEAMS),
    ],
    notes: 'League Match 6 (8 overs)',
  },

  // Round 3
  {
    id: 'match-7',
    stage: 'LEAGUE',
    teamAId: 'team-party-hunterz-warriors',
    teamBId: 'team-leofans-fanatics',
    date: '2026-11-22',
    time: '14:00',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-party-hunterz-warriors', 'team-leofans-fanatics', INITIAL_TEAMS),
      createInitialInnings('team-leofans-fanatics', 'team-party-hunterz-warriors', INITIAL_TEAMS),
    ],
    notes: 'League Match 7 (8 overs)',
  },
  {
    id: 'match-8',
    stage: 'LEAGUE',
    teamAId: 'team-amsteel-inferno',
    teamBId: 'team-mavericks',
    date: '2026-11-22',
    time: '15:15',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-amsteel-inferno', 'team-mavericks', INITIAL_TEAMS),
      createInitialInnings('team-mavericks', 'team-amsteel-inferno', INITIAL_TEAMS),
    ],
    notes: 'League Match 8 (8 overs)',
  },
  {
    id: 'match-9',
    stage: 'LEAGUE',
    teamAId: 'team-kraftech-titans',
    teamBId: 'team-truflo-strikers',
    date: '2026-11-22',
    time: '16:30',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-kraftech-titans', 'team-truflo-strikers', INITIAL_TEAMS),
      createInitialInnings('team-truflo-strikers', 'team-kraftech-titans', INITIAL_TEAMS),
    ],
    notes: 'League Match 9 (8 overs)',
  },

  // Playoff: Top 4 Advance to Semifinals (TBD after league stage)
  // Semi-Final 1: Rank 1 vs Rank 4
  {
    id: 'match-semi-1',
    stage: 'SEMI_FINAL',
    teamAId: '',
    teamBId: '',
    date: '2026-11-22',
    time: '18:00',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 9,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('', '', INITIAL_TEAMS),
      createInitialInnings('', '', INITIAL_TEAMS),
    ],
    notes: 'Semi-Final 1: Rank 1 vs Rank 4 (TBD after league stage)',
  },

  // Semi-Final 2: Rank 2 vs Rank 3
  {
    id: 'match-semi-2',
    stage: 'SEMI_FINAL',
    teamAId: '',
    teamBId: '',
    date: '2026-11-22',
    time: '19:15',
    boxVenue: 'Decathlon Turf Arena - Box 1',
    totalOvers: 9,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('', '', INITIAL_TEAMS),
      createInitialInnings('', '', INITIAL_TEAMS),
    ],
    notes: 'Semi-Final 2: Rank 2 vs Rank 3 (TBD after league stage)',
  },

  // Grand Final: Winner SF1 vs Winner SF2
  {
    id: 'match-final',
    stage: 'FINAL',
    teamAId: '',
    teamBId: '',
    date: '2026-11-22',
    time: '20:45',
    boxVenue: 'Decathlon Turf Arena - Main Box',
    totalOvers: 9,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('', '', INITIAL_TEAMS),
      createInitialInnings('', '', INITIAL_TEAMS),
    ],
    notes: 'GRAND FINAL: Winner SF1 vs Winner SF2 (TBD after semifinals)',
  },
];
