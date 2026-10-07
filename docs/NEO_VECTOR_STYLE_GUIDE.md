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

Use locally bundled Kode Mono for UI, instructional text and custom-drawn gameplay events; regular 400, controls/labels 500, major headings/warnings/events 700. Typography tokens live in the shared specification, with matching web CSS variables. Preserve the official vector wordmark and studio logo as independent brand assets. Use readable sizes and restrained tracking; fallback fonts cover unsupported glyphs. Do not bake controller labels into art. Input is immediate, semantic and grid-based; animations follow. Analog movement needs a dead zone, dominant-axis arbitration and time-based repeat. All native screens must support controller navigation. Hardware claims require actual hardware tests.

## Audio

Fully synthesized, melody-driven original electronic music with bass hooks, rhythmic variation and composed sections; chiptune is a possible texture, not the identity. Preserve existing compositions. Track documents must distinguish existing prototype arrangements, finished compositions and planned cues. Persistent primary playback, independent buses and sample-clock scheduling must survive scene/pressure changes. Audio never controls match start.

## Accessibility and parity

Shake Off/Reduced/Normal/Maximum; Flashing Reduced/Full; Reduced Motion On/Off; Quality Minimal/Reduced/Full. Minimal retains essential board/target/warning/ability information. Reduce trails, instability, fragments and movement first. Controller vibration, if implemented, has Off/Reduced/Normal settings.

Implement equivalent meanings and timing in Godot and web, without requiring identical rendering technology. Compare both directly at each checkpoint. No claim of 99-human scalability from CPU seats, universal 60 FPS from one machine, or OST completion from infrastructure.

## UI simplification — canonical interaction rules

**LESS UI. MORE GAME. BLACK IS THE PLAYFIELD. LIGHT IS INFORMATION. THE BOARD IS THE HERO.** One canonical palette replaces all selectable themes/light mode and saved theme state. Shared semantic design tokens remain; accessibility and soundtrack choices are independent preferences.

Web title uses two zones: brand and Tutorial/Free Practice/Settings on the left, direct player name/mode/CPU/difficulty/rules and primary Play CPUs on the right. Create Room and Join are immediately available under Online. Persist valid settings; disclose only genuinely mode-specific extras. Do not add intermediate mode/configuration pages. Native menu navigation is unchanged by this homepage correction. No title showcase or permanent stats. Web chrome is 48–56px; audio, soundtrack, volume and controls live in Settings/Pause.

Gameplay uses a black interior, restrained outer boundary and no graph-paper background/per-cell boxes. Board geometry receives the recovered screen space. Use contextual incoming warnings, ability timers, chains and Danger/Critical. No zero-threat warning, room code, generic motivational text or permanent controls cheat sheet. Pause contains navigation/settings/reference; online simulation continues. Target strategies cycle through compact controls, T/right-stick press, without changing algorithms.

Tutorial is one goal at a time: early lessons hide Flux/opponents/targeting/stats; Glitch appears in lesson 5, Flux in 6, opponent/targeting in 7. An amber underline identifies the intended swap without obscuring the white selector. Next follows success. Controller users access lesson navigation through Pause. Practice keeps board/Flux/abilities; tools/settings are behind Pause and no lesson navigation appears.

2P emphasizes two readable boards; 4P/Teams preserve meaningful opponent/team identity. 99P uses subordinate but readable cool mini-boards: visible perimeter, stack activity and seat number; amber target/red attacker emphasis. Only eliminated boards nearly extinguish. The earlier “very dim” wording does not mean nearly invisible active players. Highlight actual 1:2 board geometry, never stretched grid tracks; selecting a target must not resize, reflow or scroll the field. On ultrawide, keep the active composition together and use black space around it. Web and Godot share this hierarchy, not identical widget code.

## Kode Mono assets and hierarchy

Official source: https://github.com/google/fonts/tree/main/ofl/kodemono (typeface upstream https://github.com/isaozler/kode-mono). The unmodified 400–700 variable TTF and SIL OFL 1.1 license are bundled at `fonts/kode-mono/` and identically at `godot/assets/fonts/kode-mono/`. Web `@font-face` and service-worker shell cache use the local asset. Godot's `typography.gd` provides cached 400/500/700 FontVariations and unsupported-glyph fallback; the shared UI theme and custom event/countdown drawing use it. The vector alphabet remains archived specification data, not the current gameplay text renderer.

Reference UI size 15 CSS px / native 24 units; line height 1.45 and tracking .02em on web, native containers provide line spacing without widening glyphs. Scale for layout/readability. General text is 400, labels/controls 500, major headings and events 700. Preserve existing brand assets independently.

## Opponent visibility and bounds correction

Shared `opponents` tokens define cool active geometry, active/target intensity, perimeter color and extinguished intensity. These are rendering parameters, not mandated relative-priority percentages. Web BR uses intrinsic grid rows, bounded 1:2 canvases and canvas-local target/attacker outlines; normal and selected wrappers have identical geometry. Active opponents retain identity and stack activity; eliminated boards omit tile/slab content and fade their perimeter/identifier. Incoming red takes highlight precedence over amber. Godot uses equivalent colors/intensity and actual board-rectangle perimeters.
