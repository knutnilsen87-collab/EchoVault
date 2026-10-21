# Decision Log

| Date | Decision | Why | Owner | Impact |
|---|---|---|---|---|
| 2026-06-03 | Build EchoVault licensing MVP first, not full EchoVerse streaming. | B2C streaming adds complexity before paid demand is proven. | Founder/Product | Narrows scope. |
| 2026-06-03 | Use modular monolith + FastAPI EchoScore service. | Keeps product cohesive while isolating audio analysis. | Tech lead | Faster MVP, fewer service boundaries. |
| 2026-06-03 | Require human review before public sale. | PoE/EchoScore alone are insufficient trust controls. | Product/Ops | Adds ops load but reduces risk. |
| 2026-06-03 | Use append-only purchased license ledger. | Legal/payment records should not be casually mutated. | Tech/Finance | Stronger auditability. |
| 2026-06-03 | Version license terms. | Buyer rights depend on terms at purchase time. | Legal/Product | Required for compliance/audit. |
| 2026-06-03 | Avoid “safe harbor/risk-free” language. | Product cannot guarantee absence of third-party claims. | Legal/Brand | Trust without overclaim. |
| 2026-10-21 | Built-in session auth instead of an external provider for the MVP. | Provider was unselected; avoids a dependency before SSO is needed. | Tech | See ADR-0001 D1. |
| 2026-10-21 | Postgres job queue instead of Redis. | One fewer service; volumes are tiny pre-PMF. | Tech | See ADR-0001 D2. |
| 2026-10-21 | Enforce append-only ledger with DB triggers; lifecycle as license_events. | Immutability must not depend on application discipline. | Tech/Finance | Migration 0002. |
| 2026-10-21 | Correct starter prices to €19/€49/€199 and store prices with terms versions. | Licensing Model is source of truth; starter code disagreed. | Product | ADR-0001 C1. |

