import { afterAll } from "vitest";

(process.env as Record<string, string>).NODE_ENV = "test";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:5432/echovault_test";
process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-0000";
process.env.ECHOVAULT_PROVIDER_MODE = "stub";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
process.env.STORAGE_DRIVER = "local";
process.env.STORAGE_LOCAL_DIR = process.env.TEST_STORAGE_DIR ?? "/tmp/echovault-test-storage";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.ECHOSCORE_SERVICE_URL = `http://127.0.0.1:${process.env.ECHOSCORE_TEST_PORT ?? "8011"}`;
process.env.ECHOSCORE_SERVICE_TOKEN = "test-service-token";

afterAll(async () => {
  const { closePool } = await import("@/server/db");
  await closePool();
});
