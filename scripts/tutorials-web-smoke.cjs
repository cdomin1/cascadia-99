const {app,BrowserWindow}=require('electron');
const {mkdir,writeFile}=require('node:fs/promises');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
app.setPath('userData',resolve('.web-smoke/tutorial-qa-profile'));
app.commandLine.appendSwitch('disable-gpu');
if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
const timeout=setTimeout(()=>{console.error('Tutorial browser check timed out');app.exit(1)},60000);
app.whenReady().then(async()=>{
 const window=new BrowserWindow({width:900,height:800,show:true,webPreferences:{contextIsolation:true,sandbox:true,backgroundThrottling:false}});
 const execute=script=>window.webContents.executeJavaScript(script,true);
 const wait=async script=>{for(let i=0;i<100;i++){if(await execute(script))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timed out: '+script)};
 try{
  await window.loadURL(process.env.PANEL99_WEB_URL||'http://127.0.0.1:3002');
  await wait("!document.getElementById('play-cpu').disabled");
  await execute("document.getElementById('help').click()");await wait("document.getElementById('tutorial-topic')?.options.length===10");
  assert.equal(await execute("document.getElementById('help-dialog').textContent.includes('At 100%, press X')"),false);
  const topics=await execute("Array.from(document.getElementById('tutorial-topic').options,o=>o.value)");
  for(const id of topics){
   await execute(`document.getElementById('tutorial-topic').value=${JSON.stringify(id)};document.getElementById('tutorial-topic').dispatchEvent(new Event('change'));`);
   await wait("document.getElementById('tutorial-image').complete&&document.getElementById('tutorial-image').naturalWidth===384");
   assert.equal(await execute("document.getElementById('tutorial-image').src.includes('.gif')"),true);
   assert.ok((await execute("document.getElementById('tutorial-caption').textContent")).length>40);
  }
  await execute("document.getElementById('tutorial-pause').click()");assert.equal(await execute("document.getElementById('tutorial-image').src.includes('.png')"),true);
  await execute("document.getElementById('tutorial-pause').click()");assert.equal(await execute("document.getElementById('tutorial-image').src.includes('.gif')"),true);
  await execute("document.getElementById('flashing-effects').value='reduced';document.getElementById('flashing-effects').dispatchEvent(new Event('change'))");
  assert.equal(await execute("document.getElementById('tutorial-image').src.includes('.png')&&document.getElementById('tutorial-pause').disabled"),true);
  await execute("document.getElementById('flashing-effects').value='full';document.getElementById('flashing-effects').dispatchEvent(new Event('change'))");
  window.webContents.debugger.attach('1.3');await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await wait("document.getElementById('tutorial-image').src.includes('.png')&&document.getElementById('tutorial-pause').disabled");
  await window.webContents.debugger.sendCommand('Emulation.setEmulatedMedia',{features:[]});window.webContents.debugger.detach();
  await execute("document.getElementById('close-help').click()");assert.equal(await execute("document.getElementById('tutorial-image').src.includes('.png')"),true);
  for(const [width,height]of [[900,800],[360,640]]){
   window.setContentSize(width,height);await execute("document.getElementById('help').click()");
   await wait("document.getElementById('tutorial-image').complete&&document.getElementById('tutorial-image').naturalWidth===384");
   const fit=await execute("(()=>{const d=document.getElementById('help-dialog'),i=document.getElementById('tutorial-image');return {dialog:d.getBoundingClientRect().width,image:i.getBoundingClientRect().width,viewport:innerWidth}})()");
   assert.ok(fit.dialog<=fit.viewport);assert.ok(fit.image<fit.dialog);
   await mkdir('.web-smoke',{recursive:true});await writeFile(`.web-smoke/web-tutorials-${width}.png`,(await window.webContents.capturePage()).toPNG());
   await execute("document.getElementById('close-help').click()");
  }
  console.log('WEB_TUTORIAL_OK: ten GIFs/captions, pause, closed-dialog still, reduced-motion/flashing, desktop/mobile help');
  clearTimeout(timeout);window.destroy();app.quit();
 }catch(error){console.error(error);clearTimeout(timeout);app.exit(1)}
});
