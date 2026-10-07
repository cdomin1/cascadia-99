# Phase 1 — Flux

## Gameplay authority and balance

`flux-config.mjs` is the single balancing source. `engine.mjs` earns Flux once when a clear resolves; combo and chain bonuses add together. Generation bonuses retain fractional Flux internally, clamped to 100; clients display the integer portion. Attacks are rounded to whole garbage cells after amplification, before incoming cancellation. The existing attack ceiling and KO bonus scale with the active attack multiplier.

| Clear | Flux | Chain bonus | Flux |
| --- | ---: | --- | ---: |
| 3 tiles | 2 | ×2 | 8 |
| 4 tiles | 4 | ×3 | 14 |
| 5 tiles | 7 | ×4 | 22 |
| 6+ tiles | 10 | ×5+ | 30 |

| Ability | Cost | Rules |
| --- | ---: | --- |
| Pulse | 35 | Cancel up to six queued cells, defending self first, otherwise a living teammate in 2v2. Empty queues do not spend Flux. |
| Shift | 60 | Remove the bottom row and translate everything down one row. Slabs intersecting the removed row lose that row; zero-height slabs disappear. No score, Flux, attack, or chain event. |
| Surge | 75 | Eight seconds, ×1.35 attacks, ×1.20 Flux generation. |
| Overdrive | 100 | Hold full Flux continuously for three simulation seconds. Consume all Flux; ten seconds of ×1.50 attacks, ×1.25 Flux generation, ×1.15 natural rise, +0.12s chain grace. |

Shift requires the idle phase and no actively breaking slabs. This prevents changing the coordinates of an in-progress clear, fall, chain grace, or slab-conversion event. The HUD disables Shift until that safe point. The chain grace baseline is 0.12s; Overdrive extends it to 0.24s. Manual raising is unchanged. Surge and Overdrive exclude one another; Pulse and Shift can be used during either buff when otherwise eligible. All successful abilities share a configurable 0.3s activation cooldown.

CPU defense and offense use `abilityStatus` and `useAbility`, the same transactions as human input. CPUs prioritize urgent Pulse defense, then Shift near the ceiling, mature Overdrive, or Surge while under pressure/chaining. They receive no free Flux.

## Protocol and recovery

The server sends the balancing object in `hello.fluxConfig`. Web uses the same module for labels; Godot reads the server object. Neither client calculates balance changes or accepts client-authored ability durations, costs, balances, or target choices. Snapshots carry `flux`, `maxFluxHeld`, `activeAbility`, `abilityRemaining`, and the four server-computed eligibility flags. The legacy `charge` field mirrors Flux during the transition; there is only one resource balance.

Ability requests are `{type:"ability", ability:"pulse"|"shift"|"surge"|"overdrive", requestId:"unique-id"}`. Repeated IDs do nothing, including after recovery. Rejected IDs cannot be retried later to create a delayed activation. The server retains at most 4,096 IDs per player per match, and new matches reset them. An unknown ability or invalid request never spends Flux. Legacy `type:"pulse"` also requires a request ID.

Clients opt into transient session recovery. The server supplies a random bearer token, retains disconnected players for 15 seconds, disables their raising input, and continues simulation. Rejoining restores the existing board, Flux, timers, targeting, and deduplication history. Recovery immediately sends a fresh full snapshot, including finished/eliminated state. Explicit Leave still forfeits immediately. Tokens remain in client memory, so reloading or closing the app does not recover a session. Server restarts still lose all rooms. Recovery is not durable storage.

## Presentation and controls

| Control | Web / native keyboard | Native gamepad |
| --- | --- | --- |
| Pulse | X | X / Square |
| Shift | C | Y / Triangle |
| Surge | V | LB / L1 |
| Overdrive | B | Left trigger |

Both clients also offer four buttons, a cyan Flux meter, full-meter hold indicator, and buff countdown. Existing movement, swaps, raising, targeting, teams, modes, records, four soundtracks, and tile assets remain.

`presentation-effects.mjs` and `godot/scripts/presentation_effects.gd` provide local board/viewport shake, directional impacts, short presentation-only hit-stop, radial waves, energy sweeps, perimeter flashes, and buff borders. Existing web tile particles remain in `BoardAnimations`; native particles use the new effects object. Pulse includes an upper-board fracture burst; Shift sweeps downward; Surge has a moving cyan perimeter; Overdrive uses a stronger magenta burst/border and an additional synth arpeggio. Effects stay around the edges and do not obscure glyphs. No effect alters the server clock, client input delivery, Godot time scale, or multiplayer simulation.

Web FX opens the effects dialog. Native Options contains Screen Shake (Off / Reduced / Normal / Maximum), Flashing Effects (Reduced / Full), and Less Motion. Preferences persist locally. Web follows changes to `prefers-reduced-motion`; native exposes Less Motion because this client does not have a reliable platform-wide reduced-motion signal. Reduced motion removes shake, particles, sweeps, waves, moving borders, and hit-stop; borders and labels remain static. Reduced flashing removes brightness flashes and presentation hit-stop.

## Existing implementation differences

| Area | Browser | Godot |
| --- | --- | --- |
| Simulation | Node server, 20Hz | Same Node server, including CPU play; no offline GDScript simulation |
| Rendering | Canvas, cached pixel surfaces, stepped swaps/falls, homepage GIF | 360×720 SubViewport, imported tile textures, stepped swaps/falls/cursor/drops (Phase 1C) |
| Audio | Web Audio synth, echo, stereo panning | Procedural PCM sequencer; original compositions retained but mix differs |
| UI | Responsive website, touch controls, room settings | Native menus, controller support, Options; lobby mode/rules editing remains incomplete |
| Motion preference | Browser system preference plus effect settings | Native Less Motion setting plus effect settings |
| Persistence | Browser localStorage | Native ConfigFile |
| Delivery | Existing browser app | Existing Godot project; no new export templates/binaries |

The checked-in visual identity already uses pixel Skull/Cyber-Eye/Radiation/Twin Bolts and stippled hardware surfaces, superseding older flat and smooth Neon Core drafts. Phase 1 preserves these current assets and palettes and adds cyan/magenta energy effects around them. The prerecorded homepage GIF remains a demonstration of the existing tile/chain/slab gameplay.

## Verification

- `npm test`: rules, engine, CPU, four mode capacities/teams, real WebSocket synchronization, forged balances, duplicate ability requests, session recovery/expiry, and existing regression tests.
- `npm run smoke:phase1`: seeded test-only server, actual native UI buttons and web keyboard input for all four abilities, meter/cost/countdown parity, recovery without timer reset, effects preferences, and screenshots. There is no public debug or resource-grant endpoint.
- `npm run smoke:godot`: real Godot protocol clients in 2P, 4P, teams, and a 99-seat CPU room, plus browser/Godot cross-play.
- `npm run smoke:web`: original browser/audio/palette/viewport regression checks against a running server. Set `PANEL99_WEB_URL` to choose a port.
- `godot --path godot -- --smoke-ui --server http://127.0.0.1:3000`: native graphical/controller/resize checks.
- `npm run smoke:godot-audio`: native generated audio checks.

99-seat rule and CPU-room checks are not evidence of 99-human Internet scalability. Human load, packet-loss/latency, long-session soak, physical-controller testing, and listening/playtesting of the Overdrive mix remain follow-up work.

Phase 1C supersedes the original smooth presentation effects with the 8-bit standards documented in `RETRO-VFX.md`; all authoritative Phase 1 rules and numerical values above are unchanged.
