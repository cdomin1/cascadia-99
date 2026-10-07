import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PresentationEffects,RETRO,ringPixels,bitmapText,impactProfile,step} from '../presentation-effects.mjs';
import {SoundEffects} from '../sound.mjs';

test('web and native use the same bitmap glyphs, pixel grid, and opaque effect palette',()=>{
  assert.deepEqual(JSON.parse(readFileSync(new URL('../godot/assets/retro-vfx.json',import.meta.url))),RETRO);
  assert.equal(RETRO.font.O.length,7);assert.ok(RETRO.font['6'].every(row=>row.length===5));
  for(const color of [...RETRO.cyan,...RETRO.magenta])assert.match(color,/^#[0-9A-F]{6}$/);
});
test('pixel shockwaves are symmetric, snapped, and have a hollow readable center',()=>{
  const pixels=ringPixels(180,360,90),set=new Set(pixels.map(([x,y])=>`${x},${y}`));
  assert.ok(pixels.length>100);assert.equal(set.has('180,360'),false);
  for(const [x,y,w,h]of pixels){assert.equal(x%3,0);assert.equal(y%3,0);assert.equal(w,3);assert.equal(h,3);assert.ok(set.has(`${360-x},${720-y}`));}
});
test('vector effect rendering keeps flashes at the perimeter and uses bounded geometric paths',()=>{
  const paths=[];let points=[];const ctx={save(){},restore(){},beginPath(){points=[];},moveTo(x,y){points.push([x,y]);},lineTo(x,y){points.push([x,y]);},stroke(){paths.push(points);},fillRect(){}};
  const fx=new PresentationEffects();for(const kind of ['pulse','shift','surge','overdrive','full'])fx.trigger(kind,0);
  fx.draw(ctx,64,360,720,'overdrive');
  assert.ok(paths.length>5);assert.ok(paths.every(p=>p.length<=25));
  assert.ok(paths.flat().every(p=>p.every(Number.isFinite)));
});
test('shake thresholds follow combo and chain intensity, align to pixels, and stop on schedule',()=>{
  const normal=impactProfile('effect',{count:3});assert.equal(normal.strength,0);
  assert.equal(impactProfile('effect',{count:5}).strength,1);
  assert.deepEqual([2,3,4,5,6].map(chain=>impactProfile('effect',{chain}).strength),[2,2,3,4,4]);
  for(const kind of ['effect','garbage','overdrive']){
    const fx=new PresentationEffects();fx.trigger(kind,0,{chain:6,size:18});
    for(let now=0;now<160;now+=16){const p=fx.offset(now);assert.equal(Math.abs(p.x)%3,0);assert.equal(Math.abs(p.y)%3,0);assert.deepEqual(fx.offset(now,true),{x:0,y:0});}
    assert.deepEqual(fx.offset(180),{x:0,y:0});
  }
});
test('discrete movement, full-meter edge triggering, and bounded bursts withstand repeated events',()=>{
  assert.deepEqual([0,16,32,64,96,128].map(t=>step(t,128,5)),[0,0,.25,.5,.75,1]);
  const fx=new PresentationEffects();fx.meter(100,100,0);fx.meter(100,100,32);assert.equal(fx.sparks.length,1);
  fx.meter(99,100,64);fx.meter(100,100,96);assert.equal(fx.sparks.length,2);
  for(let i=0;i<1000;i++)fx.trigger('overdrive',i);assert.ok(fx.waves.length<=8);assert.ok(fx.flashes.length<=4);assert.ok(fx.impacts.length<=8);
});
test('reduced settings retain feedback without motion, flashes, or lost mute preferences',()=>{
  const fx=new PresentationEffects({reducedMotion:true});fx.trigger('overdrive',0);fx.meter(100,100,0);assert.equal(fx.waves.length,0);assert.equal(fx.hitStopUntil,0);
  const quiet=new PresentationEffects({flashing:'reduced',shake:'off'});quiet.trigger('overdrive',0);assert.equal(quiet.flashes.length,0);assert.deepEqual(quiet.offset(32),{x:0,y:0});assert.equal(quiet.hitStopUntil,0);
  const sounds=new SoundEffects();sounds.context={state:'running'};const signatures=[];
  for(const ability of ['pulse','shift','surge','overdrive']){const notes=[];sounds.tone=(f,d,options)=>notes.push([f,d,options.type]);sounds.noise=()=>{};assert.equal(sounds.play(ability),true);assert.ok(notes.every(n=>['square','triangle'].includes(n[2])));signatures.push(JSON.stringify(notes));}
  assert.equal(new Set(signatures).size,4);sounds.enabled=false;assert.equal(sounds.play('overdrive'),false);
});

test('fragments crossing an occupied-cell boundary do not cover readable tiles',async()=>{
  const {BoardAnimations}=await import('../visuals.mjs');
  const animations=new BoardAnimations(),calls=[];
  animations.particles=[{x:57,y:30,vx:0,vy:0,size:6,color:'#38FFFF',start:0}];
  const grid=Array.from({length:12},()=>Array(6).fill(0));grid[0][1]=2;
  const ctx={beginPath(){},moveTo(){},lineTo(){},stroke(){calls.push(true)},fillRect(...rect){calls.push(rect)}};
  animations.overlay(ctx,0,grid);assert.equal(calls.length,0);
  grid[0][1]=0;animations.overlay(ctx,0,grid);assert.equal(calls.length,1);
});
