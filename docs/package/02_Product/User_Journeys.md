# User Journeys

## Journey 1 — Buyer licenses a track
- Trigger: Buyer needs music for a video/campaign/game.
- Steps:
  1. Lands on catalog.
  2. Searches by mood/genre/BPM/use case.
  3. Previews tracks.
  4. Opens track detail.
  5. Checks license tier and trust card.
  6. Selects Creator/Pro/Agency.
  7. Enters project/channel/URL metadata if required.
  8. Pays through Stripe Checkout.
  9. Returns to success page.
  10. Downloads WAV through signed URL.
  11. Receives/stores certificate.
- Friction points: unclear permitted use, distrust of AI provenance, price confusion, checkout/download failure.
- Success outcome: buyer can use track and has certificate/purchase record.

## Journey 2 — Artist submits a track
- Trigger: Artist wants to monetize AI/hybrid track.
- Steps: account → payment/profile setup → track draft → upload WAV/preview → metadata → PoE → warranty → submit → EchoScore → review.
- Friction points: PoE feels intrusive, upload fails, rejection unclear, rights documentation missing.
- Success outcome: track becomes sellable or artist receives actionable rejection/change request.

## Journey 3 — Admin reviews track
- Trigger: New submission enters review queue.
- Steps: open queue → check EchoScore → read PoE → listen → apply rubric → approve/reject/request changes.
- Friction points: inconsistent rubric, many low-quality submissions, legal red flags.
- Success outcome: only quality/compliant tracks reach catalog.

## Journey 4 — Dispute / claim
- Trigger: Buyer reports claim or third-party challenge.
- Steps: open dispute → link to license/track → suspend if credible → investigate PoE/warranty/claim → record resolution.
- Friction points: buyer expects guarantee, artist unavailable, legal ambiguity.
- Success outcome: new sales are stopped if needed; buyer gets documented support response.
