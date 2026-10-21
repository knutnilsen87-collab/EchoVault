type LogLevel = "info" | "warn" | "error";

export type LogEvent = {
  level: LogLevel;
  event: string;
  requestId?: string;
  details?: Record<string, unknown>;
};

const SENSITIVE = /secret|token|password|signature|authorization|cookie|key$/i;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || typeof value !== "object" || value === null) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) =>
      SENSITIVE.test(key) ? [key, "[REDACTED]"] : [key, redact(entry, depth + 1)]
    )
  );
}

export function logEvent(input: LogEvent): void {
  if (process.env.NODE_ENV === "test" && input.level === "info") return;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level: input.level,
    event: input.event,
    requestId: input.requestId,
    details: redact(input.details ?? {})
  });
  if (input.level === "error") console.error(line);
  else if (input.level === "warn") console.warn(line);
  else console.info(line);
}
