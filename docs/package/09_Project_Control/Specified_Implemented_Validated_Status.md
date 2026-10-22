# Specified / Implemented / Validated Status

Last updated: 2026-10-21 (first vertical slice). "Validated" means *validated with real users/money/legal*, which tests cannot do.

| Area | Specified | Implemented | Validated | Notes |
|---|---|---|---|---|
| Product scope | Yes | Vertical slice | No | Upload → PoE → EchoScore → review → catalog → checkout → license → certificate → download, plus disputes/suspension. PMF not validated. |
| Buyer ICP | Partial | No | No | Needs interviews and paid test (Q-001). |
| Pricing | Draft | Yes (DB-driven) | No | €19/€49/€199 per Licensing Model; unvalidated (Q-002). |
| Architecture | Yes | Yes | No | Next.js modular monolith + FastAPI EchoScore + Postgres job queue (ADR-0001 D2). |
| API | Draft | Yes | No | All OpenAPI MVP routes except `/internal/analysis/callback` (not needed, ADR-0001 D3). |
| Database | Draft | Yes | No | 0001 as delivered + 0002 hardening (append-only triggers, cents, events). |
| Auth / RBAC | Open | Yes | No | Built-in sessions (ADR-0001 D1). No SSO/magic link yet. |
| EchoScore | Draft | Yes (DSP v0.2) | No | Thresholds need tuning on real submissions. |
| PoE | Draft | Yes | No | Rubric hard-blocks enforced; warranty text is draft. |
| Licensing terms | Draft only | Draft text in DB | No | **Legal counsel required (Q-003).** |
| Stripe | Yes | Stub fully; live code path written | No | Live mode not yet run against Stripe test keys. |
| Object storage | Yes | Local driver; S3/R2 driver written | No | R2 not yet exercised. |
| Certificates | Yes | Yes (PDF + public verification) | No | |
| QA gates | Yes | Yes | n/a | CI: typecheck, lint, unit, integration (real Postgres + EchoScore), browser E2E. |
| Security controls | Yes | Baseline | No | Needs external review before launch. |
| Legal policy | Draft notes | Guardrail test (no "risk-free" claims) | No | External counsel required. |
