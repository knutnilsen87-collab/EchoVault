import { ok, route } from "@/server/http";
import { getActiveTerms, listPublicTracks } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export const GET = route(async (request, ctx) => {
  const url = new URL(request.url);
  const num = (k: string) => (url.searchParams.get(k) ? Number(url.searchParams.get(k)) || undefined : undefined);
  const tracks = await listPublicTracks({
    q: url.searchParams.get("q")?.slice(0, 100) || undefined,
    genre: url.searchParams.get("genre") || undefined,
    mood: url.searchParams.get("mood") || undefined,
    bpmMin: num("bpm_min"),
    bpmMax: num("bpm_max"),
    maxDurationSeconds: num("max_duration"),
    sort: (["newest", "bpm_asc", "bpm_desc", "shortest"] as const).find((x) => x === url.searchParams.get("sort"))
  });
  const terms = await getActiveTerms();
  return ok({ tracks, license_prices: terms.map((t) => ({ tier: t.tier, price_cents: t.price_cents, currency: t.currency, terms_version: t.version })) }, ctx);
});
