import { z } from "zod";
import { LICENSE_TIERS } from "./status";

export const checkoutSessionSchema = z.object({
  track_id: z.string().uuid(),
  tier: z.enum(LICENSE_TIERS),
  terms_accepted: z.boolean(),
  whitelisted_url: z.string().url().max(2000).nullable().optional(),
  project_or_client_name: z.string().min(1).max(255).nullable().optional()
});

export const createTrackDraftSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  genre: z.string().trim().min(1).max(100),
  mood: z.string().max(100).nullable().optional(),
  bpm: z.number().int().positive().max(399).nullable().optional()
});

export const proofOfEffortSchema = z.object({
  creation_mode: z.enum(["pure_ai_director", "hybrid_producer", "human_led_ai_assisted"]),
  ai_tools_used: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
  process_summary: z.string().trim().min(20).max(5000),
  daw_manual_work: z.string().max(5000).nullable().optional(),
  time_spent_bucket: z.enum(["under_1h", "1_3h", "3_10h", "10h_plus"]),
  samples_used: z.enum(["none", "owned", "licensed", "public_domain", "unknown"]),
  sample_notes: z.string().max(5000).nullable().optional(),
  voice_or_likeness_used: z.boolean(),
  named_artist_imitation: z.boolean(),
  rights_warranty_accepted: z.boolean(),
  private_notes: z.string().max(5000).nullable().optional()
});

export const reviewDecisionSchema = z.object({
  reason_code: z.string().trim().min(1).max(100).optional(),
  notes: z.string().max(5000).optional(),
  /** Required when approving without a passing EchoScore. */
  override_reason: z.string().trim().min(10).max(2000).optional()
});

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(10).max(200),
  display_name: z.string().trim().min(1).max(255),
  role: z.enum(["buyer", "artist"]),
  artist_name: z.string().trim().min(1).max(255).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1)
});

export const disputeSchema = z.object({
  license_id: z.string().uuid(),
  claim_summary: z.string().trim().min(20).max(5000),
  reason_category: z.enum(["copyright_claim", "content_id_claim", "quality", "license_scope", "other"])
});

export const suspendSchema = z.object({
  reason: z.string().trim().min(10).max(2000),
  dispute_id: z.string().uuid().optional()
});

export const analysisCallbackSchema = z.object({
  job_id: z.string().uuid(),
  track_id: z.string().uuid(),
  analysis_version: z.string(),
  status: z.enum(["succeeded", "failed"]),
  score: z.number().min(0).max(100).nullable(),
  pass: z.boolean().nullable(),
  metrics: z.record(z.unknown()).nullable(),
  flags: z.array(z.string()).default([]),
  feedback: z.array(z.string()).default([]),
  error_message: z.string().nullable().optional()
});

export const updateProfileSchema = z.object({
  display_name: z.string().trim().min(1).max(255).optional(),
  artist_name: z.string().trim().min(1).max(255).nullable().optional(),
  bio: z.string().trim().max(2000).nullable().optional()
});

export const changePasswordSchema = z.object({
  current_password: z.string().max(200).optional(),
  new_password: z.string().min(10).max(200)
});

export const updateDisputeSchema = z.object({
  status: z.enum(["open", "investigating", "resolved_valid", "resolved_invalid", "escalated", "closed"]),
  resolution_notes: z.string().trim().max(5000).optional()
});

export const createTermsVersionSchema = z.object({
  tier: z.enum(LICENSE_TIERS),
  version: z.string().trim().regex(/^[0-9A-Za-z.\-_]{1,40}$/, "Use letters, digits, dot, dash or underscore"),
  title: z.string().trim().min(3).max(200),
  terms_md: z.string().trim().min(50).max(50_000),
  price_cents: z.number().int().min(100).max(10_000_000),
  artist_share_bps: z.number().int().min(0).max(10_000)
});

export const setRoleSchema = z.object({
  role: z.enum(["buyer", "artist", "reviewer", "support", "finance", "admin"])
});
