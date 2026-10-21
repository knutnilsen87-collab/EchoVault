# Design System

## Design direction
**Deep Editorial & Liquid Glass**

EchoVault should feel premium, precise and trust-oriented: closer to a technical editorial licensing terminal than a playful music app. The product is dark, quiet and structured. Visual energy is reserved for conversion and active state decisions.

## Product feeling
- **Dark Mode + Neon:** Deep, almost ink-black background lets the catalog, trust data and licensing actions carry the experience.
- **Editorial & Monospace:** A geometric sans-serif drives the main interface. Technical data uses monospace strictly: BPM, LUFS, price, time spent, license IDs, certificate IDs and analysis values.
- **Liquid Glass:** Checkout, documentation overlays and trust panels use semi-transparent surfaces with backdrop blur so the user keeps context while music preview continues.

## Principles
- Clarity over decoration.
- Trust over hype.
- Fast scanning for buyers.
- Technical precision for metadata.
- Friction only where it increases trust.
- Accessibility by default.
- Neon accents are scarce and intentional.

## Locked color tokens

| Token | Value | Use |
|---|---:|---|
| `echo.dark` | `#0A0A0A` | Main app background |
| `echo.surface` | `#121212` | Cards, panels, drawer surfaces |
| `echo.border` | `#262626` | Subtle layout dividers |
| `echo.cyan` | `#00F0FF` | Primary CTA, active checkout state, conversion moments |
| `echo.purple` | `#8A2BE2` | Secondary accent for PoE/provenance metadata |
| `echo.muted` | `#888888` | Secondary technical data |
| `white` | `#FFFFFF` | Primary text |

## Accent usage rule
`echo.cyan` must be used only for:
- License / buy CTA.
- Active checkout choice.
- Focus/active control where conversion or decision clarity is required.
- Rare progress/status emphasis.

Do **not** use cyan for decorative borders, random icons, badges or large backgrounds.

`echo.purple` may be used for:
- Proof of Effort metadata.
- Provenance/trust indicator.
- Secondary active state where cyan would compete with the purchase CTA.

## Typography
- UI/headings: `Inter` or equivalent geometric sans.
- Data/metadata: `JetBrains Mono` or equivalent monospace.
- Monospace is mandatory for BPM, LUFS, price, duration, time spent, license tier metadata, certificate ID and analysis values.
- Minimum body size: 16px.
- Avoid thin font weights for key actions.

## Materiality
Liquid glass surfaces use:
- semi-transparent black/surface background,
- `backdrop-blur-glass`,
- subtle border,
- no heavy shadows,
- context-preserving overlays.

Use for:
- checkout drawer,
- license comparison modal,
- PoE documentation panel,
- certificate preview,
- admin review side panel.

## Tailwind design lock

This exact Tailwind configuration must be placed in `apps/web/tailwind.config.ts` during Sprint 1.

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        echo: {
          dark: "#0A0A0A",
          surface: "#121212",
          border: "#262626",
          cyan: "#00F0FF",
          purple: "#8A2BE2",
          muted: "#888888",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backdropBlur: {
        glass: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
```

## Global CSS baseline

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

html,
body {
  min-height: 100%;
  background: #0A0A0A;
  color: #FFFFFF;
}

body {
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}

::selection {
  background: rgba(0, 240, 255, 0.22);
}
```

## First components to standardize
- Button
- License CTA
- License tier card
- Track row / editorial data grid
- Track detail trust card
- Audio preview player
- Checkout drawer
- PoE summary card
- Admin review panel
- Status badge
- Toast/alert
- Modal/dialog
- Empty/error/loading states

## Component rules

### Primary License CTA
- Uses `echo.cyan`.
- Must be visually unique.
- Should not compete with other neon elements on the page.

### Editorial data grid
- Dark background.
- Row separators use `echo.border`.
- Technical values use `font-mono`.
- Track title and artist use `font-sans`.

### Checkout drawer
- Slides in from the right.
- Uses liquid glass surface.
- Keeps page/audio context visible.
- Active tier uses cyan outline or subtle cyan glow.
- Legal/permission details must remain readable, not hidden behind motion.

### PoE / provenance panel
- Purple accent is acceptable.
- Data values use monospace.
- Human-readable trust explanation uses sans-serif.

## Accessibility requirements
- Dark mode contrast must meet WCAG 2.2 AA where practical.
- Do not rely on color alone for status.
- Focus states must be visible.
- Checkout drawer must trap focus.
- Escape closes drawer unless payment process has already started.
- Motion must respect `prefers-reduced-motion`.

## Design Definition of Done
A UI task is not done unless:
- It uses locked `echo.*` tokens.
- Technical metadata uses `font-mono`.
- Primary purchase action is the only dominant cyan CTA on the surface.
- Drawer/modal surfaces use the liquid glass standard.
- Keyboard navigation and visible focus states are implemented.
- Empty/loading/error states follow the same visual system.
- No arbitrary color hex values are introduced without design review.

## Evidence labels
- **Observed:** Original EchoVerse blueprint defines Deep Editorial & Liquid Glass, dark mode, neon accents, sans/monospace split and backdrop blur direction.
- **Inferred:** Tailwind tokens should be locked at Sprint 1 to prevent visual drift across builders and AI coding agents.
- **Speculative:** This specific visual style will improve conversion or buyer trust; that must be tested through buyer behavior and usability sessions.
