import { z } from "zod";
import { requireUser } from "@/server/auth";
import { assertUuid, ok, parseJson, route } from "@/server/http";
import { reinstateTrack } from "@/server/services/review";

export const POST = route<{ trackId: string }>(async (request, ctx) => {
  const user = await requireUser(request, ["admin"]);
  const { notes } = await parseJson(request, z.object({ notes: z.string().trim().min(10).max(2000) }));
  return ok(await reinstateTrack(user, assertUuid(ctx.params.trackId, "track"), notes, ctx.requestId), ctx);
});
