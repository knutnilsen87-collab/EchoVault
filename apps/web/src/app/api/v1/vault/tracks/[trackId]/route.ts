import { assertUuid, ok, route } from "@/server/http";
import { getPublicTrack } from "@/server/services/catalog";

export const GET = route<{ trackId: string }>(async (_req, ctx) => ok(await getPublicTrack(assertUuid(ctx.params.trackId, "track")), ctx));
