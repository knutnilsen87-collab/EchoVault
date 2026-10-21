import { assertUuid, route } from "@/server/http";
import { previewUrl } from "@/server/services/catalog";

// Redirects to a short-lived signed MP3 URL. Suspended/unapproved tracks 404 here.
export const GET = route<{ trackId: string }>(async (_req, ctx) => {
  const url = await previewUrl(assertUuid(ctx.params.trackId, "track"));
  return new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store" } });
});
