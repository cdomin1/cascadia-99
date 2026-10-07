// A curated showcase of real engine/ability footage, shared with native Help.
const {app,BrowserWindow}=require('electron');
const {mkdir,writeFile,copyFile,rm}=require('node:fs/promises');
const {execFileSync}=require('node:child_process');
const {resolve}=require('node:path');
app.setPath('userData',resolve('.web-smoke/demo-profile'));
app.commandLine.appendSwitch('disable-gpu');
if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
app.whenReady().then(async()=>{
 const {buildShowcase,SHOWCASE_FPS,SHOWCASE_CHAPTERS}=await import('./homepage-showcase.mjs');
 const frames=buildShowcase();
 const window=new BrowserWindow({show:false,webPreferences:{contextIsolation:true,sandbox:true,backgroundThrottling:false}});
 await window.loadURL(process.env.PANEL99_WEB_URL||'http://127.0.0.1:3000');
 await window.webContents.executeJavaScript(`(async()=>{
  const {drawBoard,BoardAnimations}=await import('/visuals.mjs');
  const {bitmapText,PresentationEffects}=await import('/presentation-effects.mjs');
  const {FLUX}=await import('/flux-config.mjs');
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=420;const ctx=canvas.getContext('2d');
  let presentation,animations,previousChapter=-1;
  const text=(value,x,y,unit=2,color='#FFFFFF')=>bitmapText(ctx,value,x,y,unit,color);
  window.renderDemo=(frame,index,total)=>{
   const {own:board,events,now,chapter,chapterIndex}=frame;
   window.demoNow=now;
   if(chapterIndex!==previousChapter){presentation=new PresentationEffects();animations=new BoardAnimations({onImpact:block=>presentation.trigger('garbage',window.demoNow,{size:block.width*block.height})});animations.shakeScale=0;previousChapter=chapterIndex;}
   for(const event of events){const display=event.type==='clear'?{...event,type:'effect'}:event;animations.event(display,board.grid,board.rise,now);if(display.type!=='garbage')presentation.trigger(display.ability||display.type,now,display);}
   animations.state(board,now);presentation.meter(board.flux,FLUX.max,now);
   ctx.fillStyle='#0F1219';ctx.fillRect(0,0,640,420);
   text('CASCADIA 99  GAMEPLAY SHOWCASE',24,12,2,'#94A3B8');
   ctx.save();ctx.translate(24,42);ctx.scale(.5,.5);ctx.imageSmoothingEnabled=false;
   drawBoard(ctx,board.grid,360,720,{...board,animations,presentation,now});ctx.restore();
   text('0'+(chapterIndex+1)+'  '+chapter.title,234,48,2,'#38FFFF');
   chapter.lines.forEach((line,i)=>text(line,234,90+i*33,3));
   text(chapter.hint,234,169,2,'#94A3B8');
   const ability=FLUX[chapter.id];
   text(ability?'EXAMPLE STARTS WITH FULL FLUX':'ACTUAL MATCH AND CHAIN REWARDS',234,194,2,'#FFB81C');
   text('FLUX '+Math.floor(board.flux)+' OF '+FLUX.max,234,230,3,'#38FFFF');
   ctx.fillStyle='#073644';ctx.fillRect(234,259,348,15);
   ctx.fillStyle=board.flux>=FLUX.max?'#FFFFFF':'#38FFFF';ctx.fillRect(234,259,Math.round(348*board.flux/FLUX.max),15);
   ctx.fillStyle='#0F1219';for(let n=1;n<10;n++)ctx.fillRect(234+Math.round(348*n/10),259,3,15);
   text('SCORE '+board.score,234,294,2,'#66FF1A');text('CHAIN X'+board.chain,444,294,2,'#FFB81C');
   const pending=(board.incoming||[]).reduce((sum,a)=>sum+a.amount,0);
   text('PENDING GARBAGE '+pending,234,321,2,'#94A3B8');
   text(board.activeAbility?board.activeAbility.toUpperCase()+' '+Math.ceil(board.abilityRemaining)+'S':chapter.id==='overdrive'&&board.flux===FLUX.max?'FULL CHARGE HOLD '+Math.min(FLUX.overdrive.hold,Math.floor(board.maxFluxHeld))+' OF '+FLUX.overdrive.hold:ability?'COST '+ability.cost+' FLUX':'SWAP  CHAIN  SURVIVE',234,355,2,'#FF6B97');
   ctx.fillStyle='#303947';ctx.fillRect(24,408,592,3);ctx.fillStyle='#38FFFF';ctx.fillRect(24,408,Math.round(592*(index+1)/total),3);
   return canvas.toDataURL().split(',')[1];
  };
 })()`);
 await rm('.web-smoke/demo-frames',{recursive:true,force:true});await mkdir('.web-smoke/demo-frames',{recursive:true});
 for(const [index,frame]of frames.entries()){
  const png=await window.webContents.executeJavaScript(`window.renderDemo(${JSON.stringify(frame)},${index},${frames.length})`);
  await writeFile(`.web-smoke/demo-frames/frame-${String(index).padStart(4,'0')}.png`,Buffer.from(png,'base64'));
 }
 await mkdir('demo',{recursive:true});
 execFileSync('ffmpeg',['-loglevel','error','-framerate',String(SHOWCASE_FPS),'-i','.web-smoke/demo-frames/frame-%04d.png','-filter_complex','[0:v]split[a][b];[a]palettegen=max_colors=256:reserve_transparent=0[p];[b][p]paletteuse=dither=none','-gifflags','offsetting','-loop','0','-y','demo/gameplay.gif']);
 // Surge still includes the board, earned Flux, active timer and pending counter.
 const still=SHOWCASE_FPS*26;
 await copyFile(`.web-smoke/demo-frames/frame-${String(still).padStart(4,'0')}.png`,'demo/gameplay.png');
 await writeFile('demo/showcase.json',JSON.stringify({fps:SHOWCASE_FPS,frames:frames.length,seconds:frames.length/SHOWCASE_FPS,chapters:SHOWCASE_CHAPTERS.map(c=>({id:c.id,seconds:c.seconds})),still},null,2)+'\n');
 console.log('DEMO_OK: '+frames.length+' frames, '+frames.length/SHOWCASE_FPS+' seconds, six chapters, actual Flux rewards and four authoritative abilities');
 window.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
