import Link from "next/link";
import { formatEur, LICENSE_TIERS, TIER_LABELS } from "@echovault/domain";
import { Panel } from "@/components/ui/primitives";
import { getActiveTerms } from "@/server/services/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pricing & licenses" };

const INCLUDED = ["High-res WAV download", "PDF license certificate", "Public verification page", "Terms version frozen at purchase", "Claim support from your license page"];

export default async function PricingPage() {
  const terms = await getActiveTerms();
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <section className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-echo-muted">Pricing</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">One track, one payment, one certificate.</h1>
        <p className="mt-4 leading-7 text-echo-muted">
          Licenses are one-off and per track. Pick the tier that matches where the music will be used. Every license is stored with the exact terms
          version you accepted, so your rights never change after purchase.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {LICENSE_TIERS.map((tier) => {
          const t = terms.find((x) => x.tier === tier);
          const label = TIER_LABELS[tier];
          return (
            <Panel key={tier} className={tier === "pro" ? "border-white/30" : ""}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-semibold">{label.name}</h2>
                <span className="font-mono text-2xl">{t ? formatEur(t.price_cents) : "—"}</span>
              </div>
              <p className="mt-1 text-sm text-echo-muted">{label.buyer}</p>
              <p className="mt-5 text-sm font-medium">Allowed</p>
              <p className="mt-1 text-sm">{label.allowed}</p>
              <p className="mt-4 text-sm font-medium">Not allowed</p>
              <p className="mt-1 text-sm text-echo-muted">{label.limits}</p>
              <ul className="mt-5 space-y-1.5 border-t border-echo-border pt-4 text-sm text-neutral-300">
                {INCLUDED.map((i) => (
                  <li key={i}>✓ {i}</li>
                ))}
              </ul>
              {t ? <p className="mt-4 font-mono text-[11px] text-echo-muted">TERMS v{t.version}</p> : null}
            </Panel>
          );
        })}
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        {[
          ["Which tier do I need?", "Creator covers one channel or creator brand. Pro covers up to five client projects or channels. Agency covers commercial campaigns for one client or brand, including paid ads."],
          ["Can I register the track with Content ID?", "No. No tier allows registering the music with Content ID or other fingerprinting services — that would block other licensees."],
          ["What does the certificate prove?", "That EchoVault granted you this license on this date under this terms version. It is not a guarantee that third parties will never assert claims; if one comes up, report it from your license page."],
          ["Is it a subscription?", "No. You pay once per track and tier. There are no recurring charges."]
        ].map(([q, a]) => (
          <div key={q}>
            <h3 className="font-medium">{q}</h3>
            <p className="mt-2 text-sm leading-6 text-echo-muted">{a}</p>
          </div>
        ))}
      </section>

      <p className="text-sm text-echo-muted">
        Full terms per tier: <Link href="/legal/terms" className="text-white underline">License terms</Link>. Ready?{" "}
        <Link href="/" className="text-white underline">Browse the catalog</Link>.
      </p>
    </main>
  );
}
