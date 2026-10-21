# Canonical Domain Model v1

## Core entities
- User
- ArtistProfile
- Track
- TrackFile
- ProofOfEffort
- EchoScoreAnalysis
- TrackReview
- LicenseTier
- LicenseTermsVersion
- PaymentSession
- PurchasedLicense
- Certificate
- AuditLog
- Dispute

## Aggregate boundaries
### Track aggregate
Includes Track, TrackFile, ProofOfEffort, EchoScoreAnalysis and TrackReview. Owns lifecycle from draft to approved/live/suspended.

### Purchase/license aggregate
Includes PaymentSession, PurchasedLicense, Certificate and delivery links. Owns post-payment license fulfillment and immutable purchase record.

### Dispute aggregate
Includes Dispute, linked track/license, resolution notes and audit events. Owns claim/support lifecycle.

## Entity rules
| Entity | Purpose | Source of truth | Lifecycle notes |
|---|---|---|---|
| User | Account and role identity | Postgres/auth provider | Role controls access. |
| Track | Sellable music asset metadata | Postgres | Only approved/live is public. |
| TrackFile | Audio/art/certificate file refs | Postgres + object storage | Store checksum and kind. |
| ProofOfEffort | Creator provenance record | Postgres JSONB/tables | Required before submission. |
| EchoScoreAnalysis | Technical QA result | Postgres JSONB | Required before human approval. |
| TrackReview | Human approval record | Postgres | Append review decisions. |
| LicenseTermsVersion | Versioned terms by tier | Postgres | Linked at purchase. |
| PurchasedLicense | Immutable purchase/license record | Postgres | Append-only; idempotent by Stripe session. |
| Certificate | Purchase evidence file | Object storage + Postgres ref | Generated after payment. |
| AuditLog | Operational trace | Postgres | Required for admin actions. |
| Dispute | Support/legal issue | Postgres | Can suspend track. |

## Canonical statuses
Track: draft, submitted, analysis_pending, analysis_failed, needs_human_review, changes_requested, approved, live, rejected, suspended.

License: checkout_created, payment_pending, paid, certificate_generated, delivered, fulfillment_failed, disputed, refunded.

Dispute: open, investigating, resolved_valid, resolved_invalid, escalated, closed.
