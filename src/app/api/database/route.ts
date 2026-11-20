import { NextResponse } from 'next/server';
import { 
  getDatabaseCredentials, 
  saveDatabaseCredentials, 
  fetchLiveDatabaseState, 
  persistLiveDatabaseState, 
  testDatabaseConnectivity,
  DatabaseCredentials 
} from '@/lib/db';
import { getTournamentState } from '@/lib/tournamentService';
import { verifyAdminCredentials } from '@/lib/authService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const creds = getDatabaseCredentials();
    const liveStatus = await fetchLiveDatabaseState();

    let maskedUrl = '';
    if (creds.mongoUri) {
      maskedUrl = creds.mongoUri.replace(/:([^@]+)@/, ':****@');
    } else if (creds.postgresUrl) {
      maskedUrl = creds.postgresUrl.replace(/:([^@]+)@/, ':****@');
    } else if (creds.redisUrl) {
      maskedUrl = creds.redisUrl;
    }

    return NextResponse.json({
      configured: creds.type !== 'none',
      type: creds.type,
      connected: liveStatus.connected,
      source: liveStatus.source,
      maskedUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, loginId, password, creds } = body;

    // Verify Admin credentials
    const auth = verifyAdminCredentials(loginId || 'admin', password || '');
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Admin Password' }, { status: 403 });
    }

    if (action === 'TEST_CONNECTION') {
      const result = await testDatabaseConnectivity(creds as DatabaseCredentials);
      return NextResponse.json(result);
    }

    if (action === 'SAVE_CONNECTION') {
      // 1. Test first
      const test = await testDatabaseConnectivity(creds as DatabaseCredentials);
      if (!test.success) {
        return NextResponse.json({ success: false, error: test.message }, { status: 400 });
      }

      // 2. Save credentials
      saveDatabaseCredentials(creds as DatabaseCredentials);

      // 3. Immediately seed current state into the new database so no data is lost!
      const currentState = getTournamentState();
      await persistLiveDatabaseState(currentState);

      return NextResponse.json({
        success: true,
        message: `${test.message} Current tournament state has been synced to the database!`,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
