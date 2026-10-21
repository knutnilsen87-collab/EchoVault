# Worker / Job State Machine Spec

## Standard states
- `queued`
- `running`
- `retry_scheduled`
- `succeeded`
- `failed`
- `blocked`
- `cancelled`

## EchoScore analysis job
### Transitions
- `queued → running`
- `running → succeeded`
- `running → retry_scheduled`
- `retry_scheduled → queued`
- `running → failed`
- `queued → cancelled`
- `failed → queued` only by admin retry

### Retry rules
- Retry transient file access/decode/service errors up to 3 times.
- Do not retry deterministic invalid file errors.
- Mark track `analysis_failed` after final failure.
- Admin can retry after file replacement or operational fix.

## Certificate generation job
### Transitions
- `queued → running → succeeded`
- `running → retry_scheduled → queued`
- `running → failed`

### Idempotency
- Certificate generation must be idempotent per purchased license.
- Re-running job should replace failed certificate artifact or return existing valid artifact.
- Never create duplicate purchased license records.

## Email/notification job
- Non-blocking for license validity.
- Buyer dashboard must work even if email fails.
