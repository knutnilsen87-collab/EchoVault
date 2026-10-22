import { createSession, readCookie, sessionCookie } from "@/server/auth";
import { env, googleEnabled } from "@/server/env";
import { clearFlowCookie, exchangeCode, findOrCreateGoogleUser, GoogleAuthError, OAUTH_COOKIE, readFlow } from "@/server/google";
import { requestIdFrom } from "@/server/http";
import { logEvent } from "@/server/logger";

export const dynamic = "force-dynamic";

function redirect(path: string, cookies: string[]) {
  const headers = new Headers({ location: new URL(path, env().NEXT_PUBLIC_APP_URL).toString(), "cache-control": "no-store" });
  for (const c of cookies) headers.append("set-cookie", c);
  return new Response(null, { status: 302, headers });
}

/** Google redirects here with ?code&state (or ?error). Always ends in a redirect, never JSON. */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  const url = new URL(request.url);
  if (!googleEnabled()) return redirect("/login?error=google_not_configured", [clearFlowCookie()]);
  if (url.searchParams.get("error")) return redirect("/login?error=google_cancelled", [clearFlowCookie()]);

  try {
    const flow = readFlow(readCookie(request.headers.get("cookie"), OAUTH_COOKIE), url.searchParams.get("state"));
    const code = url.searchParams.get("code");
    if (!code) throw new GoogleAuthError("google_token_failed");
    const identity = await exchangeCode(code, flow);
    const user = await findOrCreateGoogleUser(identity, flow.role, requestId);
    const session = await createSession(user.id);
    const next = user.created && user.role === "artist" && flow.next === "/" ? "/artist" : flow.next;
    return redirect(next, [clearFlowCookie(), sessionCookie(session.token, session.expiresAt)]);
  } catch (error) {
    const code = error instanceof GoogleAuthError ? error.message : "google_failed";
    if (!(error instanceof GoogleAuthError)) {
      logEvent({ level: "error", event: "google_callback_error", requestId, details: { error: (error as Error).message } });
    }
    return redirect(`/login?error=${code}`, [clearFlowCookie()]);
  }
}
