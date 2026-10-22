import { z } from "zod";

export const API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "TRACK_NOT_APPROVED",
  "TERMS_NOT_ACCEPTED",
  "INVALID_STATE",
  "POE_INVALID",
  "WEBHOOK_SIGNATURE_INVALID",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR"
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export const apiFailureSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.enum(API_ERROR_CODES),
    message: z.string().min(1),
    details: z.unknown().optional()
  }),
  request_id: z.string().nullable()
});

export const apiSuccessEnvelopeSchema = z.object({
  ok: z.literal(true),
  data: z.unknown(),
  request_id: z.string().nullable()
});
