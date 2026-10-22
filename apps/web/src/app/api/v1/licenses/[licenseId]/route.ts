import { requireUser } from "@/server/auth";
import { assertUuid, ok, route } from "@/server/http";
import { getLicense } from "@/server/services/licenses";

export const GET = route<{ licenseId: string }>(async (request, ctx) =>
  ok(await getLicense(await requireUser(request), assertUuid(ctx.params.licenseId, "license")), ctx)
);
