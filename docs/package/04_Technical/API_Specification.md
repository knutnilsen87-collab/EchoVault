# API Specification

## API style
REST over HTTPS for MVP.

## Auth
- Session/JWT based app auth.
- Role-based access control: anonymous, buyer, artist, reviewer, admin, support.
- Internal endpoints require service token or network-level restriction.

## Endpoint groups

### Public/buyer
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/vault/tracks` | List approved tracks |
| GET | `/api/v1/vault/tracks/{trackId}` | Track detail |
| POST | `/api/v1/checkout/session` | Create Stripe Checkout session |
| GET | `/api/v1/licenses` | Buyer license list |
| GET | `/api/v1/licenses/{licenseId}` | Buyer license detail |
| POST | `/api/v1/licenses/{licenseId}/download-link` | Create signed download URL |
| GET | `/api/v1/certificates/{certificateId}` | Certificate verification/detail |

### Artist
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/artist/tracks` | Create track draft |
| POST | `/api/v1/artist/tracks/{trackId}/files` | Upload/register file |
| PUT | `/api/v1/artist/tracks/{trackId}` | Update metadata |
| PUT | `/api/v1/artist/tracks/{trackId}/poe` | Save PoE |
| POST | `/api/v1/artist/tracks/{trackId}/submit` | Submit for review |
| GET | `/api/v1/artist/tracks` | List own tracks |
| GET | `/api/v1/artist/earnings` | Earnings summary |

### Admin/reviewer
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/admin/review-queue` | List tracks needing review |
| GET | `/api/v1/admin/tracks/{trackId}` | Review detail |
| POST | `/api/v1/admin/tracks/{trackId}/approve` | Approve |
| POST | `/api/v1/admin/tracks/{trackId}/reject` | Reject |
| POST | `/api/v1/admin/tracks/{trackId}/request-changes` | Request changes |
| POST | `/api/v1/admin/tracks/{trackId}/suspend` | Suspend |
| GET | `/api/v1/admin/audit-logs` | Query audit logs |

### Internal/workers
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/internal/analysis/jobs` | Create analysis job |
| POST | `/api/v1/internal/analysis/callback` | Worker result callback |
| POST | `/api/v1/internal/certificates/generate` | Generate certificate |

### Stripe
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/webhooks/stripe` | Verified Stripe event handler |

## Error format
```json
{
  "error": {
    "code": "TRACK_NOT_APPROVED",
    "message": "This track is not available for licensing.",
    "request_id": "req_..."
  }
}
```

## API rules
- Never return private storage keys to unauthorized clients.
- Never trust checkout success page alone; only webhook creates paid license.
- Public track endpoints must filter out unapproved/suspended tracks.
- All admin state changes require audit log.
