import { LICENSE_TIERS, TIER_LABELS, type LicenseTier, type PublicPoeSummary } from "@echovault/domain";
import { query, queryOne } from "../db";
import { notFound } from "../errors";
import { storage } from "../storage";

export type PublicTrack = {
  id: string;
  title: string;
  artist_name: string;
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
  SELECT t.id, t.title, COALESCE(u.artist_name, u.display_name, 'Unknown artist') AS artist_name, t.genre, t.mood, t.bpm,
         t.duration_seconds, t.description, t.analysis_summary AS echoscore, t.public_poe_summary AS poe, t.approved_at,
         EXISTS (SELECT 1 FROM track_files f WHERE f.track_id = t.id AND f.kind = 'preview_mp3') AS has_preview,
         (SELECT MIN(price_cents) FROM license_terms_versions WHERE active) AS price_from_cents
    FROM tracks t JOIN users u ON u.id = t.artist_id
   WHERE t.status IN ('approved', 'live')`;

export async function listPublicTracks(filters: { q?: string; genre?: string; mood?: string; bpmMin?: number; bpmMax?: number } = {}): Promise<PublicTrack[]> {
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
  return query<PublicTrack>(`${PUBLIC_SELECT} ${where.map((w) => `AND ${w}`).join(" ")} ORDER BY t.approved_at DESC NULLS LAST LIMIT 100`, params);
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
