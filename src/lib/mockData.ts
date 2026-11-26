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
    name: 'Party Hunterz',
    shortName: 'PH',
    color: '#3b82f6',
    logoUrl: '/logos/party-hunterz.png',
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
    logoUrl: '/logos/amsteel-inferno.png',
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
    color: '#f59e0b',
    logoUrl: '/logos/kraftech-titans.png',
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
    name: 'Leo Fanatics',
    shortName: 'LF',
    color: '#eab308',
    logoUrl: '/logos/leo-fanatics.png',
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
    color: '#e11d48',
    logoUrl: '/logos/truflo-strikers.png',
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
    name: 'Mavericks Royals',
    shortName: 'MR',
    color: '#2563eb',
    logoUrl: '/logos/mavericks-royals.png',
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
 * OFFICIAL KVO BOX CRICKET TOURNAMENT MATCH SCHEDULE
 * Date: Sunday, 29th November 2026
 * Venue: BCU Basecamp (Turf 1 & Turf 2)
 * Format: 9 League Matches (Each team plays exactly 3 matches) + 2 Semi-Finals + Grand Final
 */
export const INITIAL_MATCHES: Match[] = [
  // 9:00 AM – 10:00 AM
  {
    id: 'match-1',
    stage: 'LEAGUE',
    teamAId: 'team-truflo-strikers',
    teamBId: 'team-amsteel-inferno',
    date: '2026-11-29',
    time: '09:00 - 10:00 AM',
    boxVenue: 'BCU Basecamp - Turf 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-truflo-strikers', 'team-amsteel-inferno', INITIAL_TEAMS),
      createInitialInnings('team-amsteel-inferno', 'team-truflo-strikers', INITIAL_TEAMS),
    ],
    notes: 'Match 1 • Turf 1 (09:00 - 10:00 AM)',
  },
  {
    id: 'match-2',
    stage: 'LEAGUE',
    teamAId: 'team-kraftech-titans',
    teamBId: 'team-mavericks',
    date: '2026-11-29',
    time: '09:00 - 10:00 AM',
    boxVenue: 'BCU Basecamp - Turf 2',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-kraftech-titans', 'team-mavericks', INITIAL_TEAMS),
      createInitialInnings('team-mavericks', 'team-kraftech-titans', INITIAL_TEAMS),
    ],
    notes: 'Match 2 • Turf 2 (09:00 - 10:00 AM)',
  },

  // 10:00 AM – 11:00 AM
  {
    id: 'match-3',
    stage: 'LEAGUE',
    teamAId: 'team-truflo-strikers',
    teamBId: 'team-leofans-fanatics',
    date: '2026-11-29',
    time: '10:00 - 11:00 AM',
    boxVenue: 'BCU Basecamp - Turf 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-truflo-strikers', 'team-leofans-fanatics', INITIAL_TEAMS),
      createInitialInnings('team-leofans-fanatics', 'team-truflo-strikers', INITIAL_TEAMS),
    ],
    notes: 'Match 3 • Turf 1 (10:00 - 11:00 AM)',
  },
  {
    id: 'match-4',
    stage: 'LEAGUE',
    teamAId: 'team-kraftech-titans',
    teamBId: 'team-party-hunterz-warriors',
    date: '2026-11-29',
    time: '10:00 - 11:00 AM',
    boxVenue: 'BCU Basecamp - Turf 2',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-kraftech-titans', 'team-party-hunterz-warriors', INITIAL_TEAMS),
      createInitialInnings('team-party-hunterz-warriors', 'team-kraftech-titans', INITIAL_TEAMS),
    ],
    notes: 'Match 4 • Turf 2 (10:00 - 11:00 AM)',
  },

  // 11:00 AM – 12:00 PM
  {
    id: 'match-5',
    stage: 'LEAGUE',
    teamAId: 'team-amsteel-inferno',
    teamBId: 'team-party-hunterz-warriors',
    date: '2026-11-29',
    time: '11:00 AM - 12:00 PM',
    boxVenue: 'BCU Basecamp - Turf 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-amsteel-inferno', 'team-party-hunterz-warriors', INITIAL_TEAMS),
      createInitialInnings('team-party-hunterz-warriors', 'team-amsteel-inferno', INITIAL_TEAMS),
    ],
    notes: 'Match 5 • Turf 1 (11:00 AM - 12:00 PM)',
  },
  {
    id: 'match-6',
    stage: 'LEAGUE',
    teamAId: 'team-mavericks',
    teamBId: 'team-leofans-fanatics',
    date: '2026-11-29',
    time: '11:00 AM - 12:00 PM',
    boxVenue: 'BCU Basecamp - Turf 2',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-mavericks', 'team-leofans-fanatics', INITIAL_TEAMS),
      createInitialInnings('team-leofans-fanatics', 'team-mavericks', INITIAL_TEAMS),
    ],
    notes: 'Match 6 • Turf 2 (11:00 AM - 12:00 PM)',
  },

  // 12:00 PM – 01:00 PM
  {
    id: 'match-7',
    stage: 'LEAGUE',
    teamAId: 'team-amsteel-inferno',
    teamBId: 'team-kraftech-titans',
    date: '2026-11-29',
    time: '12:00 - 01:00 PM',
    boxVenue: 'BCU Basecamp - Turf 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-amsteel-inferno', 'team-kraftech-titans', INITIAL_TEAMS),
      createInitialInnings('team-kraftech-titans', 'team-amsteel-inferno', INITIAL_TEAMS),
    ],
    notes: 'Match 7 • Turf 1 (12:00 - 01:00 PM)',
  },
  {
    id: 'match-8',
    stage: 'LEAGUE',
    teamAId: 'team-truflo-strikers',
    teamBId: 'team-mavericks',
    date: '2026-11-29',
    time: '12:00 - 01:00 PM',
    boxVenue: 'BCU Basecamp - Turf 2',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-truflo-strikers', 'team-mavericks', INITIAL_TEAMS),
      createInitialInnings('team-mavericks', 'team-truflo-strikers', INITIAL_TEAMS),
    ],
    notes: 'Match 8 • Turf 2 (12:00 - 01:00 PM)',
  },

  // 01:00 PM – 02:00 PM
  {
    id: 'match-9',
    stage: 'LEAGUE',
    teamAId: 'team-party-hunterz-warriors',
    teamBId: 'team-leofans-fanatics',
    date: '2026-11-29',
    time: '01:00 - 02:00 PM',
    boxVenue: 'BCU Basecamp - Turf 1',
    totalOvers: 8,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-party-hunterz-warriors', 'team-leofans-fanatics', INITIAL_TEAMS),
      createInitialInnings('team-leofans-fanatics', 'team-party-hunterz-warriors', INITIAL_TEAMS),
    ],
    notes: 'Match 9 • Turf 1 (01:00 - 02:00 PM)',
  },

  // Playoff: Top 4 Advance to Semifinals (02:30 PM - 03:45 PM)
  // Semi-Final 1: Rank 1 vs Rank 4 (Turf 1)
  {
    id: 'match-semi-1',
    stage: 'SEMI_FINAL',
    teamAId: 'team-truflo-strikers',
    teamBId: 'team-leofans-fanatics',
    date: '2026-11-29',
    time: '02:30 - 03:45 PM',
    boxVenue: 'BCU Basecamp - Turf 1',
    totalOvers: 9,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-truflo-strikers', 'team-leofans-fanatics', INITIAL_TEAMS),
      createInitialInnings('team-leofans-fanatics', 'team-truflo-strikers', INITIAL_TEAMS),
    ],
    notes: 'Semi-Final 1: Rank 1 vs Rank 4 (Turf 1 • 02:30 PM)',
  },

  // Semi-Final 2: Rank 2 vs Rank 3 (Turf 2)
  {
    id: 'match-semi-2',
    stage: 'SEMI_FINAL',
    teamAId: 'team-amsteel-inferno',
    teamBId: 'team-kraftech-titans',
    date: '2026-11-29',
    time: '02:30 - 03:45 PM',
    boxVenue: 'BCU Basecamp - Turf 2',
    totalOvers: 9,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-amsteel-inferno', 'team-kraftech-titans', INITIAL_TEAMS),
      createInitialInnings('team-kraftech-titans', 'team-amsteel-inferno', INITIAL_TEAMS),
    ],
    notes: 'Semi-Final 2: Rank 2 vs Rank 3 (Turf 2 • 02:30 PM)',
  },

  // Grand Final: Winner SF1 vs Winner SF2 (04:00 PM - 05:00 PM, Turf 1)
  {
    id: 'match-final',
    stage: 'FINAL',
    teamAId: 'team-truflo-strikers',
    teamBId: 'team-amsteel-inferno',
    date: '2026-11-29',
    time: '04:00 - 05:00 PM',
    boxVenue: 'BCU Basecamp - Turf 1',
    totalOvers: 9,
    status: 'UPCOMING',
    currentInningsIndex: 0,
    innings: [
      createInitialInnings('team-truflo-strikers', 'team-amsteel-inferno', INITIAL_TEAMS),
      createInitialInnings('team-amsteel-inferno', 'team-truflo-strikers', INITIAL_TEAMS),
    ],
    notes: '🏆 GRAND FINAL: Winner SF1 vs Winner SF2 (Turf 1 • 04:00 PM)',
  },
];

