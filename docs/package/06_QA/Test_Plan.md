# Test Plan

## Test layers
- Unit: pricing/tier rules, status transitions, permissions, license split calculation.
- Integration: Stripe checkout/session/webhook, database transactions, object storage signed URL, EchoScore callback.
- End-to-end: buyer purchase flow, artist submit flow, admin review flow, dispute/suspension flow.
- Manual exploratory: audio preview UX, admin review ergonomics, license tier clarity.
- UAT/domain validation: creators/agencies test whether license/certificate is understandable; reviewers test PoE rubric consistency.

## Highest-risk areas
- Duplicate payment fulfillment.
- High-res file leakage.
- Legal overclaim in UI/copy.
- Review queue inconsistency.
- EchoScore false confidence.
- Signed URL expiry / download failures.
- Track suspension not blocking future purchases.

## Required pre-release test evidence
- Stripe webhook duplicate event test log.
- Signed URL expiry test.
- Access-control test for buyer/license ownership.
- Admin audit log test.
- E2E purchase flow recording/screenshot.
- Legal copy review approval.
