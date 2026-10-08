import {pulseTarget,usePulse} from './match-rules.mjs';

export function abilityStatus(player,room){
  const b=player.board,c=b.balance,ready=!b.dead&&b.abilityCooldown<=0;
  return {
    pulse:ready&&b.flux>=c.pulse.cost&&pulseTarget(player,room).board.incoming.some(a=>a.amount>0),
    shift:ready&&b.flux>=c.shift.cost&&b.canShift(),
    surge:ready&&b.flux>=c.surge.cost&&!b.activeAbility,
    overdrive:ready&&b.flux>=c.overdrive.cost&&b.maxFluxHeld+1e-8>=c.overdrive.hold&&!b.activeAbility
  };
}

export function useAbility(player,room,ability){
  if(!Object.hasOwn(player.board.balance,ability)||!Object.hasOwn(abilityStatus(player,room),ability)||!abilityStatus(player,room)[ability])return null;
  if(ability==='pulse')return usePulse(player,room);
  const b=player.board,c=b.balance;
  let target=player,cancelled=0;
  if(ability==='shift')b.shiftDown();
  else {b.activeAbility=ability;b.abilityRemaining=c[ability].duration;}
  b.flux=ability==='overdrive'?0:b.flux-c[ability].cost;
  b.maxFluxHeld=0;b.abilityCooldown=c.activationCooldown;
  return {target,cancelled,ability};
}

// CPUs use the same eligibility and transactions as humans; no bonus resources.
export function cpuAbility(player,room){
  const b=player.board,status=abilityStatus(player,room);
  if(status.pulse&&pulseTarget(player,room).board.incoming.some(a=>a.delay<2))return 'pulse';
  const top=b.grid.findIndex(row=>row.some(Boolean));
  if(status.shift&&top>=0&&top<4)return 'shift';
  if(status.overdrive)return 'overdrive';
  if(status.surge&&b.flux<b.balance.max&&(b.chain>1||top<6))return 'surge';
  return null;
}
