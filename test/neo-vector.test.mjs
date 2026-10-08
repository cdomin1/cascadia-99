import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {NEO} from '../neo-vector.mjs';
test('native and web share the canonical presentation specification',()=>{
  assert.deepEqual(NEO,JSON.parse(readFileSync(new URL('../godot/assets/neo-vector.json',import.meta.url))));
  assert.equal(new Set(NEO.tiles.map(t=>t.geometry)).size,4);
  assert.ok(NEO.lines.selectorOuter>NEO.lines.selectorInner);
  assert.equal(NEO.limits.trajectories,8);
  assert.equal(Object.hasOwn(NEO,'fluxRewards'),false);
});

import {tilePaths,glitchPaths} from '../vector-geometry.mjs';
test('tile silhouettes and contiguous Glitch slabs retain bounded geometry',()=>{
  for(let type=1;type<=4;type++){
    assert.ok(tilePaths(type).length>0);
    for(const path of tilePaths(type))for(const point of path.points)assert.ok(point.every(n=>n>=0&&n<=1));
  }
  for(const width of [178,238,298,358])for(const height of [58,118,178]){
    const paths=glitchPaths(width,height,{breaking:true,age:300});
    assert.deepEqual(paths[0].points[0],paths[0].points.at(-1));
    assert.ok(paths.length<64);
    assert.deepEqual(glitchPaths(width,height,{breaking:true,age:300,reducedMotion:true}),glitchPaths(width,height,{breaking:true,age:0,reducedMotion:true}));
  }
});
import {PresentationEffects} from '../presentation-effects.mjs';
test('effect quality bounds decoration without changing authoritative state',()=>{
 const minimal=new PresentationEffects({quality:'minimal'});minimal.trigger('overdrive',0);assert.equal(minimal.waves.length,0);assert.deepEqual(minimal.offset(32),{x:0,y:0});
 const reduced=new PresentationEffects({quality:'reduced'});reduced.trigger('overdrive',0);assert.equal(reduced.instabilities.length,0);
 const full=new PresentationEffects();for(let i=0;i<100;i++)full.trigger('effect',i,{chain:6});assert.ok(full.instabilities.length<=4);assert.ok(full.waves.length<=8);
});
