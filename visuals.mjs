import {snap,step,bitmapText} from './presentation-effects.mjs';
import './palettes.js';
export let TILE_STYLES=Object.freeze([
  null,
  {name:'Skull',color:'#FF6B97',step:'#A80045',tint:'#520021'},
  {name:'Cyber-Eye',color:'#38FFFF',step:'#008299',tint:'#003D47'},
  {name:'Radiation',color:'#66FF1A',step:'#1F8A00',tint:'#0D4200'},
  {name:'Twin Bolts',color:'#FFB81C',step:'#B36B00',tint:'#593300'}
]);
export const colors=['',...TILE_STYLES.slice(1).map(tile=>tile.color),'','#334155'];
export const PANEL_NAMES=['',...TILE_STYLES.slice(1).map(tile=>tile.name)];
export const BAYER_4=Object.freeze([0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]);
export const ditherPixel=(x,y,density=.5)=>BAYER_4[((y&3)<<2)+(x&3)]<density*16;
let paletteId='arcade';
const currentPalette=()=>CascadiaPalettes[paletteId];
function syncPalette(){
  const selected=globalThis.document?.documentElement.dataset.palette||'arcade';
  if(selected===paletteId||!Object.hasOwn(CascadiaPalettes,selected))return;
  paletteId=selected;TILE_STYLES=Object.freeze([null,...currentPalette().tiles.map((tile,i)=>({...tile,name:PANEL_NAMES[i+1]}))]);
  colors.splice(1,4,...TILE_STYLES.slice(1).map(tile=>tile.color));
}
const surfaceCache=new Map();
function bitmap(key,width,height,paint){
  if(surfaceCache.has(key))return surfaceCache.get(key);
  const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):Object.assign(document.createElement('canvas'),{width,height});
  const ctx=canvas.getContext('2d');paint(ctx,width,height);
  // Limit caches when responsive layouts generate many different board sizes.
  if(surfaceCache.size>96)surfaceCache.delete(surfaceCache.keys().next().value);
  surfaceCache.set(key,canvas);return canvas;
}
function stipple(ctx,x,y,width,height,light,dark,density=.5,step=1){
  ctx.fillStyle=dark;ctx.fillRect(x,y,width,height);ctx.fillStyle=light;
  for(let py=0;py<height;py+=step)for(let px=0;px<width;px+=step)
    if(ditherPixel(Math.floor(px/step),Math.floor(py/step),density))ctx.fillRect(x+px,y+py,Math.min(step,width-px),Math.min(step,height-py));
}
const GLYPHS=[null,
 ['0000011111100000','0001111111111000','0011111111111100','0011111111111100','0111111111111110','0110011111001110','0110001110001110','0110001110001110','0111111001111110','0011110000111100','0001111111111000','0001111111111000','0001101101101000','0001101101101000','0000000000000000','0000000000000000'],
 ['0000000000000000','0000000000000000','0000011111100000','0001111111111000','0011111111111100','0111111001111110','1111110000111111','1111100000011111','1111100000011111','1111110000111111','0111111001111110','0011111111111100','0001111111111000','0000011111100000','0000000000000000','0000000000000000'],
 ['0000000000000000','0000000000000000','0011100000011100','0111110000111110','0111110000111110','0111110000111110','0011100000011100','0000000110000000','0000001111000000','0000001111000000','0000000110000000','0000000000000000','0000011111100000','0000111111110000','0001111111111000','0000000000000000'],
 ['0000011100000000','0000111000000000','0000111000000000','0001110000000000','0011111100111000','0000011001110000','0000110001110000','0001100011100000','0001000111111000','0000000000110000','0000000001100000','0000000011000000','0000000010000000','0000000000000000','0000000000000000','0000000000000000']
];
function drawPixelGlyph(ctx,value,n){
  if(n<20){
    const glyph=bitmap(`glyph:${paletteId}:${value}`,24,24,g=>drawPixelGlyph(g,value,24));
    ctx.imageSmoothingEnabled=false;ctx.drawImage(glyph,4,4,16,16,2,2,n-4,n-4);return;
  }
  const mask=GLYPHS[value],unit=Math.max(1,Math.floor(n/24)),left=Math.floor((n-16*unit)/2),top=left;
  const has=(x,y)=>mask[y]?.[x]==='1';
  // Hard pixel outlines and ordered offset shadows replace neon alpha glows.
  for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(has(x,y)){
    if(value===4){ctx.fillStyle='#000000';ctx.fillRect(left+x*unit-1,top+y*unit-1,unit+2,unit+2);}
    if(value===1||value===4){ctx.fillStyle=TILE_STYLES[value].tint;for(let py=0;py<unit;py++)for(let px=0;px<unit;px++)if(ditherPixel(left+x*unit+px,top+y*unit+py))ctx.fillRect(left+x*unit+px+1,top+y*unit+py+1,1,1);}
  }
  if(value===2)stipple(ctx,left+5*unit,top+5*unit,6*unit,6*unit,TILE_STYLES[value].tint,TILE_STYLES[value].step,.5);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++)if(has(x,y)){
    ctx.fillStyle=value===3?((x+y)%3===0?'#000000':TILE_STYLES[value].tint):'#FFFFFF';ctx.fillRect(left+x*unit,top+y*unit,unit,unit);
  }
}
function tileBitmap(value,n){return bitmap(`tile:${paletteId}:${value}:${n}`,n,n,(ctx)=>{
  const style=TILE_STYLES[value],radius=Math.floor(n*.14);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const cornerX=Math.max(radius-x,x-(n-1-radius),0),cornerY=Math.max(radius-y,y-(n-1-radius),0);
    if(cornerX&&cornerY&&cornerX*cornerX+cornerY*cornerY>radius*radius)continue;
    let color;
    if(x<2||y<2||x>=n-2||y>=n-2)color='#000000';
    else if(x>=n-6||y>=n-6)color=style.tint;
    else {
      const diagonal=x+y-n*.9;
      const density=diagonal<0?1:diagonal<3?.75:diagonal<9?.5:diagonal<12?.25:0;
      color=ditherPixel(x,y,density)?style.color:style.step;
    }
    ctx.fillStyle=color;ctx.fillRect(x,y,1,1);
  }
  drawPixelGlyph(ctx,value,n);
});}

