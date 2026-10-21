# Security Requirements

## Baseline
- Least privilege.
- Secrets handling discipline.
- Dependency hygiene.
- Authn/authz correctness.
- Input validation.
- Auditability where needed.
- Private object storage.
- Rate limiting.
- Secure webhook verification.
- Upload scanning/validation.

## Project-specific controls
- High-res WAV private by default.
- Preview files separated from high-res assets.
- Signed URLs expire.
- Track file checksum stored.
- Stripe webhook signature verification mandatory.
- Idempotent license creation.
- Admin actions audit-logged.
- Role guards for all dashboards and APIs.
- No sensitive PoE data sent to analytics.
- No card data stored.
- Object bucket public access blocked by default.
- Legal-sensitive text changes require review.

## Threats to consider
- Unauthorized high-res downloads.
- Fake webhook/payment spoofing.
- Artist uploads malicious/corrupt files.
- Artist fraud / rights misrepresentation.
- Buyer account takeover.
- Admin privilege abuse.
- Public bucket misconfiguration.
- Duplicate fulfillment due to webhook retry.
- Support/social-engineering attack to access files.

## Security tests
- Access-control tests for license ownership.
- Webhook signature invalid test.
- Signed URL expiry test.
- Public bucket scan.
- Rate limit test.
- Admin route 403 tests.
