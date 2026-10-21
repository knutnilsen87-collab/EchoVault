# Roles and Permissions Matrix

| Role | Can view | Can create | Can edit | Can delete | Can administer | Notes |
|---|---|---|---|---|---|---|
| Anonymous visitor | Public catalog, public track pages | No | No | No | No | Preview-only. |
| Buyer | Approved tracks, own licenses, own downloads | Checkout, disputes | Own profile, project/URL metadata | No | No | High-res only after purchase. |
| Artist | Own dashboard, own submissions, own earnings | Track drafts, PoE submissions | Drafts and change requests | Withdraw draft | No | Cannot self-approve. |
| Reviewer | Review queue, track details, PoE, EchoScore | Review decisions | Review notes, status transitions | No | Limited | Cannot alter purchase ledger. |
| Admin | All operational data | Most objects | Most objects | Suspend/soft-delete | Yes | All admin actions audit-logged. |
| Support operator | Buyer licenses, disputes, delivery status | Disputes/support notes | Support notes | No | Limited | No immutable purchase edits. |
| Finance operator | Purchases, payout reports | Adjustments if implemented | Finance notes | No | Limited | Must not edit purchase facts. |
| Developer | Non-production data, logs | No product actions in prod | No prod data edits except break-glass | No | No | Least privilege. |
