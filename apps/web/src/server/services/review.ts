import { assertTransition, toPublicPoeSummary, type TrackStatus } from "@echovault/domain";
import { writeAudit } from "../audit";
import type { SessionUser } from "../auth";
import { query, queryOne, withTransaction } from "../db";
import { AppError, notFound } from "../errors";
import { poeRowToInput, type PoeRow } from "./artist";

export async function reviewQueue() {
  return query<{
    id: string;
    title: string;
    genre: string;
    status: TrackStatus;
    artist_name: string | null;
    submitted_at: string;
    score: number | null;
    pass: boolean | null;
    flags: string[] | null;
  }>(
    `SELECT t.id, t.title, t.genre, t.status, COALESCE(u.artist_name, u.display_name) AS artist_name, t.submitted_at,
            a.score, a.pass, a.flags
       FROM tracks t JOIN users u ON u.id = t.artist_id
       LEFT JOIN LATERAL (SELECT score, pass, flags FROM echo_score_analyses WHERE track_id = t.id ORDER BY created_at DESC LIMIT 1) a ON true
      WHERE t.status IN ('needs_human_review', 'analysis_failed', 'analysis_pending')
      ORDER BY (t.status = 'analysis_pending'), t.submitted_at ASC`
  );
}

export async function reviewDetail(trackId: string) {
  const track = await queryOne<{
    id: string;
    title: string;
    description: string | null;
    genre: string;
    mood: string | null;
    bpm: number | null;
    duration_seconds: number | null;
    status: TrackStatus;
    review_reason: string | null;
    artist_id: string;
    artist_name: string | null;
    artist_email: string;
    submitted_at: string | null;
  }>(
    `SELECT t.id, t.title, t.description, t.genre, t.mood, t.bpm, t.duration_seconds, t.status, t.review_reason, t.artist_id,
            COALESCE(u.artist_name, u.display_name) AS artist_name, u.email AS artist_email, t.submitted_at
       FROM tracks t JOIN users u ON u.id = t.artist_id WHERE t.id = $1`,
    [trackId]
  );
  if (!track) throw notFound("Track");
  const [poe, analyses, reviews, files, audit] = await Promise.all([
    queryOne<PoeRow>("SELECT * FROM proof_of_effort WHERE track_id = $1", [trackId]),
    query("SELECT id, analysis_version, status, score, pass, metrics, flags, feedback, error_message, completed_at FROM echo_score_analyses WHERE track_id = $1 ORDER BY created_at DESC", [trackId]),
    query(
      `SELECT r.decision, r.reason_code, r.reviewer_notes, r.created_at, u.email AS reviewer_email
         FROM track_reviews r LEFT JOIN users u ON u.id = r.reviewer_id WHERE r.track_id = $1 ORDER BY r.created_at DESC`,
      [trackId]
    ),
    query("SELECT id, kind, original_filename, size_bytes, checksum_sha256, created_at FROM track_files WHERE track_id = $1 AND kind <> 'certificate_pdf'", [trackId]),
    query("SELECT action, metadata, created_at FROM audit_logs WHERE entity_type = 'track' AND entity_id = $1 ORDER BY created_at DESC LIMIT 50", [trackId])
  ]);
  return { track, poe, analyses, reviews, files, audit };
}

type Decision = { reason_code?: string; notes?: string; override_reason?: string };

