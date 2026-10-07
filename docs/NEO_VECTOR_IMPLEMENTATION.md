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

## Checkpoint plan/status

A Foundation: shared tokens, canonical style guide and guidance committed as `9eb36bc`. Geometric display typography remains part of the presentation rollout.

B Core board: implemented procedural tiles, stable semantic palette, two-cell vector selector and intensity/compression clear feedback on both clients. Native import/launch and web board captures passed; 36 selector fixtures agree within one channel of color quantization. Advanced clear effects remain Checkpoint D.

C Glitch: both slab renderers now use contiguous crimson wireframes, cyan malformed seams and fracture geometry. HUD/help/tutorial captions use Glitch terminology; pending warnings update from current authoritative snapshots. Native launch and real slab-rule tests passed. Recorded footage is historical pending regeneration, and the final documentation terminology audit remains open.

D Game feel: bounded vector fragments/rings/persistence/instability, board-local impacts.

E Flux: capacitor and all four coherent ability presentations; balance unchanged.

F HUD/input: readable hierarchy, controller actions/navigation/repeat/arbitration/prompts.

G Intro: vector initialization in both clients, preserve authoritative shared deadlines.

H Battle Royale: LOD and vector trajectories, verify 99-seat CPU checks.

I Tutorial: seven deterministic real-engine lessons, retry/navigation, first-launch choice, offline and native controller.

J Practice: real-engine sandbox, practice-only configuration/recovery, no records, offline/controller.

K Audio: preserve/fix playback, adaptive architecture, motif/prototype status and music-flow documentation.

L Accessibility/performance: quality tiers, bounded rendering and settings verification.

M Parity: full test suite, paired launch/render/input checks, manual matrix with honest unsupported hardware/listening/load limitations.

Each checkpoint receives relevant tests and a stable commit. No automatic merge or Phase 2 development.

## Legacy asset decisions

Adapt board renderer, effects, Flux, intro and targeting. Replace playable raster glyphs with original procedural geometry. Retain old textures/atlases/bitmap alphabet as historical assets until confirmed unused; regenerate demonstration footage after the renderer settles. Preserve storage/protocol/application compatibility identifiers. Do not present old recorded footage as new vector gameplay.
