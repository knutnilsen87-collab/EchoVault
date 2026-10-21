import { REVIEWER_ROLES } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { assertUuid, ok, route } from "@/server/http";
import { retryAnalysis } from "@/server/services/analysis";

export const POST = route<{ trackId: string }>(async (request, ctx) => {
  const user = await requireUser(request, REVIEWER_ROLES);
  const trackId = assertUuid(ctx.params.trackId, "track");
  await retryAnalysis(user.id, trackId, ctx.requestId);
  return ok({ id: trackId, status: "analysis_pending" }, ctx);
});
