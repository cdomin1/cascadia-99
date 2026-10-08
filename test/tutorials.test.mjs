import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {TUTORIALS} from '../tutorials.mjs';
import {recordMechanic} from '../scripts/record-tutorials.mjs';
import {createGameServer} from '../server.mjs';

test('tutorial catalog covers every mode and Phase 1 ability with matching native metadata',async()=>{
 const catalog=JSON.parse(await readFile(new URL('../godot/assets/tutorials/catalog.json',import.meta.url)));
 assert.deepEqual(catalog.tutorials,TUTORIALS);assert.equal(catalog.frames,80);assert.equal(catalog.fps,10);
 assert.deepEqual(TUTORIALS.filter(t=>t.group==='Modes').map(t=>t.id),['duel','quad','teams','battle']);
 for(const {id}of TUTORIALS){
  const gif=await readFile(new URL(`../demo/tutorials/${id}.gif`,import.meta.url));assert.match(gif.subarray(0,6).toString(),/^GIF8[79]a$/);assert.equal(gif.readUInt16LE(6),384);assert.equal(gif.readUInt16LE(8),216);
  for(const path of [`../demo/tutorials/${id}.png`,`../godot/assets/tutorials/${id}.png`])assert.equal((await readFile(new URL(path,import.meta.url))).subarray(1,4).toString(),'PNG');
 }
});
test('tutorial footage demonstrates actual chains, slab conversion and authoritative ability spending',()=>{
 const chains=recordMechanic('chains');assert.ok(chains.some(f=>f.own.chain>=2));
 const garbage=recordMechanic('garbage');assert.ok(garbage.some(f=>f.events.some(e=>e.type==='convert')));
 for(const [id,cost]of [['pulse',35],['shift',60],['surge',75],['overdrive',100]]){
  const frames=recordMechanic(id),activation=frames.findIndex(f=>f.events.some(e=>e.ability===id));assert.ok(activation>0);
  assert.equal(frames[activation+1].own.flux,100-cost);
  if(id==='overdrive')assert.ok(frames[activation-1].own.maxFluxHeld>=3);
  if(id==='shift')assert.equal(frames.at(-1).own.score,0);
  if(id==='pulse')assert.equal(frames[activation+1].own.incoming[0].amount,6);
 }
});
test('tutorial HTTP routing serves only explicitly catalogued assets',async t=>{
 const game=createGameServer({port:0,host:'127.0.0.1'});t.after(()=>game.close());const url=await game.listen();
 for(const {id}of TUTORIALS){const response=await fetch(`${url}/demo/tutorials/${id}.gif`);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/gif')}
 assert.equal((await fetch(`${url}/demo/tutorials/not-a-topic.gif`)).status,404);
 assert.equal((await fetch(`${url}/tutorials.mjs`)).status,200);
});
