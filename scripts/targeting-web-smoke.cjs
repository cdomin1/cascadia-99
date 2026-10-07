const {app,BrowserWindow}=require('electron');const {resolve}=require('node:path');const {mkdir,writeFile}=require('node:fs/promises');
app.setPath('userData',resolve('.web-smoke/targeting-profile'));app.commandLine.appendSwitch('disable-gpu');if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
app.whenReady().then(async()=>{try{
 const window=new BrowserWindow({show:true,width:1280,height:900,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false}});
 const execute=s=>window.webContents.executeJavaScript(s,true);
 async function wait(expression){const end=Date.now()+12000;while(Date.now()<end){if(await execute(expression))return;await new Promise(r=>setTimeout(r,20));}throw Error('Timed out '+expression);}
 await window.loadURL(process.env.PANEL99_WEB_URL);await wait("!document.getElementById('play-cpu').disabled");
 for(const bots of [1,98]){
  await execute(`document.getElementById('quick-mode').value='battle';document.getElementById('quick-count').value='${bots}';document.getElementById('play-cpu').click()`);
  await wait(`document.querySelectorAll('.rival').length===${bots}`);
  await wait("!!document.querySelector('.rival.attack-hit')");
  if(bots===1)await wait("!!document.querySelector('.rival.attack-source')");
  await wait("!!document.querySelector('.rival.target')");
  if(!await execute("[...document.querySelectorAll('.rival small')].every(el=>/^\\d+$/.test(el.textContent))"))throw Error('Player numbers missing');
  if(bots===98){await mkdir('.web-smoke',{recursive:true});await writeFile('.web-smoke/targeting-web99.png',(await window.webContents.capturePage()).toPNG());}
  await execute("document.getElementById('leave-match').click()");await wait("!document.getElementById('entry').hidden");
 }
 console.log('WEB_TARGETING_FLOW_OK: real confirmed incoming/outgoing, amber target, player numbers and 99-seat layout');app.exit(0);
}catch(error){console.error(error);app.exit(1);}});
