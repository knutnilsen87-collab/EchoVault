# Decision Log

| Date | Decision | Why | Owner | Impact |
|---|---|---|---|---|
| 2026-06-03 | Build EchoVault licensing MVP first, not full EchoVerse streaming. | B2C streaming adds complexity before paid demand is proven. | Founder/Product | Narrows scope. |
| 2026-06-03 | Use modular monolith + FastAPI EchoScore service. | Keeps product cohesive while isolating audio analysis. | Tech lead | Faster MVP, fewer service boundaries. |
| 2026-06-03 | Require human review before public sale. | PoE/EchoScore alone are insufficient trust controls. | Product/Ops | Adds ops load but reduces risk. |
| 2026-06-03 | Use append-only purchased license ledger. | Legal/payment records should not be casually mutated. | Tech/Finance | Stronger auditability. |
| 2026-06-03 | Version license terms. | Buyer rights depend on terms at purchase time. | Legal/Product | Required for compliance/audit. |
| 2026-06-03 | Avoid “safe harbor/risk-free” language. | Product cannot guarantee absence of third-party claims. | Legal/Brand | Trust without overclaim. |
