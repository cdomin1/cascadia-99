// Build reusable native effects off the gameplay thread using the shared kernels.
import {writeFile} from 'node:fs/promises';
import {SCORE} from '../audio-score.mjs';
import {effectEvents,synthesize} from '../audio-dsp.mjs';
const index={},chunks=[];let offset=0;
const notes=Object.values(SCORE.sfx).flat();
for(let cue=1;cue<=3;cue++)notes.push(...effectEvents('countdown',{cue}));
for(let chain=1;chain<=8;chain++)for(const count of [3,4])notes.push(...effectEvents('clear',{chain,count}));
for(const [,midi,duration,,kind]of notes){
 const key=`${kind}:${midi}:${duration.toFixed(4)}`;if(index[key])continue;
 const samples=synthesize(midi,duration,kind),pcm=Buffer.alloc(samples.length*2);
 for(let i=0;i<samples.length;i++)pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),i*2);
 index[key]={offset,length:pcm.length};offset+=pcm.length;chunks.push(pcm);
}
await writeFile('godot/assets/audio-sfx.bin',Buffer.concat(chunks));
await writeFile('godot/assets/audio-sfx-index.json',JSON.stringify(index)+'\n');
console.log('NATIVE_SFX_BUILT',Object.keys(index).length,'buffers',offset,'bytes');
