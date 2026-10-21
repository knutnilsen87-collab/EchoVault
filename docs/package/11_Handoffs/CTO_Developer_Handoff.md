# CTO / Developer Handoff

## What this project is
EchoVault is the narrowed MVP wedge of EchoVerse: a curated AI/hybrid music licensing marketplace for commercial buyers. It combines artist upload, Proof of Effort, EchoScore technical QA, admin review, Stripe checkout, license certificate generation and private high-res file delivery.

## Current state
- Strategic scope is defined.
- MVP is specified.
- Database schema draft exists.
- OpenAPI draft exists.
- Delivery phases and first PRs are defined.
- QA/release gates are defined.
- Legal/security risks are identified.
- Product-market fit is **not validated**.

## What is done
- EchoVault B2B-first scope chosen.
- B2C streaming deferred.
- Core domain model specified.
- Roles and permissions specified.
- Business rules specified.
- SQL schema v1 drafted.
- API v0.1 drafted.
- Audio processing pipeline specified.
- Security/legal guardrails drafted.
- Build order and QA gates documented.

## What remains
- External legal review.
- Buyer interviews and paid validation.
- Final ICP selection.
- Real implementation.
- EchoScore threshold tuning.
- Artist onboarding/testing.
- Review rubric calibration.
- Infrastructure provider selection.
- Production security review.
- Support/dispute process staffing.

## Biggest risks
- Legal risk exceeds technical risk.
- Trust layer may be perceived as weak if not legally meaningful.
- AI generators may add their own licensing/certificate layer.
- Manual review may become bottleneck.
- Buyer willingness to pay is unproven.
- “Safe harbor” language could create liability or reputational damage.
- Marketplace liquidity is harder than the software build.

## Recommended next build order
1. Validate buyer ICP and pricing with 15–25 interviews.
2. Build internal vertical slice with one test track and Stripe test mode.
3. Add artist upload, PoE and admin review.
4. Add EchoScore worker and analysis storage.
5. Add certificate generation and signed delivery.
6. Run closed beta with curated catalog.
7. Tighten legal, support and security before public launch.

## CTO instruction
Build to prove this statement:

“A creator or agency will pay for AI/hybrid music because EchoVault makes it faster, safer and more trustworthy than generating it themselves.”

Do not build anything that does not help prove that statement during MVP.
