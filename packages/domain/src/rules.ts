import type { TrackStatus } from "./status";
import type { ProofOfEffortInput } from "./types";
import { isPublicTrackStatus } from "./track-lifecycle";

export function assertTrackCanBeLicensed(status: TrackStatus): void {
  if (!isPublicTrackStatus(status)) {
    throw new Error("TRACK_NOT_APPROVED");
  }
}

export function assertTermsAccepted(termsAccepted: boolean): void {
  if (!termsAccepted) {
    throw new Error("TERMS_NOT_ACCEPTED");
  }
}

/** PoE review rubric hard blocks (Proof_of_Effort_Standard.md). */
export function proofOfEffortProblems(input: ProofOfEffortInput): string[] {
  const problems: string[] = [];
  if (input.processSummary.trim().length < 20) problems.push("POE_PROCESS_SUMMARY_REQUIRED");
  if (!input.rightsWarrantyAccepted) problems.push("POE_RIGHTS_WARRANTY_REQUIRED");
  if (input.namedArtistImitation) problems.push("POE_NAMED_ARTIST_IMITATION_BLOCKED");
  if (input.samplesUsed === "unknown") problems.push("POE_SAMPLE_PROVENANCE_UNCLEAR");
  if (input.creationMode !== "human_led_ai_assisted" && input.aiToolsUsed.length === 0) {
    problems.push("POE_AI_TOOLS_REQUIRED");
  }
  return problems;
}

export function assertProofOfEffortComplete(input: ProofOfEffortInput): void {
  const [first] = proofOfEffortProblems(input);
  if (first) throw new Error(first);
}

const CREATION_MODE_LABELS: Record<ProofOfEffortInput["creationMode"], string> = {
  pure_ai_director: "Pure AI Director",
  hybrid_producer: "Hybrid Producer",
  human_led_ai_assisted: "Human-led with AI assistance"
};

const TIME_LABELS: Record<ProofOfEffortInput["timeSpentBucket"], string> = {
  under_1h: "<1h",
  "1_3h": "1–3h",
  "3_10h": "3–10h",
  "10h_plus": "10h+"
};

export type PublicPoeSummary = {
  creation_mode: string;
  ai_tools: string[];
  manual_work: boolean;
  time_spent: string;
  samples: ProofOfEffortInput["samplesUsed"];
  voice_or_likeness_used: boolean;
  rights_warranty: "accepted";
};

/**
 * What buyers may see. Never includes process_summary (may contain prompts),
 * sample_notes or private_notes.
 */
export function toPublicPoeSummary(input: ProofOfEffortInput): PublicPoeSummary {
  return {
    creation_mode: CREATION_MODE_LABELS[input.creationMode],
    ai_tools: input.aiToolsUsed,
    manual_work: Boolean(input.dawManualWork && input.dawManualWork.trim()),
    time_spent: TIME_LABELS[input.timeSpentBucket],
    samples: input.samplesUsed,
    voice_or_likeness_used: input.voiceOrLikenessUsed,
    rights_warranty: "accepted"
  };
}

/** BR-009: product copy must never promise legal safety. */
const FORBIDDEN_CLAIMS = [/risk[- ]free/i, /safe harbou?r/i, /guaranteed? (legal|copyright)/i, /100% (legal|safe)/i, /never get claimed/i];

export function findForbiddenClaims(copy: string): string[] {
  return FORBIDDEN_CLAIMS.filter((re) => re.test(copy)).map((re) => re.source);
}