export class BoardAnimations {
  constructor({reducedMotion=false,onImpact=()=>{}}={}){this.reducedMotion=reducedMotion;this.flashing=true;this.shakeScale=1;this.onImpact=onImpact;this.reset();}
  reset(){this.particles=[];this.badges=[];this.rings=[];this.drops=new Map();this.projectiles=[];this.swap=null;this.fall=null;this.lastSerial=-1;this.clearKey='';this.clearStarted=0;this.shakeUntil=0;this.lastImpact=0;this.clearFlashes=[];this.cursorMotion=null;this.breakStarts=new Map();}
  state(self,now=performance.now()){
    if(self.blocks){const live=new Set(self.blocks.map(b=>b.id));for(const id of this.breakStarts.keys())if(!live.has(id))this.breakStarts.delete(id);}
    if(self.cursor&&(!this.cursorMotion||self.cursor.x!==this.cursorMotion.to.x||self.cursor.y!==this.cursorMotion.to.y)){const from=this.cursorAt(self.cursor,now);this.cursorMotion={from,to:{...self.cursor},start:now};}
    if(self.fallSerial!==this.lastSerial){this.lastSerial=self.fallSerial;this.fall={moves:self.falls||[],start:now};}
    const key=self.phase==='clear'?self.matches.join(',')+'/'+self.chain+'/'+self.score:'';
    if(key!==this.clearKey){this.clearKey=key;this.clearStarted=now;}
  }
  cursorAt(cursor,now){if(!this.cursorMotion||this.reducedMotion)return cursor;const m=this.cursorMotion,t=step(now-m.start,96,4);return {x:m.from.x+(m.to.x-m.from.x)*t,y:m.from.y+(m.to.y-m.from.y)*t};}
  badge(text,x,y,color,now){this.badges.push({text:text.replaceAll('×','X'),x:180,y:Math.max(18,Math.min(90,y)),color,start:now});this.badges=this.badges.slice(-6);}
  burst(positions,grid,rise,now,intensity=1){
    if(this.reducedMotion)return;
    for(const p of positions){const y=Math.floor(p/6),x=p%6,c=grid?.[y]?.[x];
      for(let n=0;n<8;n++){const angle=n*Math.PI/4+0,speed=(120+(p%3)*30)*Math.min(1.8,intensity);this.particles.push({x:(x+.5)*60,y:(y+.5-rise)*60,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,color:colors[c>=1&&c<=4?c:1+(p%4)],size:3+(n%2)*3,start:now});}
    }
    if(this.particles.length>300)this.particles=this.particles.slice(-300);
  }
  event(event,grid,rise=0,now=performance.now()){
    if(grid){const top=grid.findIndex(row=>row.some(Boolean));this.freeTop=top<0?12:top;}
    if(event.type==='ability'){this.badge(event.ability.toUpperCase()+'!',180,330,'#00E5FF',now);this.burst([30,35,36,41],grid,rise,now);}
    if(event.type==='pulse'){this.badge(event.assist?'TEAM RESCUE!':'PULSE!',180,330,'#00E5FF',now);this.burst([0,1,2,3,4,5],grid,0,now);}
    if(event.type==='swap')this.swap={...event,start:now};
    if(event.type==='effect'){
      const positions=event.positions||[],x=positions.length?positions.reduce((n,p)=>n+(p%6+.5)*60,0)/positions.length:180;
      const y=positions.length?Math.min(...positions.map(p=>(Math.floor(p/6)-rise)*60))-10:360;
      this.burst(positions,grid,rise,now+50,1+Math.max(0,(event.chain||1)-1)*.16);
      if(event.chain>1){this.badge(`CHAIN X${event.chain}`,x,y,'#00E5A3',now);}
      else if(event.count>3)this.badge(`${event.count} COMBO!`,x,y,'#FFAE03',now);
      else this.badge(`+${event.count*10}`,x,y,'#F8F9FA',now);
    }
    if(event.type==='garbage')for(const block of event.blocks||[])this.drops.set(block.id,{start:now,impact:false});
    if(event.type==='attack'&&!this.reducedMotion)this.projectiles.push({amount:event.amount,start:now});
    if(event.type==='break')for(const block of event.blocks||[]){this.breakStarts.set(block.id,now);this.badge('BREAK!',(block.x+block.width/2)*60,(block.y-rise)*60-10,'#00E5A3',now);}
    if(event.type==='convert')this.burst(event.positions||[],grid,rise,now);
  }
  blockY(block,now){
    const drop=this.drops.get(block.id);if(!drop)return block.y;
    const t=this.reducedMotion?1:step(now-drop.start,240,7);
    if(t===1&&!drop.impact){drop.impact=true;this.shakeUntil=now+160;this.burst(Array.from({length:block.width},(_,x)=>Math.min(11,block.y+block.height-1)*6+block.x+x),null,0,now);if(now-this.lastImpact>100){this.lastImpact=now;this.onImpact(block);}}
    if(t===1)this.drops.delete(block.id);
    return -block.height+(block.y+block.height)*t*t;
  }
  overlay(context,now,grid=[],rise=0){
    this.particles=this.particles.filter(p=>now-p.start<384);
    if(!this.reducedMotion)for(const p of this.particles){
      const frame=Math.floor((now-p.start)/32);if(frame<0)continue;
      const t=frame*.032;context.fillStyle=frame<2?'#FFFFFF':p.color;
      if(frame>8&&frame%2)continue;
      const px=snap(p.x+p.vx*t),py=snap(p.y+p.vy*t+180*t*t);
      if([py,py+p.size-1].some(y=>[px,px+p.size-1].some(x=>grid[Math.floor(y/60+rise)]?.[Math.floor(x/60)])))continue;
      context.fillRect(px,py,p.size,p.size);
    }
    this.projectiles=this.projectiles.filter(p=>now-p.start<320);
    if(!this.reducedMotion)for(const p of this.projectiles){
      const frame=Math.floor((now-p.start)/32),x=snap(330-frame*18),y=snap(18+Math.min(frame,10-frame)*6);
      context.fillStyle='#000000';context.fillRect(x,y,27,15);context.fillStyle='#FFB81C';context.fillRect(x+3,y+3,21,3);
      context.fillStyle='#38FFFF';context.fillRect(x-9,y+6,6,3);context.fillRect(x-18,y+6,3,3);
    }
    this.badges=this.badges.filter(b=>now-b.start<768);
    for(const b of this.badges){
      const frame=Math.floor((now-b.start)/32),large=b.text.startsWith('CHAIN')||b.text==='OVERDRIVE!';
      const unit=this.reducedMotion?3:frame===0?2:frame===1&&large?4:3;
      const width=b.text.length*6*unit,x=snap(b.x-width/2),y=snap(b.y-(this.reducedMotion?0:Math.min(4,Math.floor(frame/3))*3));
      if(frame>20&&!this.reducedMotion&&frame%2)continue;
      const top=grid.findIndex(row=>row.some(Boolean));
      if(y+7*unit>((top<0?12:top)-rise)*60)continue;
      bitmapText(context,b.text,x+3,y+3,unit,'#000000');bitmapText(context,b.text,x,y,unit,b.color);
    }
  }
}

