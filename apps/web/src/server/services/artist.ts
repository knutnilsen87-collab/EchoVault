import { createHash } from "node:crypto";
import {
  assertTransition,
  isArtistEditable,
  proofOfEffortProblems,
  type ProofOfEffortInput,
  type TrackStatus,
  createTrackDraftSchema,
  proofOfEffortSchema
} from "@echovault/domain";
import type { z } from "zod";
import { writeAudit } from "../audit";
import type { SessionUser } from "../auth";
import { pool, query, queryOne, withTransaction, type Queryable } from "../db";
import { AppError, notFound } from "../errors";
import { enqueueJob } from "../jobs";
import { parseWav } from "../audio";
import { storage } from "../storage";

export const MAX_WAV_BYTES = 250 * 1024 * 1024;
export const MAX_ART_BYTES = 10 * 1024 * 1024;

export type ArtistTrackRow = {
  id: string;
  title: string;
  description: string | null;
  genre: string;
  mood: string | null;
  bpm: number | null;
  duration_seconds: number | null;
  status: TrackStatus;
  review_reason: string | null;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
};

const TRACK_COLUMNS = "id, title, description, genre, mood, bpm, duration_seconds, status, review_reason, created_at, submitted_at, approved_at";

async function ownTrack(user: SessionUser, trackId: string, forUpdate = false, db: Queryable = pool()) {
  const { rows } = await db.query<ArtistTrackRow>(
    `SELECT ${TRACK_COLUMNS} FROM tracks WHERE id = $1 AND (artist_id = $2 OR $3) ${forUpdate ? "FOR UPDATE" : ""}`,
    [trackId, user.id, user.role === "admin"]
  );
  const track = rows[0];
  if (!track) throw notFound("Track");
  return track;
}

function assertEditable(track: ArtistTrackRow) {
  if (!isArtistEditable(track.status)) {
    throw new AppError("INVALID_STATE", `Track is ${track.status}; it can only be edited as draft or after changes are requested.`);
  }
}

export async function createDraft(user: SessionUser, input: z.infer<typeof createTrackDraftSchema>, requestId: string) {
  return withTransaction(async (tx) => {
    const { rows } = await tx.query<ArtistTrackRow>(
      `INSERT INTO tracks (artist_id, title, description, genre, mood, bpm, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft') RETURNING ${TRACK_COLUMNS}`,
      [user.id, input.title, input.description ?? null, input.genre, input.mood ?? null, input.bpm ?? null]
    );
    const track = rows[0]!;
    await writeAudit(tx, { actorUserId: user.id, entityType: "track", entityId: track.id, action: "track.draft_created", requestId });
    return track;
  });
}

export async function listArtistTracks(user: SessionUser) {
  return query<ArtistTrackRow & { has_wav: boolean; has_poe: boolean; score: number | null; pass: boolean | null }>(
    `SELECT ${TRACK_COLUMNS.split(", ").map((c) => `t.${c}`).join(", ")},
            EXISTS (SELECT 1 FROM track_files f WHERE f.track_id = t.id AND f.kind = 'high_res_wav') AS has_wav,
            EXISTS (SELECT 1 FROM proof_of_effort p WHERE p.track_id = t.id) AS has_poe,
            a.score, a.pass
       FROM tracks t
       LEFT JOIN LATERAL (SELECT score, pass FROM echo_score_analyses WHERE track_id = t.id ORDER BY created_at DESC LIMIT 1) a ON true
      WHERE t.artist_id = $1
      ORDER BY t.created_at DESC`,
    [user.id]
  );
}

export type PoeRow = {
  creation_mode: ProofOfEffortInput["creationMode"];
  ai_tools_used: string[];
  process_summary: string;
  daw_manual_work: string | null;
  time_spent_bucket: ProofOfEffortInput["timeSpentBucket"];
  samples_used: ProofOfEffortInput["samplesUsed"];
  sample_notes: string | null;
  voice_or_likeness_used: boolean;
  named_artist_imitation: boolean;
  rights_warranty_accepted: boolean;
  private_notes: string | null;
  submitted_at: string | null;
  updated_at: string;
};

export function poeRowToInput(p: PoeRow): ProofOfEffortInput {
  return {
    creationMode: p.creation_mode,
    aiToolsUsed: p.ai_tools_used,
    processSummary: p.process_summary,
    dawManualWork: p.daw_manual_work,
    timeSpentBucket: p.time_spent_bucket,
    samplesUsed: p.samples_used,
    sampleNotes: p.sample_notes,
    voiceOrLikenessUsed: p.voice_or_likeness_used,
    namedArtistImitation: p.named_artist_imitation,
    rightsWarrantyAccepted: p.rights_warranty_accepted,
    privateNotes: p.private_notes
  };
}

