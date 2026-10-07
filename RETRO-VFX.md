# Phase 1C — 8-bit effects and game feel

Cascadia 99 uses NES-inspired pixel art. Neon Arcade names the existing cyan/magenta/yellow/green palette; it does not describe a glossy rendering style. Original Skull, Cyber-Eye, Radiation, Twin Bolts, pixel branding, Bayer surfaces, and dark industrial slabs remain intact.

## Rendering

Both clients use a 360×720 board with 60px cells. Godot now draws into a nearest-filtered SubViewport rather than stretching its individual drawing primitives with the layout. Web uses its existing internal canvas. Responsive layouts may scale fractionally with nearest filtering when an integer scale cannot fit; this intentionally permits uneven physical pixel widths instead of cropping gameplay. Tile art retains its fine 1px details, while effect fragments and shake use a 3px virtual grid.

`presentation-effects.mjs` and `godot/scripts/presentation_effects.gd` implement stepped pixel rings, downward sweeps, edge flashes, full-meter sparks, buff borders, directional impacts, and local presentation hit-stop. They share opaque effect palettes and a 5×7 alphabet through exported `RETRO` and `godot/assets/retro-vfx.json`; a regression test checks exact equality. To refresh that asset after intentional changes:

```sh
node --input-type=module -e 'import {RETRO} from "./presentation-effects.mjs"; import {writeFileSync} from "node:fs"; writeFileSync("godot/assets/retro-vfx.json", JSON.stringify(RETRO)+"\n")'
```

Animations use discrete frames, not smooth interpolation: 32ms flash/effect steps; 128ms swaps; 160ms falls/Shift; 96ms cursor movement; 240ms garbage drops. Match feedback has four flash/compression frames. Combo size increases the number of fragments, and chain level increases their speed and impact. Effects use solid rectangles; rings cache their stepped geometry. Effect arrays, particle lists (300), popups (6), and surface caches are bounded. Completed slab records are released. Miniature Godot boards refresh on snapshots rather than animating all rivals every display frame.

| Event | Shake in virtual pixels | Duration |
| --- | ---: | ---: |
| Basic 3-match | 0 | — |
| 4+ combo | 1 | 96ms |
| Chain ×2 / ×3 | 2 | 96ms |
| Chain ×4 | 3 | 160ms |
| Chain ×5+ | 4 | 160ms |
| Garbage landing | 3–5 by slab size | 160ms |
| Pulse | 2 | 96ms |
| Overdrive | 4 | 160ms |

A virtual effect pixel is three board pixels, so normal Overdrive displacement is 12 internal pixels on the 360px-wide board. Off/Reduced/Normal/Maximum multiply the strength by 0/.35/1/1.7 before snapping. Impacts affect the board; the reusable viewport-impact API remains available. Normal matches do not shake. Hit-stop skips at most 32ms locally (64ms for Overdrive); input/networking and authoritative time continue.

Shockwaves and sweeps draw behind tiles. Foreground debris checks its complete rectangle against occupied cells. Popups use free upper-board space and disappear when there is insufficient room. Edge flashes/borders retain active glyph visibility. Garbage drops land with vertical recoil/debris; breaking slabs have palette-stepped hazards, cyan seams, and fracture marks. Bottom-to-top conversion still comes from server snapshots/events, without a second conversion simulation.

Flux uses a segmented gauge, high/full palette cycles, a full-edge spark, and existing authoritative availability/hold/countdown controls. Pulse has a cyan ring/fracture burst; Shift shows the final authoritative board settling down one row; Surge and Overdrive have bitmap activation labels and stepped energy borders. Audio adds distinct square/triangle/noise stingers and chain escalation, retaining the original adaptive compositions and Overdrive music layer.

## Accessibility and implementation differences

Both clients retain four shake levels and Reduced/Full flashing. Reduced flashing removes edge/brightness flashes, high-charge/border palette cycling, and local hit-stop. Reduced motion removes shake, particles, moving rings/sweeps, tile movement, palette cycling, and hit-stop while keeping static labels/borders. Web follows `prefers-reduced-motion`; native exposes Less Motion because reliable system detection is unavailable in this client.

