# Design Implementation DoD — Sprint 1 Lock

## Purpose
This document converts the EchoVault visual direction into implementation-level completion criteria. It exists so developers and AI coding agents do not reinterpret the brand on every screen.

## Sprint 1 design lock
Sprint 1 must commit the following files:

```txt
apps/web/tailwind.config.ts
apps/web/src/app/globals.css
apps/web/src/app/layout.tsx
apps/web/src/components/ui/license-button.tsx
apps/web/src/components/ui/checkout-drawer.tsx
```

## Required Tailwind tokens
The Tailwind theme must define:

```ts
colors.echo.dark = "#0A0A0A"
colors.echo.surface = "#121212"
colors.echo.border = "#262626"
colors.echo.cyan = "#00F0FF"
colors.echo.purple = "#8A2BE2"
colors.echo.muted = "#888888"
fontFamily.sans = ["var(--font-inter)", "sans-serif"]
fontFamily.mono = ["var(--font-jetbrains-mono)", "monospace"]
backdropBlur.glass = "12px"
```

## UI invariants
- App background is `bg-echo-dark`.
- Panels/cards are `bg-echo-surface`.
- Borders are `border-echo-border`.
- Primary purchase action is `bg-echo-cyan text-black`.
- Metadata uses `font-mono text-echo-muted`.
- PoE/provenance accent uses `text-echo-purple` or `border-echo-purple/40`.
- Checkout drawer uses `bg-echo-surface/80 backdrop-blur-glass border-l border-echo-border`.

## Done checklist
A screen/component passes design DoD only when:

| Check | Required |
|---|---:|
| Uses Tailwind `echo.*` tokens | Yes |
| No unapproved arbitrary hex colors | Yes |
| Metadata rendered with monospace | Yes |
| Primary CTA uses cyan and is unique | Yes |
| Liquid glass used for drawer/overlay | Yes |
| Keyboard focus visible | Yes |
| Reduced-motion safe | Yes |
| Empty/loading/error states styled | Yes |
| Mobile/responsive minimum handled | Yes |
| Screenshot reviewed against design direction | Yes |

## Anti-drift rules
- Do not introduce extra accent colors.
- Do not use cyan as general decoration.
- Do not use bright gradients as page backgrounds.
- Do not replace monospace metadata with standard UI text.
- Do not make the product feel like a consumer streaming app before B2B licensing is validated.

## Acceptance test examples
- In the catalog, BPM/LUFS/price must visibly use monospace.
- In checkout, only the active tier and final License button should use cyan emphasis.
- Opening checkout must preserve page context through blur/transparency.
- The track detail page must communicate technical precision without looking like a crypto dashboard.

## Evidence labels
- **Observed:** Visual direction was explicitly specified by founder/user as Dark Mode + Neon, Editorial & Monospace and Liquid Glass.
- **Inferred:** Encoding these rules as Tailwind tokens and DoD reduces implementation drift.
- **Speculative:** The exact tokens may require refinement after real buyer usability testing.
