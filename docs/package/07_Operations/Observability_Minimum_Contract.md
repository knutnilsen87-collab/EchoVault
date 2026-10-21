# Observability Minimum Contract

## Every service/component must provide
- Structured logs.
- Correlation/request IDs where relevant.
- Health signal.
- Version/build info.
- Critical event logging.
- Error codes suitable for support/debugging.

## Required IDs in logs
- `request_id`
- `user_id` where available
- `track_id` where relevant
- `license_id` where relevant
- `stripe_session_id` for payment path
- `analysis_job_id` for EchoScore
- `dispute_id` for support path

## Critical events
- Track submitted
- Analysis job queued/completed/failed
- Track approved/rejected/suspended
- Checkout session created
- Stripe webhook received/verified/failed
- Purchased license created
- Certificate generated/failed
- Signed URL generated
- Download completed if tracked
- Dispute opened/closed

## Privacy
Do not log full prompts, payment card data, private signed URLs, sensitive PoE attachments or secrets.
