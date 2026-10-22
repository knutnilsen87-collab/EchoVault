import { createHash } from "node:crypto";
import { changePasswordSchema } from "@echovault/domain";
import { requireUser, sessionTokenFrom } from "@/server/auth";
import { ok, parseJson, route } from "@/server/http";
import { changePassword, revokeOtherSessions } from "@/server/services/account";

export const POST = route(async (request, ctx) => {
  const user = await requireUser(request);
  const input = await parseJson(request, changePasswordSchema);
  await changePassword(user, input, ctx.requestId);
  const token = sessionTokenFrom(request.headers);
  await revokeOtherSessions(user.id, token ? createHash("sha256").update(token).digest("hex") : null);
  return ok({ changed: true, other_sessions_signed_out: true }, ctx);
});
