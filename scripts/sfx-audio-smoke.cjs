const {app,BrowserWindow}=require('electron');
const assert=require('node:assert/strict');
app.commandLine.appendSwitch('disable-gpu');
if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
const timer=setTimeout(()=>app.exit(1),60000);
app.whenReady().then(async()=>{try{
 const window=new BrowserWindow({show:false,webPreferences:{backgroundThrottling:false}});
 await window.loadURL(process.env.PANEL99_WEB_URL||'http://127.0.0.1:3070');
 const reports=await window.webContents.executeJavaScript(`(async()=>{
  const {SoundEffects}=await import('/sound.mjs');const {MusicPlayer}=await import('/music.mjs');const {effectEvents}=await import('/audio-dsp.mjs');
  const reports=[];
  for(const category of ['master','music','sfx'])for(const value of [0,.25,.5,.75,1]){
   const ctx=new OfflineAudioContext(2,48000*2,48000),audio=new SoundEffects();audio.createGraph(ctx);
   audio.masterVolume=category==='master'?value:1;audio.sfxVolume=category==='sfx'?value:1;audio.applyVolumes();
   const music=new MusicPlayer(audio,{manifest:{tracks:[]}});music.volume=category==='music'?value:1;
   await music.start();if(music.source||music.bus)throw Error('Empty music created a node');
   // Exercise the actual shared category/master/limiter graph with overlapping gameplay effects.
   for(let group=0;group<4;group++)for(const cue of ['swap','clear','incoming','glitchBreak','flux','pulse','shift','surge','overdrive','ko','win','lose','confirm','danger','critical'])for(const [delay,midi,duration,level,kind]of effectEvents(cue,{chain:5,count:6})){
    const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=audio.buffer(midi,duration,kind);gain.gain.value=level;source.connect(gain);gain.connect(audio.sfxBus);source.start(group*.4+delay);
   }
   const buffer=await ctx.startRendering();let peak=0,squares=0;for(let channel=0;channel<2;channel++)for(const value of buffer.getChannelData(channel)){peak=Math.max(peak,Math.abs(value));squares+=value*value;}
   reports.push({category,value,peak,rms:Math.sqrt(squares/(buffer.length*2))});
  }return reports;
 })()`,true);
 for(const report of reports){assert.ok(report.peak<.95);assert.ok(report.category!=='music'&&report.value===0?report.peak===0:report.rms>.001);}
 const music=reports.filter(r=>r.category==='music');assert.ok(Math.abs(music[0].rms-music[4].rms)<1e-7);
 console.log('WEB_SFX_MIX_OK',JSON.stringify(reports));clearTimeout(timer);app.quit();
}catch(error){console.error(error);clearTimeout(timer);app.exit(1);}});
