import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { UserRole } from "@echovault/domain";
import { query, queryOne } from "./db";
import { env } from "./env";
import { AppError } from "./errors";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number, opts: object) => Promise<Buffer>;

export const SESSION_COOKIE = "ev_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export type SessionUser = {
  id: string;
  role: UserRole;
  email: string;
  display_name: string | null;
  artist_name: string | null;
};

// ── Passwords ───────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [algo, n, r, p, saltB64, hashB64] = stored.split("$");
  if (algo !== "scrypt" || !n || !r || !p || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return timingSafeEqual(expected, actual);
}

// ── Sessions ────────────────────────────────────────────────────────────
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await query("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", [userId, tokenHash(token), expiresAt]);
  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  await query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash(token)]);
}

export function sessionCookie(token: string, expiresAt: Date): string {
  const secure = env().NEXT_PUBLIC_APP_URL.startsWith("https://") ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=") || null;
  }
  return null;
}

/** Session token from `Authorization: Bearer` (API clients) or the session cookie (browser). */
export function sessionTokenFrom(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim() || null;
  return readCookie(headers.get("cookie"), SESSION_COOKIE);
}

export async function userForToken(token: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  return queryOne<SessionUser>(
    `SELECT u.id, u.role, u.email, u.display_name, u.artist_name
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash(token)]
  );
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  return userForToken(sessionTokenFrom(request.headers));
}

/**
 * Cross-site request guard for cookie-authenticated mutations.
 * SameSite=Lax already blocks most CSRF; this also rejects foreign Origins.
 */
function assertSameOrigin(request: Request): void {
  if (request.method === "GET" || request.method === "HEAD") return;
  if (request.headers.get("authorization")) return; // bearer clients are not CSRF-able
  const origin = request.headers.get("origin");
  if (!origin) return;
  const allowed = new URL(env().NEXT_PUBLIC_APP_URL).origin;
  if (origin !== allowed && origin !== new URL(request.url).origin) {
    throw new AppError("FORBIDDEN", "Cross-origin request rejected.");
  }
}

export async function requireUser(request: Request, allowedRoles?: readonly UserRole[]): Promise<SessionUser> {
  assertSameOrigin(request);
  const user = await getSessionUser(request);
  if (!user) throw new AppError("UNAUTHORIZED", "Sign in required.");
  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== "admin") {
    throw new AppError("FORBIDDEN", "Insufficient role.");
  }
  return user;
}
