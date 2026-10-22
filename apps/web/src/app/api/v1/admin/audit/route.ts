import { requireUser } from "@/server/auth";
import { ok, route } from "@/server/http";
import { auditLog } from "@/server/services/admin";

export const GET = route(async (request, ctx) => {
  await requireUser(request, ["support"]);
  const sp = new URL(request.url).searchParams;
  return ok(await auditLog({ entityType: sp.get("entity_type") || undefined, action: sp.get("action") || undefined, before: sp.get("before") || undefined }), ctx);
});
