# Open assumptions for Codex

These should be resolved during implementation, not guessed silently.

1. Auth provider is not selected.
   - Temporary seam: `apps/web/src/server/auth.ts`
   - Do not spread auth-provider code across route handlers.

2. Database client is not selected.
   - Temporary seam: `apps/web/src/server/db.ts`
   - Prefer one repository layer before adding ORM-specific patterns.

3. Object storage provider is not selected.
   - Temporary seam: `apps/web/src/server/storage.ts`
   - High-res WAV files must remain private.

4. Stripe product/price IDs are placeholders.
   - Temporary seam: `apps/web/src/server/checkout.ts`
   - Webhook is the only source for paid license creation.

5. Certificate generation starts as a stub.
   - Do not claim legal sufficiency until counsel reviews terms/certificate copy.

6. EchoScore is fixture-only.
   - It proves workflow wiring, not audio quality.
