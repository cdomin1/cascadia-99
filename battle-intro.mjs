import {NEO} from './neo-vector.mjs';
import {vectorText} from './vector-geometry.mjs';
export class BattleIntroTimeline {
 constructor(){this.offset=null;this.bestRtt=Infinity;this.matchId='';this.startAt=null;this.countdownAt=null;this.resumed=false;this.go=false;this.lastLabel='';}
 observe(message,now=performance.now()){
  if(message.type==='clock'&&Number.isFinite(message.sentAt)&&Number.isFinite(message.serverNow)){
   const rtt=now-message.sentAt;if(rtt>=0&&rtt<=this.bestRtt){this.bestRtt=rtt;this.offset=message.serverNow-(message.sentAt+now)/2;}
  }else if(this.offset===null&&Number.isFinite(message.serverNow))this.offset=message.serverNow-now;
 }
 begin(message){if(this.matchId===message.matchId)return;this.matchId=message.matchId;this.startAt=null;this.countdownAt=null;this.resumed=!!message.resumed;this.go=false;this.lastLabel='';this.schedule(message);}
 schedule(message){if(message.matchId===this.matchId&&this.startAt===null&&Number.isFinite(message.startAt)){this.startAt=message.startAt;this.countdownAt=message.countdownAt;}}
 time(now){return now+(this.offset||0);}
 canPlay(now){return this.startAt!==null&&this.time(now)>=this.startAt;}
 label(now){if(this.startAt===null)return 'WAITING';const time=this.time(now);if(time<this.countdownAt)return time>=this.countdownAt-250?'READY?':'';if(time<this.startAt)return String(Math.ceil((this.startAt-time)/1000));if(this.resumed||time>=this.startAt+640)return '';return 'GO!';}
 draw(ctx,now,{reducedMotion=false,onCue=()=>{}}={}){
  const label=this.label(now),time=this.time(now);
  if(this.canPlay(now)&&!this.go){this.go=true;if(!this.resumed)onCue('go',0);}
  if(label!==this.lastLabel){this.lastLabel=label;if(['3','2','1'].includes(label))onCue('countdown',4-Number(label));}
  ctx.save();
  if(!reducedMotion&&!this.resumed&&this.countdownAt!==null){const age=time-(this.countdownAt-1000);
   if(age<500){ctx.fillStyle=NEO.colors.background;ctx.fillRect(0,0,360,720);}
   else if(age<750){const t=(age-500)/250;ctx.strokeStyle=NEO.colors.flux;ctx.lineWidth=2;ctx.strokeRect(2,2,356,716);ctx.fillStyle=NEO.colors.background;ctx.fillRect(3,3+714*t,354,714*(1-t));}
  }
  if(label){const unit=['3','2','1'].includes(label)?9:6,w=(label.length*6-1)*unit,x=(360-w)/2,y=(720-7*unit)/2;ctx.fillStyle=NEO.colors.background;ctx.fillRect(x-9,y-9,w+18,7*unit+18);vectorText(ctx,label,x,y,unit,label==='GO!'?NEO.colors.flux:NEO.colors.neutral);}
  ctx.restore();
 }
}
