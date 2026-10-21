# Incident Response

## Severity levels

### Sev 1
- Payments charged but no licenses delivered.
- High-res files publicly exposed.
- Unauthorized access to private license/PoE data.
- Widespread checkout failure.
- Legal claim requiring immediate track suspension.

### Sev 2
- EchoScore jobs failing for many submissions.
- Certificate generation degraded.
- Email receipts failing but dashboard works.
- Admin review queue unusable.

### Sev 3
- Minor UI bugs.
- Analytics missing.
- Non-critical email formatting.
- Slow catalog filters.

## Incident flow
1. Detect
2. Triage
3. Contain
4. Communicate
5. Fix
6. Verify
7. Review

## Immediate containment examples
- Disable checkout if fulfillment broken.
- Suspend disputed track.
- Revoke public bucket policy if exposure.
- Rotate compromised keys.
- Pause artist submissions if review system broken.

## Postmortem required for
- Any Sev 1.
- Duplicate license/payment bugs.
- Privacy/security incidents.
- Public legal overclaim.
