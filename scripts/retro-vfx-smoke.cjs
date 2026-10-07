// Recorded presentation fixtures only; no debug endpoint or gameplay mutations.
const {app,BrowserWindow}=require('electron');
const {readFile,mkdir,writeFile}=require('node:fs/promises');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
app.setPath('userData',resolve('.web-smoke/retro-profile'));
app.commandLine.appendSwitch('disable-gpu');
if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
const timeout=setTimeout(()=>{console.error('Retro browser check timed out');app.exit(1)},60000);
app.whenReady().then(async()=>{
 const window=new BrowserWindow({width:700,height:850,show:true,webPreferences:{contextIsolation:true,sandbox:true,backgroundThrottling:false}});
 try{
  await window.loadURL(process.env.PANEL99_WEB_URL||'http://127.0.0.1:3000');
  const fixtures=JSON.parse(await readFile('godot/tests/retro-fixtures.json','utf8'));
  const result=await window.webContents.executeJavaScript(`(async()=>{
   try {
   const fixtures=${JSON.stringify(fixtures)};
   const {drawBoard,BoardAnimations}=await import('/visuals.mjs');
   const {PresentationEffects}=await import('/presentation-effects.mjs');
   const canvas=document.createElement('canvas');canvas.width=360;canvas.height=720;
   document.body.append(canvas);canvas.style.cssText='width:360px;height:720px;image-rendering:auto;margin:12px';
   const ctx=canvas.getContext('2d'),grid=Array.from({length:12},(_,y)=>Array.from({length:6},(_,x)=>y>=9?1+(x+y)%4:0));
   const captures=[],timings=[];
   for(const fixture of fixtures){
    const presentation=new PresentationEffects({reducedMotion:!!fixture.reduced,flashing:fixture.flashing||'full',shake:fixture.shake||'normal'});
    let renderNow=1000;
    const animations=new BoardAnimations({reducedMotion:!!fixture.reduced,onImpact:block=>presentation.trigger('garbage',renderNow,{size:block.width*block.height})});
    animations.flashing=fixture.flashing!=='reduced';animations.shakeScale=0;
    const block={id:1,x:0,y:7,width:6,height:2,state:fixture.state||'idle'};
    const state={phase:'clear',matches:[54,55,56],chain:fixture.chain||1,score:0,fallSerial:0,cursor:{x:2,y:10}};
    animations.state(state,1000);
    const kind=fixture.kind,event={type:['shift','surge','overdrive'].includes(kind)?'ability':kind,ability:kind,chain:fixture.chain||1,count:fixture.count||3,positions:[54,55,56],blocks:[block]};
    animations.event(event,grid,0,1000);
    if(kind!=='garbage')presentation.trigger(kind,1000,event);
    presentation.meter(fixture.flux||75,100,1000);
    const now=1000+(fixture.age||.096)*1000,options={...state,now,animations,presentation,blocks:[block],activeAbility:['surge','overdrive'].includes(kind)?kind:null};
    renderNow=now;drawBoard(ctx,grid,360,720,options);
    captures.push({name:fixture.name,png:canvas.toDataURL(),offset:presentation.offset(now)});
    for(let frame=0;frame<30;frame++){const start=performance.now();renderNow=now+frame*16;drawBoard(ctx,grid,360,720,{...options,now:now+frame*16});timings.push(performance.now()-start);}
   }
   const motion=new BoardAnimations();motion.event({type:'swap',x:1,y:10,left:1,right:2},grid,0,1000);
   motion.event({type:'garbage',blocks:[{id:1,x:0,y:7,width:6,height:2}]},grid,0,1000);
   const drop=[1000,1120,1240].map(t=>motion.blockY({id:1,x:0,y:7,width:6,height:2},t));
   timings.sort((a,b)=>a-b);
   return {captures,drop,p95:timings[Math.floor(timings.length*.95)],samples:timings.length,swap:motion.swap};
   } catch(error) { return {error:error.stack}; }
  })()`,true);
  if(result.error)throw Error(result.error);
  await mkdir('.web-smoke',{recursive:true});
  assert.equal(result.captures.length,18);assert.deepEqual(result.drop,[-2,.25,7]);assert.equal(result.swap.left,1);
  for(const capture of result.captures){assert.equal(Math.abs(capture.offset.x)%3,0);assert.equal(Math.abs(capture.offset.y)%3,0);await writeFile(`.web-smoke/retro-web-${capture.name}.png`,Buffer.from(capture.png.split(',')[1],'base64'));}
  assert.deepEqual(result.captures.find(c=>c.name==='reduced-motion').offset,{x:0,y:0});
  assert.deepEqual(result.captures.find(c=>c.name==='reduced-flash-off-shake').offset,{x:0,y:0});
  assert.ok(result.p95<16.7,`Single-board draw budget exceeded: ${result.p95}ms`);
  console.log(`WEB_VECTOR_EFFECTS_OK fixtures=${result.captures.length} draw-p95-ms=${result.p95.toFixed(3)} samples=${result.samples} (local single-board drawing only)`);
  clearTimeout(timeout);window.destroy();app.quit();
 }catch(error){console.error(error);clearTimeout(timeout);app.exit(1)}
});
