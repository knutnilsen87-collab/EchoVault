import { requireUser } from "@/server/auth";
import { assertUuid, route } from "@/server/http";
import { disputeEvidencePack } from "@/server/services/admin";

/** Downloads the evidence pack as a JSON file (audited). */
export const GET = route<{ disputeId: string }>(async (request, ctx) => {
  const user = await requireUser(request, ["support", "reviewer"]);
  const id = assertUuid(ctx.params.disputeId, "dispute");
  const pack = await disputeEvidencePack(user, id, ctx.requestId);
  return new Response(JSON.stringify(pack, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="echovault-evidence-${id.slice(0, 8)}.json"`,
      "cache-control": "private, no-store"
    }
  });
});
