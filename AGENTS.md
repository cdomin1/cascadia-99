# VEXELON 99 development

- Keep the local project and GitHub repository updated when completing authorized game changes. Commit tested work and push the active feature branch; avoid merging feature work into main without an explicit request.
- Keep web and Godot updates in parity: implement equivalent gameplay, visual, animation, audio, and settings changes in both clients before pushing. Document unavoidable platform differences and validate both builds; do not silently ship a Godot-only improvement.
- Inspect both clients before changing gameplay. Godot is a client of the existing Node server, including CPU matches; do not introduce a second authoritative rules engine.
- Flux balance values live in `flux-config.mjs`. Godot receives the same object in `hello.fluxConfig`; clients submit ability intents with unique request IDs, never resource balances.
- Preserve the current pixel tile/slab art, palettes, modes, team protection, CPU behavior, audio, and controls. Older designs in the conversation export are historical.
- Effects are presentation-only. Respect shake/flashing settings and reduced motion; never pause server simulation or Godot time scale for effects.
- Run `npm test` and relevant native/browser checks. `npm run smoke:phase1` seeds resources only in an isolated test server. See `PHASE1.md` for architecture, parity differences, rules, and verification commands.
- Describe 99-seat CPU/protocol checks accurately; do not infer human Internet scalability from them.

## Phase 1C pixel-art standards

- VEXELON 99 is an ambitious NES-inspired 8-bit puzzle game. “Neon Arcade” is a palette name, not permission to add glossy surfaces, bloom, blur, smooth gradients, translucent particle clouds, or modern shader effects.
- Preserve Skull, Cyber-Eye, Radiation, Twin Bolts, the four tile colors, Bayer shading, carbon/industrial slabs, and pixel branding. Do not recreate these assets unnecessarily.
- Draw each gameplay board on its 360×720 internal surface with nearest-neighbor scaling. Prefer integer display scaling when the layout permits; smaller responsive windows use fractional nearest scaling rather than cropping controls. Effect pixels and shake offsets use a 3px grid; existing artwork retains its 1px details.
- Use opaque rectangles, discrete 32ms effect frames, stepped movement, and the shared 5×7 bitmap alphabet/palette. `presentation-effects.mjs` exports `RETRO`; keep `godot/assets/retro-vfx.json` identical when changing it. Do not restore smooth camera wobble or canvas arcs for shockwaves.
- Draw shockwaves/sweeps behind active tiles. Mask foreground fragments against occupied cells, keep popups in free upper space, and restrict activation flashes to board edges. Bound effect lists and caches; release completed slab effects.
- Ordinary 3-matches do not shake. Combo/chain/garbage/ability impact intensity follows `impactProfile` and the matching native implementation. Shake is board-local by default and stops within 80–180ms. Hit-stop only skips local rendering; snapshots, input, ability timing, CPUs, and server simulation continue.
- Respect Off/Reduced/Normal/Maximum shake, Reduced/Full flashing, browser reduced motion, and native Less Motion. Reduced flashing suppresses palette flashes and high-charge palette cycling; reduced motion keeps static labels/borders while removing motion/hit-stop.
- Keep adaptive synthwave compositions and independent music/SFX preferences. Activation/chain feedback uses brief square/triangle/noise stingers; muted music must not silence enabled SFX.
- Run `npm test`, `npm run smoke:retro`, and relevant Phase 1, native audio/UI, and browser regression checks. Retro fixtures require a display and generate ignored screenshots. Report local render timings as local observations, never as proof of 99-player performance.
- Phase 1C is presentation only. Do not change Flux values, server authority, game rules, or add Phase 2 mechanics while polishing effects. See `RETRO-VFX.md` for implementation differences and verification.

## Animated How to Play tutorials

- Keep the ten web GIFs and native frame-atlas tutorials in parity. `tutorials.mjs` is the shared topic/copy source; `npm run tutorials:render` records four real server modes and six deterministic engine/ability examples, generates web GIFs/stills and matching Godot atlases/catalog. Requires Electron, ffmpeg, and a display.
- Changes to rules, costs, durations, controls, or relevant visuals must also update How to Play text and re-render affected tutorial footage/metadata. Do not let historical Pulse “100%” instructions return; Phase 1 Pulse costs 35 Flux.
- Load/play one selected clip at a time, stop animation when Help closes, provide pause, and use static frames for reduced motion OR reduced flashing (GIF flashes are baked into the recording). Keep pixel filtering and readable captions. Modes with 99 seats are recorded with CPUs and must be labelled accurately.
- `npm run smoke:tutorials` checks both real help viewers, topic switching, pause, reduced effects, mobile layout, and exact native/web still pixels. `npm test` validates metadata, assets, real mechanic events/costs, and explicit asset routes. Raw recordings/frame captures remain ignored in `.web-smoke/`.

- The homepage showcase uses `scripts/homepage-showcase.mjs` and the same engine recording source at 25 FPS. Keep its Flux/cost/hold/buff counters and chapter explanations current; regenerate with `npm run demo:render`. Preserve pause/play and static reduced-motion/flashing fallbacks. Its web-only placement corresponds to the same six mechanics already present in native How to Play.

## Current game name

The public game name is **VEXELON 99** on web, Godot, and desktop. Keep pixel wordmarks synchronized with `node scripts/render-branding.mjs`, and regenerate the homepage GIF after branding changes. Preserve legacy storage keys, the desktop application ID/profile directory, and the Godot settings migration so existing preferences and records survive. The repository URL and historical conversation export retain their original names.

## Native start and music lifecycle

Keep the server readiness barrier/deadlines authoritative; battle_intro.gd is presentation only. Preserve the MusicManager autoload, sample-clock worker and one primary player. Scene/reconnect/mute changes must preserve phase; music cannot change countdown timing. Keep independent Music/SFX buses/volume and original compositions. See BATTLE-INTRO-AUDIO.md and the intro/audio smoke scripts.

## Selector

Keep the two-cell selector instant and grid-snapped, drawn after board effects. Use filled pixel strips: 7px dark outer border, 3px bright inner border inset 2px on the 360×720 board. Cycle white/pale cyan every 500ms only with full effects; reduced motion/flashing stays white. Preserve transparent interiors and visible edges. `npm run smoke:selector` checks exact native/web pixels.

## Battle Royale trajectories

Use confirmed sourceId/targetId, matchId and monotonic attackSequence; snapshots do not create effects. Preserve eight-effect cap, pixel geometry, reduced effects and reserved cyan presentation channel. Automatic highlight is the last confirmed recipient; do not change targeting rules to drive animation. Keep native/web configuration and geometry tests in parity. See TARGETING-VFX.md.
