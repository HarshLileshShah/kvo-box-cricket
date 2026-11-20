import fs from 'fs';
import path from 'path';
import { TournamentState } from './tournamentService';
import { MongoClient } from 'mongodb';
import { neon } from '@neondatabase/serverless';
import { Redis } from '@upstash/redis';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_CREDS_FILE = path.join(DATA_DIR, 'db_credentials.json');
const TMP_DB_CREDS_FILE = '/tmp/db_credentials.json';

export interface DatabaseCredentials {
  type: 'mongodb' | 'postgres' | 'redis' | 'none';
  mongoUri?: string;
  postgresUrl?: string;
  redisUrl?: string;
  redisToken?: string;
}

// Global cached clients across serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var __mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var __dbCredentials: DatabaseCredentials | undefined;
}

export function getDatabaseCredentials(): DatabaseCredentials {
  if (globalThis.__dbCredentials) {
    return globalThis.__dbCredentials;
  }

  // 1. Check environment variables
  if (process.env.MONGODB_URI) {
    const creds: DatabaseCredentials = {
      type: 'mongodb',
      mongoUri: process.env.MONGODB_URI,
    };
    globalThis.__dbCredentials = creds;
    return creds;
  }

  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    const creds: DatabaseCredentials = {
      type: 'postgres',
      postgresUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    };
    globalThis.__dbCredentials = creds;
    return creds;
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (redisUrl && redisToken) {
    const creds: DatabaseCredentials = {
      type: 'redis',
      redisUrl,
      redisToken,
    };
    globalThis.__dbCredentials = creds;
    return creds;
  }

  // 2. Check local file system credentials saved via Admin UI
  if (fs.existsSync(DB_CREDS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_CREDS_FILE, 'utf-8'));
      globalThis.__dbCredentials = data;
      return data;
    } catch {
      // ignore
    }
  }

  if (fs.existsSync(TMP_DB_CREDS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(TMP_DB_CREDS_FILE, 'utf-8'));
      globalThis.__dbCredentials = data;
      return data;
    } catch {
      // ignore
    }
  }

  return { type: 'none' };
}

