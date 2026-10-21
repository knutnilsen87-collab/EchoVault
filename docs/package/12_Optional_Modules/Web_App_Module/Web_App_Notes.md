# Web App Module

## Status
Active for MVP.

## Routing strategy
Next.js App Router with route groups:

```txt
(app)
  /(public)
  /(vault)
  /(artist)
  /(admin)
```

Suggested routes are documented in `03_Design/Information_Architecture.md`.

## SSR/SPA choice
- Use server-rendered/static where useful for catalog/SEO.
- Use client components for audio player, checkout drawer and interactive admin forms.
- Avoid full SPA complexity unless needed.

## Auth model
- Session/JWT auth.
- RBAC guards for buyer, artist, reviewer/admin.
- Admin routes never accessible to non-staff.

## Browser compatibility
Latest Chrome, Safari, Firefox, Edge. Mobile-responsive web is enough; no native mobile app in MVP.

## Performance budgets
Catalog should load quickly with paginated results. Preview audio should start without unacceptable delay. Do not load high-res audio in public UI.

## SEO needs
Public track pages can be indexable if legal/product agrees. Certificate pages should expose verification metadata only, not private buyer details.
