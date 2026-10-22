/* eslint-disable @next/next/no-img-element -- artwork is served by our own API with auth/caching rules */

/** Cover art or a neutral placeholder with the title's initial. */
export function TrackCover({ trackId, title, hasArtwork, size = 40, className = "" }: { trackId: string; title: string; hasArtwork: boolean; size?: number; className?: string }) {
  if (hasArtwork) {
    return (
      <img
        src={`/api/v1/vault/tracks/${trackId}/artwork`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className={`shrink-0 rounded-md border border-echo-border object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-md border border-echo-border bg-echo-surface font-mono text-echo-muted ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size / 3) }}
    >
      {title.slice(0, 1).toUpperCase()}
    </div>
  );
}
