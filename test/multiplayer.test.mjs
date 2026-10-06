import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

test('real WebSocket clients create, join, play, win on departure, and rematch',async t=>{
  const port=34000+Math.floor(Math.random()*10000);
  const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:String(port),HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
  t.after(()=>server.kill('SIGTERM'));
  await Promise.race([once(server.stdout,'data'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Server did not start')),4000))]);
  const sockets=[];
  function client(){
    const ws=new WebSocket(`ws://127.0.0.1:${port}/socket`);sockets.push(ws);const messages=[];ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));
    const wait=async(type,predicate=()=>true)=>{const deadline=Date.now()+6000;while(Date.now()<deadline){const index=messages.findIndex(m=>m.type===type&&predicate(m));if(index>=0)return messages.splice(index,1)[0];await new Promise(r=>setTimeout(r,15));}throw new Error(`Timed out waiting for ${type}`);};
    return {ws,wait,send:msg=>ws.send(JSON.stringify(msg))};
  }
  t.after(()=>sockets.forEach(s=>s.close()));
  const a=client(),b=client();const helloA=await a.wait('hello');await b.wait('hello');
  a.send({type:'create',name:'Host'});const lobby=await a.wait('lobby');assert.match(lobby.room,/^[A-F0-9]{6}$/);
  b.send({type:'join',name:'Friend',code:lobby.room.toLowerCase()});const joined=await a.wait('lobby',m=>m.players.length===2);await b.wait('lobby');assert.equal(joined.players.length,2);
  b.send({type:'start'});await new Promise(r=>setTimeout(r,100));a.send({type:'start'});
  assert.equal((await a.wait('start')).total,2);await b.wait('start');
  const initial=await a.wait('state');assert.deepEqual(initial.players[0].grid,initial.players[1].grid);
  await a.wait('state',m=>m.countdown===0);a.send({type:'move',dx:1,dy:0});const moved=await a.wait('state',m=>m.self.cursor.x===3);assert.equal(moved.self.cursor.x,3);
  b.ws.close();const end=await a.wait('finished');assert.equal(end.winnerId,helloA.id);assert.equal(end.place,1);
  a.send({type:'rematch'});const again=await a.wait('lobby');assert.equal(again.state,'waiting');assert.equal(again.players.length,1);
  const page=await fetch(`http://127.0.0.1:${port}/`);assert.equal(page.status,200);assert.match(await page.text(),/Room code/);
  assert.equal((await fetch(`http://127.0.0.1:${port}/server.mjs`)).status,404);
});
