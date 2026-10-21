# Technical Architecture Spec

## Architecture summary
EchoVault MVP is a modular web application with a narrow async audio-processing service. The web app owns users, catalog, checkout, licenses, admin review and dashboards. The FastAPI service owns EchoScore analysis only. PostgreSQL is the source of truth. Object storage stores audio files and generated certificates.

## Main runtime parts
- Client/UI: Next.js App Router, React, TypeScript, Tailwind.
- Backend/API: Next.js route handlers/server actions, RBAC and business logic.
- Worker/background processing: audio analysis jobs, PDF generation, email/notification delivery, signed URL generation.
- Data layer: PostgreSQL primary DB; object storage for audio/certificates; Redis/queue for async jobs.
- Third-party dependencies: Stripe, S3/R2, email provider, optional analytics provider, optional virus scanning.

## Architecture style
**Modular monolith + specialized audio analysis service**

Avoid early microservices. Keep domain logic cohesive until scaling pressure is real.

## Data flow
1. Artist uploads track and PoE.
2. Web app stores metadata and files.
3. Queue dispatches EchoScore job.
4. FastAPI analysis service processes private audio file and returns result.
5. Admin reviews track and approves/rejects.
6. Buyer previews approved track.
7. Buyer starts Stripe checkout.
8. Stripe webhook confirms payment.
9. Backend creates immutable license, certificate and delivery link.
10. Buyer accesses dashboard/certificate/download.

## Operational assumptions
- Hosting model: Cloud-first.
- Environment model: local, staging, production.
- Secrets model: environment secrets; separate keys per environment.
- Scaling model: scale web horizontally, scale worker by queue depth, keep object storage external, optimize DB indexes before service splitting.

## Hard boundaries
- EchoScore service does not decide legal approval.
- Stripe webhook is the only trusted source for paid fulfillment.
- Public catalog never queries unapproved/suspended tracks.
- Object storage never exposes high-res files publicly.
