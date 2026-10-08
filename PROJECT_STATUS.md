# VEXELON 99 — Project Status

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

- Restored direct two-zone web match setup, persistent name/mode/CPU/difficulty/rules, immediately visible Create Room/Join; retained simplified gameplay HUD. Locally bundled licensed Kode Mono across both clients, including custom gameplay text. See `docs/HOMEPAGE_TYPOGRAPHY.md` for tests/assets/limitations.


## 2026-10-07 — UI/UX simplification

- Dedicated branch: `feature/ui-ux-simplification`. Canonical palette only; obsolete theme scripts, palette data, controls and persistence removed safely. Audio and accessibility retained.
- Both clients now prioritize black space, larger boards, compact contextual HUDs, progressive title/mode setup, lesson-specific Tutorial UI and Pause-based Practice tools/settings/controls. Native grid removed; active target strategy is cycled without a dropdown.
- Verification and before/after captures: `docs/UI_UX_SIMPLIFICATION.md`. Gameplay core/balance unchanged. Physical controller testing and fresh long listening remain pending.

## 2026-10-07 — Neo-Vector / Phase 1E feature delivery

- Branch: `feature/neo-vector-phase-1e`. Both clients now use shared semantic vector geometry, original line lettering, corrupted Glitch slabs, high-contrast two-cell selector, bounded geometric effects/Vector Instability, capacitor Flux and coherent abilities. Shared recorded Help/homepage demonstrations regenerated.
- Added seven interactive real-engine lessons, optional persisted onboarding and relaxed Free Practice with safe recovery, options and training attacks. Browser cached offline reload verified; native offline source build requires Node 22+ and adjacent training helper.
- Added time-based dominant-axis controller movement, targeting, generic dynamic prompts, modal focus/navigation and browser standard Gamepad API support. Synthetic navigation/gameplay checks passed; physical controller families and full controller-only lesson traversal remain unverified. No rumble implementation.
- Preserved authoritative multiplayer/countdown and Phase 1 balance. Existing counter reward remains unconfigured; no new +8 bonus or Phase 2 mechanics. Native four-mode/99-CPU protocol and browser crossplay passed. 99 CPUs do not prove 99-human scalability.
- Browser music now preserves scheduling through mute/scene/pressure changes and queues track switches at bar boundaries. Native persistent synthesis retained; independent volumes persisted. Four arrangements and the short identity motif are prototypes, not a finished OST. Fresh long human listening remains pending.
- Verification: **96/96 automated tests passed**, zero skipped. Passed native import, paired 18-effect fixtures, 36 selector fixtures, confirmed targeting/99-CPU layout, native four-mode protocol/crossplay, actual Phase 1 controls/costs/reconnect, seven-viewport/all-mode browser regression, paired ten-clip Help viewers, repeated native starts/scene reload, native PCM audio, synthetic controller menus and both offline onboarding flows including cached browser reload.
- Local effect fixture observations: native frame-wall p95 16.825ms (includes display timing), web draw p95 .300ms across 540 samples. These are local observations, not supported-hardware certification. Phase 1 native test still emits an 11-instance ObjectDB exit warning from its test harness; current controller/offline/Help/battle-flow launch checks exit without that warning. Electron emits an X11 presenter diagnostic while checks pass.
- Detailed parity, implementation scope and validation gaps: `docs/NEO_VECTOR_DELIVERY.md`; soundtrack status: `docs/OST_STATUS.md`.


## 2026-10-06 — Neo-Vector milestone — Checkpoint A

- New canonical direction: **Neo-Vector Arcade — “1982, BUT IMPOSSIBLE.”** Supersedes NES/pixel-art requirements without discarding working systems.
- Audited both clients, server, input, audio, settings and tests. Added shared presentation tokens and native loader, implementation audit and style guide.
- Baseline: 82/82 automated tests passed; existing Godot intro launch and responsive browser regression checks passed. Interactive offline Tutorial/Practice and new presentation/input work remain pending; this is not milestone completion.
- See `docs/NEO_VECTOR_IMPLEMENTATION.md` for checkpoint status and `docs/NEO_VECTOR_STYLE_GUIDE.md` for canonical standards.

## Final combined verification (2026-10-06)