export interface EventScheduleItem {
  time: string;
  program: string;
  details?: string;
  category?: 'ceremony' | 'cricket' | 'activity' | 'food';
  highlight?: boolean;
}

export const TOURNAMENT_EVENT_SCHEDULE: EventScheduleItem[] = [
  { time: '07:30 AM', program: 'Participants Report to Venue', details: 'Registration, Breakfast & Team gathering at BCU Basecamp', category: 'food' },
  { time: '08:20 AM', program: 'Host Assembly Announcement', details: 'All 6 teams, owners, captains & players assemble at main playing arena', category: 'ceremony' },
  { time: '08:30 - 08:35 AM', program: 'Welcome & Opening Ceremony', details: 'Official welcome to the KVO + Adior Stones Box Cricket Tournament', category: 'ceremony', highlight: true },
  { time: '08:35 - 08:40 AM', program: "President's Address", details: 'Opening address by the Committee President (3-5 mins)', category: 'ceremony' },
  { time: '08:40 - 08:50 AM', program: 'Introduction of 6 Teams & Team Photographs', details: 'All 6 teams photoshoot with owners and captains (45-60s per team)', category: 'ceremony' },
  { time: '08:50 - 08:55 AM', program: 'Tournament Format & Scoring Briefing', details: 'Explanation of 9 league matches, power overs, live web app QR code & qualification criteria', category: 'ceremony' },
  { time: '08:55 - 09:00 AM', program: 'Introduction of Officials & Opening Match Announcement', details: 'Umpires, Scorers & Match Officials introduced; Captains report for toss', category: 'ceremony' },
  { time: '09:00 - 10:00 AM', program: '🏏 Match 1 & Match 2 (Simultaneous)', details: 'Turf 1: Truflo Strikers vs Amsteel Inferno | Turf 2: Kraftech Titans vs Mavericks Royals', category: 'cricket', highlight: true },
  { time: '10:00 - 11:00 AM', program: '🏏 Match 3 & Match 4 (Simultaneous)', details: 'Turf 1: Truflo Strikers vs Leo Fanatics | Turf 2: Kraftech Titans vs Party Hunterz', category: 'cricket', highlight: true },
  { time: '11:00 AM - 12:00 PM', program: '🏏 Match 5 & Match 6 (Simultaneous)', details: 'Turf 1: Amsteel Inferno vs Party Hunterz | Turf 2: Mavericks Royals vs Leo Fanatics', category: 'cricket', highlight: true },
  { time: '12:00 - 01:00 PM', program: '🏏 Match 7 & Match 8 (Simultaneous)', details: 'Turf 1: Amsteel Inferno vs Kraftech Titans | Turf 2: Truflo Strikers vs Mavericks Royals', category: 'cricket', highlight: true },
  { time: '01:00 - 02:00 PM', program: '🏏 Match 9 & Rolling Lunch Window', details: 'Turf 1: Party Hunterz vs Leo Fanatics (Turf 2: Break) | Rolling Lunch served for players & guests', category: 'food', highlight: true },
  { time: 'Throughout Morning', program: '🎲 Board Games Zone', details: 'Fun board games lounge for senior citizens, kids & non-playing members', category: 'activity' },
  { time: 'Morning Slot', program: '🎟️ Special Tambola Event', details: 'Interactive community Tambola with exciting prizes for winners', category: 'activity' },
  { time: '02:00 - 02:30 PM', program: 'League Results & Semi-Final Confirmation', details: 'Committee & Scorers confirm final standings, NRR and Semi-Final line-ups', category: 'ceremony' },
  { time: '02:30 - 03:45 PM', program: '🏏 Semi-Finals (Top 4 Knockout)', details: 'Turf 1: SF1 (Rank 1 vs Rank 4) | Turf 2: SF2 (Rank 2 vs Rank 3) (9 Overs)', category: 'cricket', highlight: true },
  { time: '03:30 - 04:15 PM', program: '☕ High Tea & Finalists Break', details: 'High Tea refreshment break and preparations for the Grand Final', category: 'food' },
  { time: '03:55 PM', program: 'Finalists Captains Photo & Toss', details: 'Captains of both finalists meet on Turf 1 for photoshoot & toss', category: 'ceremony' },
  { time: '04:00 - 05:00 PM', program: '🏆 GRAND FINAL', details: 'Championship Match: Winner SF1 vs Winner SF2 (9 Overs)', category: 'cricket', highlight: true },
  { time: 'After Final', program: '🏆 Prize Distribution & Closing Ceremony', details: 'Champions Trophy, Runners-Up, 4 Best Player Awards (Male, Female, Kid, Senior) & Officials Honor', category: 'ceremony', highlight: true },
  { time: 'Closing', program: '📸 Grand Full Group Photograph', details: 'All 6 teams, committee, senior citizens, families & officials together', category: 'ceremony' },
];