export function saveDatabaseCredentials(creds: DatabaseCredentials) {
  globalThis.__dbCredentials = creds;
  globalThis.__mongoClient = undefined; // reset cached client if changed

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_CREDS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
  } catch {
    // ignore read-only fs
  }

  try {
    fs.writeFileSync(TMP_DB_CREDS_FILE, JSON.stringify(creds, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

/* =========================================================
   MongoDB Adapter
   ========================================================= */
async function getMongoClient(uri: string): Promise<MongoClient> {
  if (globalThis.__mongoClient) {
    return globalThis.__mongoClient;
  }
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 6000,
  });
  await client.connect();
  globalThis.__mongoClient = client;
  return client;
}

export async function getMongoState(uri: string): Promise<TournamentState | null> {
  const client = await getMongoClient(uri);
  const db = client.db('kvo_cricket');
  const collection = db.collection('tournament_state');
  const doc = await collection.findOne({ _id: 'current' as any });
  if (!doc) return null;
  const { _id, ...state } = doc as any;
  return state as TournamentState;
}

export async function saveMongoState(uri: string, state: TournamentState): Promise<boolean> {
  const client = await getMongoClient(uri);
  const db = client.db('kvo_cricket');
  const collection = db.collection('tournament_state');
  await collection.updateOne(
    { _id: 'current' as any },
    { $set: { ...state, lastUpdated: new Date().toISOString() } },
    { upsert: true }
  );
  return true;
}

import { Pool } from 'pg';

let pgPool: Pool | null = null;

function getPgPool(dbUrl: string): Pool {
  if (pgPool) return pgPool;
  const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  pgPool = new Pool({
    connectionString: dbUrl,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 7000,
  });
  return pgPool;
}

/* =========================================================
   PostgreSQL Adapter (Universal: Neon, Supabase, Railway, Render)
   ========================================================= */
export async function getPostgresState(dbUrl: string): Promise<TournamentState | null> {
  // 1. If Neon endpoint, prefer lightweight HTTP serverless driver
  if (dbUrl.includes('neon.tech')) {
    try {
      const sql = neon(dbUrl);
      await sql`
        CREATE TABLE IF NOT EXISTS tournament_state (
          id VARCHAR(50) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      const rows = await sql`SELECT data FROM tournament_state WHERE id = 'current' LIMIT 1;`;
      if (rows && rows.length > 0) {
        return rows[0].data as TournamentState;
      }
      return null;
    } catch (e: any) {
      console.warn('Neon HTTP driver fallback to standard pg Pool:', e.message);
    }
  }

  // 2. Standard pg Pool (Works for Supabase, Railway, Render, AWS, and all PostgreSQL databases)
  const pool = getPgPool(dbUrl);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tournament_state (
      id VARCHAR(50) PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const res = await pool.query(`SELECT data FROM tournament_state WHERE id = 'current' LIMIT 1;`);
  if (res.rows && res.rows.length > 0) {
    const d = res.rows[0].data;
    return typeof d === 'string' ? JSON.parse(d) : d;
  }
  return null;
}

export async function savePostgresState(dbUrl: string, state: TournamentState): Promise<boolean> {
  const payload = JSON.stringify(state);

  // 1. If Neon endpoint, use HTTP serverless driver
  if (dbUrl.includes('neon.tech')) {
    try {
      const sql = neon(dbUrl);
      await sql`
        CREATE TABLE IF NOT EXISTS tournament_state (
          id VARCHAR(50) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await sql`
        INSERT INTO tournament_state (id, data, updated_at)
        VALUES ('current', ${payload}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
      `;
      return true;
    } catch (e: any) {
      console.warn('Neon HTTP driver save fallback to standard pg Pool:', e.message);
    }
  }

  // 2. Standard pg Pool
  const pool = getPgPool(dbUrl);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tournament_state (
      id VARCHAR(50) PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(
    `
    INSERT INTO tournament_state (id, data, updated_at)
    VALUES ($1, $2::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
  `,
    ['current', payload]
  );
  return true;
}

/* =========================================================
   Redis Adapter (Upstash / Vercel KV)
   ========================================================= */
export async function getRedisState(url: string, token: string): Promise<TournamentState | null> {
  const redis = new Redis({ url, token });
  const data = await redis.get<TournamentState>('kvo_tournament_state');
  if (typeof data === 'string') {
    return JSON.parse(data);
  }
  return data;
}

export async function saveRedisState(url: string, token: string, state: TournamentState): Promise<boolean> {
  const redis = new Redis({ url, token });
  await redis.set('kvo_tournament_state', state);
  return true;
}

/* =========================================================
   Unified Database Interface
   ========================================================= */
export async function fetchLiveDatabaseState(): Promise<{ state: TournamentState | null; source: string; connected: boolean }> {
  const creds = getDatabaseCredentials();

  // 1. MongoDB
  if (creds.mongoUri) {
    try {
      const state = await getMongoState(creds.mongoUri);
      if (state) {
        return { state, source: 'MongoDB Cloud', connected: true };
      }
      return { state: null, source: 'MongoDB (empty collection)', connected: true };
    } catch (err: any) {
      console.error('MongoDB error:', err.message);
    }
  }

  // 2. PostgreSQL
  if (creds.postgresUrl) {
    try {
      const state = await getPostgresState(creds.postgresUrl);
      if (state) {
        return { state, source: 'PostgreSQL (Neon / Supabase)', connected: true };
      }
      return { state: null, source: 'PostgreSQL (empty table)', connected: true };
    } catch (err: any) {
      console.error('Postgres error:', err.message);
    }
  }

  // 3. Redis / Upstash / KV
  if (creds.redisUrl && creds.redisToken) {
    try {
      const state = await getRedisState(creds.redisUrl, creds.redisToken);
      if (state) {
        return { state, source: 'Upstash Redis / Vercel KV', connected: true };
      }
      return { state: null, source: 'Redis (empty key)', connected: true };
    } catch (err: any) {
      console.error('Redis error:', err.message);
    }
  }

  return { state: null, source: 'Local Server File Storage', connected: false };
}

export async function persistLiveDatabaseState(state: TournamentState): Promise<{ success: boolean; target: string }> {
  const creds = getDatabaseCredentials();

  if (creds.mongoUri) {
    try {
      await saveMongoState(creds.mongoUri, state);
      return { success: true, target: 'MongoDB Cloud' };
    } catch (err: any) {
      console.error('Failed to write to MongoDB:', err.message);
    }
  }

  if (creds.postgresUrl) {
    try {
      await savePostgresState(creds.postgresUrl, state);
      return { success: true, target: 'PostgreSQL (Neon / Supabase)' };
    } catch (err: any) {
      console.error('Failed to write to PostgreSQL:', err.message);
    }
  }

  if (creds.redisUrl && creds.redisToken) {
    try {
      await saveRedisState(creds.redisUrl, creds.redisToken, state);
      return { success: true, target: 'Upstash Redis / Vercel KV' };
    } catch (err: any) {
      console.error('Failed to write to Redis:', err.message);
    }
  }

  return { success: false, target: 'Local File / Memory' };
}

export async function testDatabaseConnectivity(creds: DatabaseCredentials): Promise<{ success: boolean; message: string }> {
  try {
    if (creds.type === 'mongodb' && creds.mongoUri) {
      const client = new MongoClient(creds.mongoUri, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      await client.db('kvo_cricket').command({ ping: 1 });
      await client.close();
      return { success: true, message: 'Successfully connected to MongoDB!' };
    }

    if (creds.type === 'postgres' && creds.postgresUrl) {
      if (creds.postgresUrl.includes('neon.tech')) {
        const sql = neon(creds.postgresUrl);
        await sql`SELECT 1 as connected;`;
      } else {
        const pool = getPgPool(creds.postgresUrl);
        await pool.query('SELECT 1 as connected;');
      }
      return { success: true, message: 'Successfully connected to PostgreSQL database!' };
    }

    if (creds.type === 'redis' && creds.redisUrl && creds.redisToken) {
      const redis = new Redis({ url: creds.redisUrl, token: creds.redisToken });
      await redis.ping();
      return { success: true, message: 'Successfully connected to Upstash Redis / KV!' };
    }

    return { success: false, message: 'No valid database credentials provided.' };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message}` };
  }
}
