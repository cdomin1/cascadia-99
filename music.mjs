import {effects} from './sound.mjs';

// Neon Afterglow: original extended chords, melody, and drum arrangement.
const calmChords=[[59,62,66,69,73],[55,59,62,66,69],[50,54,57,61,64],[57,61,64,69,71]];
const tenseChords=[[59,62,65,69,73],[55,59,62,65,69],[52,55,59,62,66],[54,57,61,64,67]];
const melody=[0,null,null,2,null,3,2,null,4,null,3,null,2,null,1,null,2,null,1,null,0,null,2,null,3,2,null,1,null,0,null,null];
const bassSteps=[0,null,null,0,null,null,2,null,0,null,0,null,null,2,null,null];
export const TRACKS=Object.freeze({
  neon:{name:'Neon Afterglow',calm:calmChords,tense:tenseChords,melody,bass:bassSteps,low:86,high:132,lead:'triangle',arp:'triangle',pad:'sawtooth',detune:6,padLength:4.25,echo:.75,arpRate:2,cutoff:2400},
  midnight:{name:'Midnight Circuit',calm:[[57,60,64,67,71],[53,57,60,64,67],[55,59,62,65,69],[52,55,59,62,66]],tense:[[57,60,63,67,71],[53,56,60,63,67],[55,58,62,65,68],[52,56,59,62,65]],melody:[2,null,4,null,3,null,2,1,0,null,1,null,2,null,null,4,3,null,2,null,1,0,null,null,2,null,3,4,null,2,1,null],bass:[0,null,0,null,null,2,null,0,0,null,null,2,null,0,null,2],low:94,high:140,lead:'square',arp:'triangle',pad:'triangle',detune:3,padLength:3.6,echo:.5,arpRate:2,cutoff:1500},
  coast:{name:'Cassette Coast',calm:[[60,64,67,71,74],[57,60,64,67,71],[53,57,60,64,67],[55,59,62,65,69]],tense:[[60,63,67,70,74],[57,60,63,67,70],[53,56,60,63,67],[55,59,62,65,68]],melody:[4,null,null,3,2,null,null,null,1,null,2,null,0,null,null,null,2,null,3,null,4,null,3,null,2,null,null,1,0,null,null,2],bass:[0,null,null,null,2,null,null,null,0,null,null,2,null,null,0,null],low:78,high:126,lead:'sine',arp:'sine',pad:'sawtooth',detune:9,padLength:4.5,echo:.75,arpRate:4,cutoff:3200},
  chrome:{name:'Chrome Runner',calm:[[52,55,59,62,66],[48,52,55,59,62],[50,54,57,60,64],[47,51,54,57,61]],tense:[[52,55,58,62,65],[48,51,55,58,62],[50,53,57,60,63],[47,51,54,57,60]],melody:[0,2,null,3,4,null,3,2,0,null,2,3,null,4,2,null,3,2,0,null,1,2,null,4,3,null,2,1,0,null,2,null],bass:[0,null,0,null,0,2,null,0,0,null,2,null,0,null,2,0],low:100,high:148,lead:'sawtooth',arp:'square',pad:'sawtooth',detune:4,padLength:2.8,echo:.375,arpRate:2,cutoff:1700}
});
const frequency=midi=>440*2**((midi-69)/12);
const clamp=value=>Math.max(0,Math.min(1,value));
export function boardPressure(grid){
  if(!Array.isArray(grid)||!grid.length)return 0;
  const top=grid.findIndex(row=>row.some(Boolean));if(top<0)return 0;
  return clamp((grid.length-top)/grid.length*.7+grid.flat().filter(Boolean).length/(grid.length*grid[0].length)*.3);
}
export const musicIntensity=pressure=>clamp((pressure-.4)/.55);
export const musicTempo=(intensity,track='neon')=>{const p=TRACKS[track]||TRACKS.neon;return p.low+clamp(intensity)*(p.high-p.low);};

