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
