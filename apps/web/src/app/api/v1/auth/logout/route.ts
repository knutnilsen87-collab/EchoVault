import { clearSessionCookie, destroySession, sessionTokenFrom } from "@/server/auth";
import { ok, route } from "@/server/http";

export const POST = route(async (request, ctx) => {
  const token = sessionTokenFrom(request.headers);
  if (token) await destroySession(token);
  const response = ok({ signed_out: true }, ctx);
  response.headers.append("set-cookie", clearSessionCookie());
  return response;
});
