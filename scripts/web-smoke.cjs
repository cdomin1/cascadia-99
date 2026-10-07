// Browser QA only: loads the running web game, without starting the desktop app.
const {app,BrowserWindow}=require('electron');
const {mkdir,writeFile}=require('node:fs/promises');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
app.setPath('userData',resolve('.web-smoke/profile'));
app.commandLine.appendSwitch('disable-gpu');
if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
const timeout=setTimeout(()=>{console.error('Web browser check timed out.');app.exit(1);},90000);
app.whenReady().then(async()=>{
  const window=new BrowserWindow({width:1100,height:800,show:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,backgroundThrottling:false}});
  const execute=script=>window.webContents.executeJavaScript(script,true);
  async function waitFor(expression){const deadline=Date.now()+10000;while(Date.now()<deadline){if(await execute(expression))return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error(`Timed out: ${expression}`);}
  try{
    await window.loadURL(process.env.PANEL99_WEB_URL||'http://127.0.0.1:3000');
    await waitFor("!document.getElementById('play-cpu').disabled");
    await execute("localStorage.removeItem('panel99-theme');localStorage.removeItem('cascadia99-palette');localStorage.removeItem('cascadia99-track')");
    await window.webContents.reload();
    await waitFor("!document.getElementById('play-cpu').disabled");
    const initialTheme=await execute("document.documentElement.dataset.theme");
    assert.ok(['light','dark'].includes(initialTheme));
    await execute("document.getElementById('theme').click()");
    const chosenTheme=initialTheme==='dark'?'light':'dark';
    assert.equal(await execute("document.documentElement.dataset.theme"),chosenTheme);
    assert.equal(await execute("localStorage.getItem('panel99-theme')"),chosenTheme);
    await window.webContents.reload();
    await waitFor("!document.getElementById('play-cpu').disabled");
    assert.equal(await execute("document.documentElement.dataset.theme"),chosenTheme);
    console.log('WEB_THEME_OK: theme toggle and persistence across reload');
    const paletteResults=await execute(`(async()=>{
      const {drawBoard}=await import('/visuals.mjs'),canvas=document.createElement('canvas');canvas.width=360;canvas.height=720;
      const grid=Array.from({length:12},()=>Array(6).fill(0));grid[11]=[1,2,3,4,0,0];const output=[];
      for(const id of Object.keys(CascadiaPalettes)){const select=document.getElementById('palette');select.value=id;select.dispatchEvent(new Event('change'));drawBoard(canvas.getContext('2d'),grid,360,720,{now:0,blocks:[{id:1,x:0,y:7,width:6,height:2,state:'idle'}]});output.push({id,selected:document.documentElement.dataset.palette,bg:getComputedStyle(document.documentElement).getPropertyValue('--bg'),pixels:canvas.toDataURL()});}
      return output;
    })()`);
    assert.equal(paletteResults.length,5);assert.equal(new Set(paletteResults.map(p=>p.pixels)).size,5);assert.equal(new Set(paletteResults.map(p=>p.bg)).size,5);for(const p of paletteResults)assert.equal(p.selected,p.id);
    await window.webContents.reload();await waitFor("!document.getElementById('play-cpu').disabled");assert.equal(await execute("document.getElementById('palette').value"),'frost');
    await execute("document.getElementById('palette').value='arcade';document.getElementById('palette').dispatchEvent(new Event('change'));document.getElementById('track').value='coast';document.getElementById('track').dispatchEvent(new Event('change'));");
    await waitFor("localStorage.getItem('cascadia99-track')==='coast'");await window.webContents.reload();await waitFor("!document.getElementById('play-cpu').disabled");assert.equal(await execute("document.getElementById('track').value"),'coast');
    await execute("document.getElementById('track').value='neon';document.getElementById('track').dispatchEvent(new Event('change'))");
    console.log('WEB_PALETTE_OK: five distinct site/tile/slab palettes, immediate switching, and saved palette/track choices');

    await execute("document.getElementById('preview-music').click()");
    await waitFor("document.getElementById('preview-music').getAttribute('aria-pressed')==='true' && import('/music.mjs').then(({music})=>music.status.playing)");
    assert.equal(await execute("import('/music.mjs').then(({music})=>music.status.track)"),'Neon Afterglow');
    for(const id of ['midnight','coast','chrome','neon']){
      await execute(`document.getElementById('track').value=${JSON.stringify(id)};document.getElementById('track').dispatchEvent(new Event('change'));`);
      await waitFor(`import('/music.mjs').then(({music})=>music.status.playing&&music.status.trackId===${JSON.stringify(id)})`);
      const rms=await execute(`(async()=>{const {effects}=await import('/sound.mjs'),a=effects.context.createAnalyser();a.fftSize=2048;effects.master.connect(a);await new Promise(r=>setTimeout(r,450));const data=new Float32Array(a.fftSize);a.getFloatTimeDomainData(data);effects.master.disconnect(a);return Math.sqrt(data.reduce((s,n)=>s+n*n,0)/data.length);})()`);
      assert.ok(rms>1e-5,`Selected track ${id} must remain audible`);
    }
    console.log('WEB_TRACKS_OK: all four tracks switch live and remain audible');
    await execute("document.getElementById('preview-music').click()");assert.equal(await execute("import('/music.mjs').then(({music})=>music.status.playing)"),false);
    console.log('WEB_SOUNDTRACK_OK: original synthwave preview starts and stops on the homepage');
    await execute("document.getElementById('name').value='Web tester';document.getElementById('quick-count').value='98';document.getElementById('quick-difficulty').value='easy';document.getElementById('play-cpu').click();");
    await waitFor("document.getElementById('rivals').children.length===98 && document.getElementById('board-overlay').hidden");
    const audio=await execute("import('/sound.mjs').then(({effects})=>({status:effects.status,played:effects.played}))");
    assert.equal(audio.status,'running');assert.ok(audio.played>0);
    const soundtrack=await execute(`(async()=>{
      const {music}=await import('/music.mjs'),{effects}=await import('/sound.mjs');
      const analyser=effects.context.createAnalyser();analyser.fftSize=2048;effects.master.connect(analyser);
      await new Promise(resolve=>setTimeout(resolve,400));const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);effects.master.disconnect(analyser);
      return {...music.status,rms:Math.sqrt(data.reduce((sum,n)=>sum+n*n,0)/data.length)};
    })()`);
    assert.equal(soundtrack.playing,true);assert.ok(soundtrack.bpm<100);assert.ok(soundtrack.rms>.00001,'Music must produce audible output');
    await execute("document.getElementById('music').click()");
    assert.equal(await execute("import('/music.mjs').then(({music})=>music.status.playing)"),false);
    await execute("document.getElementById('music').click()");
    await waitFor("import('/music.mjs').then(({music})=>music.status.playing)");
    window.webContents.debugger.attach('1.3');
    await mkdir('.web-smoke',{recursive:true});
    for(const [width,height] of [[1440,900],[1024,768],[800,620],[760,620],[640,480],[390,844],[360,640]]){
      await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
      await execute('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
      const geometry=await execute(`(()=>{
        const items={};for(const selector of ['.canvas-wrap','.touch-controls','.keyboard-hint','.arena-heading','.match-stats','.rivals-panel','.tactics','header','#theme','#help','#pulse','#palette','#track']){const r=document.querySelector(selector).getBoundingClientRect();items[selector]={top:r.top,left:r.left,bottom:r.bottom,right:r.right,width:r.width,height:r.height};}
        return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,items};
      })()`);
      assert.ok(geometry.scrollWidth<=width+1,`Page overflows horizontally at ${width}×${height}: ${JSON.stringify(geometry)}`);
      assert.ok(geometry.scrollHeight<=height+1,`Page overflows vertically at ${width}×${height}: ${JSON.stringify(geometry)}`);
      for(const [name,r] of Object.entries(geometry.items)){
        assert.ok(r.top>=0&&r.left>=0&&r.right<=width+1&&r.bottom<=height+1,`${name} is clipped at ${width}×${height}: ${JSON.stringify(r)}`);
      }
      const board=geometry.items['.canvas-wrap'];assert.ok(Math.abs(board.width/board.height-.5)<.015,'Board proportions changed');
      await execute("document.getElementById('theme').click()");
      const screenshot=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'});
      await writeFile(`.web-smoke/battle-${width}x${height}.png`,Buffer.from(screenshot.data,'base64'));
      console.log(`WEB_LAYOUT_OK ${width}×${height}: ${Math.round(board.width)}×${Math.round(board.height)} board, all play controls visible`);
    }
    window.webContents.debugger.detach();
    await execute("document.getElementById('leave-match').click();");
    await waitFor("!document.getElementById('entry').hidden && !document.body.classList.contains('in-match')");
    assert.equal(await execute("import('/music.mjs').then(({music})=>music.status.playing)"),false);
    window.webContents.debugger.attach('1.3');
    for(const [mode,count]of [['duel',1],['quad',3],['teams',3]]){
      await execute(`document.getElementById('quick-mode').value='${mode}';document.getElementById('quick-mode').dispatchEvent(new Event('change'));document.getElementById('quick-rules').value='rush';document.getElementById('play-cpu').click();`);
      await waitFor(`!document.getElementById('arena').hidden && document.body.classList.contains('small-match') && document.getElementById('rivals').children.length===${count} && document.getElementById('board-overlay').hidden && document.getElementById('match-label').textContent.startsWith('${mode==='duel'?'2P VS':mode==='quad'?'4P VS':'2V2 TEAMS'}')`);
      assert.equal(await execute("document.body.classList.contains('small-match')"),true);
      if(mode==='teams'){
        assert.equal(await execute("document.querySelectorAll('.rival.ally').length"),1);
        assert.equal(await execute("document.querySelector('.rival.ally').disabled"),true);
        assert.equal(await execute("document.getElementById('team-status').hidden"),false);
      }
      for(const [width,height]of [[1024,768],[640,480],[360,640]]){
        await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
        await execute('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
        const layout=await execute(`(()=>{const selectors=['.canvas-wrap','.touch-controls','#pulse','#theme','#help','#palette','#track'];return {width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,items:selectors.map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {selector,left:r.left,right:r.right,top:r.top,bottom:r.bottom};})};})()`);
        assert.ok(layout.width<=width+1&&layout.height<=height+1,`${mode} page overflow: ${JSON.stringify(layout)}`);
        for(const r of layout.items)assert.ok(r.left>=0&&r.top>=0&&r.right<=width+1&&r.bottom<=height+1,`${mode} ${r.selector} clipped: ${JSON.stringify(r)}`);
        const field=await execute(`(()=>{const r=document.getElementById('rivals').getBoundingClientRect();return [...document.querySelectorAll('.rival')].map(el=>({bottom:el.getBoundingClientRect().bottom,limit:r.bottom}));})()`);
        for(const r of field)assert.ok(r.bottom<=r.limit+1,`${mode} opponent board needs scrolling at ${width}×${height}: ${JSON.stringify(r)}`);
        const shot=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'});await writeFile(`.web-smoke/${mode}-${width}x${height}.png`,Buffer.from(shot.data,'base64'));
      }
      await execute("document.getElementById('leave-match').click()");await waitFor("!document.getElementById('entry').hidden");
      console.log(`WEB_MODE_OK: ${mode}, ${count} CPUs, Rush rules, responsive boards and Pulse control`);
    }
    for(const [width,height]of [[1440,900],[1366,768],[1280,720],[1024,768],[390,844]]){
      await window.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
      await execute('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
      const demo=await execute("(()=>{const r=document.querySelector('.gameplay-demo').getBoundingClientRect();return {bottom:r.bottom,logos:document.querySelectorAll('.pixel-wordmark').length,scrollWidth:document.documentElement.scrollWidth};})()");
      assert.equal(demo.logos,1,'The homepage should show its logo once');assert.ok(demo.scrollWidth<=width+1,'Homepage horizontal overflow');assert.ok(demo.bottom<=height,`Demo falls below the fold at ${width}×${height}: ${JSON.stringify(demo)}`);
      const card=await execute(`(()=>{const c=document.querySelector('.entry-card').getBoundingClientRect();return {top:c.top,bottom:c.bottom,height:c.height,controls:[...document.querySelectorAll('.entry-card input,.entry-card select,.entry-card button')].map(el=>{const r=el.getBoundingClientRect();return {id:el.id,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};})};})()`);
      if(width>760){assert.ok(card.bottom+6<=height,`Full setup card falls below fold at ${width}×${height}: ${JSON.stringify(card)}`);console.log(`WEB_FORM_OK ${width}×${height}: entire ${Math.round(card.height)}px setup card above fold`);}
      for(const r of card.controls){assert.ok(r.left>=0&&r.right<=width,`Form control overflows: ${JSON.stringify(r)}`);assert.ok(r.height>=36,`Form control too small: ${JSON.stringify(r)}`);}
      const home=await window.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png'});await writeFile(`.web-smoke/homepage-${width}x${height}.png`,Buffer.from(home.data,'base64'));
      console.log(`WEB_HOME_OK: one logo and full GIF above fold at ${width}×${height}`);
    }
    const retro=await execute(`(async()=>{
      const {drawBoard,ditherPixel,TILE_STYLES}=await import('/visuals.mjs');
      const densities=[.25,.5,.75].map(d=>Array.from({length:16},(_,i)=>ditherPixel(i%4,Math.floor(i/4),d)).filter(Boolean).length);
      const canvas=document.createElement('canvas');canvas.width=360;canvas.height=720;const ctx=canvas.getContext('2d'),grid=Array.from({length:12},()=>Array(6).fill(0));
      drawBoard(ctx,grid,360,720,{now:0});const pixels=ctx.getImageData(0,0,4,4).data;
      const background=Array.from({length:16},(_,i)=>Array.from(pixels.slice(i*4,i*4+4)).join(','));
      grid[11]=[1,2,3,4,0,0];drawBoard(ctx,grid,360,720,{now:0});
      const allowed=new Set(['#090B10','#141824','#000000','#FFFFFF',...TILE_STYLES.slice(1).flatMap(t=>[t.color,t.step,t.tint])].map(h=>h.toLowerCase()));
      let unexpected=0,translucent=0;const tilePixels=ctx.getImageData(0,660,240,60).data;
      for(let i=0;i<tilePixels.length;i+=4){if(tilePixels[i+3]!==255)translucent++;const hex='#'+[...tilePixels.slice(i,i+3)].map(n=>n.toString(16).padStart(2,'0')).join('');if(!allowed.has(hex))unexpected++;}
      return {densities,light:background.filter(p=>p==='20,24,36,255').length,dark:background.filter(p=>p==='9,11,16,255').length,unexpected,translucent};
    })()`);
    assert.deepEqual(retro.densities,[4,8,12]);assert.equal(retro.light,4);assert.equal(retro.dark,12);assert.equal(retro.unexpected,0,'Tile surfaces must use hard palette colors');assert.equal(retro.translucent,0);
    console.log('WEB_DITHER_OK: exact Bayer densities, opaque stepped tile palettes, and 25% background stipple');
    const gallery=await execute(`(async()=>{
      const {drawBoard}=await import('/visuals.mjs');
      const source=document.createElement('canvas');source.width=360;source.height=720;const grid=Array.from({length:12},()=>Array(6).fill(0));grid[11]=[1,2,3,4,0,0];drawBoard(source.getContext('2d'),grid,360,720);
      const out=document.createElement('canvas');out.width=480;out.height=280;const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#0F1219';c.fillRect(0,0,480,280);c.fillStyle='#F8F9FA';c.font='bold 13px sans-serif';c.fillText('FOUR SHAPES / COLOR',24,25);
      const labels=['Skull','Cyber-Eye','Radiation','Twin Bolts'],masks=[];
      for(let n=0;n<4;n++){c.drawImage(source,n*60,660,60,60,24+n*112,40,92,92);c.font='11px sans-serif';c.fillText(labels[n],24+n*112,149);const pixels=source.getContext('2d').getImageData(n*60,660,60,60).data;masks.push(Array.from({length:3600},(_,i)=>(n===2 ? i%60>=14&&i%60<46&&Math.floor(i/60)>=14&&Math.floor(i/60)<46&&pixels[i*4]<20&&pixels[i*4+1]<80&&pixels[i*4+2]===0 : pixels[i*4]===255&&pixels[i*4+1]===255&&pixels[i*4+2]===255)?'1':'0').join(''));}
      c.fillStyle='#F8F9FA';c.font='bold 13px sans-serif';c.fillText('SAME SHAPES / GRAYSCALE',24,181);c.filter='grayscale(1)';for(let n=0;n<4;n++)c.drawImage(source,n*60,660,60,60,24+n*112,195,76,76);
      return {png:out.toDataURL('image/png').split(',')[1],unique:new Set(masks).size,whiteCounts:masks.map(mask=>[...mask].filter(v=>v==='1').length)};
    })()`);
    assert.equal(gallery.unique,4,'Glyphs must retain distinct pixel silhouettes');for(const count of gallery.whiteCounts)assert.ok(count>20,'Pixel glyph must remain visible');await writeFile('.web-smoke/tiles-accessibility.png',Buffer.from(gallery.png,'base64'));
    await execute("document.getElementById('demo-pause').click()");
    await waitFor("document.getElementById('homepage-demo').currentSrc&&new URL(document.getElementById('homepage-demo').currentSrc).pathname==='/demo/gameplay.png'");
    assert.equal(await execute("document.getElementById('demo-pause').getAttribute('aria-pressed')"),'true');
    await execute("document.getElementById('demo-pause').click()");
    await waitFor("document.getElementById('homepage-demo').currentSrc&&new URL(document.getElementById('homepage-demo').currentSrc).pathname==='/demo/gameplay.gif'");
    await execute("document.getElementById('flashing-effects').value='reduced';document.getElementById('flashing-effects').dispatchEvent(new Event('change'))");
    await waitFor("document.getElementById('homepage-demo').src.includes('.png')&&document.getElementById('demo-pause').disabled");
    await execute("document.getElementById('flashing-effects').value='full';document.getElementById('flashing-effects').dispatchEvent(new Event('change'))");
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await waitFor("document.querySelector('.gameplay-demo img').currentSrc&&new URL(document.querySelector('.gameplay-demo img').currentSrc).pathname==='/demo/gameplay.png'");
    window.webContents.debugger.detach();
    assert.equal(await execute("document.getElementById('demo-pause').disabled"),true);
    console.log('WEB_SHOWCASE_OK: pause/play, reduced flashing and reduced-motion stills');
    console.log('WEB_VISUAL_OK: four distinct pixel silhouettes, grayscale preview, and reduced-motion still');
    console.log('WEB_SMOKE_OK: 98 CPUs, sound, audible adaptive music, music mute, seven viewport sizes, all VS/team modes, and return to menu');
  }finally{clearTimeout(timeout);window.destroy();app.quit();}
}).catch(error=>{console.error(error);app.exit(1);});
