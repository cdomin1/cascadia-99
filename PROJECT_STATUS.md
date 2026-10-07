# Cascadia 99 — Project Status

Updated 2026-10-06. This document records the current implementation and work completed during the development conversation. The working browser game remains available, and development has now started on a native Godot 4 client. Package version is 0.3.0; it is a development snapshot, not a published release.

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
- Regenerated the homepage gameplay demo from the actual engine/renderer: 400 frames, 50 FPS, eight seconds, 256-color palette without extra encoding dithering. It demonstrates a chain and slab conversion. A matching still serves reduced-motion users. Only one logo appears on the homepage.
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
