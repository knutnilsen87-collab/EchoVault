import Link from "next/link";
import { redirect } from "next/navigation";
import { EchoScoreBadge, StatusBadge } from "@/components/ui/badges";
import { Panel } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { listDisputes } from "@/server/services/disputes";
import { reviewQueue } from "@/server/services/review";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review queue" };

export default async function AdminPage() {
  const user = await pageUser(["reviewer", "support", "finance"], "/admin");
  if (user.role === "support") redirect("/admin/disputes");
  if (user.role === "finance") redirect("/admin/licenses");
  const [queue, disputes] = await Promise.all([reviewQueue(), listDisputes()]);
  const open = (disputes as { status: string }[]).filter((d) => ["open", "investigating", "escalated"].includes(d.status));
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <h1 className="text-2xl font-semibold">Review</h1>
      <Panel title={`Review queue · ${queue.filter((q) => q.status !== "analysis_pending").length} waiting`}>
        {queue.length === 0 ? (
          <p className="text-sm text-echo-muted">Nothing to review.</p>
        ) : (
          <div className="-mx-5 -mb-5">
            {queue.map((t) => (
              <Link key={t.id} href={`/admin/tracks/${t.id}`} className="flex items-center gap-4 border-t border-echo-border px-5 py-3 hover:bg-echo-dark">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="font-mono text-xs text-echo-muted">
                    {t.artist_name} · {t.genre} · submitted {dateTime(t.submitted_at)}
                  </p>
                </div>
                {t.flags?.length ? <span className="hidden font-mono text-xs text-red-300 md:inline">{t.flags.join(", ")}</span> : null}
                <EchoScoreBadge score={t.score} pass={t.pass} />
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        )}
      </Panel>
      <Panel title={`Disputes · ${open.length} open`} aside={<Link href="/admin/disputes" className="text-xs text-echo-muted hover:text-white">All disputes →</Link>}>
        {disputes.length === 0 ? (
          <p className="text-sm text-echo-muted">No disputes.</p>
        ) : (
          <ul className="-mx-5 -mb-5">
            {(disputes as { id: string; status: string; reason_category: string; claim_summary: string; track_id: string; track_title: string; track_status: string; created_at: string; opened_by: string }[]).map((d) => (
              <li key={d.id} className="border-t border-echo-border px-5 py-3">
                <div className="flex items-center gap-3">
                  <Link href={`/admin/disputes/${d.id}`} className="font-medium hover:underline">
                    {d.track_title}
                  </Link>
                  <StatusBadge status={d.track_status} />
                  <span className="ml-auto font-mono text-xs text-echo-muted">
                    {d.status.toUpperCase()} · {d.reason_category} · {dateTime(d.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-300">{d.claim_summary}</p>
                <p className="mt-1 font-mono text-[11px] text-echo-muted">
                  {d.opened_by} · dispute {d.id}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </main>
  );
}
