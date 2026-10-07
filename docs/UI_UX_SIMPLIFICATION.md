# VEXELON — UI/UX simplification delivery

Branch: `feature/ui-ux-simplification`. No automatic merge.

## What changed

BLACK IS THE PLAYFIELD. LIGHT IS INFORMATION. THE BOARD IS THE HERO.

- Removed theme/palette/light selection, scripts, exported palette data, routes and packaging entries. Obsolete saved preferences are ignored/removed safely. Shared Neo-Vector design tokens remain canonical.
- Web: compact header, title menu, progressively disclosed mode/configuration/online setup, persisted display name, no homepage showcase. Audio/music selection and volumes live in Settings.
- Both: black board interiors, restrained boundaries, larger responsive boards, compact Flux/abilities, contextual incoming warning, compact target strategy cycling, and Pause for settings/controls/leave.
- Godot: removed persistent background grid, oversized boxed HUD, active strategy dropdown, permanent room code and control sheet. Mode-sensitive opponent detail and centered ultrawide layout retain target/attacker emphasis.
- Tutorial reveals systems by lesson; intended swaps are highlighted and Next appears after success. Controller success opens navigation once. Practice tools/configuration are inside Pause; no Tutorial Next/Skip during Practice.
- Fixed client identity restoration when returning from offline training to multiplayer. Gameplay core, balance, attack algorithms and authoritative countdown remain unchanged.

## Checkpoints

1. `882533a` — Remove obsolete visual themes and retain canonical vector rendering.
2. `4e4358b` — Simplify web menus, responsive gameplay and contextual training HUD.
3. `6fc5937` — Simplify native arcade HUD and controller-accessible training flow.
4. Documentation/capture commit follows these checkpoints. Its hash is available through `git log -1` on this branch.

Substantial systems: `app.mjs`, `index.html`, `style.css`, browser gamepad modules, `visuals.mjs`, `vector-geometry.mjs`, Godot `main.gd`/`board_view.gd`, asset export/cache/packaging, UI smoke fixtures and project documentation.

## Verification

Baseline: 96/96 automated tests passed. Expanded suite: 98/98 passed before final controller completion refinement. Final rerun results are recorded below.

Passed executable checks:

- Web title, mode/configuration flow, online setup disclosure, stale theme state, Settings/music/volume, actual Tutorial clear/success, Practice Pause/tools, all four modes including 99 CPU seats, targeting.
- Browser emulated layouts: 1920×1080, 2560×1440, 3440×1440, 1280×720, 800×620, 390×844; board bounds/overflow and desktop board prominence; fullscreen entry/exit.
- Native launch/import, title/mode focus, all seven lesson HUD states, real Tutorial clear and gamepad completion navigation, Practice Pause, four modes/99 CPU seats and board dominance.
- Native logical layout checks: 1920×1080, 2560×1440, 3440×1440, 1280×720, 800×620. These resize the root layout; compositor/monitor hardware coverage is not implied.
- Synthetic controller navigation, paired authoritative targeting, paired Help, 36 selector fixtures, 18 effect fixtures, Phase 1 abilities/costs/timers, four-mode native protocol and real browser/native crossplay.
- Cached browser offline reload and native offline training.
- Native PCM music check: four existing arrangements, continuous sample clock, phase-preserving context/mute, independent SFX. Existing audio remains prototype material; no compositions replaced.

Local effects observations: native frame-wall p95 16.946ms; web draw p95 .400ms over 540 samples. These are fixture observations, not performance certification.

## Visual review and captures

Before: [web home](verification/homepage.png), [native 99P](verification/native-targeting-99.png).

After:

| Screen | Web | Godot |
|---|---|---|
| Title | [capture](verification/ui/title.png) | [capture](verification/ui/native-title.png) |
| Tutorial | [capture](verification/ui/tutorial.png) | [capture](verification/ui/native-tutorial.png) |
| Practice | [capture](verification/ui/practice.png) | [capture](verification/ui/native-practice.png) |
| 2P | [capture](verification/ui/duel.png) | [capture](verification/ui/native-duel.png) |
| 4P | [capture](verification/ui/quad.png) | [capture](verification/ui/native-quad.png) |
| Teams | [capture](verification/ui/teams.png) | [capture](verification/ui/native-teams.png) |
| 99P | [capture](verification/ui/battle.png) | [capture](verification/ui/native-battle.png) |

Review confirms substantially less permanent chrome/text, black background, enlarged boards and progressive lesson HUD. Both retain semantic selector/Flux/target/threat colors. Native and browser layouts intentionally differ while sharing hierarchy.

## Preserved accessibility and limitations

Shake, reduced flash, reduced motion, effect quality, independent music/SFX volume and music selection remain. No vibration implementation was added or removed. Dynamic prompts and semantic controller actions remain; Practice Tools disclosure is keyboard/controller focusable.

Physical controller families, rumble, a human controller-only playthrough, native fullscreen hardware behavior and fresh long listening sessions were not tested. Synthetic checks do not prove hardware compatibility. Browser viewport emulation is not a physical display matrix. Small browser layouts prioritize the board over the full opponent field while retaining target controls. No new export/package build or representative 99-human Internet load test was performed.

The existing Phase 1 native harness reports 11 ObjectDB instances at exit; the new UI fixture exits cleanly. Electron may emit an X11 presenter diagnostic and deprecated console-event warning while fixtures pass. One final suite run failed a pre-existing CPU match timing assertion during concurrent GUI verification; the isolated rerun is reported below rather than concealing that failure.

Final isolated delivery run: **98/98 passed**, zero failures/skips, 22.6 seconds. Native controller lesson completion fixture also passed after the final refinement.
