# Codex PR Prompt Library — EchoVault

Use one prompt per PR. Do not batch unrelated work.

## Global Codex rules
- Treat `10_Starter_Kit/repo` as the implementation root.
- Preserve product/design intent unless a spec conflict blocks implementation.
- Make the smallest change that creates verified progress.
- Do not introduce real payment capture, real storage mutation, or production credentials.
- Every PR must update or confirm:
  - changed files
  - validation commands
  - rollback note
  - unresolved assumptions

## PR 01 prompt — installable scaffold
You are implementing PR 01 for EchoVault.

Goal:
Make the starter repo installable, typecheckable, and locally runnable.

Constraints:
- Use pnpm workspace.
- Keep Next.js web app in `apps/web`.
- Keep domain contracts in `packages/domain`.
- Do not implement real auth, Stripe, storage, or EchoScore production logic.
- Preserve design-lock files.

Required validation:
```bash
pnpm install
pnpm typecheck
node scripts/verify-contracts.mjs
```

Deliver:
- concise PR summary
- changed file list
- validation output
- rollback note

## PR 02 prompt — database migration contract
Goal:
Make the SQL schema executable against a local Postgres-compatible database and align TypeScript domain types with the migration.

Constraints:
- Do not rename core entities unless required by migration failure.
- Do not add ORM unless explicitly chosen in the repo.
- Preserve immutable license and proof-of-effort semantics.

Required validation:
```bash
node scripts/verify-contracts.mjs
node scripts/verify-sql-migration.mjs
pnpm typecheck
```

## PR 03 prompt — artist intake vertical slice
Goal:
Implement draft upload metadata flow with fixture storage and proof-of-effort input capture.

Constraints:
- No real high-res upload yet.
- Store only metadata in the app stub.
- Use domain schemas for validation.
- Keep admin approval locked until proof fields exist.

Required validation:
```bash
pnpm typecheck
node scripts/smoke-web-routes.mjs
node scripts/verify-contracts.mjs
```

## PR 04 prompt — EchoScore fixture
Goal:
Wire web route to fixture EchoScore service contract.

Constraints:
- Fixture only.
- No real model scoring.
- Return deterministic score and reason codes.
- Explicitly mark score as non-production.

## PR 05 prompt — admin approval
Goal:
Implement basic approval transition rules.

Constraints:
- Approval must require proof-of-effort and fixture EchoScore result.
- Rejection must capture reason.
- No public catalog visibility before approval.

## PR 06 prompt — buyer catalog
Goal:
Expose approved vault tracks in read-only catalog.

Constraints:
- Only approved assets.
- No download link before paid license.
- Preserve design-system tokens.

## PR 07 prompt — Stripe test checkout stub
Goal:
Create checkout session stub matching Stripe integration boundary.

Constraints:
- Test mode only.
- No real secret in repo.
- No fulfillment without verified webhook.

## PR 08 prompt — webhook fulfillment stub
Goal:
Implement webhook handler with idempotency and license creation stub.

Constraints:
- Webhook verification must be explicit.
- Idempotency key required.
- License record immutable after creation.

## PR 09 prompt — certificate and signed download
Goal:
Create certificate JSON and signed URL stub.

Constraints:
- URL is fake/dev only unless storage adapter is configured.
- Certificate references immutable license id.

## PR 10 prompt — end-to-end smoke
Goal:
Add one deterministic smoke path from artist draft to licensed download stub.

Constraints:
- No brittle external services.
- Test should run locally without secrets.
