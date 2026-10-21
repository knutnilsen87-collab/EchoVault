import type Stripe from "stripe";
import { splitRevenueCents } from "@echovault/domain";
import { writeAudit } from "../audit";
import { withTransaction } from "../db";
import { AppError } from "../errors";
import { enqueueJob } from "../jobs";
import { logEvent } from "../logger";
import { verifyWebhook } from "../payments";

export type WebhookOutcome =
  | { outcome: "duplicate_event" }
  | { outcome: "ignored"; type: string }
  | { outcome: "license_created"; license_id: string; certificate_job_id: string }
  | { outcome: "already_fulfilled"; license_id: string | null }
  | { outcome: "unknown_session" | "amount_mismatch" | "not_paid" | "session_expired" };

/**
 * The only path that grants a license (BR-006, guardrail #5).
 * Event-level idempotency: stripe_events primary key.
 * Session-level idempotency: purchased_licenses.stripe_session_id UNIQUE.
 * Both are taken inside one transaction, so concurrent retries serialize on the unique index.
 */
export async function handleStripeWebhook(rawBody: string, signature: string | null, requestId: string): Promise<WebhookOutcome> {
  let event: Stripe.Event;
  try {
    event = verifyWebhook(rawBody, signature);
  } catch {
    logEvent({ level: "warn", event: "stripe_webhook_signature_invalid", requestId });
    throw new AppError("WEBHOOK_SIGNATURE_INVALID", "Invalid Stripe signature.");
  }

  const result = await withTransaction(async (tx): Promise<WebhookOutcome> => {
    const inserted = await tx.query("INSERT INTO stripe_events (event_id, type) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING event_id", [event.id, event.type]);
    if (inserted.rowCount === 0) return { outcome: "duplicate_event" };

    const finish = async (o: WebhookOutcome) => {
      await tx.query("UPDATE stripe_events SET processed_at = now(), outcome = $2 WHERE event_id = $1", [event.id, o.outcome]);
      return o;
    };

    if (event.type === "checkout.session.expired") {
      const s = event.data.object as Stripe.Checkout.Session;
      await tx.query("UPDATE payment_sessions SET status = 'expired', idempotency_key = NULL, updated_at = now() WHERE stripe_session_id = $1 AND status = 'created'", [s.id]);
      return finish({ outcome: "session_expired" });
    }
    if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
      return finish({ outcome: "ignored", type: event.type });
    }

    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status !== "paid") return finish({ outcome: "not_paid" }); // async methods arrive later as async_payment_succeeded

    const ps = await tx.query<{
      id: string;
      buyer_id: string;
      track_id: string;
      tier: string;
      terms_version_id: string;
      amount_cents: number;
      currency: string;
      whitelisted_url: string | null;
      project_or_client_name: string | null;
    }>("SELECT * FROM payment_sessions WHERE stripe_session_id = $1 FOR UPDATE", [s.id]);
    const session = ps.rows[0];
    if (!session) {
      logEvent({ level: "error", event: "stripe_webhook_unknown_session", requestId, details: { stripe_session_id: s.id } });
      return finish({ outcome: "unknown_session" });
    }
    if (s.amount_total !== session.amount_cents || (s.currency ?? "").toUpperCase() !== session.currency) {
      logEvent({ level: "error", event: "stripe_webhook_amount_mismatch", requestId, details: { expected: session.amount_cents, got: s.amount_total } });
      return finish({ outcome: "amount_mismatch" });
    }

    const terms = await tx.query<{ id: string; tier: string; version: string; title: string; terms_md: string; artist_share_bps: number }>(
      "SELECT id, tier, version, title, terms_md, artist_share_bps FROM license_terms_versions WHERE id = $1",
      [session.terms_version_id]
    );
    const t = terms.rows[0]!;
    const track = await tx.query<{ artist_id: string; status: string }>("SELECT artist_id, status FROM tracks WHERE id = $1", [session.track_id]);
    const { artistCents, platformCents } = splitRevenueCents(session.amount_cents, t.artist_share_bps);
    const paymentIntent = typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null);

    const license = await tx.query<{ id: string }>(
      `INSERT INTO purchased_licenses (track_id, buyer_id, artist_id, tier, terms_version_id, price_paid_eur, currency, whitelisted_url,
              project_or_client_name, stripe_session_id, stripe_payment_intent_id, artist_cut_eur, platform_cut_eur, status,
              price_paid_cents, artist_cut_cents, platform_cut_cents, payment_session_id, terms_snapshot)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'paid',$14,$15,$16,$17,$18)
       ON CONFLICT (stripe_session_id) DO NOTHING RETURNING id`,
      [
        session.track_id,
        session.buyer_id,
        track.rows[0]!.artist_id,
        session.tier,
        session.terms_version_id,
        session.amount_cents / 100,
        session.currency,
        session.whitelisted_url,
        session.project_or_client_name,
        s.id,
        paymentIntent,
        artistCents / 100,
        platformCents / 100,
        session.amount_cents,
        artistCents,
        platformCents,
        session.id,
        JSON.stringify({ tier: t.tier, version: t.version, title: t.title, terms_md: t.terms_md, artist_share_bps: t.artist_share_bps })
      ]
    );
    if (license.rowCount === 0) {
      const existing = await tx.query<{ id: string }>("SELECT id FROM purchased_licenses WHERE stripe_session_id = $1", [s.id]);
      return finish({ outcome: "already_fulfilled", license_id: existing.rows[0]?.id ?? null });
    }
    const licenseId = license.rows[0]!.id;

    await tx.query("INSERT INTO license_events (license_id, type, metadata) VALUES ($1, 'paid', $2)", [
      licenseId,
      JSON.stringify({ stripe_event_id: event.id, track_status_at_payment: track.rows[0]!.status })
    ]);
    await tx.query("UPDATE payment_sessions SET status = 'completed', updated_at = now() WHERE id = $1", [session.id]);
    const jobId = await enqueueJob(tx, "generate_certificate", { license_id: licenseId }, { dedupeKey: `certificate:${licenseId}`, maxAttempts: 5 });
    await writeAudit(tx, {
      actorUserId: null,
      entityType: "purchased_license",
      entityId: licenseId,
      action: "license.created",
      metadata: { stripe_event_id: event.id, stripe_session_id: s.id, amount_cents: session.amount_cents, tier: session.tier },
      requestId
    });
    if (track.rows[0]!.status !== "approved" && track.rows[0]!.status !== "live") {
      logEvent({ level: "warn", event: "license_created_for_unavailable_track", requestId, details: { licenseId, status: track.rows[0]!.status } });
    }
    return finish({ outcome: "license_created", license_id: licenseId, certificate_job_id: jobId });
  });

  logEvent({ level: "info", event: "stripe_webhook_processed", requestId, details: { type: event.type, ...result } });
  return result;
}
