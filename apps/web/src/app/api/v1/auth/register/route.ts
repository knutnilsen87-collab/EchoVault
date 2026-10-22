import { registerSchema } from "@echovault/domain";
import { createSession, hashPassword, sessionCookie } from "@/server/auth";
import { writeAudit } from "@/server/audit";
import { pool, queryOne } from "@/server/db";
import { AppError } from "@/server/errors";
import { ok, parseJson, route } from "@/server/http";

export const POST = route(async (request, ctx) => {
  const input = await parseJson(request, registerSchema);
  if (input.role === "artist" && !input.artist_name) throw new AppError("VALIDATION_ERROR", "artist_name is required for artist accounts.");
  const user = await queryOne<{ id: string; role: string; email: string }>(
    `INSERT INTO users (email, role, display_name, artist_name, password_hash) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING RETURNING id, role, email`,
    [input.email, input.role, input.display_name, input.role === "artist" ? input.artist_name : null, await hashPassword(input.password)]
  );
  if (!user) throw new AppError("CONFLICT", "An account with this email already exists.");
  await writeAudit(pool(), { actorUserId: user.id, entityType: "user", entityId: user.id, action: "user.registered", metadata: { role: user.role }, requestId: ctx.requestId });
  const session = await createSession(user.id);
  const response = ok({ user, token: session.token }, ctx, 201);
  response.headers.append("set-cookie", sessionCookie(session.token, session.expiresAt));
  return response;
});
