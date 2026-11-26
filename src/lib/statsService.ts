import { Match, Team, LeagueStanding, PlayerPerformancePoints, CategoryAwardsSummary, PlayerCategory } from '@/types/cricket';
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

/**
 * Calculates individual performance points for all players as per official
 * KVO Box Cricket 2026 scoring rules.
 *
 * Scoring Rules:
 * - Batting:
 *   - Actual run scored: +1 pt
 *   - Four: +2 bonus pts (4 + 2 = 6)
 *   - Six: +3 bonus pts (6 + 3 = 9)
 *   - 1D: +1 pt, 2D: +2 pts
 *   - Dismissal: -5 pts
 *   - Dot ball: 0 pts
 *   - Multipliers (Power Over, Female 2x, etc.) are excluded per rule: "Exclude Power Over and special batting multipliers"
 * - Bowling:
 *   - Wicket (excl. run-outs): +10 pts
 *   - Dot ball: +2 pts
 *   - Wide: -2 pts
 *   - No-ball: -2 pts
 *   - Actual run conceded off the bat: -0.5 pts
 * - Fielding:
 *   - Catch: +5 pts
 *   - Direct run-out: +8 pts
 *   - Assisted run-out: +4 pts (each, max 2 fielders)
 *   - Stumping: +5 pts
 * - Tie-breaker:
 *   Higher wickets, actual runs, fielding points, then fewer dismissals.
 * - Scope:
 *   By default, only the 3 League Matches count for tournament awards (options.leagueOnly !== false).
 */
