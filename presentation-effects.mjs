// All coordinates use a three-pixel effects grid on the existing 360 x 720 board.
// Timelines are presentation-only. Never use this clock for gameplay or networking.
export const PIXEL=3,FRAME=32;
export const SHAKE_LEVELS={off:0,reduced:.35,normal:1,maximum:1.7};
export const RETRO={pixel:PIXEL,frame:FRAME,cyan:['#38FFFF','#008299','#FFFFFF'],magenta:['#FF6B97','#A80045','#FFFFFF'],
  font:{'A':['01110','10001','10001','11111','10001','10001','10001'],'B':['11110','10001','10001','11110','10001','10001','11110'],'C':['01111','10000','10000','10000','10000','10000','01111'],'D':['11110','10001','10001','10001','10001','10001','11110'],'E':['11111','10000','10000','11110','10000','10000','11111'],'F':['11111','10000','10000','11110','10000','10000','10000'],'G':['01111','10000','10000','10111','10001','10001','01111'],'H':['10001','10001','10001','11111','10001','10001','10001'],'I':['11111','00100','00100','00100','00100','00100','11111'],'J':['00111','00010','00010','00010','10010','10010','01100'],'K':['10001','10010','10100','11000','10100','10010','10001'],'L':['10000','10000','10000','10000','10000','10000','11111'],'M':['10001','11011','10101','10101','10001','10001','10001'],'N':['10001','11001','10101','10011','10001','10001','10001'],'O':['01110','10001','10001','10001','10001','10001','01110'],'P':['11110','10001','10001','11110','10000','10000','10000'],'Q':['01110','10001','10001','10001','10101','10010','01101'],'R':['11110','10001','10001','11110','10100','10010','10001'],'S':['01111','10000','10000','01110','00001','00001','11110'],'T':['11111','00100','00100','00100','00100','00100','00100'],'U':['10001','10001','10001','10001','10001','10001','01110'],'V':['10001','10001','10001','10001','10001','01010','00100'],'W':['10001','10001','10001','10101','10101','10101','01010'],'X':['10001','10001','01010','00100','01010','10001','10001'],'Y':['10001','10001','01010','00100','00100','00100','00100'],'Z':['11111','00001','00010','00100','01000','10000','11111'],
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
  constructor({shake='normal',flashing='full',reducedMotion=false}={}){this.configure({shake,flashing,reducedMotion});this.reset();}
  configure(settings){Object.assign(this,settings);}
  reset(){this.impacts=[];this.waves=[];this.sweeps=[];this.flashes=[];this.sparks=[];this.hitStopUntil=0;this.shiftStarted=-Infinity;this.full=false;}
  get motion(){return !this.reducedMotion;}
  get fullFlash(){return this.motion&&this.flashing==='full';}
  impact(now,strength=1,direction={x:1,y:1},viewport=false,duration=128){if(this.motion&&strength)this.impacts.push({start:now,strength,direction,viewport,duration});this.impacts=this.impacts.slice(-8);}
  trigger(kind,now,data={}){
    if(!this.motion)return;
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
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(layer!=='front'&&this.motion)for(const wave of this.waves){const frame=Math.floor((now-wave.start)/FRAME);ctx.fillStyle=frame%3===0?'#FFFFFF':wave.color;for(const p of ringPixels(width/2,height/2,12+frame*12))ctx.fillRect(...p);}
    if(layer!=='front'&&this.motion)for(const sweep of this.sweeps){const frame=Math.floor((now-sweep.start)/FRAME);ctx.fillStyle=frame%2?sweep.color:'#FFFFFF';const y=snap(frame/8*height);for(let x=0;x<width;x+=6)ctx.fillRect(x,y+(x%12?3:0),3,6);}
    if(layer!=='front'&&this.motion)for(const spark of this.sparks){const frame=Math.floor((now-spark.start)/FRAME);ctx.fillStyle=spark.color;for(let n=0;n<8;n++){const angle=n*Math.PI/4;ctx.fillRect(snap(width/2+Math.cos(angle)*(15+frame*9)),snap(9+Math.sin(angle)*(9+frame*3)),3,3);}}
    if(layer!=='back'&&this.fullFlash)for(const flash of this.flashes){const frame=Math.floor((now-flash.start)/FRAME);if(frame===0||frame===2){ctx.fillStyle=frame===0?'#FFFFFF':flash.color;ctx.fillRect(0,0,width,3);ctx.fillRect(0,height-3,width,3);ctx.fillRect(0,0,3,height);ctx.fillRect(width-3,0,3,height);}}
    if(layer!=='back'&&active){const palette=active==='overdrive'?RETRO.magenta:RETRO.cyan,frame=this.motion?Math.floor(now/160):0;ctx.fillStyle=this.fullFlash?palette[frame%3]:palette[0];for(let x=0;x<width;x+=12){ctx.fillRect(x,0,9,3);ctx.fillRect(x,height-3,9,3);}for(let y=0;y<height;y+=12){ctx.fillRect(0,y,3,9);ctx.fillRect(width-3,y,3,9);}if(this.motion){ctx.fillStyle='#FFFFFF';const y=snap(Math.floor(now/FRAME)*9%height);ctx.fillRect(0,y,6,12);ctx.fillRect(width-6,height-y-12,6,12);}}
    ctx.restore();
  }
}
