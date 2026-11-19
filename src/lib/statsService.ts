import { Match, Team, LeagueStanding } from '@/types/cricket';
import { calculateNRR } from './rulesEngine';

export function calculateLeagueStandings(teams: Team[], matches: Match[]): LeagueStanding[] {
  const standingsMap: Record<string, LeagueStanding> = {};

  teams.forEach(team => {
    standingsMap[team.id] = {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      points: 0,
      totalRunsScored: 0,
      totalOversBatted: 0,
      totalRunsConceded: 0,
      totalOversBowled: 0,
      netRunRate: 0,
    };
  });

  // Calculate from completed or tied matches in LEAGUE stage
  matches
    .filter(m => m.stage === 'LEAGUE' && (m.status === 'COMPLETED' || m.status === 'TIED'))
    .forEach(m => {
      const inn0 = m.innings[0];
      const inn1 = m.innings[1];

      const teamAStats = standingsMap[inn0.battingTeamId];
      const teamBStats = standingsMap[inn1.battingTeamId];

      if (teamAStats && teamBStats) {
        teamAStats.played += 1;
        teamBStats.played += 1;

        const inn0Overs = inn0.completedOvers + (inn0.currentOverBalls / 6);
        const inn1Overs = inn1.completedOvers + (inn1.currentOverBalls / 6);

        teamAStats.totalRunsScored += inn0.totalRuns;
        teamAStats.totalOversBatted += (inn0Overs || m.totalOvers);

        teamAStats.totalRunsConceded += inn1.totalRuns;
        teamAStats.totalOversBowled += (inn1Overs || m.totalOvers);

        teamBStats.totalRunsScored += inn1.totalRuns;
        teamBStats.totalOversBatted += (inn1Overs || m.totalOvers);

        teamBStats.totalRunsConceded += inn0.totalRuns;
        teamBStats.totalOversBowled += (inn0Overs || m.totalOvers);

        if (m.winnerId === inn0.battingTeamId) {
          teamAStats.won += 1;
          teamAStats.points += 2;
          teamBStats.lost += 1;
        } else if (m.winnerId === inn1.battingTeamId) {
          teamBStats.won += 1;
          teamBStats.points += 2;
          teamAStats.lost += 1;
        } else {
          teamAStats.tied += 1;
          teamBStats.tied += 1;
          teamAStats.points += 1;
          teamBStats.points += 1;
        }
      }
    });

  // Calculate NRR
  Object.values(standingsMap).forEach(s => {
    s.netRunRate = calculateNRR(
      s.totalRunsScored,
      s.totalOversBatted,
      s.totalRunsConceded,
      s.totalOversBowled
    );
  });

  // Sort by Points desc, then NRR desc, then Won desc, then Total Runs desc
  const sorted = Object.values(standingsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.netRunRate !== a.netRunRate) return b.netRunRate - a.netRunRate;
    if (b.won !== a.won) return b.won - a.won;
    return b.totalRunsScored - a.totalRunsScored;
  });

  return sorted.map((s, idx) => ({
    ...s,
    rank: idx + 1,
    isQualifiedForSemis: idx < 4,
  }));
}

export interface AggregatedPlayerStats {
  playerId: string;
  name: string;
  teamName: string;
  category: string;
  matchesPlayed: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  economy: number;
  dismissalsCount: number;
}

export function aggregatePlayerStats(teams: Team[], matches: Match[]): AggregatedPlayerStats[] {
  const statsMap: Record<string, AggregatedPlayerStats> = {};

  teams.forEach(t => {
    t.players.forEach(p => {
      statsMap[p.id] = {
        playerId: p.id,
        name: p.name,
        teamName: t.shortName,
        category: p.category,
        matchesPlayed: 0,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        wickets: 0,
        oversBowled: 0,
        runsConceded: 0,
        economy: 0,
        dismissalsCount: 0,
      };
    });
  });

  matches.forEach(m => {
    m.innings.forEach(inn => {
      Object.values(inn.batsmanStats).forEach(b => {
        if (statsMap[b.playerId]) {
          const item = statsMap[b.playerId];
          item.runs += b.runs;
          item.ballsFaced += b.ballsFaced;
          item.fours += b.fours;
          item.sixes += b.sixes;
          item.dismissalsCount += b.dismissalsCount;
        }
      });

      Object.values(inn.bowlerStats).forEach(bowl => {
        if (statsMap[bowl.playerId]) {
          const item = statsMap[bowl.playerId];
          item.wickets += bowl.wickets;
          item.runsConceded += bowl.runsConceded;
          item.oversBowled += bowl.oversBowled;
        }
      });
    });
  });

  Object.values(statsMap).forEach(s => {
    s.strikeRate = s.ballsFaced > 0 ? Number(((s.runs / s.ballsFaced) * 100).toFixed(1)) : 0;
    s.economy = s.oversBowled > 0 ? Number((s.runsConceded / s.oversBowled).toFixed(2)) : 0;
  });

  return Object.values(statsMap).sort((a, b) => b.runs - a.runs);
}
