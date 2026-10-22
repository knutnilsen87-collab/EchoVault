import { writeAudit } from "../audit";
import type { SessionUser } from "../auth";
import { query, queryOne, withTransaction } from "../db";
import { notFound } from "../errors";

export async function openDispute(user: SessionUser, input: { license_id: string; claim_summary: string; reason_category: string }, requestId: string) {
  return withTransaction(async (tx) => {
    const lic = await tx.query<{ id: string; track_id: string }>("SELECT id, track_id FROM purchased_licenses WHERE id = $1 AND buyer_id = $2", [input.license_id, user.id]);
    if (!lic.rows[0]) throw notFound("License");
    const { rows } = await tx.query<{ id: string }>(
      "INSERT INTO disputes (purchased_license_id, track_id, opened_by_user_id, claim_summary, reason_category) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [input.license_id, lic.rows[0].track_id, user.id, input.claim_summary, input.reason_category]
    );
    await tx.query("INSERT INTO license_events (license_id, type, metadata) VALUES ($1, 'disputed', $2)", [input.license_id, JSON.stringify({ dispute_id: rows[0]!.id })]);
    await writeAudit(tx, { actorUserId: user.id, entityType: "dispute", entityId: rows[0]!.id, action: "dispute.opened", metadata: { license_id: input.license_id, reason_category: input.reason_category }, requestId });
    return { id: rows[0]!.id, status: "open" };
  });
}

export async function listDisputes() {
  return query(
    `SELECT d.id, d.status, d.reason_category, d.claim_summary, d.created_at, d.suspended_track, d.track_id, t.title AS track_title,
            t.status AS track_status, d.purchased_license_id, u.email AS opened_by
       FROM disputes d LEFT JOIN tracks t ON t.id = d.track_id LEFT JOIN users u ON u.id = d.opened_by_user_id
      ORDER BY (d.status IN ('open','investigating','escalated')) DESC, d.created_at DESC`
  );
}

export async function getDispute(id: string) {
  const d = await queryOne("SELECT * FROM disputes WHERE id = $1", [id]);
  if (!d) throw notFound("Dispute");
  return d;
}
