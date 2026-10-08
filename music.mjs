import {effects} from './sound.mjs';
import {MIX,volumeGain} from './audio-dsp.mjs';
import {normalizeManifest} from './music-library.mjs';
const categoryFor=context=>context==='battle'?'gameplay':['victory','defeat'].includes(context)?'results':'menu';
export class MusicPlayer {
 constructor(audio=effects,{fetcher=globalThis.fetch,manifest=null}={}){this.audio=audio;this.fetcher=fetcher;this.tracks=normalizeManifest(manifest);this.volume=MIX.music;this.enabled=true;this.trackId='';this.context='title';this.requested=false;this.source=null;this.voiceGain=null;this.bus=null;this.activeTrackId='';this.generation=0;this.buffers=new Map();this.loadPromise=null;this.error='';this.preferred={};}
 async loadLibrary(){if(this.loadPromise)return this.loadPromise;this.loadPromise=(async()=>{try{const response=await this.fetcher('/assets/audio/music/manifest.json');if(!response.ok)return;const registry=normalizeManifest(await response.json());for(const [id,track]of Object.entries(registry)){try{const available=await this.fetcher('/assets/audio/music/'+track.path,{method:'HEAD'});if(available.ok)this.tracks[id]=track;}catch{}}}catch{}this.trackId=Object.keys(this.tracks)[0]||'';})();await this.loadPromise;return this.tracks;}
 get installed(){return Object.keys(this.tracks).length>0;}
 get status(){return {playing:!!this.source&&this.enabled,track:this.tracks[this.activeTrackId]?.title||'NO TRACKS INSTALLED',trackId:this.trackId,activeTrackId:this.activeTrackId,installed:this.installed,error:this.error};}
 setContext(context){this.context=context;return this.requested?this.start():Promise.resolve(false);}
 async setTrack(id){if(!Object.hasOwn(this.tracks,id))return false;this.trackId=id;this.preferred[this.tracks[id].category]=id;if(this.requested&&this.tracks[id].category===categoryFor(this.context))await this.start();return true;}
 automateGain(){if(this.bus)this.bus.gain.setTargetAtTime(this.enabled?volumeGain(this.volume):0,this.audio.context.currentTime,.04);}
 setEnabled(enabled){this.enabled=!!enabled;this.automateGain();if(this.enabled&&this.requested)this.start();}
 selected(){const category=categoryFor(this.context);return this.preferred[category]||Object.keys(this.tracks).find(id=>this.tracks[id].category===category)||'';}
 retire(source,gain,fade=.15){if(!source)return;const now=this.audio.context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(0,now+fade);try{source.stop(now+fade+.01);}catch{}}
 async start(){this.requested=true;const id=this.selected();if(!id){this.stop(.15,true);return false;}if(this.activeTrackId===id&&this.source)return true;if(!this.enabled)return false;const generation=++this.generation;
  try{if(!await this.audio.unlock())return false;const ctx=this.audio.context;if(!this.bus){this.bus=ctx.createGain();this.bus.gain.value=this.enabled?volumeGain(this.volume):0;this.bus.connect(this.audio.master);}
   let buffer=this.buffers.get(id);if(!buffer){const response=await this.fetcher('/assets/audio/music/'+this.tracks[id].path);if(!response.ok)throw Error('Track unavailable');buffer=await ctx.decodeAudioData(await response.arrayBuffer());if(this.buffers.size>=2)this.buffers.delete(this.buffers.keys().next().value);this.buffers.set(id,buffer);}
   if(generation!==this.generation||!this.requested)return false;const track=this.tracks[id];if(track.loopStart>=buffer.duration||(track.loopEnd!==null&&track.loopEnd>buffer.duration))throw Error('Invalid loop points');
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=track.loop;source.loopStart=track.loopStart;source.loopEnd=track.loopEnd??buffer.duration;gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(1,ctx.currentTime+.2);source.connect(gain);gain.connect(this.bus);const prior=this.source,priorGain=this.voiceGain;this.source=source;this.voiceGain=gain;this.activeTrackId=id;this.error='';source.onended=()=>{source.disconnect();gain.disconnect();if(this.source===source){this.source=null;this.activeTrackId='';}};source.start();this.retire(prior,priorGain);return true;
  }catch{if(generation===this.generation){this.error='Track unavailable';this.stop();}return false;}
 }
 stop(fade=.15,retainRequest=false){this.generation++;if(!retainRequest)this.requested=false;this.retire(this.source,this.voiceGain,fade);this.source=null;this.voiceGain=null;this.activeTrackId='';}
}
export const music=new MusicPlayer();
