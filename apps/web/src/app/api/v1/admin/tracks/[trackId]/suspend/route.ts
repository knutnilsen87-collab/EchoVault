import { REVIEWER_ROLES, suspendSchema } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { assertUuid, ok, parseJson, route } from "@/server/http";
import { suspendTrack } from "@/server/services/review";

// BR-010: blocks new purchases/previews; existing licenses and certificates stay intact.
export const POST = route<{ trackId: string }>(async (request, ctx) => {
  const user = await requireUser(request, REVIEWER_ROLES);
  const input = await parseJson(request, suspendSchema);
  return ok(await suspendTrack(user, assertUuid(ctx.params.trackId, "track"), input, ctx.requestId), ctx);
});
