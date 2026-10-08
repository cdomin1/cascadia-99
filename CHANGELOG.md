# Changelog

## 2026-10-07 — Generated music retired; external soundtrack integration

- Branch: `feature/external-music-only`. Retired all generated soundtrack scores, composition/render tools, music-only synthesis voices, preview recordings and native music worker/sample sequencer. No replacement music, MIDI, placeholder or procedural fallback. Earlier audio entries below describe retired checkpoints.
- Preserved every gameplay/UI SFX event and all 69 byte-identical prebuilt native buffers. Shared SFX/mix data now lives in `audio-config.mjs` and `godot/assets/audio-config.json`. Retained independent mute, 85/75/85 defaults, power-1.5 sliders, saved low/zero preferences, SFX calibration and peak protection.
- Added empty shared `assets/audio/music/manifest.json`, menu/gameplay/results/stems directories, mirrored native assets and `npm run music:sync`. Lightweight file players support category selection, loops, fades, transitions and missing files; Settings shows NO TRACKS INSTALLED. No music processing occurs with an empty library. See `docs/MUSIC_IMPORTS.md` and `docs/AUDIO_OVERHAUL.md`.
- Baseline **104/104**, updated automated suite **105/105** passed. Native import, empty/missing library/SFX/mute, native/browser Phase 1 ability/reconnect, browser UI/all modes/99 CPUs/six viewport sizes/zoom/fullscreen, native saved low/zero preferences, synthetic controller navigation, offline Tutorial/Practice, repeated countdown/scene reload, all fifteen slider points on each platform and overlapping SFX output captures passed. Browser stress peaks stayed below .930; native default overlap capture peak .69848, RMS .11382, zero music starts.
- Actual licensed music playback/loop seams and physical speaker/headphone parity await supplied recordings. No human listening or Firefox certification. Gameplay/balance/authority unchanged.


## 2026-10-07 — Audio/music rewrite and mix correction

- Branch: `feature/audio-music-overhaul`. Replaced all four short-loop compositions with authored 64-bar scores (104–137 seconds), original six-note motif, distinct electro/funk bass/drum grooves, answers/breaks/returns and aligned Momentum/Danger/Critical/Surge/Overdrive parts. Stable saved track IDs retained.
- Corrected compounded attenuation and the web shared-master SFX-mute bug. Both clients expose Master/Music/SFX with 85/75/85 defaults, a power-1.5 curve, one-time low/zero preference migration and independent mute. Native buses and web peak protection preserve headroom.
- Native burst testing exposed main-thread SFX synthesis stalls; 69 generated reusable PCM buffers now avoid that work during play. Final 30-second real-device capture: peak .69845, RMS .08249, zero underruns, one primary start. Master-fader handling is explicit in the capture harness.
- Verification: baseline **99/99**, final **104/104** automated tests passed; native import/PCM, real native/browser ability/reconnect checks with music active, native synthetic controller Settings navigation, browser UI/all modes/99 CPUs/six viewports/zoom/fullscreen, native and web saved-setting migration, all fifteen slider points on each platform, four two-loop Chromium renders plus two native PCM loops per track (about sixteen minutes of material per platform), and extreme overlapping-effects peak checks passed.
- Browser A/B default output measured +20.6–21.4dB RMS; new full renders −21.3 to −19.7 LUFS. Playable excerpts, exact mix architecture, source locations, commands and limitations: `docs/AUDIO_OVERHAUL.md`, `docs/OST_STATUS.md`, `docs/audio-preview/`.
- **Human listening approval remains pending.** These are authored review compositions, not a finished album. No Firefox listening, physical speaker/headphone parity, new long native soak, controller hardware or 99-human scalability claim. No Phase 2 or gameplay/balance/authority changes.


## 2026-10-07 — Opponent field visibility and target bounds

- Corrected web BR stretched grid tracks/100%-height mini canvases and container-level highlights; outlines now follow fixed-aspect board bounds. Target changes no longer scroll the field.
- Active opponents use readable cool geometry/perimeters/identifiers; targets remain amber and incoming attackers red. Eliminated displays lose internal detail and extinguish. Matched brightness hierarchy in Godot without changing native layout or gameplay.
- Added `smoke:opponents` for 98-seat aspect, no-reflow/no-scroll targeting, highlight bounds and active/target/eliminated rendering checks across five sizes. See `docs/OPPONENT_FIELD_FIX.md`.


## 2026-10-07 — Homepage correction + Kode Mono

- Restored one-action CPU launch and direct online/setup access without redundant homepage navigation. Added local Kode Mono variable font and OFL licensing to web/native UI and event text, with offline cache and shared typography tokens. Gameplay, audio managers and brand assets preserved.


## 2026-10-07 — UI/UX simplification

