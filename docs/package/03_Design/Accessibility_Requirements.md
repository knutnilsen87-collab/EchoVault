# Accessibility Requirements

## Target
WCAG 2.2 AA equivalent for MVP.

## Core requirements
- Keyboard access for all catalog, preview, checkout and admin flows.
- Visible focus indicators on all interactive elements.
- Sufficient contrast for dark mode.
- Audio player controls must have accessible labels.
- Do not rely on color alone for statuses.
- Form errors must be programmatically associated with inputs.
- License terms acceptance must be screen-reader accessible.
- Toast notifications must not be the only place critical information appears.
- Modals/drawers must trap focus and restore focus on close.
- Tables/data grids must preserve readable structure.

## Audio-specific accessibility
- Play/pause buttons must have text labels or aria labels.
- Progress scrubber must be keyboard-operable.
- Volume control should not be required for primary task completion.
- Autoplay should not occur.
- Visual waveform is supplemental, not required to understand license status.

## Testing
- Keyboard-only pass for buyer checkout flow.
- Screen-reader smoke test for catalog, track detail, checkout and license dashboard.
- Automated axe/lighthouse check in CI for core routes.
