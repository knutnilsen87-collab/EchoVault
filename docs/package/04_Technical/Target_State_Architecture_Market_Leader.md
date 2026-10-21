# Target-State Architecture for Market Leadership

## Purpose

This document defines the architecture EchoVault should grow toward if the MVP proves real demand. The goal is to avoid rebuilding the platform when moving from MVP to marketplace, enterprise and API scale.

## Architecture principle

Start as a modular monolith with isolated domains. Evolve to service boundaries only where scale, compliance, team ownership or reliability requires it.

Do not prematurely split everything into microservices.

## Target domains

| Domain | Responsibility | MVP form | Mature form |
|---|---|---|---|
| Identity & RBAC | Users, roles, teams, permissions | Next.js/Auth provider | Dedicated auth/RBAC policy layer |
| Catalog | Tracks, metadata, search visibility | Postgres + basic search | Search index + ranking + catalog intelligence |
| Asset storage | Preview/high-res/stems/certificates | S3/R2 signed URLs | Lifecycle policies, checksums, CDN, secure delivery |
| Audio analysis | EchoScore jobs | FastAPI worker | Versioned analysis pipeline with job orchestration |
| Provenance | PoE, creator warranties, source declarations | JSONB records | Provenance graph with snapshots and audit views |
| Review | Human review workflows | Admin dashboard | Risk-prioritized queues, QA, reviewer metrics |
| Licensing | Terms, tiers, entitlements, certificates | Postgres + PDF | Entitlement engine, terms versioning, upgrade paths |
| Payments | Checkout, webhooks, payouts | Stripe Checkout | Stripe Connect/payout logic, invoicing, credits |
| Disputes | Claims, suspensions, resolution | Basic table | Case management and legal evidence pack |
| Analytics | Product and marketplace metrics | Event table | Warehouse, dashboards, cohort analysis |
| API/Integrations | Partner access | Deferred | Scoped external API, webhooks, partner reporting |
| Enterprise | Teams, SSO, procurement | Deferred | SSO, billing, audit exports, admin policies |

## Key system invariants

These must be true at all levels:

1. **No high-res file is public.**
2. **Every license has a terms version.**
3. **Every certificate maps to one immutable purchase record.**
4. **Every track approval maps to a review policy version.**
5. **Every EchoScore result maps to analysis version and file checksum.**
6. **Every PoE snapshot used for a purchase is preserved.**
7. **Disputes can suspend future sales without deleting historical records.**
8. **Public trust claims are backed by stored evidence.**
9. **Webhook retries are idempotent.**
10. **Admin state changes create audit logs.**

## Target data architecture

### Source of truth
PostgreSQL remains the transactional source of truth for:
- users
- tracks
- files
- PoE
- reviews
- licenses
- terms versions
- payments
- disputes
- audit logs

### Search index
Use a separate search index when catalog search needs exceed Postgres:
- OpenSearch, Meilisearch, Typesense or similar.
- Index only approved/public metadata.
- Never expose private PoE fields.
- Ranking must be explainable enough for trust-sensitive marketplace decisions.

### Analytics warehouse
Add event pipeline and warehouse when volume justifies it:
- buyer search events
- preview events
- license clicks
- checkout starts/completions
- download events
- support/dispute events
- artist submission and review outcomes

### Provenance graph
When product matures, model provenance as more than JSON:
- track
- file checksum
- creator
- AI tool/model if known
- production process
- declared samples/assets
- review decision
- license snapshot
- disputes/claims
- certificate

## Mature platform capabilities

### Certificate verification service
- Public/private verification URL.
- Confirms certificate validity.
- Shows allowed use summary.
- Shows if track is currently suspended from new purchases.
- Preserves historical purchase validity language as reviewed by legal counsel.

### Entitlement service
- Determines what buyer can download or use.
- Supports license upgrades.
- Supports team accounts.
- Supports enterprise/custom terms.
- Exposes entitlement state to API partners.

### Risk scoring
Risk scoring should assist reviewers, not replace legal judgment.

Inputs may include:
- artist history
- incomplete PoE
- declared AI tool
- suspicious file metadata
- similarity flags if available
- prior disputes
- abnormal submission volume
- review inconsistencies

### API layer
External API should support:
- search approved catalog
- preview track
- create checkout session or license transaction
- retrieve certificate metadata
- receive webhooks for license/dispute/suspension events

API should not allow:
- public access to high-res files without entitlement
- external mutation of review decisions
- bypassing terms versioning
- partner-specific hidden rights that do not map to stored entitlements

## Reliability targets by maturity level

| Capability | MVP | Product-ready | Market-leader |
|---|---:|---:|---:|
| Checkout/license creation | Manual tested | Automated integration tests | High reliability with alerts and replay tools |
| File delivery | Signed URL | Durable dashboard access | CDN/storage policy, abuse detection |
| Analysis jobs | Batch worker | Retry/backoff and monitoring | Versioned pipeline, queue scaling |
| Review | Basic admin | SLA queues | QA, risk prioritization, reviewer metrics |
| Certificates | PDF generation | Verification page | Shareable, audit-grade, enterprise export |
| Disputes | Intake table | Case workflow | Evidence pack, legal escalation, reporting |
| Analytics | Basic events | Dashboards | Demand forecasting and marketplace intelligence |

## Migration path

### Phase 1 — MVP
- Modular monolith.
- Postgres.
- Object storage.
- FastAPI audio worker.
- Stripe checkout.
- Admin review.

### Phase 2 — Product-ready
- Search index.
- Event tracking.
- Public certificate verification.
- License dashboard.
- Dispute workflow.
- Better review queues.

### Phase 3 — Platform-ready
- API gateway.
- Partner keys/scopes.
- Team accounts.
- Entitlement service.
- Analytics warehouse.
- Provenance graph.

### Phase 4 — Category infrastructure
- Enterprise controls.
- Compliance/audit exports.
- Partner integrations.
- Advanced risk scoring.
- Marketplace intelligence.
- Public trust reports.

## Non-negotiable technical red lines

- Do not use AI-generated legal summaries as binding license text.
- Do not delete or mutate purchased license history.
- Do not change old terms retroactively.
- Do not expose private PoE or artist process details accidentally.
- Do not call EchoScore a copyright detector.
- Do not approve tracks solely by automation.
- Do not build consumer streaming scale before licensing demand is proven.
