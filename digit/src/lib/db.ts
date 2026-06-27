import { Pool } from 'pg';

const connectionString = process.env.DB_URL;

if (!connectionString) {
  throw new Error("DB_URL environment variable is missing from .env.local");
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Auto-ensure the worker_reviews table exists
async function ensureWorkerReviewsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS worker_reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          reviewer_role VARCHAR(20) NOT NULL,
          worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          rating INT NOT NULL,
          review_text VARCHAR(1000),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          CONSTRAINT unique_reviewer_task UNIQUE (reviewer_id, task_id),
          CONSTRAINT unique_reviewer_task_worker UNIQUE (reviewer_id, task_id, worker_id)
      );

      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_worker_reviews_updated_at ON worker_reviews;
      CREATE TRIGGER trigger_update_worker_reviews_updated_at
          BEFORE UPDATE ON worker_reviews
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_worker_reviews_worker_id ON worker_reviews(worker_id);
      CREATE INDEX IF NOT EXISTS idx_worker_reviews_reviewer_id ON worker_reviews(reviewer_id);
      CREATE INDEX IF NOT EXISTS idx_worker_reviews_task_id ON worker_reviews(task_id);
      CREATE INDEX IF NOT EXISTS idx_worker_reviews_created_at ON worker_reviews(created_at DESC);
    `);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Successfully verified/created worker_reviews table.');
    }
  } catch (err) {
    console.error('Failed to auto-create worker_reviews table:', err);
  }
}
ensureWorkerReviewsTable();

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
