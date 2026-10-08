import {AUDIO} from './audio-config.mjs';
export const MIX=AUDIO.mix;
export const volumeGain=value=>Math.max(0,Math.min(1,Number(value)||0))**MIX.curve;
export const migrateVolume=value=>Math.max(0,Math.min(1,Number(value)||0))**(1/MIX.curve);
export function limitSample(x){const a=Math.abs(x);return a<=.8?x:Math.sign(x)*(.8+.14*Math.tanh((a-.8)/.14));}
export function effectEvents(event,{chain=1,count=3,cue=1}={}){
 if(event==='countdown')return [[0,[62,65,69][Math.max(0,Math.min(2,cue-1))],.12,.32,'metal']];
 if(event==='clear'){const scale=[62,65,67,69,72,74,77,79],base=Math.min(6,Math.max(0,chain-1));return Array.from({length:chain>1?4:count>3?3:2},(_,i)=>[i*.045,scale[Math.min(7,base+i)],.14,(chain>1?.34:.26),i%2?'bell':'metal']);}
 return AUDIO.sfx[event]||[];
}
// Identical deterministic synthesis kernels are ported in Godot/audio_dsp.gd.
// Band-limited additive voices and FM; never random pitch selection.
export function synthesize(midi,duration,kind,sampleRate=24000){
 const count=Math.max(1,Math.round(duration*sampleRate)),out=new Float32Array(count),f=440*2**((midi-69)/12);let noise=17,previous=0,filtered=0;
 for(let n=0;n<count;n++){
  const t=n/sampleRate,u=n/count,p=2*Math.PI*f*t;
  noise=(noise*16807)%2147483647;const white=noise/1073741823.5-1,high=white-previous*.8;previous=white;
  let value=0,env=Math.min(1,t/.006)*Math.min(1,(duration-t)/.025)*Math.exp(-u*2.2);
  if(kind==='kick'){const phase=2*Math.PI*(45*t+130/35*(1-Math.exp(-35*t)));value=Math.sin(phase)*Math.exp(-t*19)+high*.12*Math.exp(-t*180);env=Math.min(1,t/.0015)*Math.min(1,(duration-t)/.01);}
  else if(kind==='snare'){value=(high*.65+Math.sin(2*Math.PI*175*t)*.28)*Math.exp(-t*24);env=Math.min(1,t/.002)*Math.min(1,(duration-t)/.01);}
  else if(kind==='tom'){value=Math.sin(2*Math.PI*f*(t+.004*(1-Math.exp(-t*35))))*Math.exp(-t*18);}
  else if(kind==='pluck'||kind==='sub'){value=Math.sin(p)*.8+Math.sin(p*2)*.22*Math.exp(-t*18)+Math.sin(p*3)*.15*Math.exp(-t*25);if(kind==='pluck')value+=Math.sin(p*4)*.14*Math.exp(-t*30);if(kind==='sub')value=Math.sin(p)*.9+Math.sin(p*2)*.25;}
  else if(kind==='metal'||kind==='bell'){const index=(kind==='metal'?2.6:1.5)*Math.exp(-t*12);value=Math.sin(p+Math.sin(p*(kind==='metal'?2:3))*index)*.78+Math.sin(p*.5)*.12;env*=Math.exp(-t*(kind==='bell'?2:5));}
  else if(kind==='wire'){value=Math.sin(p+Math.sin(p*2)*.8)*.65+Math.sin(p*3)*.16;}
  else {value=Math.sin(p)*.72+Math.sin(p*2)*.2+Math.sin(p*3)*.12;env=Math.min(1,t/.012)*Math.min(1,(duration-t)/.035)*(.85+.15*Math.sin(2*Math.PI*4.8*t))*Math.exp(-u*1.3);}
  filtered+=.72*(value-filtered);out[n]=filtered*env;
 }
 return out;
}
export function createOutputGraph(context,masterGain){
 const compressor=context.createDynamicsCompressor();compressor.threshold.value=-3;compressor.knee.value=3;compressor.ratio.value=8;compressor.attack.value=.003;compressor.release.value=.09;
 const safety=context.createWaveShaper(),curve=new Float32Array(8193);for(let n=0;n<curve.length;n++)curve[n]=limitSample(n/(curve.length-1)*2-1);safety.curve=curve;safety.oversample='2x';masterGain.connect(compressor);compressor.connect(safety);safety.connect(context.destination);return [compressor,safety];
}
