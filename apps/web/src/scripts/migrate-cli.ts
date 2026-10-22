import "./load-env";
import { closePool } from "../server/db";
import { migrate } from "./migrate";

// Separate entry point (no "am I main?" check) so it behaves the same on Windows, macOS and Linux.
migrate()
  .then(() => closePool())
  .catch(async (error) => {
    console.error((error as Error).message);
    await closePool();
    process.exit(1);
  });
