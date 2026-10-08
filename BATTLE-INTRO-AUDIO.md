# Battle intro and native audio

Godot remains a client of the Node multiplayer server. `match-start.mjs` defines a ready barrier, a one-second presentation lead and exactly 3000ms from countdown start to GO. Clients acknowledge a populated board. Server-generated match IDs and monotonic epoch deadlines appear in start/schedule/state/resume messages. All board ticks, CPU actions, attacks and ability/input intents remain blocked until that deadline. Required seats still follow existing room rules. Legacy protocol clients retain a three-second server countdown; updated web and native clients acknowledge readiness.

Unready loading cancels after ten seconds. Explicit departure cancels pre-GO starts; a transport disconnect retains the existing resumable session/deadline. Rejoining during countdown shows the remaining phase, while active reconnection skips the intro. The native network clock uses midpoint RTT estimates and a monotonic local clock; no local timer changes the server deadline. Asymmetric Internet latency and display frame timing limit physical simultaneity; logical starts are shared. This is not an Internet-scale load test.

`battle_intro.gd` owns presentation only: menu confirmation/selected-item tint, 500ms diagonal pixel wipe, 250ms stepped board reveal, 250ms READY, 3/2/1 at one-second boundaries, then GO with pixel fragments and a short board-local impact. Reduced motion skips wipes/movement/shake; reduced flashing avoids flashes, and static countdown typography stays legible. Duplicate schedules do not restart the clock. A missed frame enters battle once without replaying expired animation.

## Current audio integration

All generated soundtrack compositions and music sequencers are retired. The persistent AudioManager owns capped gameplay/UI SFX and independent Music/SFX buses. A lightweight child supports developer-supplied licensed files, simple fades and category transitions. The shared manifest is empty; there is no fallback music, generator or music worker.

Countdown and GO remain independent SFX following authoritative presentation deadlines. Audio never gates simulation. Master/Music/SFX volumes and independent mute persist; missing tracks fail safely. Danger/Critical/abilities emit their existing SFX and do not restart file playback. See `docs/MUSIC_IMPORTS.md` and `docs/AUDIO_OVERHAUL.md` for current architecture and checks. Earlier procedural-audio audits are historical in Git.
