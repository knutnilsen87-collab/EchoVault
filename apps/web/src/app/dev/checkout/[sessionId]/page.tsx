import { notFound } from "next/navigation";
import { formatEur } from "@echovault/domain";
import { StubPayButton } from "@/components/forms/stub-pay-button";
import { Panel } from "@/components/ui/primitives";
import { pageUser } from "@/lib/session";
import { queryOne } from "@/server/db";
import { stubCheckoutEnabled } from "@/server/env";

export const dynamic = "force-dynamic";

/** Stand-in for the Stripe-hosted checkout page in stub mode. Unreachable in live mode / production. */
export default async function DevCheckoutPage({ params }: { params: Promise<{ sessionId: string }> }) {
  if (!stubCheckoutEnabled()) notFound();
  const { sessionId } = await params;
  const user = await pageUser(undefined, `/dev/checkout/${sessionId}`);
  const ps = await queryOne<{ id: string; amount_cents: number; tier: string; title: string; track_id: string }>(
    "SELECT p.id, p.amount_cents, p.tier, t.title, p.track_id FROM payment_sessions p JOIN tracks t ON t.id = p.track_id WHERE p.stripe_session_id = $1 AND p.buyer_id = $2",
    [sessionId, user.id]
  );
  if (!ps) notFound();
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="mb-4 rounded-md border border-amber-400/40 px-3 py-2 font-mono text-xs text-amber-200">STUB MODE — no real payment. This page simulates Stripe Checkout.</p>
      <Panel title="Test checkout">
        <p className="text-lg font-medium">{ps.title}</p>
        <p className="mt-1 font-mono text-sm text-echo-muted">
          {ps.tier.toUpperCase()} · {formatEur(ps.amount_cents)}
        </p>
        <div className="mt-6">
          <StubPayButton stripeSessionId={sessionId} paymentSessionId={ps.id} cancelHref={`/tracks/${ps.track_id}?checkout=cancelled`} />
        </div>
      </Panel>
    </main>
  );
}
