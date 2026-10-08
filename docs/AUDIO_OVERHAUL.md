# Audio engineering — SFX-only / curated music integration

The current strategy supersedes the synthesized-score overhaul. **No music is installed or generated.** Earlier composition and listening-review documentation is historical in Git. See [soundtrack status](OST_STATUS.md) and [import guide](MUSIC_IMPORTS.md).

## Preserved mixer and sound effects

The earlier low-output correction remains: the web's hidden 0.22 shared attenuation, context multipliers and SFX-mute coupling are gone. Native PCM uses full signed-16-bit scale and sources consistently route through category buses. Both clients use source → Music/SFX → Master → output, with peak protection. No gameplay rules, balance, targeting or authoritative timing changed.

Defaults remain **Master 85%, Music 75%, SFX 85%**, with the shared power-1.5 volume curve. SFX retains its calibrated 1.5 category trim. Imported music has unity source/category trim, without the generated-score 1.55 boost or context attenuation. Independent music/SFX mute remains. Existing mix-version migration, saved zero and intentionally low values are preserved; changing the soundtrack does not reset user volumes.

Web uses a restrained compressor (−3dB threshold, 3dB knee, 8:1, 3ms attack/90ms release) followed by the bounded oversampled safety curve. Native uses AudioEffectHardLimiter at −1dB with 90ms release. These differ numerically; physical listening is still needed for perceived platform parity. No existing sound-effect asset was destructively remastered.

Shared event definitions and mix defaults now live in `audio-config.mjs` and identical `godot/assets/audio-config.json`. The shared synthesis kernels retain only timbres used by SFX. All 69 prebuilt native PCM buffers remain byte-identical. Regenerate **SFX only** with `npm run audio:sfx-assets`; this is not a soundtrack generator. Short delayed event tones are required for matches/chains, abilities, countdown and results, not background music.

Preserved events include movement/swap, matches/combo/chain escalation, Glitch landing/incoming/break, sparse Flux thresholds, all four abilities, Danger/Critical, KO, victory/defeat and menu confirmation/back. Voices remain capped at 32; queued native notes at 64. Larger events retain headroom over navigation/swaps. Existing immediate gameplay event hooks are unchanged.

## Playback and settings

`music.mjs` and `godot/scripts/music_player.gd` load developer-supplied recordings only. The native persistent autoload is now `AudioManager`, with SFX independent of its lightweight music child. The empty child does not process frames or create AudioStreamPlayers; web creates no music bus/source or audio context for an empty soundtrack. There are no music worker threads, generators, score clocks or adaptive layers.

The shared empty registry and mirrored asset directories tolerate no tracks. Track pickers and music enable controls show **NO TRACKS INSTALLED** instead of broken selections. Music volume remains configurable for future imports. Stale generated IDs are ignored/removed; Master/Music/SFX, independent mute and accessibility preferences remain intact. The service-worker cache version changes to retire cached score modules; desktop packaging includes only current modules and the empty music library.

## Verification

- `npm test`: simulation, protocol, SFX data/PCM, settings migration, registry validation, empty/missing libraries, mocked file loop/fade/transition/cancellation behavior.
- `npm run smoke:godot-audio`: native empty/missing library, retained event effects, independent mute, voice cap, bus routing and shutdown.
- `PANEL99_WEB_URL=http://127.0.0.1:3070 npm run smoke:web-audio`: real Chromium OfflineAudioContext mixer, overlapping gameplay effects, 0/25/50/75/100% Master/Music/SFX, empty music creates no source/bus.
- `npm run smoke:phase1`: actual native/browser ability input, SFX, authoritative costs and reconnect with no music.
- `npm run smoke:web`: menus, settings, persisted volume, offline training and all modes.
- `npm run smoke:godot-mix`: real native output capture with overlapping SFX and no music players.
- `godot --path godot --script res://tests/audio_volume_smoke.gd`: native runtime volume matrix with SFX only; Music slider must not affect SFX.

These are signal/runtime checks, not human listening approval or physical speaker/headphone certification. No licensed recordings exist yet, so real music decoding, subjective mix, long-loop seams and future soundtrack attribution require verification when supplied.

## Current checkpoint results

Baseline 104/104 and final 105/105 automated tests passed. Godot import completed without script/import errors. Native empty/missing-library event SFX and mute checks, saved low/zero/obsolete-track recovery, synthetic controller Settings navigation, offline Tutorial/Practice, three consecutive battle intros/scene reload and native/browser Phase 1 ability/reconnect checks passed. Browser UI covered all modes/99 CPUs, six sizes, zoom/fullscreen and stale music preferences. All 22 shared named event definitions and 69 native PCM buffers are unchanged from the preceding checkpoint.

Chromium stress renders passed all fifteen slider points: zero Master/SFX produced zero PCM, Music levels did not affect SFX, and peak stayed below .930 even with extreme overlapping effects. Native thirty-second output capture at defaults measured peak .69848/RMS .11382 with zero music starts. Native slider captures passed all fifteen points; 100% peaks stayed below .892 and zero Master/SFX output was below .00001. These are automated captures, not listening tests.

The first native Phase 1 harness run emitted an ObjectDB exit warning; that fixture already had an immediate-exit cleanup warning before this work. SFX, Settings, controller, offline and battle-flow checks exit cleanly. Electron emits its existing X11 software-presenter diagnostic while browser checks pass. No real music-file test or Firefox/hardware listening claim is made.
