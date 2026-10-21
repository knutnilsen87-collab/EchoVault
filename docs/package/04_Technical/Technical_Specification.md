# Technical Specification

## Chosen stack
- Frontend: Next.js App Router, TypeScript, React, Tailwind CSS, server components where appropriate.
- Backend: Next.js route handlers/server actions for core app; FastAPI for EchoScore audio analysis service.
- Database: PostgreSQL with UUIDs, enums, JSONB for PoE/analysis payloads, strict foreign keys.
- File/blob storage: S3-compatible private bucket such as AWS S3 or Cloudflare R2.
- Queue/background jobs: Redis + BullMQ or managed queue; Celery acceptable if Python-first worker is preferred.
- Payments: Stripe Checkout + signed webhook fulfillment.
- PDF generation: server-side PDF generation using pdf-lib, React PDF or equivalent.
- Infrastructure: Vercel/Render/Fly/AWS for web/API; containerized FastAPI worker; managed Postgres.
- CI/CD: GitHub Actions with lint, typecheck, tests, migration check and deploy gates.

## Engineering standards
- Linting: ESLint for TypeScript; Ruff/flake8 for Python.
- Formatting: Prettier for web; Black/Ruff format for Python.
- Testing: unit, integration, E2E, worker tests.
- Logging: structured logs with request/job/license/track IDs.
- Versioning: `/api/v1`; DB migrations; license terms versions.
- Secrets: environment-based secret manager, never committed.
- Idempotency: required for checkout/session and webhook license creation.
