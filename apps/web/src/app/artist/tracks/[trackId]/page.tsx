import Link from "next/link";
import { notFound } from "next/navigation";
import { isArtistEditable } from "@echovault/domain";
import { PoeForm, SubmitTrackButton, WavUpload } from "@/components/forms/artist-forms";
import { EchoScoreBadge, StatusBadge } from "@/components/ui/badges";
import { Alert, DataRow, Panel } from "@/components/ui/primitives";
import { dateTime, duration } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { AppError } from "@/server/errors";
import { getArtistTrack } from "@/server/services/artist";

export const dynamic = "force-dynamic";

export default async function ArtistTrackPage({ params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const user = await pageUser(["artist"], `/artist/tracks/${trackId}`);
  if (!/^[0-9a-f-]{36}$/i.test(trackId)) notFound();
  let data;
  try {
    data = await getArtistTrack(user, trackId);
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
  const { track, files, poe, poe_problems, analysis, reviews } = data;
  const editable = isArtistEditable(track.status);
  const wav = files.find((f) => f.kind === "high_res_wav") ?? null;
  const ready = editable && Boolean(wav) && poe_problems.length === 0;
  const lastReview = reviews[0];

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Link href="/artist" className="font-mono text-xs text-echo-muted hover:text-white">
          ← YOUR TRACKS
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{track.title}</h1>
          <StatusBadge status={track.status} />
        </div>
        {track.status === "changes_requested" ? <Alert tone="error">A reviewer requested changes ({lastReview?.reason_code ?? "see notes"}). Update the master or PoE and submit again.</Alert> : null}
        {track.status === "rejected" ? <Alert tone="error">This track was not accepted ({lastReview?.reason_code}).</Alert> : null}
        {track.status === "analysis_pending" ? <Alert>EchoScore is analysing your master. This usually takes under a minute.</Alert> : null}
        {track.status === "needs_human_review" ? <Alert>Analysis complete — waiting for a human reviewer.</Alert> : null}

        <Panel title="1 · Master file">
          <WavUpload trackId={track.id} current={editable ? wav : null} />
          {!editable && wav ? <p className="font-mono text-xs text-echo-muted">{wav.original_filename} · locked while in review</p> : null}
        </Panel>
        <Panel title="2 · Proof of Effort" aside={<span className="font-mono text-[11px] text-[#b98cf0]">PROVENANCE</span>}>
          <PoeForm trackId={track.id} initial={poe} disabled={!editable} />
        </Panel>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Panel title="3 · Submit">
          <ul className="mb-4 space-y-1 font-mono text-xs">
            <li>{wav ? "✓" : "○"} Master WAV uploaded</li>
            <li>{poe_problems.length === 0 ? "✓" : "○"} Proof of Effort complete</li>
          </ul>
          <SubmitTrackButton trackId={track.id} ready={ready} />
        </Panel>
        <Panel title="Details">
          <dl>
            <DataRow label="Genre" value={track.genre} mono={false} />
            <DataRow label="BPM" value={track.bpm ?? "—"} />
            <DataRow label="Duration" value={duration(track.duration_seconds)} />
            <DataRow label="Submitted" value={dateTime(track.submitted_at)} />
          </dl>
        </Panel>
        {analysis && analysis.status !== "queued" ? (
          <Panel title="EchoScore" aside={<EchoScoreBadge score={analysis.score} pass={analysis.pass} />}>
            <ul className="space-y-2 text-sm text-neutral-300">
              {(analysis.feedback ?? []).map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </aside>
    </main>
  );
}
