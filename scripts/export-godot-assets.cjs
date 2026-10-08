// Export the original web renderer's pixel art for the native Godot client.
const {app,BrowserWindow}=require('electron');
const {mkdir,writeFile,copyFile}=require('node:fs/promises');
const {resolve}=require('node:path');
app.setPath('userData',resolve('.web-smoke/godot-assets-profile'));app.commandLine.appendSwitch('disable-gpu');
if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true}});
 try{
  await win.loadURL(process.env.PANEL99_WEB_URL||'http://127.0.0.1:3000');await mkdir('godot/assets',{recursive:true});
  await mkdir('godot/assets/fonts/kode-mono',{recursive:true});for(const name of ['KodeMono-Variable.ttf','OFL.txt'])await copyFile('fonts/kode-mono/'+name,'godot/assets/fonts/kode-mono/'+name);await copyFile('logo.svg','godot/assets/logo.svg');
  console.log('GODOT_ASSETS_OK: canonical procedural artwork retained, wordmark and licensed font');
 }finally{win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
