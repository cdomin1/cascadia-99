import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {AttackTrajectories,TARGET_VFX,trajectoryPixels} from '../targeting-vfx.mjs';
const event=(n,type='sent',sourceId='me',targetId='other')=>({type,matchId:'m',eventId:`m:${n}`,attackSequence:n,sourceId,targetId,amount:18});
test('targeting presentation uses matching native config and only confirmed local endpoint IDs',()=>{
 assert.deepEqual(JSON.parse(readFileSync(new URL('../godot/assets/targeting-vfx.json',import.meta.url))),TARGET_VFX);
 const fx=new AttackTrajectories();fx.begin('m','me');assert.equal(fx.accept({...event(1),matchId:'old'},0),false);assert.equal(fx.accept(event(1,'attack','a','b'),0),false);
 assert.ok(fx.accept(event(1),0));assert.equal(fx.events[0].targetId,'other');assert.equal(fx.accept(event(1),1),false);
 fx.begin('m','me');assert.equal(fx.accept(event(1),10),false);assert.ok(fx.accept(event(2,'attack','enemy','me'),20));assert.equal(fx.events[1].channel,'incoming');
 for(let n=3;n<30;n++)fx.accept(event(n,'attack',`enemy${n}`,'me'),30);
 assert.equal(fx.events.length,8);assert.equal(fx.active(1000).length,0);fx.begin('new','me');assert.equal(fx.lastSequence,0);
});
test('pixel trajectories preserve endpoints, remain capped, scale attacks and support static accessibility',()=>{
 const from={x:12,y:15},to={x:300,y:600},base={sourceId:'me',targetId:'enemy',channel:'outgoing',amount:6,start:0};
 const small=trajectoryPixels(base,288,from,to),large=trajectoryPixels({...base,amount:24},288,from,to);
 assert.ok(large.rects.length>small.rects.length);for(const rect of large.rects)for(const value of rect)assert.equal(value%3,0);
 const settings={reducedMotion:true,flashing:'reduced'},a=trajectoryPixels(base,0,from,to,settings),b=trajectoryPixels(base,500,from,to,settings);assert.deepEqual(a.rects,b.rects);assert.deepEqual(a.rects[0].slice(0,2),[12,15]);assert.deepEqual(a.rects.at(-1).slice(0,2),[300,600]);assert.equal(trajectoryPixels(base,600,from,to,settings).color,TARGET_VFX.colors.outgoing);assert.equal(trajectoryPixels(base,672,from,to).rects.length,0);assert.equal(TARGET_VFX.colors.reversal,'#38FFFF');
});
