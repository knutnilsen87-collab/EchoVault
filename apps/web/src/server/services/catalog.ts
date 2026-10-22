import { LICENSE_TIERS, TIER_LABELS, type LicenseTier, type PublicPoeSummary } from "@echovault/domain";
import { query, queryOne } from "../db";
import { notFound } from "../errors";
import { storage } from "../storage";

export type PublicTrack = {
  id: string;
  title: string;
  artist_id: string;
  artist_name: string;
  has_artwork: boolean;
  genre: string;
  mood: string | null;
  bpm: number | null;
  duration_seconds: number | null;
  description: string | null;
  echoscore: { score: number | null; pass: boolean | null; integrated_lufs: number | null; true_peak_db: number | null } | null;
  poe: (PublicPoeSummary & { reviewed_at?: string }) | null;
  has_preview: boolean;
  price_from_cents: number;
  approved_at: string;
};

export type ActiveTerms = { id: string; tier: LicenseTier; version: string; title: string; price_cents: number; currency: string; artist_share_bps: number; terms_md: string };

// Only approved/live rows ever leave this module (BR-001). Every query filters on status itself.
const PUBLIC_SELECT = `
  SELECT t.id, t.title, t.artist_id, COALESCE(u.artist_name, u.display_name, 'Unknown artist') AS artist_name, t.genre, t.mood, t.bpm,
         t.duration_seconds, t.description, t.analysis_summary AS echoscore, t.public_poe_summary AS poe, t.approved_at,
         EXISTS (SELECT 1 FROM track_files f WHERE f.track_id = t.id AND f.kind = 'preview_mp3') AS has_preview,
         EXISTS (SELECT 1 FROM track_files f WHERE f.track_id = t.id AND f.kind = 'artwork_image') AS has_artwork,
         (SELECT MIN(price_cents) FROM license_terms_versions WHERE active) AS price_from_cents
    FROM tracks t JOIN users u ON u.id = t.artist_id
   WHERE t.status IN ('approved', 'live')`;

export type CatalogFilters = {
  q?: string;
  genre?: string;
  mood?: string;
  bpmMin?: number;
  bpmMax?: number;
  maxDurationSeconds?: number;
  sort?: "newest" | "bpm_asc" | "bpm_desc" | "shortest";
};

const SORTS: Record<NonNullable<CatalogFilters["sort"]>, string> = {
  newest: "t.approved_at DESC NULLS LAST",
  bpm_asc: "t.bpm ASC NULLS LAST",
  bpm_desc: "t.bpm DESC NULLS LAST",
  shortest: "t.duration_seconds ASC NULLS LAST"
};

export async function listPublicTracks(filters: CatalogFilters = {}): Promise<PublicTrack[]> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (filters.q) {
    params.push(`%${filters.q.replace(/[%_\\]/g, "\\$&")}%`);
    where.push(`(t.title ILIKE $${params.length} OR u.artist_name ILIKE $${params.length} OR t.genre ILIKE $${params.length} OR t.mood ILIKE $${params.length})`);
  }
  if (filters.genre) {
    params.push(filters.genre);
    where.push(`lower(t.genre) = lower($${params.length})`);
  }
  if (filters.mood) {
    params.push(filters.mood);
    where.push(`lower(t.mood) = lower($${params.length})`);
  }
  if (filters.bpmMin) {
    params.push(filters.bpmMin);
    where.push(`t.bpm >= $${params.length}`);
  }
  if (filters.bpmMax) {
    params.push(filters.bpmMax);
    where.push(`t.bpm <= $${params.length}`);
  }
  if (filters.maxDurationSeconds) {
    params.push(filters.maxDurationSeconds);
    where.push(`t.duration_seconds <= $${params.length}`);
  }
  const order = SORTS[filters.sort ?? "newest"] ?? SORTS.newest;
  return query<PublicTrack>(`${PUBLIC_SELECT} ${where.map((w) => `AND ${w}`).join(" ")} ORDER BY ${order}, t.id LIMIT 100`, params);
}

/** Distinct genres/moods that actually exist in the public catalog (for filter dropdowns). */
export async function catalogFacets(): Promise<{ genres: string[]; moods: string[] }> {
  const rows = await query<{ genres: string[] | null; moods: string[] | null }>(
    `SELECT array_agg(DISTINCT genre ORDER BY genre) AS genres,
            array_agg(DISTINCT mood ORDER BY mood) FILTER (WHERE mood IS NOT NULL) AS moods
       FROM tracks WHERE status IN ('approved', 'live')`
  );
  return { genres: rows[0]?.genres ?? [], moods: rows[0]?.moods ?? [] };
}

