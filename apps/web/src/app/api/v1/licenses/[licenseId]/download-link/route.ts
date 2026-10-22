import { requireUser } from "@/server/auth";
import { assertUuid, ok, route } from "@/server/http";
import { createDownloadLink } from "@/server/services/licenses";

export const POST = route<{ licenseId: string }>(async (request, ctx) =>
  ok(await createDownloadLink(await requireUser(request), assertUuid(ctx.params.licenseId, "license"), ctx.requestId), ctx)
);
