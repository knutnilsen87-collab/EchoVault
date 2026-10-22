"use client";

import * as React from "react";
import { api, describeError } from "@/lib/api-client";
import { Alert, Button, Field, inputClass } from "../ui/primitives";

export function NewTrackForm() {
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          const { track } = await api<{ track: { id: string } }>("/api/v1/artist/tracks", {
            method: "POST",
            json: {
              title: f.get("title"),
              genre: f.get("genre"),
              mood: f.get("mood") || null,
              bpm: f.get("bpm") ? Number(f.get("bpm")) : null,
              description: f.get("description") || null
            }
          });
          window.location.assign(`/artist/tracks/${track.id}`);
        } catch (err) {
          setError(describeError(err));
        }
      }}
    >
      <Field label="Title">
        <input name="title" required maxLength={255} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Genre">
          <input name="genre" required maxLength={100} className={inputClass} placeholder="Electronic" />
        </Field>
        <Field label="Mood">
          <input name="mood" maxLength={100} className={inputClass} placeholder="Cinematic" />
        </Field>
      </div>
      <Field label="BPM">
        <input name="bpm" type="number" min={1} max={399} className={`${inputClass} font-mono`} />
      </Field>
      <Field label="Description" hint="What is the track good for? Buyers search on this.">
        <textarea name="description" rows={3} maxLength={5000} className={inputClass} />
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button type="submit">Create draft</Button>
    </form>
  );
}

export function WavUpload({ trackId, current }: { trackId: string; current: { original_filename: string | null; size_bytes: number | null; checksum_sha256: string | null } | null }) {
  const [state, setState] = React.useState<{ busy: boolean; error?: string; ok?: string }>({ busy: false });
  return (
    <div className="space-y-3">
      {current ? (
        <p className="font-mono text-xs text-echo-muted">
          {current.original_filename} · {((current.size_bytes ?? 0) / 1024 / 1024).toFixed(1)} MB · sha256 {current.checksum_sha256?.slice(0, 12)}…
        </p>
      ) : (
        <p className="text-sm text-echo-muted">No master uploaded yet.</p>
      )}
      <input
        type="file"
        accept=".wav,audio/wav,audio/x-wav"
        aria-label="Upload high-res WAV"
        disabled={state.busy}
        className="block w-full text-sm text-echo-muted file:mr-4 file:rounded-md file:border file:border-echo-border file:bg-echo-surface file:px-4 file:py-2 file:text-white"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setState({ busy: true });
          const form = new FormData();
          form.set("kind", "high_res_wav");
          form.set("file", file);
          try {
            await api(`/api/v1/artist/tracks/${trackId}/files`, { method: "POST", body: form });
            setState({ busy: false, ok: "Uploaded and verified." });
            window.location.reload();
          } catch (err) {
            setState({ busy: false, error: describeError(err) });
          }
        }}
      />
      <p className="text-xs text-echo-muted">PCM/float WAV, ≥ 44.1 kHz / 16-bit, max 250 MB. Stored privately — buyers only ever hear a compressed preview.</p>
      {state.busy ? <Alert>Uploading…</Alert> : null}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}
    </div>
  );
}

