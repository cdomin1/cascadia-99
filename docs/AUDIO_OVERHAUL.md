# Audio overhaul — implementation and verification

## Root causes and correction

Web previously applied a fixed **0.22 shared master**, then music category/context attenuation (`volume × .725` in battle, `.5` on title) on top of quiet source levels. Turning SFX off set the shared master to zero, unintentionally muting music; SFX mute could also prevent audio unlock. Godot compounded low synthesized source amplitudes/16-bit scaling, quiet percussion, category volume and title/intro multipliers. The old four compositions also shared a short repeating architecture. Raising gain alone would not address that weakness.

Both clients now use **source → Music/SFX category → Master → peak protection → output**. Web SFX mute affects only its category bus; music can unlock/play independently. Native sources consistently route to Music/SFX buses sending to Master. The old hidden master attenuation and native pre-category soft clipping are removed. The native source PCM uses full signed-16-bit scale rather than 24000/32768. DSP sources are generated, so existing recordings were not destructively normalized.

New defaults: **Master 85%, Music 75%, SFX 85%**. Shared category calibration trims are Music 1.55 and SFX 1.5; these are deliberate documented source/mix calibration, not duplicate user controls. The user curve is `gain = fraction^1.5`, converted to dB for Godot buses. Context calibration is title/battle 1, intro .82, victory .65, defeat .55. Results leave room for their stingers.

