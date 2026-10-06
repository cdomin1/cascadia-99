# Desktop packaging — paused

Desktop builds are deferred while work focuses on the web game. Existing files in `release/` are earlier prototypes and do not include the latest responsive layout or adaptive music. The build workflow is manual-only. Notes below are retained for when desktop work resumes.

# Panel 99

A rising-panel battle game for 2–99 total competitors. Play solo against CPUs, invite friends with a six-character room code, or mix humans and CPUs in one match. The same engine powers the browser version and self-contained desktop apps.

## Play locally in a browser

Requires Node.js 22 or newer. The browser server has no runtime dependencies; no install step is needed for this mode.

```sh
cd /home/thinkypad/Projects/panel-99
npm start
```

Open `http://localhost:3000`. Choose CPU count and difficulty, then **Play CPUs**. Alternatively, **Create room**, add CPUs in the lobby if desired, and start when ready. Other players open the same game address and join using your room code.

## Self-contained desktop apps

Desktop builds include Electron, the browser, the game server, CPU AI, and all game assets. Players do not need Node.js, npm, a browser, or internet access for CPU play.

Built downloads are in `release/`:

| Platform | Download | How to run |
| --- | --- | --- |
| Linux x64 | `Panel-99-0.2.0-linux-x86_64.AppImage` | Make executable and launch |
| Linux x64 | `Panel-99-0.2.0-linux-x64.tar.gz` | Extract, then launch `panel-99` inside the extracted folder |
| Windows x64 | `Panel-99-0.2.0-windows-x64-portable.exe` | Launch directly; no installation required |
| macOS Intel | `Panel-99-0.2.0-mac-x64.zip` | Extract and move `Panel 99.app` into Applications |
| macOS Apple Silicon | `Panel-99-0.2.0-mac-arm64.zip` | Extract and move `Panel 99.app` into Applications |

These are unsigned development builds. Linux has been run and tested on this machine. Windows and macOS builds have been packaged but require validation on their respective operating systems. macOS builds have not been signed or notarized, and Windows builds have not been signed. Production distribution should use signing credentials on the native build runners. See [Electron packaging](https://www.electronjs.org/docs/latest/tutorial/forge-overview) and [platform build guidance](https://www.electron.build/v26/docs/features/multi-platform-build/).

On Linux, if AppImage mounting is unavailable, use the `.tar.gz` download or `./Panel-99-0.2.0-linux-x86_64.AppImage --appimage-extract-and-run`. No changes to system or sandbox configuration are required by the app.

### Desktop development and packaging

```sh
npm ci
npm run desktop
```

Package on the respective operating system:

```sh
npm run dist:linux
npm run dist:win
npm run dist:mac -- --arm64
npm run dist:mac -- --x64
```

macOS targets include DMG and ZIP on macOS. The local Linux cross-build uses ZIP only. On Linux, Windows cross-builds can skip executable resource editing with `npm run dist:win -- --x64 --config.win.signAndEditExecutable=false`; native Windows builds apply the app icon and executable metadata normally. The NSIS installer requires a native Windows runner or Wine; only the portable Windows app is built in this Linux workspace.

The checked-in `.github/workflows/desktop-build.yml` builds Linux x64, Windows x64, macOS Intel, and macOS Apple Silicon on native runners, with downloadable artifacts. It runs manually through GitHub Actions or when a `v*` tag is pushed. The workflow is configured but has not been run in this local workspace. It uploads build artifacts without publishing a release.

## Play with friends

For a step-by-step Render deployment, see [HOSTING.md](HOSTING.md).

**Local network:** Desktop apps start their own bundled server on a free port. Create a room; the lobby shows the host’s Wi-Fi/LAN game addresses. Friends can open one of those addresses in a browser, or use **Game server** in their desktop app to connect, then enter the room code. Everyone must be on the same reachable network and the host app must remain open. A firewall may need to allow the app’s incoming connections.

**Internet:** Deploy the browser server to a Node.js host with HTTPS and WebSocket support. Set `PORT` and optionally `HOST`; pass WebSocket upgrades to `/socket`. Desktop players use **Game server** to enter the hosted server address, and then create or join rooms there. **Return to local CPU play** reconnects to the desktop app’s own server.

Room codes identify rooms on a particular server, not across every running app. People joining a room need both the same server address and the room code. Rooms are ephemeral, disappear when their last human leaves, and are lost on a server restart. Disconnecting forfeits the current match. A departing host transfers ownership to another human, never a CPU.

## CPUs

- Quick solo battles offer 1, 9, 24, or 98 CPUs.
- Room hosts can choose any CPU count from 0 to 98, while humans and CPUs together stay within 99 competitors.
- Easy, Normal, and Hard adjust thinking time, cursor speed, and mistakes.
- CPUs evaluate matching swaps, falling-panel chains, and matches beside garbage, then move the cursor and swap through the same engine as human players.
- CPUs do not receive free clears, fake scores, or immunity to attacks.

## Controls

| Key | Action |
| --- | --- |
| Arrow keys | Move the two-panel cursor |
| Space | Swap the two selected panels |
| Hold Shift | Raise the stack faster |

Click or tap the board to position the cursor. Touch buttons are also available. Click a rival to target them; choosing a targeting mode clears manual targeting. Desktop menus include fullscreen and zoom controls.

Sound starts enabled and unlocks after your first click or keypress. Cursor movement, swaps, clears, chains, incoming attacks, garbage landings, countdowns, danger, and match results have distinct procedural effects. The **Sound on/off** button mutes immediately. Effects are generated locally and work offline.

## Rules

- Match at least three same-color panels horizontally or vertically.
- Falling panels that make another match create a chain.
- Matches of four or more, plus chains, generate attacks.
- Attacks cancel queued garbage first; excess goes to a rival after a warning delay.
- Clear beside gray garbage to turn connected garbage into colored panels.
- The stack gradually speeds up. Spending two seconds at the ceiling eliminates you.
- Last survivor wins. The host can return to the lobby for a rematch, keeping its CPU settings.

## Validation

```sh
npm test
npm run smoke:desktop
```

The tests cover match detection, chains, attack cancellation, garbage conversion and delay, ceiling elimination, CPU decision making and engine scoring, room permissions and capacity, host transfer, abandoned-room cleanup, actual multi-client WebSocket play, and desktop server startup/shutdown. Desktop smoke testing opens a temporary game window and exercises solo CPU play and the lobby; screenshots are saved in `.desktop-smoke/`.

The packaged Linux app can also be tested independently:

```sh
./release/linux-unpacked/panel-99 --remote-debugging-port=9339 --user-data-dir=/tmp/panel99-packaged-test
node scripts/packaged-smoke.mjs
```

This is an original prototype with its own name and visual assets. Reconnection, durable rooms, horizontal scaling, code signing, and large-scale public multiplayer load testing remain future work. The game does not include an auto-update service.