- Integrated the synchronized Godot battle intro, persistent audio, matching two-cell selector and Battle Royale trajectories on `feature/godot-battle-intro`. Selector/targeting commits also remain on `feature/phase-1c-retro-vfx`.
- **82 JavaScript tests passed**. Passed web responsive/all-mode/reduced-effects checks, native UI/controller checks, four-mode/99-CPU protocol and crossplay, Phase 1 ability/resume checks, exact intro component timing, repeated native starts/scene reload, 36 exact selector pixel fixtures, 24 exact trajectory geometry fixtures, and live native/web targeting flows with one and 98 CPUs.
- Real PulseAudio playback: **600 seconds title** (muted output in a separate process) and **900 seconds battle** passed with one primary player, no restarts, no generator underruns and bounded non-silent PCM. Four-composition PCM tests also passed. This is automated audio verification, not a human listening review or fifteen minutes of interactive gameplay. The standalone soak harnesses reported one ObjectDB object on immediate process exit; normal scene-flow checks exited cleanly.
- No Phase 2 mechanics, Flux balance or target selection rules were added. Automatic target borders identify the last confirmed recipient; compact minimum windows may require opponent scrolling. Tests do not establish 99-human Internet scalability or universal 60 FPS. See `BATTLE-INTRO-AUDIO.md` and `TARGETING-VFX.md`.

## 2026-10-06 — Godot battle intro and persistent audio

- Added ready acknowledgements, server deadlines, a pixel wipe/reveal, READY, exact 3/2/1 and GO, resumed-match handling and a reusable native component. Gameplay remains frozen until the shared start.
- Replaced frame-driven music scheduling with a persistent autoload, buffered worker/sample clock, independent buses/volume, phase-preserving mute/reconnect/scene reload and bar-aligned adaptive changes. Preserved original compositions and Flux rules.
- Verified 80 JS tests, four-mode native/crossplay, Flux, intro/accessibility and repeated-match/scene-reload checks, plus four-composition PCM tests. See `BATTLE-INTRO-AUDIO.md` for causes, commands and platform differences; real-time audio soak verification is recorded at final delivery.

## 2026-10-06 — Battle Royale targeting visualization

- Added amber target borders/player numbers, outgoing amber and incoming red pixel trajectories, size-based intensity and short impacts in both clients. Server-confirmed IDs and per-match event sequences provide endpoints and duplicate rejection; combat rules are unchanged.
- Capped local effects at eight, reserved cyan presentation for future Reversal, added static reduced-motion/reduced-flash rendering and compact numbered opponent layouts. Automatic targeting highlights the last confirmed recipient because existing auto rules choose on attack.
- Verified 78 regression tests, 24 exact native/web geometry fixtures and live server flows including 99 CPU seats. See `TARGETING-VFX.md` for scope, commands and limitations.

## SNES-style selector (2026-10-06)

- Replaced both selectors with an original rectangular 120×60 pixel outline: 7px dark border, inset 3px white/pale-cyan stroke, transparent interior, subtle two-frame palette cycle. Reduced motion/flashing uses static white.
- Removed cursor interpolation; authoritative cursor cells display immediately. Drawn above tile effects with visible edge bounds, including partially raised top rows and board shake. Refreshed shared tutorials and homepage footage.
- Verified 76 regression tests and 36 exact native/web selector pixel fixtures; modes retain the same input, swaps, Flux and targeting rules.

Updated 2026-10-06. This document records the current implementation and work completed during the development conversation. The working browser game remains available, and development has now started on a native Godot 4 client. Package version is 0.3.0; it is a development snapshot, not a published release.

## VEXELON 99 rename (2026-10-06)

- Renamed public web, native Godot, desktop window/menu/package names, build artifact filenames, hosting manifest and current documentation to **VEXELON 99**. Rebuilt both pixel wordmarks from the shared bitmap alphabet and regenerated the homepage GIF/still with the new title.
- Preserved gameplay, balancing, storage keys and the stable desktop application ID/profile. Godot imports settings and records from the previous title's data directory on first launch. Existing icon artwork remains unchanged.
- Verification: 76 JavaScript regression tests, responsive web checks, standalone native Godot UI/controller checks, desktop runtime/name checks, Godot asset import and Linux unpacked packaging passed. The initial concurrent native check hit an input timing failure; its standalone rerun passed.
- Repository URL/project folder and historical release/conversation records retain their existing names. Windows/macOS packaging metadata is updated; no new platform binaries are published by this rename.

