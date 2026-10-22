import "../scripts/load-env";
import { closePool } from "../server/db";
import { drainJobs } from "../server/worker";
import { logEvent } from "../server/logger";

let stopping = false;
for (const sig of ["SIGINT", "SIGTERM"] as const) process.on(sig, () => (stopping = true));

logEvent({ level: "info", event: "worker_started" });
while (!stopping) {
  try {
    const n = await drainJobs(undefined, 20);
    if (n === 0) await new Promise((r) => setTimeout(r, 2000));
  } catch (error) {
    logEvent({ level: "error", event: "worker_loop_error", details: { error: (error as Error).message } });
    await new Promise((r) => setTimeout(r, 5000));
  }
}
await closePool();
logEvent({ level: "info", event: "worker_stopped" });
