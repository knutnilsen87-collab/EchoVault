import type { ApiErrorCode } from "@echovault/domain";

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TRACK_NOT_APPROVED: 409,
  TERMS_NOT_ACCEPTED: 409,
  INVALID_STATE: 409,
  POE_INVALID: 422,
  WEBHOOK_SIGNATURE_INVALID: 400,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500
};

/** Expected, user-facing failure. Anything else becomes INTERNAL_ERROR. */
export class AppError extends Error {
  readonly status: number;
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.status = STATUS[code];
  }
}

export const notFound = (what = "Resource") => new AppError("NOT_FOUND", `${what} not found.`);
