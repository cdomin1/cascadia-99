const {app,BrowserWindow}=require('electron');
const {resolve}=require('node:path');
const {mkdir,writeFile}=require('node:fs/promises');
const assert=require('node:assert/strict');
app.setPath('userData',resolve('.web-smoke/phase1-profile'));
app.commandLine.appendSwitch('disable-gpu');
if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
const timer=setTimeout(()=>app.exit(1),60000);
app.whenReady().then(async()=>{
  const window=new BrowserWindow({width:1100,height:800,show:true,webPreferences:{sandbox:true,backgroundThrottling:false}});
  const execute=source=>window.webContents.executeJavaScript(source,true);
  const errors=[];window.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
  async function wait(expression){const deadline=Date.now()+12000;while(Date.now()<deadline){if(await execute(expression))return;await new Promise(r=>setTimeout(r,30));}throw Error('Timed out: '+expression);}
  try{
    await window.loadURL(process.env.PANEL99_WEB_URL);
    await window.webContents.executeJavaScript("document.getElementById('onboarding-skip')?.click()",true);
    await wait("!document.getElementById('play-cpu').disabled");
    for(const [kind,cost,key]of [['pulse',35,'X'],['shift',60,'C'],['surge',75,'V'],['overdrive',100,'B']]){
      await execute("document.getElementById('quick-mode').value='duel';document.getElementById('quick-mode').dispatchEvent(new Event('change'));document.getElementById('play-cpu').click()");
      await wait(`document.getElementById('arena').getAttribute('aria-busy')==='false'&&!document.getElementById('${kind}').disabled`);
      assert.equal(await execute("document.getElementById('flux-meter').getAttribute('aria-valuenow')"),'100');
      assert.ok((await execute(`document.getElementById('${kind}').textContent`)).includes(String(cost)));
      const audioBefore=await execute("(async()=>{const {effects}=await import('/sound.mjs');const {music}=await import('/music.mjs');return {played:effects.played,step:music.step,running:effects.status,playing:music.status.playing};})()");
      assert.equal(audioBefore.running,'running');assert.equal(audioBefore.playing,true);
      // Exercise the gameplay key path rather than calling a private client method.
      await execute(`document.dispatchEvent(new KeyboardEvent('keydown',{code:'Key${key}',key:'${key.toLowerCase()}',bubbles:true}))`);
      await wait(`document.getElementById('flux-meter').getAttribute('aria-valuenow')==='${100-cost}'`);
      if(kind==='surge'||kind==='overdrive')await wait(`document.getElementById('ability-timer').textContent.includes('${kind.toUpperCase()}')`);
      await wait("import('/sound.mjs').then(m=>m.effects.played>"+audioBefore.played+")");
      assert.ok(await execute("import('/music.mjs').then(m=>m.music.step>="+audioBefore.step+"&&m.music.status.playing)"));
      if(kind==='pulse')assert.equal(await execute("document.getElementById('garbage-count').textContent"),'6');
      await execute("document.getElementById('pause').click();document.getElementById('pause-settings').click()");
      for(const value of ['off','reduced','normal','maximum'])await execute(`document.getElementById('screen-shake').value='${value}';document.getElementById('screen-shake').dispatchEvent(new Event('change'))`);
      await execute("document.getElementById('screen-shake').value='off';document.getElementById('screen-shake').dispatchEvent(new Event('change'));document.getElementById('flashing-effects').value='reduced';document.getElementById('flashing-effects').dispatchEvent(new Event('change'));document.getElementById('close-effects').click();document.getElementById('resume').click()");
      assert.deepEqual(await execute("JSON.parse(localStorage.getItem('cascadia99-fx'))"),{shake:'off',flashing:'reduced',quality:'full',reducedMotion:false});
      await mkdir('.web-smoke',{recursive:true});
      await writeFile(`.web-smoke/phase1-${kind}.png`,(await window.webContents.capturePage()).toPNG());
      await execute("document.getElementById('leave-match').click()");
      await wait("!document.getElementById('entry').hidden");
    }
    window.webContents.debugger.attach('1.3');
    await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    assert.equal(await execute("matchMedia('(prefers-reduced-motion: reduce)').matches"),true);
    await window.webContents.reload();await wait("!document.getElementById('play-cpu').disabled");
    assert.equal(await execute("document.getElementById('screen-shake').value"),'off');assert.equal(await execute("document.getElementById('flashing-effects').value"),'reduced');
    assert.deepEqual(errors,[]);
    console.log('WEB_PHASE1_OK: four ability keyboard controls, authoritative costs, meter/countdowns, effects options, saved preferences, reduced-motion media, screenshots');
    clearTimeout(timer);app.quit();
  }catch(error){console.error(error);clearTimeout(timer);app.exit(1);}
});