## Expanded homepage showcase (2026-10-06)

- Replaced the short homepage loop with a **33-second, 825-frame, 25 FPS** showcase: Flux-earning chains, slab breaks/conversion, Pulse, Shift, Surge, and Overdrive. Added a larger board, live segmented Flux gauge, score/chain/pending counters, ability costs, full-charge hold and buff timers.
- Footage uses the same authoritative engine examples as native How to Play; the higher capture rate does not change simulation or balance. Ability chapters clearly label their full-Flux starting examples. Godot retains these same six mechanics in its existing tutorial viewer; it has a native title menu rather than a website homepage.
- Added homepage pause/play and matching stills for reduced motion or reduced flashing, refreshed asset URLs/alt text, and reproducible `npm run demo:render`. The GIF remains 640×420 (~2.4MB), preserving the responsive homepage layout. `demo/showcase.json` records its chapters and timing.
- Verification: **76 JavaScript tests passed**, including gameplay coverage/capture-rate parity/assets; browser responsive playback/pause/reduced-effects and native/web tutorial checks passed. No gameplay, authority, audio, or Godot rules changed.

## How to Play — animated tutorials (2026-10-06)

- Added ten selectable demonstrations to both web Help and native How to Play: 2P, 4P, 2v2, 99-seat CPU Battle Royale, swaps/chains, garbage fracture/conversion, Pulse, Shift, Surge, and Overdrive.
- Mode footage comes from real local server rooms; mechanics footage uses the existing authoritative engine and ability transactions. The native player uses frame atlases from the same 80-frame/10 FPS recordings as the web GIFs. Web stills and native still frames have exact pixel parity.
- Added captions, pause/play, a scrolling native help body, and static fallbacks for reduced motion or reduced flashing. Web decodes only the selected GIF while Help is open; native loads one selected atlas. Corrected stale 100%-cost Pulse instructions and completed native ability controller help.
- Tutorial topics/copy are in `tutorials.mjs`; reproducible tooling is `npm run tutorials:render`. Added explicit tutorial asset routes and desktop asset inclusion; no server room/gameplay/balance rules changed. Shared current costs/timers come from Flux configuration when generating metadata.
- Verification: **73 JavaScript tests passed**, including recorded chain/conversion/ability-cost examples and tutorial assets/routing; native/browser tutorial smoke checks cover all ten clips, exact still pixels, topic changes, pause/reduced effects, real native Help integration, and desktop/mobile layouts. Generated assets are tracked; raw recordings/screenshots stay ignored. No public deployment or native export added.

## Phase 1C — Retro visual effects (2026-10-06)

- Ongoing user requirement: every Godot update must have the equivalent web update before pushing; document platform differences and check both clients.
- Completed on `feature/phase-1c-retro-vfx`, based on backed-up Phase 1 commit `0379786`. Tested work is committed/pushed to that feature branch and the original local project is updated to it; main is not merged.
- Both clients now use opaque pixel shockwaves/fragments, stepped board shake, bitmap popups, segmented Flux gauges, palette cycling/full-charge sparks, and distinct Pulse/Shift/Surge/Overdrive feedback. Preserved the original four glyphs/colors, Bayer art, dark slabs, pixel branding, modes, controls, and adaptive soundtrack.
- Godot now renders boards on a fixed 360×720 nearest-filtered SubViewport with stepped swaps, falls, cursor motion, four-frame match feedback/compression, garbage drops/recoil, seams/fractures, and ability effects. The homepage demo/still now use the retro renderer and bitmap lettering.
- Added square/triangle/noise stingers and heavier garbage/chain sounds. Reduced flashing/motion and four shake levels remain available; foreground effects avoid occupied cells and popups use free upper space. Effect lists and caches are bounded.
- Phase 1 authority/balancing files (`engine.mjs`, `abilities.mjs`, `flux-config.mjs`, `match-rules.mjs`, `bot.mjs`) and original music compositions are unchanged. The subsequent tutorial work only extends the server HTTP asset whitelist; server gameplay rules remain unchanged. No Phase 2 mechanics or native export added.
- Verification: **70 JavaScript tests passed**; 18 paired native/web visual fixtures including ×2–×6 chains, all abilities, garbage, Flux and reduced effects; actual Phase 1 controls/recovery; browser modes/palettes/audio/resizing; native menus/controller/resizing, protocol/cross-play and PCM/mute checks. Exact commands, architecture differences, and local performance observations are in `RETRO-VFX.md`. Artifacts remain ignored under `.web-smoke/`.
- Local single-board timing observations target 60 FPS, but no general device guarantee or 99-human scalability claim is made. Human feel/audio review, physical-controller testing, exports and production load/soak checks remain pending.

