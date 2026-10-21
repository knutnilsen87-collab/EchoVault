# Release Checklist

## Scope
- [ ] MVP scope confirmed.
- [ ] B2C streaming features excluded.
- [ ] Public copy reviewed for overclaims.
- [ ] Initial catalog approved.

## Product
- [ ] Buyer catalog works.
- [ ] Track detail works.
- [ ] License tier comparison is clear.
- [ ] Checkout success/failure states work.
- [ ] Buyer dashboard works.
- [ ] Artist submission works.
- [ ] Admin review queue works.
- [ ] Dispute intake works.

## Engineering
- [ ] Migrations applied.
- [ ] Tests pass.
- [ ] Stripe webhook verified.
- [ ] Duplicate webhook tested.
- [ ] Signed URL expiry tested.
- [ ] Private file access tested.
- [ ] EchoScore job failure/retry tested.
- [ ] Audit logs tested.
- [ ] Monitoring in place.
- [ ] Rollback plan exists.

## Security/legal
- [ ] Legal counsel reviewed terms/license/warranty/privacy.
- [ ] Secrets configured outside repo.
- [ ] Admin access limited.
- [ ] Upload validation enabled.
- [ ] Rate limits configured.
- [ ] Privacy notice updated.
- [ ] No production card data stored.
- [ ] Backup/restore verified.

## Go/no-go
- [ ] No open P0 issues.
- [ ] P1 issues accepted by owner.
- [ ] Support owner assigned.
- [ ] Incident path known.
