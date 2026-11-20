import { NextResponse } from 'next/server';
import {
  getTournamentState,
  recordBall,
  undoLastBall,
  updateActiveParticipants,
  saveTeam,
  saveMatch,
  setPlayoffTeams,
  submitPlayingLineup,
  saveTournamentState,
  getKVTournamentState,
  setKVTournamentState,
  setInMemoryTournamentState,
  updateBall,
  deleteBall,
  setMatchStatus,
  resetMatch,
  resetAllMatches
} from '@/lib/tournamentService';
import { fetchLiveDatabaseState, persistLiveDatabaseState } from '@/lib/db';
import { verifyAdminCredentials } from '@/lib/authService';
import { INITIAL_TEAMS, INITIAL_MATCHES, OFFICIAL_TOURNAMENT_RULES } from '@/lib/mockData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Fetch live state from persistent cloud database (MongoDB, Postgres, Redis/KV)
    const dbRes = await fetchLiveDatabaseState();
    if (dbRes.state) {
      setInMemoryTournamentState(dbRes.state);
      return NextResponse.json(dbRes.state);
    }

    // 2. Fallback to local state / in-memory state
    const state = getTournamentState();

    // If cloud database is connected but was empty, immediately seed it with tournament state!
    if (dbRes.connected && !dbRes.state) {
      await persistLiveDatabaseState(state);
    }

    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Ensure we have latest live database state before applying mutation
    const dbRes = await fetchLiveDatabaseState();
    if (dbRes.state) {
      setInMemoryTournamentState(dbRes.state);
    }

    const body = await request.json();
    const { action } = body;
    let result: any;

    switch (action) {
      case 'RECORD_BALL': {
        result = recordBall(body.params);
        break;
      }
      case 'UNDO_BALL': {
        result = undoLastBall(body.params.matchId);
        break;
      }
      case 'UPDATE_PARTICIPANTS': {
        result = updateActiveParticipants(body.params);
        break;
      }
      case 'SUBMIT_LINEUP': {
        const match = submitPlayingLineup(body.params);
        result = { match };
        break;
      }
      case 'SAVE_TEAM': {
        const teams = saveTeam(body.params.team);
        result = { teams };
        break;
      }
      case 'SAVE_MATCH': {
        const matches = saveMatch(body.params.match);
        result = { matches };
        break;
      }
      case 'SET_PLAYOFFS': {
        const matches = setPlayoffTeams(body.params);
        result = { matches };
        break;
      }
      case 'EDIT_BALL': {
        result = updateBall(body.params);
        break;
      }
      case 'DELETE_BALL': {
        result = deleteBall(body.params);
        break;
      }
      case 'SET_MATCH_STATUS': {
        result = setMatchStatus(body.params);
        break;
      }
      case 'RESET_MATCH': {
        const authRes = verifyAdminCredentials(body.params?.loginId || 'admin', body.params?.password || '');
        if (!authRes.success) {
          return NextResponse.json({ error: authRes.error || 'Incorrect admin password. Match reset was rejected.' }, { status: 403 });
        }
        result = resetMatch(body.params);
        break;
      }
      case 'RESET_ALL_MATCHES':
      case 'RESET_TOURNAMENT': {
        const authRes = verifyAdminCredentials(body.params?.loginId || 'admin', body.params?.password || '');
        if (!authRes.success) {
          return NextResponse.json({ error: authRes.error || 'Incorrect admin password. Reset operation was rejected.' }, { status: 403 });
        }
        result = resetAllMatches(body.params);
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // Persist updated state to active database (MongoDB, PostgreSQL, or Redis/KV)
    const latestState = getTournamentState();
    await persistLiveDatabaseState(latestState);
    await setKVTournamentState(latestState);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
