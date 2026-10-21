import { describe, expect, it } from "vitest";
import {
  assertTermsAccepted,
  assertTrackCanBeLicensed,
  assertTransition,
  canTransition,
  DEFAULT_TIER_PRICE_CENTS,
  findForbiddenClaims,
  proofOfEffortProblems,
  splitRevenueCents,
  toPublicPoeSummary,
  TRACK_STATUSES,
  type ProofOfEffortInput
} from "./index";

const validPoe: ProofOfEffortInput = {
  creationMode: "hybrid_producer",
  aiToolsUsed: ["Suno"],
  processSummary: "Generated stems with Suno, re-arranged and mixed in Ableton.",
  dawManualWork: "Ableton arrangement, EQ, mastering chain",
  timeSpentBucket: "3_10h",
  samplesUsed: "owned",
  sampleNotes: "own field recordings",
  voiceOrLikenessUsed: false,
  namedArtistImitation: false,
  rightsWarrantyAccepted: true,
  privateNotes: "full prompt: secret sauce"
};

describe("licensing rules", () => {
  it("blocks licensing for non-public tracks", () => {
    for (const s of TRACK_STATUSES.filter((s) => s !== "approved" && s !== "live")) {
      expect(() => assertTrackCanBeLicensed(s)).toThrow("TRACK_NOT_APPROVED");
    }
    expect(() => assertTrackCanBeLicensed("approved")).not.toThrow();
  });

  it("requires accepted terms for checkout", () => {
    expect(() => assertTermsAccepted(false)).toThrow("TERMS_NOT_ACCEPTED");
  });

  it("uses the Licensing Model prices (€19 / €49 / €199)", () => {
    expect(DEFAULT_TIER_PRICE_CENTS).toEqual({ creator: 1900, pro: 4900, agency: 19900 });
  });

  it("splits revenue 70/30 without losing cents", () => {
    expect(splitRevenueCents(1900, 7000)).toEqual({ artistCents: 1330, platformCents: 570 });
    expect(splitRevenueCents(4999, 7000)).toEqual({ artistCents: 3499, platformCents: 1500 });
    expect(() => splitRevenueCents(100, 12000)).toThrow("INVALID_SPLIT");
  });
});

describe("track lifecycle", () => {
  it("never allows jumping from draft to approved", () => {
    expect(canTransition("draft", "approved")).toBe(false);
    expect(() => assertTransition("draft", "approved")).toThrow("INVALID_TRACK_TRANSITION");
  });

  it("allows the happy path", () => {
    const path = ["draft", "submitted", "analysis_pending", "needs_human_review", "approved", "suspended", "approved"] as const;
    for (let i = 1; i < path.length; i++) expect(canTransition(path[i - 1]!, path[i]!)).toBe(true);
  });

  it("rejected is terminal", () => {
    for (const s of TRACK_STATUSES) expect(canTransition("rejected", s)).toBe(false);
  });
});

describe("proof of effort", () => {
  it("accepts a complete PoE", () => {
    expect(proofOfEffortProblems(validPoe)).toEqual([]);
  });

  it("blocks named artist imitation, missing warranty and unknown samples", () => {
    const problems = proofOfEffortProblems({
      ...validPoe,
      namedArtistImitation: true,
      rightsWarrantyAccepted: false,
      samplesUsed: "unknown"
    });
    expect(problems).toEqual(
      expect.arrayContaining(["POE_NAMED_ARTIST_IMITATION_BLOCKED", "POE_RIGHTS_WARRANTY_REQUIRED", "POE_SAMPLE_PROVENANCE_UNCLEAR"])
    );
  });

  it("public summary never leaks prompts or private notes", () => {
    const json = JSON.stringify(toPublicPoeSummary(validPoe));
    expect(json).not.toContain("secret sauce");
    expect(json).not.toContain("Generated stems");
    expect(json).not.toContain("field recordings");
  });
});

describe("legal guardrail (BR-009)", () => {
  it("flags risk-free claims", () => {
    expect(findForbiddenClaims("100% risk-free music")).not.toEqual([]);
    expect(findForbiddenClaims("Documented provenance and a license certificate.")).toEqual([]);
  });
});
