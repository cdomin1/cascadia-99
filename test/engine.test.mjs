import test from 'node:test';
import assert from 'node:assert/strict';
import {Board} from '../engine.mjs';
const empty=()=>{const b=new Board();b.grid=b.grid.map(row=>row.map(()=>0));return b;};
test('horizontal and vertical matches include all panels without duplicates',()=>{
  const b=empty();b.grid[11]=[1,1,1,1,2,3];b.grid[9][1]=1;b.grid[10][1]=1;
  assert.deepEqual(b.findMatches().sort((a,b)=>a-b),[55,61,66,67,68,69]);
});
test('swap makes a match and scores after clearing',()=>{
  const b=empty();b.grid[11]=[1,1,2,1,3,4];b.cursor={x:2,y:11};assert.equal(b.swap(),true);assert.equal(b.matches.length,3);
  b.tick(.5);assert.equal(b.score,30);assert.equal(b.events[0].count,3);assert.equal(b.events[0].attack,0);
});
test('falling panels form a chain and send garbage',()=>{
  const b=empty();b.grid[11]=[1,1,1,0,0,0];b.grid[10]=[2,0,2,0,0,0];b.grid[9][1]=2;
  b.resolve();b.tick(.5);b.tick(.3);assert.equal(b.chain,2);b.tick(.5);assert.equal(b.events[1].chain,2);assert.equal(b.events[1].attack,6);
});
test('attacks cancel queued garbage before sending excess',()=>{
  const b=empty();b.receive(3);b.receive(2);assert.equal(b.cancel(4),0);assert.deepEqual(b.incoming,[{amount:1,delay:4}]);assert.equal(b.cancel(5),4);assert.equal(b.incoming.length,0);
});
test('adjacent garbage converts and disconnected garbage remains',()=>{
  const b=empty();b.grid[11]=[1,1,1,6,6,0];b.grid[10][5]=6;b.resolve();b.tick(.5);
  assert.equal(b.grid.flat().filter(c=>c===6).length,1);assert.equal(b.totalCleared,3);
});
test('garbage cannot be swapped and cursor stays within bounds',()=>{
  const b=empty();b.grid[11]=[6,1,0,0,0,0];b.cursor={x:0,y:11};assert.equal(b.swap(),false);b.move(-1,1);assert.deepEqual(b.cursor,{x:0,y:11});
});
test('ceiling pressure eliminates player after two seconds',()=>{
  const b=empty();b.grid[0][0]=1;for(let i=0;i<42;i++)b.tick(.05,0);assert.equal(b.dead,true);
});
test('garbage arrives only when its delay expires',()=>{
  const b=empty();b.receive(3);b.tick(3,0);assert.equal(b.grid.flat().filter(c=>c===6).length,0);b.tick(1.1,0);assert.equal(b.grid.flat().filter(c=>c===6).length,3);
});
test('new boards contain no automatic matches',()=>{for(let i=0;i<100;i++)assert.equal(new Board().findMatches().length,0);});

test('starting and rising rows use exactly the four configured tile types',()=>{
  const seen=new Set();for(let n=0;n<100;n++){const b=new Board();for(const value of b.grid.flat().filter(Boolean)){assert.ok(value>=1&&value<=4);seen.add(value);}b.rise=.99;b.tick(.02,0,true);for(const value of b.grid.flat().filter(Boolean))assert.ok(value>=1&&value<=4);}
  assert.deepEqual([...seen].sort(),[1,2,3,4]);
});
test('garbage releases use four tile types in both grouped and legacy grids',()=>{
  const b=new Board(()=>.999);b.grid=b.grid.map(row=>row.map(()=>0));b.dropGarbage(6);b.garbageBlocks[0].state='breaking';b.garbageBlocks[0].breakTimer=0;b.tick(.02,0);assert.ok(b.grid.flat().filter(Boolean).every(value=>value===4));
  const c=empty();c.random=()=>.999;c.grid[11]=[1,1,1,6,0,0];c.resolve();c.tick(.5,0);assert.equal(c.grid[11][3],4);
});
