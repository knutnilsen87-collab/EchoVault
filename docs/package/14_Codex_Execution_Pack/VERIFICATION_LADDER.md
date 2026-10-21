# Verification Ladder

Codex skal bruke lavest mulig verifikasjonsnivå som faktisk dekker endringen.

## Level 0 — Static contract check
Bruk ved docs, scripts, ownership maps og file presence.

```bash
pnpm verify:static
```

## Level 1 — Package typecheck
Bruk ved TypeScript-endringer i ett package.

```bash
pnpm --filter <package> typecheck
```

## Level 2 — Targeted tests
Bruk ved domene- eller API-logikk.

```bash
pnpm --filter <package> test
```

## Level 3 — App build
Bruk ved route, UI, server config og Next.js-endringer.

```bash
pnpm --filter @echovault/web build
```

## Level 4 — Vertical smoke
Bruk ved checkout, webhook, entitlement eller DB-endringer.

```bash
pnpm test:smoke
```

## Closure rule

Ingen PR er grønn uten at valgt verifikasjonsnivå er oppgitt i PR-beskrivelsen.
