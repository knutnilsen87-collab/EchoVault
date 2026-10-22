import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as start from "@/app/api/v1/auth/google/start/route";
import * as callback from "@/app/api/v1/auth/google/callback/route";
import * as me from "@/app/api/v1/auth/me/route";
import * as login from "@/app/api/v1/auth/login/route";
import * as register from "@/app/api/v1/auth/register/route";
import { resetEnvCache } from "@/server/env";
import { queryOne } from "@/server/db";
import { call } from "./helpers";

const CLIENT_ID = "test-client.apps.googleusercontent.com";

function idToken(claims: Record<string, unknown>) {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${enc({ alg: "RS256" })}.${enc(claims)}.sig`;
}

/** Runs start → (fake Google) → callback and returns the callback response. */
async function googleLogin(opts: { role?: string; next?: string; claims?: Record<string, unknown>; tamperState?: boolean; tokenStatus?: number }) {
  const s = await call(start.GET, { path: `/api/v1/auth/google/start?role=${opts.role ?? "buyer"}&next=${encodeURIComponent(opts.next ?? "/")}` });
  expect(s.status).toBe(302);
  const google = new URL(s.headers.get("location")!);
  const cookie = s.headers.get("set-cookie")!.split(";")[0]!;
  const nonce = google.searchParams.get("nonce")!;
  const state = opts.tamperState ? "nope" : google.searchParams.get("state")!;

  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    expect(String(url)).toBe("https://oauth2.googleapis.com/token");
    const body = new URLSearchParams(String(init!.body));
    expect(body.get("code_verifier")).toBeTruthy(); // PKCE
    expect(body.get("redirect_uri")).toBe("http://localhost:3000/api/v1/auth/google/callback");
    const claims = {
      iss: "https://accounts.google.com",
      aud: CLIENT_ID,
      exp: Math.floor(Date.now() / 1000) + 3600,
      nonce,
      sub: "google-sub-1",
      email: "Ada@Example.com",
      email_verified: true,
      name: "Ada Lovelace",
      ...opts.claims
    };
    return Response.json(opts.tokenStatus ? { error: "invalid_grant" } : { id_token: idToken(claims) }, { status: opts.tokenStatus ?? 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  try {
    return await call(callback.GET, { path: `/api/v1/auth/google/callback?code=abc&state=${state}`, headers: { cookie } });
  } finally {
    vi.unstubAllGlobals();
  }
}

const sessionToken = (setCookies: string | null) => /ev_session=([^;,\s]+)/.exec(setCookies ?? "")?.[1];

describe("Sign in with Google", () => {
  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = "test-secret";
    resetEnvCache();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("redirects to Google with PKCE, state and nonce", async () => {
    const s = await call(start.GET, { path: "/api/v1/auth/google/start" });
    const u = new URL(s.headers.get("location")!);
    expect(u.origin + u.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(u.searchParams.get("code_challenge_method")).toBe("S256");
    expect(u.searchParams.get("scope")).toBe("openid email profile");
    expect(s.headers.get("set-cookie")).toMatch(/ev_oauth=.*HttpOnly/);
  });

  it("signs up a new artist with Google and signs the same person in again", async () => {
    const first = await googleLogin({ role: "artist" });
    expect(first.status).toBe(302);
    expect(first.headers.get("location")).toBe("http://localhost:3000/artist");
    const token = sessionToken(first.headers.get("set-cookie"));
    expect(token).toBeTruthy();
    const who = await call(me.GET, { token });
    expect(who.body.data.user).toMatchObject({ email: "ada@example.com", role: "artist", artist_name: "Ada Lovelace" });

    const again = await googleLogin({ role: "buyer", next: "/dashboard" });
    expect(again.headers.get("location")).toBe("http://localhost:3000/dashboard");
    const count = await queryOne<{ n: number }>("SELECT count(*)::int AS n FROM users WHERE email = 'ada@example.com'");
    expect(count!.n).toBe(1); // no duplicate account; role unchanged
    expect((await call(me.GET, { token: sessionToken(again.headers.get("set-cookie")) })).body.data.user.role).toBe("artist");
  });

  it("links Google to an existing email/password account", async () => {
    await call(register.POST, { json: { email: "grace@example.com", password: "correct horse battery", display_name: "Grace", role: "buyer" } });
    const r = await googleLogin({ claims: { sub: "google-sub-2", email: "grace@example.com" } });
    expect(sessionToken(r.headers.get("set-cookie"))).toBeTruthy();
    const u = await queryOne<{ google_sub: string }>("SELECT google_sub FROM users WHERE email = 'grace@example.com'");
    expect(u!.google_sub).toBe("google-sub-2");
    // Password still works too.
    expect((await call(login.POST, { json: { email: "grace@example.com", password: "correct horse battery" } })).status).toBe(200);
  });

  it("rejects bad state, wrong audience, wrong nonce, unverified email and token errors", async () => {
    const cases: [Parameters<typeof googleLogin>[0], string][] = [
      [{ tamperState: true }, "google_state_mismatch"],
      [{ claims: { aud: "someone-else" } }, "google_token_invalid"],
      [{ claims: { nonce: "replayed" } }, "google_token_invalid"],
      [{ claims: { iss: "https://evil.example" } }, "google_token_invalid"],
      [{ claims: { email_verified: false, sub: "x", email: "x@example.com" } }, "google_email_unverified"],
      [{ tokenStatus: 400 }, "google_token_failed"]
    ];
    for (const [opts, error] of cases) {
      const r = await googleLogin(opts);
      expect(r.headers.get("location")).toBe(`http://localhost:3000/login?error=${error}`);
      expect(sessionToken(r.headers.get("set-cookie"))).toBeUndefined();
    }
  });

  it("never redirects off-site after login", async () => {
    const r = await googleLogin({ next: "//evil.example/x" });
    expect(r.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("explains when Google is not configured", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    resetEnvCache();
    try {
      const s = await call(start.GET, { path: "/api/v1/auth/google/start" });
      expect(s.headers.get("location")).toBe("http://localhost:3000/login?error=google_not_configured");
    } finally {
      process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
      resetEnvCache();
    }
  });
});
