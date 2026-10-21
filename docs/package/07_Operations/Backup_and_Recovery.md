# Backup and Recovery

## What must be recoverable
- Data: users, tracks, PoE records, EchoScore analyses, review decisions, license terms versions, purchased licenses, disputes, audit logs.
- Config: environment variables, Stripe webhook config, storage bucket policy, queue config.
- Artifacts: high-res WAV files, preview files, artwork, certificate PDFs.

## Recovery objectives
- RPO:
  - Postgres: <= 24h for MVP; target point-in-time recovery in production.
  - Object storage: versioning/backups for critical artifacts.
- RTO:
  - MVP: <= 24h acceptable.
  - Public paid production: target <= 4h.

## Backup rules
- Automated DB backups daily minimum.
- Test restore before public launch.
- Object storage lifecycle/versioning enabled where feasible.
- Audit logs and license records should never be manually edited.
- Store infrastructure config in version control, not secrets.

## Disaster scenarios
- DB loss
- Object storage misconfiguration
- Payment webhook outage
- Certificate generation bug
- Wrong track approved
- Track legal dispute
