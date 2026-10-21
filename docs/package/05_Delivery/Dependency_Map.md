# Dependency Map

## Critical dependencies
| Dependency | Needed by | Notes |
|---|---|---|
| Auth/RBAC | All private flows | Must exist before dashboards |
| DB schema | All services | Define domain before UI expands |
| Object storage | Upload, preview, delivery, certificates | Private bucket required |
| License terms versions | Checkout | Must exist before paid flow |
| Stripe test mode | Checkout/webhook | Required before fulfillment |
| EchoScore service | Admin review | Can start with fixture/fake service |
| Admin review | Public catalog | No public sale without approval |
| Legal review | Production launch | Cannot launch public paid usage without counsel |
| Email provider | Receipts | Not P0 if dashboard works |

## Sequence constraints
1. Schema before full API.
2. Auth before dashboards.
3. Object storage before upload.
4. PoE before submit.
5. EchoScore before approval.
6. Approval before catalog visibility.
7. Terms version before checkout.
8. Stripe webhook before license creation.
9. License record before certificate/download.
10. Suspension before public beta.
