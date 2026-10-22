import type { SessionUser } from "../auth";
import { query } from "../db";

/**
 * Artist earnings. The split is the one frozen on each license at purchase (BR-011).
 * Payouts are not automated yet (Open Question Q-006) — everything shows as "accrued".
 */
export async function artistEarnings(user: SessionUser) {
  const [totals, byTrack, sales] = await Promise.all([
    query<{ licenses: number; gross_cents: number; artist_cents: number; last_30d_artist_cents: number }>(
      `SELECT count(*)::int AS licenses, COALESCE(sum(price_paid_cents), 0)::int AS gross_cents,
              COALESCE(sum(artist_cut_cents), 0)::int AS artist_cents,
              COALESCE(sum(artist_cut_cents) FILTER (WHERE purchased_at > now() - interval '30 days'), 0)::int AS last_30d_artist_cents
         FROM purchased_licenses l
        WHERE l.artist_id = $1 AND NOT EXISTS (SELECT 1 FROM license_events e WHERE e.license_id = l.id AND e.type = 'refunded')`,
      [user.id]
    ),
    query<{ track_id: string; title: string; status: string; licenses: number; artist_cents: number }>(
      `SELECT t.id AS track_id, t.title, t.status, count(l.id)::int AS licenses, COALESCE(sum(l.artist_cut_cents), 0)::int AS artist_cents
         FROM tracks t LEFT JOIN purchased_licenses l ON l.track_id = t.id
        WHERE t.artist_id = $1 AND t.status IN ('approved', 'live', 'suspended')
        GROUP BY t.id ORDER BY artist_cents DESC, t.title`,
      [user.id]
    ),
    query<{ id: string; track_title: string; tier: string; purchased_at: string; price_paid_cents: number; artist_cut_cents: number; refunded: boolean }>(
      `SELECT l.id, t.title AS track_title, l.tier, l.purchased_at, l.price_paid_cents, l.artist_cut_cents,
              EXISTS (SELECT 1 FROM license_events e WHERE e.license_id = l.id AND e.type = 'refunded') AS refunded
         FROM purchased_licenses l JOIN tracks t ON t.id = l.track_id
        WHERE l.artist_id = $1 ORDER BY l.purchased_at DESC LIMIT 200`,
      [user.id]
    )
  ]);
  return { totals: totals[0]!, by_track: byTrack, sales };
}
