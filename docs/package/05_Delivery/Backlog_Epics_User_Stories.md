# Backlog / Epics / User Stories

## Epic 1 — Identity and RBAC
- User story: As a user, I can sign up and have a role so the system shows only allowed actions.
- Acceptance criteria: buyer/artist/reviewer/admin roles exist; protected routes enforce permissions; unauthorized requests return 401/403.

## Epic 2 — Artist submission
- User story: As an artist, I can upload a track and PoE so it can be reviewed for sale.
- Acceptance criteria: draft created; WAV stored privately; PoE required before submit; status changes logged.

## Epic 3 — EchoScore analysis
- User story: As an admin, I can see technical audio QA before approving a track.
- Acceptance criteria: job runs after submission; metrics stored; failures/retries visible.

## Epic 4 — Admin review
- User story: As a reviewer, I can approve/reject/request changes with reason codes.
- Acceptance criteria: review decision stored; audit log created; only approved/live tracks visible publicly.

## Epic 5 — Buyer catalog and preview
- User story: As a buyer, I can browse and preview approved tracks.
- Acceptance criteria: catalog filters work; preview file streams; high-res file inaccessible.

## Epic 6 — Checkout and license fulfillment
- User story: As a buyer, I can pay for a license and receive proof/files.
- Acceptance criteria: Stripe session created; webhook creates one license only; certificate generated; signed download URL works.

## Epic 7 — Disputes and suspension
- User story: As support/admin, I can respond to claims and suspend tracks.
- Acceptance criteria: dispute linked to track/license; suspended track removed from catalog; existing licenses remain viewable.
