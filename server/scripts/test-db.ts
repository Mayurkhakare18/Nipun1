import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

import { normalizeDatabaseUrl, getPostgresPoolConfig } from '../utils/db-url.js';

export { normalizeDatabaseUrl };

async function testDatabaseConnection() {
  const rawDatabaseUrl = process.env.DATABASE_URL;

  console.log('--- Database Connection Diagnostic ---');
  if (!rawDatabaseUrl) {
    console.error('❌ FAILED: DATABASE_URL environment variable is not defined.');
    console.error('Please ensure DATABASE_URL is properly configured in your environment.');
    process.exit(1);
  }

  const databaseUrl = normalizeDatabaseUrl(rawDatabaseUrl);

  // Obfuscate credentials for secure logging
  try {
    const parsed = new URL(databaseUrl);
    console.log(`📡 Connecting to host: ${parsed.hostname}:${parsed.port || '5432'}, database: ${parsed.pathname.slice(1)}, user: ${parsed.username}`);
  } catch {
    console.log('📡 Connecting using custom connection string...');
  }

  const config = getPostgresPoolConfig(rawDatabaseUrl);
  if (!config) {
    console.error('❌ FAILED: Invalid DATABASE_URL configuration.');
    process.exit(1);
  }

  const pool = new Pool(config);

  const startTime = Date.now();

  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT 1 AS connected, NOW() as current_time, version();');
      const durationMs = Date.now() - startTime;
      console.log('✅ SUCCESS: Database connected successfully!');
      console.log(`⏱️ Latency: ${durationMs}ms`);
      if (res.rows && res.rows[0]) {
        console.log(`🕒 Server Time: ${res.rows[0].current_time}`);
        console.log(`📦 DB Version: ${res.rows[0].version ? res.rows[0].version.split(',')[0] : 'PostgreSQL'}`);
      }
    } finally {
      client.release();
    }
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error(`❌ FAILED after ${durationMs}ms:`, err?.message || String(err));
    if (err?.code) {
      console.error(`Error Code: ${err.code}`);
    }
    if (err?.detail) {
      console.error(`Detail: ${err.detail}`);
    }
    if (err?.hint) {
      console.error(`Hint: ${err.hint}`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection().catch((err) => {
  console.error('Unhandled fatal error in test-db script:', err);
  process.exit(1);
});
