# EchoVault

Curated B2B licensing marketplace for AI/hybrid music: artists submit tracks with **Proof of Effort**, the
**EchoScore** service checks technical audio quality, a human reviewer approves, and buyers license tracks
through Stripe and receive a **PDF certificate** plus a signed, expiring high-res WAV download.

This repository is the first working **vertical slice** of the CTO package in [`docs/package/`](docs/package/README.md).
Every deviation from that package is listed in [ADR-0001](docs/decisions/ADR-0001-vertical-slice-deviations.md).
Current status per area: [`Specified_Implemented_Validated_Status.md`](docs/package/09_Project_Control/Specified_Implemented_Validated_Status.md).

> ⚠️ License terms, artist warranty and dispute policy in the database are **labelled drafts**. They must be
> replaced by counsel-reviewed text (as a new terms version) before any real sale.

## What works end to end

```
Artist: register → draft → upload WAV (validated, SHA-256, private) → Proof of Effort → submit
Worker: EchoScore analysis (real DSP) + MP3 preview (ffmpeg)
Reviewer: queue → full PoE + metrics + audio → approve / request changes / reject (override required if EchoScore failed)
Buyer: catalog + preview player → tier + terms clickwrap → Stripe Checkout → verified webhook
       → immutable license (+70/30 split, terms snapshot) → PDF certificate → signed WAV link → public verification page
Support: buyer reports a claim → reviewer suspends track (new sales/previews stop, existing licenses stay)
```

## Layout

| Path | What |
|---|---|
| `apps/web` | Next.js 15 app: UI, API (`/api/v1/*`), services, worker, scripts |
| `apps/web/src/server/services` | Business logic per module (artist, analysis, review, catalog, checkout, fulfillment, licenses, disputes) |
| `packages/domain` | Statuses, state machine, pricing/split, PoE rules, zod schemas — shared and unit-tested |
| `services/echoscore` | FastAPI EchoScore service (numpy/scipy/pyloudnorm) |
| `infra/db/migrations` | `0001` exactly as delivered in the package, `0002` hardening |
| `docs/package` | The CTO/developer package (source of truth) |

## Run locally

**Windows:** double-click `start.bat` (needs Git, Node 22+ and Docker Desktop; it installs pnpm, starts
Postgres + EchoScore in Docker, migrates, seeds demo data, opens the web app and worker in their own windows
and opens the browser). `stop.bat` stops the Docker services.

Manual setup — requirements: Node 22, pnpm 10, Docker (or a local Postgres 16 + Python 3.11 for EchoScore).
ffmpeg on PATH (or `FFMPEG_PATH`) is needed for MP3 previews; without it everything else works.

```bash
cp .env.example apps/web/.env.local     # stub mode: no real Stripe/R2 needed
docker compose up -d                      # Postgres :54329 + EchoScore :8001
pnpm install
pnpm db:migrate
pnpm db:seed --demo                       # staff/demo accounts + 3 synthetic tracks through the real pipeline
pnpm dev                                  # http://localhost:3000
pnpm worker                               # second terminal: EchoScore jobs, previews, certificates
```

Seeded accounts (password `echovault-dev-password`): `admin@`, `reviewer@`, `artist@`, `buyer@echovault.local`.

### Sign in with Google (optional)

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → *Create credentials* → *OAuth client ID* → **Web application**.
2. Authorized redirect URI: `http://localhost:3000/api/v1/auth/google/callback` (add the production URL later).
3. If asked, configure the consent screen (External, Testing) and add your own Google account as a test user.
4. Put the values in `apps/web/.env.local` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and restart.

New Google users become buyers (or artists when chosen on *Create account*); a verified Google email that
matches an existing account is linked to it.

In **stub mode** checkout redirects to `/dev/checkout/…`, which signs a Stripe-format event with
`STRIPE_WEBHOOK_SECRET` and runs it through the real webhook handler. Nothing is charged.

## Tests

```bash
pnpm verify                          # typecheck + lint + unit + integration
(cd services/echoscore && python -m pytest -q)
pnpm --filter @echovault/web exec playwright test   # needs the full stack running (see CI)
```

Integration tests run against a real Postgres (`TEST_DATABASE_URL`, default `postgresql://postgres@localhost:5432/echovault_test`)
and start the real EchoScore service. They cover acceptance criteria AC-001 … AC-012 from `docs/package/06_QA/Acceptance_Criteria.md`,
including concurrent duplicate webhooks, forged signatures, amount mismatch, DB-level immutability and an EchoScore outage.

## Going live (not done yet)

1. Counsel-reviewed license terms → insert as new `license_terms_versions` rows, flip `active`.
2. Stripe: set `ECHOVAULT_PROVIDER_MODE=live`, `STRIPE_SECRET_KEY`, real `STRIPE_WEBHOOK_SECRET`; subscribe the webhook to
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`. Test in Stripe test mode first.
3. Storage: `STORAGE_DRIVER=s3` + R2/S3 credentials (bucket must be private). Verify signed-URL expiry.
4. Deploy web, worker (long-running process) and EchoScore (container) — the worker cannot run on pure serverless.
5. Tune EchoScore thresholds on real submissions; external security review.
