"use client";

import * as React from "react";
import { api, describeError } from "@/lib/api-client";
import { Alert, Button, Field, inputClass } from "../ui/primitives";

const REASONS = ["meets_standard", "audio_quality", "sample_provenance", "named_artist_imitation", "metadata_misleading", "poe_incomplete", "suspected_fraud", "other"];

export function ReviewPanel({ trackId, status, analysisPassed }: { trackId: string; status: string; analysisPassed: boolean }) {
  const [reason, setReason] = React.useState(analysisPassed ? "meets_standard" : "audio_quality");
  const [notes, setNotes] = React.useState("");
  const [override, setOverride] = React.useState("");
  const [msg, setMsg] = React.useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function act(path: string, body: Record<string, unknown>) {
    setMsg(null);
    try {
      await api(`/api/v1/admin/tracks/${trackId}/${path}`, { method: "POST", json: body });
      setMsg({ tone: "success", text: "Decision recorded." });
      setTimeout(() => window.location.reload(), 500);
    } catch (e) {
      setMsg({ tone: "error", text: describeError(e) });
    }
  }

  if (status === "approved" || status === "live") {
    return (
      <div className="space-y-3">
        <Field label="Suspend from sale" hint="Stops previews and new purchases. Existing licenses are untouched.">
          <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason (min 10 characters)" />
        </Field>
        <Button variant="danger" className="w-full" onClick={() => act("suspend", { reason: notes })}>
          Suspend track
        </Button>
        {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
      </div>
    );
  }
  if (status === "suspended") {
    return (
      <div className="space-y-3">
        <Field label="Reinstate (admin)">
          <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Resolution notes" />
        </Field>
        <Button className="w-full" onClick={() => act("reinstate", { notes })}>
          Reinstate
        </Button>
        {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
      </div>
    );
  }
  if (status !== "needs_human_review" && status !== "analysis_failed") {
    return <p className="text-sm text-echo-muted">No decision available while the track is {status.replace(/_/g, " ")}.</p>;
  }

  return (
    <div className="space-y-4">
      <Field label="Reason code">
        <select className={`${inputClass} font-mono text-sm`} value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </Field>
      <Field label="Notes" hint="Internal. The artist sees the reason code only.">
        <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {!analysisPassed ? (
        <Field label="EchoScore override reason" hint="Required to approve: EchoScore did not pass. Logged in the audit trail.">
          <textarea className={inputClass} rows={2} value={override} onChange={(e) => setOverride(e.target.value)} />
        </Field>
      ) : null}
      <div className="grid grid-cols-1 gap-2">
        <Button className="border-emerald-500/50" onClick={() => act("approve", { reason_code: reason, notes: notes || undefined, override_reason: override || undefined })}>
          Approve for sale
        </Button>
        <Button onClick={() => act("request-changes", { reason_code: reason, notes: notes || undefined })}>Request changes</Button>
        <Button variant="danger" onClick={() => act("reject", { reason_code: reason, notes: notes || undefined })}>
          Reject
        </Button>
        {status === "analysis_failed" ? (
          <Button variant="ghost" onClick={() => act("retry-analysis", {})}>
            Retry EchoScore
          </Button>
        ) : null}
      </div>
      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
    </div>
  );
}
