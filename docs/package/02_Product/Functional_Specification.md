# Functional Specification

## Core capabilities
1. Track submission and review
2. Technical audio analysis through EchoScore
3. Proof of Effort capture
4. Public buyer catalog
5. License purchase and fulfillment
6. Certificate generation
7. Admin moderation and dispute handling
8. Audit logging

## Functional requirements
| ID | Requirement | Priority | Notes |
|---|---|---|---|
| FR-001 | Artists can create a track draft with title, genre, BPM, tags and description. | P0 | Metadata required before submission. |
| FR-002 | Artists can upload high-res WAV and preview/stream file. | P0 | High-res file private only. |
| FR-003 | Artists must complete PoE before submission. | P0 | Includes AI tools, DAW/manual work, warranty. |
| FR-004 | System creates an audio analysis job after submission. | P0 | Async worker. |
| FR-005 | EchoScore stores score and machine-readable feedback. | P0 | Not a legal score. |
| FR-006 | Admin can approve/reject/request changes. | P0 | Must create review record and audit event. |
| FR-007 | Buyers can browse approved tracks. | P0 | Only approved/non-suspended tracks visible. |
| FR-008 | Buyers can preview compressed audio. | P0 | No high-res access pre-purchase. |
| FR-009 | Buyers can choose Creator/Pro/Agency tier. | P0 | Terms version captured at purchase. |
| FR-010 | Stripe Checkout session can be created with metadata. | P0 | Server-side only. |
| FR-011 | Stripe webhook creates a purchased license idempotently. | P0 | Unique `stripe_session_id`. |
| FR-012 | System generates a PDF license certificate. | P0 | Store in private bucket. |
| FR-013 | Buyer can download high-res file via expiring signed URL. | P0 | URL expiry required. |
| FR-014 | Admin can suspend tracks. | P0 | Stops future sales. |
| FR-015 | Buyer/admin can open dispute. | P1 | MVP support workflow. |
| FR-016 | Artist dashboard shows approval/rejection and earnings summary. | P1 | Lightweight for MVP. |
| FR-017 | Public certificate verification page exists. | P1 | Helps trust/sharing. |

## States and transitions
### Track lifecycle
`draft → submitted → analysis_pending → needs_human_review → approved → live`

Exception states: `analysis_failed`, `rejected`, `changes_requested`, `suspended`.

### License lifecycle
`checkout_created → payment_pending → paid → certificate_generated → delivered`

Exception states: `payment_failed`, `fulfillment_failed`, `refunded`, `disputed`.

### Dispute lifecycle
`open → investigating → resolved_valid → resolved_invalid → escalated`
