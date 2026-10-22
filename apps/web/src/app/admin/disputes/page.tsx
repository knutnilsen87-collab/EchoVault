import Link from "next/link";
import { StatusBadge } from "@/components/ui/badges";
import { dateTime } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { listDisputes } from "@/server/services/disputes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Disputes" };

type Row = { id: string; status: string; reason_category: string; claim_summary: string; track_title: string | null; track_status: string | null; created_at: string; opened_by: string | null };

export default async function DisputesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await pageUser(["support", "reviewer"], "/admin/disputes");
  const { status } = await searchParams;
  const all = (await listDisputes()) as Row[];
  const OPEN = ["open", "investigating", "escalated"];
  const rows = status === "all" ? all : status === "resolved" ? all.filter((d) => !OPEN.includes(d.status)) : all.filter((d) => OPEN.includes(d.status));
  const tab = (key: string, label: string) => (
    <Link
      href={key === "open" ? "/admin/disputes" : `/admin/disputes?status=${key}`}
      aria-current={(status ?? "open") === key ? "page" : undefined}
      className={`rounded-md border px-3 py-1 text-sm ${(status ?? "open") === key ? "border-white/60 text-white" : "border-echo-border text-echo-muted hover:text-white"}`}
    >
      {label}
    </Link>
  );
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Disputes</h1>
        <div className="flex gap-2">
          {tab("open", `Open (${all.filter((d) => OPEN.includes(d.status)).length})`)}
          {tab("resolved", "Resolved")}
          {tab("all", "All")}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-echo-border">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-echo-muted">No disputes here.</p>
        ) : (
          rows.map((d) => (
            <Link key={d.id} href={`/admin/disputes/${d.id}`} className="block border-b border-echo-border px-5 py-4 last:border-0 hover:bg-echo-surface">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{d.track_title ?? "—"}</span>
                {d.track_status ? <StatusBadge status={d.track_status} /> : null}
                <span className="ml-auto font-mono text-xs text-echo-muted">
                  {d.status.toUpperCase()} · {d.reason_category} · {dateTime(d.created_at)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-300">{d.claim_summary}</p>
              <p className="mt-1 font-mono text-[11px] text-echo-muted">{d.opened_by}</p>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
