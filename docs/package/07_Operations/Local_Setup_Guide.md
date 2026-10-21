# Local Setup Guide

## Prerequisites
- Node.js LTS
- pnpm or npm
- Python 3.11+
- Docker Desktop or equivalent
- PostgreSQL local or Docker
- Redis local or Docker
- Stripe CLI
- Optional: MinIO for local S3-compatible storage

## Start steps
1. Clone repo.
2. Copy `.env.example` to `.env.local`.
3. Start local services: Postgres, Redis, optional MinIO.
4. Install dependencies: `pnpm install` and Python service dependencies.
5. Run DB migrations.
6. Seed draft license terms.
7. Start web app: `pnpm dev`.
8. Start EchoScore service: `uvicorn main:app --reload`.
9. Start worker.
10. Start Stripe webhook forwarding: `stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe`.

## Required local smoke test
- Create artist.
- Upload fixture track.
- Submit PoE.
- Run analysis.
- Approve track.
- Buy with Stripe test card.
- Confirm one license created.
- Generate signed download URL.
