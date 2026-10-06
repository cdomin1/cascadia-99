// Render a reproducible demonstration with the real board engine and renderer.
const {app,BrowserWindow}=require('electron');
const {mkdir,writeFile,copyFile,rm}=require('node:fs/promises');
const {execFileSync}=require('node:child_process');
const {resolve}=require('node:path');
app.setPath('userData',resolve('.web-smoke/demo-profile'));
app.commandLine.appendSwitch('disable-gpu');
if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
app.whenReady().then(async()=>{
  const {Board}=await import('../engine.mjs');
  let seed=718;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const board=new Board(random);board.grid=Array.from({length:12},()=>Array(6).fill(0));
  board.grid[7]=[3,4,2,3,2,2];board.grid[8]=[4,3,3,1,2,4];board.grid[9]=[3,2,4,2,1,3];board.grid[10]=[2,0,2,4,3,3];board.grid[11]=[1,1,2,1,3,4];board.cursor={x:2,y:10};
  const window=new BrowserWindow({show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false}});
  await window.loadURL(process.env.PANEL99_WEB_URL||'http://127.0.0.1:3000');
  await window.webContents.executeJavaScript(`(async()=>{
    const {drawBoard,BoardAnimations}=await import('/visuals.mjs');
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=420;const ctx=canvas.getContext('2d');
    const animations=new BoardAnimations();
    window.renderDemo=frame=>{
      const {board,events,now,caption}=frame;
      for(const event of events)animations.event(event.type==='clear'?{...event,type:'effect'}:event,frame.previous,0,now);
      animations.state(board,now);
      ctx.fillStyle='#0F1219';ctx.fillRect(0,0,640,420);
      ctx.fillStyle='#97A3B3';ctx.font='bold 11px sans-serif';ctx.fillText('GAMEPLAY DEMO / CHAIN REACTION ARENA',26,26);
      ctx.save();ctx.translate(26,52);ctx.scale(.47,.47);ctx.imageSmoothingEnabled=false;drawBoard(ctx,board.grid,360,720,{matches:board.matches,cursor:board.cursor,blocks:board.blocks,animations,now});ctx.restore();
      ctx.fillStyle='#00E5A3';ctx.font='bold 13px sans-serif';ctx.fillText('SWAP. CHAIN. SURVIVE.',245,88);
      ctx.fillStyle='#F8F9FA';ctx.font='bold 28px sans-serif';
      const lines=caption.split('|');for(let i=0;i<lines.length;i++)ctx.fillText(lines[i],245,136+i*36);
      ctx.fillStyle='#97A3B3';ctx.font='13px sans-serif';ctx.fillText('Arrow keys move · Space swaps',245,275);
      ctx.fillText('Bigger chains send bigger bricks.',245,300);
      ctx.fillStyle='#1E222B';ctx.fillRect(245,330,340,36);ctx.fillStyle='#00E5A3';ctx.font='bold 12px sans-serif';ctx.fillText('SCORE  '+board.score,258,352);
      ctx.fillStyle='#FFAE03';ctx.fillText('CHAIN  '+frame.bestChain+'×',443,352);
      ctx.fillStyle='#303947';ctx.fillRect(26,402,588,3);ctx.fillStyle='#00E5A3';ctx.fillRect(26,402,588*(now/8000),3);
      return canvas.toDataURL('image/png').split(',')[1];
    };
  })()`);
  await rm('.web-smoke/demo-frames',{recursive:true,force:true});
  await mkdir('.web-smoke/demo-frames',{recursive:true});
  let bestChain=0,breaksSeen=0,convertedRows=0;const fps=50,frameCount=fps*8;
  const at=oldFrame=>Math.round(oldFrame*fps/16);
  const actions=new Map([[at(12),()=>{board.move(0,1);const {x,y}=board.cursor,left=board.grid[y][x],right=board.grid[y][x+1];board.swap();return {type:'swap',x,y,left,right};}],
    [at(48),()=>{board.dropGarbage(12);return {type:'attack',amount:12};}],
    [at(65),()=>swapAt(2,9)],[at(89),()=>swapAt(3,9)]]);
  function swapAt(x,y){board.move(x-board.cursor.x,y-board.cursor.y);const left=board.grid[y][x],right=board.grid[y][x+1];board.swap();return {type:'swap',x,y,left,right};}
  for(let index=0;index<frameCount;index++){
    const previous=board.grid.map(row=>[...row]),events=[];
    const event=actions.get(index)?.();if(event)events.push(event);
    board.tick(1/fps,0,false);events.push(...board.events.splice(0));bestChain=Math.max(bestChain,board.chain);breaksSeen+=events.filter(event=>event.type==='break').length;convertedRows+=events.filter(event=>event.type==='convert').length;
    const frame={now:index*1000/fps,previous,events,bestChain,caption:index<at(20)?'A little swap.|A perfect match.':index<at(48)?'Watch the|chain reaction!':index<at(88)?'Here comes|a big brick.':'Break the brick.|Make a comeback.',board:{grid:board.grid,blocks:board.garbageBlocks,cursor:board.cursor,matches:board.matches,phase:board.phase,chain:board.chain,score:board.score,falls:board.falls,fallSerial:board.fallSerial}};
    const png=await window.webContents.executeJavaScript(`window.renderDemo(${JSON.stringify(frame)})`);
    await writeFile(`.web-smoke/demo-frames/frame-${String(index).padStart(3,'0')}.png`,Buffer.from(png,'base64'));
  }
  if(bestChain<2||breaksSeen<1||convertedRows<2)throw new Error('Demo must show a chain and bottom-to-top slab breakup.');
  await mkdir('demo',{recursive:true});
  // GIF delays are centiseconds: 50 FPS gives each frame an exact 2 cs delay.
  // Use all 256 colors from every frame without patterned dithering. Encoding
  // opaque cropped frames avoid transparent delta-frame artifacts in playback.
  execFileSync('ffmpeg',['-loglevel','error','-framerate',String(fps),'-i','.web-smoke/demo-frames/frame-%03d.png','-filter_complex','[0:v]split[a][b];[a]palettegen=max_colors=256:reserve_transparent=0:stats_mode=full[p];[b][p]paletteuse=dither=none','-gifflags','offsetting','-loop','0','-y','demo/gameplay.gif']);
  await copyFile('.web-smoke/demo-frames/frame-'+String(at(30)).padStart(3,'0')+'.png','demo/gameplay.png');
  console.log(`DEMO_OK: ${frameCount} frames at ${fps} FPS, best chain ${bestChain}, score ${board.score}, ${breaksSeen} slab breaks, ${convertedRows} released rows`);window.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
