const {app,BrowserWindow}=require('electron');
const fs=require('node:fs/promises');
app.commandLine.appendSwitch('disable-gpu');app.commandLine.appendSwitch('ozone-platform','x11');
app.whenReady().then(async()=>{try{
const w=new BrowserWindow({width:1000,height:850,show:true,webPreferences:{sandbox:true,contextIsolation:true}});
await w.loadURL(process.env.PANEL99_WEB_URL);
const result=await w.webContents.executeJavaScript(`(async()=>{const {drawBoard}=await import('/visuals.mjs');const c=document.getElementById('board'),ctx=c.getContext('2d');document.getElementById('entry').hidden=true;document.getElementById('arena').hidden=false;const grid=Array.from({length:12},(_,y)=>Array.from({length:6},(_,x)=>y<5?0:1+(x+y)%4));drawBoard(ctx,grid,360,720,{cursor:{x:2,y:9},now:0,reducedMotion:true});return c.toDataURL();})()`);
await fs.mkdir('.web-smoke',{recursive:true});await fs.writeFile('.web-smoke/vector-web.png',Buffer.from(result.split(',')[1],'base64'));
console.log('VECTOR_WEB_RENDER_OK');app.exit(0);
}catch(e){console.error(e);app.exit(1);}});
