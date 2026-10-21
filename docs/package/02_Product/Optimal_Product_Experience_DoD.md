# Optimal Product Experience DoD

## Purpose

This document describes how EchoVault should feel and function when it is operating optimally, not merely technically working.

## North-star experience

A commercial buyer should be able to say:

> "I found the right track, understood the rights, bought the license, downloaded the file, shared the certificate with my client and felt protected if a claim happens."

An artist should be able to say:

> "I understand the quality bar, I know why my track was approved or rejected, and the platform gives me real commercial demand I cannot easily get elsewhere."

An operator should be able to say:

> "We can grow supply and demand without losing trust, breaking licensing history or drowning in manual review."

## Buyer experience DoD

### Discovery

**Optimal state:**
- Buyer enters with a job-to-be-done, not a technical music query.
- Product guides them to suitable tracks quickly.
- Search and filters reflect commercial context: campaign, YouTube, game, podcast, ad, client work, region and license tier.

**Done when:**
- Buyer can find shortlist-quality tracks without understanding AI music jargon.
- Empty states suggest better filters or collections.
- Results do not feel like AI spam.

### Trust comprehension

**Optimal state:**
- Trust is visible but not overwhelming.
- Buyer sees an easy summary first, with deeper provenance available on demand.

**Done when:**
- Buyer understands three things before checkout:
  1. What they are allowed to do.
  2. What documentation they receive.
  3. What support exists if a claim happens.

### Licensing

**Optimal state:**
- Tier selection is obvious.
- Buyer never has to guess whether Creator, Pro or Agency applies.

**Done when:**
- Tier comparison is plain-language.
- Edge cases link to support/legal notes.
- Chosen tier is stored on the certificate and dashboard.
- License upgrade is possible where terms allow.

### Fulfillment

**Optimal state:**
- Purchase immediately results in usable assets.

**Done when:**
- Certificate and files are available from dashboard.
- Download failures are recoverable.
- Signed URL expiry is explained.
- Purchase never creates duplicate licenses on webhook retry.

### Post-purchase confidence

**Optimal state:**
- Buyer has durable proof for their own records, client delivery and platform claims.

**Done when:**
- License record is always retrievable.
- Certificate can be shared or exported.
- Support can identify the exact license from certificate ID.
- Buyer can see whether a track has later been suspended without invalidating past records.

## Artist experience DoD

### Submission

**Optimal state:**
- Artist knows the bar before uploading.

**Done when:**
- Requirements are clear.
- PoE is structured and not ambiguous.
- Artist knows which data becomes public.
- Artist can save drafts and resubmit after changes.

### Feedback

**Optimal state:**
- Rejection improves future submissions.

**Done when:**
- Review feedback is actionable.
- EchoScore feedback is understandable.
- Legal/process issues are separated from audio-quality issues.
- Repeat low-quality or dishonest submitters can be throttled.

### Monetization

**Optimal state:**
- Artist sees why EchoVault is better than posting tracks into a generic marketplace.

**Done when:**
- Earnings and performance are visible.
- Payout status is clear.
- Top buyer use cases inform future creation.
- High-performing artists get quality/reputation benefits.

## Admin/operator experience DoD

### Review operations

**Optimal state:**
- Review is consistent, auditable and fast enough to scale.

**Done when:**
- Reviewer decision is tied to policy version.
- Every approval/rejection has reason codes.
- High-risk submissions are prioritized.
- Review QA can detect inconsistent reviewers.

### Support and disputes

**Optimal state:**
- Claims do not become chaos.

**Done when:**
- Each dispute maps to a license, track, buyer, artist, certificate, PoE snapshot and terms version.
- Operators can suspend future sales.
- Existing license history remains intact.
- Escalation to legal counsel has a complete evidence pack.

### Marketplace health

**Optimal state:**
- Operators understand supply/demand balance.

**Done when:**
- Dashboard shows searches with no good result.
- Conversion by genre/use-case is visible.
- Revenue by license tier is visible.
- Review cost per approved/revenue-generating track is visible.
- Dispute and refund rates are visible.

## UX principles

1. **Trust before volume.**
2. **Commercial clarity before music fandom.**
3. **Fewer better tracks beat huge weak catalog.**
4. **Every legal promise must map to a system record.**
5. **Every review decision must be explainable.**
6. **Every buyer artifact must survive future policy changes.**
7. **The product should reduce anxiety, not force buyers to become copyright experts.**
