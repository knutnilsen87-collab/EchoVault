import { proofOfEffortSchema } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { assertUuid, ok, parseJson, route } from "@/server/http";
import { saveProofOfEffort } from "@/server/services/artist";

export const PUT = route<{ trackId: string }>(async (request, ctx) => {
  const user = await requireUser(request, ["artist"]);
  const input = await parseJson(request, proofOfEffortSchema);
  return ok(await saveProofOfEffort(user, assertUuid(ctx.params.trackId, "track"), input, ctx.requestId), ctx);
});
