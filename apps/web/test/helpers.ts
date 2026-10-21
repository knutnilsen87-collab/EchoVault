type Handler = (req: Request, ctx?: any) => Promise<Response>;

export type ApiResult<T = any> = { status: number; body: T; headers: Headers };

export async function call<T = any>(
  handler: Handler,
  opts: { method?: string; path?: string; token?: string; json?: unknown; form?: FormData; params?: Record<string, string>; headers?: Record<string, string>; raw?: string } = {}
): Promise<ApiResult<T>> {
  const headers = new Headers(opts.headers);
  if (opts.token) headers.set("authorization", `Bearer ${opts.token}`);
  let body: BodyInit | undefined;
  if (opts.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(opts.json);
  } else if (opts.form) body = opts.form;
  else if (opts.raw !== undefined) body = opts.raw;
  const req = new Request(`http://localhost:3000${opts.path ?? "/"}`, { method: opts.method ?? (body ? "POST" : "GET"), headers, body });
  const res = await handler(req, { params: Promise.resolve(opts.params ?? {}) });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* non-JSON (redirects, files) */
  }
  return { status: res.status, body: parsed as T, headers: res.headers };
}

export { musicWav } from "../src/scripts/synth";

export function wavForm(bytes: Uint8Array, name = "master.wav"): FormData {
  const form = new FormData();
  form.set("kind", "high_res_wav");
  form.set("file", new File([bytes as BlobPart], name, { type: "audio/wav" }));
  return form;
}

export const validPoe = {
  creation_mode: "hybrid_producer",
  ai_tools_used: ["Suno"],
  process_summary: "Generated stems with Suno, re-arranged, re-recorded bass and mixed in Ableton.",
  daw_manual_work: "Ableton arrangement, EQ, mastering chain",
  time_spent_bucket: "3_10h",
  samples_used: "owned",
  sample_notes: "own field recordings from Oslo harbour",
  voice_or_likeness_used: false,
  named_artist_imitation: false,
  rights_warranty_accepted: true,
  private_notes: "PRIVATE full prompt: secret sauce"
};
