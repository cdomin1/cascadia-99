import {effects} from './sound.mjs';
import {SCORE} from './audio-score.mjs';
import {MIX,volumeGain,layerLevel} from './audio-dsp.mjs';
export const TRACKS=Object.freeze(SCORE.tracks);
const clamp=value=>Math.max(0,Math.min(1,value));
export function boardPressure(grid){if(!Array.isArray(grid)||!grid.length)return 0;const top=grid.findIndex(row=>row.some(Boolean));if(top<0)return 0;return clamp((grid.length-top)/grid.length*.7+grid.flat().filter(Boolean).length/(grid.length*grid[0].length)*.3);}
export const musicIntensity=pressure=>clamp((pressure-.4)/.55);
// Fixed musical tempo: pressure adds composed parts rather than accelerating the song.
export const musicTempo=(_intensity,track='neon')=>(TRACKS[track]||TRACKS.neon).bpm;
export class AdaptiveMusic {
 constructor(audio=effects){this.audio=audio;this.context='title';this.volume=MIX.music;this.pendingTrack=null;this.trackId='neon';this.enabled=true;this.requested=false;this.timer=null;this.master=null;this.bus=null;this.nodes=[];this.voices=new Set();this.target=0;this.intensity=0;this.overdrive=false;this.surge=false;this.arrangement={intensity:0,overdrive:false,surge:false};this.step=0;this.nextTime=0;}
 async setTrack(id){if(!Object.hasOwn(TRACKS,id))return false;if(id===this.trackId){this.pendingTrack=null;return true;}if(this.timer)this.pendingTrack=id;else this.trackId=id;return true;}
 setContext(context){this.context=context;if(context==='title'){this.target=0;this.overdrive=false;this.surge=false;}this.automateGain();}
 automateGain(){if(!this.master||!this.audio.context)return;this.master.gain.setTargetAtTime(this.enabled?volumeGain(this.volume)*(MIX.context[this.context]??1)*MIX.musicTrim:0,this.audio.context.currentTime,.08);}
 update(grid){this.target=musicIntensity(boardPressure(grid));}
 createGraph(context){this.master=context.createGain();this.master.gain.value=0;this.bus=this.master;this.master.connect(this.audio.master);this.nodes=[this.master];}
 async start(){this.requested=true;if(!this.enabled||this.timer)return false;if(!await this.audio.unlock()||!this.requested||!this.enabled)return false;if(this.timer)return true;const ctx=this.audio.context;this.createGraph(ctx);this.master.gain.setValueAtTime(0,ctx.currentTime);this.automateGain();this.step=0;this.nextTime=ctx.currentTime+.06;this.timer=setInterval(()=>this.schedule(),25);this.schedule();return true;}
 setEnabled(enabled){this.enabled=!!enabled;this.automateGain();}
 get status(){return {playing:!!this.timer&&this.enabled,intensity:this.intensity,target:this.target,bpm:musicTempo(0,this.trackId),track:TRACKS[this.trackId].name,trackId:this.trackId,section:TRACKS[this.trackId].sections[Math.floor((this.step/16)%64/8)].name,style:'authored mechanical electro/funk score'};}
 playStep(time,step){if(step%16===0){if(this.pendingTrack){this.trackId=this.pendingTrack;this.pendingTrack=null;}this.intensity+=(this.target-this.intensity)*.6;this.arrangement={intensity:this.intensity,overdrive:this.overdrive,surge:this.surge};}const profile=TRACKS[this.trackId],sixteenth=60/profile.bpm/4,bar=Math.floor(step/16)%profile.bars.length;
 for(const [position,midi,length,gain,kind,pan,layer]of profile.bars[bar]){if(position!==step%16)continue;const level=layerLevel(layer,this.arrangement.intensity,this.arrangement.overdrive,this.arrangement.surge);if(level===0)continue;const ctx=this.audio.context,source=ctx.createBufferSource(),envelope=ctx.createGain(),panner=ctx.createStereoPanner();source.buffer=this.audio.buffer(midi,length*sixteenth,kind);envelope.gain.value=gain*level;panner.pan.value=pan;source.connect(envelope);envelope.connect(panner);panner.connect(this.bus);this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();envelope.disconnect();panner.disconnect();};source.start(time);}
 return sixteenth;}
 schedule(){const context=this.audio.context;if(!this.timer||context.state!=='running')return;if(this.nextTime<context.currentTime-.15)this.nextTime=context.currentTime+.04;while(this.nextTime<context.currentTime+.13){this.nextTime+=this.playStep(this.nextTime,this.step);this.step++;}}
 stop(){this.requested=false;if(this.timer)clearInterval(this.timer);this.timer=null;const context=this.audio.context,master=this.master;this.master=null;this.bus=null;this.nodes=[];if(!context||!master)return;const now=context.currentTime;master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(master.gain.value,now);master.gain.linearRampToValueAtTime(0,now+.07);for(const voice of this.voices)try{voice.stop(now+.08);}catch{}setTimeout(()=>master.disconnect(),150);}
}
export const music=new AdaptiveMusic();
