import { writeAudit } from "../audit";
import { hashPassword, verifyPassword, type SessionUser } from "../auth";
import { query, queryOne, withTransaction } from "../db";
import { AppError } from "../errors";

export type Profile = {
  id: string;
  email: string;
  role: string;
  display_name: string | null;
  artist_name: string | null;
  bio: string | null;
  has_password: boolean;
  google_linked: boolean;
  created_at: string;
};

export async function getProfile(user: SessionUser): Promise<Profile> {
  return (await queryOne<Profile>(
    `SELECT id, email, role, display_name, artist_name, bio, password_hash IS NOT NULL AS has_password,
            google_sub IS NOT NULL AS google_linked, created_at
       FROM users WHERE id = $1`,
    [user.id]
  ))!;
}

export async function updateProfile(
  user: SessionUser,
  input: { display_name?: string; artist_name?: string | null; bio?: string | null },
  requestId: string
): Promise<Profile> {
  if (input.artist_name !== undefined && user.role === "artist" && !input.artist_name) {
    throw new AppError("VALIDATION_ERROR", "Artists need an artist name.");
  }
  await withTransaction(async (tx) => {
    await tx.query(
      `UPDATE users SET display_name = COALESCE($2, display_name),
              artist_name = CASE WHEN $5 THEN $3 ELSE artist_name END,
              bio = CASE WHEN $6 THEN $4 ELSE bio END, updated_at = now()
        WHERE id = $1`,
      [user.id, input.display_name ?? null, input.artist_name ?? null, input.bio ?? null, input.artist_name !== undefined, input.bio !== undefined]
    );
    await writeAudit(tx, { actorUserId: user.id, entityType: "user", entityId: user.id, action: "user.profile_updated", metadata: { fields: Object.keys(input) }, requestId });
  });
  return getProfile(user);
}

/** Change password; Google-only accounts may set a first password without a current one. */
export async function changePassword(user: SessionUser, input: { current_password?: string; new_password: string }, requestId: string): Promise<void> {
  const row = await queryOne<{ password_hash: string | null }>("SELECT password_hash FROM users WHERE id = $1", [user.id]);
  if (row?.password_hash && !(await verifyPassword(input.current_password ?? "", row.password_hash))) {
    throw new AppError("VALIDATION_ERROR", "Current password is incorrect.");
  }
  await withTransaction(async (tx) => {
    await tx.query("UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1", [user.id, await hashPassword(input.new_password)]);
    await writeAudit(tx, { actorUserId: user.id, entityType: "user", entityId: user.id, action: row?.password_hash ? "user.password_changed" : "user.password_set", requestId });
  });
}

/** Signs out every other device after a password change. */
export async function revokeOtherSessions(userId: string, keepTokenHash: string | null): Promise<void> {
  await query("DELETE FROM sessions WHERE user_id = $1 AND ($2::text IS NULL OR token_hash <> $2)", [userId, keepTokenHash]);
}
