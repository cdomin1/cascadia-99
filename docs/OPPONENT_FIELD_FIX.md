# Opponent field — visibility and target bounds

Branch: `feature/opponent-field-readability`. Presentation-only correction; no composition redesign or gameplay changes.

## Root causes and correction

Web `.br-grid` filled its parent using equal fractional-height rows; each canvas also had `height:100%` with `object-fit:contain`. The amber outline was on the stretched button, surrounding empty track space instead of the visible 1:2 board image. Normal opponent tiles were rendered at .22 alpha and lacked a visible perimeter.

BR now uses intrinsic rows, non-stretching buttons and explicitly bounded 1:2 canvases. Amber/red outlines attach directly to those canvases. Reserved number-label space remains identical for every state. Removed automatic target `scrollIntoView`; cycling targets never changes layout or scroll. The outline follows actual image geometry.

Active boards have cool subdued but visible geometry, perimeters and identifiers. Targets get brighter colored tiles and amber emphasis; incoming attackers get red emphasis. Eliminated boards omit tiles/slabs, reduce the perimeter to .1 opacity and fade identity to .15. Normal disabled buttons do not accidentally inherit the generic .3 opacity; eliminated states do not compound two fades. Shared rendering tokens also update Godot brightness/perimeters without changing its layout.

Files: `style.css`, `app.mjs`, `visuals.mjs`, `vector-geometry.mjs`, `neo-vector.mjs`, native shared JSON and `board_view.gd`, cache version, dedicated smoke fixture/package command and project/style documentation.

## Verification

Baseline: 99/99 automated tests passed. Final results recorded below.

`PANEL99_WEB_URL=http://127.0.0.1:3040 npm run smoke:opponents` passed with a live 99-seat CPU room: 98 opponents, exact 1:2 canvas bounds, 15 authoritative target changes across 1920×1080, 2560×1440, 3440×1440, 1280×720 and 800×620; every board's coordinates/dimensions and field/window scroll remained identical before/after. Amber outline is on canvas; wrapper outline is absent. A deterministic renderer fixture confirms active/target/extinguished luminance hierarchy and eliminated/attacker classes preserve geometry.

The dedicated native UI fixture checks launch, actual training, mode layouts and 99 CPU seats. Tests are local/synthetic, not 99-human load certification or physical display/controller certification. Electron may print its existing X11 presenter diagnostic while checks pass.

[Corrected field screenshot](verification/opponent-field-fixed.png).

Final automated suite: **99/99 passed**, zero failures/skips (22.6 seconds). Native launch/UI fixture passed, including all seven Tutorial HUD states, real clear, Practice and four-mode/99-CPU layouts. Paired live targeting fixture passed authoritative incoming/outgoing source/destination, target highlights and 99-seat layouts in Godot/web.

Full browser UI regression also passed: direct homepage, persisted setup, online setup, audio/accessibility, offline Tutorial/Practice navigation, all modes, 99 CPUs, targeting, six sizes/zoom/fullscreen. The dedicated opponent check additionally validates highlight geometry and elimination styling independently of live CPU elimination timing.