export async function getArtistTrack(user: SessionUser, trackId: string) {
  const track = await ownTrack(user, trackId);
  const [files, poe, analysis, reviews] = await Promise.all([
    query<{ id: string; kind: string; original_filename: string | null; mime_type: string; size_bytes: number | null; checksum_sha256: string | null; created_at: string }>(
      "SELECT id, kind, original_filename, mime_type, size_bytes, checksum_sha256, created_at FROM track_files WHERE track_id = $1 AND kind <> 'certificate_pdf' ORDER BY created_at",
      [trackId]
    ),
    queryOne<PoeRow>("SELECT * FROM proof_of_effort WHERE track_id = $1", [trackId]),
    queryOne<{ status: string; score: number | null; pass: boolean | null; metrics: Record<string, unknown> | null; flags: string[]; feedback: string[]; analysis_version: string; completed_at: string | null }>(
      "SELECT status, score, pass, metrics, flags, feedback, analysis_version, completed_at FROM echo_score_analyses WHERE track_id = $1 ORDER BY created_at DESC LIMIT 1",
      [trackId]
    ),
    // Artists see decisions and reason codes, not internal reviewer notes.
    query<{ decision: string; reason_code: string | null; created_at: string }>(
      "SELECT decision, reason_code, created_at FROM track_reviews WHERE track_id = $1 ORDER BY created_at DESC",
      [trackId]
    )
  ]);
  return {
    track,
    files,
    poe,
    poe_problems: poe ? proofOfEffortProblems(poeRowToInput(poe)) : ["POE_MISSING"],
    analysis,
    reviews
  };
}

export async function updateDraft(user: SessionUser, trackId: string, input: Partial<z.infer<typeof createTrackDraftSchema>>, requestId: string) {
  return withTransaction(async (tx) => {
    const track = await ownTrack(user, trackId, true, tx);
    assertEditable(track);
    const { rows } = await tx.query<ArtistTrackRow>(
      `UPDATE tracks SET title = COALESCE($2, title), description = COALESCE($3, description), genre = COALESCE($4, genre),
              mood = COALESCE($5, mood), bpm = COALESCE($6, bpm), updated_at = now()
        WHERE id = $1 RETURNING ${TRACK_COLUMNS}`,
      [trackId, input.title ?? null, input.description ?? null, input.genre ?? null, input.mood ?? null, input.bpm ?? null]
    );
    await writeAudit(tx, { actorUserId: user.id, entityType: "track", entityId: trackId, action: "track.metadata_updated", requestId });
    return rows[0]!;
  });
}

/** Stores a private file. WAVs are validated and their duration recorded. Replaces the previous file of the same kind. */
export async function uploadTrackFile(
  user: SessionUser,
  trackId: string,
  file: { kind: "high_res_wav" | "artwork_image"; bytes: Uint8Array; filename: string; mimeType: string },
  requestId: string
) {
  const track = await ownTrack(user, trackId);
  assertEditable(track);

  let durationSeconds: number | null = null;
  if (file.kind === "high_res_wav") {
    if (file.bytes.byteLength > MAX_WAV_BYTES) throw new AppError("VALIDATION_ERROR", "WAV is larger than 250 MB.");
    try {
      const info = parseWav(file.bytes);
      durationSeconds = info.durationSeconds;
      if (info.sampleRate < 44100 || info.bitsPerSample < 16) {
        throw new AppError("VALIDATION_ERROR", "High-res WAV must be at least 44.1 kHz / 16-bit.");
      }
      if (durationSeconds < 5) throw new AppError("VALIDATION_ERROR", "Track must be at least 5 seconds long.");
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("VALIDATION_ERROR", "File is not a readable WAV.", { reason: (error as Error).message });
    }
  } else {
    if (file.bytes.byteLength > MAX_ART_BYTES) throw new AppError("VALIDATION_ERROR", "Artwork is larger than 10 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimeType)) throw new AppError("VALIDATION_ERROR", "Artwork must be JPEG, PNG or WebP.");
  }

  const checksum = createHash("sha256").update(file.bytes).digest("hex");
  const ext = file.kind === "high_res_wav" ? "wav" : file.mimeType.split("/")[1];
  const key = `tracks/${trackId}/${file.kind}/${crypto.randomUUID()}.${ext}`;
  const mimeType = file.kind === "high_res_wav" ? "audio/wav" : file.mimeType;
  await (await storage()).put(key, file.bytes, mimeType);

  return withTransaction(async (tx) => {
    const locked = await ownTrack(user, trackId, true, tx);
    assertEditable(locked);
    await tx.query("DELETE FROM track_files WHERE track_id = $1 AND kind = $2", [trackId, file.kind]);
    const { rows } = await tx.query<{ id: string }>(
      `INSERT INTO track_files (track_id, kind, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE) RETURNING id`,
      [trackId, file.kind, key, file.filename.slice(0, 255), mimeType, file.bytes.byteLength, checksum]
    );
    if (durationSeconds !== null) {
      await tx.query("UPDATE tracks SET duration_seconds = $2, updated_at = now() WHERE id = $1", [trackId, Math.round(durationSeconds)]);
    }
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "track",
      entityId: trackId,
      action: "track.file_uploaded",
      metadata: { kind: file.kind, checksum_sha256: checksum, size_bytes: file.bytes.byteLength },
      requestId
    });
    return { id: rows[0]!.id, kind: file.kind, checksum_sha256: checksum, size_bytes: file.bytes.byteLength, duration_seconds: durationSeconds };
  });
}

