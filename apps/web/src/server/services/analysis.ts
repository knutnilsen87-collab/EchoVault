import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { analysisCallbackSchema } from "@echovault/domain";
import { writeAudit } from "../audit";
import { queryOne, withTransaction } from "../db";
import { env } from "../env";
import { storage } from "../storage";

const run = promisify(execFile);

export class PermanentJobError extends Error {}

type WavFile = { storage_key: string; checksum_sha256: string | null; original_filename: string | null };

async function wavFor(trackId: string): Promise<WavFile> {
  const file = await queryOne<WavFile>(
    "SELECT storage_key, checksum_sha256, original_filename FROM track_files WHERE track_id = $1 AND kind = 'high_res_wav'",
    [trackId]
  );
  if (!file) throw new PermanentJobError("HIGH_RES_WAV_MISSING");
  return file;
}

/**
 * Sends the private WAV to the EchoScore service and stores the result.
 * EchoScore is technical QA only — it never approves a track by itself.
 */
export async function runEchoScore(trackId: string, jobId: string, attempt: number): Promise<void> {
  const track = await queryOne<{ status: string }>("SELECT status FROM tracks WHERE id = $1", [trackId]);
  if (!track) throw new PermanentJobError("TRACK_NOT_FOUND");
  if (track.status !== "analysis_pending") return; // stale job (e.g. admin already decided) — nothing to do

  await queryOne(
    "UPDATE echo_score_analyses SET status = 'running', started_at = COALESCE(started_at, now()) WHERE job_id = $1 RETURNING id",
    [jobId]
  );

  const file = await wavFor(trackId);
  const bytes = await (await storage()).get(file.storage_key);
  const form = new FormData();
  form.set("track_id", trackId);
  form.set("job_id", jobId);
  form.set("file", new Blob([bytes as BlobPart], { type: "audio/wav" }), "track.wav");

  const response = await fetch(`${env().ECHOSCORE_SERVICE_URL}/analyze`, {
    method: "POST",
    headers: { "x-service-token": env().ECHOSCORE_SERVICE_TOKEN },
    body: form,
    signal: AbortSignal.timeout(5 * 60 * 1000)
  });
  if (response.status >= 500 || response.status === 429) throw new Error(`ECHOSCORE_HTTP_${response.status}`);
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new PermanentJobError(`ECHOSCORE_REJECTED_${response.status}: ${JSON.stringify(json)?.slice(0, 500)}`);
  const result = analysisCallbackSchema.parse({ ...json, job_id: jobId, track_id: trackId });

  await withTransaction(async (tx) => {
    const locked = await tx.query<{ status: string }>("SELECT status FROM tracks WHERE id = $1 FOR UPDATE", [trackId]);
    if (locked.rows[0]?.status !== "analysis_pending") return;
    const succeeded = result.status === "succeeded";
    await tx.query(
      `UPDATE echo_score_analyses SET analysis_version = $2, status = $3, score = $4, pass = $5, metrics = $6, flags = $7,
              feedback = $8, error_message = $9, completed_at = now()
        WHERE job_id = $1`,
      [
        jobId,
        result.analysis_version,
        succeeded ? "succeeded" : "failed",
        result.score,
        result.pass,
        JSON.stringify(result.metrics ?? {}),
        JSON.stringify(result.flags),
        JSON.stringify(result.feedback),
        result.error_message ?? null
      ]
    );
    // A decoded-but-failing track still goes to a human; only an unreadable file is analysis_failed.
    const next = succeeded ? "needs_human_review" : "analysis_failed";
    await tx.query("UPDATE tracks SET status = $2, ai_quality_score = $3, updated_at = now() WHERE id = $1", [trackId, next, result.score]);
    await writeAudit(tx, {
      actorUserId: null,
      entityType: "track",
      entityId: trackId,
      action: "track.analysis_completed",
      metadata: { job_id: jobId, attempt, status: result.status, score: result.score, pass: result.pass, flags: result.flags }
    });
  });
}

/** Called when the EchoScore job has permanently failed (service down after retries, etc.). */
export async function markAnalysisFailed(trackId: string, jobId: string, error: string): Promise<void> {
  await withTransaction(async (tx) => {
    await tx.query("UPDATE echo_score_analyses SET status = 'failed', error_message = $2, completed_at = now() WHERE job_id = $1", [jobId, error.slice(0, 2000)]);
    const updated = await tx.query("UPDATE tracks SET status = 'analysis_failed', updated_at = now() WHERE id = $1 AND status = 'analysis_pending'", [trackId]);
    if (updated.rowCount) {
      await writeAudit(tx, { actorUserId: null, entityType: "track", entityId: trackId, action: "track.analysis_failed", metadata: { job_id: jobId, error } });
    }
  });
}

/** Admin "retry analysis" from analysis_failed. */
export async function retryAnalysis(actorId: string, trackId: string, requestId: string): Promise<void> {
  const { enqueueJob } = await import("../jobs");
  await withTransaction(async (tx) => {
    const t = await tx.query<{ status: string }>("SELECT status FROM tracks WHERE id = $1 FOR UPDATE", [trackId]);
    if (t.rows[0]?.status !== "analysis_failed") {
      const { AppError } = await import("../errors");
      throw new AppError("INVALID_STATE", "Only tracks with failed analysis can be retried.");
    }
    await tx.query("UPDATE tracks SET status = 'analysis_pending', updated_at = now() WHERE id = $1", [trackId]);
    const jobId = await enqueueJob(tx, "echoscore_analyze", { track_id: trackId }, { dedupeKey: `echoscore:${trackId}` });
    await tx.query("INSERT INTO echo_score_analyses (track_id, analysis_version, status, job_id) VALUES ($1, 'pending', 'queued', $2)", [trackId, jobId]);
    await writeAudit(tx, { actorUserId: actorId, entityType: "track", entityId: trackId, action: "track.analysis_retried", requestId });
  });
}

/** 128 kbps MP3 preview via ffmpeg. The WAV itself is never served publicly. */
export async function generatePreview(trackId: string): Promise<void> {
  const file = await wavFor(trackId);
  const store = await storage();
  const dir = await mkdtemp(path.join(tmpdir(), "ev-preview-"));
  try {
    const input = path.join(dir, "in.wav");
    const output = path.join(dir, "out.mp3");
    await writeFile(input, await store.get(file.storage_key));
    try {
      await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-vn", "-ac", "2", "-ar", "44100", "-b:a", "128k", output], {
        timeout: 5 * 60 * 1000
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new PermanentJobError("FFMPEG_NOT_INSTALLED");
      throw error;
    }
    const mp3 = new Uint8Array(await readFile(output));
    const key = `tracks/${trackId}/preview_mp3/${crypto.randomUUID()}.mp3`;
    await store.put(key, mp3, "audio/mpeg");
    await withTransaction(async (tx) => {
      await tx.query("DELETE FROM track_files WHERE track_id = $1 AND kind = 'preview_mp3'", [trackId]);
      await tx.query(
        `INSERT INTO track_files (track_id, kind, storage_key, original_filename, mime_type, size_bytes, is_public)
         VALUES ($1, 'preview_mp3', $2, 'preview.mp3', 'audio/mpeg', $3, FALSE)`,
        [trackId, key, mp3.byteLength]
      );
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
