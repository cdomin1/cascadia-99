import test from 'node:test';
import assert from 'node:assert/strict';
import {Board} from '../engine.mjs';
const blank=()=>{const b=new Board(()=>.5);b.grid=b.grid.map(row=>row.map(()=>0));return b;};
test('attacks use full-width slabs and three-to-five-column segments',()=>{
  const b=blank();b.dropGarbage(12);assert.equal(b.garbageBlocks.length,1);assert.deepEqual(b.garbageBlocks.map(({width,height})=>({width,height})),[{width:6,height:2}]);assert.equal(b.grid.flat().filter(c=>c===6).length,12);
  b.dropGarbage(9);assert.deepEqual(b.garbageBlocks.slice(1).map(({width,height})=>({width,height})),[{width:6,height:1},{width:3,height:1}]);assert.equal(b.grid.flat().filter(c=>c===6).length,21);
});
test('slabs rest on the tallest supporting column and fall as a unit',()=>{
  const b=blank();b.grid[9][0]=1;b.grid[10][0]=2;b.grid[11][0]=3;b.dropGarbage(6);const block=b.garbageBlocks[0];assert.equal(block.y,8);
  b.gravity();assert.equal(block.y,8);assert.equal(b.grid[8].filter(c=>c===6).length,6);
  b.grid[9][0]=0;b.grid[10][0]=0;b.grid[11][0]=0;b.gravity();assert.equal(block.y,11);assert.equal(b.grid[11].filter(c=>c===6).length,6);
});
test('clearing beside a slab cracks it and converts rows gradually',()=>{
  const b=blank();b.grid[11]=[1,1,1,2,3,4];b.dropGarbage(12);b.events=[];b.resolve();b.tick(.5,0);
  assert.equal(b.garbageBlocks[0].state,'breaking');assert.equal(b.garbageBlocks[0].height,2);assert.equal(b.grid.flat().filter(c=>c===6).length,12);
  b.tick(.4,0);assert.equal(b.garbageBlocks[0].height,1);assert.equal(b.grid.flat().filter(c=>c===6).length,6);
  b.tick(.2,0);assert.equal(b.garbageBlocks.length,0);assert.equal(b.grid.flat().filter(c=>c===6).length,0);assert.equal(b.events.filter(e=>e.type==='convert').length,2);
});
test('four-panel combos send segments and longer chains grow attacks',()=>{
  const b=blank();b.grid[11]=[1,1,1,1,2,3];b.resolve();b.tick(.5,0);assert.equal(b.events[0].attack,3);
  const c=blank();c.grid[11]=[1,1,1,0,0,0];c.resolve();c.chain=3;c.tick(.5,0);assert.equal(c.events[0].attack,12);
});
test('rising stack carries slab coordinates with its grid',()=>{
  const b=blank();b.dropGarbage(6);const initial=b.garbageBlocks[0].y;b.rise=.99;b.tick(.02,0,true);assert.equal(b.garbageBlocks[0].y,initial-1);assert.equal(b.grid[initial-1].filter(c=>c===6).length,6);
});
test('an attack that cannot fit eliminates the board',()=>{
  const b=blank();b.grid[0][0]=1;b.dropGarbage(6);assert.equal(b.dead,true);assert.equal(b.garbageBlocks.length,0);
});

test('each slab is at most three rows tall and partial segments are at least three columns',()=>{
  const b=blank();b.dropGarbage(24);assert.deepEqual(b.garbageBlocks.map(({width,height})=>({width,height})),[{width:6,height:3},{width:6,height:1}]);
  for(const amount of [1,2,3,4,5]){const c=blank();c.dropGarbage(amount);assert.equal(c.garbageBlocks[0].width,Math.max(3,amount));assert.equal(c.garbageBlocks[0].height,1);}
});
