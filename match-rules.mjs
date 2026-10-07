export const MODES=Object.freeze({
  battle:{label:'Battle Royale',capacity:99,required:2},
  duel:{label:'2P VS',capacity:2,required:2},
  quad:{label:'4P VS',capacity:4,required:4},
  teams:{label:'2v2 Teams',capacity:4,required:4}
});
export const TEAMS=Object.freeze({a:'Cyan',b:'Coral'});
export const RULESETS=Object.freeze({classic:{label:'Classic',speed:1},rush:{label:'Rush',speed:1.6}});
export const modeRules=room=>MODES[room.mode]||MODES.battle;
export function assignTeam(room,player){
  if(room.mode!=='teams'){player.team=null;return;}
  const members=[...room.players.values()].filter(p=>p!==player);
  player.team=members.filter(p=>p.team==='a').length<=members.filter(p=>p.team==='b').length?'a':'b';
}
export function opponents(player,room){return [...room.players.values()].filter(p=>p!==player&&!p.board.dead&&(room.mode!=='teams'||p.team!==player.team));}
export function startError(room){
  const {required,capacity,label}=modeRules(room);
  if(room.players.size<required||room.players.size>capacity)return `${label} needs ${required===capacity?'exactly ':''}${required}${required!==capacity?'–'+capacity:''} players. Add CPUs or invite friends.`;
  if(room.mode==='teams'&&Object.keys(TEAMS).some(team=>[...room.players.values()].filter(p=>p.team===team).length!==2))return 'Teams need two players on each side.';
  return null;
}
export function matchOutcome(room){
  const alive=[...room.players.values()].filter(p=>!p.board.dead);
  if(room.mode==='teams'){
    const sides=new Set(alive.map(p=>p.team));
    return {finished:sides.size<=1,alive,winnerTeam:alive[0]?.team||null,winner:alive.length?`${TEAMS[alive[0].team]} team`:'No survivor',winnerIds:alive.length?[...room.players.values()].filter(p=>p.team===alive[0].team).map(p=>p.id):[]};
  }
  return {finished:alive.length<=1,alive,winner:alive[0]?.name||'No survivor',winnerIds:alive.length?[alive[0].id]:[],winnerTeam:null};
}
export function pulseTarget(player,room){
  if(player.board.incoming.some(a=>a.amount>0)||room.mode!=='teams')return player;
  return [...room.players.values()].filter(p=>p!==player&&p.team===player.team&&!p.board.dead).sort((a,b)=>b.board.incoming.reduce((n,a)=>n+a.amount,0)-a.board.incoming.reduce((n,a)=>n+a.amount,0))[0]||player;
}
export function usePulse(player,room){
  const b=player.board,target=pulseTarget(player,room),amount=6*b.balance.pulse.rows;
  if(b.dead||b.abilityCooldown>0||b.flux<b.balance.pulse.cost)return null;
  const cancelled=amount-target.board.cancel(amount);if(!cancelled)return null;
  b.flux-=b.balance.pulse.cost;b.maxFluxHeld=0;b.abilityCooldown=b.balance.activationCooldown;
  return {target,cancelled,ability:'pulse'};
}
