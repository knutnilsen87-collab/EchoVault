import { REVIEWER_ROLES, reviewDecisionSchema } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { assertUuid, ok, parseJson, route } from "@/server/http";
import { rejectTrack } from "@/server/services/review";

// Audit log + append-only track_reviews row written in the same transaction.
export const POST = route<{ trackId: string }>(async (request, ctx) => {
  const user = await requireUser(request, REVIEWER_ROLES);
  const input = await parseJson(request, reviewDecisionSchema);
  return ok(await rejectTrack(user, assertUuid(ctx.params.trackId, "track"), input, ctx.requestId), ctx);
});
