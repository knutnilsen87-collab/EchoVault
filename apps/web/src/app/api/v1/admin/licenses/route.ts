import { requireUser } from "@/server/auth";
import { ok, route } from "@/server/http";
import { adminLicenses } from "@/server/services/admin";

export const GET = route(async (request, ctx) => {
  await requireUser(request, ["support", "finance"]);
  return ok(await adminLicenses({ q: new URL(request.url).searchParams.get("q")?.slice(0, 100) || undefined }), ctx);
});
