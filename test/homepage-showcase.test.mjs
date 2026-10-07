import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildShowcase,SHOWCASE_FPS,SHOWCASE_CHAPTERS} from '../scripts/homepage-showcase.mjs';
import {recordMechanic} from '../scripts/record-tutorials.mjs';

test('homepage showcase contains real Flux rewards, chains, slab conversion and all four abilities',()=>{
 const frames=buildShowcase();assert.equal(frames.length,33*SHOWCASE_FPS);
 assert.deepEqual(SHOWCASE_CHAPTERS.map(c=>c.id),['chains','garbage','pulse','shift','surge','overdrive']);
 const charge=frames.filter(f=>f.chapter.id==='chains');assert.equal(charge[0].own.flux,0);assert.ok(charge.some(f=>f.own.flux>0&&f.own.chain>=2));
 assert.ok(frames.some(f=>f.events.some(e=>e.type==='convert')));
 for(const id of ['pulse','shift','surge','overdrive'])assert.ok(frames.some(f=>f.chapter.id===id&&f.events.some(e=>e.ability===id)),`Missing ${id} activation`);
 const overdrive=frames.filter(f=>f.chapter.id==='overdrive');assert.ok(overdrive.some(f=>f.own.maxFluxHeld>=3));assert.ok(overdrive.some(f=>f.own.activeAbility==='overdrive'&&f.own.flux<100));
});
test('higher frame-rate homepage recording preserves native tutorial simulation at shared timestamps',()=>{
 for(const id of SHOWCASE_CHAPTERS.map(c=>c.id)){
  const native=recordMechanic(id),homepage=recordMechanic(id,{fps:25});const byTime=new Map(homepage.map(f=>[f.now,f.own]));
  for(const frame of native)if(byTime.has(frame.now))assert.deepEqual(byTime.get(frame.now),frame.own);
 }
});
test('rendered homepage metadata matches the showcase and retains a valid GIF/still',async()=>{
 const metadata=JSON.parse(await readFile(new URL('../demo/showcase.json',import.meta.url)));
 assert.equal(metadata.seconds,33);assert.equal(metadata.frames,825);assert.equal(metadata.fps,25);
 assert.deepEqual(metadata.chapters,SHOWCASE_CHAPTERS.map(({id,seconds})=>({id,seconds})));
 const gif=await readFile(new URL('../demo/gameplay.gif',import.meta.url));assert.equal(gif.readUInt16LE(6),640);assert.equal(gif.readUInt16LE(8),420);
 assert.equal((await readFile(new URL('../demo/gameplay.png',import.meta.url))).subarray(1,4).toString(),'PNG');
});
