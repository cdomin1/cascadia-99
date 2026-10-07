# Neo-Vector + Phase 1E implementation audit

Branch: `feature/neo-vector-phase-1e`, based on saved combined `37da329`.

## Inspected baseline

- Node `server.mjs` owns rooms, CPUs, matching/attacks and abilities through `engine.mjs`, `abilities.mjs`, `flux-config.mjs`, `match-rules.mjs`. Native Godot is a WebSocket client, not an independent rules engine.
- Web uses Canvas 2D (`visuals.mjs`, `presentation-effects.mjs`), DOM HUD and localStorage. Native builds its Control UI in `main.gd`, renders board through a 360×720 SubViewport, stores ConfigFile preferences and receives balance from the server.
- Flux matches brief values, including separately added combo/chain bonuses. No configured +8 counter reward exists; preserve current behavior rather than rebalance.
- Readiness barrier, exact server deadline, input/CPU lock and active reconnect handling already exist. Godot has cinematic pixel intro; web has numeric countdown. Adapt presentation; retain timing.
- Both clients have bounded authoritative-ID attack trajectories and target borders. Automatic target highlight identifies last confirmed recipient, because existing rules select on attack.
- Help provides ten recorded demonstration clips, not interactive lessons. No offline interactive tutorial, first-launch prompt or practice sandbox exists.
- Native supports D-pad/analog, face/shoulder/trigger abilities and basic menus. Repeat currently uses one .12s timer; analog arbitration, input-noise filtering, dynamic prompts, controller targeting and disconnect handling need work. Physical-controller compatibility has not been verified.
- Godot MusicManager already persists, buffers synthesized audio on a worker/sample clock, separates buses and preserves phase. Web WebAudio scheduler restarts on scene/track/mute changes. Four original synthesized arrangements exist, not a completed 12–18 cue album; no source soundtrack files exist to trim.
- Existing reduced motion/flashing and four shake settings exist. Effect-quality settings do not.
- Historical guides and README contain stale art/architecture statements. Retain history, clearly supersede canonical instructions and refresh current guides.

## Baseline verification

2026-10-06: **82/82 JavaScript tests passed**, zero skipped, 22.0 seconds (`/tmp/neo-vector-baseline-verified.log`). Sandbox-only attempt stalled before network tests; verified run used local socket access. New milestone claims require fresh checks.

## Checkpoint implementation status

A–E: shared tokens/style guide, semantic board/selector, Glitch presentation, bounded vector effects and Flux presentation implemented and committed in logical checkpoints. Existing Flux balance is unchanged.

F: native input arbitration/repeat, generic dynamic prompts, controller targeting, join-code navigation and contained modal focus implemented. Standard browser Gamepad API navigation/gameplay implemented. Synthetic tests pass; physical controllers remain unverified.

G: vector initialization in both clients uses the existing shared server deadline. Repeated native starts, exact countdown/input gate, scene reload and music continuity checks pass. Active reconnect retains existing no-replay behavior.

H: relevant-board hierarchy/LOD and confirmed-ID vector trajectories implemented. Paired live targeting and native 99-seat CPU protocol checks pass. No 99-human Internet scalability claim.

I/J: seven deterministic real-engine lessons, persisted optional first-launch choice and configurable offline Practice implemented in both clients. Native uses a loopback Node helper; browser uses local engine plus cached offline shell. No competitive assistance or record pollution. Full real-engine lesson progression and native/browser offline checks pass; exhaustive physical-controller lesson traversal is unverified.

K: persistent native synthesis preserved; browser bar-aligned track queue, phase-preserving mute/context changes and separate persisted music/SFX volume implemented. Countdown motif is a prototype. Four original arrangements remain prototypes, not a finished album. Native PCM and repeated scene-transition checks pass; fresh long human listening is pending.

L: quality tiers and manual reduced motion added alongside existing shake/flash controls; decoration capped and reduced. Paired effects/settings fixtures pass. No vibration implementation or universal performance certification.

M: integrated regression, paired viewer/render/targeting, protocol/crossplay and offline checks performed. See `NEO_VECTOR_DELIVERY.md` for the full parity matrix and remaining validation limitations. This is not an assertion that every final artistic/hardware quality criterion has been certified.

Checkpoint history: `git log --oneline 37da329..HEAD`. No automatic merge or Phase 2 development.

## Legacy asset decisions

Adapt board renderer, effects, Flux, intro and targeting. Replace playable raster glyphs with original procedural geometry. Retain old textures/atlases/bitmap alphabet as historical assets until confirmed unused; demonstration footage regenerated using the vector renderer. Preserve storage/protocol/application compatibility identifiers. Do not present old recorded footage as new vector gameplay.
