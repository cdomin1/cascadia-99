import {app,BrowserWindow,Menu,ipcMain,dialog,session} from 'electron';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {createGameServer} from '../server.mjs';
import {serverAddress} from './address.mjs';

let game,window,localOrigin,currentOrigin,quitting=false;
const smoke=process.argv.includes('--smoke-test')&&!app.isPackaged;
if(smoke){
  const profile=process.env.PANEL99_SMOKE_PROFILE;
  if(profile)app.setPath('userData',resolve(profile));
}
// Retain the existing profile so the rename preserves preferences and records.
app.setName('VEXELON 99');
if(!smoke)app.setPath('userData',join(app.getPath('appData'),'Cascadia 99'));
const lock=app.requestSingleInstanceLock();
if(!lock)app.quit();
else {
  app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus();}});
  app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
  app.on('activate',()=>{if(!window&&!quitting)openWindow();});
  app.on('before-quit',event=>{
    if(quitting)return;
    event.preventDefault();quitting=true;
    Promise.resolve(game?.close()).finally(()=>app.quit());
  });
  app.whenReady().then(async()=>{
    // The bundled server also lets friends join over the local network.
    // Port zero gives each app a free port without colliding with browser previews.
    game=createGameServer({port:0,host:'0.0.0.0',desktop:true});
    localOrigin=await game.listen();currentOrigin=localOrigin;
    session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
    session.defaultSession.setPermissionCheckHandler(()=>false);
    function trusted(event){return event.sender===window?.webContents&&event.senderFrame===window.webContents.mainFrame&&new URL(event.senderFrame.url).origin===currentOrigin;}
    ipcMain.handle('panel:connect',async(event,address)=>{
      if(!trusted(event))throw new Error('This request is not from the game window.');
      await navigate(serverAddress(address));
    });
    ipcMain.handle('panel:local',async event=>{
      if(!trusted(event))throw new Error('This request is not from the game window.');
      await navigate(localOrigin);
    });
    const menu=[
      ...(process.platform==='darwin'?[{role:'appMenu'}]:[]),
      {label:'Game',submenu:[
        {label:'Local CPU play',click:()=>navigate(localOrigin)},
        {label:'Connect to game server…',click:()=>window?.webContents.executeJavaScript("document.getElementById('server-dialog')?.showModal()")},
        {type:'separator'},
        {role:process.platform==='darwin'?'close':'quit'}
      ]},
      {role:'editMenu'},
      {label:'View',submenu:[{role:'reload'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{type:'separator'},{role:'togglefullscreen'}]}
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
    await openWindow();
    if(smoke)await smokeTest();
  }).catch(error=>{
    console.error(error);
    if(!smoke)dialog.showErrorBox('VEXELON 99 could not start',error.message);
    app.exit(1);
  });
}

async function openWindow(){
  window=new BrowserWindow({
    title:'VEXELON 99',width:1440,height:1040,minWidth:760,minHeight:620,
    backgroundColor:'#0d1515',show:false,
    icon:join(app.getAppPath(),'desktop/assets/icon.png'),
    webPreferences:{preload:join(app.getAppPath(),'desktop/preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,backgroundThrottling:!smoke}
  });
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  const restrict=(event,url)=>{try{if(new URL(url).origin!==currentOrigin)event.preventDefault();}catch{event.preventDefault();}};
  window.webContents.on('will-navigate',restrict);window.webContents.on('will-redirect',restrict);
  window.on('closed',()=>{window=null;});
  window.once('ready-to-show',()=>window.show());
  await window.loadURL(currentOrigin);
}

async function navigate(origin){
  if(!window)return;
  const previous=currentOrigin;
  currentOrigin=origin;
  try{await window.loadURL(origin);}catch(error){currentOrigin=previous;await window.loadURL(previous);throw new Error('Could not reach that game server. Check the address and network connection.');}
}

async function smokeTest(){
  const output=resolve(process.env.PANEL99_SMOKE_OUTPUT||'.desktop-smoke');
  await mkdir(output,{recursive:true});
  const execute=script=>window.webContents.executeJavaScript(script,true);
  async function waitFor(expression,timeout=12000){
    const deadline=Date.now()+timeout;
    while(Date.now()<deadline){if(await execute(expression))return;await new Promise(resolve=>setTimeout(resolve,100));}
    throw new Error(`Desktop smoke check timed out: ${expression}`);
  }
  await waitFor("!document.getElementById('play-cpu').disabled");
  if(app.getName()!=='VEXELON 99'||!window.getTitle().startsWith('VEXELON 99'))throw new Error('Desktop branding mismatch');
  console.log('Desktop smoke: home connected');
  const isolation=await execute("typeof process === 'undefined' && typeof require === 'undefined' && !!window.panelDesktop");
  if(!isolation)throw new Error('Renderer isolation check failed.');
  await writeFile(join(output,'home.png'),(await window.webContents.capturePage()).toPNG());
  console.log('Desktop smoke: starting CPU battle');
  await execute("document.getElementById('name').value='Desktop tester'; document.getElementById('quick-count').value='9'; document.getElementById('play-cpu').click()");
  await waitFor("!document.getElementById('arena').hidden && document.getElementById('rivals').children.length===9");
  await waitFor("document.getElementById('board-overlay').hidden");
  console.log('Desktop smoke: battle started');
  const audio=await execute("import('/sound.mjs').then(async ({effects})=>{await effects.unlock();effects.play('swap');return {status:effects.status,played:effects.played,enabled:effects.enabled};})");
  if(audio.status!=='running'||!audio.enabled||audio.played<1)throw new Error('Desktop sound effects check failed.');
  window.webContents.sendInputEvent({type:'keyDown',keyCode:'Right'});
  window.webContents.sendInputEvent({type:'keyUp',keyCode:'Right'});
  window.webContents.sendInputEvent({type:'keyDown',keyCode:'Space'});
  window.webContents.sendInputEvent({type:'keyUp',keyCode:'Space'});
  await new Promise(resolve=>setTimeout(resolve,1500));
  await writeFile(join(output,'battle.png'),(await window.webContents.capturePage()).toPNG());
  await execute("document.getElementById('leave-match').click();");
  await waitFor("!document.getElementById('entry').hidden");
  await execute("document.getElementById('create').click();");
  await waitFor("!document.getElementById('lobby').hidden");
  await execute("document.getElementById('bot-count').value='3'; document.getElementById('bot-difficulty').value='hard'; document.getElementById('apply-bots').click();");
  await waitFor("document.getElementById('players-list').children.length===4 && !document.getElementById('start').disabled");
  await writeFile(join(output,'lobby.png'),(await window.webContents.capturePage()).toPNG());
  console.log('DESKTOP_SMOKE_OK: isolated renderer, offline CPU battle, sound effects, keyboard input, and mixed-room lobby');
  app.quit();
}
