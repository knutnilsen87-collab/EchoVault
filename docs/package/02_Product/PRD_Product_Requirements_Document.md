# Product Requirements Document (PRD)

## Product definition
EchoVault is a web-based licensing marketplace for AI/hybrid music. It lets artists submit tracks with Proof of Effort documentation, runs technical audio QA through EchoScore, lets admins approve/reject tracks, and lets buyers license approved tracks through Stripe with certificate and private file delivery.

## Problem statement
AI music generation creates abundant supply, but commercial buyers lack confidence in quality, provenance, licensing, claims handling and acceptable use. Existing AI generators are fast, but many buyers want a finished, curated, documented track with purchase evidence and license terms.

## JTBD
“When I need music for monetized content or a commercial project, help me quickly find a usable track, understand what I am allowed to do with it, pay once, and get proof/files without worrying that the track is low-quality or undocumented.”

## Users
- Primary: creators, small agencies, video editors, motion designers, indie game teams, SMB marketing teams.
- Secondary: AI/hybrid artists who want to sell licensed tracks.
- Admin/internal: reviewers, support operators, finance/legal operations.
- Not optimizing for yet: casual music listeners, playlist consumers, large enterprise buyers, record-label sync teams, mobile-first consumers.

## MVP scope
### In scope
- Public catalog of approved tracks
- Track detail page with preview, metadata, EchoScore summary and PoE summary
- Creator / Pro / Agency license tier selection
- Stripe Checkout session creation
- Stripe webhook fulfillment
- Immutable license ledger
- PDF license certificate generation
- Expiring signed URL for high-resolution WAV
- Buyer account/license dashboard
- Artist upload flow
- PoE submission form
- EchoScore analysis job
- Admin review queue
- Audit logs
- Track suspension/dispute intake

### Out of scope
- B2C streaming subscriptions
- Playlists and recommendation algorithms
- Mobile app
- Enterprise API
- Content ID registration
- Automated legal clearance
- Royalty accounting complexity beyond fixed split
- Social/community features

## Primary user flows
1. Buyer licensing flow: browse/search → preview → review license → pay → receive certificate and signed high-res download.
2. Artist submission flow: account → upload WAV/metadata → PoE/warranty → submit → EchoScore → human review.
3. Admin review flow: queue → inspect EchoScore/PoE/audio → approve/reject/request changes → audit log.
4. Dispute/suspension flow: buyer/admin opens dispute → optional suspension → investigation → resolution notes.

## Success criteria
- A buyer can purchase a license without manual founder intervention.
- A license cannot be duplicated by webhook retries.
- High-res files are never public.
- Every purchase references a license-terms version.
- Every public track has approved PoE and EchoScore result.
- Admin can suspend a disputed track.
- Legal copy does not claim risk-free usage.

## Release criteria
- All P0 acceptance tests pass.
- Legal counsel has reviewed buyer license, artist warranty, terms and dispute policy.
- Stripe webhook idempotency is tested.
- S3/R2 signed URL expiry is tested.
- Track review state machine is implemented.
- Observability exists for checkout, webhook, analysis jobs and downloads.
