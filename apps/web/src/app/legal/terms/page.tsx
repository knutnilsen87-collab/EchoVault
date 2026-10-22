import Link from "next/link";
import { formatEur, TIER_LABELS } from "@echovault/domain";
import { Alert, Panel } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { getActiveTerms } from "@/server/services/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Terms" };

export default async function TermsPage() {
  const terms = await getActiveTerms();
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <section>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-echo-muted">Legal</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">License &amp; platform terms</h1>
        <p className="mt-2 text-sm text-echo-muted">Showing the versions currently offered at checkout. Each purchase keeps a copy of the exact version accepted.</p>
      </section>
      <Alert>
        DRAFT — these texts are working drafts pending review by legal counsel and are not final legal terms.
      </Alert>

      {terms.map((t) => (
        <Panel key={t.id} title={`${TIER_LABELS[t.tier].name} license`} aside={<span className="font-mono text-xs text-echo-muted">v{t.version} · {formatEur(t.price_cents)}</span>}>
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-300">{t.terms_md}</p>
        </Panel>
      ))}

      <Panel title="Platform terms (summary)">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-300">
          <li>EchoVault is a curated marketplace. Artists keep their copyright; buyers receive a non-exclusive license on the terms above.</li>
          <li>Artists warrant that they have the rights to submit and license each track, and document their process in a Proof of Effort.</li>
          <li>EchoScore is a technical audio check. Neither EchoScore nor Proof of Effort is a copyright clearance.</li>
          <li>A track may be suspended from new sales while a report is investigated. Existing license records are kept.</li>
          <li>Certificates document the license grant and purchase record; they are not a guarantee that third parties will never assert claims.</li>
        </ul>
        <p className="mt-4 text-xs text-echo-muted">Questions: see <Link href="/support" className="underline">Support</Link>. Page generated {dateTime(new Date())}.</p>
      </Panel>
    </main>
  );
}
