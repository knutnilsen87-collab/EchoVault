import { notFound } from "next/navigation";
import { TrackDataRow } from "@/components/catalog/track-data-row";
import { TrackCover } from "@/components/catalog/track-cover";
import { AppError } from "@/server/errors";
import { artistProfile } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export default async function ArtistProfilePage({ params }: { params: Promise<{ artistId: string }> }) {
  const { artistId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(artistId)) notFound();
  let data;
  try {
    data = await artistProfile(artistId);
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
  const { artist, tracks } = data;
  const lead = tracks.find((t) => t.has_artwork) ?? tracks[0]!;
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <section className="flex flex-wrap items-end gap-6">
        <TrackCover trackId={lead.id} title={artist.name} hasArtwork={lead.has_artwork} size={120} className="rounded-xl" />
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-echo-muted">Artist</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{artist.name}</h1>
          <p className="mt-2 font-mono text-xs text-echo-muted">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"} · on EchoVault since {new Date(artist.since).getFullYear()}
          </p>
        </div>
      </section>
      {artist.bio ? <p className="max-w-2xl whitespace-pre-wrap leading-7 text-neutral-300">{artist.bio}</p> : null}
      <div className="overflow-hidden rounded-xl border border-echo-border">
        {tracks.map((t) => (
          <TrackDataRow key={t.id} track={t} />
        ))}
      </div>
    </main>
  );
}
