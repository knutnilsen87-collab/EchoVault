# Privacy and Data Handling

## Data classes
- Public: approved track metadata, public artist name, public PoE summary.
- Internal: review notes, EchoScore details, operational logs.
- Confidential: user email, purchase data, private storage keys, full PoE records.
- Sensitive: dispute details, legal claims, private prompt/process artifacts if collected.

## What user data exists
- Buyer: email/account, purchased licenses, project/client/URL metadata if provided, support/dispute messages.
- Artist: email/account, artist profile, submitted audio/files, PoE records, payout account ID if used.
- Admin/support: action logs and review notes.

## Retention and deletion rules
- Keep purchase/license records for legal/accounting retention.
- Keep audit logs for security/legal traceability.
- Delete stale drafts after defined inactivity period.
- Remove or anonymize user profile where legally possible.
- Keep disputed content under legal hold until resolved.
- Do not keep PoE attachments longer than needed.
- Never log private signed URLs or secrets.

## Third-party sharing
- Stripe for payment.
- Email provider for receipts.
- Analytics provider for product analytics, with sensitive fields excluded.
- Storage provider for files.
- Legal/support tools if needed.

## Data minimization
Do not collect full prompts or production screenshots unless needed for review. Prefer structured summaries and required declarations.
