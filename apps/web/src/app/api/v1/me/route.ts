import { updateProfileSchema } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { ok, parseJson, route } from "@/server/http";
import { getProfile, updateProfile } from "@/server/services/account";

export const GET = route(async (request, ctx) => ok({ profile: await getProfile(await requireUser(request)) }, ctx));

export const PATCH = route(async (request, ctx) => {
  const user = await requireUser(request);
  const input = await parseJson(request, updateProfileSchema);
  return ok({ profile: await updateProfile(user, input, ctx.requestId) }, ctx);
});
