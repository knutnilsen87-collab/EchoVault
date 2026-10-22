import Link from "next/link";
import { inputClass } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { auditLog } from "@/server/services/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ entity_type?: string; action?: string; before?: string }> }) {
  await pageUser(["support"], "/admin/audit");
  const sp = await searchParams;
  const { entries, entity_types } = await auditLog({ entityType: sp.entity_type || undefined, action: sp.action || undefined, before: sp.before || undefined });
  const last = entries[entries.length - 1];
  const nextQs = last ? new URLSearchParams({ ...(sp.entity_type ? { entity_type: sp.entity_type } : {}), ...(sp.action ? { action: sp.action } : {}), before: new Date(last.created_at).toISOString() }) : null;
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="mt-1 text-sm text-echo-muted">Append-only — entries cannot be changed or deleted, not even by admins.</p>
      </div>
      <form className="flex flex-wrap gap-2">
        <select name="entity_type" defaultValue={sp.entity_type ?? ""} aria-label="Entity type" className={`${inputClass} w-auto py-1.5 text-sm`}>
          <option value="">All entities</option>
          {entity_types.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input name="action" defaultValue={sp.action} placeholder="Action prefix, e.g. track.approve" aria-label="Action" className={`${inputClass} w-64 py-1.5 font-mono text-sm`} />
        <button className="rounded-md border border-echo-border px-4 text-sm hover:border-white/40">Filter</button>
        {sp.entity_type || sp.action || sp.before ? <Link href="/admin/audit" className="self-center text-sm text-echo-muted underline">Reset</Link> : null}
      </form>
      <div className="overflow-x-auto rounded-xl border border-echo-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-echo-border font-mono text-[11px] uppercase tracking-wider text-echo-muted">
            <tr>
              <th className="px-4 py-3 font-normal">Time</th>
              <th className="px-4 py-3 font-normal">Action</th>
              <th className="px-4 py-3 font-normal">Actor</th>
              <th className="px-4 py-3 font-normal">Entity</th>
              <th className="px-4 py-3 font-normal">Details</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-echo-border align-top last:border-0">
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-echo-muted">{dateTime(e.created_at)}</td>
                <td className="px-4 py-2 font-mono text-xs">{e.action}</td>
                <td className="px-4 py-2 font-mono text-xs">{e.actor ?? "system"}</td>
                <td className="px-4 py-2 font-mono text-xs text-echo-muted">
                  {e.entity_type === "track" ? <Link href={`/admin/tracks/${e.entity_id}`} className="hover:text-white">{e.entity_type}:{e.entity_id.slice(0, 8)}</Link>
                    : e.entity_type === "dispute" ? <Link href={`/admin/disputes/${e.entity_id}`} className="hover:text-white">{e.entity_type}:{e.entity_id.slice(0, 8)}</Link>
                    : `${e.entity_type}:${e.entity_id.slice(0, 8)}`}
                </td>
                <td className="max-w-xs truncate px-4 py-2 font-mono text-[11px] text-echo-muted" title={JSON.stringify(e.metadata)}>
                  {Object.keys(e.metadata ?? {}).length ? JSON.stringify(e.metadata) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entries.length === 100 && nextQs ? (
        <Link href={`/admin/audit?${nextQs.toString()}`} className="inline-block text-sm underline">Older entries →</Link>
      ) : null}
    </main>
  );
}
