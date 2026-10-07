import {NEO} from './neo-vector.mjs';
// Normalized geometry shared with the native renderer. No gameplay state mutation.
export function tilePaths(value){return NEO.geometry[NEO.tiles[value-1]?.geometry]||[];}
export function drawVectorTile(ctx,value,x,y,size,{intensity=1,matching=false,mini=false}={}){
  const tile=NEO.tiles[value-1];if(!tile)return;
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle=NEO.colors.background;ctx.fillRect(2,2,size-4,size-4);
  ctx.strokeStyle=NEO.colors.grid;ctx.lineWidth=Math.max(.6,size/60);ctx.strokeRect(3,3,size-6,size-6);
  ctx.globalAlpha=intensity;ctx.strokeStyle=matching?NEO.colors.neutral:tile.color;
  ctx.lineWidth=Math.max(mini?1:1.2,size/60*(value===3?2.8:2));
  ctx.lineJoin='miter';ctx.lineCap='butt';
  const pad=size*.12,extent=size-pad*2;
  for(const {points}of tilePaths(value)){
    ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(pad+px*extent,pad+py*extent):ctx.moveTo(pad+px*extent,pad+py*extent));ctx.stroke();
  }
  ctx.restore();
}

export function glitchPaths(width,height,{breaking=false,age=0,reducedMotion=false}={}){
  const offset=breaking&&!reducedMotion?Math.min(4,Math.floor(Math.max(0,age)/64)):0;
  const paths=[{color:NEO.colors.incoming,points:[[2,2],[width-2,2],[width-2,height-2],[2,height-2],[2,2]]}];
  for(let x=12;x<width-12;x+=30){
    paths.push({color:NEO.colors.incoming,points:[[x,7],[x+7,14],[x+14,7]]});
    const middle=Math.max(18,height/2);
    paths.push({color:NEO.colors.flux,points:[[x,20],[x+offset,Math.min(height-5,middle-5)],[x+12+offset,middle],[x+12,height-5]]});
  }
  if(breaking)for(let x=20;x<width-10;x+=40)paths.push({color:NEO.colors.neutral,points:[[x,4],[x+8+offset,height*.35],[x-4,height*.6],[x+12+offset,height-4]]});
  return paths;
}
export function drawGlitch(ctx,x,y,width,height,options={}){
  ctx.save();ctx.translate(x,y);ctx.fillStyle=NEO.colors.surface;ctx.fillRect(0,0,width,height);
  for(const path of glitchPaths(width,height,options)){
    ctx.strokeStyle=path.color;ctx.globalAlpha=path.color===NEO.colors.flux?.6:1;ctx.lineWidth=path.color===NEO.colors.incoming?2:1.2;
    ctx.beginPath();path.points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();
  }
  ctx.restore();
}
