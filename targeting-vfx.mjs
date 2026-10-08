// Local presentation only. Server-confirmed IDs are the sole authority for endpoints.
export const TARGET_VFX=Object.freeze({maxActive:8,durationMs:576,impactMs:96,stepMs:32,pixel:3,colors:{outgoing:'#FFB81C',incoming:'#FF4D5E',reversal:'#38FFFF'}});
export class AttackTrajectories {
 constructor(){this.matchId=null;this.localId=null;this.lastSequence=0;this.events=[];}
 begin(matchId,localId){if(this.matchId!==matchId){this.events=[];this.lastSequence=0;}this.matchId=matchId;this.localId=localId;}
 accept(message,now){
  if(!['sent','attack'].includes(message.type)||message.matchId!==this.matchId||!Number.isSafeInteger(message.attackSequence)||message.attackSequence<=this.lastSequence||message.eventId!==`${message.matchId}:${message.attackSequence}`)return false;
  if(typeof message.sourceId!=='string'||!message.sourceId||typeof message.targetId!=='string'||!message.targetId||message.sourceId===message.targetId||!Number.isFinite(message.amount)||message.amount<=0)return false;
  const channel=message.type==='sent'&&message.sourceId===this.localId?'outgoing':message.type==='attack'&&message.targetId===this.localId?'incoming':null;
  if(!channel)return false;
  this.lastSequence=message.attackSequence;
  this.events.push({sourceId:message.sourceId,targetId:message.targetId,amount:message.amount,channel,start:now,eventId:message.eventId});
  this.events=this.events.slice(-TARGET_VFX.maxActive);return true;
 }
 active(now){this.events=this.events.filter(e=>now-e.start<TARGET_VFX.durationMs+TARGET_VFX.impactMs);return this.events;}
}
export function trajectoryPixels(event,now,from,to,{reducedMotion=false,flashing='full'}={}){
 const {pixel,durationMs,impactMs,stepMs,colors}=TARGET_VFX,age=now-event.start;
 if(age<0||age>=durationMs+impactMs)return {rects:[],impact:false,color:colors[event.channel]};
 const strength=Math.min(4,Math.max(1,Math.ceil(event.amount/6))),size=pixel*(strength>=3?2:1),progress=Math.min(1,Math.floor(age/stepMs)*stepMs/durationMs);
 const rects=[],count=reducedMotion?9:3+strength;
 for(let n=0;n<count;n++){
  const t=reducedMotion?n/(count-1):progress-n*.045;
  if(t<0||t>1||(!reducedMotion&&age>=durationMs))continue;
  rects.push([Math.round((from.x+(to.x-from.x)*t)/pixel)*pixel,Math.round((from.y+(to.y-from.y)*t)/pixel)*pixel,size,size]);
 }
 return {rects,impact:age>=durationMs,color:flashing==='full'&&age>=durationMs&&Math.floor(age/stepMs)%2===0?'#FFFFFF':colors[event.channel]};
}