## Phase 1 — Flux (2026-10-06)

- Verified the clean baseline commit `1b97587` against `https://github.com/cdomin1/cascadia-99.git` before development. Phase 1 is on `feature/phase-1-flux`; implementation was isolated in a development worktree while the original demo stayed available. Completed changes are committed and pushed to that feature branch, with the original local project updated to it. Main remains the prior baseline.
- Added authoritative per-player Flux, configurable combo/chain rewards, 35-Flux Pulse extending the existing teammate rescue, stable-board Shift, timed Surge, and full-meter hold/Overdrive. CPUs use the same ability rules. Shared balancing is in `flux-config.mjs`; Godot receives it from the server.
- Both clients have Flux meters, ability controls, hold/countdown indicators, shake/flashing settings, local presentation-only hit-stop, energy effects, and an extra Overdrive synth layer. The current pixel tile/slab assets, palettes, game modes, and soundtracks are preserved.
- Added transient 15-second session recovery with fresh snapshots, ongoing server simulation, preserved Flux/timers/targeting, and request deduplication. Explicit leave forfeits; restart, reload, and app closure still do not provide durable session recovery.
- See `PHASE1.md` for exact rules, protocol, controls, existing web/native differences, test commands, and limits. `AGENTS.md` records shared server authority, effects constraints, and the user's preference to update local and GitHub copies as work completes.
- Verification: **63 JavaScript tests passed**; real Godot protocol/cross-play for 2P, 4P, 2v2, and a 99-seat CPU room; actual web keyboard/native button ability checks; native UI/controller/resize checks; browser audio/palette/seven-size regressions; native generated-audio checks. Test screenshots are local ignored artifacts under `.web-smoke/`.
- No 99-human Internet scalability claim or new native binary/export is made. Human balance/motion/audio playtesting and real network soak/load testing remain necessary.

## Location and running the project

- Current project directory: `/home/thinkypad/Projects/panel-99`. The complete folder was moved from `/home/thinkypad/Work/panel-99` and 8,816 files were verified after relocation.
- Local browser preview: `http://localhost:3000`. The Node server was restarted from the new directory and is running as of this handoff. A process may stop when its terminal/session closes; run `npm start` to start it again.
- Requires Node.js 22 or newer. The web server has no runtime dependencies. Electron and electron-builder are development dependencies for browser QA and deferred desktop packaging; use `npm ci` to install them.
- Commands: `npm start`, `npm test`, `npm run smoke:web`. Browser QA needs the preview server running and a working graphical Electron environment.
- GitHub backup: `https://github.com/cdomin1/cascadia-99.git`. The original web baseline is `53743f0`; Godot and the subsequent script update are backed up through `1b97587`. Current feature work is on `feature/phase-1c-retro-vfx`. No public deployment is configured.

## Accomplished in this session

### Gameplay and multiplayer

- Implemented a rising-panel matching engine on a 6×12 board: horizontal/vertical matches, swaps, gravity, chains, combo attacks, incoming attack cancellation, accelerating rise, and elimination after two seconds at the ceiling.
- Implemented real room-code multiplayer over a dependency-free Node HTTP/WebSocket server. Six-character codes, host settings/start permissions, live lobby/state updates, manual rival targeting, targeting strategies, rematches, disconnect forfeits, host transfer, and abandoned-room cleanup work.
- Added CPU opponents using legal cursor moves and swaps, with Easy/Normal/Hard difficulty and mixed human/CPU rooms up to 99 total competitors.
- Added 2P Duel, 4P free-for-all, and 2v2 teams on separate devices. Small modes enforce exact seat counts. Team attacks exclude allies; team assignment and host-controlled swaps work. An eliminated teammate shares the surviving team's win.
- Added Classic and Rush rules; Rush raises the stack 60% faster. Added Pulse defense: X or the button cancels up to six incoming cells, protecting a living teammate when the player's own queue is empty. Phase 1 replaces the old full-charge cost with 35 Flux.
- Added local best score, best chain, win count, and match records. Records and settings tolerate unavailable/corrupt browser storage.
- Added arrow-key movement, Space swapping, Shift raising, X Pulse, pointer/touch selection, and touch controls. Focused inputs/selects do not intercept gameplay keys.

