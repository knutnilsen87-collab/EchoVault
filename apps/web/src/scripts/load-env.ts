/** Scripts (migrate/seed/worker) run outside Next, so load the same env files Next would. */
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    /* file absent — fine */
  }
}
