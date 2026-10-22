import { REVIEWER_ROLES } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { assertUuid, route } from "@/server/http";
import { reviewerAudioUrl } from "@/server/services/catalog";

export const GET = route<{ trackId: string }>(async (request, ctx) => {
  await requireUser(request, REVIEWER_ROLES);
  const url = await reviewerAudioUrl(assertUuid(ctx.params.trackId, "track"));
  return new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store" } });
});
