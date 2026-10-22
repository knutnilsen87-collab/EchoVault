import { STATUS_LABEL } from "@/lib/format";

const TONE: Record<string, string> = {
  approved: "border-emerald-500/40 text-emerald-300",
  live: "border-emerald-500/40 text-emerald-300",
  certificate_generated: "border-emerald-500/40 text-emerald-300",
  delivered: "border-emerald-500/40 text-emerald-300",
  needs_human_review: "border-amber-400/40 text-amber-200",
  analysis_pending: "border-echo-border text-echo-muted",
  submitted: "border-echo-border text-echo-muted",
  changes_requested: "border-amber-400/40 text-amber-200",
  analysis_failed: "border-red-500/40 text-red-300",
  rejected: "border-red-500/40 text-red-300",
  suspended: "border-red-500/40 text-red-300",
  disputed: "border-amber-400/40 text-amber-200",
  refunded: "border-red-500/40 text-red-300"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${TONE[status] ?? "border-echo-border text-echo-muted"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/** Pass/fail is spelled out in text, never colour alone. */
export function EchoScoreBadge({ score, pass }: { score: number | null | undefined; pass: boolean | null | undefined }) {
  if (score === null || score === undefined) return <span className="font-mono text-xs text-echo-muted">ECHOSCORE —</span>;
  return (
    <span
      title="EchoScore is technical audio QA, not a copyright check."
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px] ${pass ? "border-white/20 text-white" : "border-red-500/40 text-red-300"}`}
    >
      ES {Math.round(score)} {pass ? "PASS" : "FLAGGED"}
    </span>
  );
}

export function PoeBadge({ mode }: { mode?: string | null }) {
  if (!mode) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded border border-echo-purple/50 px-2 py-0.5 font-mono text-[11px] text-[#b98cf0]" title="Proof of Effort documented">
      PoE · {mode}
    </span>
  );
}
