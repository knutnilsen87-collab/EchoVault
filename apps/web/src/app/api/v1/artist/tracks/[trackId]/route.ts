import { createTrackDraftSchema } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { assertUuid, ok, parseJson, route } from "@/server/http";
import { getArtistTrack, updateDraft } from "@/server/services/artist";

export const GET = route<{ trackId: string }>(async (request, ctx) =>
  ok(await getArtistTrack(await requireUser(request, ["artist"]), assertUuid(ctx.params.trackId, "track")), ctx)
);

export const PATCH = route<{ trackId: string }>(async (request, ctx) => {
  const user = await requireUser(request, ["artist"]);
  const input = await parseJson(request, createTrackDraftSchema.partial());
  return ok({ track: await updateDraft(user, assertUuid(ctx.params.trackId, "track"), input, ctx.requestId) }, ctx);
});
