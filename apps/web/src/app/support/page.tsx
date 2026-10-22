import Link from "next/link";
import { Panel } from "@/components/ui/primitives";

export const metadata = { title: "Support & FAQ" };

const FAQ: { section: string; items: [string, string][] }[] = [
  {
    section: "Buying",
    items: [
      ["Where are my files?", "Under My licenses. Each license has a download button for the high-res WAV (a fresh link that expires after 15 minutes) and the PDF certificate."],
      ["Payment went through but I don’t see the license", "Licenses are issued when Stripe confirms the payment, usually within seconds. You are never charged twice for a retry. If it is missing after a few minutes, contact support with your receipt."],
      ["Someone claimed my video", "Open the license under My licenses and use “Report a claim or problem”. Share the certificate’s verification link with the platform; our team gets your full license record."],
      ["Can a client verify my license?", "Yes. Every certificate has a public verification page showing the track, tier, terms version and status — without your email address."]
    ]
  },
  {
    section: "Selling",
    items: [
      ["What music is accepted?", "AI-assisted or hybrid tracks with a complete Proof of Effort: tools used, manual production work, sample provenance and a rights warranty. Tracks that intentionally imitate a named artist without cleared rights are not accepted."],
      ["What does EchoScore check?", "Technical quality only: loudness, true peak/clipping, bandwidth (low-passed “underwater” renders), spectral balance, silence and stereo phase. It is not a copyright check — a human reviewer approves every track."],
      ["How long does review take?", "Analysis takes about a minute; human review depends on the queue. You see the status and any requested changes on your track page."],
      ["How do I get paid?", "Your share (currently 70%) is recorded on every sale and shown under Earnings. Payouts are handled manually during the beta."]
    ]
  },
  {
    section: "Account",
    items: [
      ["Can I sign in with Google?", "Yes — on the sign-in or create-account page. If you already have an account with the same email, Google is linked to it."],
      ["How do I change my password or artist name?", "Go to Settings (click your email in the top bar)."]
    ]
  }
];

export default function SupportPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_320px]">
      <div className="space-y-10">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-echo-muted">Support</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">How can we help?</h1>
        </section>
        {FAQ.map((s) => (
          <section key={s.section} aria-labelledby={`faq-${s.section}`}>
            <h2 id={`faq-${s.section}`} className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-echo-muted">
              {s.section}
            </h2>
            <div className="divide-y divide-echo-border rounded-xl border border-echo-border">
              {s.items.map(([q, a]) => (
                <details key={q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-medium after:float-right after:font-mono after:text-echo-muted after:content-['+'] group-open:after:content-['−']">
                    {q}
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-echo-muted">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <aside className="space-y-4">
        <Panel title="Claim or license problem">
          <p className="text-sm leading-6 text-echo-muted">Reports tied to a license go straight to our review team together with your purchase record.</p>
          <Link href="/dashboard" className="mt-4 block rounded-md border border-echo-border px-4 py-2 text-center text-sm hover:border-white/40">
            Go to My licenses
          </Link>
        </Panel>
        <Panel title="Verify a certificate">
          <p className="text-sm leading-6 text-echo-muted">Use the verification link printed on the certificate (…/verify/&lt;certificate-id&gt;).</p>
        </Panel>
        <Panel title="Legal">
          <div className="space-y-2 text-sm">
            <Link href="/legal/terms" className="block hover:underline">License & platform terms</Link>
            <Link href="/legal/privacy" className="block hover:underline">Privacy</Link>
          </div>
        </Panel>
      </aside>
    </main>
  );
}
