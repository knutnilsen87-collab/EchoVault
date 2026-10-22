import type { LicenseTier } from "./status";

/**
 * MVP prices from docs/package/02_Product/EchoVault_Licensing_Model.md.
 * The DB (license_terms_versions.price_cents) is the runtime source of truth;
 * these defaults seed the first terms versions and are asserted in tests.
 * NOTE: pricing is unvalidated (Open Question Q-002).
 */
export const DEFAULT_TIER_PRICE_CENTS: Record<LicenseTier, number> = {
  creator: 1900,
  pro: 4900,
  agency: 19900
};

/** Suggested default split (Marketplace_Ecosystem_Notes): 70% artist / 30% platform. */
export const DEFAULT_ARTIST_SHARE_BPS = 7000;

export function splitRevenueCents(totalCents: number, artistShareBps: number): { artistCents: number; platformCents: number } {
  if (!Number.isInteger(totalCents) || totalCents < 0) throw new Error("INVALID_AMOUNT");
  if (!Number.isInteger(artistShareBps) || artistShareBps < 0 || artistShareBps > 10_000) throw new Error("INVALID_SPLIT");
  // Round artist share down so the platform never pays out more than collected.
  const artistCents = Math.floor((totalCents * artistShareBps) / 10_000);
  return { artistCents, platformCents: totalCents - artistCents };
}

export function formatEur(cents: number): string {
  const euros = cents / 100;
  return `€${Number.isInteger(euros) ? euros.toFixed(0) : euros.toFixed(2)}`;
}

export const TIER_LABELS: Record<LicenseTier, { name: string; buyer: string; allowed: string; limits: string }> = {
  creator: {
    name: "Creator",
    buyer: "Individual creator",
    allowed: "1 monetized YouTube/Twitch/social channel or 1 creator brand",
    limits: "No resale, no stock redistribution, no Content ID registration"
  },
  pro: {
    name: "Pro",
    buyer: "Freelancer / small studio",
    allowed: "Up to 5 client projects or channels",
    limits: "No standalone music distribution, no resale, no Content ID"
  },
  agency: {
    name: "Agency",
    buyer: "Agency / SMB team",
    allowed: "Commercial use across campaigns for one client/brand",
    limits: "No resale as music library, no Content ID, no transfer outside licensed client/brand"
  }
};
