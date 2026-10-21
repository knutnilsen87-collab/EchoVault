# Business Rules

| Rule ID | Rule | Owner | Notes |
|---|---|---|---|
| BR-001 | Only approved and non-suspended tracks may appear in the public catalog. | Product/Engineering | Enforce at API/query level. |
| BR-002 | High-resolution files must never be public. | Engineering/Security | Only signed URLs after purchase. |
| BR-003 | Every public track must have a completed PoE record. | Product/Ops | PoE may be summarized publicly. |
| BR-004 | EchoScore is required before human approval. | Product/Ops | Score is QA, not copyright clearance. |
| BR-005 | Human review is required before public sale. | Product/Ops | No auto-publish in MVP. |
| BR-006 | Stripe webhook fulfillment must be idempotent. | Engineering | Unique `stripe_session_id`. |
| BR-007 | Purchased licenses are append-only. | Engineering/Finance | Add correction records if needed. |
| BR-008 | License terms must be versioned and linked at purchase time. | Legal/Product | Historical interpretation. |
| BR-009 | Product must not claim music is “risk-free” or legally guaranteed. | Legal/Brand | Marketing/legal guardrail. |
| BR-010 | Track can be suspended from new purchases without deleting old licenses. | Product/Ops | Critical for disputes. |
| BR-011 | Artist payout split is stored at purchase time. | Finance/Engineering | Avoid ambiguity if split changes later. |
| BR-012 | Buyers must accept license terms before checkout. | Legal/Product | Clickwrap recommended. |
| BR-013 | Artists must warrant they have rights to submit and license the track. | Legal/Product | External legal review required. |
| BR-014 | Free/demo users cannot download high-res files. | Product | Preview stream only. |
| BR-015 | Admin actions must create audit logs. | Engineering/Security | Needed for trust and disputes. |