export class AdaptiveMusic {
  constructor(audio=effects){
    this.audio=audio;this.trackId="neon";this.enabled=true;this.requested=false;this.timer=null;this.master=null;this.bus=null;this.nodes=[];this.voices=new Set();this.noiseBuffer=null;this.target=0;this.intensity=0;this.overdrive=false;this.step=0;this.nextTime=0;this.currentChord=calmChords[0];
  }
  async setTrack(id){
    if(!Object.hasOwn(TRACKS,id))return false;
    if(id===this.trackId)return true;
    const resume=!!this.timer;this.stop();this.trackId=id;this.currentChord=TRACKS[id].calm[0];
    if(resume)await this.start();return true;
  }
  update(grid){this.target=musicIntensity(boardPressure(grid));}
  createGraph(context){
    this.master=context.createGain();this.bus=context.createGain();
    const compressor=context.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=3.2;compressor.attack.value=.008;compressor.release.value=.25;
    this.delay=context.createDelay(1);this.delay.delayTime.value=60/musicTempo(this.intensity,this.trackId)*TRACKS[this.trackId].echo;
    const feedback=context.createGain();feedback.gain.value=.24;this.wet=context.createGain();this.wet.gain.value=.17;
    this.bus.connect(compressor);this.bus.connect(this.delay);this.delay.connect(feedback);feedback.connect(this.delay);this.delay.connect(this.wet);this.wet.connect(compressor);compressor.connect(this.master);this.master.connect(this.audio.master);
    this.nodes=[this.bus,this.delay,feedback,this.wet,compressor,this.master];
  }
  async start(){
    this.requested=true;if(!this.enabled||this.timer)return false;
    if(!await this.audio.unlock()||!this.requested||!this.enabled)return false;if(this.timer)return true;
    const context=this.audio.context;this.intensity=this.target;this.currentChord=TRACKS[this.trackId].calm[0];this.createGraph(context);
    this.master.gain.setValueAtTime(0,context.currentTime);this.master.gain.linearRampToValueAtTime(.58,context.currentTime+.35);
    this.step=0;this.nextTime=context.currentTime+.06;this.timer=setInterval(()=>this.schedule(),25);this.schedule();return true;
  }
  setEnabled(enabled){this.enabled=!!enabled;if(!this.enabled)this.stop();}
  get status(){return {playing:!!this.timer,intensity:this.intensity,target:this.target,bpm:musicTempo(this.intensity,this.trackId),track:TRACKS[this.trackId].name,trackId:this.trackId,style:'vaporwave / synthwave'};}
  voice(source,envelope,filter,start,end,pan=0){
    const context=this.audio.context,panner=context.createStereoPanner();panner.pan.value=pan;
    source.connect(filter);filter.connect(envelope);envelope.connect(panner);panner.connect(this.bus);
    this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();filter.disconnect();envelope.disconnect();panner.disconnect();};source.start(start);source.stop(end);
  }
  note(midi,start,duration,volume=.12,{type='triangle',detune=0,pan=0,cutoff=2200,attack=.012,pad=false}={}){
    const context=this.audio.context,osc=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter();
    osc.type=type;osc.frequency.setValueAtTime(frequency(midi),start);osc.detune.value=detune;
    filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,start);filter.Q.value=pad ? .55 : 1.1;
    if(!pad)filter.frequency.exponentialRampToValueAtTime(Math.max(250,cutoff*.3),start+duration);
    gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(volume,start+attack);
    if(pad)gain.gain.setValueAtTime(volume*.8,start+duration*.6);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);this.voice(osc,gain,filter,start,start+duration+.02,pan);
  }
  pad(chord,start,beat){
    for(const [index,note]of chord.entries())for(const side of [-1,1])this.note(note,start,beat*TRACKS[this.trackId].padLength,.023,{type:TRACKS[this.trackId].pad,detune:side*(TRACKS[this.trackId].detune+index*.7),pan:side*.45,cutoff:1050+this.intensity*1700,attack:.2,pad:true});
  }
  kick(start){
    const context=this.audio.context,osc=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter();osc.type='sine';osc.frequency.setValueAtTime(145,start);osc.frequency.exponentialRampToValueAtTime(43,start+.16);filter.type='lowpass';filter.frequency.value=450;
    gain.gain.setValueAtTime(.32,start);gain.gain.exponentialRampToValueAtTime(.0001,start+.23);this.voice(osc,gain,filter,start,start+.25);
  }
  percussion(start,snare=false){
    const context=this.audio.context,duration=snare ? .17 : .045;
    if(!this.noiseBuffer){this.noiseBuffer=context.createBuffer(1,Math.floor(context.sampleRate*.25),context.sampleRate);const data=this.noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
    const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter();source.buffer=this.noiseBuffer;filter.type=snare?'bandpass':'highpass';filter.frequency.value=snare?1800:7200;filter.Q.value=snare ? .7 : .5;
    gain.gain.setValueAtTime(snare ? .17 : .025+this.intensity*.025,start);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    this.voice(source,gain,filter,start,start+duration+.015,snare?0:(this.step%4===0?-.2:.2));
    if(snare)this.note(50,start,.12,.045,{type:'triangle',cutoff:1000});
  }
  playStep(time,step){
    const profile=TRACKS[this.trackId],beat=60/musicTempo(this.intensity,this.trackId),bar=Math.floor(step/16),position=step%16;
    if(position===0){this.currentChord=(this.intensity>.65?profile.tense:profile.calm)[bar%4];this.pad(this.currentChord,time,beat);this.delay.delayTime.setTargetAtTime(beat*profile.echo,time,.3);}
    const chord=this.currentChord,degree=profile.melody[step%profile.melody.length],bass=profile.bass[position];
    if(degree!==null)this.note(chord[degree]+12,time,beat*.58,.075,{type:profile.lead,cutoff:profile.cutoff+this.intensity*1700,pan:.12});
    if(bass!==null){this.note(chord[bass]-24,time,beat*.43,.18,{type:'sawtooth',cutoff:550+this.intensity*700});this.note(chord[bass]-24,time,beat*.55,.1,{type:'sine',cutoff:500});}
    if(position%profile.arpRate===0||this.intensity>.55)this.note(chord[(Math.floor(position/2)+bar)%5]+12,time,beat*.23,.036+this.intensity*.018,{type:profile.arp,pan:position%4===0?-.35:.35,cutoff:2000+this.intensity*2400});
    if(this.overdrive&&position%2===0)this.note(chord[position%5]+24,time,beat*.3,.055,{type:'sawtooth',pan:position%4?-.5:.5,cutoff:3500});
    if(position===0||position===8||(this.trackId==='chrome'&&position===6)||(this.intensity>.65&&position===10))this.kick(time);
    if(position===4||position===12)this.percussion(time,true);
    if(position%2===0||(this.intensity>.75&&position%4===3))this.percussion(time);
    if(this.intensity>.75&&position===15)this.percussion(time+beat*.125,true);
    return beat/4;
  }
  schedule(){
    const context=this.audio.context;if(!this.timer||context.state!=='running')return;
    this.intensity+=(this.target-this.intensity)*.035;if(this.nextTime<context.currentTime-.15)this.nextTime=context.currentTime+.04;
    while(this.nextTime<context.currentTime+.13){this.nextTime+=this.playStep(this.nextTime,this.step);this.step++;}
  }
  stop(){
    this.requested=false;if(this.timer)clearInterval(this.timer);this.timer=null;
    const context=this.audio.context,master=this.master,nodes=this.nodes;this.master=null;this.bus=null;this.nodes=[];
    if(!context||!master)return;
    const now=context.currentTime;master.gain.cancelScheduledValues(now);master.gain.setValueAtTime(master.gain.value,now);master.gain.linearRampToValueAtTime(0,now+.07);
    for(const voice of this.voices)try{voice.stop(now+.08);}catch{}
    setTimeout(()=>{for(const node of nodes)node.disconnect();},150);
  }
}
export const music=new AdaptiveMusic();
