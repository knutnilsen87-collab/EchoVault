# ADR-0001 — Where the first build deviates from (or fills gaps in) the CTO package

Date: 2026-10-21 · Status: Accepted (revisit items marked **Q**) · Scope: first vertical slice

The CTO package (`docs/package/`) is the source of truth. This ADR lists every place the
implementation had to choose, correct or harden something, so reviewers can accept or revert
each point individually.

## Corrections (the package contradicted itself)

| # | Issue found | What was done |
|---|---|---|
| C1 | Starter code priced tiers at €29/€79/€249; the Licensing Model (source of truth for licensing) says €19/€49/€199. The demo page used a third set. | Prices now live in `license_terms_versions.price_cents` (seeded €19/€49/€199) and are asserted in tests. Code never hard-codes the charged amount. |
| C2 | Two different PR orderings (`Build_Order_and_First_10_PRs` vs `CODEX_TASK_PACKETS`). | Followed the Build Order (vertical slice first) and delivered all 10 PRs + parts of 11–13 as one tested slice. |
| C3 | Starter repositories did `SELECT *` into camelCase types (would silently return `undefined` fields). | Explicit column lists everywhere; snake_case DTOs. |
| C4 | `verify:*` scripts mostly checked that documents existed — they could not catch a broken product. | Replaced by real tests: 11 domain unit tests, 32 integration tests against real Postgres + the real EchoScore service, 8 EchoScore tests, 2 full browser E2E flows. |

## Gaps the package left open — decisions taken

| # | Gap | Decision | Reversible? |
|---|---|---|---|
| D1 | Auth provider "not selected" | Built-in email+password (scrypt) with DB sessions (hashed tokens), HttpOnly SameSite=Lax cookie, Origin check on mutations, Bearer token for API clients. No third-party dependency. | Yes — `server/auth.ts` keeps one `requireUser()` seam. Swap for Clerk/Auth.js/Supabase when SSO or magic links are needed. |
| D2 | Queue: "Redis/queue" | Postgres `jobs` table with `FOR UPDATE SKIP LOCKED`, exponential backoff, max attempts, stale-lock reclaim. One less service to run. | Yes — `server/jobs.ts`. Move to a broker when queue depth demands it. |
| D3 | How EchoScore gets the file | Worker reads the private object and POSTs it to EchoScore (multipart, service token). The service never needs storage credentials or a public URL. `/internal/analysis/callback` is therefore not needed. | Yes |
| D4 | EchoScore was a hard-coded fixture (`score: 86`) | Real deterministic DSP (numpy/scipy/pyloudnorm): BS.1770 loudness, 4× oversampled true peak, clipping ratio, silence, bass ratio, spectral flatness, rolloff, **effective bandwidth** (detects low-passed/"underwater" renders), stereo phase. Thresholds = the spec's starting proposal. Not ML. | Thresholds **must be tuned on real submissions (Q)**. |
| D5 | Preview asset | Worker transcodes the WAV to 128 kbps MP3 with ffmpeg; previews are served only via 10-minute signed URLs and only while the track is approved/live. | Watermarked previews are a later option (Q). |
| D6 | Certificate | Real PDF (pdf-lib) with every field the Licensing Model requires + the mandatory disclaimer, SHA-256 stored, public verification page (buyer name masked, no email). | Yes |
| D7 | Upload path | Multipart through the app, ≤250 MB, WAV header validated (≥44.1 kHz/16-bit), SHA-256 recorded. | For production on serverless hosting switch to presigned direct-to-R2 uploads (Q). |
| D8 | Stripe in stub mode | Stub checkout produces a **correctly signed** Stripe-format event and runs it through the same `handleStripeWebhook()` used in production, so signature verification and idempotency are exercised in dev, CI and E2E. Disabled in live mode; off by default when `NODE_ENV=production` unless `ECHOVAULT_ALLOW_STUB_CHECKOUT=true`. | Yes |
| D9 | Payment for a track suspended between checkout and payment | License is still granted (the buyer paid under the terms shown), with `track_status_at_payment` recorded and a warning logged. | **Q-new**: product/legal may prefer automatic refund. |
| D10 | Who may buy | Buyers and artists (not their own tracks). | Yes |

## Hardening added in migration 0002 (0001 is untouched)

- **Append-only enforced by the database**, not just by convention: triggers reject UPDATE/DELETE on
  `purchased_licenses`, `license_events`, `certificates`, `audit_logs`, `track_reviews` (BR-007, BR-015).
- License lifecycle moved to an append-only `license_events` stream, because a `status` column on an
  immutable row is a contradiction.
- `license_terms_versions` rows that have been sold under cannot change text/price/split (BR-008).
- Money in integer cents (`price_paid_cents`, `artist_cut_cents`, `platform_cut_cents`); 70/30 split
  stored at purchase (BR-011); exact terms text snapshotted onto each license.
- Two layers of webhook idempotency: `stripe_events` (event id) and `purchased_licenses.stripe_session_id`,
  in one transaction. Amount/currency are re-checked against what we charged.
- `payment_sessions` persisted **before** calling Stripe, with an idempotency key so double-clicks reuse the session.
- Track state machine in `packages/domain` — every status change goes through `assertTransition`.
- Approving a track whose EchoScore did not pass requires an explicit, audited `override_reason`.
- Reviewers cannot decide on their own tracks; artists see reason codes, not internal reviewer notes.

## Still open (owner: founder/legal) — unchanged from the package

Q-001 launch ICP · Q-002 one-off vs subscription · **Q-003 actual license rights per tier (terms text is a labelled draft)** ·
Q-004 claim support promise · Q-005 public vs private PoE (implemented: conservative summary only) ·
Q-006 artist payouts (split is recorded; no payout automation) · Q-007 Content ID whitelisting (not offered) ·
Q-009 hosting (code supports local disk or S3/R2; the S3 driver is written but not yet run against a real bucket) ·
Q-010 retention for rejected files.
