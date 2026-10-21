# Database Seed and Fixture Plan

Codex should add deterministic seed data before building UI flows that depend on database state.

## Seed file target

`10_Starter_Kit/repo/infra/db/seeds/0001_demo_catalog.sql`

## Minimum records

- 1 artist user
- 1 buyer user
- 1 admin user
- 2 approved/live tracks
- 1 draft track
- 1 rejected track
- active license terms for each tier

## Rules

- Demo rows must use stable UUIDs.
- Approved/live tracks are visible in public catalog.
- Draft/rejected tracks must never appear in public catalog.
- Seed data must not contain real personal data.
- Seed data must be safe to rerun locally when practical.
