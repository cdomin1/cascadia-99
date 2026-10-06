# Cascadia 99 and Godot

This game is suitable for Godot. The current deliverable remains the working JavaScript web game; there is no Godot project or Godot executable in this version.

The lowest-risk port is a **Godot 4 client in GDScript** that reuses the existing Node server. This preserves room codes, matchmaking rules, authoritative board simulation, CPUs, Pulse, and team wins. It also allows browser and Godot clients to share a room once protocol compatibility is tested. These are proposed architecture choices, not capabilities verified in a Godot build.

## Browser exports

Use the Compatibility renderer and a single-threaded web export. Godot web exports require WebAssembly and WebGL 2.0. Godot 4 C# projects currently cannot be exported to the web. Export templates are required. Browser audio still needs a user gesture, and HTTPS pages need secure `wss://` multiplayer connections.

Godot exports include HTML, JavaScript, WebAssembly, and project data; they are not a drop-in replacement for this game's HTML/CSS/canvas files. Hosting needs the export files, correct MIME types, and an appropriate Content Security Policy. The current Node server only serves a whitelist of JavaScript-client assets, so its asset routing must be adapted for a Godot export. Serve that export and `/socket` from the same origin: the existing server rejects mismatched WebSocket origins. Threaded exports add cross-origin isolation requirements; the proposed single-threaded export avoids that extra hosting requirement.

Sources: [Godot web export documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html), [Godot WebSocket documentation](https://docs.godotengine.org/en/stable/tutorials/networking/websocket.html).

## Reuse versus port

| Existing part | Godot client plan |
| --- | --- |
| `server.mjs`, `engine.mjs`, `bot.mjs`, `match-rules.mjs` | Keep on the authoritative server initially |
| JSON messages at `/socket` | Connect with `WebSocketPeer`; poll each frame and send text JSON |
| HTML/CSS screens and theme | Recreate with Control containers and themes |
| Canvas panels and effects | Recreate with custom 2D drawing, tweens, and particles |
| Original music and sounds | Port the procedural synthesis or create original audio assets |
| Room codes and presets | Keep the server messages and rules |
| Browser personal records | Use Godot persistent storage, with a separate compatibility decision for browser records |
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
