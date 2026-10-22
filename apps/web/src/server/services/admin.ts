import type { DisputeStatus, LicenseTier, UserRole } from "@echovault/domain";
import { writeAudit } from "../audit";
import type { SessionUser } from "../auth";
import { query, queryOne, withTransaction } from "../db";
import { AppError, notFound } from "../errors";

// ── Disputes ──────────────────────────────────────────────────────────
export async function disputeDetail(id: string) {
  const dispute = await queryOne<{
    id: string;
    status: DisputeStatus;
    reason_category: string | null;
    claim_summary: string;
    resolution_notes: string | null;
    created_at: string;
    resolved_at: string | null;
    suspended_track: boolean;
    track_id: string | null;
    track_title: string | null;
    track_status: string | null;
    purchased_license_id: string | null;
    opened_by: string | null;
    resolved_by: string | null;
  }>(
    `SELECT d.id, d.status, d.reason_category, d.claim_summary, d.resolution_notes, d.created_at, d.resolved_at, d.suspended_track,
            d.track_id, t.title AS track_title, t.status AS track_status, d.purchased_license_id,
            o.email AS opened_by, r.email AS resolved_by
       FROM disputes d LEFT JOIN tracks t ON t.id = d.track_id LEFT JOIN users o ON o.id = d.opened_by_user_id
       LEFT JOIN users r ON r.id = d.resolved_by_user_id
      WHERE d.id = $1`,
    [id]
  );
  if (!dispute) throw notFound("Dispute");
  const history = await query<{ action: string; metadata: Record<string, unknown>; created_at: string; actor: string | null }>(
    `SELECT a.action, a.metadata, a.created_at, u.email AS actor FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
      WHERE a.entity_type = 'dispute' AND a.entity_id = $1 ORDER BY a.created_at DESC`,
    [id]
  );
  return { dispute, history };
}

const TERMINAL: DisputeStatus[] = ["resolved_valid", "resolved_invalid", "closed"];

export async function updateDispute(actor: SessionUser, id: string, input: { status: DisputeStatus; resolution_notes?: string }, requestId: string) {
  if (TERMINAL.includes(input.status) && !input.resolution_notes?.trim()) {
    throw new AppError("VALIDATION_ERROR", "Resolution notes are required to resolve or close a dispute.");
  }
  return withTransaction(async (tx) => {
    const cur = await tx.query<{ status: DisputeStatus }>("SELECT status FROM disputes WHERE id = $1 FOR UPDATE", [id]);
    if (!cur.rows[0]) throw notFound("Dispute");
    await tx.query(
      `UPDATE disputes SET status = $2, resolution_notes = COALESCE($3, resolution_notes), updated_at = now(),
              resolved_at = CASE WHEN $4 THEN now() ELSE NULL END,
              resolved_by_user_id = CASE WHEN $4 THEN $5::uuid ELSE NULL END
        WHERE id = $1`,
      [id, input.status, input.resolution_notes?.trim() || null, TERMINAL.includes(input.status), actor.id]
    );
    await writeAudit(tx, {
      actorUserId: actor.id,
      entityType: "dispute",
      entityId: id,
      action: "dispute.status_changed",
      metadata: { from: cur.rows[0].status, to: input.status, notes: input.resolution_notes ?? null },
      requestId
    });
    return { id, status: input.status };
  });
}

/** Everything needed to answer a claim, in one JSON document (Total_Product_Surface_Map: evidence pack). */
export async function disputeEvidencePack(actor: SessionUser, id: string, requestId: string) {
  const { dispute, history } = await disputeDetail(id);
  const licenseId = dispute.purchased_license_id;
  const trackId = dispute.track_id;
  const [license, events, certificate, poe, analyses, reviews, files, trackAudit] = await Promise.all([
    licenseId
      ? queryOne(
          `SELECT l.id, l.tier, l.purchased_at, l.price_paid_cents, l.currency, l.whitelisted_url, l.project_or_client_name,
                  l.stripe_session_id, l.stripe_payment_intent_id, l.terms_snapshot, tv.version AS terms_version, b.email AS buyer_email
             FROM purchased_licenses l JOIN license_terms_versions tv ON tv.id = l.terms_version_id JOIN users b ON b.id = l.buyer_id
            WHERE l.id = $1`,
          [licenseId]
        )
      : null,
    licenseId ? query("SELECT type, metadata, created_at FROM license_events WHERE license_id = $1 ORDER BY created_at", [licenseId]) : [],
    licenseId ? queryOne("SELECT id, sha256, generated_at FROM certificates WHERE license_id = $1", [licenseId]) : null,
    trackId ? queryOne("SELECT * FROM proof_of_effort WHERE track_id = $1", [trackId]) : null,
    trackId ? query("SELECT analysis_version, status, score, pass, metrics, flags, feedback, completed_at FROM echo_score_analyses WHERE track_id = $1 ORDER BY created_at", [trackId]) : [],
    trackId
      ? query(
          "SELECT r.decision, r.reason_code, r.reviewer_notes, r.created_at, u.email AS reviewer FROM track_reviews r LEFT JOIN users u ON u.id = r.reviewer_id WHERE r.track_id = $1 ORDER BY r.created_at",
          [trackId]
        )
      : [],
    trackId ? query("SELECT kind, original_filename, size_bytes, checksum_sha256, created_at FROM track_files WHERE track_id = $1 ORDER BY created_at", [trackId]) : [],
    trackId ? query("SELECT action, metadata, created_at FROM audit_logs WHERE entity_type = 'track' AND entity_id = $1 ORDER BY created_at", [trackId]) : []
  ]);
  await writeAudit((await import("../db")).pool(), { actorUserId: actor.id, entityType: "dispute", entityId: id, action: "dispute.evidence_exported", requestId });
  return {
    generated_at: new Date().toISOString(),
    generated_by: actor.email,
    dispute,
    dispute_history: history,
    license,
    license_events: events,
    certificate,
    proof_of_effort_snapshot: poe,
    echoscore_analyses: analyses,
    review_decisions: reviews,
    files,
    track_audit_log: trackAudit
  };
}

