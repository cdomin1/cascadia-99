# Cascadia 99 — web game

A rising-panel battle game with geometric panels, room-code multiplayer, 2P and 4P VS, 2v2 teams, up to 98 CPU opponents, and original adaptive vaporwave/synthwave music. Cascadia 99 is the working title. The name has not been trademark-cleared; a separate published game is already called [Cascadia](https://www.alderac.com/cascadia/). The active deliverable is the browser version; desktop packaging is paused.

## Run locally

Requires Node.js 22 or newer. The web server has no runtime dependencies.

```sh
cd /home/thinkypad/Projects/panel-99
npm start
```

Open [http://localhost:3000](http://localhost:3000).

- **Play CPU battle:** choose a mode, Classic or Rush rules, and Easy, Normal, or Hard difficulty. VS presets fill the remaining seats with CPUs; Battle Royale allows 1, 3, 9, 24, or 98 CPUs.
- **Create a room for friends:** select the mode and share the game address and room code. Every person plays on their own device. The host can fill open seats with CPUs and adjust mode/rules in the lobby.
- **Join a room:** enter its six-character code on the same game server.

For a two-human test, open two browser tabs. For devices on your local network, use the host computer's LAN address with port 3000. Room codes are specific to the server everyone connects to.

## Modes and replayability

| Mode | Players | Victory |
| --- | --- | --- |
| 2P VS | Exactly 2 | Last survivor |
| 4P VS | Exactly 4 | Last survivor |
| 2v2 Teams | Exactly 4, 2 per team | Last team with a survivor |
| Battle Royale | 2–99 | Last survivor |

Cyan and Coral teams never attack their own side. Players may choose their team in the lobby; the host can rearrange even a full room by swapping players. Eliminated teammates still share a team victory.

**Pulse:** clears fill a 0–100 energy charge. At 100%, press X to cancel up to six queued garbage cells. You defend your own incoming queue first; in 2v2, an empty queue lets Pulse rescue your surviving teammate. No pending attack means no charge is spent. CPUs can use Pulse too.

**Rush:** optional room rules make stack rise 60% faster; attacks and scoring keep the same rules.

**Personal records:** best score, best chain, and wins are saved on this browser. These are local records, not a global leaderboard.

## Controls

| Key | Action |
| --- | --- |
| Arrow keys | Move the two-panel cursor |
| Space | Swap the selected panels |
| Hold Shift | Raise the stack faster |
| X | Use a charged Pulse |

Touch controls are available too. Click a rival to target them, or choose Random, Near top, Attackers, or Most KOs. The play screen scales to the window height, keeping the whole board and play controls visible. Opponent boards scroll within their own panel.

## Appearance

Use the header’s Light/Dark button to switch themes. Your choice is saved in this browser; on your first visit, the site follows your device appearance. The playfield keeps its familiar panel colors in both themes.

## Music and sound

Audio starts after your first click or keypress. All music and effects are synthesized locally, with no audio downloads.

The original **Neon Afterglow** soundtrack uses detuned synth pads, rounded bass, a melodic lead, stereo arpeggios, dotted-eighth echoes, and an 80s drum groove. As stack height and board occupancy increase, tempo rises smoothly from 86 to 132 BPM and percussion, harmony, and arpeggios become more urgent. Clearing the board eases the music back down. Use **Hear the soundtrack** on the homepage to preview it. **Music on/off** controls the soundtrack independently; **Sound on/off** mutes all audio. Preferences are saved in this browser.

Distinct effects accompany cursor movement, swaps, clears, chains, attacks, garbage landings, countdowns, danger, and match results. Music fades out when you are eliminated, leave, disconnect, or finish the match.

## Visuals and homepage demo

Four pixel glyphs—Skull, Cyber-Eye, Radiation, and Twin Bolts—distinguish panels by silhouette and color. Magenta, cyan, acid green, and amber bodies use hard three-tone palettes, visible Bayer dithering, and a black 2px border around the dark interior lip. Smooth gradients and translucent surface shading are replaced with 75%, 50%, and 25% ordered stipple. The empty board has a subtle 25% slate LCD pattern. Cast-iron attack slabs retain their 3–6-column, 1–3-row footprints and bottom-to-top release, with a bright top bevel, heavy horizontal checker bands, chunky red/purple hazard hatches, and a two-frame pixel CPU core. Match flashes and combo badges remain, while reduced motion freezes warning and core pulses. The homepage GIF and still share the live renderer.

The homepage includes an eight-second looping gameplay GIF rendered from the actual engine. Reduced-motion preferences replace it with a still image. To regenerate it, run `./node_modules/.bin/electron scripts/render-demo.cjs` against the local server with FFmpeg installed. It renders and encodes a 50 FPS GIF with a full 256-color palette; source PNG frames are saved in `.web-smoke/demo-frames/`.

## Rules

Match three or more panels horizontally or vertically. Falling panels that match again create a chain. Matches of four or more and chains generate attacks; those attacks first cancel incoming garbage, then send any excess to a rival. Opponents send full-width slabs or 3–5-column segments, with taller slabs for larger chains. Individual slabs are at most three rows tall; a final one- or two-cell remainder uses a three-column segment. Clear beside a slab to crack it and convert it into colored panels one row at a time. The stack speeds up over time; staying at the ceiling for two seconds eliminates you. Last survivor wins.

CPUs move cursors and swap through the same board engine as humans. They evaluate clears, chains, and garbage adjacency, with difficulty affecting speed and mistakes. They do not receive fake scores or immunity.

## Host online

See [HOSTING.md](HOSTING.md) for the full guide. `render.yaml` configures a Node web service for a first trial:

1. Put this folder's source in a GitHub repository, excluding `node_modules/`, `release/`, `.desktop-smoke/`, and `.web-smoke/`.
2. On Render, create a Blueprint connected to that repository, using `render.yaml`.
3. Share the resulting HTTPS game address and room code with friends.

The production build command is `npm ci --omit=dev`; the start command is `npm start`. Use one server instance because rooms live in memory. Restarting the server ends its matches. No online deployment has been created from this workspace.

## Verify

```sh
npm test
```

Optional browser QA uses the installed Electron runtime solely as a test browser, loading the running web server:

```sh
npm ci
npm start
# In another terminal:
npm run smoke:web
```

It checks all VS/team presets, 98-CPU play, theme persistence, actual sound output, music mute, and viewport sizes from 1440×900 down to 360×640, including short windows, without page scrolling or clipped play controls. Screenshots are saved in `.web-smoke/`.

A Godot client can reuse this server protocol; see [GODOT.md](GODOT.md) for the port approach and browser-export constraints. No Godot port is included in this web build.

Reconnection, durable rooms, and multi-server scaling remain future work. Earlier desktop packaging notes are retained in [desktop/README.md](desktop/README.md) for later; the existing executable builds are not the current web version.

The site uses an 80s arcade shell with a bundled VT323 pixel terminal font, hard cabinet borders, cyan/magenta accents, and a static grid background. Light mode uses warm cream tones. Font attribution and the SIL Open Font License are in `fonts/OFL.txt`; no external font request is needed.

Palette and soundtrack dropdowns are available above the homepage, lobby, and match. Five palettes (Neon Arcade, Midnight Violet, Tokyo Night, Amber Terminal, Polar Frost) update the site and pixel game surfaces immediately, while the light/dark toggle remains independent. Preferences persist locally. The prerecorded homepage GIF shows Neon Arcade.

Four original adaptive soundtracks are selectable: Neon Afterglow (86–132 BPM), Midnight Circuit (94–140 BPM, minor-key arcade pulse), Cassette Coast (78–126 BPM, warm cassette-style synth pop), and Chrome Runner (100–148 BPM, driving bass and synth leads). Each has a distinct melody, chord progression, rhythm, and synth arrangement. Switch tracks during playback without resetting the game. Selecting a track while music is stopped keeps it silent until you start playback.

For the current implementation, known limitations, and next steps, see [PROJECT_STATUS.md](PROJECT_STATUS.md). Development history is in [CHANGELOG.md](CHANGELOG.md).

## Godot 4 port

The first native Godot client is in [godot/project.godot](godot/project.godot). It has a game-style title screen, separate setup panels, keyboard/mouse/gamepad support, native pixel rendering, palette Options, and adapted music. Open it in Godot and press F5 while the existing Node server runs. It is a client port; offline GDScript simulation and native exports are future work. See [godot/README.md](godot/README.md).
