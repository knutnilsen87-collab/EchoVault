# Acceptance Criteria

## MVP acceptance criteria

### AC-001 — Artist upload
- Given an authenticated artist,
- When they create a track draft and upload a valid WAV,
- Then the file is stored privately and track metadata is saved.

### AC-002 — PoE required
- Given an artist has a track draft,
- When required PoE fields are missing,
- Then submission is blocked with clear errors.

### AC-003 — EchoScore job
- Given a submitted track,
- When the analysis job runs,
- Then the system stores score, metrics, flags, feedback and analysis version.

### AC-004 — Human review
- Given a track with completed PoE and EchoScore result,
- When admin approves it,
- Then it becomes visible in catalog and an audit log is created.

### AC-005 — Catalog visibility
- Given a track is draft/rejected/suspended,
- When public catalog is queried,
- Then the track is not returned.

### AC-006 — Checkout
- Given a buyer selects an available track and accepts terms,
- When checkout session is created,
- Then Stripe receives track ID, buyer ID, tier and terms version metadata.

### AC-007 — Idempotent webhook
- Given Stripe sends the same successful checkout event twice,
- When webhook handler processes both,
- Then exactly one purchased license exists.

### AC-008 — Certificate
- Given a paid license exists,
- When fulfillment runs,
- Then a certificate PDF is generated and linked to the license.

### AC-009 — Signed download
- Given the buyer owns the license,
- When they request download,
- Then they receive an expiring signed URL for high-res file.

### AC-010 — Unauthorized access
- Given a user does not own a license,
- When they request high-res download,
- Then the request is denied.

### AC-011 — Suspension
- Given a track is suspended,
- When public catalog is queried,
- Then new purchases are blocked but existing license records remain visible to buyers.

### AC-012 — Legal guardrail
- Given any public page references trust,
- When text is reviewed,
- Then it does not claim risk-free legal protection.
