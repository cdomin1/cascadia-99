const {app,BrowserWindow}=require('electron');
const {mkdir,readFile,writeFile,copyFile}=require('node:fs/promises');
const {execFileSync}=require('node:child_process');
const {resolve}=require('node:path');
app.setPath('userData',resolve('.web-smoke/tutorial-profile'));
app.commandLine.appendSwitch('disable-gpu');
if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
app.whenReady().then(async()=>{
 const {TUTORIALS}=await import('../tutorials.mjs');
 const clips=JSON.parse(await readFile('.web-smoke/tutorial-recordings.json','utf8'));
 const window=new BrowserWindow({show:false,webPreferences:{contextIsolation:true,sandbox:true,backgroundThrottling:false}});
 await window.loadURL(process.env.PANEL99_WEB_URL);
 await window.webContents.executeJavaScript(`(async()=>{
  const {FLUX}=await import('/flux-config.mjs');
  const {drawBoard,BoardAnimations}=await import('/visuals.mjs'),{PresentationEffects}=await import('/presentation-effects.mjs'),{vectorText:bitmapText}=await import('/vector-geometry.mjs');
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=216;const ctx=canvas.getContext('2d');
  const board=document.createElement('canvas');board.width=360;board.height=720;const bc=board.getContext('2d');
  const sheet=document.createElement('canvas');sheet.width=3840;sheet.height=1728;const sc=sheet.getContext('2d');
  let animations,presentation;
  window.startTutorial=()=>{presentation=new PresentationEffects();animations=new BoardAnimations({onImpact:block=>presentation.trigger('garbage',window.tutorialNow,{size:block.width*block.height})});animations.shakeScale=0;sc.clearRect(0,0,sheet.width,sheet.height)};
  const text=(t,x,y,u=1,c='#FFFFFF')=>bitmapText(ctx,t,x,y,u,c);
  function panel(player,own,x,y,scale,primary,now){
   drawBoard(bc,player.grid,360,720,{...own,blocks:player.blocks||[],animations:primary?animations:null,presentation:primary?presentation:null,activeAbility:player.activeAbility||own.activeAbility,now,mini:!primary});
   ctx.imageSmoothingEnabled=false;ctx.drawImage(board,Math.round(x),Math.round(y),Math.round(360*scale),Math.round(720*scale));
  }
  window.renderTutorial=(id,frame,index)=>{
   const now=frame.now;window.tutorialNow=now;
   animations.state(frame.own,now);
   for(const event of frame.events){const e=event.type==='clear'?{...event,type:'effect'}:event;animations.event(e,frame.boards[0].grid,frame.own.rise||0,now);if(e.type!=='garbage')presentation.trigger(e.ability||e.type,now,e)}
   presentation.meter(frame.own.flux||0,100,now);
   ctx.fillStyle='#090B10';ctx.fillRect(0,0,384,216);
   if(['duel','quad','teams','battle'].includes(id)){
    text(id==='battle'?'99 PLAYER BATTLE ROYALE':id==='duel'?'2P DUEL':id==='quad'?'4P FREE FOR ALL':'2V2 TEAMS',12,6,2,'#38FFFF');
    if(id==='duel'){frame.boards.forEach((p,i)=>{text(i?'OPPONENT':'YOU',66+i*156,27);panel(p,i?{}:frame.own,66+i*156,39,.225,i===0,now)})}
    else if(id==='battle'){
     panel(frame.boards[0],frame.own,12,30,.225,true,now);
     frame.boards.slice(1).forEach((p,i)=>panel(p,{},120+i%3*54,30+Math.floor(i/3)*54,.0666667,false,now));
     text('ALIVE',306,42);text(String(frame.remaining),306,54,2,'#FFB81C');text('99 SEATS',294,99);text('10 BOARDS',294,114);text('SHOWN',294,126);
    }else{
     const players=id==='teams'?[...frame.boards].sort((a,b)=>a.team.localeCompare(b.team)):frame.boards;
     players.forEach((p,i)=>{const primary=p.id===frame.boards[0].id;const color=id==='teams'?(p.team==='a'?'#38FFFF':'#FF6B97'):'#FFFFFF';text(id==='teams'?(p.team==='a'?'CYAN':'CORAL'):(primary?'YOU':'RIVAL '+i),12+i*94,30,1,color);panel(p,primary?frame.own:{},12+i*94,42,.2166667,primary,now)});
    }
    text('RECORDED CPU MATCH  -  LAST PLAYER OR TEAM WINS'.replaceAll('-',' '),12,204,1,'#94A3B8');
   }else{
    panel(frame.boards[0],frame.own,12,24,.25,true,now);
    text(id==='chains'?'SWAP AND CHAIN':id==='garbage'?'BREAK GLITCH':id.toUpperCase(),120,12,2,'#38FFFF');
    const notes={chains:['SWAP NEIGHBORS','MATCH 3 OR MORE','FALLING MATCHES','BUILD CHAINS'],garbage:['CLEAR BY A SLAB','FRACTURE THE BLOCK','TILES RELEASE','BOTTOM TO TOP'],pulse:[FLUX.pulse.cost+' FLUX','CANCEL ONE ROW','TEAM RESCUE','WHEN YOUR QUEUE IS EMPTY'],shift:[FLUX.shift.cost+' FLUX','REMOVE BOTTOM ROW','LOWER THE STACK','NO SCORE OR ATTACK'],surge:[FLUX.surge.cost+' FLUX',FLUX.surge.duration+' SECOND BOOST','STRONGER ATTACKS','MORE FLUX'],overdrive:[FLUX.max+' FLUX','HOLD FULL FOR '+FLUX.overdrive.hold+' SECONDS',FLUX.overdrive.duration+' SECOND BOOST','NO SURGE OVERLAP']};
    notes[id].forEach((line,i)=>text(line,120,42+i*15,1,i===0?'#FFB81C':'#FFFFFF'));
    text('FLUX '+Math.floor(frame.own.flux),120,117,2,'#38FFFF');
    const flux=Math.floor(frame.own.flux||0);ctx.fillStyle='#008299';ctx.fillRect(120,138,Math.round(flux*2.4),6);ctx.fillStyle='#090B10';for(let x=120;x<360;x+=24)ctx.fillRect(x,138,3,6);
    text('CHAIN X'+frame.own.chain,120,153,1,'#66FF1A');
    text('PENDING '+(frame.own.incoming||[]).reduce((sum,a)=>sum+a.amount,0),120,168,1,'#FFB81C');
    text(frame.own.activeAbility?'BOOST '+Math.ceil(frame.own.abilityRemaining)+' SECONDS':id==='overdrive'&&frame.own.flux===100?'HOLD '+Math.min(3,Math.floor(frame.own.maxFluxHeld))+' OF 3 SECONDS':'SCORE '+frame.own.score,120,183,1,'#FF6B97');
    text(['pulse','shift','surge','overdrive'].includes(id)?'EXAMPLE STARTS WITH FULL FLUX':'RECORDED ENGINE GAMEPLAY',12,207,1,'#94A3B8');
   }
   ctx.fillStyle='#38FFFF';ctx.fillRect(0,214,Math.round(384*(index+1)/80),2);
   sc.drawImage(canvas,index%10*384,Math.floor(index/10)*216);
   return canvas.toDataURL().split(',')[1];
  };
  window.finishTutorial=()=>sheet.toDataURL().split(',')[1];
 })()`);
 await mkdir('demo/tutorials',{recursive:true});await mkdir('godot/assets/tutorials',{recursive:true});
 for(const tutorial of TUTORIALS){
  const directory=`.web-smoke/tutorial-${tutorial.id}`;await mkdir(directory,{recursive:true});
  await window.webContents.executeJavaScript('window.startTutorial()');
  for(let index=0;index<clips[tutorial.id].length;index++){
   const png=await window.webContents.executeJavaScript(`window.renderTutorial(${JSON.stringify(tutorial.id)},${JSON.stringify(clips[tutorial.id][index])},${index})`);
   await writeFile(`${directory}/frame-${String(index).padStart(3,'0')}.png`,Buffer.from(png,'base64'));
  }
  execFileSync('ffmpeg',['-loglevel','error','-framerate','10','-i',`${directory}/frame-%03d.png`,'-filter_complex','[0:v]split[a][b];[a]palettegen=max_colors=256:reserve_transparent=0[p];[b][p]paletteuse=dither=none','-gifflags','offsetting','-loop','0','-y',`demo/tutorials/${tutorial.id}.gif`]);
  await copyFile(`${directory}/frame-040.png`,`demo/tutorials/${tutorial.id}.png`);
  const atlas=await window.webContents.executeJavaScript('window.finishTutorial()');
  await writeFile(`godot/assets/tutorials/${tutorial.id}.png`,Buffer.from(atlas,'base64'));
  console.log(`TUTORIAL_ASSET_OK ${tutorial.id}: 80 frames, GIF, still, matching native atlas`);
 }
 await writeFile('godot/assets/tutorials/catalog.json',JSON.stringify({width:384,height:216,columns:10,frames:80,fps:10,still:40,tutorials:TUTORIALS},null,2)+'\n');
 window.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
