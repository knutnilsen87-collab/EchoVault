import pg from "pg";
import { env } from "./env";

// DECIMAL/NUMERIC as JS numbers (money is stored in integer cents; decimals are display-only).
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
// BIGINT as number (file sizes stay far below 2^53).
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));

export type Queryable = {
  query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params?: unknown[]): Promise<pg.QueryResult<T>>;
};

const globalForPool = globalThis as unknown as { __echovaultPool?: pg.Pool };

export function pool(): pg.Pool {
  if (!globalForPool.__echovaultPool) {
    globalForPool.__echovaultPool = new pg.Pool({ connectionString: env().DATABASE_URL, max: 10 });
  }
  return globalForPool.__echovaultPool;
}

export async function closePool(): Promise<void> {
  if (globalForPool.__echovaultPool) {
    await globalForPool.__echovaultPool.end();
    globalForPool.__echovaultPool = undefined;
  }
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(fn: (tx: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
