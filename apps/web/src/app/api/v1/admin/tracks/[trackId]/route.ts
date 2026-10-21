import { REVIEWER_ROLES } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { assertUuid, ok, route } from "@/server/http";
import { reviewDetail } from "@/server/services/review";

export const GET = route<{ trackId: string }>(async (request, ctx) => {
  await requireUser(request, REVIEWER_ROLES);
  return ok(await reviewDetail(assertUuid(ctx.params.trackId, "track")), ctx);
});
