import {AttackTrajectories,trajectoryPixels,TARGET_VFX} from './targeting-vfx.mjs';
export class BattleTargeting {
 constructor(){
  this.timeline=new AttackTrajectories();this.target=null;this.enabled=false;this.highlights=new Map();
  this.canvas=document.createElement('canvas');this.canvas.className='attack-trajectories';this.canvas.setAttribute('aria-hidden','true');document.body.append(this.canvas);
  this.ctx=this.canvas.getContext('2d');
 }
 begin(message,id){this.enabled=message.mode==='battle';this.timeline.begin(message.matchId,id);this.highlights.clear();this.target=null;}
 confirm(message,now=performance.now()){
  if(!this.enabled||!this.timeline.accept(message,now))return false;
  const incoming=message.type==='attack',other=incoming?message.sourceId:message.targetId;
  const channel=incoming?'incoming':'outgoing';
  this.highlights.set(`${other}:${channel}`,{id:other,until:now+TARGET_VFX.durationMs+TARGET_VFX.impactMs,channel});
  if(!incoming)this.target=other;
  return true;
 }
 state(message){if(this.enabled)this.target=message.self.attackTarget||null;}
 stop(){this.enabled=false;this.timeline.events=[];this.highlights.clear();this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);}
 draw(now,{reducedMotion=false,flashing='full'}={}){
  const w=innerWidth,h=innerHeight;if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  const ctx=this.ctx;ctx.clearRect(0,0,w,h);if(!this.enabled)return;ctx.imageSmoothingEnabled=false;
  const rival=id=>document.querySelector(`.rival[data-id="${id}"]`);
  for(const [key,mark]of this.highlights){const el=rival(mark.id);if(now>=mark.until){el?.classList.remove(mark.channel==='incoming'?'attack-source':'attack-hit');this.highlights.delete(key);}else el?.classList.add(mark.channel==='incoming'?'attack-source':'attack-hit');}
  for(const event of this.timeline.active(now)){
   const source=event.sourceId===this.timeline.localId?document.getElementById('board'):rival(event.sourceId)?.firstChild;
   const dest=event.targetId===this.timeline.localId?document.getElementById('board'):rival(event.targetId)?.firstChild;
   if(!source||!dest)continue;
   const a=source.getBoundingClientRect(),b=dest.getBoundingClientRect();
   const anchor=(rect,other)=>({x:rect.left+(other.left<rect.left?0:rect.width),y:rect.top+rect.height*.3});
   const from=anchor(a,b),to=anchor(b,a),sample=trajectoryPixels(event,now,from,to,{reducedMotion,flashing});ctx.fillStyle=sample.color;
   ctx.strokeStyle=sample.color;ctx.lineWidth=1.5;
   for(let n=1;n<sample.rects.length;n++){const a=sample.rects[n-1],b=sample.rects[n];ctx.globalAlpha=reducedMotion?.55:1-n/(sample.rects.length+1);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}
   ctx.globalAlpha=1;
   if(sample.rects.length){const [x,y,size]=sample.rects[0];ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size,y);ctx.lineTo(x,y+size);ctx.lineTo(x-size,y);ctx.closePath();ctx.stroke();}
   if(sample.impact){const x=Math.round(b.left),y=Math.round(b.top),bw=Math.round(b.width),bh=Math.round(b.height);ctx.fillRect(x,y,bw,3);ctx.fillRect(x,y+bh-3,bw,3);ctx.fillRect(x,y,3,bh);ctx.fillRect(x+bw-3,y,3,bh);}
  }
 }
}