/** Same genre or mood first, then anything else from the catalog. */
export async function similarTracks(trackId: string, limit = 4): Promise<PublicTrack[]> {
  return query<PublicTrack>(
    `${PUBLIC_SELECT} AND t.id <> $1
       ORDER BY ((lower(t.genre) = (SELECT lower(genre) FROM tracks WHERE id = $1))::int * 2
               + (lower(COALESCE(t.mood, '')) = (SELECT lower(COALESCE(mood, '-')) FROM tracks WHERE id = $1))::int) DESC,
                abs(COALESCE(t.bpm, 0) - COALESCE((SELECT bpm FROM tracks WHERE id = $1), 0)),
                t.approved_at DESC
       LIMIT $2`,
    [trackId, limit]
  );
}

/** Public artist page. 404 unless the artist has at least one public track (no user enumeration). */
export async function artistProfile(artistId: string) {
  const tracks = await query<PublicTrack>(`${PUBLIC_SELECT} AND t.artist_id = $1 ORDER BY t.approved_at DESC`, [artistId]);
  if (tracks.length === 0) throw notFound("Artist");
  const artist = await queryOne<{ id: string; name: string; bio: string | null; since: string }>(
    "SELECT id, COALESCE(artist_name, display_name, 'Unknown artist') AS name, bio, created_at AS since FROM users WHERE id = $1",
    [artistId]
  );
  return { artist: artist!, tracks };
}

export type ArtworkFile = { bytes: Uint8Array; mimeType: string; etag: string; isPublic: boolean };

/**
 * Cover art. Public once the track is approved/live (cacheable); before that only the artist
 * and reviewers may see it.
 */
export async function trackArtwork(trackId: string, viewer: { id: string; role: string } | null): Promise<ArtworkFile> {
  const row = await queryOne<{ storage_key: string; mime_type: string; checksum_sha256: string | null; status: string; artist_id: string }>(
    `SELECT f.storage_key, f.mime_type, f.checksum_sha256, t.status, t.artist_id FROM track_files f JOIN tracks t ON t.id = f.track_id
      WHERE f.track_id = $1 AND f.kind = 'artwork_image'`,
    [trackId]
  );
  if (!row) throw notFound("Artwork");
  const isPublic = row.status === "approved" || row.status === "live";
  const allowed = isPublic || (viewer && (viewer.id === row.artist_id || ["reviewer", "admin", "support"].includes(viewer.role)));
  if (!allowed) throw notFound("Artwork");
  const bytes = await (await storage()).get(row.storage_key);
  return { bytes, mimeType: row.mime_type, etag: `"${row.checksum_sha256 ?? trackId}"`, isPublic };
}

export async function getActiveTerms(): Promise<ActiveTerms[]> {
  return query<ActiveTerms>(
    "SELECT id, tier, version, title, price_cents, currency, artist_share_bps, terms_md FROM license_terms_versions WHERE active ORDER BY price_cents"
  );
}

export async function getPublicTrack(trackId: string) {
  const track = await queryOne<PublicTrack>(`${PUBLIC_SELECT} AND t.id = $1`, [trackId]);
  if (!track) throw notFound("Track");
  const terms = await getActiveTerms();
  const tiers = LICENSE_TIERS.map((tier) => {
    const t = terms.find((x) => x.tier === tier);
    return t
      ? { tier, ...TIER_LABELS[tier], price_cents: t.price_cents, currency: t.currency, terms_version: t.version, terms_version_id: t.id }
      : null;
  }).filter((x) => x !== null);
  return { track, tiers };
}

export async function previewUrl(trackId: string): Promise<string> {
  const file = await queryOne<{ storage_key: string }>(
    `SELECT f.storage_key FROM track_files f JOIN tracks t ON t.id = f.track_id
      WHERE f.track_id = $1 AND f.kind = 'preview_mp3' AND t.status IN ('approved', 'live')`,
    [trackId]
  );
  if (!file) throw notFound("Preview");
  const signed = await (await storage()).signedUrl(file.storage_key, { expiresInSeconds: 600, contentType: "audio/mpeg" });
  return signed.url;
}

/** Reviewer-only preview of any submitted track (WAV is fine here: internal, signed, short-lived). */
export async function reviewerAudioUrl(trackId: string): Promise<string> {
  const file = await queryOne<{ storage_key: string; kind: string }>(
    "SELECT storage_key, kind FROM track_files WHERE track_id = $1 AND kind IN ('preview_mp3', 'high_res_wav') ORDER BY (kind = 'preview_mp3') DESC LIMIT 1",
    [trackId]
  );
  if (!file) throw notFound("Audio");
  return (await (await storage()).signedUrl(file.storage_key, { expiresInSeconds: 600, contentType: file.kind === "preview_mp3" ? "audio/mpeg" : "audio/wav" })).url;
}
