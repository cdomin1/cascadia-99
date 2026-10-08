# Homepage correction and Kode Mono

Branch: `feature/homepage-kode-mono`; focused UI/typography checkpoint, no automatic merge.

## Restored functionality

Web title has two zones: official wordmark/tagline/Tutorial/Practice/Settings, and directly accessible name/mode/CPU/difficulty/rules/Play CPUs/Create Room/Join. Removed redundant Play/mode/configuration pages. CPU play uses one primary action with valid defaults/saved settings; name and validated setup persist locally. Fixed-seat modes constrain CPU count; Battle Royale restores its last chosen count. Online actions are secondary but always visible. Header remains compact with labelled audio/settings/help controls. No showcase, second toolbar, themes or light mode were restored.

Gameplay HUD layout, native black background, simulation/balance/target algorithms, startup sequence, audio manager and both brand logos are preserved.

## Typography

- Web assets: `fonts/kode-mono/KodeMono-Variable.ttf`, `OFL.txt`, provenance `README.md`.
- Native identical assets: `godot/assets/fonts/kode-mono/`.
- Font SHA-256: `5ce8baede4ef692ea485e630a9fbd485c847f74954df66db5de0564b6dd8c3db`.
- Official Google Fonts distribution: https://github.com/google/fonts/tree/main/ofl/kodemono. SIL OFL 1.1 included; no runtime CDN requests.
- Shared typography tokens in `neo-vector.mjs` / `godot/assets/neo-vector.json`; web CSS family/size/weight/line-height/tracking variables, native cached FontVariation resources in `typography.gd`.
- Regular 400, medium 500, bold 700; native theme controls and custom gameplay/countdown text use the same family. Browser monospace/native system fallback cover unsupported characters. Existing wordmarks remain original vector assets.

## Files and systems

Homepage/navigation: `index.html`, `app.mjs`, `style.css`.
Typography/rendering: shared specification, `vector-geometry.mjs`, native `main.gd`, `presentation_effects.gd`, `typography.gd`, licensed font assets.
Delivery: `server.mjs` local font route, service-worker cache/version, asset export helper.
Verification/docs: web smoke fixture, native UI fixture, offline training fixture, contract/desktop tests, AGENTS/style guide/status/changelog/README.

## Verification

Baseline: 98/98 tests passed. Final: **99/99 passed**, zero failures/skips, 22.5 seconds. Native UI and controller fixtures and the final browser flow/offline fixtures also passed.

Passed browser flow fixture: direct setup, saved mode/difficulty, fixed CPU counts, room creation, invalid-code feedback, audio/settings/accessibility, synthetic gamepad focus/confirm/back, Tutorial real clear, Practice/Pause, all four modes including 99 CPU seats, targeting. Layout checks: 1920×1080, 2560×1440, 3440×1440, 1280×720, 800×620 and 390×844, plus 150% zoom and fullscreen entry/exit. Common desktop setup remains within viewport; smaller screens stack and may scroll intentionally.

Passed native import/launch and real UI fixture: Kode Mono identity/glyph assertion, title/mode focus, seven lesson HUD states, real clear, gamepad completion navigation, Practice, all four modes/99 CPU seats and logical layout sizes. Separate synthetic native controller fixture covers setup/join/tutorial/practice/settings focus and volume adjustment. Cached browser offline reload verifies font request success and real training play with networking disabled.

A full-suite run exposed an outdated case-sensitive button label expectation and duplicate legacy typography token definition; both were corrected before final verification. No legitimate tests were removed.

Physical controller families, native display hardware/fullscreen and human usability testing are not certified by synthetic checks. Viewport/layout emulation is not monitor hardware testing. 99 CPUs are not 99-human Internet scalability. No soundtrack or startup redesign; no new audio assets or export/package build.

Captures: [homepage](verification/homepage-kode.png), [Godot Tutorial](verification/native-kode-tutorial.png). Prior UI milestone captures remain historical.
