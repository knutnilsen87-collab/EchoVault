import { requireUser } from "@/server/auth";
import { assertUuid, ok, route } from "@/server/http";
import { paymentSessionStatus } from "@/server/services/checkout";

export const GET = route<{ paymentSessionId: string }>(async (request, ctx) => {
  const user = await requireUser(request);
  return ok(await paymentSessionStatus(user, assertUuid(ctx.params.paymentSessionId, "checkout")), ctx);
});
