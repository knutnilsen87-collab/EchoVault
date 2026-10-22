import { updateDisputeSchema } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { assertUuid, ok, parseJson, route } from "@/server/http";
import { disputeDetail, updateDispute } from "@/server/services/admin";

const ROLES = ["support", "reviewer"] as const;

export const GET = route<{ disputeId: string }>(async (request, ctx) => {
  await requireUser(request, ROLES);
  return ok(await disputeDetail(assertUuid(ctx.params.disputeId, "dispute")), ctx);
});

export const PATCH = route<{ disputeId: string }>(async (request, ctx) => {
  const user = await requireUser(request, ROLES);
  const input = await parseJson(request, updateDisputeSchema);
  return ok(await updateDispute(user, assertUuid(ctx.params.disputeId, "dispute"), input, ctx.requestId), ctx);
});