The renderers share rules and visual language rather than identical drawing code. Web retains its cached original tile geometry; Godot retains its imported tile textures. Small outline/gap differences remain, and popup placement depends on available space. Native PCM and Web Audio preserve the same compositions/stinger roles but are not sample-identical. Native music has its existing mix, and physical listening/playtesting is still needed. Godot still uses the Node server for CPU/multiplayer play; no offline engine or new export is included.

## Verification

- `npm test`: full regression suite, including bitmap/palette equality, pixel ring geometry, discrete timing, shake limits, occupied-cell fragment masking, bounded effects, distinct stingers, reduced effects/mute, and existing authoritative gameplay/network tests.
- `npm run smoke:retro`: graphical native/browser rendering of the same 18 fixtures: 3-match, 5/12 combos, chains ×2–×6, Pulse/Shift/Surge/Overdrive, full Flux, garbage drop/impact/fracture, reduced motion, and reduced flashing with shake Off. Checks native fixed grid/nearest filtering, movement/settling, settings, browser drawing budget, and responsive native resizing. Captures are ignored `.web-smoke/retro-{godot,web}-*.png`.
- `npm run smoke:phase1`: actual keyboard/native ability controls, authoritative costs/hold/timers, preferences, reduced motion, and connection recovery on a temporary seeded server.
- `npm run smoke:godot`: actual native protocol clients across modes plus web/native cross-play; `npm run smoke:godot-ui`: native controller/menu/resize checks against the running server.
- `npm run smoke:web`: existing palette, audio, 98-CPU room, all-mode and seven-size browser checks. `PANEL99_WEB_URL` selects the server address.
- `npm run smoke:godot-audio`: four soundtrack PCM checks plus six retro stingers, music-off/SFX-on behavior, mute, non-silent samples, and no PCM clipping.

Observed local fixture run: browser single-board drawing p95 ~0.3ms over 540 samples; native display-frame wall p95 ~16.8ms over 120 frames on Intel Iris Xe/Godot Compatibility. Native wall time includes display pacing, while browser timing measures drawing commands; these values are not directly comparable. Neither establishes full-game 60 FPS on every device or 99-player scalability. Screenshots and synthesized PCM do not replace subjective human review.

Phase 1C changes no authoritative gameplay/balance rules. Its How to Play follow-up adds only explicit HTTP asset routes to `server.mjs`. Flux, abilities, modes, CPUs, reconnection, and team behavior retain Phase 1 rules. Phase 2 is not implemented.

## How to Play recordings

Both Help screens now offer ten recorded demonstrations: all four modes, swaps/chains, garbage, and the four Flux abilities. `tutorials.mjs` provides shared copy; `npm run tutorials:render` records four live local CPU rooms and deterministic engine examples, then produces 384×216, 80-frame, 10 FPS GIFs under `demo/tutorials/` and matching native atlases/catalog under `godot/assets/tutorials/`. Ability examples explicitly begin with full Flux; Overdrive shows the required hold. Battle Royale footage uses 98 CPUs and displays ten boards from the 99-seat room.

Web selects one GIF at a time. Godot plays the same frames using a nearest-filtered AtlasTexture rather than relying on unsupported GIF playback. Both have pause and matching still frames; reduced motion or reduced flashing forces stills because flashes are baked into GIF footage. No tutorial audio plays. Native Help scrolls within the existing menu and retains keyboard/controller navigation. Prerecorded clips retain their Neon Arcade palette rather than recoloring with live settings.

Run `npm run smoke:tutorials` for actual Help/playback/accessibility/layout and exact still-pixel parity checks. `npm test` also checks shared metadata, all assets, authoritative mechanic footage, and static asset routing. Regenerate recordings/metadata when their visuals, rule explanations, costs, or durations change. Raw recordings are local ignored artifacts, not a production replay system.

The homepage now curates those six mechanics into a 33-second, 25 FPS showcase with live Flux/cost/hold/buff/pending counters and pause/reduced-effects stills. `npm run demo:render` reproduces it; `demo/showcase.json` records its timeline. The 50Hz engine source is identical to native tutorials at shared capture timestamps. Godot has no website homepage; the equivalent six demonstrations remain available in native How to Play.
