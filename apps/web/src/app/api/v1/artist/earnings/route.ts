import { requireUser } from "@/server/auth";
import { ok, route } from "@/server/http";
import { artistEarnings } from "@/server/services/earnings";

export const GET = route(async (request, ctx) => ok(await artistEarnings(await requireUser(request, ["artist"])), ctx));
