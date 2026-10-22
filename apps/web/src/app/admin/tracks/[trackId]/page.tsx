import Link from "next/link";
import { notFound } from "next/navigation";
import { REVIEWER_ROLES } from "@echovault/domain";
import { ReviewPanel } from "@/components/forms/review-panel";
import { EchoScoreBadge, StatusBadge } from "@/components/ui/badges";
import { DataRow, Panel } from "@/components/ui/primitives";
import { dateTime, duration } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { AppError } from "@/server/errors";
import { reviewDetail } from "@/server/services/review";

export const dynamic = "force-dynamic";

type Analysis = { status: string; score: number | null; pass: boolean | null; metrics: Record<string, unknown> | null; flags: string[]; feedback: string[]; analysis_version: string; error_message: string | null; completed_at: string | null };

export default async function AdminTrackPage({ params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  await pageUser(REVIEWER_ROLES, `/admin/tracks/${trackId}`);
  if (!/^[0-9a-f-]{36}$/i.test(trackId)) notFound();
  let d;
  try {
    d = await reviewDetail(trackId);
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
  const { track, poe, files, reviews, audit } = d;
  const analysis = (d.analyses[0] ?? null) as Analysis | null;
  const passed = analysis?.status === "succeeded" && analysis.pass === true;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/admin" className="font-mono text-xs text-echo-muted hover:text-white">
        ← REVIEW QUEUE
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{track.title}</h1>
        <StatusBadge status={track.status} />
        <EchoScoreBadge score={analysis?.score} pass={analysis?.pass} />
      </div>
      <p className="mt-1 text-sm text-echo-muted">
        {track.artist_name} · <span className="font-mono">{track.artist_email}</span>
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel title="Audio">
            {files.some((f) => (f as { kind: string }).kind === "high_res_wav") ? (
              <audio controls preload="none" src={`/api/v1/admin/tracks/${track.id}/audio`} className="w-full" />
            ) : (
              <p className="text-sm text-echo-muted">No audio uploaded.</p>
            )}
            <dl className="mt-4">
              <DataRow label="Genre / mood" value={`${track.genre}${track.mood ? ` · ${track.mood}` : ""}`} mono={false} />
              <DataRow label="BPM" value={track.bpm ?? "—"} />
              <DataRow label="Duration" value={duration(track.duration_seconds)} />
              {(files as { kind: string; original_filename: string; checksum_sha256: string | null; size_bytes: number }[]).map((f) => (
                <DataRow key={f.kind} label={f.kind} value={`${f.original_filename ?? ""} · ${(f.size_bytes / 1024 / 1024).toFixed(1)} MB${f.checksum_sha256 ? ` · ${f.checksum_sha256.slice(0, 10)}…` : ""}`} />
              ))}
            </dl>
            {track.description ? <p className="mt-4 text-sm text-neutral-300">{track.description}</p> : null}
          </Panel>
          <Panel title="EchoScore">
            {analysis ? (
              <>
                <p className="font-mono text-xs text-echo-muted">
                  {analysis.analysis_version} · {analysis.status.toUpperCase()} · {dateTime(analysis.completed_at)}
                </p>
                {analysis.error_message ? <p className="mt-2 text-sm text-red-300">{analysis.error_message}</p> : null}
                {analysis.flags?.length ? <p className="mt-2 font-mono text-xs text-red-300">FLAGS: {analysis.flags.join(", ")}</p> : null}
                <dl className="mt-3">
                  {Object.entries(analysis.metrics ?? {}).map(([k, v]) => (
                    <DataRow key={k} label={k} value={String(v)} />
                  ))}
                </dl>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-300">
                  {analysis.feedback?.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </>
            ) : (
              <p className="text-sm text-echo-muted">Not analysed.</p>
            )}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Decision" className="bg-echo-surface/80 backdrop-blur-glass">
            <ReviewPanel trackId={track.id} status={track.status} analysisPassed={passed} />
          </Panel>
          <Panel title="Proof of Effort (full, internal)" aside={<span className="font-mono text-[11px] text-[#b98cf0]">PRIVATE</span>}>
            {poe ? (
              <dl>
                <DataRow label="Creation mode" value={poe.creation_mode} />
                <DataRow label="AI tools" value={poe.ai_tools_used.join(", ") || "—"} />
                <DataRow label="Time spent" value={poe.time_spent_bucket} />
                <DataRow label="Samples" value={poe.samples_used} />
                <DataRow label="Sample notes" value={poe.sample_notes ?? "—"} mono={false} />
                <DataRow label="Voice / likeness" value={poe.voice_or_likeness_used ? "YES" : "no"} />
                <DataRow label="Named artist imitation" value={poe.named_artist_imitation ? "YES" : "no"} />
                <DataRow label="Rights warranty" value={poe.rights_warranty_accepted ? "accepted" : "MISSING"} />
                <div className="py-2">
                  <dt className="text-sm text-echo-muted">Process summary</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm">{poe.process_summary}</dd>
                </div>
                <div className="py-2">
                  <dt className="text-sm text-echo-muted">DAW / manual work</dt>
                  <dd className="mt-1 text-sm">{poe.daw_manual_work ?? "—"}</dd>
                </div>
                {poe.private_notes ? (
                  <div className="py-2">
                    <dt className="text-sm text-echo-muted">Private notes</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm">{poe.private_notes}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm text-red-300">No Proof of Effort.</p>
            )}
          </Panel>
          <Panel title="History">
            <ol className="space-y-2 font-mono text-xs">
              {(reviews as { decision: string; reason_code: string | null; reviewer_email: string | null; created_at: string; reviewer_notes: string | null }[]).map((r, i) => (
                <li key={`r${i}`}>
                  <span className="text-white">{r.decision.toUpperCase()}</span> {r.reason_code ?? ""} · {r.reviewer_email} · {dateTime(r.created_at)}
                  {r.reviewer_notes ? <span className="block text-echo-muted">“{r.reviewer_notes}”</span> : null}
                </li>
              ))}
              {(audit as { action: string; created_at: string }[]).map((a, i) => (
                <li key={`a${i}`} className="text-echo-muted">
                  {a.action} · {dateTime(a.created_at)}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </main>
  );
}
