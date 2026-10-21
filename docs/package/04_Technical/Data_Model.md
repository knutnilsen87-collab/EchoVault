# Data Model

## Storage strategy
- Primary DB: PostgreSQL.
- Secondary stores: Object storage for audio, artwork and certificate files.
- Cache: Optional Redis for queue state/session acceleration; not source of truth.
- File/blob storage: Private S3-compatible bucket with signed URLs for delivery.

## Data classes
| Data | Store | Sensitivity | Notes |
|---|---|---|---|
| User account | Postgres | Confidential | Email, role, billing refs |
| Artist profile | Postgres | Internal/public mixed | Public artist name can be visible |
| Track metadata | Postgres | Public after approval | Genre, BPM, title, tags |
| High-res WAV | Object storage | Confidential | Private, signed URL only |
| Preview MP3 | Object storage/CDN | Public-ish | Can be publicly streamable for approved tracks |
| PoE full record | Postgres/object storage | Confidential/internal | Public summary only |
| EchoScore result | Postgres JSONB | Internal/public summary | Score badge public, details internal as needed |
| License record | Postgres | Confidential | Buyer/project/purchase data |
| Certificate PDF | Object storage | Confidential/shareable by buyer | Optional public verify view |
| Audit logs | Postgres | Confidential | Admin/support/security use |
| Dispute records | Postgres | Sensitive | Legal/support context |

## Retention and deletion notes
- Purchased license records: retain for legal/accounting duration; append-only.
- Audit logs: retain at least 2 years or per legal requirement.
- Unsubmitted drafts: delete after inactivity window, e.g. 90 days.
- Rejected track files: delete or archive after defined retention period, e.g. 180 days, unless dispute/legal hold.
- PoE supporting files: minimize retention; delete if not needed.
- Payment details: do not store card data; Stripe owns payment method data.
