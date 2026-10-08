# VEXELON 99

**Neo-Vector Arcade — “1982, BUT IMPOSSIBLE.”** A rising-panel puzzle battle game for web and native Godot. Both clients use the same authoritative Node engine for competitive matches. No Phase 2 mechanics are included.

## Run

Requires Node.js 22+. From the project folder:

```sh
npm ci
npm start
```

Open http://localhost:3000. For Godot, open `godot/project.godot` in Godot 4 or run `npm run godot`. The native client defaults to the local server; change its address in Settings for a hosted room. See [HOSTING.md](HOSTING.md) for one-server hosting and in-memory room limitations.

## Interface

Direct homepage match setup → Play CPUs or Create Room / Join. Player name, CPU settings and online room creation/joining are immediately accessible. Kode Mono is bundled locally for both web and Godot. Tutorial reveals one system at a time; Free Practice keeps training utilities in Pause → Practice Tools. Press Escape / Start for Pause; online simulation continues.

VEXELON has one canonical palette. Themes/light mode are removed; saved legacy theme preferences are ignored/migrated. Audio/music selection, volume and accessibility remain in Settings.

## Play

Move the two-cell selector. Swap. Match three identical shapes. Keep the stack below the top. Bigger clears and falling chains send **Glitch Attacks**; matching beside **Glitch Blocks** breaks them into tiles. Attacks first cancel incoming blocks under the existing Phase 1 rules.

Modes: 2P Duel, 4P free-for-all, 2v2 Teams, and 2–99-seat Battle Royale. Fill seats with CPUs or share a six-character room code with friends. Classic/Rush and Easy/Normal/Hard CPUs remain available. 99 CPU seats are not proof of 99-human Internet scalability.

Flux stays at 0–100. Pulse costs 35 and blocks one incoming row-equivalent or rescues a teammate; Shift costs 60 and lowers a stable stack; Surge costs 75 for eight seconds; Overdrive consumes 100 after a three-second full-charge hold, lasting ten seconds. Current balancing is unchanged in `flux-config.mjs`.

## Learn and practice

First launch offers an optional Tutorial. Seven replayable interactive lessons teach movement/swaps, matches, rising, combos/chains, Glitch Blocks, Flux and battle basics. Back, restart and skip/exit remain available; Next appears after success.

Free Practice defaults to relaxed play: rising off, normal Flux, Glitch Blocks off and game over off. Configure rise speed, training blocks, unlimited Flux and game over; pause, restart, seed combos/chains and simulate incoming attacks. Practice has no competitive records.

Web Tutorial/Practice uses the real engine locally; after a successful initial load and service-worker installation, the cached shell can reload offline on supported secure origins (HTTPS or localhost). Native source builds launch an isolated loopback Node bridge automatically; **Node.js 22+ must be installed**. A standalone exported native offline engine bundle is not supplied by this milestone.

## Controls

Keyboard: arrows move, Space swaps, Shift raises, X/C/V/B activate Pulse/Shift/Surge/Overdrive. Native Q/E or right stick cycles targets. Mouse/touch and existing targeting controls remain.

Standard controller positions: D-pad/left stick move; south face swaps; west face Pulse; north face Shift; left shoulder Surge; left trigger Overdrive; right shoulder raises; right stick targets; Start opens settings/training pause. Prompts use generic positions rather than brand-specific button letters. Native room joining includes controller-selectable code digits. Browser standard Gamepad API controls are available where supported.

Controller verification uses synthetic input on Linux. Physical Xbox/PlayStation/Nintendo/generic compatibility and haptics have not been verified; rumble is not implemented.

## Presentation and audio

Original geometric tiles: crimson Target Ring, cobalt Prism, lime Heavy Hexagon and amber Dual Chevron. A bright two-cell selector renders above effects. Corrupted contiguous wireframes distinguish Glitch Blocks. Flux, vector bursts, short attack trails and bounded Vector Instability remain presentation-only.

Settings include four shake strengths, reduced/full flashing, reduced motion, three effect quality tiers and Master/Music/SFX volumes. System reduced-motion preferences also apply in web. Help recordings use real engine examples. The former homepage showcase is retired in favor of Tutorial and Free Practice.

The game currently runs with **SFX only**. All generated music is retired; the final soundtrack will use developer-supplied licensed recordings. Both clients support an empty shared file registry, independent mute/volume and fades. See [music imports](docs/MUSIC_IMPORTS.md), [soundtrack status](docs/OST_STATUS.md) and [audio engineering](docs/AUDIO_OVERHAUL.md). No replacement music or procedural fallback is generated.

## Verify and design

```sh
npm test
npm run godot:import
npm run smoke:phase1
npm run smoke:selector
npm run smoke:targeting
npm run smoke:retro
npm run smoke:tutorials
```

GUI checks require a working display. `smoke:retro` retains its historical command name but checks the current vector effects. Source fixtures and captures are under ignored `.web-smoke/`.

Canonical guidance: [Neo-Vector style guide](docs/NEO_VECTOR_STYLE_GUIDE.md). Checkpoint status and limitations: [implementation audit](docs/NEO_VECTOR_IMPLEMENTATION.md). Current delivery evidence: [PROJECT_STATUS.md](PROJECT_STATUS.md).
