import { notFound } from "next/navigation";
import { DataRow, Panel } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { AppError } from "@/server/errors";
import { verifyCertificate } from "@/server/services/licenses";
import { CERTIFICATE_DISCLAIMER } from "@/server/services/certificate-pdf";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verify certificate", robots: { index: false } };

const VALIDITY = {
  valid: { label: "VALID", text: "This license is on record and active.", cls: "border-emerald-500/40 text-emerald-200" },
  under_review: { label: "UNDER REVIEW", text: "A report about this license or track is being investigated. The license record is preserved.", cls: "border-amber-400/40 text-amber-200" },
  revoked: { label: "REFUNDED", text: "This purchase was refunded; the license is no longer active.", cls: "border-red-500/40 text-red-200" }
} as const;

export default async function VerifyPage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(certificateId)) notFound();
  let c;
  try {
    c = await verifyCertificate(certificateId);
  } catch (e) {
    if (e instanceof AppError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
  const v = VALIDITY[c.validity as keyof typeof VALIDITY];
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-echo-muted">Certificate verification</p>
      <div className={`rounded-xl border px-5 py-4 ${v.cls}`}>
        <p className="font-mono text-sm">{v.label}</p>
        <p className="mt-1 text-sm">{v.text}</p>
      </div>
      <Panel title="Record">
        <dl>
          <DataRow label="Certificate ID" value={c.certificate_id} />
          <DataRow label="License ID" value={c.license_id} />
          <DataRow label="Track" value={c.track_title} mono={false} />
          <DataRow label="Artist" value={c.artist_name} mono={false} />
          <DataRow label="Licensee" value={c.buyer_name} mono={false} />
          <DataRow label="Tier" value={c.tier_summary.name} mono={false} />
          <DataRow label="Permitted use" value={c.tier_summary.allowed} mono={false} />
          <DataRow label="Terms version" value={c.terms_version} />
          <DataRow label="Purchased" value={dateTime(c.purchased_at)} />
          {c.project_or_client_name ? <DataRow label="Project / client" value={c.project_or_client_name} mono={false} /> : null}
          <DataRow label="PDF SHA-256" value={<span className="break-all">{c.sha256}</span>} />
        </dl>
      </Panel>
      <p className="text-xs leading-5 text-echo-muted">{CERTIFICATE_DISCLAIMER}</p>
    </main>
  );
}
