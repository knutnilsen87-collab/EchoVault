import Link from "next/link";
import { formatEur } from "@echovault/domain";
import { StatusBadge } from "@/components/ui/badges";
import { pageUser } from "@/lib/session";
import { dateTime } from "@/lib/format";
import { listBuyerLicenses } from "@/server/services/licenses";

export const dynamic = "force-dynamic";
export const metadata = { title: "My licenses" };

export default async function DashboardPage() {
  const user = await pageUser(undefined, "/dashboard");
  const licenses = await listBuyerLicenses(user);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">My licenses</h1>
      <div className="mt-6 overflow-hidden rounded-xl border border-echo-border">
        {licenses.length === 0 ? (
          <p className="px-6 py-12 text-center text-echo-muted">
            No licenses yet. <Link href="/" className="text-white underline">Browse the catalog</Link>.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-echo-border font-mono text-[11px] uppercase tracking-wider text-echo-muted">
              <tr>
                <th className="px-4 py-3 font-normal">Track</th>
                <th className="px-4 py-3 font-normal">Tier</th>
                <th className="hidden px-4 py-3 font-normal md:table-cell">Purchased</th>
                <th className="hidden px-4 py-3 font-normal md:table-cell">Paid</th>
                <th className="px-4 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((l) => (
                <tr key={l.id} className="border-b border-echo-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/licenses/${l.id}`} className="font-medium hover:underline">
                      {l.track_title}
                    </Link>
                    <div className="text-xs text-echo-muted">{l.artist_name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs uppercase">{l.tier}</td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-echo-muted md:table-cell">{dateTime(l.purchased_at)}</td>
                  <td className="hidden px-4 py-3 font-mono text-xs md:table-cell">{formatEur(l.price_paid_cents)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
