import { setRoleSchema } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { assertUuid, ok, parseJson, route } from "@/server/http";
import { setUserRole } from "@/server/services/admin";

export const POST = route<{ userId: string }>(async (request, ctx) => {
  const actor = await requireUser(request, ["admin"]);
  const { role } = await parseJson(request, setRoleSchema);
  return ok(await setUserRole(actor, assertUuid(ctx.params.userId, "user"), role, ctx.requestId), ctx);
});
