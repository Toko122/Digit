import { Pool } from 'pg';

const connectionString = process.env.DB_URL;

if (!connectionString) {
  throw new Error("DB_URL environment variable is missing from .env.local");
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params as Parameters<typeof pool.query>[1]);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res.rows as T[];
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

export default pool;
