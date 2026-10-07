// Presentation only: this clock never drives networking, input, or simulation.
export const SHAKE_LEVELS={off:0,reduced:.35,normal:1,maximum:1.7};
export class PresentationEffects {
  constructor({shake='normal',flashing='full',reducedMotion=false}={}){
    this.configure({shake,flashing,reducedMotion});this.reset();
  }
  configure(settings){Object.assign(this,settings);}
  reset(){this.impacts=[];this.waves=[];this.sweeps=[];this.flashes=[];this.hitStopUntil=0;}
  get motion(){return !this.reducedMotion;}
  get fullFlash(){return this.motion&&this.flashing==='full';}
  impact(now,strength=1,direction={x:0,y:1},viewport=false){
    if(!this.motion)return;
    this.impacts.push({start:now,strength,direction,viewport});
  }
  trigger(kind,now){
    if(!this.motion)return;
    const heavy=kind==='overdrive',color=heavy?'#FF6BDE':'#00E5FF';
    if(['pulse','surge','overdrive','garbage','attack'].includes(kind)){
      this.impact(now,heavy?2:1,{x:kind==='attack'?-1:0,y:1},heavy||kind==='attack');
      this.waves.push({start:now,color,heavy});
    }
    if(kind==='shift')this.sweeps.push({start:now,color});
    if(this.fullFlash&&['pulse','overdrive','garbage'].includes(kind)){
      this.flashes.push({start:now,color});this.hitStopUntil=now+(heavy?65:35);
    }
  }
  offset(now,viewport=false){
    this.impacts=this.impacts.filter(i=>now-i.start<250);
    if(!this.motion)return {x:0,y:0};
    const scale=SHAKE_LEVELS[this.shake]??1;
    return this.impacts.filter(i=>i.viewport===viewport).reduce((v,i)=>{
      const t=(now-i.start)/250,amplitude=(1-t)*4*i.strength*scale;
      v.x+=Math.sin((now-i.start)*.09)*amplitude*(i.direction.x||.35);
      v.y+=Math.cos((now-i.start)*.08)*amplitude*(i.direction.y||.35);return v;
    },{x:0,y:0});
  }
  draw(ctx,now,width=360,height=720,active=null){
    this.waves=this.waves.filter(i=>now-i.start<650);
    this.sweeps=this.sweeps.filter(i=>now-i.start<600);
    this.flashes=this.flashes.filter(i=>now-i.start<180);
    ctx.save();
    if(this.motion)for(const wave of this.waves){
      const t=(now-wave.start)/650;ctx.globalAlpha=(1-t)*.75;ctx.strokeStyle=wave.color;ctx.lineWidth=wave.heavy?5:3;
      ctx.beginPath();ctx.arc(width/2,height/2,10+t*width*.8,0,Math.PI*2);ctx.stroke();
    }
    if(this.motion)for(const sweep of this.sweeps){
      const t=(now-sweep.start)/600;ctx.globalAlpha=(1-t)*.7;ctx.fillStyle=sweep.color;ctx.fillRect(0,t*height,width,6);
    }
    // Flashes stay on the perimeter; glyphs and matching cells remain readable.
    if(this.fullFlash)for(const flash of this.flashes){ctx.globalAlpha=(1-(now-flash.start)/180)*.8;ctx.strokeStyle=flash.color;ctx.lineWidth=8;ctx.strokeRect(4,4,width-8,height-8);}
    if(active){ctx.globalAlpha=.8;ctx.strokeStyle=active==='overdrive'?'#FF6BDE':'#00E5FF';ctx.lineWidth=4;ctx.setLineDash(this.motion?[20,10]:[]);ctx.lineDashOffset=this.motion?-now*.06:0;ctx.strokeRect(3,3,width-6,height-6);}
    ctx.restore();
  }
}
