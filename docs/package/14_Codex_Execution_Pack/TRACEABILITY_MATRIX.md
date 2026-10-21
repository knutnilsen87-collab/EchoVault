# EchoVault Traceability Matrix

This maps product intent to implementation ownership so Codex avoids guessing.

| Product concept | Source spec | Owning code location | First PR |
|---|---|---|---|
| VaultTrack | `04_Technical/Canonical_Domain_Model_v1.md` | `packages/domain/src/types.ts` | PR 01 |
| Track status transitions | `02_Product/Business_Rules.md` | `packages/domain/src/rules.ts` | PR 05 |
| Proof of Effort | `02_Product/Proof_of_Effort_Standard.md` | `packages/domain/src/api-schemas.ts` | PR 03 |
| EchoScore | `04_Technical/Audio_Processing_Pipeline.md` | `services/echoscore` + route adapter | PR 04 |
| Admin approval | `02_Product/Roles_and_Permissions_Matrix.md` | `apps/web/src/app/api/admin/*` | PR 05 |
| Buyer catalog | `03_Design/Information_Architecture.md` | `apps/web/src/app/page.tsx` + API | PR 06 |
| Checkout | `04_Technical/API_Specification.md` | `apps/web/src/app/api/checkout/session` | PR 07 |
| Webhook fulfillment | `04_Technical/Provider_Contract_Spec_v1.md` | `apps/web/src/app/api/webhooks/stripe` | PR 08 |
| License | `04_Technical/Data_Model.md` | `infra/db/migrations` + domain types | PR 08 |
| Certificate | `02_Product/EchoVault_Licensing_Model.md` | `apps/web/src/app/api/licenses/*` | PR 09 |
| Signed download | `08_Security_Legal/Privacy_and_Data_Handling.md` | storage adapter boundary | PR 09 |
