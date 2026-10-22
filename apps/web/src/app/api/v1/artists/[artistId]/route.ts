import { assertUuid, ok, route } from "@/server/http";
import { artistProfile } from "@/server/services/catalog";

export const GET = route<{ artistId: string }>(async (_req, ctx) => ok(await artistProfile(assertUuid(ctx.params.artistId, "artist")), ctx));
