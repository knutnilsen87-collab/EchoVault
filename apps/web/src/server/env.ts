import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ECHOVAULT_PROVIDER_MODE: z.enum(["stub", "live"]).default("stub"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).default("postgresql://echovault:echovault@localhost:5432/echovault"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).default("whsec_local_dev_secret"),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default(".storage"),
  S3_BUCKET_PRIVATE: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  ECHOSCORE_SERVICE_URL: z.string().url().default("http://localhost:8001"),
  ECHOSCORE_SERVICE_TOKEN: z.string().min(8).default("change-me-service-token"),
  /** Stub checkout page/endpoint. On by default outside production; must be opted into for prod-built demos/CI. */
  ECHOVAULT_ALLOW_STUB_CHECKOUT: z.enum(["true", "false"]).optional(),
  /** Sign in with Google (OAuth 2.0 / OpenID Connect). Both must be set to enable it. */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional()
});

export type EchoVaultEnv = z.infer<typeof EnvSchema>;

const LIVE_REQUIRED = ["DATABASE_URL", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "AUTH_SECRET"] as const;
const S3_REQUIRED = ["S3_BUCKET_PRIVATE", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const;

export function parseEnv(source: Record<string, string | undefined>): EchoVaultEnv {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    // Only report key names, never values.
    const keys = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${keys}`);
  }
  const env = result.data;
  const missing: string[] = [];
  if (env.ECHOVAULT_PROVIDER_MODE === "live") {
    missing.push(...LIVE_REQUIRED.filter((k) => !source[k]));
    if (env.STORAGE_DRIVER !== "s3") missing.push("STORAGE_DRIVER=s3");
    if (env.STRIPE_WEBHOOK_SECRET === "whsec_local_dev_secret") missing.push("STRIPE_WEBHOOK_SECRET (real value)");
  }
  if (env.STORAGE_DRIVER === "s3") missing.push(...S3_REQUIRED.filter((k) => !source[k]));
  if (missing.length > 0) throw new Error(`Missing live provider env: ${missing.join(", ")}`);
  return env;
}

let cached: EchoVaultEnv | null = null;

export function env(): EchoVaultEnv {
  if (!cached) cached = parseEnv(process.env);
  return cached;
}

/** Tests only. */
export function resetEnvCache(): void {
  cached = null;
}

export function isStubMode(): boolean {
  return env().ECHOVAULT_PROVIDER_MODE === "stub";
}

/** The fake Stripe page + signer. Never available in live mode. */
export function stubCheckoutEnabled(): boolean {
  const e = env();
  if (e.ECHOVAULT_PROVIDER_MODE !== "stub") return false;
  if (e.ECHOVAULT_ALLOW_STUB_CHECKOUT) return e.ECHOVAULT_ALLOW_STUB_CHECKOUT === "true";
  return e.NODE_ENV !== "production";
}

export function googleEnabled(): boolean {
  const e = env();
  return Boolean(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET);
}
