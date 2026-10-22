import { formatEur, TIER_LABELS } from "@echovault/domain";
import { ActivateTermsButton, NewTermsVersionForm } from "@/components/forms/admin-forms";
import { Panel } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { listTermsVersions } from "@/server/services/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "License terms" };

export default async function TermsAdminPage() {
  await pageUser(["admin"], "/admin/terms");
  const versions = await listTermsVersions();
  const defaults = Object.fromEntries(versions.filter((v) => v.active).map((v) => [v.tier, v]));
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">License terms</h1>
        <p className="mt-1 max-w-3xl text-sm text-echo-muted">
          Each purchase stores the version it was sold under. Versions with sales can never be edited (the database refuses). To change text or price,
          create a new version and activate it — only new purchases are affected.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-echo-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-echo-border font-mono text-[11px] uppercase tracking-wider text-echo-muted">
            <tr>
              <th className="px-4 py-3 font-normal">Tier</th>
              <th className="px-4 py-3 font-normal">Version</th>
              <th className="px-4 py-3 font-normal">Title</th>
              <th className="px-4 py-3 text-right font-normal">Price</th>
              <th className="px-4 py-3 text-right font-normal">Artist</th>
              <th className="px-4 py-3 text-right font-normal">Sold</th>
              <th className="px-4 py-3 font-normal">State</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.id} className="border-b border-echo-border last:border-0">
                <td className="px-4 py-2">{TIER_LABELS[v.tier].name}</td>
                <td className="px-4 py-2 font-mono">{v.version}</td>
                <td className="px-4 py-2">
                  <details>
                    <summary className="cursor-pointer">{v.title}</summary>
                    <p className="mt-2 max-w-xl whitespace-pre-wrap text-xs text-echo-muted">{v.terms_md}</p>
                  </details>
                </td>
                <td className="px-4 py-2 text-right font-mono">{formatEur(v.price_cents)}</td>
                <td className="px-4 py-2 text-right font-mono">{(v.artist_share_bps / 100).toFixed(0)}%</td>
                <td className="px-4 py-2 text-right font-mono">{v.licenses_sold}</td>
                <td className="px-4 py-2">
                  {v.active ? (
                    <span className="font-mono text-xs text-emerald-300">ACTIVE{v.activated_at ? ` · ${dateTime(v.activated_at).slice(0, 10)}` : ""}</span>
                  ) : (
                    <ActivateTermsButton id={v.id} label={`${TIER_LABELS[v.tier].name} v${v.version}`} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Panel title="New version">
        <NewTermsVersionForm defaults={defaults} />
      </Panel>
    </main>
  );
}
