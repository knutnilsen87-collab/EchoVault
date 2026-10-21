import type { PoolClient } from "pg";
import { query, queryOne, type Queryable } from "./db";
import { logEvent } from "./logger";

export type JobKind = "echoscore_analyze" | "generate_preview" | "generate_certificate";

export type Job = {
  id: string;
  kind: JobKind;
  payload: Record<string, unknown>;
  status: "queued" | "running" | "succeeded" | "failed";
  attempts: number;
  max_attempts: number;
};

export async function enqueueJob(
  db: Queryable,
  kind: JobKind,
  payload: Record<string, unknown>,
  opts: { dedupeKey?: string; maxAttempts?: number } = {}
): Promise<string> {
  const row = await db.query<{ id: string }>(
    `INSERT INTO jobs (kind, payload, dedupe_key, max_attempts) VALUES ($1, $2, $3, $4)
     ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL AND status IN ('queued','running') DO UPDATE SET updated_at = now()
     RETURNING id`,
    [kind, JSON.stringify(payload), opts.dedupeKey ?? null, opts.maxAttempts ?? 3]
  );
  return row.rows[0]!.id;
}

/** Claims one ready job. Stale `running` jobs (crashed worker) are reclaimed after 10 minutes. */
export async function claimJob(kinds?: JobKind[]): Promise<Job | null> {
  return queryOne<Job>(
    `UPDATE jobs SET status = 'running', attempts = attempts + 1, locked_at = now(), updated_at = now()
      WHERE id = (
        SELECT id FROM jobs
         WHERE ((status = 'queued' AND run_after <= now())
             OR (status = 'running' AND locked_at < now() - interval '10 minutes'))
           AND ($1::text[] IS NULL OR kind = ANY($1))
         ORDER BY run_after
         FOR UPDATE SKIP LOCKED
         LIMIT 1)
      RETURNING id, kind, payload, status, attempts, max_attempts`,
    [kinds ?? null]
  );
}

export async function claimJobById(id: string): Promise<Job | null> {
  return queryOne<Job>(
    `UPDATE jobs SET status = 'running', attempts = attempts + 1, locked_at = now(), updated_at = now()
      WHERE id = (SELECT id FROM jobs WHERE id = $1 AND status = 'queued' FOR UPDATE SKIP LOCKED)
      RETURNING id, kind, payload, status, attempts, max_attempts`,
    [id]
  );
}

export async function completeJob(id: string): Promise<void> {
  await query("UPDATE jobs SET status = 'succeeded', locked_at = NULL, last_error = NULL, updated_at = now() WHERE id = $1", [id]);
}

/** Exponential backoff (5s, 25s, 125s…). Returns true when the job is permanently failed. */
export async function failJob(job: Job, error: unknown, opts: { permanent?: boolean } = {}): Promise<boolean> {
  const message = error instanceof Error ? error.message : String(error);
  const final = opts.permanent || job.attempts >= job.max_attempts;
  await query(
    `UPDATE jobs SET status = $2, last_error = $3, locked_at = NULL, updated_at = now(),
            run_after = now() + ($4 || ' seconds')::interval
      WHERE id = $1`,
    [job.id, final ? "failed" : "queued", message.slice(0, 2000), String(5 ** job.attempts)]
  );
  logEvent({ level: final ? "error" : "warn", event: "job_failed", details: { jobId: job.id, kind: job.kind, attempt: job.attempts, final, error: message } });
  return final;
}

export type { PoolClient };
