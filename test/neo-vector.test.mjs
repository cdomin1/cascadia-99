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
