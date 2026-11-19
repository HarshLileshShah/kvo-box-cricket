import { NextResponse } from 'next/server';
import { verifyAdminCredentials, updateAdminCredentials } from '@/lib/authService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, loginId, password, newPassword } = body;

    if (action === 'LOGIN') {
      const result = verifyAdminCredentials(loginId || '', password || '');
      if (result.success) {
        return NextResponse.json({
          success: true,
          user: result.user,
          token: `admin-token-${Date.now()}`,
        });
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 401 });
      }
    }

    if (action === 'CHANGE_PASSWORD') {
      const result = verifyAdminCredentials(loginId || '', password || '');
      if (!result.success) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect.' }, { status: 401 });
      }
      updateAdminCredentials(undefined, newPassword);
      return NextResponse.json({ success: true, message: 'Password updated successfully.' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
