import { requireUser } from "@/server/auth";
import { assertUuid, route } from "@/server/http";
import { certificateDownloadUrl } from "@/server/services/licenses";

export const GET = route<{ licenseId: string }>(async (request, ctx) => {
  const url = await certificateDownloadUrl(await requireUser(request), assertUuid(ctx.params.licenseId, "license"));
  return new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store" } });
});
