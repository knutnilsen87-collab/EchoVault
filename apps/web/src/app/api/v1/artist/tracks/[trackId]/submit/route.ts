import { requireUser } from "@/server/auth";
import { assertUuid, ok, route } from "@/server/http";
import { submitTrack } from "@/server/services/artist";

export const POST = route<{ trackId: string }>(async (request, ctx) =>
  ok(await submitTrack(await requireUser(request, ["artist"]), assertUuid(ctx.params.trackId, "track"), ctx.requestId), ctx)
);