async function decide(
  reviewer: SessionUser,
  trackId: string,
  to: TrackStatus,
  decision: "approve" | "reject" | "request_changes" | "suspend",
  input: Decision,
  requestId: string
) {
  return withTransaction(async (tx) => {
    const { rows } = await tx.query<{ status: TrackStatus; artist_id: string }>("SELECT status, artist_id FROM tracks WHERE id = $1 FOR UPDATE", [trackId]);
    const track = rows[0];
    if (!track) throw notFound("Track");
    if (track.artist_id === reviewer.id) throw new AppError("FORBIDDEN", "Reviewers cannot decide on their own tracks.");
    try {
      assertTransition(track.status, to);
    } catch {
      throw new AppError("INVALID_STATE", `Cannot ${decision.replace("_", " ")} a track that is ${track.status}.`);
    }

    let overrideUsed = false;
    if (to === "approved" && track.status !== "suspended") {
      // BR-003 / BR-004: PoE complete and EchoScore passed — or an explicit, logged override.
      const poe = await tx.query<PoeRow>("SELECT * FROM proof_of_effort WHERE track_id = $1", [trackId]);
      if (!poe.rows[0]) throw new AppError("INVALID_STATE", "Track has no Proof of Effort.");
      const analysis = await tx.query<{ status: string; pass: boolean | null; score: number | null; metrics: Record<string, unknown> | null }>(
        "SELECT status, pass, score, metrics FROM echo_score_analyses WHERE track_id = $1 ORDER BY created_at DESC LIMIT 1",
        [trackId]
      );
      const a = analysis.rows[0];
      const passed = a?.status === "succeeded" && a.pass === true;
      if (!passed) {
        if (!input.override_reason) {
          throw new AppError("INVALID_STATE", "EchoScore has not passed. Approving requires an explicit override_reason.");
        }
        overrideUsed = true;
        await tx.query("INSERT INTO track_reviews (track_id, reviewer_id, decision, reason_code, reviewer_notes) VALUES ($1, $2, 'override_analysis', $3, $4)", [
          trackId,
          reviewer.id,
          input.reason_code ?? "analysis_override",
          input.override_reason
        ]);
      }
      const summary = toPublicPoeSummary(poeRowToInput(poe.rows[0]));
      const analysisSummary = a
        ? {
            score: a.score,
            pass: a.pass,
            integrated_lufs: a.metrics?.integrated_lufs ?? null,
            true_peak_db: a.metrics?.true_peak_db ?? null,
            override: overrideUsed
          }
        : { override: true };
      await tx.query(
        `UPDATE tracks SET status = 'approved', approved_at = now(), suspended_at = NULL, review_reason = NULL,
                public_poe_summary = jsonb_set($2::jsonb, '{reviewed_at}', to_jsonb(now())), analysis_summary = $3, updated_at = now()
          WHERE id = $1`,
        [trackId, JSON.stringify(summary), JSON.stringify(analysisSummary)]
      );
    } else if (to === "approved") {
      // Reinstating a suspended track.
      await tx.query("UPDATE tracks SET status = 'approved', suspended_at = NULL, review_reason = NULL, updated_at = now() WHERE id = $1", [trackId]);
    } else {
      await tx.query(
        `UPDATE tracks SET status = $2::track_status, review_reason = $3, updated_at = now(),
                suspended_at = CASE WHEN $2::track_status = 'suspended' THEN now() ELSE suspended_at END
          WHERE id = $1`,
        [trackId, to, input.reason_code ?? null]
      );
    }

    await tx.query("INSERT INTO track_reviews (track_id, reviewer_id, decision, reason_code, reviewer_notes) VALUES ($1, $2, $3, $4, $5)", [
      trackId,
      reviewer.id,
      decision,
      input.reason_code ?? null,
      input.notes ?? null
    ]);
    await writeAudit(tx, {
      actorUserId: reviewer.id,
      entityType: "track",
      entityId: trackId,
      action: `track.${decision === "approve" && track.status === "suspended" ? "reinstated" : decision}`,
      metadata: { from: track.status, to, reason_code: input.reason_code ?? null, override: overrideUsed },
      requestId
    });
    return { id: trackId, status: to, override: overrideUsed };
  });
}

export const approveTrack = (u: SessionUser, id: string, i: Decision, r: string) => decide(u, id, "approved", "approve", i, r);

export function rejectTrack(u: SessionUser, id: string, i: Decision, r: string) {
  if (!i.reason_code) throw new AppError("VALIDATION_ERROR", "reason_code is required to reject.");
  return decide(u, id, "rejected", "reject", i, r);
}

export function requestChanges(u: SessionUser, id: string, i: Decision, r: string) {
  if (!i.reason_code) throw new AppError("VALIDATION_ERROR", "reason_code is required when requesting changes.");
  return decide(u, id, "changes_requested", "request_changes", i, r);
}

/** BR-010: stops new purchases and previews; existing licenses are untouched. */
export async function suspendTrack(u: SessionUser, id: string, input: { reason: string; dispute_id?: string }, r: string) {
  const result = await decide(u, id, "suspended", "suspend", { reason_code: "suspended", notes: input.reason }, r);
  if (input.dispute_id) {
    await query("UPDATE disputes SET suspended_track = TRUE, status = 'investigating' WHERE id = $1 AND track_id = $2", [input.dispute_id, id]);
  }
  return result;
}

export const reinstateTrack = (u: SessionUser, id: string, notes: string, r: string) =>
  decide(u, id, "approved", "approve", { reason_code: "reinstated", notes }, r);
