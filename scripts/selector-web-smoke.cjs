const {app,BrowserWindow,nativeImage}=require('electron');
const {readFile}=require('node:fs/promises');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
app.setPath('userData',resolve('.web-smoke/selector-profile'));
app.commandLine.appendSwitch('disable-gpu');if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
app.whenReady().then(async()=>{try{
 const window=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false}});
 await window.loadURL(process.env.PANEL99_WEB_URL);
 const fixtures=JSON.parse(await readFile('.web-smoke/selector-fixtures.json','utf8'));
 const images=await window.webContents.executeJavaScript(`(async()=>{
  const {drawSelector,BoardAnimations}=await import('/visuals.mjs');const canvas=document.createElement('canvas');canvas.width=360;canvas.height=720;const ctx=canvas.getContext('2d');const result=[];
  const shades=['#FF6B97','#38FFFF','#66FF1A','#FFB81C','#334155','#FFFFFF'];
  for(const f of ${JSON.stringify(fixtures)}){
   for(let y=0;y<12;y++)for(let x=0;x<6;x++){ctx.fillStyle=shades[(x+y)%6];ctx.fillRect(x*60,y*60,60,60);}
   drawSelector(ctx,{x:f.x,y:f.y},360,720,{rise:f.rise,now:f.time*1000,animated:!f.reduced&&f.flashing==='full'});result.push(canvas.toDataURL());
  }
  const animations=new BoardAnimations();animations.state({cursor:{x:0,y:0},fallSerial:0,phase:'idle'},0);animations.state({cursor:{x:4,y:11},fallSerial:0,phase:'idle'},1);
  if(JSON.stringify(animations.cursorAt({x:4,y:11},1))!==JSON.stringify({x:4,y:11}))throw Error('Cursor interpolated');
  return result;
 })()`);
 for(let i=0;i<fixtures.length;i++){
  const web=nativeImage.createFromDataURL(images[i]).toBitmap(),native=nativeImage.createFromPath(resolve('.web-smoke/selector-native-'+fixtures[i].id+'.png')).toBitmap();
  assert.deepEqual(web,native,'Selector pixel mismatch: '+fixtures[i].id);
 }
 console.log('SELECTOR_PARITY_OK: 36 exact native/web pixel matches across colors, garbage, edges, rise, cycling and static settings');app.exit(0);
}catch(error){console.error(error);app.exit(1);}});
