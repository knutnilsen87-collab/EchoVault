# Implementation Backlog for Codex

## Milestone 0 — Repo becomes executable
1. Installable workspace
2. Typecheck baseline
3. Contract verification script
4. CI baseline

## Milestone 1 — Domain truth
1. Canonical status enum
2. VaultTrack, Artist, ProofOfEffort, License types
3. Zod schemas for API input/output
4. Transition rules for draft → submitted → scored → approved → published

## Milestone 2 — First artist flow
1. Draft track metadata route
2. Proof of effort route
3. Fixture storage refs
4. Submitted track list for admin

## Milestone 3 — Trust and approval
1. EchoScore fixture service integration
2. Approval/rejection route
3. Catalog visibility rule
4. Audit log stub

## Milestone 4 — Buyer flow
1. Catalog read endpoint
2. Checkout session stub
3. Stripe webhook stub
4. Immutable license creation
5. Certificate + signed URL stub

## Milestone 5 — Verification hardening
1. SQL migration verifier
2. API route smoke tests
3. Idempotency test
4. Catalog visibility test
5. License immutability test
