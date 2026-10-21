# Definition of Done

A work item is done only if:
- Code is merged to main through review.
- Typecheck and lint pass.
- Relevant unit/integration/E2E tests pass.
- Logging/diagnostics are adequate.
- Security/access checks are included.
- Docs are updated if behavior/contracts changed.
- Acceptance criteria are met.
- No known critical regressions remain.
- Any legal/security-sensitive copy has designated reviewer approval.
- Error/empty/loading states are handled where user-facing.
- Audit events are added for admin or financial state changes.

## Additional done criteria for payment/license work
- Stripe test event covered.
- Duplicate webhook covered.
- License terms version captured.
- No high-res storage key exposed.
- Failure mode documented.

## Additional done criteria for EchoScore work
- Analysis version included.
- Test fixture covered.
- Retry/failure behavior covered.
- Result not described as legal validation.


## Product-level and market-leader DoD

This file defines engineering/task-level done criteria.

For complete product readiness and market-leader standards, see:
- `06_QA/Product_Definition_of_Done_Market_Leader.md`
- `01_Strategy/Market_Leader_DoD_and_Definition_of_Dominance.md`
- `11_Handoffs/Market_Leader_Total_Overview.md`

A ticket can be technically done while the product is still not commercially, legally or operationally done.
