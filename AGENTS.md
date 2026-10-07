# Cascadia 99 development

- Keep the local project and GitHub repository updated when completing authorized game changes. Commit tested work and push the active feature branch; avoid merging feature work into main without an explicit request.
- Keep web and Godot updates in parity: implement equivalent gameplay, visual, animation, audio, and settings changes in both clients before pushing. Document unavoidable platform differences and validate both builds; do not silently ship a Godot-only improvement.
- Inspect both clients before changing gameplay. Godot is a client of the existing Node server, including CPU matches; do not introduce a second authoritative rules engine.
- Flux balance values live in `flux-config.mjs`. Godot receives the same object in `hello.fluxConfig`; clients submit ability intents with unique request IDs, never resource balances.
- Preserve the current pixel tile/slab art, palettes, modes, team protection, CPU behavior, audio, and controls. Older designs in the conversation export are historical.
- Effects are presentation-only. Respect shake/flashing settings and reduced motion; never pause server simulation or Godot time scale for effects.
- Run `npm test` and relevant native/browser checks. `npm run smoke:phase1` seeds resources only in an isolated test server. See `PHASE1.md` for architecture, parity differences, rules, and verification commands.
- Describe 99-seat CPU/protocol checks accurately; do not infer human Internet scalability from them.

## Phase 1C pixel-art standards

- Cascadia 99 is an ambitious NES-inspired 8-bit puzzle game. “Neon Arcade” is a palette name, not permission to add glossy surfaces, bloom, blur, smooth gradients, translucent particle clouds, or modern shader effects.
- Preserve Skull, Cyber-Eye, Radiation, Twin Bolts, the four tile colors, Bayer shading, carbon/industrial slabs, and pixel branding. Do not recreate these assets unnecessarily.
- Draw each gameplay board on its 360×720 internal surface with nearest-neighbor scaling. Prefer integer display scaling when the layout permits; smaller responsive windows use fractional nearest scaling rather than cropping controls. Effect pixels and shake offsets use a 3px grid; existing artwork retains its 1px details.
- Use opaque rectangles, discrete 32ms effect frames, stepped movement, and the shared 5×7 bitmap alphabet/palette. `presentation-effects.mjs` exports `RETRO`; keep `godot/assets/retro-vfx.json` identical when changing it. Do not restore smooth camera wobble or canvas arcs for shockwaves.
- Draw shockwaves/sweeps behind active tiles. Mask foreground fragments against occupied cells, keep popups in free upper space, and restrict activation flashes to board edges. Bound effect lists and caches; release completed slab effects.
- Ordinary 3-matches do not shake. Combo/chain/garbage/ability impact intensity follows `impactProfile` and the matching native implementation. Shake is board-local by default and stops within 80–180ms. Hit-stop only skips local rendering; snapshots, input, ability timing, CPUs, and server simulation continue.
- Respect Off/Reduced/Normal/Maximum shake, Reduced/Full flashing, browser reduced motion, and native Less Motion. Reduced flashing suppresses palette flashes and high-charge palette cycling; reduced motion keeps static labels/borders while removing motion/hit-stop.
- Keep adaptive synthwave compositions and independent music/SFX preferences. Activation/chain feedback uses brief square/triangle/noise stingers; muted music must not silence enabled SFX.
- Run `npm test`, `npm run smoke:retro`, and relevant Phase 1, native audio/UI, and browser regression checks. Retro fixtures require a display and generate ignored screenshots. Report local render timings as local observations, never as proof of 99-player performance.
- Phase 1C is presentation only. Do not change Flux values, server authority, game rules, or add Phase 2 mechanics while polishing effects. See `RETRO-VFX.md` for implementation differences and verification.