function panel(context,value,x,y,cell,{mini=false,flash=false,scale=1,warning=false,now=0,reducedMotion=false,compress=false}={}){
  if(!TILE_STYLES[value]||scale<=0)return;
  const gap=Math.max(1,Math.round(cell*.035)),size=Math.max(8,Math.round(cell-gap*2));
  context.save();context.imageSmoothingEnabled=false;
  if(flash&&!reducedMotion)context.filter='brightness(200%)';
  context.translate(Math.round(x*cell+cell/2),Math.round(y*cell+cell/2));context.scale(scale,scale);
  const height=compress?size-6:size;context.drawImage(tileBitmap(value,size),-Math.floor(size/2),-Math.floor(height/2),size,height);
  if(warning&&(reducedMotion||Math.floor(now/280)%2===0)){
    context.strokeStyle='#FFFFFF';context.lineWidth=1;context.strokeRect(-Math.floor(size/2)+2.5,-Math.floor(size/2)+2.5,size-5,size-5);
  }
  context.restore();
}

export const ATTACK_STYLE=Object.freeze({base:'#334155',border:'#000000',core:'#94A3B8',red:'#FF3B30'});
function slab(context,block,y,cell,mini,now,reducedMotion=false,breakStart=now,flashing=true){
  const x=Math.round(block.x*cell+1),py=Math.round(y*cell+1),width=Math.max(1,Math.round(block.width*cell-2)),height=Math.max(1,Math.round(block.height*cell-2)),breaking=block.state==='breaking';
  const phase=reducedMotion?0:Math.floor(now/260)%2,age=now-breakStart;
  const surface=bitmap(`slab:${paletteId}:${width}:${height}:${block.width}:${phase}:${breaking}`,width,height,(ctx)=>{
    ctx.fillStyle='#000000';ctx.fillRect(0,0,width,height);
    for(let row=1;row<height-1;row++){
      if(row<=3){ctx.fillStyle=currentPalette().metal[0];ctx.fillRect(1,row,width-2,1);continue;}
      const bottom=row>=height-7;
      const density=bottom?(row>=height-4?.25:.5):row<height*.45?.75:row<height*.7?.5:.25;
      for(let col=1;col<width-1;col++){
        ctx.fillStyle=ditherPixel(Math.floor(col/2),Math.floor(row/2),density)?currentPalette().metal[1]:bottom?currentPalette().metal[3]:currentPalette().metal[2];ctx.fillRect(col,row,1,1);
      }
    }
    // Four-pixel diagonal warning hatches with a black/purple checker fill.
    for(let row=4;row<Math.min(10,height-1);row++)for(let col=1;col<width-1;col++){
      ctx.fillStyle=Math.floor((col+row)/4)%2===0?(paletteId==='arcade'?(breaking&&phase&&flashing?'#FFB81C':'#FF3B30'):currentPalette().dark[6]):ditherPixel(col,row)?'#310D3D':'#000000';ctx.fillRect(col,row,1,1);
    }
    for(let col=1;col<block.width;col++){ctx.fillStyle=currentPalette().metal[3];ctx.fillRect(Math.round(col*cell)-2,10,2,Math.max(0,height-12));}
    const cx=Math.floor(width/2),cy=Math.floor(height/2),core=Math.min(12,height-4),left=cx-Math.floor(core/2),top=cy-Math.floor(core/2);
    for(let gy=-4;gy<core+4;gy++)for(let gx=-4;gx<core+4;gx++)if((gx<0||gy<0||gx>=core||gy>=core)&&ditherPixel(gx+phase,gy,phase?.5:.25)){
      ctx.fillStyle=breaking?'#FFFFFF':currentPalette().metal[0];ctx.fillRect(left+gx,top+gy,1,1);
    }
    ctx.fillStyle='#000000';ctx.fillRect(left,top,core,core);ctx.fillStyle=breaking?'#FFFFFF':currentPalette().metal[0];ctx.fillRect(left+2,top+2,Math.max(1,core-4),Math.max(1,core-4));
    ctx.fillStyle=currentPalette().metal[2];ctx.fillRect(left+4,top+4,Math.max(1,core-8),Math.max(1,core-8));
    ctx.fillStyle=currentPalette().metal[0];for(let pin=2;pin<core-1;pin+=3){ctx.fillRect(left+pin,top-2,1,2);ctx.fillRect(left+pin,top+core,1,2);ctx.fillRect(left-2,top+pin,2,1);ctx.fillRect(left+core,top+pin,2,1);}
  });
  context.save();context.imageSmoothingEnabled=false;context.drawImage(surface,x,py);
  if(breaking&&!reducedMotion&&age<256){const sweep=snap(width*step(age,256,8));stipple(context,x+Math.max(0,sweep-4),py,Math.min(8,width-sweep),height,'#FFFFFF',currentPalette().metal[0],.5);}
  if(!reducedMotion){
    context.fillStyle=breaking&&flashing&&age<128&&Math.floor(age/32)%2===0?'#38FFFF':'#008299';
    const seamY=py+Math.floor(height/2);for(let dx=3;dx<width-3;dx+=12)context.fillRect(x+dx,seamY,6,2);
    if(breaking){const frame=Math.min(7,Math.floor(age/32));context.fillStyle=flashing&&frame<4&&frame%2===0?'#38FFFF':'#008299';for(let n=0;n<4;n++){const cx=x+Math.floor(width*(n+1)/5);context.fillRect(cx,py+3+frame*3,3,Math.min(9,height-6));}}
  }
  context.restore();
}

