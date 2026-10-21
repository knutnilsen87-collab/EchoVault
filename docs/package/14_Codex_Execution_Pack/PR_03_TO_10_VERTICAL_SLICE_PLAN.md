# PR 03–10 — Bounded implementation plan

## PR 03 Auth/RBAC skeleton
Create stable `requireUser()` and role guards. Replace the dev stub without changing route handler call sites.

## PR 04 Object storage abstraction
Implement private upload/download helper, checksum, and signed URL support behind `src/server/storage.ts`.

## PR 05 Artist track draft + file upload
Implement draft creation and file registration. Do not allow public high-res storage keys.

## PR 06 PoE form + submit action
Validate Proof of Effort using `packages/domain/src/api-schemas.ts`. Block named-artist imitation and missing warranty.

## PR 07 EchoScore job skeleton
Call `services/echoscore`; store `echo_score_analyses`; move track to `needs_human_review` on pass.

## PR 08 Admin review queue
Approve/reject/request changes with append-only `track_reviews` and `audit_logs`.

## PR 09 Buyer catalog + preview
Expose only `approved`/`live` tracks. Use stream/preview file only, never high-res.

## PR 10 Stripe checkout + webhook fulfillment
Create Checkout session from approved track only. Fulfill licenses only from verified Stripe webhook. Use unique `stripe_session_id` for idempotency.
