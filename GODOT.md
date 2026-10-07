# VEXELON 99 and Godot

The first playable **Godot 4 GDScript client** now exists in [`godot/project.godot`](godot/project.godot) and has been opened in the local Godot 4.7.2 editor. Press **F5** to run it while the Node game server is running. See [`godot/README.md`](godot/README.md) for setup, controls, checks, and remaining work.

The client has an arcade title screen with CPU Battle, Host a Room, Join a Room, Options, help, and quit choices. It implements native drawing, menus, keyboard/mouse/gamepad input, palette selection, local preferences/records, and a first native adaptation of the four original music compositions. It reuses the existing Node server for authoritative gameplay. It is not an embedded website and does not recreate the web homepage form.

Godot protocol checks passed for 2P, 4P, teams, and 99 total players with CPUs. A browser host and real Godot client successfully shared a duel and finished on departure. Graphical checks passed controller-simulated menu confirm/back and movement/swapping, live options, and a resized full board. Physical gamepad testing and complete cross-play mode coverage remain pending.

CPU play still requires the Node server; Board/CPU simulation has not been ported to GDScript. No Godot native binaries or web exports have been built, and export templates are not installed locally. The sections below describe the protocol and later export/offline-port work.

## Browser exports

Use the Compatibility renderer and a single-threaded web export. Godot web exports require WebAssembly and WebGL 2.0. Godot 4 C# projects currently cannot be exported to the web. Export templates are required. Browser audio still needs a user gesture, and HTTPS pages need secure `wss://` multiplayer connections.

Godot exports include HTML, JavaScript, WebAssembly, and project data; they are not a drop-in replacement for this game's HTML/CSS/canvas files. Hosting needs the export files, correct MIME types, and an appropriate Content Security Policy. The current Node server only serves a whitelist of JavaScript-client assets, so its asset routing must be adapted for a Godot export. Serve that export and `/socket` from the same origin: the existing server rejects mismatched WebSocket origins. Threaded exports add cross-origin isolation requirements; the proposed single-threaded export avoids that extra hosting requirement.

Sources: [Godot web export documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), [Godot WebSocket documentation](https://docs.godotengine.org/en/stable/tutorials/networking/websocket.html).

## Reuse versus port

| Existing part | Godot client plan |
| --- | --- |
| `server.mjs`, `engine.mjs`, `bot.mjs`, `match-rules.mjs` | Keep on the authoritative server initially |
| JSON messages at `/socket` | Native WebSocketPeer client implemented; 2MB incoming buffer |
| HTML/CSS screens and theme | Native Control title/setup/lobby/options/match menus implemented |
| Canvas panels and effects | Pixel sprites/custom board and slab drawing implemented; full animation parity pending |
| Original music and sounds | First native PCM sequencer/effects adaptation implemented |
| Room codes and presets | Keep the server messages and rules |
| Browser personal records | Separate native records/preferences use Godot user storage |
| Offline play | Port Board, CPU, and rules to GDScript and test against the JavaScript fixtures |

An all-Godot client/server is also possible, but requires porting the server and its simulation. Godot's high-level multiplayer/RPC format is not a drop-in replacement for the existing JSON WebSocket protocol.

## Protocol outline for a first client

Connect to `/socket`; wait for `hello` containing your `id`. Parse UTF-8 JSON messages and use the `type` field to dispatch. Increase receive buffers as needed for full 99-player snapshots, and verify maximum-room state sizes during integration tests.

- Create: `{"type":"create","name":"Player","mode":"teams","ruleset":"classic"}`. Modes are `battle`, `duel`, `quad`, and `teams`; rulesets are `classic` and `rush`.
- Join: `{"type":"join","name":"Player","code":"A1B2C3"}`.
- Host CPU fill: `{"type":"bots","count":3,"difficulty":"normal"}`. Difficulty is `easy`, `normal`, or `hard`.
- Host start: `{"type":"start"}`. Exact-size presets require every seat filled; teams require two per side.
- Move: `{"type":"move","dx":1,"dy":0}`. Swap: `{"type":"swap"}`.
- Raise: `{"type":"boost","active":true}`; send `false` on release, focus loss, or dialog opening.
- Pulse: `{"type":"pulse"}`; the server validates charge and chooses your own queue or teammate.
- Target: `{"type":"target","id":"opponent-id"}`; `null` clears manual targeting. Team-friendly targets are rejected.
- Leave: `{"type":"leave"}`. Host rematch: `{"type":"rematch"}` after `finished`.

`lobby` gives room code, host, mode, capacity, ruleset, players, teams, CPU count, and difficulty. `start` establishes player totals and your team. `state` gives grids, slab metadata, remaining players, team survivor counts, timer/countdown, and your cursor, animation phases, score, best chain, energy, incoming queue, and Pulse availability. `finished` gives `won`, `winnerIds`, `winnerTeam`, display winner, placement, and host. Use `won` rather than assuming a single winning player in team mode.

For a complete client, also handle `move`, `swap`, `effect`, `attack`, `sent`, `garbage`, `break`, `convert`, `pulse`, `eliminated`, `host`, `left`, and `error`. The current web client in `app.mjs` is the protocol reference.

## Port acceptance checks

Start with a two-device room shared between a web client and a Godot client. Confirm input, targeting, audio unlock, and rematches. Then verify four-player FFA, 2v2 without friendly fire, Pulse rescues, shared team wins after elimination, and 99-player performance. A full offline simulation port should match chain scoring, slab gravity/breakup, incoming cancellation, and ceiling elimination tests before native exports resume.
