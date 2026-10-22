import { getSessionUser } from "@/server/auth";
import { assertUuid, route } from "@/server/http";
import { trackArtwork } from "@/server/services/catalog";

/** Cover art. Public + cacheable for approved tracks; private (owner/reviewer) otherwise. */
export const GET = route<{ trackId: string }>(async (request, ctx) => {
  const art = await trackArtwork(assertUuid(ctx.params.trackId, "track"), await getSessionUser(request));
  if (request.headers.get("if-none-match") === art.etag) return new Response(null, { status: 304, headers: { etag: art.etag } });
  return new Response(new Blob([art.bytes as BlobPart]), {
    headers: {
      "content-type": art.mimeType,
      etag: art.etag,
      "cache-control": art.isPublic ? "public, max-age=3600" : "private, no-store",
      "x-content-type-options": "nosniff"
    }
  });
});
