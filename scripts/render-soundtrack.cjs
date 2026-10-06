// Render the exact Web Audio instruments offline for signal QA and a listening sample.
const {app,BrowserWindow}=require('electron');
const {mkdir,writeFile}=require('node:fs/promises');
const {resolve}=require('node:path');
const assert=require('node:assert/strict');
app.setPath('userData',resolve('.web-smoke/audio-profile'));
app.commandLine.appendSwitch('disable-gpu');
if(process.platform==='linux')app.commandLine.appendSwitch('ozone-platform','x11');
app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
  try{
    await window.loadURL(process.env.PANEL99_WEB_URL||'http://127.0.0.1:3000');
    await mkdir('.web-smoke',{recursive:true});
    for(const track of ['neon','midnight','coast','chrome'])for(const intensity of [0,1]){
      const result=await window.webContents.executeJavaScript(`(async()=>{
        const {AdaptiveMusic,musicTempo}=await import('/music.mjs'),duration=24,sampleRate=44100;
        const context=new OfflineAudioContext(2,duration*sampleRate,sampleRate),master=context.createGain();master.connect(context.destination);master.gain.value=.22;
        const synth=new AdaptiveMusic({context,master});await synth.setTrack(${JSON.stringify(track)});synth.intensity=${intensity};synth.createGraph(context);synth.master.gain.value=.58;
        let time=.05,step=0;while(time<duration-.8){synth.step=step;time+=synth.playStep(time,step++);}
        const buffer=await context.startRendering(),left=buffer.getChannelData(0),right=buffer.getChannelData(1);let peak=0,sum=0;
        const blockRms=[];for(let n=0;n<left.length;n++){peak=Math.max(peak,Math.abs(left[n]),Math.abs(right[n]));sum+=left[n]*left[n]+right[n]*right[n];}
        for(let second=1;second<23;second++){let energy=0;for(let n=second*sampleRate;n<(second+1)*sampleRate;n++)energy+=left[n]*left[n]+right[n]*right[n];blockRms.push(Math.sqrt(energy/(sampleRate*2)));}
        const bytes=new Uint8Array(44+left.length*4),view=new DataView(bytes.buffer),str=(at,text)=>[...text].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
        str(0,'RIFF');view.setUint32(4,bytes.length-8,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*4,true);view.setUint16(32,4,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,left.length*4,true);
        for(let n=0;n<left.length;n++){view.setInt16(44+n*4,Math.max(-1,Math.min(1,left[n]))*32767,true);view.setInt16(46+n*4,Math.max(-1,Math.min(1,right[n]))*32767,true);}
        let binary='';for(let n=0;n<bytes.length;n+=8192)binary+=String.fromCharCode(...bytes.subarray(n,n+8192));
        for(const node of synth.nodes)node.disconnect();
        return {wav:btoa(binary),peak,rms:Math.sqrt(sum/(left.length*2)),blockRms,bpm:musicTempo(${intensity},${JSON.stringify(track)}),steps:step};
      })()`);
      assert.ok(Number.isFinite(result.peak)&&result.peak<.98,'Soundtrack should not clip');assert.ok(result.rms>.001,'Track should be audible');assert.ok(result.blockRms.every(rms=>rms>.0005),'The arrangement should not have silent bars');
      await writeFile(`.web-smoke/${track}-${intensity?'danger':'calm'}.wav`,Buffer.from(result.wav,'base64'));
      console.log(`SYNTH_AUDIO_OK ${track} ${intensity?'danger':'calm'}: ${result.bpm} BPM, peak ${result.peak.toFixed(3)}, RMS ${result.rms.toFixed(3)}, ${result.steps} musical steps, no silent bars`);
    }
  }finally{window.destroy();app.quit();}
}).catch(error=>{console.error(error);app.exit(1);});