// ── Licenses (support/finance view) ───────────────────────────────────
export async function adminLicenses(filter: { q?: string } = {}) {
  const params: unknown[] = [];
  let where = "";
  if (filter.q) {
    params.push(`%${filter.q.replace(/[%_\\]/g, "\\$&")}%`);
    where = `WHERE t.title ILIKE $1 OR b.email ILIKE $1 OR a.artist_name ILIKE $1 OR l.id::text ILIKE $1 OR l.project_or_client_name ILIKE $1`;
  }
  const rows = await query<{
    id: string;
    track_title: string;
    track_id: string;
    artist_name: string;
    buyer_email: string;
    tier: LicenseTier;
    price_paid_cents: number;
    artist_cut_cents: number;
    platform_cut_cents: number;
    purchased_at: string;
    status: string;
  }>(
    `SELECT l.id, t.title AS track_title, t.id AS track_id, COALESCE(a.artist_name, a.display_name) AS artist_name, b.email AS buyer_email,
            l.tier, l.price_paid_cents, l.artist_cut_cents, l.platform_cut_cents, l.purchased_at,
            COALESCE((SELECT type FROM license_events e WHERE e.license_id = l.id AND e.type <> 'delivered' ORDER BY e.created_at DESC LIMIT 1), 'paid') AS status
       FROM purchased_licenses l JOIN tracks t ON t.id = l.track_id JOIN users a ON a.id = l.artist_id JOIN users b ON b.id = l.buyer_id
      ${where} ORDER BY l.purchased_at DESC LIMIT 200`,
    params
  );
  const totals = await queryOne<{ count: number; gross_cents: number; platform_cents: number; artist_cents: number }>(
    `SELECT count(*)::int AS count, COALESCE(sum(price_paid_cents), 0)::int AS gross_cents,
            COALESCE(sum(platform_cut_cents), 0)::int AS platform_cents, COALESCE(sum(artist_cut_cents), 0)::int AS artist_cents
       FROM purchased_licenses`
  );
  return { licenses: rows, totals: totals! };
}

