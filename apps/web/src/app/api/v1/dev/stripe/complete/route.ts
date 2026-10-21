import { z } from "zod";
import { requireUser } from "@/server/auth";
import { queryOne } from "@/server/db";
import { stubCheckoutEnabled } from "@/server/env";
import { AppError } from "@/server/errors";
import { ok, parseJson, route } from "@/server/http";
import { buildSignedStubEvent } from "@/server/payments";
import { handleStripeWebhook } from "@/server/services/fulfillment";
import { processJobNow } from "@/server/worker";

/**
 * STUB MODE ONLY. Plays the role of Stripe: signs a checkout.session.completed event
 * with STRIPE_WEBHOOK_SECRET and runs it through the real webhook handler, so signature
 * verification and fulfillment are exercised end to end.
 */
export const POST = route(async (request, ctx) => {
  if (!stubCheckoutEnabled()) throw new AppError("NOT_FOUND", "Not found.");
  const user = await requireUser(request);
  const { stripe_session_id } = await parseJson(request, z.object({ stripe_session_id: z.string().startsWith("cs_stub_") }));
  const ps = await queryOne<{ amount_cents: number; currency: string; id: string; track_id: string; buyer_id: string; tier: string; terms_version_id: string }>(
    "SELECT id, amount_cents, currency, track_id, buyer_id, tier, terms_version_id FROM payment_sessions WHERE stripe_session_id = $1 AND buyer_id = $2",
    [stripe_session_id, user.id]
  );
  if (!ps) throw new AppError("NOT_FOUND", "Checkout session not found.");
  const { payload, signature } = buildSignedStubEvent({
    id: stripe_session_id,
    amountCents: ps.amount_cents,
    currency: ps.currency,
    metadata: { payment_session_id: ps.id, track_id: ps.track_id, buyer_id: ps.buyer_id, tier: ps.tier, terms_version_id: ps.terms_version_id }
  });
  // Same function the webhook route calls — including signature verification.
  const result = await handleStripeWebhook(payload, signature, ctx.requestId);
  if (result.outcome === "license_created") await processJobNow(result.certificate_job_id).catch(() => undefined);
  return ok({ webhook: result, payment_session_id: ps.id }, ctx);
});
