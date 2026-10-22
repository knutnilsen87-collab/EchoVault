"use client";

import * as React from "react";
import { api, describeError } from "@/lib/api-client";
import { Alert, Button, Field, inputClass } from "../ui/primitives";

type Profile = { display_name: string | null; artist_name: string | null; bio: string | null; role: string; has_password: boolean };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [msg, setMsg] = React.useState<{ tone: "error" | "success"; text: string } | null>(null);
  const isArtist = profile.role === "artist" || profile.role === "admin";
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          await api("/api/v1/me", {
            method: "PATCH",
            json: {
              display_name: f.get("display_name"),
              ...(isArtist ? { artist_name: f.get("artist_name") || null, bio: f.get("bio") || null } : {})
            }
          });
          setMsg({ tone: "success", text: "Profile saved." });
        } catch (err) {
          setMsg({ tone: "error", text: describeError(err) });
        }
      }}
    >
      <Field label="Name" hint="Printed on license certificates you buy.">
        <input name="display_name" required maxLength={255} defaultValue={profile.display_name ?? ""} className={inputClass} />
      </Field>
      {isArtist ? (
        <>
          <Field label="Artist name" hint="Shown publicly in the catalog, on your artist page and on buyers’ certificates.">
            <input name="artist_name" maxLength={255} defaultValue={profile.artist_name ?? ""} className={inputClass} />
          </Field>
          <Field label="Bio" hint="Public. Up to 2000 characters.">
            <textarea name="bio" rows={4} maxLength={2000} defaultValue={profile.bio ?? ""} className={inputClass} />
          </Field>
        </>
      ) : null}
      <Button type="submit">Save profile</Button>
      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [msg, setMsg] = React.useState<{ tone: "error" | "success"; text: string } | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        if (f.get("new_password") !== f.get("confirm")) {
          setMsg({ tone: "error", text: "The new passwords do not match." });
          return;
        }
        try {
          await api("/api/v1/me/password", {
            method: "POST",
            json: { current_password: f.get("current_password") || undefined, new_password: f.get("new_password") }
          });
          form.reset();
          setMsg({ tone: "success", text: "Password updated. Other devices have been signed out." });
        } catch (err) {
          setMsg({ tone: "error", text: describeError(err) });
        }
      }}
    >
      {hasPassword ? (
        <Field label="Current password">
          <input name="current_password" type="password" required autoComplete="current-password" className={inputClass} />
        </Field>
      ) : (
        <p className="text-sm text-echo-muted">You sign in with Google. Set a password if you also want to sign in with email.</p>
      )}
      <Field label="New password" hint="At least 10 characters.">
        <input name="new_password" type="password" required minLength={10} autoComplete="new-password" className={inputClass} />
      </Field>
      <Field label="Repeat new password">
        <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className={inputClass} />
      </Field>
      <Button type="submit">{hasPassword ? "Change password" : "Set password"}</Button>
      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
    </form>
  );
}
