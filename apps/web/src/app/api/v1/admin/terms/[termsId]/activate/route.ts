import { requireUser } from "@/server/auth";
import { assertUuid, ok, route } from "@/server/http";
import { activateTermsVersion } from "@/server/services/admin";

export const POST = route<{ termsId: string }>(async (request, ctx) => {
  const user = await requireUser(request, ["admin"]);
  return ok(await activateTermsVersion(user, assertUuid(ctx.params.termsId, "terms version"), ctx.requestId), ctx);
});