- Removed selectable visual themes and stale preference handling; retained canonical design tokens, audio selection and accessibility.
- Simplified web title/header and selected-mode configuration; removed homepage showcase and permanent settings chrome.
- Enlarged responsive gameplay boards, removed native background grid and unnecessary boxes, and made threat/ability/target information contextual.
- Added progressive Tutorial visibility, success-gated Next, Practice tools in Pause, compact targeting strategy controls and controller-accessible navigation.
- Fixed client identity restoration when returning from offline training to multiplayer. No gameplay balance changes.
- See `docs/UI_UX_SIMPLIFICATION.md` for verification and limitations.

## 2026-10-07 — Neo-Vector + Phase 1E feature branch

- Superseded NES final art direction with original shared vector tiles, lettering, selector, Glitch geometry, bounded particles/instability and Flux ability presentation across Godot/web.
- Added optional first-launch onboarding, seven real-engine interactive lessons and configurable offline Free Practice, isolated from competitive balance/records.
- Improved controller repeat/arbitration, targeting, focus/navigation, generic prompts and disconnect fallback; added standard browser Gamepad API support.
- Adapted authoritative battle initialization and relevant-opponent attack paths to vector presentation; retained multiplayer rules and Phase 1 balancing.
- Preserved native music architecture; improved browser phase continuity, bar-aligned track changes and persisted separate volume controls. Existing arrangements remain prototypes.
- Added reduced-motion/effect-quality settings, responsive fixes and regenerated shared demonstrations. See `docs/NEO_VECTOR_DELIVERY.md` for verification and remaining hardware/listening/export limitations.


## 2026-10-06 — Neo-Vector foundation

- New canonical direction: **Neo-Vector Arcade — “1982, BUT IMPOSSIBLE.”** Supersedes NES/pixel-art requirements without discarding working systems.
- Audited both clients, server, input, audio, settings and tests. Added shared presentation tokens and native loader, implementation audit and style guide.
- Baseline: 82/82 automated tests passed; existing Godot intro launch and responsive browser regression checks passed. Interactive offline Tutorial/Practice and new presentation/input work remain pending; this is not milestone completion.
- See `docs/NEO_VECTOR_IMPLEMENTATION.md` for checkpoint status and `docs/NEO_VECTOR_STYLE_GUIDE.md` for canonical standards.

## 2026-10-06 — Integrated Phase 1 polish verified

- Combined server-synchronized native intro/audio with web/Godot selector and Battle Royale targeting updates. Fixed media-change synchronization for homepage accessibility controls.
- Passed 82 regression tests and paired live-client/pixel/geometry/start-flow checks. Completed 10-minute title and 15-minute battle audio-device soaks without restarts or buffer underruns; automated checks do not replace human listening or Internet load testing.

## 2026-10-06 — Godot battle intro and persistent audio

- Added ready acknowledgements, server deadlines, a pixel wipe/reveal, READY, exact 3/2/1 and GO, resumed-match handling and a reusable native component. Gameplay remains frozen until the shared start.
- Replaced frame-driven music scheduling with a persistent autoload, buffered worker/sample clock, independent buses/volume, phase-preserving mute/reconnect/scene reload and bar-aligned adaptive changes. Preserved original compositions and Flux rules.
- Verified 80 JS tests, four-mode native/crossplay, Flux, intro/accessibility and repeated-match/scene-reload checks, plus four-composition PCM tests. See `BATTLE-INTRO-AUDIO.md` for causes, commands and platform differences; real-time audio soak verification is recorded at final delivery.

## 2026-10-06 — Battle Royale targeting visualization

- Added amber target borders/player numbers, outgoing amber and incoming red pixel trajectories, size-based intensity and short impacts in both clients. Server-confirmed IDs and per-match event sequences provide endpoints and duplicate rejection; combat rules are unchanged.
- Capped local effects at eight, reserved cyan presentation for future Reversal, added static reduced-motion/reduced-flash rendering and compact numbered opponent layouts. Automatic targeting highlights the last confirmed recipient because existing auto rules choose on attack.
- Verified 78 regression tests, 24 exact native/web geometry fixtures and live server flows including 99 CPU seats. See `TARGETING-VFX.md` for scope, commands and limitations.

## 2026-10-06 — High-contrast two-tile selector

- Replaced both selectors with an original rectangular 120×60 pixel outline: 7px dark border, inset 3px white/pale-cyan stroke, transparent interior, subtle two-frame palette cycle. Reduced motion/flashing uses static white.
- Removed cursor interpolation; authoritative cursor cells display immediately. Drawn above tile effects with visible edge bounds, including partially raised top rows and board shake. Refreshed shared tutorials and homepage footage.
- Verified 76 regression tests and 36 exact native/web selector pixel fixtures; modes retain the same input, swaps, Flux and targeting rules.

## 2026-10-06 — VEXELON 99

- Renamed the game across web, Godot and desktop packaging. Updated shared pixel wordmarks, homepage animation title, hosting manifest and current documentation.
- Preserved existing preferences/records using compatible storage identifiers and native settings migration. Gameplay and Flux balance remain unchanged. Verified 76 regression tests, web/native/desktop smoke checks, Godot import and Linux unpacked packaging.

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
