# Codex Task Packets — PR 01 to PR 12

Hver task packet kan kopieres direkte til Codex.

---

## PR 01 — Make repo installable and verifiable

**Goal:** få `pnpm install`, `pnpm typecheck`, `pnpm test` og `pnpm verify:static` til å kjøre.

**Allowed files:**
- `10_Starter_Kit/repo/package.json`
- `10_Starter_Kit/repo/apps/web/package.json`
- `10_Starter_Kit/repo/packages/*/package.json`
- `10_Starter_Kit/repo/tsconfig.base.json`
- `10_Starter_Kit/repo/scripts/*`
- configfiler i repo-root

**Do not touch:** design-lock docs, product specs, SQL schema semantics.

**Acceptance:**
- Workspace installerer uten peer/dependency-feil som blokkerer lokal utvikling.
- Alle package scripts finnes.
- Static verify scripts passerer.
- Ingen runtime-feature bygges i PR 01.

**Verification:**
```bash
pnpm install
pnpm typecheck
pnpm test
pnpm verify:static
```

---

## PR 02 — Environment and server bootstrap

**Goal:** innfør én env-kontrakt og server config som API-ruter bruker.

**Allowed files:**
- `apps/web/src/server/env.ts`
- `apps/web/src/server/errors.ts`
- `apps/web/src/server/db.ts`
- `.env.example`
- tests for env

**Acceptance:**
- Manglende required env gir eksplisitt feil.
- Test/stub mode er støttet uten ekte Stripe/Supabase.
- Ingen secret printes.

**Verification:**
```bash
pnpm --filter @echovault/web typecheck
pnpm test
node scripts/verify-env-contract.mjs
```

---

## PR 03 — Public catalog from repository adapter

**Goal:** `/api/v1/vault/tracks` bruker repository adapter og returnerer envelope.

**Allowed files:**
- `apps/web/src/app/api/v1/vault/tracks/route.ts`
- `apps/web/src/server/repositories.ts`
- `apps/web/src/server/mappers.ts`
- domain schemas/tests

**Acceptance:**
- Bare `approved` og `live` tracks returneres.
- Response matcher fixtures.
- DB unavailable gir kontrollert API-feil i envelope.

---

## PR 04 — Track detail route

**Goal:** legg til `/api/v1/vault/tracks/[trackId]`.

**Acceptance:**
- 404 for ukjent/ikke-public track.
- Inkluderer lisenspriser, public PoE summary og audio preview metadata.
- Ingen private fields lekkes.

---

## PR 05 — Checkout session persistence

**Goal:** lag checkout session med pending payment record.

**Acceptance:**
- Terms må være akseptert.
- Ikke-approved tracks blokkeres.
- Stripe stub/provider adapter brukes, ikke hardkodet business logic i route.
- `payment_sessions` får idempotency key.

---

## PR 06 — Stripe webhook idempotency

**Goal:** webhook kan motta checkout completed og er idempotent.

**Acceptance:**
- Duplicate event gir 200 og gjør ingen dobbel lisens.
- Invalid signature gir kontrollert 400.
- Purchase + license opprettes atomisk i repository layer.

---

## PR 07 — License entitlement and delivery manifest

**Goal:** kjøper kan hente leveransemanifest for kjøpt track.

**Acceptance:**
- Ingen filnøkler returneres uten entitlement.
- Manifest inkluderer lisens-id, track-id, filtyper og expiry på signed URL.
- Audit event stub opprettes.

---

## PR 08 — Artist upload draft

**Goal:** artist kan opprette draft track med metadata.

**Acceptance:**
- Kun artist/admin role.
- Draft status er eksplisitt.
- Ingen public exposure før approval.

---

## PR 09 — Proof of Effort validation

**Goal:** PoE-input valideres og lagres for draft.

**Acceptance:**
- Named artist imitation blokkeres.
- Rights warranty er påkrevd.
- Private notes eksponeres aldri i public API.

---

## PR 10 — Admin review state transition

**Goal:** admin kan flytte track fra submitted til approved/rejected.

**Acceptance:**
- Approval krever EchoScore-ready eller eksplisitt override reason.
- Audit log skrives.
- Approved track dukker opp i public catalog.

---

## PR 11 — Minimal Playwright smoke

**Goal:** frontend-røyk: katalogside viser demo/public tracks og checkout CTA.

**Acceptance:**
- Test bruker stubbed API.
- Ingen ekstern nettverksavhengighet.

---

## PR 12 — CI hardening

**Goal:** CI kjører install, typecheck, tests, static scripts og artifact upload ved feil.

**Acceptance:**
- CI blokkerer PR ved kontraktbrudd.
- Cache er konfigurert.
- Static scripts kjører før build.
