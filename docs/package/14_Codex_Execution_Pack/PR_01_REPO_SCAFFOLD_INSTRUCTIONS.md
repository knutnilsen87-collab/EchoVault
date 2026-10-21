# PR 01 — Repo scaffold + design lock

## Goal
Make `10_Starter_Kit/repo` installable and locally runnable without changing the product design.

## Codex instructions
1. Use `pnpm`.
2. Preserve the existing EchoVault Tailwind tokens.
3. Do not replace the package layout.
4. Wire `apps/web`, `packages/domain`, `packages/testing`.
5. Keep `services/echoscore` as a separate Python FastAPI service.
6. Do not implement real Stripe, auth, or storage in this PR.

## Success condition
- `pnpm install` completes.
- `pnpm --filter @echovault/web typecheck` passes.
- `pnpm --filter @echovault/domain typecheck` passes.
- `node scripts/verify-contracts.mjs` passes.
- Web app renders the starter catalog page.

## Rollback
Revert package manifests and generated starter route files only.
