import test from 'node:test';
import assert from 'node:assert/strict';
import {Board} from '../engine.mjs';
import {chooseSwap,CpuController} from '../bot.mjs';
const blank=()=>{const b=new Board();b.grid=b.grid.map(row=>row.map(()=>0));return b;};
test('CPU chooses a real matching swap',()=>{
  const b=blank();b.grid[11]=[1,1,2,1,3,4];b.cursor={x:2,y:11};const swap=chooseSwap(b,'hard',()=>.5);
  b.cursor={x:swap.x,y:swap.y};b.swap();assert.equal(b.phase,'clear');assert.ok(b.matches.length>=3);
});
test('CPU moves its cursor, clears panels, and earns engine scores',()=>{
  const b=blank();b.grid[11]=[1,1,2,1,3,4];b.cursor={x:0,y:9};
  const p={board:b,boost:false},cpu=new CpuController('hard',()=>.5);let moved=false;
  for(let i=0;i<100;i++){cpu.tick(p,.05);b.tick(.05,0,false);if(b.cursor.x!==0||b.cursor.y!==9)moved=true;if(b.score>0)break;}
  assert.equal(moved,true);assert.ok(b.score>=30);assert.ok(b.totalCleared>=3);
});
test('CPU respects unmovable garbage and paused/dead boards',()=>{
  const b=blank();b.grid[11]=[6,6,6,6,6,6];assert.equal(chooseSwap(b,'hard'),null);
  const cpu=new CpuController('normal',()=>.5),p={board:b,boost:true};b.dead=true;cpu.tick(p,1);assert.equal(p.boost,false);assert.deepEqual(b.grid[11],[6,6,6,6,6,6]);
});
test('difficulty changes action speed and defaults safely',()=>{
  assert.equal(new CpuController('unknown').difficulty,'normal');
  const fast=blank(),slow=blank();for(const b of [fast,slow]){b.grid[11]=[1,1,2,1,3,4];b.cursor={x:0,y:9};}
  const hard=new CpuController('hard',()=>.5),easy=new CpuController('easy',()=>.5);
  const fastPlayer={board:fast},slowPlayer={board:slow};
  for(let n=0;n<25;n++){hard.tick(fastPlayer,.05);fast.tick(.05,0);easy.tick(slowPlayer,.05);slow.tick(.05,0);}
  assert.ok(fast.score>slow.score);
});
