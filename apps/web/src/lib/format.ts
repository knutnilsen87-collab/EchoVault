export function duration(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return "—";
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function dateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  analysis_pending: "Analysing",
  analysis_failed: "Analysis failed",
  needs_human_review: "In review",
  changes_requested: "Changes requested",
  approved: "Live",
  live: "Live",
  rejected: "Rejected",
  suspended: "Suspended",
  paid: "Paid",
  certificate_generated: "Active",
  certificate_failed: "Certificate pending",
  delivered: "Active",
  disputed: "Disputed",
  refunded: "Refunded"
};
