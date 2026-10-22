import { REVIEWER_ROLES } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { ok, route } from "@/server/http";
import { reviewQueue } from "@/server/services/review";

export const GET = route(async (request, ctx) => {
  await requireUser(request, REVIEWER_ROLES);
  return ok({ tracks: await reviewQueue() }, ctx);
});
