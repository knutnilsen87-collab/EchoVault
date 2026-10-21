# Document Priority and Source of Truth

## Rule
Each subject has one primary source of truth. Do not duplicate conflicting rules across documents.

## Priority order
1. Project Profile Card
2. PRD
3. Technical Architecture Spec
4. Canonical Domain Model
5. SQL Schema
6. OpenAPI MVP Spec
7. Delivery plan
8. QA gates
9. Decision log
10. Evidence / assumptions register

## Source-of-truth table
| Subject | Source document | Owner | Last confirmed |
|---|---|---|---|
| Product scope | `02_Product/PRD_Product_Requirements_Document.md` | Product | 2026-06-03 |
| MVP wedge | `01_Strategy/Executive_Summary.md` | Founder/Product | 2026-06-03 |
| Technical architecture | `04_Technical/Technical_Architecture_Spec.md` | Tech lead | 2026-06-03 |
| Domain model | `04_Technical/Canonical_Domain_Model_v1.md` | Tech lead | 2026-06-03 |
| Database schema | `04_Technical/SQL_Schema_v1.sql` | Tech lead | 2026-06-03 |
| API contract | `04_Technical/OpenAPI_MVP_Spec.yaml` | Tech lead | 2026-06-03 |
| Licensing rules | `02_Product/EchoVault_Licensing_Model.md` | Product/Legal | 2026-06-03 |
| PoE rules | `02_Product/Proof_of_Effort_Standard.md` | Product/Ops/Legal | 2026-06-03 |
| QA gates | `06_QA/Release_Gate_Profile.md` | QA/Tech lead | 2026-06-03 |
| Open decisions | `09_Project_Control/Open_Questions_Table.md` | Founder | 2026-06-03 |
| Evidence/assumptions | `00_START_HERE/Evidence_Register_and_Assumption_Ledger.md` | Founder/Product | 2026-06-03 |
