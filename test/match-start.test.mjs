import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareStart,readyStart,startStatus,startFields} from '../match-start.mjs';
import {createGameServer} from '../server.mjs';
import {Board} from '../engine.mjs';

test('readiness barrier schedules one immutable three-second countdown after a one-second intro',()=>{
 const s=prepareStart([{id:'a',startProtocol:1},{id:'b',startProtocol:1},{id:'cpu',bot:true}],100,'m');
 assert.equal(startStatus(s,500).phase,'preparing');assert.equal(readyStart(s,'forged',500),false);
 readyStart(s,'a',1000);readyStart(s,'a',1200);assert.equal(s.startAt,null);
 assert.equal(readyStart(s,'b',2000),true);assert.equal(s.countdownAt,3000);assert.equal(s.startAt,6000);
 assert.equal(readyStart(s,'b',2500),false);assert.equal(startStatus(s,2999).phase,'intro');
 for(const [now,count]of [[3000,3],[3999,3],[4000,2],[4999,2],[5000,1],[5999,1],[6000,0]])assert.equal(startStatus(s,now).countdown,count);
 assert.equal(startStatus(s,6000).phase,'active');assert.equal(startFields(s,7000).startAt,6000);
 const expired=prepareStart([{id:'a',startProtocol:1}],0,'timeout');assert.equal(readyStart(expired,'a',10000),false);assert.equal(expired.startAt,null);
});

async function setup(t){
 const boards=[];
 const game=createGameServer({port:0,host:'127.0.0.1',boardFactory:()=>{const b=new Board(()=>.4);b.flux=100;b.receive(6,99);boards.push(b);return b;}});
 const url=await game.listen(),sockets=[];
 t.after(async()=>{for(const ws of sockets)ws.close();await game.close();});
 async function client(){
  const ws=new WebSocket(url.replace('http:','ws:')+'/socket');sockets.push(ws);const messages=[];
  ws.addEventListener('message',({data})=>messages.push(JSON.parse(data)));
  async function wait(type,predicate=()=>true){const until=Date.now()+6500;while(Date.now()<until){const i=messages.findIndex(m=>m.type===type&&predicate(m));if(i>=0)return messages.splice(i,1)[0];await new Promise(r=>setTimeout(r,10));}throw Error('Timed out '+type);}
  const hello=await wait('hello');ws.send(JSON.stringify({type:'session',resumable:true,startProtocol:1}));
  return {ws,hello,wait,send:m=>ws.send(JSON.stringify(m))};
 }
 return {client,boards};
}

test('all modes including 99 CPU seats freeze boards, CPUs, Flux and abilities until the shared GO',async t=>{
 const {client,boards}=await setup(t);
 for(const [mode,bots]of [['duel',1],['quad',3],['teams',3],['battle',98]]){
  const a=await client();a.send({type:'create',mode,bots,quick:true});const start=await a.wait('start');
  const first=await a.wait('state');const initial=boards.map(b=>({grid:JSON.stringify(b.grid),rise:b.rise,flux:b.flux,hold:b.maxFluxHeld,incoming:JSON.stringify(b.incoming)}));
  a.send({type:'move',dx:-1,dy:0});a.send({type:'swap'});a.send({type:'boost',active:true});a.send({type:'ability',ability:'surge',requestId:'early'});
  await new Promise(r=>setTimeout(r,150));
  assert.deepEqual(boards.map(b=>({grid:JSON.stringify(b.grid),rise:b.rise,flux:b.flux,hold:b.maxFluxHeld,incoming:JSON.stringify(b.incoming)})),initial);
  a.send({type:'ready',matchId:'wrong'});a.send({type:'ready',matchId:start.matchId});const scheduled=await a.wait('startScheduled');
  assert.equal(scheduled.startAt-scheduled.countdownAt,3000);assert.equal(scheduled.matchId,start.matchId);
  a.send({type:'ready',matchId:start.matchId});const counting=await a.wait('state',s=>s.phase==='countdown');assert.equal(counting.startAt,scheduled.startAt);assert.equal(counting.elapsed,0);assert.equal(counting.self.cursor.x,2);assert.equal(counting.self.activeAbility,null);
  const active=await a.wait('state',s=>s.phase==='active');assert.ok(active.serverNow>=scheduled.startAt);assert.equal(active.countdown,0);assert.equal(active.players.length,bots+1);
  assert.equal(first.self.flux,100);a.send({type:'leave'});await a.wait('left');
 }
});

test('two human clients synchronize despite delayed readiness and resume without restarting countdown or active match',async t=>{
 const {client}=await setup(t);const a=await client(),b=await client();
 a.send({type:'create',mode:'duel'});const lobby=await a.wait('lobby');b.send({type:'join',code:lobby.room});await b.wait('lobby');a.send({type:'start'});
 const sa=await a.wait('start'),sb=await b.wait('start');assert.equal(sa.matchId,sb.matchId);
 a.send({type:'ready',matchId:sa.matchId});await new Promise(r=>setTimeout(r,180));assert.equal((await a.wait('state',s=>s.phase==='preparing')).startAt,null);
 b.send({type:'ready',matchId:sb.matchId});const deadline=await a.wait('startScheduled');assert.equal((await b.wait('startScheduled')).startAt,deadline.startAt);
 b.ws.close();await new Promise(r=>setTimeout(r,100));const recovered=await client();recovered.send({type:'resume',token:b.hello.resumeToken});await recovered.wait('resumed');
 const resumed=await recovered.wait('start');assert.equal(resumed.startAt,deadline.startAt);assert.equal(resumed.matchId,deadline.matchId);assert.equal(resumed.resumed,true);
 await a.wait('state',s=>s.phase==='active');await recovered.wait('state',s=>s.phase==='active');
 recovered.ws.close();await new Promise(r=>setTimeout(r,100));const active=await client();active.send({type:'resume',token:b.hello.resumeToken});await active.wait('resumed');assert.equal((await active.wait('start')).phase,'active');
 a.send({type:'leave'});await a.wait('left');
});

test('explicit departure cancels a pre-GO start and permits a fresh match ID',async t=>{
 const {client}=await setup(t);const a=await client(),b=await client();a.send({type:'create',mode:'duel'});const lobby=await a.wait('lobby');b.send({type:'join',code:lobby.room});await b.wait('lobby');a.send({type:'start'});const first=await a.wait('start');await b.wait('start');
 b.send({type:'leave'});await a.wait('startCancelled');const waiting=await a.wait('lobby',s=>s.state==='waiting'&&s.players.length===1);assert.equal(waiting.players.length,1);
 a.send({type:'bots',count:1,difficulty:'easy'});await a.wait('lobby',s=>s.players.length===2);a.send({type:'start'});const next=await a.wait('start');assert.notEqual(next.matchId,first.matchId);assert.equal(next.startAt,null);
});
