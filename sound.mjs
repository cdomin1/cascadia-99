import {MIX,volumeGain,createOutputGraph,synthesize,effectEvents} from './audio-dsp.mjs';
export class SoundEffects {
 constructor({enabled=true,contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()}={}){this.enabled=enabled;this.contextFactory=contextFactory;this.context=null;this.master=null;this.sfxBus=null;this.sfxVolume=MIX.sfx;this.masterVolume=MIX.master;this.played=0;this.active=0;this.bufferCache=new Map();}
 createGraph(context){this.context=context;this.master=context.createGain();this.sfxBus=context.createGain();this.sfxBus.connect(this.master);this.outputNodes=createOutputGraph(context,this.master);this.applyVolumes();}
 async unlock(){try{if(!this.context)this.createGraph(this.contextFactory());if(this.context.state==='suspended')await this.context.resume();return this.context.state==='running';}catch{return false;}}
 applyVolumes(){if(this.master)this.master.gain.value=volumeGain(this.masterVolume);if(this.sfxBus)this.sfxBus.gain.value=this.enabled?volumeGain(this.sfxVolume)*MIX.sfxTrim:0;}
 setEnabled(enabled){this.enabled=!!enabled;this.applyVolumes();if(this.enabled)this.unlock();}
 get status(){return this.context?.state||'locked';}
 buffer(midi,duration,kind){const key=[midi,duration.toFixed(4),kind].join(':');if(!this.bufferCache.has(key)){const data=synthesize(midi,duration,kind),buffer=this.context.createBuffer(1,data.length,24000);buffer.getChannelData(0).set(data);if(this.bufferCache.size>=512)this.bufferCache.delete(this.bufferCache.keys().next().value);this.bufferCache.set(key,buffer);}return this.bufferCache.get(key);}
 play(event,options={}){if(!this.enabled||this.context?.state!=='running'||this.active>=32)return false;const notes=effectEvents(event,options);if(!notes.length)return false;for(const [delay,midi,duration,volume,kind]of notes){if(this.active>=32)break;const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=this.buffer(midi,duration,kind);gain.gain.value=volume;source.connect(gain);gain.connect(this.sfxBus);source.start(this.context.currentTime+delay);this.active++;source.onended=()=>{this.active--;source.disconnect();gain.disconnect();};}this.played++;return true;}
}
export const effects=new SoundEffects();
