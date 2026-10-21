# EchoVault Acceptance Test Matrix

| Slice | Must prove | Command / check | Blocks release if |
|---|---|---|---|
| Repo scaffold | workspace installs and typechecks | `pnpm install && pnpm typecheck` | package graph broken |
| Contracts | required routes, env vars, package files exist | `node scripts/verify-contracts.mjs` | required contract missing |
| SQL schema | migration has required tables and immutable fields | `node scripts/verify-sql-migration.mjs` | license/order/proof tables missing |
| Artist intake | draft metadata can be accepted | route smoke or test | invalid draft accepted silently |
| Proof of effort | source evidence is required | unit test | approval possible without proof |
| EchoScore fixture | deterministic score + reason codes | service test / route test | non-deterministic fixture |
| Admin approval | only eligible tracks approve | transition test | unscored/unproved track approved |
| Catalog | only approved tracks visible | route smoke | draft/rejected asset visible |
| Checkout | session created in test boundary only | API smoke | real charge path implied |
| Webhook | idempotent fulfillment | contract test | duplicate license possible |
| License | immutable record created | DB/contract test | license mutable or missing buyer/order |
| Download | signed URL requires license | route smoke | download issued without license |
| Certificate | certificate references immutable license | snapshot/contract | certificate lacks license lineage |
