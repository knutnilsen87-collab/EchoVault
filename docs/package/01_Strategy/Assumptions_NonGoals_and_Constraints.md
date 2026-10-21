# Assumptions, Non-Goals and Constraints

## Assumptions
| ID | Assumption | Label | Validation |
|---|---|---|---|
| A-001 | B2B licensing is the first viable wedge; B2C streaming is later. | Inferred | Paid pilot |
| A-002 | Buyers value certificate + PoE + QA enough to pay. | Speculative | Conversion test |
| A-003 | Artists will submit process documentation if it improves monetization. | Speculative | Artist onboarding test |
| A-004 | EchoScore can reduce low-quality submissions but cannot validate copyright. | Inferred | Audio QA benchmarking |
| A-005 | Manual review is acceptable for MVP scale. | Speculative | Measure review minutes/track |
| A-006 | Legal terms can be made commercially credible without overpromising. | Speculative | Counsel review |

## Non-goals for MVP
- Full B2C streaming platform
- Mobile app
- Social network / comments / following
- Algorithmic recommendations
- Enterprise API
- Automated copyright clearance guarantee
- Content ID registration
- Royalty accounting beyond fixed platform/artist split
- White-glove sync pitching
- “Safe harbor” or “legally risk-free” marketing language

## Constraints
- Must not expose high-resolution files publicly.
- Must use idempotent payment fulfillment.
- Must maintain immutable purchase/license history.
- Must version license terms.
- Must allow track suspension/dispute states.
- Must minimize storage of unnecessary prompt/process data.
- Must include human review before public availability.
- Must make AI/hybrid nature clear to buyers.
