import { ok, route } from "@/server/http";
import { logEvent } from "@/server/logger";
import { handleStripeWebhook } from "@/server/services/fulfillment";
import { processJobNow } from "@/server/worker";

export const dynamic = "force-dynamic";

export const POST = route(async (request, ctx) => {
  const rawBody = await request.text(); // raw body is required for signature verification
  const result = await handleStripeWebhook(rawBody, request.headers.get("stripe-signature"), ctx.requestId);
  if (result.outcome === "license_created") {
    // Best effort: issue the certificate immediately. The queued job remains the retry path.
    await processJobNow(result.certificate_job_id).catch((error) =>
      logEvent({ level: "warn", event: "inline_certificate_failed", requestId: ctx.requestId, details: { error: (error as Error).message } })
    );
  }
  return ok({ received: true, ...result }, ctx);
});
