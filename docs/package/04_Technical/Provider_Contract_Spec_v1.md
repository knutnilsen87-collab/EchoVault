# Provider Contract Spec v1

## Providers
| Provider | Purpose | Contract type | Criticality | Fallback |
|---|---|---|---|---|
| Stripe | Checkout, payment confirmation, webhooks | External SaaS/API | P0 | Payment disabled; manual invoicing for emergency beta only |
| S3/R2 | Private audio/certificate storage | External cloud storage | P0 | Alternative S3-compatible bucket |
| Email provider | Receipts, fulfillment notifications | External SaaS/API | P1 | In-app dashboard still works |
| FastAPI EchoScore | Audio technical analysis | Internal service | P0 for publishing | Admin retry/manual block |
| PostgreSQL | Source of truth | Managed DB | P0 | Backups/restore |
| Redis/Queue | Async jobs | Managed/cache | P1/P0 for processing | Direct sync fallback only for dev |
| Analytics provider | Product analytics | External SaaS | P2 | Server logs/internal events |
| Virus scanner | Uploaded file scanning | External/internal service | P1 | Manual quarantine in beta |

## Contract rules
- Critical providers need both probe and verify checks.
- Stripe webhook behavior must be tested with duplicate event delivery.
- Storage provider must support private objects and signed URLs.
- EchoScore service must return analysis version in every result.
