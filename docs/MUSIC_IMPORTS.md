# Importing the curated soundtrack

No music files are installed. Both clients work with an empty library, without music sources, oscillators, sequencers, workers or fallback audio. Settings shows **NO TRACKS INSTALLED**; Master/Music/SFX levels remain configurable and saved. Gameplay and UI SFX remain independent.

## Add licensed recordings

1. Obtain the developer-approved recording and permission to distribute it with the game. Keep license/attribution records alongside your project documentation.
2. Put the file under `assets/audio/music/menu/`, `gameplay/`, `results/` or `stems/`. Supported common formats are OGG Vorbis, MP3 and WAV. Prefer lowercase filenames with hyphens. No runtime CDN is used.
3. Add an entry to `assets/audio/music/manifest.json`, keeping `version: 1` and the `tracks` array. Fields:

| Field | Meaning |
| --- | --- |
| `id` | Unique stable ASCII letters/digits/hyphens/underscores |
| `title` | Nonempty display name |
| `path` | Relative file path, e.g. `gameplay/developer-track.ogg` |
| `category` | `menu`, `gameplay`, `results` or `stems` |
| `loop` | Boolean; defaults to false |
| `loopStart` | Optional seconds, default 0 |
| `loopEnd` | Optional seconds, default recording duration; greater than start |
| `artist`, `credit` | Optional artist and licensing/credit information |

The registry currently contains exactly `{"version":1,"tracks":[]}`. Do not add invented tracks or missing-file placeholders. Paths cannot be remote URLs, absolute paths or parent-directory traversals. Credits are retained in the registry; add any license-required visible attribution before release.

4. Run `npm run music:sync`. It validates every entry and source before updating the native manifest and copying files to `godot/assets/audio/music/`. It does not compose or generate audio. Unregistered files are never played; remove recordings you retire from both directories deliberately.
5. Run `npm run godot:import` and restart the Node server, whose static-file allowlist is built at startup. Include the music directory and JSON manifest in future Godot export filters. The desktop package already includes the web music directory.
6. Verify the recording, credits, all volume levels, mute, loop seams and scene transitions in both clients. Review the actual mix on speakers/headphones. A manifest entry does not prove licensing or audio quality.

## Playback behavior

The first available track in the current category is used unless a track from that category is selected in Settings. Title/setup/countdown use `menu`; active matches use `gameplay`; victory/defeat use `results`. Categories with no installed recordings remain silent. `stems` is reserved organizational space and does not enable adaptive layering.

Web validates file availability before showing selections, then fetches/decodes recordings on demand after an intentional user gesture. Browser autoplay restrictions remain respected. It keeps at most two decoded recordings cached; long WAVs consume substantial memory. Godot imports the mirrored recordings and routes file players through Music → Master. Missing entries are filtered, missing files fail safely, and neither client generates fallback music. Invalid audio files must be caught during the import/review step.

Both players fade in/out and crossfade track changes. Repeated context requests for the same track preserve playback; Danger, Critical, Flux and abilities do not restart music. Music mute preserves the current playback position. Track preference and independent mute/volume preferences persist; obsolete generated-track IDs are discarded without changing intentional silence.

Web uses native AudioBuffer looping with optional sample-region bounds. Godot WAV region looping uses the audio stream's frame bounds; Vorbis/MP3 use native full-file looping and loop offset. A custom end point for compressed native streams is checked once per rendered frame and is not sample-accurate. For precise cross-platform seams, supply externally trimmed loop-ready recordings or WAV regions; audition encoding boundaries and tails. No seam or perceptual parity claim can be made before actual licensed recordings are supplied.
