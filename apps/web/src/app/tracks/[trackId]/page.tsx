import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutDrawer } from "@/components/checkout/checkout-drawer";
import { PlayButton } from "@/components/catalog/player";
import { EchoScoreBadge, PoeBadge } from "@/components/ui/badges";
import { Alert, DataRow, Panel } from "@/components/ui/primitives";
import { dateTime, duration } from "@/lib/format";
import { currentUser } from "@/lib/session";
import { AppError } from "@/server/errors";
import { TrackCover } from "@/components/catalog/track-cover";
import { TrackDataRow } from "@/components/catalog/track-data-row";
import { getActiveTerms, getPublicTrack, similarTracks } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export default async function TrackPage({ params, searchParams }: { params: Promise<{ trackId: string }>; searchParams: Promise<{ checkout?: string }> }) {
  const { trackId } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(trackId)) notFound();
  let data;
  try {
    data = await getPublicTrack(trackId);
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
  const { track, tiers } = data;
  const [user, terms, similar] = await Promise.all([currentUser(), getActiveTerms(), similarTracks(track.id)]);
  const es = track.echoscore;
  const poe = track.poe;

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Link href="/" className="font-mono text-xs text-echo-muted hover:text-white">
          ← CATALOG
        </Link>
        <div className="flex flex-wrap items-end gap-5">
          <TrackCover trackId={track.id} title={track.title} hasArtwork={track.has_artwork} size={140} className="rounded-xl" />
          <div className="flex items-start gap-4">
          <PlayButton disabled={!track.has_preview} track={{ id: track.id, title: track.title, artist: track.artist_name, src: `/api/v1/vault/tracks/${track.id}/preview` }} />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{track.title}</h1>
            <Link href={`/artists/${track.artist_id}`} className="mt-1 inline-block text-echo-muted hover:text-white">
              {track.artist_name}
            </Link>
            <div className="mt-3 flex flex-wrap gap-2">
              <EchoScoreBadge score={es?.score} pass={es?.pass} />
              <PoeBadge mode={poe?.creation_mode} />
            </div>
          </div>
          </div>
        </div>
        {sp.checkout === "cancelled" ? <Alert>Checkout was cancelled. You have not been charged.</Alert> : null}
        {track.description ? <p className="max-w-2xl leading-7 text-neutral-300">{track.description}</p> : null}

        <Panel title="Track data">
          <dl>
            <DataRow label="Genre" value={track.genre} mono={false} />
            <DataRow label="Mood" value={track.mood ?? "—"} mono={false} />
            <DataRow label="BPM" value={track.bpm ?? "—"} />
            <DataRow label="Duration" value={duration(track.duration_seconds)} />
            <DataRow label="Integrated loudness" value={es?.integrated_lufs != null ? `${es.integrated_lufs} LUFS` : "—"} />
            <DataRow label="True peak" value={es?.true_peak_db != null ? `${es.true_peak_db} dBTP` : "—"} />
            <DataRow label="Delivery" value="WAV (high-res) + PDF certificate" />
          </dl>
        </Panel>

        <Panel title="Proof of Effort" aside={<span className="font-mono text-[11px] text-[#b98cf0]">PROVENANCE</span>}>
          {poe ? (
            <dl>
              <DataRow label="Creation mode" value={poe.creation_mode} mono={false} />
              <DataRow label="AI tools" value={poe.ai_tools.length ? poe.ai_tools.join(", ") : "None declared"} />
              <DataRow label="Manual / DAW work" value={poe.manual_work ? "Yes" : "No"} />
              <DataRow label="Time spent" value={poe.time_spent} />
              <DataRow label="Samples" value={poe.samples.replace("_", " ")} />
              <DataRow label="Voice / likeness used" value={poe.voice_or_likeness_used ? "Yes (declared)" : "No"} />
              <DataRow label="Artist rights warranty" value="Accepted" />
              <DataRow label="Reviewed" value={dateTime(poe.reviewed_at ?? track.approved_at)} />
            </dl>
          ) : (
            <p className="text-sm text-echo-muted">No public summary.</p>
          )}
          <p className="mt-4 text-xs leading-5 text-echo-muted">
            Proof of Effort is the artist’s documented creative process and rights warranty. EchoScore is a technical audio check. Neither is a copyright
            clearance; they exist so you know how the track was made and who stands behind it.
          </p>
        </Panel>

        {similar.length ? (
          <section aria-labelledby="similar-heading">
            <h2 id="similar-heading" className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-echo-muted">
              Similar tracks
            </h2>
            <div className="overflow-hidden rounded-xl border border-echo-border">
              {similar.map((t) => (
                <TrackDataRow key={t.id} track={t} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Panel title="License">
          <ul className="mb-5 space-y-3">
            {tiers.map((t) => (
              <li key={t.tier} className="flex items-baseline justify-between gap-3 border-b border-echo-border pb-3 last:border-0">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-echo-muted">{t.allowed}</p>
                </div>
                <span className="font-mono text-sm">€{(t.price_cents / 100).toFixed(0)}</span>
              </li>
            ))}
          </ul>
          <CheckoutDrawer
            trackId={track.id}
            trackTitle={track.title}
            signedIn={Boolean(user)}
            tiers={tiers.map((t) => ({ ...t, terms_md: terms.find((x) => x.id === t.terms_version_id)?.terms_md ?? "" }))}
          />
          <p className="mt-3 text-center text-xs text-echo-muted">
            One-off payment · certificate issued instantly ·{" "}
            <Link href="/pricing" className="underline hover:text-white">
              compare licenses
            </Link>
          </p>
        </Panel>
      </aside>
    </main>
  );
}
