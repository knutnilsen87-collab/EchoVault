# Safe Execution Architecture

## Goal
Prevent destructive, irreversible or unsafe operations during development and AI-agent-assisted coding.

## Rules
- No script may delete production data by default.
- All destructive scripts require explicit `--confirm-production` style flags.
- Migrations must be reversible or include documented rollback.
- Seed scripts must target local/staging unless explicitly configured.
- Object storage cleanup scripts must dry-run by default.
- AI coding agents must not modify legal terms, security configs or payment logic without human review.
- Production credentials must never be available to local coding agents.
- Payment webhook changes require tests before merge.
- License ledger schema changes require migration review.

## Environments
- Local: fake Stripe/test keys, local DB, local/minio storage optional.
- Staging: Stripe test mode, staging bucket, staging DB.
- Production: locked credentials, manual deploy approval, backups enabled.

## Protected domains
- Stripe webhook handler
- Purchased license creation
- License terms versions
- Audit logs
- Track suspension/dispute logic
- Signed URL generation
- Admin RBAC
