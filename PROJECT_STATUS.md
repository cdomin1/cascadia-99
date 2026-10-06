# Cascadia 99 — Project Status

Updated 2026-10-06. This document records the current implementation and work completed during the development conversation. The browser game is the active deliverable. Package version is 0.3.0; it is a development snapshot, not a published release.

## Location and running the project

- Current project directory: `/home/thinkypad/Projects/panel-99`. The complete folder was moved from `/home/thinkypad/Work/panel-99` and 8,816 files were verified after relocation.
- Local browser preview: `http://localhost:3000`. The Node server was restarted from the new directory and is running as of this handoff. A process may stop when its terminal/session closes; run `npm start` to start it again.
- Requires Node.js 22 or newer. The web server has no runtime dependencies. Electron and electron-builder are development dependencies for browser QA and deferred desktop packaging; use `npm ci` to install them.
- Commands: `npm start`, `npm test`, `npm run smoke:web`. Browser QA needs the preview server running and a working graphical Electron environment.
- No Git repository existed in this project directory before the latest request. A local repository has been initialized on `main` for the initial snapshot of the completed work. No remote is configured and nothing has been pushed or deployed.

## Accomplished in this session

### Gameplay and multiplayer

- Implemented a rising-panel matching engine on a 6×12 board: horizontal/vertical matches, swaps, gravity, chains, combo attacks, incoming attack cancellation, accelerating rise, and elimination after two seconds at the ceiling.
- Implemented real room-code multiplayer over a dependency-free Node HTTP/WebSocket server. Six-character codes, host settings/start permissions, live lobby/state updates, manual rival targeting, targeting strategies, rematches, disconnect forfeits, host transfer, and abandoned-room cleanup work.
- Added CPU opponents using legal cursor moves and swaps, with Easy/Normal/Hard difficulty and mixed human/CPU rooms up to 99 total competitors.
- Added 2P Duel, 4P free-for-all, and 2v2 teams on separate devices. Small modes enforce exact seat counts. Team attacks exclude allies; team assignment and host-controlled swaps work. An eliminated teammate shares the surviving team's win.
- Added Classic and Rush rules; Rush raises the stack 60% faster. Added charged Pulse defense: X or the button cancels up to six incoming cells, protecting a living teammate when the player's own queue is empty.
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
- Added `GODOT.md` with migration guidance. No Godot implementation exists; it would be a separate port, potentially reusing the current room/server protocol.
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

- Latest full `npm test`: 49 passed, zero failed. Includes real WebSocket clients, mode/team behavior, CPU rooms, matching/slabs, Pulse, records, audio state, and deferred desktop module checks.
- Latest browser QA passed after the compact-card redesign: saved appearance/palette/track preferences, all five distinct canvas palettes, all four audible live-switched tracks, 98-CPU battle, VS/teams/Rush, mute, seven gameplay sizes from 1440×900 to 360×640, and desktop setup-card/demo fold checks including 1280×720.
- Pixel QA verifies exact Bayer densities, fully opaque hard tile palette colors, 25% board stipple, distinct grayscale glyphs, and reduced-motion still selection.
- All eight calm/danger audio renders passed audibility, no silent bars, and no clipping checks; observed peaks were below 0.09 normalized amplitude. This checks signals, not subjective musical quality.
- Demo render verified chain length 2, a slab break, and two converted rows. Screenshots, render frames, profiles, and WAV QA outputs are kept in ignored `.web-smoke/`.

## Known issues and unfinished work

- No public deployment, remote Git backup, or domain has been configured. Local Git is a snapshot, not an off-machine backup.
- Rooms live only in memory. Restart/deployment loses rooms and active matches. Reconnection/session recovery, durable storage, shared-room routing, and multiple server instances are not implemented.
- Local real-client tests and 98-CPU runs are not a 99-human Internet load test. Latency, throughput, network loss, cross-browser behavior, abuse resistance, and long-running matches need production-oriented validation.
- One earlier CPU integration test failed its initial-grid equality assertion while browser/offline audio QA ran concurrently: a CPU had already swapped by the sampled state. A later complete run after offline rendering finished passed all 49 tests. The timing-sensitive assertion remains worth hardening if it recurs.
- Appearance choices are browser-local, not shared room settings. The homepage GIF is prerecorded and does not recolor when the palette changes.
- Personal records are local and can be edited/reset by the browser user; no accounts, cloud records, leaderboard, or cross-device sync exist.
- Desktop packaging is deferred and legacy prototype binaries are stale/unsigned. No current native release or auto-updater exists. No Godot port exists.
- Cascadia 99 is a working name, not legally cleared branding. Repository license is `UNLICENSED`; the bundled font has its own SIL Open Font License.
- Product polish remains: human playtesting of the four-tile match frequency, chain/garbage/Pulse balance, CPU strength, track mix/volume, and small-screen readability. Tiny short windows necessarily have a small board.

## Recommended next steps

1. Playtest the current web build with humans in 2P, 4P, and teams; tune balance and music levels based on actual matches. Check target browsers and touch devices.
2. Configure a private Git remote and push this baseline when requested. Keep status/changelog updated alongside future changes.
3. Deploy a single-instance HTTPS/WebSocket trial using `HOSTING.md` and `render.yaml`, then test room sharing across real devices/networks.
4. Add a repeatable network/soak/load test before inviting large public lobbies. Harden timing-sensitive test synchronization if the CPU assertion recurs.
5. Prioritize reconnect/room recovery and operational observability before broader multiplayer launch; implement shared state/routing only when scaling is needed.
6. Resolve branding/licensing before publication. Return to Linux/native packaging or a Godot port only after the user resumes that scope.
