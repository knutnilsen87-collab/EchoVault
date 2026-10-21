import { checkoutSessionSchema, type UserRole } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { ok, parseJson, route } from "@/server/http";
import { startCheckout } from "@/server/services/checkout";

const BUYER_ROLES: UserRole[] = ["buyer", "artist"];

// Idempotency: identical (buyer, track, tier, terms, scope) reuses the open session.
// Rollback: no license exists until the verified webhook fulfills it.
export const POST = route(async (request, ctx) => {
  const user = await requireUser(request, BUYER_ROLES);
  const input = await parseJson(request, checkoutSessionSchema);
  const session = await startCheckout(
    user,
    {
      trackId: input.track_id,
      tier: input.tier,
      termsAccepted: input.terms_accepted,
      whitelistedUrl: input.whitelisted_url ?? null,
      projectOrClientName: input.project_or_client_name ?? null
    },
    ctx.requestId
  );
  return ok(session, ctx);
});
