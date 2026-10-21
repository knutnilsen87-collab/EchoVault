# Release Gate Profile

## Gate classes

### Functional
- Buyer can complete checkout.
- Artist can submit track.
- Admin can approve/reject.
- License certificate/download generated.

### Reliability
- Stripe webhook idempotent.
- Worker retries configured.
- Database migrations tested.
- Signed URL delivery stable.

### Security
- High-res files private.
- Role checks enforced.
- Webhook signature verified.
- Upload validation enabled.
- Secrets protected.

### Performance
- Catalog loads under acceptable threshold.
- Preview audio starts without unacceptable delay.
- Analysis jobs do not block web requests.

### Support readiness
- Dispute intake exists.
- Track suspension exists.
- Refund/support policy drafted.
- Admin can trace license and audit logs.

## Gate decision
**GO WITH EXCEPTIONS for closed beta only**

Exceptions:
- Legal terms must be reviewed before public paid production launch.
- Buyer willingness to pay is not validated until real purchases occur.
- Review-operation cost is not validated until real artist submissions occur.

## Public production gate
Public production is **NO-GO** until legal counsel approves policies, payment/delivery are stable in beta, support/dispute process is staffed, and no copy claims risk-free legal protection.
