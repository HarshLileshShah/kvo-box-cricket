import fs from 'fs';
import path from 'path';
import { UserRole, AuthUser } from '@/types/cricket';

const DATA_DIR = path.join(process.cwd(), 'data');
const AUTH_FILE = path.join(DATA_DIR, 'admin_auth.json');
const TMP_AUTH_FILE = '/tmp/admin_auth.json';

export interface UserAccount {
  loginId: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  allowedPasswords?: string[];
}

// Backwards compatibility alias
export type AdminCredentials = UserAccount;

export const DEFAULT_USERS: UserAccount[] = [
  {
    loginId: 'admin',
    name: 'Tournament Super Admin',
    passwordHash: process.env.ADMIN_PASSWORD || 'kvo@2026',
    role: 'ADMIN',
    allowedPasswords: ['kvo@2026', 'admin', 'kvo2026'],
  },
  {
    loginId: 'sagar',
    name: 'Sagar (Scorer)',
    passwordHash: 'kvo@2026',
    role: 'SCORER',
    allowedPasswords: ['kvo@2026', 'sagar@2026', 'sagar123', 'sagar'],
  },
  {
    loginId: 'bhavin',
    name: 'Bhavin (Scorer)',
    passwordHash: 'kvo@2026',
    role: 'SCORER',
    allowedPasswords: ['kvo@2026', 'bhavin@2026', 'bhavin123', 'bhavin'],
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __userAccounts: UserAccount[] | undefined;
}

function mergeWithDefaultUsers(existing: any[]): UserAccount[] {
  const result: UserAccount[] = [];
  for (const def of DEFAULT_USERS) {
    const found = existing.find(
      (u: any) => u.loginId && u.loginId.toLowerCase() === def.loginId.toLowerCase()
    );
    if (found) {
      result.push({
        loginId: found.loginId.toLowerCase(),
        name: found.name || def.name,
        passwordHash: found.passwordHash || def.passwordHash,
        role: def.role, // Enforce configured system role
        allowedPasswords: def.allowedPasswords,
      });
    } else {
      result.push(def);
    }
  }
  return result;
}

export function getAllUserAccounts(): UserAccount[] {
  if (globalThis.__userAccounts && globalThis.__userAccounts.length > 0) {
    return globalThis.__userAccounts;
  }

  // 1. Try local data file
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const data = fs.readFileSync(AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = mergeWithDefaultUsers(parsed);
        globalThis.__userAccounts = merged;
        return merged;
      } else if (parsed && parsed.loginId) {
        const merged = mergeWithDefaultUsers([parsed]);
        globalThis.__userAccounts = merged;
        saveUserAccounts(merged);
        return merged;
      }
    } catch (err) {
      // ignore
    }
  }

  // 2. Try /tmp file
  if (fs.existsSync(TMP_AUTH_FILE)) {
    try {
      const data = fs.readFileSync(TMP_AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = mergeWithDefaultUsers(parsed);
        globalThis.__userAccounts = merged;
        return merged;
      }
    } catch (err) {
      // ignore
    }
  }

  const defs = [...DEFAULT_USERS];
  saveUserAccounts(defs);
  globalThis.__userAccounts = defs;
  return defs;
}

export function saveUserAccounts(accounts: UserAccount[]) {
  globalThis.__userAccounts = accounts;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
    return;
  } catch (err) {
    // Read-only filesystem in Vercel lambda (EROFS) - proceed to /tmp
  }

  try {
    fs.writeFileSync(TMP_AUTH_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (err) {
    // In-memory update succeeded
  }
}

export function getAdminCredentials(): UserAccount {
  const accounts = getAllUserAccounts();
  return accounts.find((u) => u.loginId === 'admin') || DEFAULT_USERS[0];
}

export function verifyAdminCredentials(
  loginId: string,
  password: string
): { success: boolean; user?: AuthUser; error?: string } {
  const accounts = getAllUserAccounts();
  const cleanId = (loginId || '').trim().toLowerCase();
  const user = accounts.find((u) => u.loginId.toLowerCase() === cleanId);

  if (!user) {
    return {
      success: false,
      error: `Invalid User ID '${loginId}'. Available users: admin, sagar, bhavin.`,
    };
  }

  const isPasswordMatch =
    password === user.passwordHash ||
    (user.allowedPasswords && user.allowedPasswords.includes(password)) ||
    (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);

  if (isPasswordMatch) {
    return {
      success: true,
      user: {
        loginId: user.loginId,
        name: user.name,
        role: user.role,
      },
    };
  }

  return {
    success: false,
    error: 'Invalid password. Please check your password and try again.',
  };
}

export function updateAdminCredentials(loginId: string = 'admin', newPassword?: string): boolean {
  const accounts = [...getAllUserAccounts()];
  const cleanId = (loginId || 'admin').trim().toLowerCase();
  const user = accounts.find((u) => u.loginId.toLowerCase() === cleanId) || accounts.find((u) => u.loginId === 'admin');
  if (user && newPassword && newPassword.trim()) {
    user.passwordHash = newPassword.trim();
    saveUserAccounts(accounts);
    return true;
  }
  return false;
}

export function getUserRole(loginId: string): UserRole {
  const cleanId = (loginId || '').trim().toLowerCase();
  if (cleanId === 'admin') return 'ADMIN';
  const accounts = getAllUserAccounts();
  const user = accounts.find((u) => u.loginId.toLowerCase() === cleanId);
  return user?.role || 'SCORER';
}
