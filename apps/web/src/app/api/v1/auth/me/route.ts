import { requireUser } from "@/server/auth";
import { ok, route } from "@/server/http";

export const GET = route(async (request, ctx) => ok({ user: await requireUser(request) }, ctx));
