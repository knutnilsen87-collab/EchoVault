import type { TrackStatus } from "./status";

/**
 * Track state machine. Every status change in the app goes through
 * assertTransition so illegal jumps (e.g. draft -> approved) are impossible.
 */
const TRANSITIONS: Record<TrackStatus, readonly TrackStatus[]> = {
  draft: ["submitted"],
  changes_requested: ["submitted"],
  submitted: ["analysis_pending"],
  analysis_pending: ["needs_human_review", "analysis_failed"],
  analysis_failed: ["analysis_pending", "approved", "rejected", "changes_requested"],
  needs_human_review: ["approved", "rejected", "changes_requested"],
  approved: ["live", "suspended"],
  live: ["suspended"],
  suspended: ["approved"],
  rejected: []
};

export function canTransition(from: TrackStatus, to: TrackStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: TrackStatus, to: TrackStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`INVALID_TRACK_TRANSITION:${from}->${to}`);
  }
}

/** Artist may edit metadata, files and PoE only in these states. */
export function isArtistEditable(status: TrackStatus): boolean {
  return status === "draft" || status === "changes_requested";
}

export function isPublicTrackStatus(status: TrackStatus): boolean {
  return status === "approved" || status === "live";
}
