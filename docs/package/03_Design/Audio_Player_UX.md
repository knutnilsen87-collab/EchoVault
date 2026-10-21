# Audio Player UX

## MVP role
The audio player is for **previewing licensed catalog tracks**, not full B2C streaming retention.

## Behavior
- Player persists within the web session.
- No autoplay.
- Buyer can play/pause, seek, mute and change volume.
- Preview uses compressed/stream-safe asset, not high-res WAV.
- On track detail, player shows trust metadata and license CTA nearby.
- In catalog grid, row play action should not navigate away.

## Player states
- Idle
- Loading
- Playing
- Paused
- Error
- Restricted/unavailable
- Track suspended

## Metadata display
Show track title, artist, duration, BPM, genre/mood, EchoScore pass badge and PoE badge.

## PoE flip / expanded trust view
The original concept includes “PoE Flip” on cover art. For MVP, implement as an expandable trust panel instead of heavy animation. Include creation mode, tools category, review date and warranty status. Avoid showing sensitive full prompt data.

## Accessibility
- All controls keyboard accessible.
- Use `aria-label` for icon-only controls.
- Progress bar must expose current time and duration.
- No playback should start automatically after page load.
