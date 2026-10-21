# UX Flows

## Flow 1 — Buyer license purchase
- Entry point: Catalog, landing page, direct track link.
- Main steps: open track detail → preview → select tier → compare use → accept terms → pay through Stripe → success page → download certificate and high-res file.
- Exit point: License dashboard and certificate page.
- Failure paths: checkout canceled, payment failed, webhook delayed, download expired.

## Flow 2 — Artist upload and review
- Entry point: Artist dashboard.
- Main steps: create track draft → upload audio → add metadata → complete PoE → accept warranty → submit → analysis/review → approval/rejection/change request.
- Exit point: Track live or returned to draft/change-request state.
- Failure paths: upload fails, analysis fails, PoE incomplete, rejection.

## Flow 3 — Admin review
- Entry point: Admin review queue.
- Main steps: select submitted track → check analysis → read PoE → listen → apply rubric → approve/reject/request changes.
- Exit point: Track status changes; audit log written.
- Failure paths: suspicious rights issue → reject/escalate; borderline technical score → request remaster; missing data → request changes.
