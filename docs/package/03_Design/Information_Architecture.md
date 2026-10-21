# Information Architecture

## Navigation model

### Public / buyer
- Home / landing
- Catalog
- Track detail
- License tiers
- Checkout success
- My licenses
- Certificate verification
- Support / dispute

### Artist
- Artist dashboard
- Track drafts
- Upload track
- PoE form
- Review status
- Earnings summary
- Artist settings

### Admin
- Review queue
- Track review detail
- Buyers/licenses
- Disputes
- Audit logs
- Settings / license terms versions

## Route model — MVP
```txt
/
 /vault
 /vault/tracks
 /vault/tracks/[trackId]
 /checkout/success
 /licenses
 /licenses/[licenseId]
 /certificates/[certificateId]
 /artist
 /artist/tracks
 /artist/tracks/new
 /artist/tracks/[trackId]
 /artist/earnings
 /admin
 /admin/review-queue
 /admin/tracks/[trackId]
 /admin/disputes
 /admin/audit-logs
```

## Track detail hierarchy
1. Play preview
2. Title / artist / genre / tags
3. License CTA
4. Trust card: EchoScore, PoE, warranty, review date
5. License tier comparison
6. Technical metadata: BPM, LUFS, length, format
7. Usage disclaimer
