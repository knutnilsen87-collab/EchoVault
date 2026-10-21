# Product Definition of Done — Market-Leader Standard

## Purpose

This is the product-level Definition of Done. It is different from engineering ticket DoD.

A feature is not truly done because it is shipped. It is done when it produces the intended user, business, legal, operational and trust outcome.

## Product DoD hierarchy

### 1. Ticket DoD
A developer task is complete.

### 2. Feature DoD
A user-facing capability works end-to-end.

### 3. Workflow DoD
A complete job-to-be-done can be completed without founder/operator intervention.

### 4. Product DoD
The product repeatedly creates value, captures value and handles edge cases.

### 5. Market-Leader DoD
The product becomes the trusted default for the category.

## Universal feature DoD

Every shipped feature must satisfy:

| Dimension | Required standard |
|---|---|
| User value | Solves a defined buyer, artist or operator job |
| UX | Handles empty, loading, error and permission states |
| Data | Creates/updates correct source-of-truth records |
| Security | Enforces role, entitlement and file-access rules |
| Legal | Does not create unsupported rights/compliance claims |
| Observability | Emits events/logs needed for support and debugging |
| QA | Has relevant tests or manual acceptance plan |
| Support | Has clear failure recovery or operator path |
| Documentation | Updates API/product/ops docs where behavior changes |

## Buyer workflow DoD

The buyer workflow is done when:

- Buyer can discover a relevant track.
- Buyer can understand why the track is commercially usable.
- Buyer can compare license tiers.
- Buyer can purchase without assistance.
- Buyer receives certificate and files.
- Buyer can retrieve license later.
- Buyer can share proof with client/platform/auditor.
- Buyer can request support for a claim.
- Buyer can upgrade license if applicable.
- Buyer understands limitations and prohibited uses.

## Artist workflow DoD

The artist workflow is done when:

- Artist understands submission standard.
- Artist can upload files and metadata.
- Artist can complete PoE.
- Artist can submit for review.
- Artist can see review status.
- Artist receives actionable feedback.
- Artist can see earnings and license activity.
- Artist can update permitted profile/payment data.
- Artist cannot alter historical PoE snapshots after purchase.
- Artist warranty obligations are explicit.

## Admin workflow DoD

The admin workflow is done when:

- Reviewer sees all required evidence.
- Reviewer can approve, reject or request changes.
- Decision creates audit log.
- Decision references policy version.
- High-risk items are flagged.
- Disputes can be opened, updated, escalated and resolved.
- Suspended tracks are blocked from future purchase.
- Historical licenses remain queryable.
- Operator can reconstruct what happened from audit logs.

## Trust/provenance DoD

The trust layer is done when:

- EchoScore has analysis version and file checksum.
- PoE has structured fields and visibility rules.
- Review decision has reviewer, reason and policy version.
- License certificate has terms version and verification URL.
- Private data is not leaked publicly.
- Trust claims in UI correspond to stored records.
- Disclaimers make clear that EchoVault reduces/documentates risk but does not guarantee absence of infringement.

## Marketplace DoD

The marketplace is done when:

- Buyer demand and artist supply are measurable.
- Search results are relevant.
- Approved supply maps to real paid demand.
- Low-quality supply is rejected or coached.
- Marketplace health dashboards exist.
- Operators know which categories are under/over-supplied.
- The marketplace does not depend on custom manual matching for every sale.

## Enterprise/API DoD

Enterprise/API capability is done when:

- External access is scoped and rate-limited.
- Partner actions create the same audit/license records as first-party actions.
- API cannot bypass entitlement checks.
- Enterprise users have team permissions and audit exports.
- Procurement/security documentation exists.
- Support has a runbook for partner incidents.
- Partner contracts align with product terms and stored entitlements.

## Market-leader DoD

EchoVault reaches market-leader readiness when:

1. **Trust:** Buyers view EchoVault as safer and clearer than generic AI music generation.
2. **Liquidity:** Buyers can reliably find suitable tracks in target verticals.
3. **Repeatability:** Purchases happen without founder involvement.
4. **Supply quality:** Artists submit commercially usable tracks because EchoVault monetizes quality.
5. **Provenance:** Certificate and PoE become meaningful buyer artifacts.
6. **Operations:** Review and dispute processes scale without quality collapse.
7. **Economics:** Take rate, conversion, review cost and support cost support growth.
8. **Distribution:** At least one repeatable acquisition or partner channel works.
9. **Defensibility:** Data, workflow, trust and ecosystem effects improve with usage.
10. **Reputation:** The market understands EchoVault's category: trusted AI/hybrid music licensing.

## Evidence requirements

A claim may be marked "done" only when evidence exists.

| Claim | Minimum evidence |
|---|---|
| Buyers trust the license | Buyer interviews, repeat purchases, lower support confusion |
| Catalog quality is high | Preview-to-license conversion, low refund/dispute rate |
| Review process scales | Median review time, reviewer QA, backlog metrics |
| Legal posture is defensible | Counsel review, versioned terms, dispute playbooks |
| Marketplace has liquidity | Paid licenses per approved track, search success rate |
| Data loop exists | Measurable improvement from review/search/purchase data |
| Market leadership | External validation, inbound demand, repeat enterprise/partner use |

## Non-done examples

These are not done:

- "Certificate generated" but it lacks terms version.
- "Track approved" but no reviewer reason/policy version exists.
- "AI quality score implemented" but it is marketed as copyright safety.
- "Marketplace launched" but all purchases require founder help.
- "Catalog has 10,000 tracks" but buyers cannot find usable tracks.
- "API built" but it bypasses license audit trail.
- "Enterprise-ready" but no SSO, audit export, procurement docs or legal review exists.
