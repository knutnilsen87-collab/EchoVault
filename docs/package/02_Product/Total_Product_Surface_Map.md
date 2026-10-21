# Total Product Surface Map

## Purpose

This document maps the complete mature product, not only the MVP. It defines every major surface needed for EchoVault to operate as a market-leading trusted licensing platform.

## Product layers

| Layer | Role | MVP? | Market-leader requirement |
|---|---|---:|---|
| Buyer marketplace | Search, preview and purchase tracks | Yes | Deep workflow, projects, teams, license upgrades, client sharing |
| Artist supply portal | Upload, PoE, review status and earnings | Yes | Quality coaching, analytics, creator reputation, submission optimization |
| Trust/provenance layer | EchoScore, PoE, certificate and audit trail | Yes | Standardized provenance graph, risk scoring, verification pages, dispute evidence |
| Licensing engine | Tier rules, checkout, certificate, terms version | Yes | Upgrade/downgrade paths, enterprise terms, multi-seat/team licenses, API licensing |
| Admin/moderation | Review, approve/reject, disputes | Yes | SLA queues, reviewer QA, fraud controls, policy versioning, audit dashboards |
| Analytics layer | Conversion, catalog, quality, operations | Partial | Marketplace health, buyer demand forecasting, artist scoring, risk intelligence |
| Claims/dispute operations | Intake, suspension, resolution | Partial | Claim response workflows, buyer support history, legal escalation pack |
| API/integration layer | External search/license/certificate flows | No | Partner distribution, creator tools, game/dev tools, agency integrations |
| Enterprise layer | Procurement, team permissions, invoices | No | SOC/security posture, custom terms, procurement docs, SSO, audit exports |
| Brand/category layer | Market trust and standards | Partial | Public standards, trust reports, educational content, partner ecosystem |

## Buyer-side complete product

### Buyer homepage
- Clear category promise: "trusted AI/hybrid music licensing."
- Search by use case, mood, genre, BPM, duration, vocal/instrumental, license type, commercial context and risk level.
- Featured collections organized by job-to-be-done, not only genre.
- Fast path to "I need music for YouTube / ad / game / podcast / client campaign."

### Search and discovery
**Market-leader DoD:**
- Results prioritize commercial fit, not only metadata match.
- Buyers can filter by provenance confidence, license tier, track structure, loopability, stem availability, vocal presence, safe-use constraints and price.
- Saved searches and project folders exist.
- Recommendations are explainable: "recommended because similar buyers licensed this for X use case."

### Track page
**Required mature elements:**
- Audio preview.
- Visual waveform and sections.
- License options.
- Pricing.
- Included files.
- Creator/artist profile.
- EchoScore summary.
- PoE summary.
- Provenance snapshot.
- Allowed/prohibited use.
- Similar tracks.
- Certificate preview.
- Known limitations and disclaimers.
- Support path for commercial questions.

### Project workflow
**Mature requirement:**
- Buyer can create a project, shortlist tracks, compare licenses, invite teammates/clients, leave comments, approve one, purchase, download and store certificates.
- Agency users can map licenses to client/project names.
- License records are exportable for client delivery.

### Checkout and fulfillment
**Mature requirement:**
- Checkout makes the chosen tier, terms and allowed use unambiguous.
- Purchase creates immutable license ledger entry.
- Certificate is generated immediately.
- Downloads use signed URLs.
- Receipts, invoices and certificate links are stored in buyer dashboard.
- Checkout failure modes are recoverable and never create duplicate entitlements.

### Buyer dashboard
**Mature requirement:**
- All licenses, projects, downloads, invoices and certificates in one place.
- License upgrade flow for higher-tier commercial use.
- Claim-support intake tied to specific license.
- Team permissions for agency/enterprise accounts.

## Artist-side complete product

### Artist onboarding
**Mature requirement:**
- Clear explanation of accepted music, rejected music and rights warranties.
- Artist identity verification appropriate to risk level.
- Education on PoE and quality requirements.
- A sample "excellent submission" example.

### Upload and PoE submission
**Mature requirement:**
- Upload supports high-res master, preview render, optional stems and metadata.
- PoE form captures AI tools, model/version if known, prompt/process description, DAW/manual work, samples, vocals, third-party assets and warranty.
- Artist sees whether a field is public, private to reviewers or stored for legal evidence.

### Review status and feedback
**Mature requirement:**
- Artists receive actionable rejection reasons.
- EchoScore feedback explains technical issues without pretending to resolve legal safety.
- Review time expectations are visible.
- Re-submissions preserve history.

### Artist analytics and earnings
**Mature requirement:**
- Track performance, search appearances, preview conversion, license sales, revenue, payouts and buyer use-case signals.
- Recommendations for what to create next based on real demand.
- Artist reputation improves with consistent quality, clean history and low dispute rate.

## Admin and operations complete product

### Review queue
**Mature requirement:**
- Risk-prioritized queue, not just chronological queue.
- Reviewers see audio analysis, PoE, file metadata, previous artist history, possible flags and comparable approved tracks.
- Reviewer decisions are audited and versioned.

### Policy management
**Mature requirement:**
- Review policies are versioned.
- EchoScore thresholds are versioned.
- License terms are versioned.
- Public standards can be updated without breaking old licenses.

### Disputes and claims
**Mature requirement:**
- Intake form for buyer, artist or third party.
- Track can be suspended from future sale while existing licenses remain visible.
- Evidence pack includes purchase, terms version, PoE snapshot, file checksum, review notes and audit log.
- Resolution outcomes are tracked.

## Trust/provenance complete product

### EchoScore
**Role:** Technical quality gate, not legal validator.

**Mature requirement:**
- Versioned analysis model.
- Audio metrics are stored with thresholds and explanation.
- Results are reproducible against file checksum.
- False positives/negatives are reviewed.

### Proof of Effort
**Role:** Process and rights documentation.

**Mature requirement:**
- Structured enough to audit.
- Human-readable enough to build buyer trust.
- Private enough to protect creator process.
- Strict enough to discourage low-effort spam and dishonest submissions.

### Certificate
**Mature requirement:**
- Certificate ID.
- Track ID.
- Artist ID or public artist identity.
- Buyer/licensee.
- Purchase date.
- License tier.
- Terms version.
- Allowed use summary.
- Files delivered.
- Verification URL.
- Provenance summary.
- Clear risk disclaimer.
- Support/escalation route.

## Enterprise/API complete product

### Enterprise
- SSO/SAML if required.
- Team permissions.
- Centralized procurement.
- Invoice billing.
- Annual plans or prepaid credits.
- Custom legal review package.
- Audit exports.
- Account manager or priority support where economics justify it.

### API
- Search, preview, license, certificate and download endpoints.
- Strict scopes and rate limits.
- Webhooks for license issuance and dispute/suspension events.
- Clear separation between preview content and high-res deliverables.
- Partner-specific terms and reporting.

## What is intentionally not core

The following should not become core unless they directly strengthen licensing trust or buyer workflow:
- Generic social feed.
- Full Spotify-like consumer streaming.
- Fan communities.
- Music charts without commercial-use signal.
- Open upload without curation.
- AI generation as the primary product before licensing trust is won.