Web final protection uses a restrained compressor (−3dB threshold, 3dB knee, 8:1, 3ms attack/90ms release) followed by a bounded oversampled safety curve. Godot uses the current `AudioEffectHardLimiter`, ceiling −1dB/release 90ms. These implementations differ; equivalent source/category settings aim for comparable presence, not mathematically identical output. See [Godot HardLimiter documentation](https://docs.godotengine.org/en/stable/classes/class_audioeffecthardlimiter.html).

## Preferences and UI

Settings exposes Master/Music/SFX sliders using the existing Kode Mono theme. Music/SFX enable switches remain independent. Saved zero and intentionally low preferences remain valid. One-time mix-version 2 migration maps existing linear category preferences through `old^(1/1.5)` so changing the control curve does not itself reduce their category gain. New defaults apply only when no preference exists. New Master calibration/source changes intentionally change the overall mix. Old track IDs remain valid and now select the rewritten compositions. No gameplay HUD controls were added.

Web storage keys: `vexelon-volume-master/music/sfx`, `vexelon-mix-version`. Native ConfigFile keys: `audio.master_volume/music_volume/sfx_volume`, `audio.mix_version`. Browser storage failures remain non-fatal. The service-worker shell and desktop packaging include both new audio modules; offline synthesis requires no CDN/recording download.

## Score and SFX

See [OST_STATUS.md](OST_STATUS.md) for four rewritten songs, motif, bass/groove/form and aligned adaptive parts. Both clients consume identical compiled score events and share ported synthesis kernels. Pressure does not change tempo or restart playback.

Source hierarchy: navigation/movement quiet; swap compact; match/chain brighter and pitch-escalating; Glitch impact/KO stronger; Overdrive combines impact, signature phrase and new musical parts. Flux emits sparse threshold/full confirmations. Danger/Critical and KO use same-match snapshot edges. Pulse audio follows the Pulse notification; the generic ability handler excludes it to prevent duplication. Teammate rescue feedback remains intact. No audio event selects a target, changes a game rule or controls authoritative timing.

## Verification commands

- `npm test` — simulation/protocol/UI data/audio regressions.
- `PANEL99_WEB_URL=http://127.0.0.1:3060 npm run audio:compare` — A/B output comparison against committed legacy source (requires Git history containing `9611957`).
- `npm run audio:compose` — deterministic shared score generation.
- `PANEL99_WEB_URL=http://127.0.0.1:3060 npm run audio:render` — two complete loops of each of four tracks in Chromium OfflineAudioContext renders through the real graph, all five slider points, independent SFX mute and extreme simultaneous peaks. Uses bounded chunk scheduling; no substitute gain-only calculation. [OfflineAudioContext documentation](https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext).
- `godot --headless --path godot --script res://tests/audio_forms_smoke.gd` — two complete native PCM forms per score, including adaptive escalation, silence gaps and sample seams.
- `npm run godot:import` and `npm run smoke:godot-audio` — native parsing, continuous PCM clock, authored silence bounds, same-track/context continuity and independent SFX.
- `npm run smoke:godot-mix` — actual audio-device post-limiter capture (before the Master fader; the harness applies its measured bus gain) during pressure/Overdrive and overlapping SFX, checking one primary player and underruns.
- `godot --path godot --script res://tests/audio_volume_smoke.gd` — native output measurements at 0/25/50/75/100% for each category, settling before measurement.
- `godot --path godot --script res://tests/controller_navigation_smoke.gd` — synthetic controller Settings/focus/three-slider navigation.
- `PANEL99_WEB_URL=http://127.0.0.1:3060 npm run smoke:web` — actual browser UI, match flow/all modes/99 CPUs, Settings, six viewports, zoom/fullscreen and synthetic gamepad.
- `PANEL99_WEB_URL=http://127.0.0.1:3060 electron scripts/audio-settings-smoke.cjs` and `godot --path godot --script res://tests/audio_settings_smoke.gd` — real persisted migration, saved zeros and mute retention, using isolated QA preferences.
- `npm run smoke:phase1` — real native/browser ability/gameplay protocol checks.

Full WAV review exports and numeric browser report are generated locally under ignored `.audio-review/`. They are review artifacts; runtime music remains synthesized. Measured final results are recorded below after validation.

## Limits

No human listening approval is claimed. Output capture/peak/RMS/LUFS checks prove signal behavior, not better taste or musical memorability. No physical-controller, physical speaker/headphone parity or Firefox listening certification is claimed. The 30-second native runtime capture is not a new 15-minute soak. Prior long-soak results predate this rewritten score. Four developed scores and result cues are not a complete album. Extended interactive sessions, multiple-loop listening fatigue and perceptual loop seams remain review work.

## Measured results (2026-10-07)

Baseline automated suite: **99/99 passed**. Final automated suite: **104/104 passed**, zero skipped. Runtime results are also recorded in PROJECT_STATUS.md.

| Two-loop web render at new defaults | Peak amplitude | RMS | Integrated loudness |
|---|---:|---:|---:|
| Circuit Animal | .619 | .0814 | −20.3 LUFS |
| Vector Teeth | .600 | .0856 | −19.8 LUFS |
| Pocket Dimension | .665 | .0713 | −21.3 LUFS |
| Black Current | .699 | .0869 | −19.7 LUFS |

The four exports cover **512 bars / about 16 minutes** total, including controlled pressure and Overdrive entry. FFmpeg ebur128 true peaks are −4.4 to −3.1dBFS. All fifteen web volume points passed. An intentionally excessive overlap test (ten effect families, twelve bursts, all controls 100%) peaked at .960 with RMS .324; oversampled filtering can exceed the safety curve's nominal .94 value, while remaining below clipping. This extreme case is a peak-protection test, not the desired sustained gameplay mix.

A 24-second-per-track A/B render of previous commit `9611957` versus new defaults, excluding initial settling, measured old RMS .0068–.0082 versus new .0722–.0879: **+20.6 to +21.4dB RMS**. Different rewritten music and changed defaults are included; this is a total-output comparison, not a loudness-matched musical-quality test.

Native volume sweeps passed 0/25/50/75/100% for Master/Music/SFX. Category zero residual is below .000002 (−114dBFS); Master zero is below .000001. Full SFX peaks remain below .892. Capture occurs after limiter but before Master volume, so the harness explicitly applies the configured Master fader gain to reported samples. This distinction matters: capturing a Godot bus effect alone does not measure that bus's subsequent fader attenuation.

A loaded runtime pass exposed underruns while synthesizing new SFX on the main thread. The correction builds **69 reusable native PCM effects** (511,200 bytes) in `audio-sfx.bin` with an index, using the same web synthesis kernels. Native startup loads the cache; gameplay schedules sources rather than computing their waveforms. Regenerate with `npm run audio:compose`. Include `.bin` and `.json` assets in any future Godot export configuration. No native export was produced in this checkpoint.

### Playable review excerpts

These 32-second opening excerpts and one Overdrive excerpt are actual Chromium renders, encoded to Ogg Vorbis for review. They are not replacement runtime sources or listening approval:

- [Circuit Animal — opening](audio-preview/neon.ogg)
- [Circuit Animal — Critical/Overdrive arrangement](audio-preview/neon-overdrive.ogg)
- [Vector Teeth](audio-preview/midnight.ogg)
- [Pocket Dimension](audio-preview/coast.ogg)
- [Black Current](audio-preview/chrome.ogg)

Full two-loop WAVs remain available locally under `.audio-review/`; regeneration writes the numeric report alongside them. Human review should compare different sections and complete loops, not only these openings.

Final native 30-second capture after the SFX-cache fix: **peak .69845, RMS .08249, zero underruns, one start/player** at default mix, with pressure/Overdrive and nine simultaneous effect families. This is comparable in signal level to the web default renders; listening parity still requires physical output review.

Native full-form rendering also passed **two complete loops of all four scores** (about sixteen minutes of offline PCM material). Raw pre-bus music peaks .691–.794, RMS .0807–.0982, longest authored rest .203–.268 seconds, maximum adjacent-sample jump .260–.295. This is offline synthesis verification, not sixteen minutes of real-time native playback or human listening.

Implementation checkpoint: `fde5f22` (`feat(audio): rewrite soundtrack and unify web/native gain staging`). Documentation and review audio are delivered in the following checkpoint on `feature/audio-music-overhaul`. No automatic merge.
