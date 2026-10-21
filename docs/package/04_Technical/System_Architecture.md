# System Architecture

## Logical modules
1. Identity & RBAC — users, roles, sessions and access checks.
2. Catalog — approved track discovery, track detail, metadata, search filters and public visibility.
3. Artist Submission — drafts, file upload, metadata, PoE form and submit flow.
4. EchoScore Analysis — audio QA jobs, analysis execution and score/feedback storage.
5. Admin Review — queue, approve/reject/request changes and audit events.
6. Licensing — tiers, terms versions, certificate generation and buyer license dashboard.
7. Payments — Stripe Checkout sessions, webhook verification and idempotent fulfillment.
8. Storage/Delivery — private file storage, checksums, signed URLs and certificates.
9. Disputes & Support — buyer disputes, track suspension workflow and resolution notes.
10. Observability — logs, metrics, alerts, correlation IDs and health checks.

## Boundaries
- Payments must not directly expose file URLs; license service coordinates fulfillment after verified payment.
- Admin review changes track status; catalog only reads approved/live state.
- EchoScore writes analysis result; admin makes final approval decision.
- Disputes can suspend future sales but must not delete historical purchase records.

## External systems
- Stripe: payment and checkout.
- S3/R2: audio and certificate storage.
- Email provider: receipts and operational emails.
- Analytics provider: product analytics.
- Virus scanner: uploaded file safety.
