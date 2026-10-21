# Analytics Tracking Plan

## Principles
Track only what helps validate MVP, improve UX or detect operational failure. Avoid storing unnecessary sensitive prompt data or buyer project data in analytics.

## Event taxonomy
| Event | Trigger | Key properties | Priority |
|---|---|---|---|
| `catalog_viewed` | Buyer opens catalog | referrer, filters_count | P1 |
| `search_performed` | Buyer searches/filter | query_hash, genre, mood, bpm_range | P1 |
| `track_preview_started` | Preview starts | track_id, source_page | P0 |
| `track_detail_viewed` | Track detail opened | track_id | P0 |
| `license_tier_selected` | Tier clicked | track_id, tier, price | P0 |
| `checkout_started` | Stripe session created | track_id, tier, buyer_id | P0 |
| `checkout_completed` | Stripe success | session_id, track_id, tier | P0 |
| `license_created` | Webhook creates license | license_id, track_id, tier | P0 |
| `certificate_generated` | PDF generated | license_id | P0 |
| `download_link_created` | Signed URL created | license_id, file_kind | P0 |
| `download_completed` | Buyer downloads | license_id, file_kind | P0 |
| `track_submitted` | Artist submits | track_id | P0 |
| `analysis_job_completed` | EchoScore finishes | track_id, score_bucket | P0 |
| `track_reviewed` | Admin decision | track_id, decision, reason_code | P0 |
| `dispute_opened` | Buyer/admin opens dispute | license_id, track_id, reason_category | P0 |

## Conversion funnel
Catalog viewed → track detail viewed → preview started → license tier selected → checkout started → checkout completed → license created → download completed.

## Privacy constraints
- Hash or avoid raw free-text search queries if they can contain private project details.
- Do not send full PoE prompts to third-party analytics by default.
- Do not send buyer project URLs to analytics unless necessary and disclosed.
