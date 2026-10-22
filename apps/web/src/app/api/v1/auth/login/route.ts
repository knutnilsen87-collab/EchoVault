import { loginSchema } from "@echovault/domain";
import { createSession, sessionCookie, verifyPassword } from "@/server/auth";
import { queryOne } from "@/server/db";
import { AppError } from "@/server/errors";
import { ok, parseJson, route } from "@/server/http";

export const POST = route(async (request, ctx) => {
  const input = await parseJson(request, loginSchema);
  const user = await queryOne<{ id: string; role: string; email: string; password_hash: string | null }>(
    "SELECT id, role, email, password_hash FROM users WHERE email = $1",
    [input.email]
  );
  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    throw new AppError("UNAUTHORIZED", "Invalid email or password.");
  }
  const session = await createSession(user.id);
  const response = ok({ user: { id: user.id, role: user.role, email: user.email }, token: session.token }, ctx);
  response.headers.append("set-cookie", sessionCookie(session.token, session.expiresAt));
  return response;
});
