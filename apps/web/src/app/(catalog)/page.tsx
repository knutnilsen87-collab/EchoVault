import Link from "next/link";
import { formatEur } from "@echovault/domain";
import { TrackDataRow } from "@/components/catalog/track-data-row";
import { inputClass } from "@/components/ui/primitives";
import { catalogFacets, getActiveTerms, listPublicTracks, type CatalogFilters } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

const SORTS = { newest: "Newest", bpm_asc: "BPM ↑", bpm_desc: "BPM ↓", shortest: "Shortest" } as const;
const DURATIONS = { "": "Any length", "60": "≤ 1 min", "120": "≤ 2 min", "180": "≤ 3 min", "300": "≤ 5 min" } as const;
const int = (v?: string) => (v && /^\d{1,4}$/.test(v) ? Number(v) : undefined);

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sort = (Object.keys(SORTS) as (keyof typeof SORTS)[]).find((k) => k === sp.sort);
  const filters: CatalogFilters = {
    q: sp.q?.slice(0, 100) || undefined,
    genre: sp.genre || undefined,
    mood: sp.mood || undefined,
    bpmMin: int(sp.bpm_min),
    bpmMax: int(sp.bpm_max),
    maxDurationSeconds: int(sp.max_duration),
    sort
  };
  const [tracks, terms, facets] = await Promise.all([listPublicTracks(filters), getActiveTerms(), catalogFacets()]);
  const from = terms.length ? Math.min(...terms.map((t) => t.price_cents)) : null;
  const filtered = Boolean(filters.q || filters.genre || filters.mood || filters.bpmMin || filters.bpmMax || filters.maxDurationSeconds);
  const select = `${inputClass} py-1.5 text-sm`;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12">
      <section className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-echo-muted">Curated AI / hybrid music licensing</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Music you can license with a paper trail.</h1>
        <p className="mt-4 text-base leading-7 text-echo-muted">
          Every track is human-reviewed, technically checked with EchoScore and documented with the artist’s Proof of Effort. Pay once, get a license
          certificate and the high-res WAV. {from !== null ? <span className="font-mono text-white">From {formatEur(from)}.</span> : null}{" "}
          <Link href="/pricing" className="text-white underline">
            Compare licenses
          </Link>
        </p>
      </section>

      <section aria-labelledby="catalog-heading" className="space-y-4">
        <form className="grid gap-3 rounded-xl border border-echo-border bg-echo-surface p-4 sm:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_1.6fr_1fr_1fr_auto]" role="search">
          <label className="block">
            <span className="sr-only">Search</span>
            <input name="q" defaultValue={sp.q} placeholder="Search title, artist, genre, mood" className={`${inputClass} py-1.5 text-sm`} />
          </label>
          <label className="block">
            <span className="sr-only">Genre</span>
            <select name="genre" defaultValue={sp.genre ?? ""} className={select}>
              <option value="">All genres</option>
              {facets.genres.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Mood</span>
            <select name="mood" defaultValue={sp.mood ?? ""} className={select}>
              <option value="">All moods</option>
              {facets.moods.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">BPM range</legend>
            <input name="bpm_min" defaultValue={sp.bpm_min} inputMode="numeric" placeholder="Min BPM" aria-label="Minimum BPM" className={`${inputClass} py-1.5 font-mono text-sm`} />
            <span className="text-echo-muted">–</span>
            <input name="bpm_max" defaultValue={sp.bpm_max} inputMode="numeric" placeholder="Max" aria-label="Maximum BPM" className={`${inputClass} py-1.5 font-mono text-sm`} />
          </fieldset>
          <label className="block">
            <span className="sr-only">Length</span>
            <select name="max_duration" defaultValue={sp.max_duration ?? ""} className={select}>
              {Object.entries(DURATIONS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Sort</span>
            <select name="sort" defaultValue={sort ?? "newest"} className={select}>
              {Object.entries(SORTS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-md border border-white/40 px-4 py-1.5 text-sm hover:border-white">Apply</button>
        </form>

        <div className="flex items-baseline justify-between">
          <h2 id="catalog-heading" className="font-mono text-xs uppercase tracking-[0.2em] text-echo-muted">
            Catalog <span className="text-white">{tracks.length}</span>
          </h2>
          {filtered ? (
            <Link href="/" className="text-sm text-echo-muted underline hover:text-white">
              Clear filters
            </Link>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-xl border border-echo-border">
          {tracks.length ? (
            tracks.map((t) => <TrackDataRow key={t.id} track={t} />)
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-white">{filtered ? "No tracks match these filters." : "The catalog is empty."}</p>
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
