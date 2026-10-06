import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../server.mjs';

test('CPU-only battle, host controls, capacity, host transfer, and abandoned room cleanup',async t=>{
  const game=createGameServer({port:0,host:'127.0.0.1'}),url=await game.listen(),sockets=[];
  t.after(async()=>{for(const ws of sockets)ws.close();await game.close();});
  function client(){
    const ws=new WebSocket(url.replace('http:','ws:')+'/socket');sockets.push(ws);const messages=[];ws.addEventListener('message',event=>messages.push(JSON.parse(event.data)));
    const wait=async(type,predicate=()=>true)=>{const deadline=Date.now()+6500;while(Date.now()<deadline){const i=messages.findIndex(m=>m.type===type&&predicate(m));if(i>=0)return messages.splice(i,1)[0];await new Promise(resolve=>setTimeout(resolve,15));}throw new Error(`Timed out waiting for ${type}`);};
    return {ws,wait,send:msg=>ws.send(JSON.stringify(msg))};
  }
  const a=client(),b=client();const first=await a.wait('hello'),second=await b.wait('hello');
  a.send({type:'create',name:'Solo',bots:1,difficulty:'hard',quick:true});const lobby=await a.wait('lobby');assert.equal(lobby.botCount,1);assert.equal(lobby.players.filter(p=>p.bot).length,1);
  const start=await a.wait('start');assert.equal(start.humans,1);assert.equal(start.bots,1);
  const initial=await a.wait('state',m=>m.countdown===0);assert.equal(initial.players.length,2);assert.deepEqual(initial.players[0].grid,initial.players[1].grid);
  a.send({type:'leave'});await a.wait('left');
  b.send({type:'join',code:lobby.room});assert.match((await b.wait('error')).message,/not found/);
  a.send({type:'create',name:'Host'});const mixed=await a.wait('lobby');
  a.send({type:'bots',count:98,difficulty:'easy'});const full=await a.wait('lobby',m=>m.botCount===98);assert.equal(full.players.length,99);
  b.send({type:'join',name:'Guest',code:mixed.room});assert.match((await b.wait('error')).message,/99 players/);
  a.send({type:'bots',count:3,difficulty:'normal'});await a.wait('lobby',m=>m.botCount===3);
  b.send({type:'join',name:'Guest',code:mixed.room});const joined=await b.wait('lobby');assert.equal(joined.players.length,5);
  b.send({type:'bots',count:0,difficulty:'easy'});b.send({type:'join',code:mixed.room});assert.equal((await b.wait('lobby')).botCount,3);
  a.send({type:'bots',count:98,difficulty:'hard'});assert.match((await a.wait('error')).message,/exceed 99/);
  a.send({type:'leave'});await a.wait('left');assert.equal((await b.wait('host')).host,second.id);assert.notEqual(second.id,first.id);
  b.send({type:'bots',count:1,difficulty:'hard'});await b.wait('lobby',m=>m.botCount===1);
  b.send({type:'start'});await b.wait('start');const state=await b.wait('state',m=>m.countdown===0);assert.equal(state.players.length,2);assert.equal(state.players.find(p=>p.bot).name,'CPU 01');
});
