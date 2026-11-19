import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const AUTH_FILE = path.join(DATA_DIR, 'admin_auth.json');
const TMP_AUTH_FILE = '/tmp/admin_auth.json';

export interface AdminCredentials {
  loginId: string;
  passwordHash: string;
  name: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __adminAuth: AdminCredentials | undefined;
}

function getDefaultAuth(): AdminCredentials {
  return {
    loginId: process.env.ADMIN_LOGIN_ID || 'admin',
    passwordHash: process.env.ADMIN_PASSWORD || 'kvo@2026',
    name: 'Tournament Official Scorer',
  };
}

export function getAdminCredentials(): AdminCredentials {
  if (globalThis.__adminAuth) {
    return globalThis.__adminAuth;
  }

  // If env vars are explicitly set, prefer environment configuration
  if (process.env.ADMIN_LOGIN_ID && process.env.ADMIN_PASSWORD) {
    const envAuth = getDefaultAuth();
    globalThis.__adminAuth = envAuth;
    return envAuth;
  }

  if (fs.existsSync(AUTH_FILE)) {
    try {
      const data = fs.readFileSync(AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      globalThis.__adminAuth = parsed;
      return parsed;
    } catch (err) {
      // ignore
    }
  }

  if (fs.existsSync(TMP_AUTH_FILE)) {
    try {
      const data = fs.readFileSync(TMP_AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      globalThis.__adminAuth = parsed;
      return parsed;
    } catch (err) {
      // ignore
    }
  }

  const def = getDefaultAuth();
  globalThis.__adminAuth = def;
  return def;
}

export function verifyAdminCredentials(loginId: string, password: string): { success: boolean; user?: { loginId: string; name: string }; error?: string } {
  const creds = getAdminCredentials();
  if (loginId.trim().toLowerCase() === creds.loginId.toLowerCase() && password === creds.passwordHash) {
    return {
      success: true,
      user: {
        loginId: creds.loginId,
        name: creds.name,
      },
    };
  }
  return {
    success: false,
    error: 'Invalid Login ID or Password. Please try again.',
  };
}

export function updateAdminCredentials(newLoginId?: string, newPassword?: string): boolean {
  const current = { ...getAdminCredentials() };
  if (newLoginId && newLoginId.trim()) current.loginId = newLoginId.trim();
  if (newPassword && newPassword.trim()) current.passwordHash = newPassword.trim();
  globalThis.__adminAuth = current;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(current, null, 2), 'utf-8');
    return true;
  } catch (err) {
    // Read-only filesystem in Vercel lambda (EROFS) - proceed to /tmp
  }

  try {
    fs.writeFileSync(TMP_AUTH_FILE, JSON.stringify(current, null, 2), 'utf-8');
    return true;
  } catch (err) {
    // In-memory update succeeded
  }

  return true;
}
