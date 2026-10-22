import { assertUuid, ok, route } from "@/server/http";
import { verifyCertificate } from "@/server/services/licenses";

// Public: anyone holding the certificate can verify it. No buyer email is exposed.
export const GET = route<{ certificateId: string }>(async (_req, ctx) => ok(await verifyCertificate(assertUuid(ctx.params.certificateId, "certificate")), ctx));
