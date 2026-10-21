# UI Specification

## Main screens / surfaces
1. Landing page
2. Buyer catalog
3. Track detail page
4. Checkout drawer / tier selector
5. Checkout success page
6. Buyer license dashboard
7. License certificate page
8. Artist upload wizard
9. PoE form
10. Artist dashboard
11. Admin review queue
12. Admin track review detail
13. Dispute intake page

## Components
- Global shell / nav
- Track data grid row
- Track card
- Audio preview player
- License tier card
- Trust badge
- EchoScore badge
- PoE summary card
- Checkout drawer
- Signed download panel
- Certificate viewer/download CTA
- Admin review decision panel
- Status timeline
- Audit log table
- Dispute form

## System states to design for
- Loading
- Empty catalog
- No search results
- Preview error
- Checkout failed
- Payment succeeded but fulfillment pending
- Certificate generation failed
- Download expired
- Upload failed
- Analysis pending
- Analysis failed
- Review rejected
- Track suspended
- Restricted/no permission

## Buyer catalog layout
Use an editorial data grid optimized for scanning: play button, title/artist, genre/mood, BPM, duration, EchoScore badge, PoE badge, “from €19”, license CTA.

## Admin review layout
Two-column layout:
- Left: audio, waveform, metadata, files
- Right: EchoScore result, PoE details, warranty, review decision controls