export function calculateTournamentPerformancePoints(
  teams: Team[],
  matches: Match[],
  options: { leagueOnly?: boolean } = { leagueOnly: true }
): {
  playerPoints: PlayerPerformancePoints[];
  awards: CategoryAwardsSummary;
  matchPotmMap: Record<string, { winner: PlayerPerformancePoints; points: number }>;
} {
  const pointsMap: Record<string, PlayerPerformancePoints> = {};

  teams.forEach(t => {
    t.players.forEach(p => {
      pointsMap[p.id] = {
        playerId: p.id,
        name: p.name,
        teamId: t.id,
        teamName: t.shortName,
        category: p.category,
        matchesPlayed: 0,

        actualRunsScored: 0,
        foursCount: 0,
        sixesCount: 0,
        dismissalsCount: 0,
        battingPoints: 0,

        wicketsCount: 0,
        dotBallsCount: 0,
        widesCount: 0,
        noBallsCount: 0,
        runsConcededOffBat: 0,
        bowlingPoints: 0,

        catchesCount: 0,
        directRunOutsCount: 0,
        assistedRunOutsCount: 0,
        stumpingsCount: 0,
        fieldingPoints: 0,

        totalPoints: 0,
        potmCount: 0,
      };
    });
  });

  // Calculate Player of the Match for each completed match
  const matchPotmMap: Record<string, { winner: PlayerPerformancePoints; points: number }> = {};

  matches.forEach(m => {
    // Single-match points calculation for POTM
    const singleMatchPoints = calculateSingleMatchPoints(m, teams);
    const sortedMatchPlayers = Object.values(singleMatchPoints).sort((a, b) => b.totalPoints - a.totalPoints);
    if (sortedMatchPlayers.length > 0 && sortedMatchPlayers[0].totalPoints > 0) {
      const topMatchPlayer = sortedMatchPlayers[0];
      matchPotmMap[m.id] = { winner: topMatchPlayer, points: topMatchPlayer.totalPoints };
      // Increment global POTM count
      if (pointsMap[topMatchPlayer.playerId]) {
        pointsMap[topMatchPlayer.playerId].potmCount += 1;
      }
    }
  });

  // Eligible matches for tournament awards
  const eligibleMatches = matches.filter(m => {
    if (options.leagueOnly) {
      return m.stage === 'LEAGUE';
    }
    return true;
  });

  // Track matches played
  eligibleMatches.forEach(m => {
    const playedSet = new Set<string>();
    // Check playing 8
    m.teamAPlaying8Ids?.forEach(id => playedSet.add(id));
    m.teamBPlaying8Ids?.forEach(id => playedSet.add(id));
    // Check participants from innings
    m.innings.forEach(inn => {
      Object.keys(inn.batsmanStats).forEach(id => playedSet.add(id));
      Object.keys(inn.bowlerStats).forEach(id => playedSet.add(id));
    });
    playedSet.forEach(id => {
      if (pointsMap[id]) pointsMap[id].matchesPlayed += 1;
    });

    // Process all deliveries
    m.innings.forEach(inn => {
      inn.balls.forEach(ball => {
        // 1. Batting Points
        if (ball.batsmanId && pointsMap[ball.batsmanId]) {
          const bp = pointsMap[ball.batsmanId];
          let actualRuns = 0;
          let isFour = false;
          let isSix = false;

          if (ball.outcomeType === 'RUN_1') actualRuns = 1;
          else if (ball.outcomeType === 'RUN_2') actualRuns = 2;
          else if (ball.outcomeType === 'RUN_3') actualRuns = 3;
          else if (ball.outcomeType === 'FOUR') {
            actualRuns = 4;
            isFour = true;
          } else if (ball.outcomeType === 'SIX') {
            actualRuns = 6;
            isSix = true;
          } else if (ball.outcomeType === 'DECLARATION_1D') {
            actualRuns = 1;
          } else if (ball.outcomeType === 'NO_BALL') {
            // Extra runs off bat on no ball
            const runsOffBat = Math.max(0, ball.rawRuns || 0);
            actualRuns = runsOffBat;
            if (runsOffBat === 4) isFour = true;
            if (runsOffBat === 6) isSix = true;
          }

          bp.actualRunsScored += actualRuns;
          if (isFour) bp.foursCount += 1;
          if (isSix) bp.sixesCount += 1;

          if (ball.dismissal && (ball.dismissal.dismissedPlayerId === ball.batsmanId || !ball.dismissal.dismissedPlayerId)) {
            bp.dismissalsCount += 1;
          }
        }

        // 2. Bowling Points
        if (ball.bowlerId && pointsMap[ball.bowlerId]) {
          const bowlP = pointsMap[ball.bowlerId];

          if (ball.outcomeType === 'WIDE') {
            bowlP.widesCount += 1;
          } else if (ball.outcomeType === 'NO_BALL') {
            bowlP.noBallsCount += 1;
            const runsOffBat = Math.max(0, ball.rawRuns || 0);
            bowlP.runsConcededOffBat += runsOffBat;
          } else {
            // Legal delivery
            if (ball.outcomeType === 'DOT') {
              bowlP.dotBallsCount += 1;
            } else if (ball.dismissal && ball.dismissal.type !== 'RUN_OUT') {
              bowlP.wicketsCount += 1;
            } else if (ball.outcomeType !== 'BYE') {
              let runsOffBat = 0;
              if (ball.outcomeType === 'RUN_1') runsOffBat = 1;
              else if (ball.outcomeType === 'RUN_2') runsOffBat = 2;
              else if (ball.outcomeType === 'RUN_3') runsOffBat = 3;
              else if (ball.outcomeType === 'FOUR') runsOffBat = 4;
              else if (ball.outcomeType === 'SIX') runsOffBat = 6;
              else if (ball.outcomeType === 'DECLARATION_1D') runsOffBat = 1;
              bowlP.runsConcededOffBat += runsOffBat;
            }
          }
        }

        // 3. Fielding Points
        if (ball.dismissal) {
          const d = ball.dismissal;
          if (d.type === 'CAUGHT' && d.fielderId && pointsMap[d.fielderId]) {
            pointsMap[d.fielderId].catchesCount += 1;
          } else if (d.type === 'RUN_OUT') {
            if (d.runOutType === 'ASSISTED' && d.fielderId && d.assistedFielderId) {
              if (pointsMap[d.fielderId]) pointsMap[d.fielderId].assistedRunOutsCount += 1;
              if (pointsMap[d.assistedFielderId]) pointsMap[d.assistedFielderId].assistedRunOutsCount += 1;
            } else if (d.fielderId && pointsMap[d.fielderId]) {
              pointsMap[d.fielderId].directRunOutsCount += 1;
            }
          } else if (d.type === 'STUMPED' && d.fielderId && pointsMap[d.fielderId]) {
            pointsMap[d.fielderId].stumpingsCount += 1;
          }
        }
      });
    });
  });

  // Aggregate sub-totals and final totalPoints
  Object.values(pointsMap).forEach(p => {
    // Batting: actual run = 1, four bonus = 2, six bonus = 3, dismissal = -5
    p.battingPoints = Number((
      (p.actualRunsScored * 1) +
      (p.foursCount * 2) +
      (p.sixesCount * 3) -
      (p.dismissalsCount * 5)
    ).toFixed(1));

    // Bowling: wicket = 10, dot = 2, wide = -2, no-ball = -2, runs off bat = -0.5
    p.bowlingPoints = Number((
      (p.wicketsCount * 10) +
      (p.dotBallsCount * 2) -
      (p.widesCount * 2) -
      (p.noBallsCount * 2) -
      (p.runsConcededOffBat * 0.5)
    ).toFixed(1));

    // Fielding: catch = 5, direct run-out = 8, assisted run-out = 4, stumping = 5
    p.fieldingPoints = Number((
      (p.catchesCount * 5) +
      (p.directRunOutsCount * 8) +
      (p.assistedRunOutsCount * 4) +
      (p.stumpingsCount * 5)
    ).toFixed(1));

    p.totalPoints = Number((p.battingPoints + p.bowlingPoints + p.fieldingPoints).toFixed(1));
  });

  // Sort by official tie-breaker:
  // 1. Total points desc
  // 2. Wickets desc
  // 3. Actual runs desc
  // 4. Fielding points desc
  // 5. Fewer dismissals asc
  const sortedPlayers = Object.values(pointsMap).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wicketsCount !== a.wicketsCount) return b.wicketsCount - a.wicketsCount;
    if (b.actualRunsScored !== a.actualRunsScored) return b.actualRunsScored - a.actualRunsScored;
    if (b.fieldingPoints !== a.fieldingPoints) return b.fieldingPoints - a.fieldingPoints;
    return a.dismissalsCount - b.dismissalsCount;
  });

  // Category Best Player Awards
  const awards: CategoryAwardsSummary = {
    bestMale: sortedPlayers.find(p => p.category === 'REGULAR') || null,
    bestFemale: sortedPlayers.find(p => p.category === 'FEMALE') || null,
    bestKid: sortedPlayers.find(p => p.category === 'KID') || null,
    bestSenior: sortedPlayers.find(p => p.category === 'SENIOR') || null,
  };

  return {
    playerPoints: sortedPlayers,
    awards,
    matchPotmMap,
  };
}

