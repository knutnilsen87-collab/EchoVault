import { defineConfig } from "@playwright/test";

/**
 * Full-stack browser tests. Expects the stack running in stub mode:
 *   Postgres (migrated + `pnpm db:seed --demo`), EchoScore on :8001, `pnpm worker`, Next on :3000.
 * CI starts all of these (see .github/workflows/ci.yml).
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
});
