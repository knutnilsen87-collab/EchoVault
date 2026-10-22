import { requireUser } from "@/server/auth";
import { ok, route } from "@/server/http";
import { listUsers } from "@/server/services/admin";

export const GET = route(async (request, ctx) => {
  await requireUser(request, ["admin"]);
  const sp = new URL(request.url).searchParams;
  return ok({ users: await listUsers({ q: sp.get("q")?.slice(0, 100) || undefined, role: sp.get("role") || undefined }) }, ctx);
});
