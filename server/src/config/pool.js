import { Pool } from 'pg';
import { env } from './env.js';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function checkDbConnection() {
  const result = await pool.query('SELECT 1 AS ok');
  return result.rows[0]?.ok === 1;
}
