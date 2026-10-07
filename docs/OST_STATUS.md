# VEXELON original synthesizer soundtrack

Direction: **an electronic soundtrack from an alternate future**. Melody, bass hooks, electronic groove and composed variation take priority over endless arpeggios. No existing commercial melodies or recordings are used.

## Actual assets and status

There are **four existing original synthesized prototype arrangements**, not a finished album: Neon Afterglow, Midnight Circuit, Cassette Coast and Chrome Runner. Web source is `music.mjs`; native composition data is `godot/assets/tracks.json`. Their original notes/chords are preserved. Each currently has a repeating four-chord form and 32-step melodic pattern; longer A/B/breakdown arrangements and human composition/listening review remain necessary. There are no source soundtrack recordings requiring loop trimming.

A short **prototype identity motif** uses MIDI notes C4–G4–E-flat4–B-flat4–F4 (60,67,63,70,65), with an uneven launch rhythm. Native GO presents this synthesized phrase; countdown uses ascending fragments C4/E-flat4/G4. This is a prototype cue, not a finished main theme. Future title/bass/victory transformations should be composed and reviewed deliberately.

## Playback architecture

Native: existing persistent MusicManager, one primary sample-clock generator, worker rendering, bounded voices/caches, independent Music/SFX buses, bar-boundary track/pressure changes, phase-preserving scene/mute behavior and independent activation cues.

Web: existing lookahead WebAudio scheduler retained; active track changes queue to a bar boundary, mute automates gain without resetting phase, scene/pressure changes adjust arrangement/gain, and music and SFX have independent volume controls. Explicit stopping the homepage preview remains an intentional transport stop. Browser autoplay still requires a gesture. No timing or gameplay depends on audio.

Current pressure/Overdrive layers are procedural synchronized voices, not exported multitrack stem files. Future stem capability can extend the existing bar/sample clocks. Critical/endgame currently share the pressure continuum; there is no dedicated finished Final 10/Final Clash cue.

## Planned album (not assets)

System Boot; Vexelon; Vector Ready; 3•2•1; Neon Circuit; Zero Latency; Phosphor Drive; Glass Vector; Signal Runner; Gridlock; Glitch State; 99; Final 10; Final Clash; Overdrive; Vector Clear; Signal Lost; Afterimage.

These names are planning labels only. Quality and original composition approval matter more than the number. No “OST complete” claim is appropriate.

## Verification limits

Prior 10-minute native title and 15-minute native audio-device soaks are recorded in BATTLE-INTRO-AUDIO.md. New milestone changes require regression playback checks. Automated PCM/transport checks do not prove musical quality or absence of perceptual seams; human listening and interactive extended sessions remain required.
