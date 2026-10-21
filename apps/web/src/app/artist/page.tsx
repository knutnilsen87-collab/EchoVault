import Link from "next/link";
import { EchoScoreBadge, StatusBadge } from "@/components/ui/badges";
import { pageUser } from "@/lib/session";
import { dateTime } from "@/lib/format";
import { listArtistTracks } from "@/server/services/artist";

export const dynamic = "force-dynamic";
export const metadata = { title: "Artist" };

export default async function ArtistPage() {
  const user = await pageUser(["artist"], "/artist");
  const tracks = await listArtistTracks(user);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your tracks</h1>
          <p className="mt-1 text-sm text-echo-muted">Draft → upload master → Proof of Effort → submit → EchoScore → human review → live.</p>
        </div>
        <Link href="/artist/tracks/new" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-neutral-200">
          New track
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-echo-border">
        {tracks.length === 0 ? (
          <p className="px-6 py-12 text-center text-echo-muted">No tracks yet.</p>
        ) : (
          tracks.map((t) => (
            <Link key={t.id} href={`/artist/tracks/${t.id}`} className="flex items-center gap-4 border-b border-echo-border px-4 py-3 last:border-0 hover:bg-echo-surface">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.title}</p>
                <p className="font-mono text-xs text-echo-muted">
                  {t.genre} · created {dateTime(t.created_at)}
                </p>
              </div>
              <span className="hidden font-mono text-xs text-echo-muted sm:inline">
                {t.has_wav ? "WAV ✓" : "WAV —"} · {t.has_poe ? "PoE ✓" : "PoE —"}
              </span>
              <EchoScoreBadge score={t.score} pass={t.pass} />
              <StatusBadge status={t.status} />
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
