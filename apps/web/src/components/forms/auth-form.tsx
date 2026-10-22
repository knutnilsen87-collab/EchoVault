"use client";

import * as React from "react";
import { api, describeError } from "@/lib/api-client";
import { Alert, Field, inputClass } from "../ui/primitives";

const GOOGLE_ERRORS: Record<string, string> = {
  google_not_configured:
    "Google sign-in is not set up yet: add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to apps/web/.env.local and restart the app.",
  google_cancelled: "Google sign-in was cancelled.",
  google_session_expired: "Sign-in took too long. Please try again.",
  google_state_mismatch: "Sign-in could not be verified. Please try again.",
  google_email_unverified: "This Google account has no verified email address.",
  google_account_conflict: "This email is already linked to a different Google account.",
  google_misconfigured: "Google sign-in is misconfigured (client ID/secret or redirect URI). Check Google Cloud Console.",
  google_token_failed: "Google did not respond as expected. Please try again.",
  google_token_invalid: "The response from Google could not be verified.",
  google_failed: "Google sign-in failed. Please try again."
};

function GoogleButton({ label, role, next }: { label: string; role: "buyer" | "artist"; next: string }) {
  const href = `/api/v1/auth/google/start?role=${role}&next=${encodeURIComponent(next)}`;
  return (
    <a
      href={href}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-echo-border bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-neutral-200"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      {label}
    </a>
  );
}

export function AuthForm({ mode, next, initialError }: { mode: "login" | "register"; next: string; initialError?: string }) {
  const [role, setRole] = React.useState<"buyer" | "artist">("buyer");
  const [error, setError] = React.useState<string | null>(initialError ? (GOOGLE_ERRORS[initialError] ?? GOOGLE_ERRORS.google_failed!) : null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    try {
      if (mode === "login") {
        await api("/api/v1/auth/login", { method: "POST", json: { email: f.get("email"), password: f.get("password") } });
      } else {
        await api("/api/v1/auth/register", {
          method: "POST",
          json: {
            email: f.get("email"),
            password: f.get("password"),
            display_name: f.get("display_name"),
            role,
            artist_name: role === "artist" ? f.get("artist_name") : undefined
          }
        });
      }
      const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      window.location.assign(mode === "register" && role === "artist" && target === "/" ? "/artist" : target);
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  }

  const roleChooser =
    mode === "register" ? (
      <fieldset className="grid grid-cols-2 gap-2" aria-label="Account type">
        {(["buyer", "artist"] as const).map((r) => (
          <label key={r} className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm ${role === r ? "border-white/60 text-white" : "border-echo-border text-echo-muted"}`}>
            <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
            {r === "buyer" ? "I license music" : "I sell music"}
          </label>
        ))}
      </fieldset>
    ) : null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {roleChooser}
      <GoogleButton label={mode === "login" ? "Sign in with Google" : "Sign up with Google"} role={role} next={next} />
      <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-echo-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-echo-border" />
        or with email
        <span className="h-px flex-1 bg-echo-border" />
      </div>
      {mode === "register" ? (
        <>
          <Field label="Name">
            <input name="display_name" required className={inputClass} autoComplete="name" />
          </Field>
          {role === "artist" ? (
            <Field label="Artist name" hint="Shown publicly in the catalog and on certificates.">
              <input name="artist_name" required className={inputClass} />
            </Field>
          ) : null}
        </>
      ) : null}
      <Field label="Email">
        <input name="email" type="email" required className={inputClass} autoComplete="email" />
      </Field>
      <Field label="Password" hint={mode === "register" ? "At least 10 characters." : undefined}>
        <input name="password" type="password" required minLength={mode === "register" ? 10 : 1} className={inputClass} autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <button disabled={busy} className="w-full rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-neutral-200 disabled:opacity-50">
        {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