### Visuals and site

- Renamed the working game to Cascadia 99 and created an original blocky pixel wordmark and favicon. The name is not trademark-cleared; a separate published game already uses Cascadia.
- Iterated playful/modern glyphs through four-tile flat and Neon Core designs, then replaced them with the current dithered retro hardware treatment. Those earlier treatments are superseded, not alternate selectable glyph sets.
- Current four tiles: Skull, Cyber-Eye, Radiation, and Twin Bolts. Generation and garbage releases use only these four types. Hard palette steps, pixel glyphs, 14% stepped corners, black frames, and exact 25%/50%/75% Bayer coverage replace smooth surface gradients and neon blending.
- Added rigid falling garbage slabs spanning 3–6 columns and 1–3 rows, recessed column notches, cast-iron dither bands, chunky hazard stripes, and a two-frame CPU core glow. Adjacent clears trigger a dither sweep and bottom-to-top conversion into regular tiles. Slabs fall as connected units.
- Added swap/fall/drop animations, match flashes, outward particles, attack projectiles, impact shake, combo/chain badges, and localized upper-board danger warnings. Reduced-motion settings suppress/freeze motion and flashes.
- Regenerated the homepage gameplay demo from the actual engine/renderer: 825 frames, 25 FPS, 33 seconds, 256-color palette without extra encoding dithering. It demonstrates Flux rewards, chains, slab conversion, and all four abilities. A matching still serves reduced-motion users. Only one logo appears on the homepage.
- Added an 80s arcade website shell: bundled VT323 pixel font and license, cyan/magenta accents, square cabinet frames, hard offset shadows, and a static grid background. No external font download is needed at runtime.
- Added independent light/dark appearance and five immediate palette themes: Neon Arcade, Midnight Violet, Tokyo Night, Amber Terminal, Polar Frost. Themes update the site, active tiles, rival boards, board well, particles, and slab surfaces; preferences persist locally. The prerecorded GIF retains its default Neon Arcade colors.
- Made the match view fit the window without page scrolling, including short desktop windows and small phones. Small-match opponent boards and the Pulse control remain visible.
- Redesigned the homepage setup card with tighter labels/fields, two-column settings, parallel Play CPUs/Create room actions, compact room joining, and inline records. The entire card is 504–517px tall in checked desktop layouts and fits above the fold at 1440×900, 1366×768, 1280×720, and 1024×768. Mobile uses a stacked layout with the demo above the card; the entire homepage is not expected to fit one phone screen.

### Audio

- Added procedural effects for movement, swaps, matches, chains, attacks, slab landings, countdowns, danger, and results.
- Added four original synthesized soundtracks: Neon Afterglow (86–132 BPM), Midnight Circuit (94–140), Cassette Coast (78–126), and Chrome Runner (100–148). Each has its own melody, chords, bass pattern, waveforms, and arrangement. Stack height/occupancy smoothly changes tempo and musical urgency; clears ease it back down.
- Added live soundtrack selection and homepage listening preview. Switching tracks retains the game and pressure state. Choosing a track while playback is stopped does not start it. Independent music mute and global sound mute persist locally; audio unlocks after a user gesture.
- Added lookahead scheduling, stereo instruments, echo, compression, fades, and audio-node cleanup. Offline render tooling exports calm/danger WAV listening samples under ignored `.web-smoke/`.

### Packaging, hosting, and handoff

