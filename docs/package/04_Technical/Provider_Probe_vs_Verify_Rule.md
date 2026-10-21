# Provider Probe vs Verify Rule

## Principle
Do not assume an integration works because configuration exists.

- **Probe** = lightweight check that a dependency is reachable.
- **Verify** = stronger check that it behaves as required for the current use case.

## Rules by provider
| Provider | Probe | Verify |
|---|---|---|
| Stripe | Can fetch account/webhook config in staging | Complete test checkout and receive signed webhook; duplicate webhook does not duplicate license |
| S3/R2 | Can list/write test object | Can create private object, generate signed URL, URL expires correctly |
| Email | Can send test message | Receipt/certificate email renders and reaches test inbox |
| EchoScore | `/health` returns OK | Known audio fixture returns expected metrics version/pass/fail |
| PostgreSQL | DB connection succeeds | Migration applies and transaction rollback works |
| Queue | Enqueue/dequeue test job | Retry/dead-letter behavior works |
| PDF generator | Render sample certificate | Certificate includes required fields and is readable |

## Critical paths
Checkout, webhook fulfillment, certificate generation and signed download require verify checks before release.