/**
 * Helper to calculate performance points within a single match (e.g. for Player of the Match)
 */
export function calculateSingleMatchPoints(match: Match, teams: Team[]): Record<string, PlayerPerformancePoints> {
  const pointsMap: Record<string, PlayerPerformancePoints> = {};

  teams.forEach(t => {
    t.players.forEach(p => {
      pointsMap[p.id] = {
        playerId: p.id,
        name: p.name,
        teamId: t.id,
        teamName: t.shortName,
        category: p.category,
        matchesPlayed: 1,

        actualRunsScored: 0,
        foursCount: 0,
        sixesCount: 0,
        dismissalsCount: 0,
        battingPoints: 0,

        wicketsCount: 0,
        dotBallsCount: 0,
        widesCount: 0,
        noBallsCount: 0,
        runsConcededOffBat: 0,
        bowlingPoints: 0,

        catchesCount: 0,
        directRunOutsCount: 0,
        assistedRunOutsCount: 0,
        stumpingsCount: 0,
        fieldingPoints: 0,

        totalPoints: 0,
        potmCount: 0,
      };
    });
  });

  match.innings.forEach(inn => {
    inn.balls.forEach(ball => {
      // Batting
      if (ball.batsmanId && pointsMap[ball.batsmanId]) {
        const bp = pointsMap[ball.batsmanId];
        let actualRuns = 0;
        let isFour = false;
        let isSix = false;

        if (ball.outcomeType === 'RUN_1') actualRuns = 1;
        else if (ball.outcomeType === 'RUN_2') actualRuns = 2;
        else if (ball.outcomeType === 'RUN_3') actualRuns = 3;
        else if (ball.outcomeType === 'FOUR') {
          actualRuns = 4;
          isFour = true;
        } else if (ball.outcomeType === 'SIX') {
          actualRuns = 6;
          isSix = true;
        } else if (ball.outcomeType === 'DECLARATION_1D') {
          actualRuns = 1;
        } else if (ball.outcomeType === 'NO_BALL') {
          const runsOffBat = Math.max(0, ball.rawRuns || 0);
          actualRuns = runsOffBat;
          if (runsOffBat === 4) isFour = true;
          if (runsOffBat === 6) isSix = true;
        }

        bp.actualRunsScored += actualRuns;
        if (isFour) bp.foursCount += 1;
        if (isSix) bp.sixesCount += 1;
        if (ball.dismissal && (ball.dismissal.dismissedPlayerId === ball.batsmanId || !ball.dismissal.dismissedPlayerId)) {
          bp.dismissalsCount += 1;
        }
      }

      // Bowling
      if (ball.bowlerId && pointsMap[ball.bowlerId]) {
        const bowlP = pointsMap[ball.bowlerId];
        if (ball.outcomeType === 'WIDE') {
          bowlP.widesCount += 1;
        } else if (ball.outcomeType === 'NO_BALL') {
          bowlP.noBallsCount += 1;
          const runsOffBat = Math.max(0, ball.rawRuns || 0);
          bowlP.runsConcededOffBat += runsOffBat;
        } else {
          if (ball.outcomeType === 'DOT') {
            bowlP.dotBallsCount += 1;
          } else if (ball.dismissal && ball.dismissal.type !== 'RUN_OUT') {
            bowlP.wicketsCount += 1;
          } else if (ball.outcomeType !== 'BYE') {
            let runsOffBat = 0;
            if (ball.outcomeType === 'RUN_1') runsOffBat = 1;
            else if (ball.outcomeType === 'RUN_2') runsOffBat = 2;
            else if (ball.outcomeType === 'RUN_3') runsOffBat = 3;
            else if (ball.outcomeType === 'FOUR') runsOffBat = 4;
            else if (ball.outcomeType === 'SIX') runsOffBat = 6;
            else if (ball.outcomeType === 'DECLARATION_1D') runsOffBat = 1;
            bowlP.runsConcededOffBat += runsOffBat;
          }
        }
      }

      // Fielding
      if (ball.dismissal) {
        const d = ball.dismissal;
        if (d.type === 'CAUGHT' && d.fielderId && pointsMap[d.fielderId]) {
          pointsMap[d.fielderId].catchesCount += 1;
        } else if (d.type === 'RUN_OUT') {
          if (d.runOutType === 'ASSISTED' && d.fielderId && d.assistedFielderId) {
            if (pointsMap[d.fielderId]) pointsMap[d.fielderId].assistedRunOutsCount += 1;
            if (pointsMap[d.assistedFielderId]) pointsMap[d.assistedFielderId].assistedRunOutsCount += 1;
          } else if (d.fielderId && pointsMap[d.fielderId]) {
            pointsMap[d.fielderId].directRunOutsCount += 1;
          }
        } else if (d.type === 'STUMPED' && d.fielderId && pointsMap[d.fielderId]) {
          pointsMap[d.fielderId].stumpingsCount += 1;
        }
      }
    });
  });

  Object.values(pointsMap).forEach(p => {
    p.battingPoints = Number((
      (p.actualRunsScored * 1) +
      (p.foursCount * 2) +
      (p.sixesCount * 3) -
      (p.dismissalsCount * 5)
    ).toFixed(1));

    p.bowlingPoints = Number((
      (p.wicketsCount * 10) +
      (p.dotBallsCount * 2) -
      (p.widesCount * 2) -
      (p.noBallsCount * 2) -
      (p.runsConcededOffBat * 0.5)
    ).toFixed(1));

    p.fieldingPoints = Number((
      (p.catchesCount * 5) +
      (p.directRunOutsCount * 8) +
      (p.assistedRunOutsCount * 4) +
      (p.stumpingsCount * 5)
    ).toFixed(1));

    p.totalPoints = Number((p.battingPoints + p.bowlingPoints + p.fieldingPoints).toFixed(1));
  });

  return pointsMap;
}