- Earlier in the session, created Electron desktop scaffolding and prototype Linux/macOS/Windows artifacts. Linux prototypes were exercised locally; Windows/macOS require native testing. These old artifacts do not contain the current web features and are excluded from Git.
- User subsequently chose to focus exclusively on web. Desktop work is paused; its CI workflow is manual-only, and build IDs/artifact names retain legacy Panel 99 values.
- Added Render deployment configuration and `HOSTING.md`. Hosting requires one Node process with WebSocket support; static-only hosting is insufficient. No public service has been created.
- Added `GODOT.md` with migration guidance, then resumed Godot work at the user’s request. The first native client now reuses the authoritative server and has been tested for browser cross-play.
- Exported 82 recorded user/visible assistant messages into `Cascadia-99-conversation.txt`. That file stops at the export request and is a historical snapshot, not a continuously updated transcript. It includes older paths/designs that were later superseded.
- Added this status document and `CHANGELOG.md` for ongoing handoff and history.

## Current architecture

| Area | Files | Implementation |
| --- | --- | --- |
| Authoritative simulation | `engine.mjs`, `bot.mjs`, `match-rules.mjs` | Matching, slab state, CPU decisions, mode/team/Pulse rules |
| Server | `server.mjs` | HTTP asset whitelist, same-origin WebSockets, in-memory rooms; 20Hz simulation / 10Hz state updates |
| Browser client | `index.html`, `app.mjs`, `style.css` | Lobby, gameplay, targeting, settings, controls, responsive site |
| Drawing and appearance | `visuals.mjs`, `palettes.js`, `theme.js` | Cached pixel surfaces, animation, live palette/light-dark preferences |
| Audio | `sound.mjs`, `music.mjs` | Gesture-unlocked Web Audio effects and adaptive track synthesis |
| Records | `records.mjs` | Browser-local personal records |
| Assets | `demo/`, `fonts/`, `logo.svg`, `favicon.svg` | Actual gameplay demo, reduced-motion still, local font/license, original branding |
| Checks | `test/`, `scripts/web-smoke.cjs`, `scripts/render-*.cjs` | Engine/protocol tests, real browser QA, demo/audio rendering |
| Deferred desktop | `desktop/`, `.github/workflows/desktop-build.yml` | Electron wrapper and manual packaging workflow |

## Verification and evidence

- Pre-Phase-1 full `npm test`: 49 passed, zero failed; Phase 1 now passes 63. Includes real WebSocket clients, mode/team behavior, CPU rooms, matching/slabs, Pulse, records, audio state, and deferred desktop module checks.
- Latest browser QA passed after the compact-card redesign: saved appearance/palette/track preferences, all five distinct canvas palettes, all four audible live-switched tracks, 98-CPU battle, VS/teams/Rush, mute, seven gameplay sizes from 1440×900 to 360×640, and desktop setup-card/demo fold checks including 1280×720.
- Pixel QA verifies exact Bayer densities, fully opaque hard tile palette colors, 25% board stipple, distinct grayscale glyphs, and reduced-motion still selection.
- All eight calm/danger audio renders passed audibility, no silent bars, and no clipping checks; observed peaks were below 0.09 normalized amplitude. This checks signals, not subjective musical quality.
- Demo render verified chain length 2, a slab break, and two converted rows. Screenshots, render frames, profiles, and WAV QA outputs are kept in ignored `.web-smoke/`.

## Known issues and unfinished work

- GitHub backup is configured. No public game deployment or domain has been configured.
- Rooms live only in memory. Restart/deployment loses rooms and active matches. Phase 1 adds transient connection recovery for 15 seconds; durable storage, reload/app-restart recovery, shared-room routing, and multiple server instances remain unimplemented.
- Local real-client tests and 98-CPU runs are not a 99-human Internet load test. Latency, throughput, network loss, cross-browser behavior, abuse resistance, and long-running matches need production-oriented validation.
- One earlier CPU integration test failed its initial-grid equality assertion while browser/offline audio QA ran concurrently: a CPU had already swapped by the sampled state. A later complete run after offline rendering finished passed all 49 tests. The timing-sensitive assertion remains worth hardening if it recurs.
- Appearance choices are browser-local, not shared room settings. The homepage GIF is prerecorded and does not recolor when the palette changes.
- Personal records are local and can be edited/reset by the browser user; no accounts, cloud records, leaderboard, or cross-device sync exist.
- Desktop packaging is deferred and legacy prototype binaries are stale/unsigned. No current native release or auto-updater exists. A first Godot client exists; offline simulation and exports remain unfinished.
- Cascadia 99 is a working name, not legally cleared branding. Repository license is `UNLICENSED`; the bundled font has its own SIL Open Font License.
- Product polish remains: human playtesting of the four-tile match frequency, chain/garbage/Pulse balance, CPU strength, track mix/volume, and small-screen readability. Tiny short windows necessarily have a small board.

