import { createTermsVersionSchema } from "@echovault/domain";
import { requireUser } from "@/server/auth";
import { ok, parseJson, route } from "@/server/http";
import { createTermsVersion, listTermsVersions } from "@/server/services/admin";

export const GET = route(async (request, ctx) => {
  await requireUser(request, ["admin"]);
  return ok({ versions: await listTermsVersions() }, ctx);
});

export const POST = route(async (request, ctx) => {
  const user = await requireUser(request, ["admin"]);
  const input = await parseJson(request, createTermsVersionSchema);
  return ok(await createTermsVersion(user, input, ctx.requestId), ctx, 201);
});
