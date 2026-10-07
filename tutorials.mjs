import {FLUX} from './flux-config.mjs';
// Shared tutorial copy and asset IDs. Re-render native metadata when balance changes.
export const TUTORIALS=[
 {id:'duel',title:'2P Duel',group:'Modes',description:'Two boards. Send garbage to your opponent and keep your own stack below the ceiling. The last survivor wins.'},
 {id:'quad',title:'4P Free-for-all',group:'Modes',description:'Four independent players. Choose a rival to target; the last player alive wins.'},
 {id:'teams',title:'2v2 Teams',group:'Modes',description:'Two teams of two. Attack the opposing team. A surviving teammate keeps your team in the game; Pulse can rescue a teammate with pending garbage.'},
 {id:'battle',title:'99-player Battle Royale',group:'Modes',description:'Outlast the field in rooms of up to 99 players. This recording uses 98 CPUs and shows ten boards from the full room.'},
 {id:'chains',title:'Swaps, matches & chains',group:'Mechanics',description:'Swap neighboring panels to match three or more. Falling panels that match again build a chain. Bigger combos and chains send stronger attacks.'},
 {id:'garbage',title:'Break industrial garbage',group:'Mechanics',description:'Clear next to a slab to fracture it. Garbage releases active panels from the bottom upward. Your attacks cancel pending garbage before sending any excess.'},
 {id:'pulse',title:'Pulse — defend & rescue',group:'Flux',description:`Spend ${FLUX.pulse.cost} Flux to remove one row-equivalent of pending garbage. If your queue is empty in teams, Pulse protects a living teammate instead. The example starts with full Flux.`},
 {id:'shift',title:'Shift — make room',group:'Flux',description:`Spend ${FLUX.shift.cost} Flux on a stable board to remove its bottom row and lower the stack. Shift earns no score, Flux, attacks, or chain. The example starts with full Flux.`},
 {id:'surge',title:'Surge — power up',group:'Flux',description:`Spend ${FLUX.surge.cost} Flux for ${FLUX.surge.duration} seconds of stronger attacks and Flux generation. Surge and Overdrive cannot overlap. The example starts with full Flux.`},
 {id:'overdrive',title:'Overdrive — full charge',group:'Flux',description:`Hold maximum Flux for ${FLUX.overdrive.hold} seconds, then spend it all for ${FLUX.overdrive.duration} seconds of stronger attacks, Flux generation, and faster natural rise. The example demonstrates the full-charge hold before activation.`}
];
