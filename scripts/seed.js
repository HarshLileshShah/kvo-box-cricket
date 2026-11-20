/**
 * KVO Box Cricket Tournament - Database Seed Script
 * Run with: npm run db:seed
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 1. Load .env.local or .env if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const f of envFiles) {
    const fullPath = path.join(process.cwd(), f);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx > 0) {
            const key = trimmed.substring(0, idx).trim();
            const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
      console.log(`Loaded environment from ${f}`);
      break;
    }
  }

  // Also check data/db_credentials.json
  const credsFile = path.join(process.cwd(), 'data', 'db_credentials.json');
  if (fs.existsSync(credsFile)) {
    try {
      const creds = JSON.parse(fs.readFileSync(credsFile, 'utf-8'));
      if (creds.postgresUrl && !process.env.DATABASE_URL) {
        process.env.DATABASE_URL = creds.postgresUrl;
      }
      if (creds.mongoUri && !process.env.MONGODB_URI) {
        process.env.MONGODB_URI = creds.mongoUri;
      }
    } catch {}
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.error('\n❌ Error: No DATABASE_URL or POSTGRES_URL found!');
  console.log('Please provide your PostgreSQL connection string in .env.local:');
  console.log('  DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require\n');
  process.exit(1);
}

// 2. Load tournament state from data/tournament_state.json
const stateFile = path.join(process.cwd(), 'data', 'tournament_state.json');
let tournamentState;

if (fs.existsSync(stateFile)) {
  tournamentState = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
} else {
  console.error('❌ Error: tournament_state.json not found!');
  process.exit(1);
}

async function seed() {
  console.log('\n🚀 Starting PostgreSQL Database Seeding...');
  console.log(`Connecting to: ${dbUrl.replace(/:([^@]+)@/, ':****@')}`);

  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log('✓ Successfully connected to PostgreSQL server!');

    // Create table if not exists
    console.log('Ensuring tournament_state table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tournament_state (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Table tournament_state is ready.');

    // Seed data
    tournamentState.lastUpdated = new Date().toISOString();
    console.log(`Seeding state: ${tournamentState.teams.length} teams, ${tournamentState.matches.length} matches...`);

    await client.query(`
      INSERT INTO tournament_state (id, data, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
    `, ['current', JSON.stringify(tournamentState)]);

    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Summary of seeded data:');
    tournamentState.teams.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name} (${t.shortName}) - ${t.players.length} players [Captain: ${t.players.find(p => p.isCaptain)?.name || 'N/A'}]`);
    });
    console.log(`Total Matches: ${tournamentState.matches.length} (9 League + 3 Playoffs)\n`);

    client.release();
    await pool.end();
  } catch (err) {
    console.error('\n❌ Seeding failed with error:', err.message);
    process.exit(1);
  }
}

seed();
