import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCORE} from '../audio-score.mjs';
import {volumeGain,migrateVolume,layerLevel,synthesize,effectEvents,limitSample} from '../audio-dsp.mjs';
test('both clients consume identical authored scores with developed full forms',()=>{
 assert.deepEqual(JSON.parse(readFileSync(new URL('../godot/assets/audio-score.json',import.meta.url))),SCORE);
 assert.equal(SCORE.motif.length,6);
 const grooves=new Set();
 for(const track of Object.values(SCORE.tracks)){
  assert.equal(track.bars.length,64);assert.equal(track.sections.length,8);assert.ok(track.duration>=90&&track.duration<=180);
  assert.notDeepEqual(track.bars.slice(8,16),track.bars.slice(16,24));
  const layers=new Set(track.bars.flat().map(event=>event[6]));assert.deepEqual(layers,new Set(['base','overdrive','danger','momentum','critical']));
  grooves.add(JSON.stringify([track.kicks,track.snares,track.bassPattern]));
  for(const event of track.bars.flat()){assert.ok(event[0]>=0&&event[0]<16);assert.ok(event[2]>0&&event[3]>0&&event[3]<1);}
 }
 assert.equal(grooves.size,4);
});
test('volume migration retains intentional silence and existing linear category levels',()=>{
 for(const value of [0,.01,.25,.5,.75,1])assert.ok(Math.abs(volumeGain(migrateVolume(value))-value)<1e-12);
 assert.equal(volumeGain(0),0);assert.equal(volumeGain(1),1);
 assert.ok(volumeGain(.25)<volumeGain(.5)&&volumeGain(.5)<volumeGain(.75));
});
test('adaptive parts escalate independently and the safety curve bounds summed peaks',()=>{
 assert.equal(layerLevel('danger',.2),0);assert.equal(layerLevel('critical',.75),0);assert.equal(layerLevel('overdrive',1),0);
 assert.equal(layerLevel('overdrive',0,true),1);assert.equal(layerLevel('momentum',0,false,true),1);
 for(const value of [-10,-1,-.5,0,.5,1,10]){assert.ok(Math.abs(limitSample(value))<=.9400001);if(Math.abs(value)<=.8)assert.equal(limitSample(value),value);}
});
test('synthesis is deterministic, tapered, and chain tones share the musical scale',()=>{
 for(const voice of ['reed','metal','bell','rubber','pluck','sub','kick','snare','hat','tom','wire','stab']){
  const a=synthesize(62,.2,voice);assert.deepEqual(a,synthesize(62,.2,voice));assert.ok(a[0]===0);assert.ok(Math.abs(a.at(-1))<.02);assert.ok(a.some(value=>Math.abs(value)>.02));
 }
 for(const chain of [2,3,4,5,6])for(const event of effectEvents('clear',{chain}))assert.ok([0,2,3,5,7,10].includes((event[1]-62+120)%12));
});
test('native reusable SFX assets match the shared kernels and avoid runtime generation',()=>{
 const index=JSON.parse(readFileSync(new URL('../godot/assets/audio-sfx-index.json',import.meta.url)));
 const pcm=readFileSync(new URL('../godot/assets/audio-sfx.bin',import.meta.url));
 assert.ok(Object.keys(index).length>=60);
 for(const [key,{offset,length}]of Object.entries(index)){
  const [kind,midi,duration]=key.split(':');const expected=synthesize(Number(midi),Number(duration),kind);
  assert.equal(length,expected.length*2);assert.ok(offset+length<=pcm.length);
  for(let n=0;n<expected.length;n++)assert.equal(pcm.readInt16LE(offset+n*2),Math.round(Math.max(-1,Math.min(1,expected[n]))*32767)||0);
 }
});
