"use client";

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
  }
}

/** Calls our JSON API and unwraps the { ok, data | error } envelope. */
export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "same-origin"
  });
  const body = await res.json().catch(() => null);
  if (!body || body.ok !== true) {
    throw new ApiClientError(body?.error?.code ?? "NETWORK_ERROR", body?.error?.message ?? `Request failed (${res.status})`, body?.error?.details);
  }
  return body.data as T;
}

const PROBLEM_TEXT: Record<string, string> = {
  POE_MISSING: "Proof of Effort is missing.",
  POE_PROCESS_SUMMARY_REQUIRED: "Describe your process (at least 20 characters).",
  POE_RIGHTS_WARRANTY_REQUIRED: "You must accept the rights warranty.",
  POE_NAMED_ARTIST_IMITATION_BLOCKED: "Tracks that intentionally imitate a named artist cannot be sold without cleared rights.",
  POE_SAMPLE_PROVENANCE_UNCLEAR: "Sample provenance must be declared (none, owned, licensed or public domain).",
  POE_AI_TOOLS_REQUIRED: "List the AI tool(s) you used."
};

export function describeError(error: unknown): string {
  if (error instanceof ApiClientError) {
    const problems = (error.details as { problems?: string[] } | undefined)?.problems;
    if (problems?.length) return problems.map((p) => PROBLEM_TEXT[p] ?? p).join(" ");
    const fields = (error.details as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors;
    if (fields && Object.keys(fields).length) return `${error.message} ${Object.entries(fields).map(([k, v]) => `${k}: ${v.join(", ")}`).join("; ")}`;
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}
