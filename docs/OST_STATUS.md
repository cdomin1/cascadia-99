# VEXELON soundtrack — authored overhaul

**An electronic soundtrack from an alternate future. 1982, BUT IMPOSSIBLE.**

## What actually exists

Four entirely rewritten original synthesized scores replace the previous four-chord/32-step prototypes. The stable saved IDs remain compatible; old compositions are no longer used at runtime.

| Saved ID | Composition | BPM | Full form | Character |
|---|---|---:|---:|---|
| neon | Circuit Animal | 124 | 123.87s | Syncopated mechanical electro-funk; reed hook, rubber bass, displaced kick |
| midnight | Vector Teeth | 148 | 103.78s | Angular metallic lead, clipped pluck bass, fast irregular sequencer accents |
| coast | Pocket Dimension | 112 | 137.14s | Playful digital bells, relaxed offbeat funk, bass-led replies |
| chrome | Black Current | 132 | 116.36s | Low sub-bass, terse wire lead, half-time snare and competitive pressure |

These are **authored review compositions**, not a listening-approved finished soundtrack album. No commercial recordings or borrowed melodies are used. No complete 12–18-track album exists.

The new original six-note signature is **D4–A4–F4–E4–C5–A4**, at sixteenth positions **0, 3, 6, 10, 14, 18**. It opens each title arrangement with space before bass/drums enter. GO, activation and result cues transform the same D-minor vocabulary; victory resolves upward, defeat contracts toward an unresolved E.

## Composition, not random notes

`scripts/compose-ost.mjs` contains explicit two-bar melodies, answers, displaced returns and ascending phrases. It deterministically compiles identical score data to `audio-score.mjs` and `godot/assets/audio-score.json`. `godot/assets/tracks.json` is only lightweight menu metadata. Rebuild with `npm run audio:compose` from the repository root.

Every score has 64 bars: **Boot/Hook → A/Core → B/Answer → A2/Displaced → C/Ascent → Break/Bass Speaks → Return/Full Circuit → Turnaround**. Phrase rotation, rhythmic displacement, octave returns, bass rests/passing pickups, harmonic stabs, selective tom fills and reduced break percussion provide development. Each track has a different authored drum/bass groove. This is not random pitch generation or the old loop with new oscillators.

Synthesis uses additive bass/reed/wire voices, FM-like metallic/bell attacks, filtered synthetic drums and short stabs. Both clients use deterministic 24kHz kernels; Godot PCM quantization and platform output processing differ.

## Adaptive arrangement

All parts share the composition's fixed tempo, root and bar clock. There are synchronized **score layers**, not exported audio stems:

- Base: hook, bass, drums and short harmonic stabs.
- Momentum / Surge: offbeat plucked counter-sequence.
- Danger: high metallic tension pulses and subdivision; authoritative Danger ensures the pressure layer is reached.
- Critical: displaced fragments, chromatic tension and extra hats; authoritative Critical reaches maximum pressure.
- Overdrive: octave bass responses, bell counter-melody and additional percussion. It changes orchestration, not merely volume.

The arrangement changes at bar boundaries. This can introduce up to one bar of musical response latency; activation SFX remain immediate. Native worker buffering also contributes bounded presentation latency. Neither affects simulation. Context/mute/pressure changes preserve playback phase. Track changes queue to a bar boundary. Explicit transport stop still stops playback. Browser autoplay requires a gesture.

Chain ×2–×6 tones ascend through D-minor/pentatonic-compatible notes. Flux threshold cues are edge-triggered at ability thresholds/full, not every meter increment. Incoming Glitch, Glitch impact/break, all abilities, Danger/Critical, KO and results have distinct compact synthetic cues. Reconnect's initial snapshot does not replay threshold/KO cues.

## Playback and evidence

See [AUDIO_OVERHAUL.md](AUDIO_OVERHAUL.md) for gain staging, defaults, migration, measured checks, review renders and limitations. The persistent native worker/generator and web lookahead transport are preserved. There are no prerecorded source assets to destructively remaster.

Human listening over multiple complete loops, subjective composition approval, physical speaker/headphone comparison, Firefox audio verification and extended interactive play remain necessary. Automated signal checks cannot certify that the music is memorable, enjoyable or perceptually seamless.