export function ArtworkUpload({ trackId, hasArtwork, disabled }: { trackId: string; hasArtwork: boolean; disabled: boolean }) {
  const [state, setState] = React.useState<{ busy: boolean; error?: string }>({ busy: false });
  const [version, setVersion] = React.useState(0);
  return (
    <div className="flex flex-wrap items-center gap-5">
      {hasArtwork || version > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/v1/vault/tracks/${trackId}/artwork?v=${version}`} alt="Current cover" width={96} height={96} className="h-24 w-24 rounded-lg border border-echo-border object-cover" />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-echo-border font-mono text-[11px] text-echo-muted">NO COVER</div>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Upload cover art"
          disabled={disabled || state.busy}
          className="block w-full text-sm text-echo-muted file:mr-4 file:rounded-md file:border file:border-echo-border file:bg-echo-surface file:px-4 file:py-2 file:text-white"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setState({ busy: true });
            const form = new FormData();
            form.set("kind", "artwork_image");
            form.set("file", file);
            try {
              await api(`/api/v1/artist/tracks/${trackId}/files`, { method: "POST", body: form });
              setVersion((v) => v + 1);
              setState({ busy: false });
            } catch (err) {
              setState({ busy: false, error: describeError(err) });
            }
          }}
        />
        <p className="text-xs text-echo-muted">Square JPEG, PNG or WebP, max 10 MB. Shown in the catalog once the track is approved.</p>
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      </div>
    </div>
  );
}

type Poe = {
  creation_mode: string;
  ai_tools_used: string[];
  process_summary: string;
  daw_manual_work: string | null;
  time_spent_bucket: string;
  samples_used: string;
  sample_notes: string | null;
  voice_or_likeness_used: boolean;
  named_artist_imitation: boolean;
  rights_warranty_accepted: boolean;
  private_notes: string | null;
};

export function PoeForm({ trackId, initial, disabled }: { trackId: string; initial: Poe | null; disabled: boolean }) {
  const [msg, setMsg] = React.useState<{ tone: "error" | "success"; text: string } | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        try {
          await api(`/api/v1/artist/tracks/${trackId}/poe`, {
            method: "PUT",
            json: {
              creation_mode: f.get("creation_mode"),
              ai_tools_used: String(f.get("ai_tools_used") ?? "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              process_summary: f.get("process_summary"),
              daw_manual_work: f.get("daw_manual_work") || null,
              time_spent_bucket: f.get("time_spent_bucket"),
              samples_used: f.get("samples_used"),
              sample_notes: f.get("sample_notes") || null,
              voice_or_likeness_used: f.get("voice_or_likeness_used") === "on",
              named_artist_imitation: f.get("named_artist_imitation") === "on",
              rights_warranty_accepted: f.get("rights_warranty_accepted") === "on",
              private_notes: f.get("private_notes") || null
            }
          });
          setMsg({ tone: "success", text: "Proof of Effort saved." });
          setTimeout(() => window.location.reload(), 600);
        } catch (err) {
          setMsg({ tone: "error", text: describeError(err) });
        }
      }}
    >
      <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60">
        <Field label="Creation mode">
          <select name="creation_mode" defaultValue={initial?.creation_mode ?? "hybrid_producer"} className={inputClass}>
            <option value="pure_ai_director">Pure AI Director — AI-generated, curated and directed by you</option>
            <option value="hybrid_producer">Hybrid Producer — AI material plus substantial DAW production</option>
            <option value="human_led_ai_assisted">Human-led with AI assistance</option>
          </select>
        </Field>
        <Field label="AI tools used" hint="Comma-separated, e.g. Suno, Udio, Stable Audio.">
          <input name="ai_tools_used" defaultValue={initial?.ai_tools_used.join(", ")} className={inputClass} />
        </Field>
        <Field label="Process summary" hint="How the track was made. Kept private — buyers see only a summary (mode, tools category, effort).">
          <textarea name="process_summary" required minLength={20} rows={4} defaultValue={initial?.process_summary} className={inputClass} />
        </Field>
        <Field label="DAW / manual work">
          <input name="daw_manual_work" defaultValue={initial?.daw_manual_work ?? ""} className={inputClass} placeholder="e.g. Ableton arrangement, re-recorded bass, mastering chain" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Time spent">
            <select name="time_spent_bucket" defaultValue={initial?.time_spent_bucket ?? "3_10h"} className={`${inputClass} font-mono`}>
              <option value="under_1h">&lt;1h</option>
              <option value="1_3h">1–3h</option>
              <option value="3_10h">3–10h</option>
              <option value="10h_plus">10h+</option>
            </select>
          </Field>
          <Field label="Samples used">
            <select name="samples_used" defaultValue={initial?.samples_used ?? "none"} className={inputClass}>
              <option value="none">None</option>
              <option value="owned">Owned (my own recordings)</option>
              <option value="licensed">Licensed</option>
              <option value="public_domain">Public domain</option>
              <option value="unknown">Not sure</option>
            </select>
          </Field>
        </div>
        <Field label="Sample notes (private)">
          <input name="sample_notes" defaultValue={initial?.sample_notes ?? ""} className={inputClass} />
        </Field>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="voice_or_likeness_used" defaultChecked={initial?.voice_or_likeness_used} className="mt-1 h-4 w-4" />
          <span>The track uses voice cloning or a real person’s vocal likeness.</span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="named_artist_imitation" defaultChecked={initial?.named_artist_imitation} className="mt-1 h-4 w-4" />
          <span>I prompted the AI to imitate a named, living artist. (Not accepted without cleared rights.)</span>
        </label>
        <Field label="Private notes for reviewers">
          <textarea name="private_notes" rows={2} defaultValue={initial?.private_notes ?? ""} className={inputClass} />
        </Field>
        <label className="flex items-start gap-3 rounded-md border border-echo-purple/50 p-3 text-sm">
          <input type="checkbox" name="rights_warranty_accepted" defaultChecked={initial?.rights_warranty_accepted} className="mt-1 h-4 w-4" />
          <span>
            I warrant that I have the rights to submit this track and to license it through EchoVault, that the information above is accurate, and that
            I used the AI tools under terms that allow commercial licensing. <span className="text-echo-muted">(Draft wording — pending legal review.)</span>
          </span>
        </label>
        <Button type="submit">Save Proof of Effort</Button>
      </fieldset>
      {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : null}
    </form>
  );
}

export function SubmitTrackButton({ trackId, ready }: { trackId: string; ready: boolean }) {
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="space-y-2">
      <Button
        disabled={!ready}
        className="w-full border-white/60"
        onClick={async () => {
          try {
            await api(`/api/v1/artist/tracks/${trackId}/submit`, { method: "POST" });
            window.location.reload();
          } catch (err) {
            setError(describeError(err));
          }
        }}
      >
        Submit for review
      </Button>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
