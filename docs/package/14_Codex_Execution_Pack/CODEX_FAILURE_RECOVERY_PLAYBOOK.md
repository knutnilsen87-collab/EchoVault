# Codex Failure Recovery Playbook

Use this when Codex gets stuck, overbuilds, or produces failing verification.

## If install fails

1. Do not rewrite the architecture.
2. Check package manager version in root `package.json`.
3. Fix the smallest dependency/package name mismatch.
4. Re-run only the failed command first.

## If TypeScript fails

1. Fix imports and exported types before changing logic.
2. Do not create duplicate domain types.
3. Add missing exports to the owning package index.
4. Re-run `pnpm typecheck`.

## If API contract verification fails

1. Replace raw `Response.json` with `apiSuccess` or `apiError`.
2. Add missing error code to `packages/domain/src/api-contracts.ts`.
3. Add or update fixture in `tests/fixtures`.

## If database work is blocked

1. Keep SQL migration canonical.
2. Add a comment naming the unresolved provider assumption.
3. Do not introduce ORM-specific schema until the DB client decision is locked.

## If scope expands

Stop and produce a status note with:

- Current PR goal
- New request detected
- Why it is out of scope
- Proposed follow-up PR
