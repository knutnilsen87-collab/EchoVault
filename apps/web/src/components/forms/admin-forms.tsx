"use client";

import * as React from "react";
import { api, describeError } from "@/lib/api-client";
import { Alert, Button, Field, inputClass } from "../ui/primitives";

function useAction() {
  const [msg, setMsg] = React.useState<{ tone: "error" | "success"; text: string } | null>(null);
  const run = async (fn: () => Promise<unknown>, ok: string, reload = true) => {
    setMsg(null);
    try {
      await fn();
      setMsg({ tone: "success", text: ok });
      if (reload) setTimeout(() => window.location.reload(), 500);
    } catch (e) {
      setMsg({ tone: "error", text: describeError(e) });
    }
  };
  return { msg, run };
}

const STATUSES = [
  ["open", "Open"],
  ["investigating", "Investigating"],
  ["escalated", "Escalated (legal)"],
  ["resolved_valid", "Resolved — claim valid"],
  ["resolved_invalid", "Resolved — claim invalid"],
  ["closed", "Closed"]
] as const;

export function DisputeActions({ disputeId, status, trackId, trackStatus }: { disputeId: string; status: string; trackId: string | null; trackStatus: string | null }) {
  const { msg, run } = useAction();
  const [next, setNext] = React.useState(status);
  const [notes, setNotes] = React.useState("");
  const [reason, setReason] = React.useState("");
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Field label="Status">
          <select className={inputClass} value={next} onChange={(e) => setNext(e.target.value)}>
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Resolution notes" hint="Required when resolving or closing. Stored in the audit log.">
          <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Button className="w-full" onClick={() => run(() => api(`/api/v1/admin/disputes/${disputeId}`, { method: "PATCH", json: { status: next, resolution_notes: notes || undefined } }), "Dispute updated.")}>
          Update dispute
        </Button>
      </div>
      {trackId && (trackStatus === "approved" || trackStatus === "live") ? (
        <div className="space-y-3 border-t border-echo-border pt-4">
          <Field label="Suspend the track" hint="Stops previews and new sales. Existing licenses stay valid and visible.">
            <textarea className={inputClass} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (min 10 characters)" />
          </Field>
          <Button variant="danger" className="w-full" onClick={() => run(() => api(`/api/v1/admin/tracks/${trackId}/suspend`, { method: "POST", json: { reason, dispute_id: disputeId } }), "Track suspended.")}>
            Suspend track
          </Button>
        </div>
      ) : null}
      <a href={`/api/v1/admin/disputes/${disputeId}/evidence`} className="block rounded-md border border-echo-border px-4 py-2 text-center text-sm hover:border-white/40">
        Download evidence pack (JSON)
      </a>
      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
    </div>
  );
}

export function NewTermsVersionForm({ defaults }: { defaults: Record<string, { version: string; title: string; terms_md: string; price_cents: number; artist_share_bps: number }> }) {
  const { msg, run } = useAction();
  const [tier, setTier] = React.useState<"creator" | "pro" | "agency">("creator");
  const d = defaults[tier];
  return (
    <form
      key={tier}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void run(
          () =>
            api("/api/v1/admin/terms", {
              method: "POST",
              json: {
                tier,
                version: f.get("version"),
                title: f.get("title"),
                terms_md: f.get("terms_md"),
                price_cents: Math.round(Number(f.get("price_eur")) * 100),
                artist_share_bps: Math.round(Number(f.get("artist_share")) * 100)
              }
            }),
          "Draft version created. Activate it below when it is approved."
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Tier">
          <select className={inputClass} value={tier} onChange={(e) => setTier(e.target.value as typeof tier)}>
            <option value="creator">Creator</option>
            <option value="pro">Pro</option>
            <option value="agency">Agency</option>
          </select>
        </Field>
        <Field label="Version">
          <input name="version" required className={`${inputClass} font-mono`} placeholder="1.0" />
        </Field>
        <Field label="Price (EUR)">
          <input name="price_eur" required type="number" min={1} step="0.01" defaultValue={d ? d.price_cents / 100 : ""} className={`${inputClass} font-mono`} />
        </Field>
        <Field label="Artist share (%)">
          <input name="artist_share" required type="number" min={0} max={100} step="0.01" defaultValue={d ? d.artist_share_bps / 100 : 70} className={`${inputClass} font-mono`} />
        </Field>
      </div>
      <Field label="Title">
        <input name="title" required className={inputClass} defaultValue={d ? d.title.replace(/Draft$/i, "").trim() : ""} />
      </Field>
      <Field label="Terms text" hint="Paste the counsel-approved text. It can never be edited after the first sale under it.">
        <textarea name="terms_md" required minLength={50} rows={10} className={`${inputClass} font-mono text-sm`} defaultValue={d?.terms_md ?? ""} />
      </Field>
      <Button type="submit">Create draft version</Button>
      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
    </form>
  );
}

export function ActivateTermsButton({ id, label }: { id: string; label: string }) {
  const { msg, run } = useAction();
  return (
    <div>
      <Button
        onClick={() => {
          if (window.confirm(`Make ${label} the version used for all new purchases?`)) void run(() => api(`/api/v1/admin/terms/${id}/activate`, { method: "POST" }), "Activated.");
        }}
      >
        Activate
      </Button>
      {msg ? <div className="mt-2"><Alert tone={msg.tone}>{msg.text}</Alert></div> : null}
    </div>
  );
}

export function RoleSelect({ userId, role, self }: { userId: string; role: string; self: boolean }) {
  const { msg, run } = useAction();
  const [value, setValue] = React.useState(role);
  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Role"
        disabled={self}
        className={`${inputClass} py-1 font-mono text-xs`}
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          void run(() => api(`/api/v1/admin/users/${userId}/role`, { method: "POST", json: { role: next } }), "Saved", false);
        }}
      >
        {["buyer", "artist", "reviewer", "support", "finance", "admin"].map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      {msg ? <span className={`font-mono text-[11px] ${msg.tone === "error" ? "text-red-300" : "text-emerald-300"}`}>{msg.text}</span> : null}
    </div>
  );
}
