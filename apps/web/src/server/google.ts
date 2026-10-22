import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { writeAudit } from "./audit";
import { withTransaction } from "./db";
import { env } from "./env";
import { logEvent } from "./logger";

/**
 * Sign in with Google — OAuth 2.0 Authorization Code flow with PKCE, state and nonce.
 * No third-party auth library: Google is called directly, and the ID token is taken straight
 * from Google's token endpoint over TLS (OIDC Core §3.1.3.7 allows TLS instead of signature
 * validation in that case). Claims (iss, aud, exp, nonce, email_verified) are always checked.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
export const OAUTH_COOKIE = "ev_oauth";
const FLOW_TTL_SECONDS = 10 * 60;

export type GoogleFlow = {
  state: string;
  verifier: string;
  nonce: string;
  role: "buyer" | "artist";
  next: string;
  exp: number;
};

export class GoogleAuthError extends Error {}

export function redirectUri(): string {
  return `${env().NEXT_PUBLIC_APP_URL}/api/v1/auth/google/callback`;
}

const b64url = (b: Buffer) => b.toString("base64url");
const sign = (payload: string) => createHmac("sha256", env().AUTH_SECRET).update(`oauth|${payload}`).digest("base64url");

/** Only same-site relative paths are allowed as post-login destinations (no open redirect). */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next.slice(0, 500) : "/";
}

export function startFlow(input: { role?: string | null; next?: string | null }): { url: string; cookie: string } {
  const flow: GoogleFlow = {
    state: b64url(randomBytes(24)),
    verifier: b64url(randomBytes(48)),
    nonce: b64url(randomBytes(24)),
    role: input.role === "artist" ? "artist" : "buyer",
    next: safeNext(input.next),
    exp: Math.floor(Date.now() / 1000) + FLOW_TTL_SECONDS
  };
  const payload = b64url(Buffer.from(JSON.stringify(flow)));
  const params = new URLSearchParams({
    client_id: env().GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: b64url(createHash("sha256").update(flow.verifier).digest()),
    code_challenge_method: "S256",
    prompt: "select_account"
  });
  const secure = env().NEXT_PUBLIC_APP_URL.startsWith("https://") ? "; Secure" : "";
  return {
    url: `${AUTH_URL}?${params.toString()}`,
    cookie: `${OAUTH_COOKIE}=${payload}.${sign(payload)}; Path=/api/v1/auth/google; HttpOnly; SameSite=Lax; Max-Age=${FLOW_TTL_SECONDS}${secure}`
  };
}

export function clearFlowCookie(): string {
  return `${OAUTH_COOKIE}=; Path=/api/v1/auth/google; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readFlow(cookieValue: string | null, state: string | null): GoogleFlow {
  if (!cookieValue || !state) throw new GoogleAuthError("google_session_expired");
  const [payload, sig] = cookieValue.split(".");
  if (!payload || !sig) throw new GoogleAuthError("google_session_expired");
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new GoogleAuthError("google_session_expired");
  const flow = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as GoogleFlow;
  if (flow.exp < Date.now() / 1000) throw new GoogleAuthError("google_session_expired");
  const a = Buffer.from(flow.state);
  const b = Buffer.from(state);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new GoogleAuthError("google_state_mismatch");
  return flow;
}

export type GoogleIdentity = { sub: string; email: string; name: string | null; picture: string | null };

export async function exchangeCode(code: string, flow: GoogleFlow): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env().GOOGLE_CLIENT_ID!,
      client_secret: env().GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
      code_verifier: flow.verifier
    }),
    signal: AbortSignal.timeout(15_000)
  });
  const body = (await res.json().catch(() => null)) as { id_token?: string; error?: string; error_description?: string } | null;
  if (!res.ok || !body?.id_token) {
    logEvent({ level: "warn", event: "google_token_exchange_failed", details: { status: res.status, error: body?.error, description: body?.error_description } });
    throw new GoogleAuthError(body?.error === "invalid_client" ? "google_misconfigured" : "google_token_failed");
  }
  const parts = body.id_token.split(".");
  if (parts.length !== 3) throw new GoogleAuthError("google_token_failed");
  const claims = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")) as Record<string, unknown>;

  if (claims.iss !== "https://accounts.google.com" && claims.iss !== "accounts.google.com") throw new GoogleAuthError("google_token_invalid");
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(env().GOOGLE_CLIENT_ID)) throw new GoogleAuthError("google_token_invalid");
  if (typeof claims.exp !== "number" || claims.exp < Date.now() / 1000 - 60) throw new GoogleAuthError("google_token_invalid");
  if (claims.nonce !== flow.nonce) throw new GoogleAuthError("google_token_invalid");
  if (typeof claims.sub !== "string" || typeof claims.email !== "string") throw new GoogleAuthError("google_token_invalid");
  if (claims.email_verified !== true && claims.email_verified !== "true") throw new GoogleAuthError("google_email_unverified");

  return {
    sub: claims.sub,
    email: claims.email.toLowerCase(),
    name: typeof claims.name === "string" ? claims.name : null,
    picture: typeof claims.picture === "string" ? claims.picture : null
  };
}

/**
 * Same Google account → same user. A verified Google email matching an existing account links
 * to it (so a password account can start using Google). Otherwise a new account is created
 * with the role chosen before leaving for Google (buyer by default).
 */
export async function findOrCreateGoogleUser(identity: GoogleIdentity, role: "buyer" | "artist", requestId: string) {
  return withTransaction(async (tx) => {
    const bySub = await tx.query<{ id: string; role: string }>("SELECT id, role FROM users WHERE google_sub = $1", [identity.sub]);
    if (bySub.rows[0]) return { id: bySub.rows[0].id, role: bySub.rows[0].role, created: false };

    const byEmail = await tx.query<{ id: string; role: string; google_sub: string | null }>(
      "SELECT id, role, google_sub FROM users WHERE email = $1 FOR UPDATE",
      [identity.email]
    );
    const existing = byEmail.rows[0];
    if (existing) {
      if (existing.google_sub && existing.google_sub !== identity.sub) throw new GoogleAuthError("google_account_conflict");
      await tx.query("UPDATE users SET google_sub = $2, avatar_url = COALESCE(avatar_url, $3), updated_at = now() WHERE id = $1", [existing.id, identity.sub, identity.picture]);
      await writeAudit(tx, { actorUserId: existing.id, entityType: "user", entityId: existing.id, action: "user.google_linked", requestId });
      return { id: existing.id, role: existing.role, created: false };
    }

    const display = identity.name?.trim() || identity.email.split("@")[0]!;
    const created = await tx.query<{ id: string; role: string }>(
      `INSERT INTO users (email, role, display_name, artist_name, google_sub, avatar_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, role`,
      [identity.email, role, display, role === "artist" ? display : null, identity.sub, identity.picture]
    );
    const user = created.rows[0]!;
    await writeAudit(tx, { actorUserId: user.id, entityType: "user", entityId: user.id, action: "user.registered", metadata: { role, via: "google" }, requestId });
    return { id: user.id, role: user.role, created: true };
  });
}
