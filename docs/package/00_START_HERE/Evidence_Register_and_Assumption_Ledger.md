# Evidence Register and Assumption Ledger

## Evidence labels
- **Observed** = directly provided by founder/source blueprint or verified public source.
- **Inferred** = reasonable product/technical conclusion from observed facts.
- **Speculative** = must be validated before execution or external commitment.

## Source material used
- **Founder-provided EchoVerse Master Technical & Strategic Blueprint v1.0**: defines the original two-sided marketplace, B2C streaming, B2B EchoVault licensing, EchoScore, Proof of Effort, Next.js route groups, PostgreSQL schema, Stripe webhook flow, S3 private delivery, and Python/FastAPI audio analysis. **Observed.**
- **Public market/legal checks**: Suno commercial-use help content, Mubert licensing/API pages, RIAA/Reuters coverage of Suno/Udio copyright litigation and settlements, and European Commission AI Act/GPAI transparency guidance. **Observed.**

## Critical assumptions
| ID | Assumption | Label | Validation method |
|---|---|---|---|
| A-001 | MVP should focus on B2B licensing, not full B2C streaming. | Inferred | 15–25 buyer interviews + paid test |
| A-002 | Buyers will pay for curated AI/hybrid tracks when certificate, PoE and delivery reduce perceived risk. | Speculative | Sell 20–50 licenses manually before scaling catalog |
| A-003 | EchoScore is useful as technical QA, not legal validation. | Inferred | Compare with human review and buyer complaints |
| A-004 | PoE creates trust only if tied to warranties, review notes, audit logs and dispute handling. | Inferred | Buyer interviews + legal review |
| A-005 | Creator €19 / Pro €49 / Agency €199 tiers are viable starting prices. | Speculative | Pricing tests by buyer segment |
| A-006 | Human review cost can be controlled with a tight acceptance rubric. | Speculative | Measure review minutes per submitted track |
| A-007 | Legal terms can be commercially credible without claiming risk-free protection. | Speculative | External legal counsel review |
| A-008 | Artists will accept PoE friction in exchange for monetization and premium positioning. | Speculative | Artist onboarding test |
| A-009 | High-res WAV files can remain private and delivered by expiring signed URLs only. | Inferred | Security review + E2E tests |
| A-010 | No production launch should claim “safe harbor” or “legally risk-free.” | Inferred | Legal/brand review |
