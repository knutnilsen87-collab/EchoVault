import type { Queryable } from "./db";

export async function writeAudit(
  db: Queryable,
  entry: { actorUserId: string | null; entityType: string; entityId: string; action: string; metadata?: Record<string, unknown>; requestId?: string }
): Promise<void> {
  await db.query(
    `INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, metadata, request_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entry.actorUserId, entry.entityType, entry.entityId, entry.action, JSON.stringify(entry.metadata ?? {}), entry.requestId ?? null]
  );
}
