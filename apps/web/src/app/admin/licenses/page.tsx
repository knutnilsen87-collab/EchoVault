import Link from "next/link";
import { formatEur } from "@echovault/domain";
import { StatusBadge } from "@/components/ui/badges";
import { inputClass } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { adminLicenses } from "@/server/services/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Licenses" };

export default async function AdminLicensesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await pageUser(["support", "finance"], "/admin/licenses");
  const { q } = await searchParams;
  const { licenses, totals } = await adminLicenses({ q: q?.slice(0, 100) || undefined });
  const stats: [string, string][] = [
    ["Licenses", String(totals.count)],
    ["Gross", formatEur(totals.gross_cents)],
    ["Platform share", formatEur(totals.platform_cents)],
    ["Owed to artists", formatEur(totals.artist_cents)]
  ];
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Licenses</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-xl border border-echo-border bg-echo-surface p-4">
            <p className="text-sm text-echo-muted">{l}</p>
            <p className="mt-1 font-mono text-xl">{v}</p>
          </div>
        ))}
      </div>
      <form className="flex max-w-md gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Track, buyer email, artist, project or license ID" aria-label="Search licenses" className={`${inputClass} py-1.5 text-sm`} />
        <button className="rounded-md border border-echo-border px-4 text-sm hover:border-white/40">Search</button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-echo-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-echo-border font-mono text-[11px] uppercase tracking-wider text-echo-muted">
            <tr>
              <th className="px-4 py-3 font-normal">Purchased</th>
              <th className="px-4 py-3 font-normal">Track</th>
              <th className="px-4 py-3 font-normal">Buyer</th>
              <th className="px-4 py-3 font-normal">Tier</th>
              <th className="px-4 py-3 text-right font-normal">Paid</th>
              <th className="px-4 py-3 text-right font-normal">Artist</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-echo-muted">No licenses found.</td></tr>
            ) : (
              licenses.map((l) => (
                <tr key={l.id} className="border-b border-echo-border last:border-0">
                  <td className="px-4 py-2 font-mono text-xs text-echo-muted">{dateTime(l.purchased_at)}</td>
                  <td className="px-4 py-2">
                    <Link href={`/licenses/${l.id}`} className="hover:underline">{l.track_title}</Link>
                    <div className="text-xs text-echo-muted">{l.artist_name}</div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{l.buyer_email}</td>
                  <td className="px-4 py-2 font-mono text-xs uppercase">{l.tier}</td>
                  <td className="px-4 py-2 text-right font-mono">{formatEur(l.price_paid_cents)}</td>
                  <td className="px-4 py-2 text-right font-mono">{formatEur(l.artist_cut_cents)}</td>
                  <td className="px-4 py-2"><StatusBadge status={l.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
