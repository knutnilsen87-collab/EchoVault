import { claimJob, claimJobById, completeJob, failJob, type Job, type JobKind } from "./jobs";
import { logEvent } from "./logger";
import { generatePreview, markAnalysisFailed, PermanentJobError, runEchoScore } from "./services/analysis";
import { generateCertificate } from "./services/licenses";
import { query } from "./db";

async function execute(job: Job): Promise<void> {
  const p = job.payload as Record<string, string>;
  switch (job.kind) {
    case "echoscore_analyze":
      return runEchoScore(p.track_id!, job.id, job.attempts);
    case "generate_preview":
      return generatePreview(p.track_id!);
    case "generate_certificate":
      await generateCertificate(p.license_id!);
      return;
  }
}

async function onPermanentFailure(job: Job, error: unknown): Promise<void> {
  const p = job.payload as Record<string, string>;
  const message = error instanceof Error ? error.message : String(error);
  if (job.kind === "echoscore_analyze") await markAnalysisFailed(p.track_id!, job.id, message);
  if (job.kind === "generate_certificate") {
    await query("INSERT INTO license_events (license_id, type, metadata) VALUES ($1, 'certificate_failed', $2)", [p.license_id, JSON.stringify({ error: message })]);
  }
}

export async function processJob(job: Job): Promise<"succeeded" | "retry" | "failed"> {
  try {
    await execute(job);
    await completeJob(job.id);
    logEvent({ level: "info", event: "job_succeeded", details: { jobId: job.id, kind: job.kind } });
    return "succeeded";
  } catch (error) {
    const final = await failJob(job, error, { permanent: error instanceof PermanentJobError });
    if (final) await onPermanentFailure(job, error);
    return final ? "failed" : "retry";
  }
}

/** Process one job now if it's still queued (used right after the webhook for instant certificates). */
export async function processJobNow(id: string) {
  const job = await claimJobById(id);
  return job ? processJob(job) : null;
}

/** Drain everything ready. Returns number processed. Used by the worker loop and tests. */
export async function drainJobs(kinds?: JobKind[], limit = 100): Promise<number> {
  let n = 0;
  while (n < limit) {
    const job = await claimJob(kinds);
    if (!job) break;
    await processJob(job);
    n++;
  }
  return n;
}
