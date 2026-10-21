"use client";

import * as React from "react";
import { api, describeError } from "@/lib/api-client";
import { Alert, Field, inputClass } from "../ui/primitives";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [role, setRole] = React.useState<"buyer" | "artist">("buyer");
  const [error, setError] = React.useState<string | null>(null);
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" ? (
        <>
          <fieldset className="grid grid-cols-2 gap-2" aria-label="Account type">
            {(["buyer", "artist"] as const).map((r) => (
              <label key={r} className={`cursor-pointer rounded-md border px-3 py-2 text-center text-sm ${role === r ? "border-white/60 text-white" : "border-echo-border text-echo-muted"}`}>
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                {r === "buyer" ? "I license music" : "I sell music"}
              </label>
            ))}
          </fieldset>
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
