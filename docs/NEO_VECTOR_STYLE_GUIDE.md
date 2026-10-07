# VEXELON — Neo-Vector Arcade

**1982, BUT IMPOSSIBLE.** Imagine an impossibly advanced vector arcade machine. Geometry, light, black space and immediate controls define the experience. This supersedes the historical NES/pixel-art final direction; preserve working gameplay and useful historical assets.

## Shared specification

`neo-vector.mjs` and `godot/assets/neo-vector.json` contain identical platform-neutral tokens. Board reference coordinates remain 360×720, six columns and twelve rows; reference resolution is a coordinate system, not a pixel-art restriction. Scale line geometry responsively. Use crisp anti-aliased vector strokes where appropriate, restrained additive accents and no diffuse clouds or persistent distortion.

Near-black background; crimson Target Ring (circle and cardinal ticks), cobalt Prism (diamond with facet), lime Heavy Hexagon (reinforced hexagon), amber Dual Chevron (two upward chevrons). Shape must identify tiles without color. Flux is cyan; targets amber; incoming and Critical crimson. Cyan Reversal remains reserved, with no Phase 2 rules.

Line hierarchy: dim 1, normal 2, active 3 reference units. Selector uses a dark 6-unit separation stroke and bright 2-unit inner stroke, exactly two horizontal cells, transparent interior and immediate grid movement. Selector always renders last. Reduced motion/flash retains a static high-contrast outline.

Inactive geometry is dim; playable tiles are bright; events brighten briefly. Large dark interiors and negative space protect readability. Opponent boards use lower detail and intensity unless targeted, attacking or allied. Bound fragments, trails and trajectories; the local board takes priority.

## Glitch and effects

Player-facing terminology: Glitch Blocks, Glitch Attack, Glitch Break, Glitch Counter, **GLITCH INCOMING!** Internal wire/storage identifiers remain compatible. Slabs remain contiguous connected footprints. Broken segments, displaced seams, crimson hazards and cyan corruption distinguish them from stable tiles. Damage separates geometry; clean tiles resolve bottom-to-top through existing authoritative conversion.

Normal clears contract/extinguish geometry without shake. Combos add modest local fragments. Chains escalate rings/traces; x5+ and Overdrive may cause brief **Vector Instability**: displaced outline copies which snap back. Do not displace simulation or input. Keep fragments behind tiles or outside occupied cells. Phosphor trails are short (96ms baseline), bounded and sharp rather than blurred.

Flux is a segmented capacitor. Pulse: defensive cyan ring. Shift: downward re-index scan. Surge: circulating perimeter. Overdrive: converging energy, radial launch, bounded instability and energized border. Timers always reflect authoritative state.

## Interface and input

Board, selector, Flux, incoming state and target are primary. Secondary diagnostics and verbose controls belong in contextual panels. Use short child-readable instructions: Move. Swap. Match 3. Watch the top. All focus states must remain visible without hover.

Use original geometric monoline display lettering; long instructions use readable sans-serif, at least 16px where layout permits. Do not bake controller labels into art. Input is immediate, semantic and grid-based; animations follow. Analog movement needs a dead zone, dominant-axis arbitration and time-based repeat. All native screens must support controller navigation. Hardware claims require actual hardware tests.

## Audio

Fully synthesized, melody-driven original electronic music with bass hooks, rhythmic variation and composed sections; chiptune is a possible texture, not the identity. Preserve existing compositions. Track documents must distinguish existing prototype arrangements, finished compositions and planned cues. Persistent primary playback, independent buses and sample-clock scheduling must survive scene/pressure changes. Audio never controls match start.

## Accessibility and parity

Shake Off/Reduced/Normal/Maximum; Flashing Reduced/Full; Reduced Motion On/Off; Quality Minimal/Reduced/Full. Minimal retains essential board/target/warning/ability information. Reduce trails, instability, fragments and movement first. Controller vibration, if implemented, has Off/Reduced/Normal settings.

Implement equivalent meanings and timing in Godot and web, without requiring identical rendering technology. Compare both directly at each checkpoint. No claim of 99-human scalability from CPU seats, universal 60 FPS from one machine, or OST completion from infrastructure.

## UI simplification — canonical interaction rules

**LESS UI. MORE GAME. BLACK IS THE PLAYFIELD. LIGHT IS INFORMATION. THE BOARD IS THE HERO.** One canonical palette replaces all selectable themes/light mode and saved theme state. Shared semantic design tokens remain; accessibility and soundtrack choices are independent preferences.

Title exposes Play (primary), Free Practice/Tutorial (secondary), Settings (tertiary). Play progressively reveals the implemented mode, then relevant CPU/rules options or online name/room setup. No title showcase, permanent stats or configuration dashboard. Web chrome is 48–56px; audio, soundtrack, volume and controls live in Settings/Pause.

Gameplay uses a black interior, restrained outer boundary and no graph-paper background/per-cell boxes. Board geometry receives the recovered screen space. Use contextual incoming warnings, ability timers, chains and Danger/Critical. No zero-threat warning, room code, generic motivational text or permanent controls cheat sheet. Pause contains navigation/settings/reference; online simulation continues. Target strategies cycle through compact controls, T/right-stick press, without changing algorithms.

Tutorial is one goal at a time: early lessons hide Flux/opponents/targeting/stats; Glitch appears in lesson 5, Flux in 6, opponent/targeting in 7. An amber underline identifies the intended swap without obscuring the white selector. Next follows success. Controller users access lesson navigation through Pause. Practice keeps board/Flux/abilities; tools/settings are behind Pause and no lesson navigation appears.

2P emphasizes two readable boards; 4P/Teams preserve meaningful opponent/team identity. 99P uses very dim unboxed distant boards with amber target/red attacker emphasis. On ultrawide, keep the active composition together and use black space around it. Web and Godot share this hierarchy, not identical widget code.
