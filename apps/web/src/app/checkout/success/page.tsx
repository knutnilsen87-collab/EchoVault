import { CheckoutStatus } from "@/components/forms/checkout-status";
import { pageUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payment received" };

/** Never fulfills anything: it only waits for the webhook to have done so. */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ ps?: string }> }) {
  const { ps } = await searchParams;
  await pageUser(undefined, `/checkout/success?ps=${ps ?? ""}`);
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold">Payment received</h1>
      <div className="mt-6">{ps ? <CheckoutStatus paymentSessionId={ps} /> : <p className="text-echo-muted">Missing checkout reference.</p>}</div>
    </main>
  );
}
