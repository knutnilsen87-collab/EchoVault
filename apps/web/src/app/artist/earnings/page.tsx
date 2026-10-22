import Link from "next/link";
import { formatEur } from "@echovault/domain";
import { StatusBadge } from "@/components/ui/badges";
import { Alert, Panel } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { artistEarnings } from "@/server/services/earnings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const user = await pageUser(["artist"], "/artist/earnings");
  const { totals, by_track, sales } = await artistEarnings(user);
  const stats: [string, string][] = [
    ["Your earnings", formatEur(totals.artist_cents)],
    ["Last 30 days", formatEur(totals.last_30d_artist_cents)],
    ["Licenses sold", String(totals.licenses)],
    ["Gross sales", formatEur(totals.gross_cents)]
  ];
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <h1 className="text-2xl font-semibold">Earnings</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-echo-border bg-echo-surface p-5">
            <p className="text-sm text-echo-muted">{label}</p>
            <p className="mt-2 font-mono text-2xl">{value}</p>
          </div>
        ))}
      </div>
      <Alert>
        Your share is fixed on each sale at the moment of purchase. Payouts are handled manually during the beta — all earnings show as accrued until
        then.
      </Alert>

      <Panel title="By track">
        {by_track.length === 0 ? (
          <p className="text-sm text-echo-muted">
            No live tracks yet. <Link href="/artist/tracks/new" className="text-white underline">Upload one</Link>.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="font-mono text-[11px] uppercase tracking-wider text-echo-muted">
              <tr>
                <th className="py-2 font-normal">Track</th>
                <th className="py-2 font-normal">Status</th>
                <th className="py-2 text-right font-normal">Licenses</th>
                <th className="py-2 text-right font-normal">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {by_track.map((t) => (
                <tr key={t.track_id} className="border-t border-echo-border">
                  <td className="py-2">
                    <Link href={`/artist/tracks/${t.track_id}`} className="hover:underline">{t.title}</Link>
                  </td>
                  <td className="py-2"><StatusBadge status={t.status} /></td>
                  <td className="py-2 text-right font-mono">{t.licenses}</td>
                  <td className="py-2 text-right font-mono">{formatEur(t.artist_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Sales">
        {sales.length === 0 ? (
          <p className="text-sm text-echo-muted">No sales yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="font-mono text-[11px] uppercase tracking-wider text-echo-muted">
              <tr>
                <th className="py-2 font-normal">Date</th>
                <th className="py-2 font-normal">Track</th>
                <th className="py-2 font-normal">Tier</th>
                <th className="py-2 text-right font-normal">Price</th>
                <th className="py-2 text-right font-normal">Your share</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className={`border-t border-echo-border ${s.refunded ? "text-echo-muted line-through" : ""}`}>
                  <td className="py-2 font-mono text-xs">{dateTime(s.purchased_at)}</td>
                  <td className="py-2">{s.track_title}</td>
                  <td className="py-2 font-mono text-xs uppercase">{s.tier}{s.refunded ? " · refunded" : ""}</td>
                  <td className="py-2 text-right font-mono">{formatEur(s.price_paid_cents)}</td>
                  <td className="py-2 text-right font-mono">{formatEur(s.artist_cut_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </main>
  );
}
