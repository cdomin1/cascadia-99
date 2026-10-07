# Changelog

## 2026-10-06 — Expanded homepage gameplay showcase

- Expanded the homepage GIF from eight to 33 seconds, showing Flux generation, chains, slab conversion, Pulse, Shift, Surge, and Overdrive with live meters, costs, hold/countdown and garbage counters.
- Reused the authoritative footage source shared with native tutorials, added explicit example labels, pause/play and reduced-motion/flashing stills, and refreshed accessible text/cache URLs. Passed 76 JavaScript tests plus responsive browser playback/reduced-effects and native/web tutorial checks. Added capture-rate parity and gameplay-coverage tests. No gameplay or balancing changes.

## 2026-10-06 — Animated How to Play tutorials

- Added ten selectable pixel-art demonstrations in both web and Godot Help, covering every mode, chains, garbage, and all Flux abilities. Recorded mode footage from real server/CPU rooms and mechanics from the existing authoritative engine.
- Generated web GIFs/stills and identical-source native atlases; added captions, pause, native scrolling, and static reduced-motion/reduced-flashing fallbacks. Corrected the old Pulse cost instructions and completed native controller help.
- Added reproducible recording/rendering, explicit HTTP asset routes, desktop asset inclusion, and native/web tutorial QA. Passed 73 JavaScript tests and paired Help playback/accessibility/layout checks. Gameplay and balance are unchanged.

## 2026-10-06 — Phase 1C retro effects (feature/phase-1c-retro-vfx)

- Reworked both clients’ effects into opaque pixel fragments, stepped shockwaves/sweeps, bitmap combo/chain/ability popups, short pixel-snapped board impacts, and segmented Flux meters with high-charge palette cycling/full-charge sparks.
- Added native swap, fall, cursor, match compression/flash, and garbage-drop animation on a fixed 360×720 nearest-filtered board surface. Preserved original tile/glyph/slab artwork, palettes, controls, and responsive menus.
- Added industrial garbage recoil, debris, hazard palette changes, cyan seams, and discrete fractures; existing authoritative bottom-to-top conversion remains intact. Kept effects behind tiles or out of occupied cells.
- Added distinct square/triangle/noise ability stingers, escalating chains, and heavier garbage feedback while preserving adaptive music and mute preferences.
- Honored shake/flashing/reduced-motion settings, bounded effect pools/caches, and kept hit-stop local to presentation. Phase 1 gameplay, balance, server, modes, and CPU rules are unchanged. No Phase 2 work.
- Passed 70 JavaScript regressions, 18 paired native/browser render fixtures, Phase 1 controls/recovery, browser/native UI and audio checks, and native protocol/cross-play checks. Added shared bitmap/palette parity checks, local render timing samples, and native stinger PCM/mute checks. Refreshed the actual-gameplay homepage GIF/still and documented the NES visual standards in AGENTS.md and RETRO-VFX.md.

## 2026-10-06 — Phase 1 Flux (feature/phase-1-flux)

- Added shared configurable Flux rewards and authoritative Pulse (35), Shift (60), Surge (75 / 8s), and Overdrive (100 / 3s hold / 10s) rules, CPU decisions, eligibility snapshots, cooldowns, and duplicate-request rejection.
- Extended existing Pulse teammate rescue. Added safe slab cropping for bottom-row Shift; attacks, generation, natural rise, and chain grace use server modifiers.
- Added four ability controls, animated Flux meter, buff countdowns, cyan/magenta activation/perimeter effects, local hit-stop, directional board/viewport shake, particles/sweeps/waves, persistent shake/flashing preferences, reduced-motion support, and an additional Overdrive synth layer to both clients.
- Added transient session recovery that preserves board/resources/timers/targeting/request history while simulation continues. Explicit leave and expired sessions retain forfeiture/cleanup behavior.
- Preserved the actual current pixel visual identity, modes, CPUs, palettes, soundtracks, records, and existing inputs. Documented browser/native presentation and delivery differences in `PHASE1.md`.
- Added unit, real WebSocket, and actual web/native UI Phase 1 checks; retained existing browser/audio/native/cross-play regression checks. 99-seat CPU/protocol coverage does not establish 99-human Internet scalability.
- Verified the GitHub baseline before branching; keep tested local and GitHub feature-branch updates together per user instruction.


Entries describe the final state of completed development work. Earlier design iterations are included only where needed to explain the current baseline.

## Unreleased — 2026-10-06

### Godot 4 milestone

- Started the user-authorized Godot port in `godot/project.godot`, imported it with installed Godot 4.7.2 Compatibility, and opened it in the editor.
- Added a native video-game title menu and separate CPU/host/join setup, lobby/team, Options/help, match and result/rematch interfaces.
- Implemented native WebSocket client compatibility with the existing authoritative Node server, including large 99-player snapshots. CPU games still require that server; offline GDScript simulation is pending.
- Added keyboard/mouse/gamepad control mappings, any-device input, D-pad/stick movement, explicit controller menu confirm/back, and safe release of stack boosting.
- Exported original tile/font/wordmark assets and five palettes/four compositions into the Godot project; implemented native board/slab dithering, match and combo overlays, local records/preferences, live palette Options, and a first native adaptive PCM music/effects port.
- Added repeatable Godot asset export, protocol/cross-play checks, graphical synthetic-controller/resize checks, and native PCM checks. Full animation/audio parity and export packaging remain pending.
- Verified real Godot clients in 2P, 4P, teams, and 99-player CPU rooms, plus a shared browser-host/Godot-client duel. Physical controllers and 99-player graphical performance still need testing.


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
