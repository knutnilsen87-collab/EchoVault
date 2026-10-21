# Backend / API Module

## Status
Active for MVP.

## Sync vs async paths
### Sync
- Auth/session
- Catalog queries
- Track metadata save
- Checkout session creation
- Admin decisions
- License dashboard

### Async
- EchoScore analysis
- Certificate generation
- Email notifications
- Optional audio preview transcoding
- Optional virus scanning

## Rate limits
- Upload endpoints: strict per artist/account.
- Checkout creation: moderate per buyer/IP.
- Download link creation: limited per license/user.
- Admin endpoints: logged.
- Webhooks: validate signature, allow provider retries.

## Tenancy model
Multi-tenant SaaS:
- Users own their data by role.
- Artists own submitted tracks.
- Buyers own purchased licenses.
- Admin can see operational data.

## Queue model
- Job table or Redis-backed queue.
- Each job has idempotency key.
- Retry with dead-letter/failure state.

## Data migration strategy
- Use explicit migrations.
- Never manually edit production purchased-license rows.
- Migrations touching purchase/license/terms require review.
