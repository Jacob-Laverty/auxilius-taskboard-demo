import pg from 'pg';

const { Pool } = pg;

/* 
* This is kinda jank, generally not a fan of statically defined global vars
* but the alternative is a bit more scope than I want. Using an actual pool object
* with a private constructor etc. In a non demo I'd opt for that
*/
let pool: pg.Pool | null = null;

/**
 * Lazy load db pool so imports dont create connections.
 * Connections only created when we use the pool
 */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}