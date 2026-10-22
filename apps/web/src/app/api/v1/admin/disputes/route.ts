import { requireUser } from "@/server/auth";
import { ok, route } from "@/server/http";
import { listDisputes } from "@/server/services/disputes";

export const GET = route(async (request, ctx) => {
  await requireUser(request, ["support", "reviewer"]);
  return ok({ disputes: await listDisputes() }, ctx);
});
