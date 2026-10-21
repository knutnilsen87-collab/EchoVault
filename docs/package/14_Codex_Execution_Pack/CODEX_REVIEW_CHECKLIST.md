# Codex Review Checklist

A PR is not acceptable unless all relevant boxes are true.

## Scope
- [ ] One bounded goal only.
- [ ] No unrelated refactor.
- [ ] No production credentials or real money movement.
- [ ] No design-lock file rewritten for convenience.

## Architecture
- [ ] Code is in the owning layer from `ROUTE_OWNERSHIP_MAP.md`.
- [ ] Domain rules live in `packages/domain`, not buried in UI routes.
- [ ] External providers are behind explicit adapters/stubs.
- [ ] No duplicated status enums or incompatible local types.

## Safety
- [ ] Webhook path is idempotent.
- [ ] License creation is append-only / immutable.
- [ ] Downloads require a license boundary.
- [ ] Admin approval cannot bypass Proof of Effort.

## Verification
- [ ] Commands were run and pasted in PR notes.
- [ ] At least one narrow test or smoke check covers the changed behavior.
- [ ] Remaining assumptions are listed.
- [ ] Rollback is clear.
