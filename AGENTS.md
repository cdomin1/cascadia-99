# Cascadia 99 development

- Keep the local project and GitHub repository updated when completing authorized game changes. Commit tested work and push the active feature branch; avoid merging feature work into main without an explicit request.
- Inspect both clients before changing gameplay. Godot is a client of the existing Node server, including CPU matches; do not introduce a second authoritative rules engine.
- Flux balance values live in `flux-config.mjs`. Godot receives the same object in `hello.fluxConfig`; clients submit ability intents with unique request IDs, never resource balances.
- Preserve the current pixel tile/slab art, palettes, modes, team protection, CPU behavior, audio, and controls. Older designs in the conversation export are historical.
- Effects are presentation-only. Respect shake/flashing settings and reduced motion; never pause server simulation or Godot time scale for effects.
- Run `npm test` and relevant native/browser checks. `npm run smoke:phase1` seeds resources only in an isolated test server. See `PHASE1.md` for architecture, parity differences, rules, and verification commands.
- Describe 99-seat CPU/protocol checks accurately; do not infer human Internet scalability from them.
