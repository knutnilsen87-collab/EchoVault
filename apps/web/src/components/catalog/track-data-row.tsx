import Link from "next/link";
import { formatEur } from "@echovault/domain";
import type { PublicTrack } from "@/server/services/catalog";
import { duration } from "@/lib/format";
import { EchoScoreBadge, PoeBadge } from "../ui/badges";
import { PlayButton } from "./player";

/** Editorial data grid row (UI_Specification: play, title/artist, genre/mood, BPM, duration, ES, PoE, from-price, CTA). */
export function TrackDataRow({ track }: { track: PublicTrack }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-echo-border bg-echo-dark px-4 py-3 last:border-0 md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1fr)_4rem_3.5rem_auto_auto_auto] md:gap-5">
      <PlayButton disabled={!track.has_preview} track={{ id: track.id, title: track.title, artist: track.artist_name, src: `/api/v1/vault/tracks/${track.id}/preview` }} />
      <div className="min-w-0">
        <Link href={`/tracks/${track.id}`} className="block truncate text-sm font-medium text-white hover:underline">
          {track.title}
        </Link>
        <div className="truncate text-xs text-echo-muted">{track.artist_name}</div>
      </div>
      <div className="hidden truncate text-xs text-echo-muted md:block">
        {track.genre}
        {track.mood ? ` · ${track.mood}` : ""}
      </div>
      <div className="hidden font-mono text-xs text-echo-muted md:block">{track.bpm ? `${track.bpm} BPM` : "—"}</div>
      <div className="hidden font-mono text-xs text-echo-muted md:block">{duration(track.duration_seconds)}</div>
      <div className="hidden md:block">
        <EchoScoreBadge score={track.echoscore?.score} pass={track.echoscore?.pass} />
      </div>
      <div className="hidden lg:block">
        <PoeBadge mode={track.poe?.creation_mode} />
      </div>
      <Link
        href={`/tracks/${track.id}`}
        className="rounded-md border border-echo-border px-3 py-1.5 font-mono text-xs text-white hover:border-white/50"
        aria-label={`License ${track.title}, from ${formatEur(track.price_from_cents)}`}
      >
        from {formatEur(track.price_from_cents)}
      </Link>
    </div>
  );
}
