import test from 'node:test';import assert from 'node:assert/strict';import {BattleIntroTimeline} from '../battle-intro.mjs';
test('presentation shares a three second deadline and reconnect cannot replay an active intro',()=>{
 const intro=new BattleIntroTimeline();intro.observe({serverNow:1000},0);intro.begin({matchId:'a',countdownAt:2000,startAt:5000});
 assert.equal(intro.label(1000),'3');assert.equal(intro.label(1999),'3');assert.equal(intro.label(2000),'2');assert.equal(intro.label(3000),'1');assert.equal(intro.canPlay(3999),false);assert.equal(intro.canPlay(4000),true);assert.equal(intro.label(4000),'GO!');
 intro.schedule({matchId:'a',countdownAt:10000,startAt:13000});assert.equal(intro.startAt,5000);
 const resumed=new BattleIntroTimeline();resumed.observe({serverNow:5500},0);resumed.begin({matchId:'a',resumed:true,countdownAt:2000,startAt:5000});assert.equal(resumed.label(0),'');
});
test('clock uses the best RTT midpoint without tying countdown duration to packets',()=>{
 const intro=new BattleIntroTimeline();intro.observe({type:'clock',sentAt:100,serverNow:1010},120);assert.equal(intro.time(200),1100);
 intro.observe({type:'clock',sentAt:200,serverNow:5000},500);assert.equal(intro.time(200),1100);
});
