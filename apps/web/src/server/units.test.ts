import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findForbiddenClaims } from "@echovault/domain";
import { musicWav } from "../../test/helpers";
import { parseWav } from "./audio";
import { parseEnv } from "./env";
import { redact } from "./logger";
import { assertSafeKey } from "./storage";

const base = { AUTH_SECRET: "x".repeat(32) };

describe("env contract", () => {
  it("defaults to safe stub mode", () => {
    expect(parseEnv(base).ECHOVAULT_PROVIDER_MODE).toBe("stub");
  });
  it("requires real provider secrets in live mode, naming keys but never values", () => {
    expect(() => parseEnv({ ...base, ECHOVAULT_PROVIDER_MODE: "live" })).toThrow(/STRIPE_SECRET_KEY.*STORAGE_DRIVER=s3/);
    expect(() => parseEnv({ AUTH_SECRET: "short" })).toThrow(/AUTH_SECRET/);
    try {
      parseEnv({ AUTH_SECRET: "hunter2" });
    } catch (e) {
      expect((e as Error).message).not.toContain("hunter2");
    }
  });
});

describe("wav parser", () => {
  it("reads format and duration", () => {
    expect(parseWav(musicWav(3))).toMatchObject({ format: "pcm", channels: 2, sampleRate: 44100, bitsPerSample: 16, durationSeconds: 3 });
  });
  it("rejects non-wav", () => {
    expect(() => parseWav(new TextEncoder().encode("ID3".padEnd(100, "x")))).toThrow("NOT_A_WAV_FILE");
  });
});

describe("storage keys", () => {
  it("rejects traversal", () => {
    for (const k of ["../etc/passwd", "tracks/../../x", "/abs", "a//b"]) expect(() => assertSafeKey(k)).toThrow();
    expect(() => assertSafeKey("tracks/abc/high_res_wav/x.wav")).not.toThrow();
  });
});

describe("logger", () => {
  it("redacts secrets at any depth", () => {
    expect(JSON.stringify(redact({ a: { stripe_secret: "sk_live", token: "t" }, ok: 1 }))).toBe('{"a":{"stripe_secret":"[REDACTED]","token":"[REDACTED]"},"ok":1}');
  });
});

describe("AC-012 legal guardrail: UI copy never promises legal safety", () => {
  it("no forbidden claims in app source", () => {
    const root = path.resolve(__dirname, "../app");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = path.join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx|ts|md)$/.test(f) && findForbiddenClaims(readFileSync(p, "utf8")).length) offenders.push(p);
      }
    };
    walk(root);
    walk(path.resolve(__dirname, "../components"));
    expect(offenders).toEqual([]);
  });
});
