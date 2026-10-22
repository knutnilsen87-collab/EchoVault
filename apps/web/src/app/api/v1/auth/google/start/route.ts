import { googleEnabled } from "@/server/env";
import { startFlow } from "@/server/google";

export const dynamic = "force-dynamic";

/** GET /api/v1/auth/google/start?role=buyer|artist&next=/path → redirect to Google. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!googleEnabled()) {
    return Response.redirect(new URL("/login?error=google_not_configured", url), 302);
  }
  const { url: googleUrl, cookie } = startFlow({ role: url.searchParams.get("role"), next: url.searchParams.get("next") });
  return new Response(null, { status: 302, headers: { location: googleUrl, "set-cookie": cookie, "cache-control": "no-store" } });
}
