# Changelog

Entries describe the final state of completed development work. Earlier design iterations are included only where needed to explain the current baseline.

## Unreleased — 2026-10-06

### Added

- Rising-panel 6×12 match engine with swaps, gravity, combos/chains, attack cancellation, timed garbage, ceiling elimination, and animated gameplay feedback.
- Real room-code WebSocket multiplayer, authoritative simulation, host controls, targeting, rematches, disconnect forfeits, host transfer, and empty-room cleanup.
- Legal-move CPU opponents with three difficulty levels, mixed rooms, and battles up to 99 total players.
- Separate-device 2P Duel, 4P free-for-all, and 2v2 team modes, balanced seats, friendly-target exclusion, and shared team victory.
- Classic/Rush rules, charged Pulse defense/team rescue, personal browser-local records, keyboard and touch controls.
- Original Cascadia 99 pixel wordmark/favicon, local VT323 font with license, and 80s arcade website styling.
- Four retro pixel glyphs: Skull, Cyber-Eye, Radiation, Twin Bolts. Heavy Bayer tile shading, dithered cast-iron slabs, pixel CPU core, and stippled board well.
- Five immediate palette themes with saved preferences: Neon Arcade, Midnight Violet, Tokyo Night, Amber Terminal, Polar Frost; independent light/dark mode.
- Procedural gameplay sound effects and four original adaptive soundtracks: Neon Afterglow, Midnight Circuit, Cassette Coast, Chrome Runner. Live track switching, homepage preview, persistent mute/track choices, and audio cleanup.
- Homepage actual-gameplay GIF/still, reduced-motion support, palette/pixel/audio browser checks, demo rendering, and offline calm/danger soundtrack rendering.
- Render hosting configuration, hosting/Godot/visual guidance, conversation export, and project status handoff.
- Electron scaffolding and manual desktop packaging workflow retained for later resumption; old prototype artifacts are not current releases.

### Changed

- Working title changed from Panel 99 to Cascadia 99; name remains uncleared and package stays at development version 0.3.0.
- Active scope narrowed to the web version; Linux/macOS/Windows packaging and any Godot port are deferred.
- Tile generation and garbage releases now use exactly four types. Earlier playful, flat-glyph, and Neon Core designs were superseded by the current retro system.
- Garbage now falls as 3–6-column connected slabs, capped at three rows, and releases colored rows bottom-to-top after adjacent matches.
- Match layout scales to the viewport; small VS/team fields keep all rival boards visible, and palette/music controls remain accessible during play.
- Project moved to `/home/thinkypad/Projects/panel-99`; run instructions now use the new location.
- Homepage player setup redesigned into a compact 504–517px desktop card with two-column settings, side-by-side solo/friends actions, compact joining, and inline records. The entire card fits above the fold at checked desktop sizes, including 1280×720.

### Fixed

- Removed duplicate homepage logos and kept the demo above the fold at checked sizes.
- Replaced garbled low-frame-rate GIF encoding with an eight-second, 400-frame, 50 FPS loop, a 256-color palette, and no extra encoding dithering.
- Prevented page scrolling/clipped match controls across checked viewport sizes; reserved space for the customization bar in small-match rival layouts.
- Preserved shape cues in grayscale and froze/suppressed visual effects for reduced-motion users.

- Updated the existing server smoke assertion to match the redesigned Play CPUs button label.

### Validation

- 49 automated tests passed in the latest full run.
- Browser checks passed for 98 CPUs, all VS/team modes, live theme/track switching and persistence, audio/mute, seven gameplay viewport sizes, homepage demo/card bounds, Bayer palette output, and reduced motion.
- All four tracks passed calm and danger offline signal checks without clipping or silent bars.
- Demo render verified a chain, slab break, and bottom-to-top conversion. Public 99-human load testing and native-platform validation remain pending.
