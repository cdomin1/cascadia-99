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
  const data=await win.webContents.executeJavaScript(`(async()=>{
   const {drawBoard}=await import('/visuals.mjs'),{TRACKS}=await import('/music.mjs'),tiles=[];
   for(const id of Object.keys(CascadiaPalettes)){
    document.documentElement.dataset.palette=id;
    const source=document.createElement('canvas');source.width=360;source.height=720;
    const grid=Array.from({length:12},()=>Array(6).fill(0));grid[11]=[1,2,3,4,0,0];drawBoard(source.getContext('2d'),grid,360,720,{now:0});
    for(let tile=1;tile<=4;tile++){const canvas=document.createElement('canvas');canvas.width=60;canvas.height=60;canvas.getContext('2d').drawImage(source,(tile-1)*60,660,60,60,0,0,60,60);tiles.push({name:id+'-'+tile,png:canvas.toDataURL('image/png').split(',')[1]});}
   }
   return {palettes:CascadiaPalettes,tracks:TRACKS,tiles};
  })()`);
  for(const t of data.tiles)await writeFile('godot/assets/'+t.name+'.png',Buffer.from(t.png,'base64'));
  await writeFile('godot/assets/palettes.json',JSON.stringify(data.palettes,null,2)+'\n');await writeFile('godot/assets/tracks.json',JSON.stringify(data.tracks,null,2)+'\n');
  await copyFile('fonts/VT323-Regular.ttf','godot/assets/VT323-Regular.ttf');await copyFile('fonts/OFL.txt','godot/assets/OFL.txt');await copyFile('logo.svg','godot/assets/logo.svg');
  console.log('GODOT_ASSETS_OK: 20 pixel tiles, five palettes, four compositions, wordmark and licensed font');
 }finally{win.destroy();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