## Recommended next steps

1. Playtest the current web build with humans in 2P, 4P, and teams; tune balance and music levels based on actual matches. Check target browsers and touch devices.
2. Continue committing and pushing completed updates to the active feature branch, keeping status/changelog current. Review feature work before merging to main.
3. Deploy a single-instance HTTPS/WebSocket trial using `HOSTING.md` and `render.yaml`, then test room sharing across real devices/networks.
4. Add a repeatable network/soak/load test before inviting large public lobbies. Harden timing-sensitive test synchronization if the CPU assertion recurs.
5. Extend transient recovery with durable room/session storage and operational observability before broader multiplayer launch; implement shared state/routing when scaling is needed.
6. Resolve branding/licensing before publication. Continue the now-authorized Godot port using the milestone plan below; legacy Electron packaging remains deferred.

## Godot milestone — first playable native client (2026-10-06)

- Created `godot/project.godot`, a main scene, native GDScript network/UI/board/audio scripts, and exported original pixel assets/data. Imported cleanly on installed Godot 4.7.2 Compatibility and opened the project in the editor. F5 runs it; the existing Node server must be running.
- Title menu emulates a video game: CPU Battle, Host Room, Join Room, Options, Help, Quit. Configuration uses separate panels rather than the website homepage form. Lobby, team selectors, match HUD/rivals/targeting, Pulse, result/rematch panels, and local preferences/records are implemented.
- Added keyboard, mouse board positioning/right-click swap, gamepad D-pad/left-stick movement, A/Cross swap/confirm, RB/R1 raise, X/Square Pulse, Start Options, B/Circle back. Explicit native UI bindings fix missing default confirm/back actions; any-device bindings and analog deadzones are configured. Synthetic menu/movement/swap checks passed; no claim of physical-controller validation.
- Native rendering includes all four glyphs/five palettes, stippled wells, cast-iron slab bands/core pulses, cursor, match brightness, and combo/chain/break/Pulse overlays. Viewport scaling keeps the board within the resized window.
- Ported original composition data to a native procedural PCM sequencer and effects, with four tracks, adaptive pressure, independent toggles, and preview. The native mix differs from the Web Audio implementation; generated PCM checks pass for all four tracks. Runtime audio cleanup was verified without leaked-instance warnings in the latest graphical QA.
- Real Godot protocol checks passed duels, quads, teams, and a 99-player CPU room, plus input/swap/target/boost/leave. A browser host and real Godot client joined and completed a shared duel. Native graphical QA passed synthetic controller menu/confirm/back/move/swap, palette/track options, and resize captures. The existing 49 JavaScript tests also passed.
- Commands: `npm run godot:editor`, `npm run godot`, `npm run godot:import`, `npm run godot:assets`, `npm run smoke:godot`, `npm run smoke:godot-ui`, `npm run smoke:godot-audio`. UI QA uses the running preview server and a display. Protocol QA starts a temporary server. Cache/build outputs are ignored.

### Godot work still pending

1. Test the user’s physical controller, stick repeat/deadzone feel, menu navigation, and platform-specific button mappings. Add remapping and controller-only text entry; name/code/address fields currently require a keyboard.
2. Port Board/CPU simulation to GDScript for offline self-contained play, with JavaScript parity fixtures for chain scoring, slab gravity/conversion, cancellation, top-out, and Pulse/team rules. The current native client still requires Node even for CPU battles.
3. Continue subjective animation/audio tuning, native incoming/team HUD details, lobby mode/rules editing, and gameplay polish. Native audio checks cover generated PCM, not the final mix; physical listening/playtesting is needed.
4. Exercise larger mixed browser/Godot games and graphical 99-player performance/soak tests. Only the mixed-client duel has been verified end-to-end so far.
5. Install matching export templates, add presets including JSON/non-resource data and font license, and validate Linux/native/browser exports. No Godot binary or web export was produced in this milestone. Existing Godot editor remains open; the QA run window closes after checks.
