# First Vertical Slice Acceptance

This defines the first production-shaped end-to-end slice. Codex should use it as the north star for PR 03-10.

## Slice

A visitor can browse approved tracks, open licensing options, accept terms, begin checkout, and later receive a verified Stripe webhook that creates a purchased license.

## Required path

1. Approved track exists in database.
2. `/api/v1/vault/tracks` returns only `approved` or `live` tracks.
3. UI renders public track list.
4. Buyer selects a license tier.
5. Checkout request validates:
   - `track_id`
   - `tier`
   - `terms_accepted`
   - optional whitelisted URL / project name
6. Checkout session is created only for licensable tracks.
7. Stripe webhook verifies signature before fulfillment.
8. Fulfillment is idempotent by `stripe_session_id`.
9. Purchased license stores:
   - buyer
   - track
   - tier
   - terms version
   - proof/evidence refs where relevant
10. User can see purchased license record.

## Explicit non-goals for first slice

- Full artist dashboard
- Advanced EchoScore
- Full audio processing
- Admin review automation
- Recommendation engine
- Complex revenue payout automation

## Minimum verification

```bash
pnpm contracts:check
pnpm contracts:sql
pnpm contracts:api
pnpm codex:check
pnpm codex:guardrails
```

Full verification after dependencies are installed:

```bash
pnpm install
pnpm verify
```
