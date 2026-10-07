> Historical implementation reference: current presentation is **Neo-Vector Arcade — “1982, BUT IMPOSSIBLE.”** See `docs/NEO_VECTOR_STYLE_GUIDE.md` (from the repository root). Legacy garbage terminology refers to Glitch Blocks; protocol identifiers remain compatible.

# VEXELON 99 — Godot 4 client

A native GDScript client with a game-style title screen, not an embedded browser or a recreation of the homepage form. Tested locally with Godot 4.7.2 using the Compatibility renderer.

## Run in your installed editor

1. Open/import `project.godot` from this directory. This project has already been opened in the local Godot editor.
2. Keep the existing Node game server running. If needed, run `npm start` from the parent `panel-99` directory. Reuse the preview server if port 3000 is already in use.
3. Press **F5** in Godot. Choose **CPU Battle**, **Host a Room**, or **Join a Room**. Match settings live in a separate setup panel.
4. In **Options**, change the server address when playing with friends on another host. All clients in a room must use the same server. Browser and Godot clients can share rooms.

From the parent directory, `npm run godot:editor` opens the project and `npm run godot` runs it directly.

## Controls

| Action | Keyboard/mouse | Gamepad |
| --- | --- | --- |
| Navigate menus | Arrows, Enter, mouse | D-pad or left stick, A/Cross to confirm |
| Move cursor | Arrow keys; click board to position | D-pad or left stick |
| Swap | Space or right-click board | A/Cross |
| Raise stack | Hold Shift | Hold RB/R1 |
| Pulse | X | X/Square |
| Options | Escape | Start/Options |
| Back | Escape | B/Circle |
| Select target | Click a rival or use targeting dropdown | Navigate targeting dropdown |

Controller actions bind all devices, with a 0.4 deadzone for board movement and repeated cursor steps. Raising is released on focus loss, menu opening, departure, and quit. Synthetic controller tests pass; physical controllers, platform-specific mappings, and analog tuning still need hands-on testing. Text entry for names, codes, and server addresses currently uses the keyboard; there is no controller-only virtual keyboard.

## Included in the first port

- Controller-navigable arcade title menu; separate CPU/host/join setup, lobby, Options, help, match, and results panels.
- Existing real room protocol: host/start, CPU count/difficulty updates, team changes, manual and automatic targeting, Pulse, leave, host rematch, and shared team results.
- All four modes and Classic/Rush rules through the authoritative server, with native full-board rendering and rival previews.
- Original pixel tile assets exported from the web renderer for all five palettes. Godot draws its own dithered wells, garbage slabs/core pulses, cursor, match brightness, and combo/break/Pulse text overlays.
- Five live palettes, light/dark mode, reduced motion, separate audio toggles, four native synthesized tracks, listening preview, and local preferences/records in `user://settings.cfg`.
- The music uses the original exported chord/melody/rhythm data in a native PCM sequencer. The native instruments/mix are a first adaptation, not an exact copy of the Web Audio stereo effects chain.
- Compatibility rendering and viewport scaling keep the full board visible as the window shrinks. Small matches display all three rival boards in one row; larger rooms use a scrollable rival field.

## Checks from the parent directory

```sh
npm run godot:import
npm run smoke:godot
npm run smoke:godot-audio
npm run smoke:godot-ui
```

Protocol QA starts its own temporary Node server and exercises Godot clients in 2P, 4P, teams, and a 99-player CPU room, then joins a browser-hosted room. It checks input, swaps, targeting, boosting, and leaving. UI QA requires the ordinary preview server and a display; it simulates controller title navigation/confirm/back and in-match movement/swapping, changes live options, resizes the window, and captures ignored `.web-smoke/godot-*.png` screenshots. UI QA uses a separate preferences file. Audio QA verifies the sequencer and generated PCM of all four tracks; it does not measure the final mixed audio output or subjective musical quality.

`npm run godot:assets` regenerates the checked-in tile sprites, palettes, compositions, logo, and licensed font from the running web game. Generated `.godot/` caches and `exports/` builds are ignored; `.uid` and asset `.import` metadata are kept.

## Remaining port work

This is the first playable native client, not a complete standalone Godot replacement. The Board/CPU/match simulation remains in JavaScript on Node: CPU play currently also requires that server. No offline GDScript simulation, Godot server, native binary release, or Godot web export exists yet. Local export templates are not installed. Export presets must include the JSON data and font license when packaging.

Further work: offline simulation parity fixtures, more complete swap/fall/particle/projectile animation, native audio polish/fades/stereo processing, controller text entry/rebinding and physical-device testing, lobby mode/rules editing, remaining incoming-attack/team HUD details, cross-platform/export validation, and graphical 99-player performance/soak testing. The completed real Godot/browser cross-play check is a duel; wider mixed-client modes should be exercised next.
