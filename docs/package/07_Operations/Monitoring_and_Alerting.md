# Monitoring and Alerting

## Must-watch signals
- Availability
- Latency
- Error rate
- Job failures
- Resource saturation
- Payment webhook failures
- Duplicate webhook/license conflict rate
- Certificate generation failures
- Signed URL generation failures
- Upload failures
- Track review backlog
- Dispute volume

## Alert thresholds — MVP starting point
| Signal | Threshold | Severity |
|---|---|---|
| Web 5xx rate | > 2% for 5 min | Sev 2 |
| Checkout session creation failure | > 5 failures/10 min | Sev 1 |
| Stripe webhook failure | Any sustained failure > 5 min | Sev 1 |
| Duplicate license creation attempted | Any | Sev 1 investigation |
| Certificate generation failure | > 3 in 15 min | Sev 2 |
| Signed URL failure | > 5 in 15 min | Sev 2 |
| EchoScore job failure rate | > 20% in 1h | Sev 2 |
| Review backlog | > 100 pending or > 72h oldest | Sev 3/2 |
| Public bucket exposure check | Any failure | Sev 1 |

## Dashboards
- Product funnel
- Payment/fulfillment health
- Worker/job health
- Storage/download health
- Admin/review ops
- Disputes/support
