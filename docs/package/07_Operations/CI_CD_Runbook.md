# CI/CD Runbook

## Pipelines
### Build
- Install dependencies
- Typecheck
- Compile Next.js
- Build FastAPI container if applicable

### Test
- Unit tests
- Integration tests
- API contract checks
- Migration dry run
- Lint/format check

### Package
- Build web artifact
- Build worker/service image
- Generate release metadata

### Deploy
- Deploy staging automatically on main
- Deploy production manually after release checklist
- Run migrations with approval
- Smoke test critical paths

## Promotion rules
Staging → Production requires:
- All checks green.
- No open P0 bugs.
- Stripe webhook test passes.
- Signed URL test passes.
- DB migration reviewed.
- Legal-sensitive copy approved if changed.
- Rollback path documented.

## Rollback
- Web app can rollback to previous deployment.
- Migrations require explicit rollback notes.
- Payment and license schema changes cannot be casually rolled back after production writes.
