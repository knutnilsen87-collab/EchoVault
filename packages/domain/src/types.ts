import type { LicenseTier } from "./status";

export type UUID = string;

export type ProofOfEffortInput = {
  creationMode: "pure_ai_director" | "hybrid_producer" | "human_led_ai_assisted";
  aiToolsUsed: string[];
  processSummary: string;
  dawManualWork?: string | null;
  timeSpentBucket: "under_1h" | "1_3h" | "3_10h" | "10h_plus";
  samplesUsed: "none" | "owned" | "licensed" | "public_domain" | "unknown";
  sampleNotes?: string | null;
  voiceOrLikenessUsed: boolean;
  namedArtistImitation: boolean;
  rightsWarrantyAccepted: boolean;
  privateNotes?: string | null;
};

export type CheckoutSessionInput = {
  trackId: UUID;
  tier: LicenseTier;
  termsAccepted: boolean;
  whitelistedUrl?: string | null;
  projectOrClientName?: string | null;
};
