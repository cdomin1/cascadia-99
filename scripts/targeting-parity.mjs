import{readFile}from'node:fs/promises';import assert from'node:assert/strict';import{trajectoryPixels}from'../targeting-vfx.mjs';
for(const f of JSON.parse(await readFile('.web-smoke/targeting-parity.json','utf8')))assert.deepEqual(trajectoryPixels(f.event,f.now,{x:12,y:15},{x:300,y:600},{reducedMotion:f.reduced,flashing:f.reduced?'reduced':'full'}),f.result);
console.log('TARGETING_PARITY_OK: 24 exact web/native trajectory fixtures');