// ── Audit log ─────────────────────────────────────────────────────────
export async function auditLog(filter: { entityType?: string; action?: string; before?: string } = {}) {
  const params: unknown[] = [];
  const where: string[] = [];
  if (filter.entityType) {
    params.push(filter.entityType);
    where.push(`a.entity_type = $${params.length}`);
  }
  if (filter.action) {
    params.push(`${filter.action.replace(/[%_\\]/g, "\\$&")}%`);
    where.push(`a.action LIKE $${params.length}`);
  }
  if (filter.before) {
    params.push(filter.before);
    where.push(`a.created_at < $${params.length}::timestamptz`);
  }
  const rows = await query<{ id: string; action: string; entity_type: string; entity_id: string; metadata: Record<string, unknown>; created_at: string; actor: string | null; request_id: string | null }>(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at, u.email AS actor, a.request_id
       FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY a.created_at DESC LIMIT 100`,
    params
  );
  const types = await query<{ entity_type: string }>("SELECT DISTINCT entity_type FROM audit_logs ORDER BY 1");
  return { entries: rows, entity_types: types.map((t) => t.entity_type) };
}

// ── License terms versions ────────────────────────────────────────────
export async function listTermsVersions() {
  return query<{
    id: string;
    tier: LicenseTier;
    version: string;
    title: string;
    terms_md: string;
    price_cents: number;
    artist_share_bps: number;
    active: boolean;
    created_at: string;
    activated_at: string | null;
    licenses_sold: number;
  }>(
    `SELECT v.id, v.tier, v.version, v.title, v.terms_md, v.price_cents, v.artist_share_bps, v.active, v.created_at, v.activated_at,
            (SELECT count(*)::int FROM purchased_licenses l WHERE l.terms_version_id = v.id) AS licenses_sold
       FROM license_terms_versions v ORDER BY v.tier, v.created_at DESC`
  );
}

/** New versions start inactive; old versions (and everything sold under them) are never edited. */
export async function createTermsVersion(
  actor: SessionUser,
  input: { tier: LicenseTier; version: string; title: string; terms_md: string; price_cents: number; artist_share_bps: number },
  requestId: string
) {
  return withTransaction(async (tx) => {
    const dup = await tx.query("SELECT 1 FROM license_terms_versions WHERE tier = $1 AND version = $2", [input.tier, input.version]);
    if (dup.rowCount) throw new AppError("CONFLICT", `Version ${input.version} already exists for ${input.tier}.`);
    const { rows } = await tx.query<{ id: string }>(
      `INSERT INTO license_terms_versions (tier, version, title, terms_md, price_cents, artist_share_bps, active, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7) RETURNING id`,
      [input.tier, input.version, input.title, input.terms_md, input.price_cents, input.artist_share_bps, actor.id]
    );
    await writeAudit(tx, { actorUserId: actor.id, entityType: "license_terms_version", entityId: rows[0]!.id, action: "terms.version_created", metadata: { tier: input.tier, version: input.version, price_cents: input.price_cents }, requestId });
    return { id: rows[0]!.id };
  });
}

/** Makes one version the active one for its tier. New checkouts use it; old licenses keep theirs. */
export async function activateTermsVersion(actor: SessionUser, id: string, requestId: string) {
  return withTransaction(async (tx) => {
    const v = await tx.query<{ tier: string; version: string; active: boolean }>("SELECT tier, version, active FROM license_terms_versions WHERE id = $1 FOR UPDATE", [id]);
    const row = v.rows[0];
    if (!row) throw notFound("Terms version");
    if (row.active) return { id, active: true };
    await tx.query("UPDATE license_terms_versions SET active = FALSE WHERE tier = $1 AND active", [row.tier]);
    await tx.query("UPDATE license_terms_versions SET active = TRUE, activated_at = now() WHERE id = $1", [id]);
    await writeAudit(tx, { actorUserId: actor.id, entityType: "license_terms_version", entityId: id, action: "terms.version_activated", metadata: { tier: row.tier, version: row.version }, requestId });
    return { id, active: true };
  });
}

// ── Users ─────────────────────────────────────────────────────────────
export async function listUsers(filter: { q?: string; role?: string } = {}) {
  const params: unknown[] = [];
  const where: string[] = [];
  if (filter.q) {
    params.push(`%${filter.q.replace(/[%_\\]/g, "\\$&")}%`);
    where.push(`(u.email ILIKE $${params.length} OR u.display_name ILIKE $${params.length} OR u.artist_name ILIKE $${params.length})`);
  }
  if (filter.role) {
    params.push(filter.role);
    where.push(`u.role = $${params.length}::user_role`);
  }
  return query<{ id: string; email: string; role: UserRole; display_name: string | null; artist_name: string | null; created_at: string; google: boolean; tracks: number; licenses: number }>(
    `SELECT u.id, u.email, u.role, u.display_name, u.artist_name, u.created_at, u.google_sub IS NOT NULL AS google,
            (SELECT count(*)::int FROM tracks t WHERE t.artist_id = u.id) AS tracks,
            (SELECT count(*)::int FROM purchased_licenses l WHERE l.buyer_id = u.id) AS licenses
       FROM users u ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY u.created_at DESC LIMIT 200`,
    params
  );
}

export async function setUserRole(actor: SessionUser, userId: string, role: UserRole, requestId: string) {
  if (actor.id === userId) throw new AppError("FORBIDDEN", "You cannot change your own role.");
  return withTransaction(async (tx) => {
    const cur = await tx.query<{ role: UserRole; artist_name: string | null; display_name: string | null }>("SELECT role, artist_name, display_name FROM users WHERE id = $1 FOR UPDATE", [userId]);
    const u = cur.rows[0];
    if (!u) throw notFound("User");
    await tx.query("UPDATE users SET role = $2::user_role, artist_name = CASE WHEN $2::user_role = 'artist' THEN COALESCE(artist_name, display_name) ELSE artist_name END, updated_at = now() WHERE id = $1", [userId, role]);
    // Role changes take effect immediately: drop their sessions so stale privileges can't linger.
    await tx.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    await writeAudit(tx, { actorUserId: actor.id, entityType: "user", entityId: userId, action: "user.role_changed", metadata: { from: u.role, to: role }, requestId });
    return { id: userId, role };
  });
}
