import { spawn, type ChildProcess } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const DB = process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:5432/echovault_test";
const PORT = process.env.ECHOSCORE_TEST_PORT ?? "8011";
let echoscore: ChildProcess | null = null;

async function waitFor(url: string, ms: number) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`EchoScore test service did not start at ${url}`);
}

export async function setup() {
  // Fresh schema every run, built by the real migration runner.
  const client = new pg.Client({ connectionString: DB });
  await client.connect();
  await client.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await client.end();
  process.env.DATABASE_URL = DB;
  process.env.AUTH_SECRET ??= "test-secret-test-secret-test-secret-0000";
  const { migrate } = await import("../src/scripts/migrate");
  await migrate(() => undefined);
  const { closePool } = await import("../src/server/db");
  await closePool();
  await rm(process.env.TEST_STORAGE_DIR ?? "/tmp/echovault-test-storage", { recursive: true, force: true });

  // Real EchoScore service (Python) — the integration suite exercises actual audio analysis.
  echoscore = spawn(process.env.PYTHON ?? "python3", ["-m", "uvicorn", "app.main:app", "--port", PORT, "--log-level", "warning"], {
    cwd: path.resolve(__dirname, "../../../services/echoscore"),
    env: { ...process.env, ECHOSCORE_SERVICE_TOKEN: "test-service-token" },
    stdio: ["ignore", "inherit", "inherit"]
  });
  await waitFor(`http://127.0.0.1:${PORT}/health`, 20_000);
}

export async function teardown() {
  echoscore?.kill("SIGTERM");
}
