// Monotonic server time is supplied by the caller. No client can choose a deadline.
export const START_TIMING=Object.freeze({countdownMs:3000,introMs:1000,readyTimeoutMs:10000});
export function prepareStart(players,now,id){
  const required=new Set(players.filter(p=>!p.bot&&p.startProtocol===1).map(p=>p.id));
  const start={id,required,ready:new Set(),expiresAt:now+START_TIMING.readyTimeoutMs,countdownAt:null,startAt:null};
  if(!required.size)scheduleStart(start,now,0);
  return start;
}
export function scheduleStart(start,now,lead=START_TIMING.introMs){
  if(start.startAt!==null)return false;
  start.countdownAt=now+lead;start.startAt=start.countdownAt+START_TIMING.countdownMs;return true;
}
export function readyStart(start,id,now){
  if(!start.required.has(id)||now>=start.expiresAt||start.startAt!==null)return false;
  start.ready.add(id);
  if([...start.required].every(id=>start.ready.has(id)))return scheduleStart(start,now);
  return false;
}
export function startStatus(start,now){
  if(start.startAt===null)return {phase:'preparing',countdown:3};
  if(now<start.countdownAt)return {phase:'intro',countdown:3};
  if(now<start.startAt)return {phase:'countdown',countdown:Math.ceil((start.startAt-now)/1000)};
  return {phase:'active',countdown:0};
}
export function startFields(start,now){return {matchId:start.id,serverNow:now,countdownAt:start.countdownAt,startAt:start.startAt,...startStatus(start,now)};}