export function drawBoard(context,grid,width,height,{rise=0,matches=[],cursor=null,danger=false,mini=false,blocks=[],animations=null,presentation=null,activeAbility=null,reducedMotion=false,now=performance.now()}={}){
  syncPalette();
  const motionReduced=animations?.reducedMotion??reducedMotion;
  const cell=width/6;context.clearRect(0,0,width,height);context.save();
  if(animations&&!animations.reducedMotion&&animations.shakeUntil>now){const strength=3*(animations.shakeScale??1),frame=Math.floor(now/32);context.translate(snap((frame%2?1:-1)*strength),snap((frame%3-1)*strength));}
  if(presentation){const offset=presentation.offset(now);context.translate(offset.x,offset.y);}
  context.imageSmoothingEnabled=false;
  const background=bitmap(`well:${paletteId}:${width}:${height}`,width,height,(ctx,w,h)=>stipple(ctx,0,0,w,h,...currentPalette().well,.25));
  context.drawImage(background,0,0);
  if(presentation)presentation.draw(context,now,width,height,null,'back');
  context.save();if(presentation)context.translate(0,presentation.shiftOffset(now));
  const grouped=new Set();for(const block of blocks)for(let y=block.y;y<block.y+block.height;y++)for(let x=block.x;x<block.x+block.width;x++)grouped.add(y*6+x);
  const swap=animations&&!animations.reducedMotion&&animations.swap&&now-animations.swap.start<128?animations.swap:null;
  const fall=animations&&!animations.reducedMotion&&animations.fall&&now-animations.fall.start<160?animations.fall:null;
  const falling=new Map((fall?.moves||[]).filter(move=>grid[move.to]?.[move.x]===move.value).map(move=>[move.to*6+move.x,move]));
  for(let y=0;y<12;y++)for(let x=0;x<6;x++){
    const value=grid[y][x],p=y*6+x;if(!value||grouped.has(p)||(swap&&y===swap.y&&(x===swap.x||x===swap.x+1)))continue;
    const move=falling.get(p);let dy=y;
    if(move)dy=move.from+(move.to-move.from)*step(now-fall.start,160,6);
    const order=matches.indexOf(p),flashFrame=Math.floor((now-(animations?.clearStarted??now))/32);
    panel(context,value,x,dy-rise,cell,{mini,flash:order>=0&&flashFrame<4&&flashFrame%2===0&&!motionReduced&&(animations?.flashing??true),compress:order>=0&&flashFrame===3&&!motionReduced,warning:y<3,now,reducedMotion:motionReduced});
  }
  if(swap){const t=step(now-swap.start,128,5);panel(context,swap.left,swap.x+t,swap.y-rise,cell,{warning:swap.y<3,now});panel(context,swap.right,swap.x+1-t,swap.y-rise,cell,{warning:swap.y<3,now});}
  for(const block of blocks)slab(context,block,(animations?animations.blockY(block,now):block.y)-rise,cell,mini,now,motionReduced,animations?.breakStarts.get(block.id)??(now-360),animations?.flashing??true);
  context.restore();
  if(cursor){const position=animations?animations.cursorAt(cursor,now):cursor,y=(position.y-rise)*cell;context.shadowBlur=0;context.strokeStyle='#E0F7FA';context.lineWidth=2;context.strokeRect(Math.round(position.x*cell)+1,Math.round(y)+1,Math.round(cell*2)-2,Math.round(cell)-2);context.shadowBlur=0;}
  if(animations)animations.overlay(context,now,grid,rise);if(presentation)presentation.draw(context,now,width,height,activeAbility,'front');context.restore();
}
