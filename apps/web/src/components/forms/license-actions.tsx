"use client";

import * as React from "react";
import { api, describeError } from "@/lib/api-client";
import { LicenseButton } from "../ui/license-button";
import { Alert, Button, Field, inputClass } from "../ui/primitives";

export function DownloadButton({ licenseId }: { licenseId: string }) {
  const [state, setState] = React.useState<{ busy: boolean; error?: string; expires?: string }>({ busy: false });
  return (
    <div className="space-y-2">
      <LicenseButton
        className="w-full"
        disabled={state.busy}
        onClick={async () => {
          setState({ busy: true });
          try {
            const link = await api<{ url: string; expires_at: string }>(`/api/v1/licenses/${licenseId}/download-link`, { method: "POST" });
            setState({ busy: false, expires: link.expires_at });
            window.location.assign(link.url);
          } catch (e) {
            setState({ busy: false, error: describeError(e) });
          }
        }}
      >
        {state.busy ? "Preparing…" : "Download high-res WAV"}
      </LicenseButton>
      {state.expires ? <p className="font-mono text-[11px] text-echo-muted">Link expires {new Date(state.expires).toLocaleTimeString()}</p> : null}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
    </div>
  );
}

export function DisputeForm({ licenseId }: { licenseId: string }) {
  const [open, setOpen] = React.useState(false);
  const [msg, setMsg] = React.useState<{ tone: "error" | "success"; text: string } | null>(null);
  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}>Report a claim or problem</Button>;
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          await api("/api/v1/disputes", { method: "POST", json: { license_id: licenseId, reason_category: f.get("reason_category"), claim_summary: f.get("claim_summary") } });
          setMsg({ tone: "success", text: "Thanks — our team will investigate and contact you by email. Your license record is unaffected." });
        } catch (err) {
          setMsg({ tone: "error", text: describeError(err) });
        }
      }}
    >
      <Field label="What happened?">
        <select name="reason_category" className={inputClass} defaultValue="content_id_claim">
          <option value="content_id_claim">Content ID / platform claim</option>
          <option value="copyright_claim">Copyright claim from a third party</option>
          <option value="license_scope">Question about permitted use</option>
          <option value="quality">File / quality problem</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Details" hint="Include the claimant, platform and URL if you have them.">
        <textarea name="claim_summary" required minLength={20} rows={4} className={inputClass} />
      </Field>
      <Button type="submit">Send report</Button>
      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
    </form>
  );
}
