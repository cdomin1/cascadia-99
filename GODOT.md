# Native Godot client

Godot and web are first-class VEXELON implementations. Open `godot/project.godot` with Godot 4; run `npm start` for competitive CPU/multiplayer rooms. The client connects by WebSocket and receives authoritative snapshots, Flux configuration and synchronized start deadlines. It does not independently determine competitive outcomes.

Tutorial and Free Practice source builds automatically launch `training-server.mjs` on loopback with an ephemeral port. This reuses the same JavaScript Board/ability rules and works without Internet; Node.js 22+ must be installed. Exported standalone offline packaging remains a separate delivery limitation.

Rendering uses normalized shared geometry, a 360×720 coordinate surface and anti-aliased procedural lines. This reference coordinate system is not an NES restriction. UI uses readable native fonts and original shared monoline display lettering. Preserve selector priority, semantic color/shape identity and bounded effects.

Controller input uses standard Godot actions/mapping, dominant-axis arbitration, a dead zone and time-based repeat. Menu focus, volume sliders, six selectable room-code digits, Tutorial/Practice and right-stick targeting support controller input. Generic position prompts avoid assuming one controller's printed labels. Synthetic checks do not establish physical hardware compatibility. Rumble is not implemented.

MusicManager is persistent and sample-clock driven, with one primary generator and independent Music/SFX buses. Existing original arrangements remain prototypes, not a finished album. See `docs/OST_STATUS.md` and `BATTLE-INTRO-AUDIO.md`.

Canonical art direction and parity requirements live in `docs/NEO_VECTOR_STYLE_GUIDE.md`. Historical pixel-art guides describe earlier releases and do not override this direction.
