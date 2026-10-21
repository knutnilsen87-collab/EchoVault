# PR 02 — Database + migrations

## Goal
Turn `04_Technical/SQL_Schema_v1.sql` into the executable migration baseline.

## Codex instructions
1. Keep enum values exactly aligned with `packages/domain/src/status.ts`.
2. Do not add tables without updating the canonical domain model.
3. Add seed data only for license terms and local demo users/tracks.
4. Ensure `stripe_session_id` remains unique for webhook idempotency.
5. Add a test or script proving migration can run on a clean Postgres database.

## Success condition
- Clean database migrates successfully.
- Required tables exist: users, tracks, track_files, proof_of_effort, echo_score_analyses, track_reviews, license_terms_versions, payment_sessions, purchased_licenses, disputes, audit_logs.
- Active terms exist for creator, pro, and agency.
