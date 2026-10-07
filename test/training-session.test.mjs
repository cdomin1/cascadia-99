import test from 'node:test';import assert from 'node:assert/strict';import {TrainingSession,PRACTICE_DEFAULTS} from '../training-session.mjs';
const step=s=>{for(let i=0;i<200;i++)s.tick(.05);};
test('offline lessons use real clears, retry/navigation and Glitch conversion',()=>{
 const messages=[];const s=new TrainingSession({mode:'tutorial',lesson:1,emit:m=>messages.push(m)});
 s.handle({type:'swap'});step(s);assert.equal(s.done,true);assert.ok(messages.some(m=>m.type==='effect'));assert.ok(s.player.board.flux>0);
 s.handle({type:'trainingControl',action:'lesson',lesson:4});s.handle({type:'swap'});step(s);assert.equal(s.done,true);assert.ok(messages.some(m=>m.type==='convert'));assert.ok(messages.some(m=>m.type==='attack'));
 s.handle({type:'trainingControl',action:'restart'});assert.equal(s.done,false);
});
test('practice assistance and safe recovery are isolated from normal gameplay',()=>{
 const s=new TrainingSession({options:{flux:'unlimited',gameOver:false}});assert.deepEqual(PRACTICE_DEFAULTS,{rise:'off',glitch:'off',flux:'normal',gameOver:false});
 s.tick(.05);assert.equal(s.player.board.flux,100);s.player.board.dead=true;s.tick(.05);assert.equal(s.player.board.dead,false);assert.equal(s.recoveries,1);
 s.handle({type:'trainingControl',action:'pause'});const before=JSON.stringify(s.player.board.grid);s.tick(.1);s.handle({type:'swap'});assert.equal(JSON.stringify(s.player.board.grid),before);
 const lethal=new TrainingSession({options:{gameOver:true}});lethal.player.board.dead=true;lethal.tick(.1);assert.equal(lethal.player.board.dead,true);
});
test('training abilities use real costs, cooldowns and duplicate rejection',()=>{
 const s=new TrainingSession();s.player.board.flux=100;s.player.board.receive(12,10);
 s.handle({type:'ability',ability:'pulse',requestId:'one'});assert.equal(s.player.board.flux,65);s.handle({type:'ability',ability:'pulse',requestId:'one'});assert.equal(s.player.board.flux,65);
});
test('combo lesson demonstrates a real combo then a real chain',()=>{
 const s=new TrainingSession({mode:'tutorial',lesson:3});s.handle({type:'swap'});step(s);assert.ok(s.actions.has('combo'));assert.equal(s.done,false);s.handle({type:'swap'});step(s);assert.equal(s.done,true);
});

test('all four lesson abilities and the scripted battle finish through real transactions',()=>{
 const s=new TrainingSession({mode:'tutorial',lesson:5});
 s.handle({type:'ability',ability:'pulse',requestId:'p'});for(let i=0;i<8;i++)s.tick(.05);
 s.handle({type:'ability',ability:'shift',requestId:'s'});for(let i=0;i<8;i++)s.tick(.05);
 s.handle({type:'ability',ability:'surge',requestId:'u'});for(let i=0;i<65;i++)s.tick(.05);
 s.handle({type:'ability',ability:'overdrive',requestId:'o'});assert.equal(s.done,true);
 const battle=new TrainingSession({mode:'tutorial',lesson:6});battle.handle({type:'target',id:'training-rival'});battle.handle({type:'swap'});step(battle);assert.ok(battle.actions.has('sent'));battle.handle({type:'ability',ability:'pulse',requestId:'defend'});assert.equal(battle.done,true);assert.equal(battle.opponent.board.dead,true);
});
test('movement lesson requires its target and rising lesson stays unpunished',()=>{
 const s=new TrainingSession({mode:'tutorial',lesson:0});s.handle({type:'move',dx:1,dy:0});s.handle({type:'swap'});assert.equal(s.done,false);step(s);s.handle({type:'move',dx:1,dy:0});s.handle({type:'move',dx:0,dy:1});s.handle({type:'move',dx:0,dy:1});s.handle({type:'swap'});assert.equal(s.done,true);
 s.handle({type:'trainingControl',action:'lesson',lesson:2});for(let i=0;i<25;i++)s.tick(.05);s.handle({type:'boost',active:true});assert.equal(s.done,true);
});
