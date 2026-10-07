// Single balancing source. Native clients receive this object in the hello message.
export const FLUX = Object.freeze({
  max:100,
  combo:{3:2,4:4,5:7,6:10},
  chain:{2:8,3:14,4:22,5:30},
  activationCooldown:.3,
  chainGrace:.12,
  reconnectSeconds:15,
  pulse:{cost:35,rows:1},
  shift:{cost:60},
  surge:{cost:75,duration:8,attack:1.35,generation:1.2},
  overdrive:{cost:100,hold:3,duration:10,attack:1.5,generation:1.25,rise:1.15,chainGrace:.12}
});

export function clearFlux(count,chain,config=FLUX){
  return (config.combo[Math.min(6,count)]||0)+(chain>=2?config.chain[Math.min(5,chain)]||0:0);
}