export async function saveProofOfEffort(user: SessionUser, trackId: string, input: z.infer<typeof proofOfEffortSchema>, requestId: string) {
  // Hard blocks are enforced at save time too, so artists get immediate feedback.
  const problems = proofOfEffortProblems({
    creationMode: input.creation_mode,
    aiToolsUsed: input.ai_tools_used,
    processSummary: input.process_summary,
    dawManualWork: input.daw_manual_work,
    timeSpentBucket: input.time_spent_bucket,
    samplesUsed: input.samples_used,
    voiceOrLikenessUsed: input.voice_or_likeness_used,
    namedArtistImitation: input.named_artist_imitation,
    rightsWarrantyAccepted: input.rights_warranty_accepted
  });
  if (problems.length > 0) throw new AppError("POE_INVALID", "Proof of Effort does not meet the submission standard.", { problems });

  return withTransaction(async (tx) => {
    const track = await ownTrack(user, trackId, true, tx);
    assertEditable(track);
    await tx.query(
      `INSERT INTO proof_of_effort (track_id, creation_mode, ai_tools_used, process_summary, daw_manual_work, time_spent_bucket,
              samples_used, sample_notes, voice_or_likeness_used, named_artist_imitation, rights_warranty_accepted, private_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (track_id) DO UPDATE SET creation_mode = EXCLUDED.creation_mode, ai_tools_used = EXCLUDED.ai_tools_used,
              process_summary = EXCLUDED.process_summary, daw_manual_work = EXCLUDED.daw_manual_work,
              time_spent_bucket = EXCLUDED.time_spent_bucket, samples_used = EXCLUDED.samples_used, sample_notes = EXCLUDED.sample_notes,
              voice_or_likeness_used = EXCLUDED.voice_or_likeness_used, named_artist_imitation = EXCLUDED.named_artist_imitation,
              rights_warranty_accepted = EXCLUDED.rights_warranty_accepted, private_notes = EXCLUDED.private_notes, updated_at = now()`,
      [
        trackId,
        input.creation_mode,
        JSON.stringify(input.ai_tools_used),
        input.process_summary,
        input.daw_manual_work ?? null,
        input.time_spent_bucket,
        input.samples_used,
        input.sample_notes ?? null,
        input.voice_or_likeness_used,
        input.named_artist_imitation,
        input.rights_warranty_accepted,
        input.private_notes ?? null
      ]
    );
    await writeAudit(tx, {
      actorUserId: user.id,
      entityType: "track",
      entityId: trackId,
      action: "track.poe_saved",
      metadata: { rights_warranty_accepted: input.rights_warranty_accepted },
      requestId
    });
    return { saved: true };
  });
}

/** draft|changes_requested → submitted → analysis_pending, and queues EchoScore + preview jobs. */
export async function submitTrack(user: SessionUser, trackId: string, requestId: string) {
  return withTransaction(async (tx) => {
    const track = await ownTrack(user, trackId, true, tx);
    assertEditable(track);
    const wav = await tx.query("SELECT id FROM track_files WHERE track_id = $1 AND kind = 'high_res_wav'", [trackId]);
    if (wav.rowCount === 0) throw new AppError("INVALID_STATE", "Upload the high-res WAV before submitting.");
    const poe = await tx.query<PoeRow>("SELECT * FROM proof_of_effort WHERE track_id = $1", [trackId]);
    if (!poe.rows[0]) throw new AppError("POE_INVALID", "Proof of Effort is required before submission.", { problems: ["POE_MISSING"] });
    const problems = proofOfEffortProblems(poeRowToInput(poe.rows[0]));
    if (problems.length > 0) throw new AppError("POE_INVALID", "Proof of Effort does not meet the submission standard.", { problems });

    assertTransition(track.status, "submitted");
    assertTransition("submitted", "analysis_pending");
    await tx.query(
      "UPDATE tracks SET status = 'analysis_pending', submitted_at = now(), review_reason = NULL, updated_at = now() WHERE id = $1",
      [trackId]
    );
    await tx.query("UPDATE proof_of_effort SET submitted_at = now() WHERE track_id = $1", [trackId]);
    const jobId = await enqueueJob(tx, "echoscore_analyze", { track_id: trackId }, { dedupeKey: `echoscore:${trackId}` });
    await tx.query(
      "INSERT INTO echo_score_analyses (track_id, analysis_version, status, job_id) VALUES ($1, 'pending', 'queued', $2)",
      [trackId, jobId]
    );
    await enqueueJob(tx, "generate_preview", { track_id: trackId }, { dedupeKey: `preview:${trackId}` });
    await writeAudit(tx, { actorUserId: user.id, entityType: "track", entityId: trackId, action: "track.submitted", requestId });
    return { id: trackId, status: "analysis_pending" as const };
  });
}
