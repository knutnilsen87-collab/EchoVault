import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") }
  },
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    globalSetup: ["test/global-setup.ts"],
    setupFiles: ["test/setup-env.ts"],
    fileParallelism: false, // integration tests share one database
    testTimeout: 30_000,
    hookTimeout: 60_000
  }
});
