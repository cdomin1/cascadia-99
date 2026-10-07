import {NEO} from './neo-vector.mjs';
// All coordinates use a three-pixel effects grid on the existing 360 x 720 board.
// Timelines are presentation-only. Never use this clock for gameplay or networking.
export const PIXEL=3,FRAME=32;
export const SHAKE_LEVELS={off:0,reduced:.35,normal:1,maximum:1.7};
export const RETRO={pixel:PIXEL,frame:FRAME,cyan:['#38FFFF','#008299','#FFFFFF'],magenta:['#FF6B97','#A80045','#FFFFFF'],
  font:{'?':['01110','10001','00001','00010','00100','00000','00100'],'A':['01110','10001','10001','11111','10001','10001','10001'],'B':['11110','10001','10001','11110','10001','10001','11110'],'C':['01111','10000','10000','10000','10000','10000','01111'],'D':['11110','10001','10001','10001','10001','10001','11110'],'E':['11111','10000','10000','11110','10000','10000','11111'],'F':['11111','10000','10000','11110','10000','10000','10000'],'G':['01111','10000','10000','10111','10001','10001','01111'],'H':['10001','10001','10001','11111','10001','10001','10001'],'I':['11111','00100','00100','00100','00100','00100','11111'],'J':['00111','00010','00010','00010','10010','10010','01100'],'K':['10001','10010','10100','11000','10100','10010','10001'],'L':['10000','10000','10000','10000','10000','10000','11111'],'M':['10001','11011','10101','10101','10001','10001','10001'],'N':['10001','11001','10101','10011','10001','10001','10001'],'O':['01110','10001','10001','10001','10001','10001','01110'],'P':['11110','10001','10001','11110','10000','10000','10000'],'Q':['01110','10001','10001','10001','10101','10010','01101'],'R':['11110','10001','10001','11110','10100','10010','10001'],'S':['01111','10000','10000','01110','00001','00001','11110'],'T':['11111','00100','00100','00100','00100','00100','00100'],'U':['10001','10001','10001','10001','10001','10001','01110'],'V':['10001','10001','10001','10001','10001','01010','00100'],'W':['10001','10001','10001','10101','10101','10101','01010'],'X':['10001','10001','01010','00100','01010','10001','10001'],'Y':['10001','10001','01010','00100','00100','00100','00100'],'Z':['11111','00001','00010','00100','01000','10000','11111'],
  '0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['01110','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','01110'],'!':['00100','00100','00100','00100','00100','00000','00100'],'+':['00000','00100','00100','11111','00100','00100','00000'],' ':['00000','00000','00000','00000','00000','00000','00000']}};
export const snap=(n,grid=PIXEL)=>Math.round(n/grid)*grid;
export const step=(age,duration,frames=6)=>Math.min(1,Math.max(0,Math.floor(age/duration*frames)/(frames-1)));
export function impactProfile(kind,{count=3,chain=1,size=6}={}){
  if(kind==='effect')return {strength:chain>=5?4:chain===4?3:chain===3?2:chain===2?2:count>=4?1:0,duration:chain>=4?160:96};
  return {strength:kind==='overdrive'?4:kind==='garbage'?Math.min(5,3+Math.floor(size/12)):kind==='pulse'?2:kind==='attack'?1:0,duration:kind==='overdrive'||kind==='garbage'?160:96};
}
const ringCache=new Map();
export function ringPixels(x,y,radius,grid=PIXEL){
  const r=Math.max(1,Math.round(radius/grid)),key=`${r}:${grid}`;
  if(!ringCache.has(key)){
    const points=[];
    for(let py=-r;py<=r;py++)for(let px=-r;px<=r;px++){
      const distance=px*px+py*py;
      if(distance<=r*r&&distance>(r-1)*(r-1))points.push([px*grid,py*grid,grid,grid]);
    }
    if(ringCache.size>=64)ringCache.delete(ringCache.keys().next().value);ringCache.set(key,points);
  }
  return ringCache.get(key).map(p=>[snap(x)+p[0],snap(y)+p[1],p[2],p[3]]);
}
export function bitmapText(ctx,text,x,y,unit=3,color='#FFFFFF'){
  text=text.toUpperCase().replaceAll('×','X');x=snap(x);y=snap(y);ctx.fillStyle=color;
  for(const char of text){const glyph=RETRO.font[char]||RETRO.font[' '];for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(glyph[row][col]==='1')ctx.fillRect(x+col*unit,y+row*unit,unit,unit);x+=6*unit;}
}
export class PresentationEffects {
  constructor({shake='normal',flashing='full',reducedMotion=false,quality='full'}={}){this.configure({shake,flashing,reducedMotion,quality});this.reset();}
  configure(settings){Object.assign(this,settings);}
  reset(){this.impacts=[];this.waves=[];this.sweeps=[];this.flashes=[];this.sparks=[];this.hitStopUntil=0;this.shiftStarted=-Infinity;this.full=false;this.instabilities=[];}
  get motion(){return !this.reducedMotion&&this.quality!=='minimal';}
  get fullFlash(){return this.motion&&this.flashing==='full';}
  impact(now,strength=1,direction={x:1,y:1},viewport=false,duration=128){if(this.motion&&strength)this.impacts.push({start:now,strength,direction,viewport,duration});this.impacts=this.impacts.slice(-8);}
  trigger(kind,now,data={}){
    if(!this.motion)return;
    if(this.quality==='full'&&this.flashing==='full'&&(kind==='overdrive'||kind==='garbage'&&data.size>=12||kind==='effect'&&data.chain>=5))this.instabilities.push({start:now});
    this.instabilities=this.instabilities.slice(-4);
    const heavy=kind==='overdrive',color=heavy?RETRO.magenta[0]:RETRO.cyan[0],profile=impactProfile(kind,data);
    // Shake the board by default. The reusable API still supports viewport impacts.
    this.impact(now,profile.strength,{x:kind==='garbage'?0:1,y:1},false,profile.duration);
    if(['pulse','surge','overdrive'].includes(kind)||(kind==='effect'&&data.chain>1))this.waves.push({start:now,color,heavy});
    if(kind==='shift'){this.sweeps.push({start:now,color});this.shiftStarted=now;}
    if(kind==='full')this.sparks.push({start:now,color});
    if(this.fullFlash&&['pulse','overdrive','garbage'].includes(kind)){this.flashes.push({start:now,color});this.hitStopUntil=now+(heavy?64:32);}
    this.waves=this.waves.slice(-8);this.sweeps=this.sweeps.slice(-4);this.flashes=this.flashes.slice(-4);this.sparks=this.sparks.slice(-4);
  }
  meter(flux,max,now){const full=flux>=max;if(full&&!this.full)this.trigger('full',now);this.full=full;}
  shiftOffset(now){return this.motion&&now-this.shiftStarted<160?snap(-60*(1-step(now-this.shiftStarted,160,5))):0;}
  offset(now,viewport=false){
    this.impacts=this.impacts.filter(i=>now-i.start<i.duration);
    if(!this.motion)return {x:0,y:0};
    const scale=SHAKE_LEVELS[this.shake]??1,pattern=[[1,0],[-1,1],[0,-1],[1,1],[-1,0]];
    const offset=this.impacts.filter(i=>i.viewport===viewport&&now>=i.start).reduce((v,i)=>{const frame=Math.floor((now-i.start)/32),p=pattern[frame%pattern.length],amount=Math.round(i.strength*scale);v.x+=p[0]*amount*i.direction.x;v.y+=p[1]*amount*i.direction.y;return v;},{x:0,y:0});
    return {x:snap(offset.x*PIXEL),y:snap(offset.y*PIXEL)};
  }
  draw(ctx,now,width=360,height=720,active=null,layer='all'){
    this.waves=this.waves.filter(i=>now-i.start<384);this.sweeps=this.sweeps.filter(i=>now-i.start<256);this.flashes=this.flashes.filter(i=>now-i.start<128);this.sparks=this.sparks.filter(i=>now-i.start<320);
    this.instabilities=this.instabilities.filter(i=>now-i.start<NEO.timingMs.instability);
    const line=(points,color,width=2)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
    ctx.save();
    if(layer!=='front'&&this.motion){
      for(const wave of this.waves){const t=(now-wave.start)/384,r=12+t*140;ctx.strokeStyle=NEO.colors.flux;ctx.lineWidth=2;ctx.globalAlpha=1-t;ctx.beginPath();for(let n=0;n<=24;n++){const a=n*Math.PI/12,x=width/2+Math.cos(a)*r,y=height/2+Math.sin(a)*r;n?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
      ctx.globalAlpha=1;
      for(const sweep of this.sweeps){const y=(now-sweep.start)/256*height;line([[3,y],[width-3,y]],NEO.colors.flux,2);ctx.globalAlpha=.3;line([[3,y-12],[width-3,y-12]],NEO.colors.flux);ctx.globalAlpha=1;}
      for(const item of this.instabilities){const step=Math.floor((now-item.start)/32),dx=step%2?3:-3;line([[6+dx,6],[width-6+dx,6],[width-6,36]],NEO.colors.flux,1.5);line([[6,height-40],[6-dx,height-6],[width-6-dx,height-6]],NEO.colors.incoming,1.5);}
      for(const spark of this.sparks){const t=(now-spark.start)/320;for(let n=0;n<8;n++){const a=n*Math.PI/4;line([[width/2+Math.cos(a)*(12+t*40),8+Math.sin(a)*8],[width/2+Math.cos(a)*(20+t*40),8+Math.sin(a)*12]],NEO.colors.flux,1);}}
    }
    if(layer!=='back'){
      if(this.fullFlash)for(const flash of this.flashes){ctx.globalAlpha=1-(now-flash.start)/128;line([[2,height-2],[2,2],[width-2,2],[width-2,height-2],[2,height-2]],NEO.colors.neutral,2);}
      ctx.globalAlpha=1;
      if(active){line([[2,height-2],[2,2],[width-2,2],[width-2,height-2],[2,height-2]],NEO.colors.flux,active==='overdrive'?3:2);if(this.motion){const y=now/2%height;line([[3,y],[3,Math.min(height-3,y+24)]],NEO.colors.neutral,3);line([[width-3,height-y],[width-3,Math.max(3,height-y-24)]],NEO.colors.neutral,3);}}
    }
    ctx.restore();
  }
}
