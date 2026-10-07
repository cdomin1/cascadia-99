import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../server.mjs';

test('offline assistance cannot be enabled on a public bind or requested in competitive rooms',async()=>{
 assert.throws(()=>createGameServer({training:true,host:'0.0.0.0'}),/loopback/);
 const game=createGameServer({port:0,host:'127.0.0.1'}),messages=[];
 const url=await game.listen();const ws=new WebSocket(url.replace('http','ws')+'/socket');
 ws.addEventListener('message',event=>messages.push(JSON.parse(event.data)));
 const wait=async type=>{for(let i=0;i<100;i++){const found=messages.find(m=>m.type===type);if(found)return found;await new Promise(r=>setTimeout(r,10));}throw Error('Missing '+type);};
 try{
  await wait('hello');ws.send(JSON.stringify({type:'trainingStart',mode:'practice',options:{flux:'unlimited'}}));
  ws.send(JSON.stringify({type:'create',mode:'duel',name:'Competitive'}));
  const lobby=await wait('lobby');assert.equal(lobby.state,'waiting');assert.ok(!messages.some(m=>m.training||m.type==='trainingStatus'));
 }finally{ws.close();await game.close();}
});
