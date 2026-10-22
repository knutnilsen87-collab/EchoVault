import { env } from "@/server/env";
import { AppError } from "@/server/errors";
import { route } from "@/server/http";
import { storage, verifyLocalSignature } from "@/server/storage";

/** Serves private files for the *local* storage driver only, after HMAC + expiry check. */
export const GET = route(async (request) => {
  if (env().STORAGE_DRIVER !== "local") throw new AppError("NOT_FOUND", "Not found.");
  const verified = verifyLocalSignature(new URL(request.url).searchParams);
  if (!verified) throw new AppError("FORBIDDEN", "Link is invalid or has expired.");
  const bytes = await (await storage()).get(verified.key).catch(() => {
    throw new AppError("NOT_FOUND", "File not found.");
  });
  const headers = new Headers({
    "content-type": verified.type || "application/octet-stream",
    "content-length": String(bytes.byteLength),
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
    "accept-ranges": "none"
  });
  if (verified.name) headers.set("content-disposition", `attachment; filename="${verified.name.replace(/"/g, "")}"`);
  return new Response(new Blob([bytes as BlobPart]), { status: 200, headers });
});
