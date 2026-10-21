import { ZodError, type z, type ZodTypeAny } from "zod";
import { AppError } from "./errors";
import { logEvent } from "./logger";

export type RequestContext = { requestId: string };

export function requestIdFrom(request: Request): string {
  const incoming = request.headers.get("x-request-id");
  return incoming && /^[\w-]{6,100}$/.test(incoming) ? incoming : `req_${crypto.randomUUID()}`;
}

export function ok<T>(data: T, ctx: RequestContext, status = 200): Response {
  return Response.json({ ok: true, data, request_id: ctx.requestId }, { status, headers: { "x-request-id": ctx.requestId } });
}

export function fail(error: AppError, ctx: RequestContext): Response {
  return Response.json(
    {
      ok: false,
      error: { code: error.code, message: error.message, ...(error.details === undefined ? {} : { details: error.details }) },
      request_id: ctx.requestId
    },
    { status: error.status, headers: { "x-request-id": ctx.requestId } }
  );
}

type Handler<P> = (request: Request, ctx: RequestContext & { params: P }) => Promise<Response>;

/**
 * Wraps a route handler: request id, error envelope, no stack traces to clients.
 * Next 15 passes `{ params: Promise<P> }` as the second argument.
 */
export function route<P = Record<string, never>>(handler: Handler<P>) {
  return async (request: Request, nextCtx: { params: Promise<P> }): Promise<Response> => {
    const ctx = { requestId: requestIdFrom(request) };
    try {
      const params = ((await nextCtx?.params) ?? {}) as P;
      return await handler(request, { ...ctx, params });
    } catch (error) {
      if (error instanceof AppError) return fail(error, ctx);
      if (error instanceof ZodError) return fail(new AppError("VALIDATION_ERROR", "Invalid request.", error.flatten()), ctx);
      logEvent({
        level: "error",
        event: "unhandled_route_error",
        requestId: ctx.requestId,
        details: { path: new URL(request.url).pathname, error: error instanceof Error ? error.message : String(error) }
      });
      return fail(new AppError("INTERNAL_ERROR", "Unexpected error."), ctx);
    }
  };
}

export async function parseJson<S extends ZodTypeAny>(request: Request, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be valid JSON.");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid request.", parsed.error.flatten());
  return parsed.data;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertUuid(value: string | undefined, what = "id"): string {
  if (!value || !UUID_RE.test(value)) throw new AppError("NOT_FOUND", `Unknown ${what}.`);
  return value;
}
