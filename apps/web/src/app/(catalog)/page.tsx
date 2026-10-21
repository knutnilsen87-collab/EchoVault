import Link from "next/link";
import { formatEur } from "@echovault/domain";
import { TrackDataRow } from "@/components/catalog/track-data-row";
import { inputClass } from "@/components/ui/primitives";
import { getActiveTerms, listPublicTracks } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [tracks, terms] = await Promise.all([
    listPublicTracks({ q: sp.q?.slice(0, 100), genre: sp.genre, mood: sp.mood }),
    getActiveTerms()
  ]);
  const from = Math.min(...terms.map((t) => t.price_cents));
  const filtered = Boolean(sp.q || sp.genre || sp.mood);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12">
      <section className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-echo-muted">Curated AI / hybrid music licensing</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Music you can license with a paper trail.</h1>
        <p className="mt-4 text-base leading-7 text-echo-muted">
          Every track is human-reviewed, technically checked with EchoScore and documented with the artist’s Proof of Effort. Pay once, get a license
          certificate and the high-res WAV. {Number.isFinite(from) ? <span className="font-mono text-white">From {formatEur(from)}.</span> : null}
        </p>
      </section>

      <section aria-labelledby="catalog-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 id="catalog-heading" className="font-mono text-xs uppercase tracking-[0.2em] text-echo-muted">
            Catalog <span className="text-white">{tracks.length}</span>
          </h2>
          <form className="flex w-full max-w-md gap-2" role="search">
            <label htmlFor="q" className="sr-only">
              Search tracks
            </label>
            <input id="q" name="q" defaultValue={sp.q} placeholder="Search title, artist, genre, mood" className={inputClass} />
            <button className="rounded-md border border-echo-border px-4 text-sm hover:border-white/40">Search</button>
          </form>
        </div>
        <div className="overflow-hidden rounded-xl border border-echo-border">
          {tracks.length ? (
            tracks.map((t) => <TrackDataRow key={t.id} track={t} />)
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-white">{filtered ? "No tracks match that search." : "The catalog is empty."}</p>
              <p className="mt-2 text-sm text-echo-muted">
                {filtered ? (
                  <Link href="/" className="underline">
                    Clear filters
                  </Link>
                ) : (
                  "Approved tracks appear here after human review."
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 text-sm text-echo-muted md:grid-cols-3">
        {[
          ["Proof of Effort", "Artists document AI tools, manual production work, samples and a rights warranty before anything is sold."],
          ["EchoScore + human review", "Loudness, true peak, bandwidth and artifact checks, then a human reviewer approves every track."],
          ["Certificate at purchase", "Each license references a versioned set of terms, is stored in an append-only ledger and can be verified."]
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border border-echo-border p-5">
            <h3 className="font-medium text-white">{title}</h3>
            <p className="mt-2 leading-6">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
