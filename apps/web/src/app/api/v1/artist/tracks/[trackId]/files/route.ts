import { requireUser } from "@/server/auth";
import { AppError } from "@/server/errors";
import { assertUuid, ok, route } from "@/server/http";
import { MAX_WAV_BYTES, uploadTrackFile } from "@/server/services/artist";

export const runtime = "nodejs";

/** multipart/form-data: kind=high_res_wav|artwork_image, file=<binary>. Stored privately. */
export const POST = route<{ trackId: string }>(async (request, ctx) => {
  const user = await requireUser(request, ["artist"]);
  const trackId = assertUuid(ctx.params.trackId, "track");
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_WAV_BYTES + 1024 * 1024) throw new AppError("VALIDATION_ERROR", "Upload is too large.");
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Expected multipart/form-data with a file field.");
  }
  const kind = form.get("kind");
  const file = form.get("file");
  if (kind !== "high_res_wav" && kind !== "artwork_image") throw new AppError("VALIDATION_ERROR", "kind must be high_res_wav or artwork_image.");
  if (!(file instanceof File)) throw new AppError("VALIDATION_ERROR", "file is required.");
  const result = await uploadTrackFile(
    user,
    trackId,
    { kind, bytes: new Uint8Array(await file.arrayBuffer()), filename: file.name || "upload", mimeType: file.type || "application/octet-stream" },
    ctx.requestId
  );
  return ok({ file: result }, ctx, 201);
});
