import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../server.mjs';
async function setup(t){
  const game=createGameServer({port:0,host:'127.0.0.1'}),url=await game.listen(),sockets=[];
  t.after(async()=>{for(const ws of sockets)ws.close();await game.close();});
  async function client(){
    const ws=new WebSocket(url.replace('http:','ws:')+'/socket');sockets.push(ws);const messages=[];ws.addEventListener('message',event=>messages.push(JSON.parse(event.data)));
    const wait=async(type,predicate=()=>true)=>{const deadline=Date.now()+6500;while(Date.now()<deadline){const i=messages.findIndex(m=>m.type===type&&predicate(m));if(i>=0)return messages.splice(i,1)[0];await new Promise(resolve=>setTimeout(resolve,15));}throw new Error(`Timed out waiting for ${type}`);};
    const hello=await wait('hello');return {ws,id:hello.id,wait,send:msg=>ws.send(JSON.stringify(msg))};
  }return {client,url};
}
test('2P rooms enforce capacity, settings permissions, and CPU fill',async t=>{
  const {client}=await setup(t),a=await client(),b=await client(),c=await client();
  a.send({type:'create',mode:'duel',ruleset:'rush'});const lobby=await a.wait('lobby');assert.equal(lobby.capacity,2);
  a.send({type:'start'});assert.match((await a.wait('error')).message,/exactly 2/);
  b.send({type:'join',code:lobby.room});await b.wait('lobby');
  c.send({type:'join',code:lobby.room});assert.match((await c.wait('error')).message,/2 players/);
  b.send({type:'settings',mode:'battle',ruleset:'classic'});b.send({type:'join',code:lobby.room});assert.equal((await b.wait('lobby',m=>m.players.length===2)).mode,'duel');
  a.send({type:'bots',count:1,difficulty:'easy'});assert.match((await a.wait('error')).message,/exceed 2/);
  b.send({type:'leave'});await b.wait('left');a.send({type:'bots',count:1,difficulty:'easy'});await a.wait('lobby',m=>m.botCount===1);
  a.send({type:'start'});const start=await a.wait('start');assert.equal(start.mode,'duel');assert.equal(start.ruleset,'rush');assert.equal(start.total,2);
});
test('4P starts only with four seats and rejects smaller modes until room fits',async t=>{
  const {client}=await setup(t),a=await client();a.send({type:'create',mode:'quad',bots:2});await a.wait('lobby');a.send({type:'start'});assert.match((await a.wait('error')).message,/exactly 4/);
  a.send({type:'settings',mode:'duel',ruleset:'classic'});assert.match((await a.wait('error')).message,/Remove/);
  a.send({type:'bots',count:3,difficulty:'normal'});await a.wait('lobby',m=>m.botCount===3);a.send({type:'start'});assert.equal((await a.wait('start')).total,4);
});
test('four real players switch teams, reject friendly targeting, win together, and rematch',async t=>{
  const {client}=await setup(t),a=await client(),b=await client(),c=await client(),d=await client();
  a.send({type:'create',mode:'teams'});const initial=await a.wait('lobby');
  for(const p of [b,c,d]){p.send({type:'join',code:initial.room,name:p.id});await p.wait('lobby');}
  const full=await a.wait('lobby',m=>m.players.length===4);assert.equal(full.players.filter(p=>p.team==='a').length,2);
  a.send({type:'team',id:c.id,team:'b'});const switched=await a.wait('lobby',m=>m.players.find(p=>p.id===c.id)?.team==='b');assert.equal(switched.players.filter(p=>p.team==='a').length,2);assert.equal(switched.players.find(p=>p.id===b.id).team,'a');
  d.send({type:'team',id:a.id,team:'b'});d.send({type:'join',code:initial.room});const denied=await d.wait('lobby',m=>m.players.length===4);assert.equal(denied.players.find(p=>p.id===a.id).team,'a');
  a.send({type:'start'});await a.wait('start');await a.wait('state',m=>m.countdown===0);
  a.send({type:'target',id:b.id});a.send({type:'move',dx:1,dy:0});let state=await a.wait('state',m=>m.self.cursor.x===3);assert.equal(state.self.target,null);
  a.send({type:'target',id:c.id});state=await a.wait('state',m=>m.self.target===c.id);assert.equal(state.self.target,c.id);
  c.ws.close();d.ws.close();const end=await a.wait('finished');assert.equal(end.winnerTeam,'a');assert.equal(end.won,true);assert.deepEqual(new Set(end.winnerIds),new Set([a.id,b.id]));assert.equal((await b.wait('finished')).won,true);
  a.send({type:'rematch'});const rematch=await a.wait('lobby',m=>m.state==='waiting'&&m.players.length===2);assert.equal(rematch.mode,'teams');
  a.send({type:'bots',count:2,difficulty:'hard'});const filled=await a.wait('lobby',m=>m.botCount===2);assert.equal(filled.players.filter(p=>p.team==='b').length,2);a.send({type:'start'});assert.equal((await a.wait('start')).total,4);
});
test('invalid modes are rejected and newly added browser modules are served safely',async t=>{
  const {client,url}=await setup(t),a=await client();a.send({type:'create',mode:'nonsense'});assert.match((await a.wait('error')).message,/valid match mode/);
  for(const file of ['match-rules.mjs','records.mjs','neo-vector.mjs']){const response=await fetch(url+'/'+file);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'text/javascript');}
  assert.equal((await fetch(url+'/test/modes-multiplayer.test.mjs')).status,404);
});
