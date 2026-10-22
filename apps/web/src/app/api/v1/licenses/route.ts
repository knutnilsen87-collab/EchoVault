import { requireUser } from "@/server/auth";
import { ok, route } from "@/server/http";
import { listBuyerLicenses } from "@/server/services/licenses";

export const GET = route(async (request, ctx) => ok({ licenses: await listBuyerLicenses(await requireUser(request)) }, ctx));
