import Link from "next/link";
import { notFound } from "next/navigation";
import { DisputeActions } from "@/components/forms/admin-forms";
import { StatusBadge } from "@/components/ui/badges";
import { DataRow, Panel } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { AppError } from "@/server/errors";
import { disputeDetail } from "@/server/services/admin";

export const dynamic = "force-dynamic";

export default async function DisputePage({ params }: { params: Promise<{ disputeId: string }> }) {
  const { disputeId } = await params;
  await pageUser(["support", "reviewer"], `/admin/disputes/${disputeId}`);
  if (!/^[0-9a-f-]{36}$/i.test(disputeId)) notFound();
  let data;
  try {
    data = await disputeDetail(disputeId);
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
  const { dispute: d, history } = data;
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Link href="/admin/disputes" className="font-mono text-xs text-echo-muted hover:text-white">← DISPUTES</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Dispute: {d.track_title ?? "unknown track"}</h1>
          <span className="rounded border border-echo-border px-2 py-0.5 font-mono text-[11px] uppercase">{d.status.replace("_", " ")}</span>
        </div>
        <Panel title="Claim">
          <p className="whitespace-pre-wrap leading-7">{d.claim_summary}</p>
          <dl className="mt-4">
            <DataRow label="Category" value={d.reason_category ?? "—"} />
            <DataRow label="Opened by" value={d.opened_by ?? "—"} />
            <DataRow label="Opened" value={dateTime(d.created_at)} />
            <DataRow label="License" value={d.purchased_license_id ?? "—"} />
            {d.resolved_at ? <DataRow label="Resolved" value={`${dateTime(d.resolved_at)} · ${d.resolved_by ?? ""}`} /> : null}
          </dl>
          {d.resolution_notes ? (
            <div className="mt-4 rounded-md border border-echo-border p-3 text-sm">
              <p className="font-mono text-[11px] uppercase text-echo-muted">Resolution notes</p>
              <p className="mt-1 whitespace-pre-wrap">{d.resolution_notes}</p>
            </div>
          ) : null}
        </Panel>
        <Panel title="Track">
          {d.track_id ? (
            <div className="flex items-center justify-between gap-3">
              <Link href={`/admin/tracks/${d.track_id}`} className="font-medium hover:underline">{d.track_title}</Link>
              {d.track_status ? <StatusBadge status={d.track_status} /> : null}
            </div>
          ) : (
            <p className="text-sm text-echo-muted">No track linked.</p>
          )}
        </Panel>
        <Panel title="History">
          <ol className="space-y-2 font-mono text-xs">
            {history.map((h, i) => (
              <li key={i}>
                <span className="text-white">{h.action}</span> · {h.actor ?? "system"} · {dateTime(h.created_at)}
                {h.metadata && (h.metadata as { to?: string }).to ? <span className="text-echo-muted"> → {(h.metadata as { to?: string }).to}</span> : null}
              </li>
            ))}
          </ol>
        </Panel>
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <Panel title="Actions">
          <DisputeActions disputeId={d.id} status={d.status} trackId={d.track_id} trackStatus={d.track_status} />
        </Panel>
      </aside>
    </main>
  );
}
