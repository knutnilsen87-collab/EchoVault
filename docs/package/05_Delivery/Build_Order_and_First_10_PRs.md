# Build Order and First 10 PRs

## Build principle
Prefer one working vertical slice before broad horizontal expansion.

The first vertical slice is:
Artist draft upload → admin approval → buyer catalog preview → Stripe test checkout → license record → certificate stub → signed file link.

## First 10 PRs
1. **Repo scaffold + design lock** — Next.js app, TypeScript, Tailwind, lint/format/test baseline, exact EchoVault `tailwind.config.ts`, global fonts, dark/neon tokens, liquid-glass drawer primitives and first UI components.
2. **Database + migrations** — users, tracks, files, PoE, analysis, review, licenses, terms, audit logs.
3. **Auth/RBAC skeleton** — role guards and protected route helpers.
4. **Object storage abstraction** — private upload/download helper, checksum, signed URL support.
5. **Artist track draft + file upload** — create draft, register WAV, store file metadata.
6. **PoE form + submit action** — required fields, warranty checkbox, submit status.
7. **EchoScore job skeleton** — queue job, FastAPI health endpoint, fixture analysis, store result.
8. **Admin review queue** — approve/reject/request changes, audit logs.
9. **Buyer catalog + preview** — approved tracks only, player, track detail, tier cards.
10. **Stripe checkout + webhook fulfillment** — session, verified webhook, idempotent license, certificate stub, signed download.

## PRs 11–15
11. PDF certificate generation with real template.
12. License dashboard and certificate verification page.
13. Dispute intake and suspension flow.
14. Analytics events and observability dashboard.
15. Hardening: E2E tests, security checks, legal copy finalization.
