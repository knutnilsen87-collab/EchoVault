import { disputeSchema } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { ok, parseJson, route } from "@/server/http";
import { openDispute } from "@/server/services/disputes";

export const POST = route(async (request, ctx) => {
  const user = await requireUser(request);
  const input = await parseJson(request, disputeSchema);
  return ok(await openDispute(user, input, ctx.requestId), ctx, 201);
});
