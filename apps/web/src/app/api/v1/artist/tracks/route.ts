import { createTrackDraftSchema } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { ok, parseJson, route } from "@/server/http";
import { createDraft, listArtistTracks } from "@/server/services/artist";

export const GET = route(async (request, ctx) => ok({ tracks: await listArtistTracks(await requireUser(request, ["artist"])) }, ctx));

export const POST = route(async (request, ctx) => {
  const user = await requireUser(request, ["artist"]);
  const input = await parseJson(request, createTrackDraftSchema);
  return ok({ track: await createDraft(user, input, ctx.requestId) }, ctx, 201);
});
