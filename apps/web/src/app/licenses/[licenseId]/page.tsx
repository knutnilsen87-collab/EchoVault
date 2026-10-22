import Link from "next/link";
import { notFound } from "next/navigation";
import { formatEur } from "@echovault/domain";
import { DisputeForm, DownloadButton } from "@/components/forms/license-actions";
import { StatusBadge } from "@/components/ui/badges";
import { Alert, DataRow, Panel } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { AppError } from "@/server/errors";
import { getLicense } from "@/server/services/licenses";

export const dynamic = "force-dynamic";

export default async function LicensePage({ params }: { params: Promise<{ licenseId: string }> }) {
  const { licenseId } = await params;
  const user = await pageUser(undefined, `/licenses/${licenseId}`);
  if (!/^[0-9a-f-]{36}$/i.test(licenseId)) notFound();
  let data;
  try {
    data = await getLicense(user, licenseId);
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
  const { license: l, events, terms, tier } = data;
  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Link href="/dashboard" className="font-mono text-xs text-echo-muted hover:text-white">
          ← MY LICENSES
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{l.track_title}</h1>
          <StatusBadge status={l.status} />
        </div>
        {l.track_status === "suspended" ? (
          <Alert>
            This track is currently suspended from new sales while a report is reviewed. Your license record and certificate remain available.
          </Alert>
        ) : null}
        <Panel title="License record">
          <dl>
            <DataRow label="License ID" value={l.id} />
            <DataRow label="Artist" value={l.artist_name} mono={false} />
            <DataRow label="Tier" value={tier.name} mono={false} />
            <DataRow label="Terms version" value={l.terms_version} />
            <DataRow label="Paid" value={formatEur(l.price_paid_cents)} />
            <DataRow label="Purchased" value={dateTime(l.purchased_at)} />
            {l.project_or_client_name ? <DataRow label="Project / client" value={l.project_or_client_name} mono={false} /> : null}
            {l.whitelisted_url ? <DataRow label="Channel / URL" value={l.whitelisted_url} /> : null}
          </dl>
        </Panel>
        <Panel title="Permitted use">
          <p className="text-sm">{tier.allowed}</p>
          <p className="mt-2 text-sm text-echo-muted">{tier.limits}</p>
          {terms ? (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer">Full terms as accepted ({terms.title})</summary>
              <p className="mt-3 whitespace-pre-wrap text-echo-muted">{terms.terms_md}</p>
            </details>
          ) : null}
        </Panel>
        <Panel title="History">
          <ol className="space-y-2">
            {events.map((e, i) => (
              <li key={i} className="flex justify-between font-mono text-xs">
                <span className="uppercase">{e.type.replace(/_/g, " ")}</span>
                <span className="text-echo-muted">{dateTime(e.created_at)}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <Panel title="Files">
          <div className="space-y-3">
            <DownloadButton licenseId={l.id} />
            {l.certificate_id ? (
              <>
                <a href={`/api/v1/licenses/${l.id}/certificate`} className="block rounded-md border border-echo-border px-4 py-2 text-center text-sm hover:border-white/40">
                  Download certificate (PDF)
                </a>
                <Link href={`/verify/${l.certificate_id}`} className="block text-center font-mono text-xs text-echo-muted hover:text-white">
                  Public verification page →
                </Link>
              </>
            ) : (
              <p className="text-sm text-echo-muted">Certificate is being generated…</p>
            )}
          </div>
        </Panel>
        <Panel title="Support">
          <DisputeForm licenseId={l.id} />
        </Panel>
      </aside>
    </main>
  );
}
