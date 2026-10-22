export const USER_ROLES = ["buyer", "artist", "reviewer", "support", "finance", "admin"] as const;
export const TRACK_STATUSES = [
  "draft",
  "submitted",
  "analysis_pending",
  "analysis_failed",
  "needs_human_review",
  "changes_requested",
  "approved",
  "live",
  "rejected",
  "suspended"
] as const;
export const LICENSE_TIERS = ["creator", "pro", "agency"] as const;
export const FILE_KINDS = [
  "preview_mp3",
  "stream_mp3",
  "high_res_wav",
  "artwork_image",
  "poe_attachment",
  "certificate_pdf"
] as const;
/** Append-only license lifecycle events (current status = latest event). */
export const LICENSE_EVENT_TYPES = [
  "paid",
  "certificate_generated",
  "certificate_failed",
  "delivered",
  "disputed",
  "refunded"
] as const;
export const DISPUTE_STATUSES = ["open", "investigating", "resolved_valid", "resolved_invalid", "escalated", "closed"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type TrackStatus = (typeof TRACK_STATUSES)[number];
export type LicenseTier = (typeof LICENSE_TIERS)[number];
export type FileKind = (typeof FILE_KINDS)[number];
export type LicenseEventType = (typeof LICENSE_EVENT_TYPES)[number];
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export const REVIEWER_ROLES: readonly UserRole[] = ["reviewer", "admin"];
