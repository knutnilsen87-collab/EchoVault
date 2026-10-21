# Route ownership map

| Route | Owner module | First PR | Hard rule |
|---|---|---:|---|
| `GET /api/v1/health` | web platform | 01 | Must not touch DB |
| `GET /api/v1/vault/tracks` | catalog | 09 | Approved/live only |
| `GET /api/v1/vault/tracks/{trackId}` | catalog | 09 | 404 for non-public tracks |
| `POST /api/v1/checkout/session` | checkout | 10 | Terms accepted + approved track only |
| `POST /api/v1/webhooks/stripe` | checkout | 10 | Verified webhook only; idempotent |
| `GET /api/v1/licenses` | license dashboard | 10/12 | Buyer can only see own licenses |
| `POST /api/v1/licenses/{licenseId}/download-link` | delivery | 10 | Expiring signed URL only |
| `POST /api/v1/artist/tracks` | artist | 05 | Artist role only |
| `PUT /api/v1/artist/tracks/{trackId}/poe` | artist | 06 | Warranty required |
| `POST /api/v1/artist/tracks/{trackId}/submit` | artist/analysis | 07 | Requires PoE + high-res file |
| `GET /api/v1/admin/review-queue` | admin | 08 | Reviewer/admin only |
| `POST /api/v1/admin/tracks/{trackId}/approve` | admin | 08 | Audit log required |
