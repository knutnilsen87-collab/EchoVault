# Endpoint Permissions Matrix

| Endpoint / Function | Role | Access level | Notes |
|---|---|---|---|
| `GET /vault/tracks` | Anonymous/buyer | Public | Approved/live only. |
| `GET /vault/tracks/{id}` | Anonymous/buyer | Public | No high-res links. |
| `POST /checkout/session` | Buyer | Own checkout | Terms accepted required. |
| `GET /licenses` | Buyer | Own only | Filter by authenticated buyer. |
| `GET /licenses/{id}` | Buyer/admin/support | Own/admin | Buyer owns license or staff role. |
| `POST /licenses/{id}/download-link` | Buyer/admin/support | Own/admin | Signed URL only. |
| `POST /artist/tracks` | Artist | Own | Creates draft. |
| `PUT /artist/tracks/{id}` | Artist | Own draft/change-request only | No edit after approval except admin workflow. |
| `POST /artist/tracks/{id}/submit` | Artist | Own | Requires PoE and file. |
| `GET /admin/review-queue` | Reviewer/admin | Staff | No buyers/artists. |
| `POST /admin/tracks/{id}/approve` | Reviewer/admin | Staff | Audit log required. |
| `POST /admin/tracks/{id}/reject` | Reviewer/admin | Staff | Reason code required. |
| `POST /admin/tracks/{id}/suspend` | Admin/support with permission | Staff | Legal/support sensitive. |
| `POST /internal/analysis/callback` | Internal service | Service token | Not public. |
| `POST /webhooks/stripe` | Stripe | Signature verified | No normal auth; signature required. |
