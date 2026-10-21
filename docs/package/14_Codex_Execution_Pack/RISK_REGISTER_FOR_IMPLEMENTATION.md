# Implementation Risk Register

| Risk | Why it matters | Guardrail | First check |
|---|---|---|---|
| Stripe double fulfillment | duplicate webhook events can create multiple licenses | event idempotency table + unique license constraint | PR 06 |
| Private PoE leakage | artist process notes may contain sensitive info | public/private PoE schema separation | PR 09 |
| Unapproved track sale | legal/product trust failure | `assertTrackCanBeLicensed` in domain + route tests | PR 03/05 |
| License terms drift | purchase must bind exact terms version | active terms lookup + purchase terms_version_id | PR 05 |
| Storage key exposure | paid files must not leak | delivery manifest uses signed URL adapter only | PR 07 |
| Provider lock-in | early provider choices may change | adapters for Stripe/storage/db/score | PR 02–07 |
| Overbuilt marketplace | slows MVP | vertical slice first, no social/follow/recommendation features | all PRs |
| Schema divergence | frontend/backend mismatch | domain schemas as source of truth | all PRs |
