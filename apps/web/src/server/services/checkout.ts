import { createHash } from "node:crypto";
import { assertTrackCanBeLicensed, TIER_LABELS, type CheckoutSessionInput, type TrackStatus } from "@echovault/domain";
import { writeAudit } from "../audit";
import type { SessionUser } from "../auth";
import { pool, query, queryOne } from "../db";
import { env } from "../env";
import { AppError } from "../errors";
import { createCheckoutSession } from "../payments";

const SESSION_TTL_MS = 60 * 60 * 1000; // Stripe minimum is 30 min

/**
 * Persists a payment_sessions row *before* talking to Stripe, then attaches the Stripe session.
 * No license is ever granted here — only the verified webhook does that.
 * Repeated clicks with identical input reuse the open session (idempotency_key).
 */
export async function startCheckout(user: SessionUser, input: CheckoutSessionInput, requestId: string) {
  if (!input.termsAccepted) throw new AppError("TERMS_NOT_ACCEPTED", "License terms must be accepted before checkout.");

  const track = await queryOne<{ id: string; title: string; status: TrackStatus; artist_id: string }>(
    "SELECT id, title, status, artist_id FROM tracks WHERE id = $1",
    [input.trackId]
  );
  if (!track) throw new AppError("NOT_FOUND", "Track not found.");
  try {
    assertTrackCanBeLicensed(track.status);
  } catch {
    throw new AppError("TRACK_NOT_APPROVED", "This track is not available for licensing.");
  }
  if (track.artist_id === user.id) throw new AppError("FORBIDDEN", "Artists cannot license their own tracks.");

  const terms = await queryOne<{ id: string; version: string; price_cents: number; currency: string }>(
    "SELECT id, version, price_cents, currency FROM license_terms_versions WHERE tier = $1 AND active",
    [input.tier]
  );
  if (!terms) throw new AppError("SERVICE_UNAVAILABLE", "No active license terms for this tier.");

  const idempotencyKey = createHash("sha256")
    .update([user.id, track.id, input.tier, terms.id, input.whitelistedUrl ?? "", input.projectOrClientName ?? ""].join("|"))
    .digest("hex");

  const existing = await queryOne<{ id: string; stripe_session_id: string; checkout_url: string; expires_at: string }>(
    `SELECT id, stripe_session_id, checkout_url, expires_at FROM payment_sessions
      WHERE idempotency_key = $1 AND status = 'created' AND checkout_url IS NOT NULL AND expires_at > now() + interval '5 minutes'`,
    [idempotencyKey]
  );
  if (existing) {
    return { payment_session_id: existing.id, checkout_url: existing.checkout_url, stripe_session_id: existing.stripe_session_id, reused: true };
  }
  // An older, expired/failed attempt with the same key must not block a new one.
  await query("UPDATE payment_sessions SET idempotency_key = NULL, status = CASE WHEN status = 'created' THEN 'expired' ELSE status END WHERE idempotency_key = $1", [idempotencyKey]);

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const paymentSessionId = crypto.randomUUID();
  await query(
    `INSERT INTO payment_sessions (id, buyer_id, track_id, tier, terms_version_id, stripe_session_id, status, idempotency_key,
            amount_cents, currency, whitelisted_url, project_or_client_name, expires_at, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, 'created', $7, $8, $9, $10, $11, $12, $13)`,
    [
      paymentSessionId,
      user.id,
      track.id,
      input.tier,
      terms.id,
      `pending_${paymentSessionId}`,
      idempotencyKey,
      terms.price_cents,
      terms.currency,
      input.whitelistedUrl ?? null,
      input.projectOrClientName ?? null,
      expiresAt,
      JSON.stringify({ request_id: requestId })
    ]
  );

  const metadata = {
    payment_session_id: paymentSessionId,
    track_id: track.id,
    buyer_id: user.id,
    tier: input.tier,
    terms_version_id: terms.id,
    terms_version: terms.version
  };
  const appUrl = env().NEXT_PUBLIC_APP_URL;
  let session;
  try {
    session = await createCheckoutSession({
      paymentSessionId,
      amountCents: terms.price_cents,
      currency: terms.currency,
      productName: `${track.title} — EchoVault ${TIER_LABELS[input.tier].name} license`,
      buyerEmail: user.email,
      metadata,
      successUrl: `${appUrl}/checkout/success?ps=${paymentSessionId}`,
      cancelUrl: `${appUrl}/tracks/${track.id}?checkout=cancelled`,
      expiresAt
    });
  } catch (error) {
    await query("UPDATE payment_sessions SET status = 'failed', idempotency_key = NULL, updated_at = now() WHERE id = $1", [paymentSessionId]);
    throw new AppError("SERVICE_UNAVAILABLE", "Payment provider unavailable. Please try again.", { reason: (error as Error).message });
  }

  await query("UPDATE payment_sessions SET stripe_session_id = $2, checkout_url = $3, updated_at = now() WHERE id = $1", [paymentSessionId, session.id, session.url]);
  await writeAudit(pool(), {
    actorUserId: user.id,
    entityType: "payment_session",
    entityId: paymentSessionId,
    action: "checkout.session_created",
    metadata: { track_id: track.id, tier: input.tier, terms_version: terms.version, amount_cents: terms.price_cents },
    requestId
  });
  return { payment_session_id: paymentSessionId, checkout_url: session.url, stripe_session_id: session.id, reused: false };
}

export async function paymentSessionStatus(user: SessionUser, paymentSessionId: string) {
  const row = await queryOne<{ id: string; status: string; track_id: string; tier: string; license_id: string | null }>(
    `SELECT p.id, p.status, p.track_id, p.tier, l.id AS license_id
       FROM payment_sessions p LEFT JOIN purchased_licenses l ON l.payment_session_id = p.id
      WHERE p.id = $1 AND (p.buyer_id = $2 OR $3)`,
    [paymentSessionId, user.id, user.role === "admin"]
  );
  if (!row) throw new AppError("NOT_FOUND", "Checkout not found.");
  return row;
}
