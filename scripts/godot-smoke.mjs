import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createGameServer} from '../server.mjs';
const game=createGameServer({port:0,host:'127.0.0.1'});
const url=await game.listen();
async function run(args,onText=()=>{}){
 return new Promise((accept,reject)=>{
  const child=spawn('godot',['--headless','--path',resolve('godot'),'--script','res://tests/protocol_smoke.gd','--','--url',url,...args],{stdio:['ignore','pipe','pipe']});
  let output='';const timer=setTimeout(()=>{child.kill();reject(new Error('Godot protocol timeout\n'+output));},25000);
  child.stdout.on('data',chunk=>{output+=chunk;onText(output);});child.stderr.on('data',chunk=>output+=chunk);
  child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);if(code!==0||/SCRIPT ERROR|ERROR:/.test(output))reject(new Error(output));else{console.log(output.trim());accept(output);}});
 });
}
function browserClient(){
 const socket=new WebSocket(url.replace('http','ws')+'/socket');
 const queue=[],waiting=[];
 socket.addEventListener('message',({data})=>{const message=JSON.parse(data);const index=waiting.findIndex(item=>item.type===message.type);if(index>=0){const item=waiting.splice(index,1)[0];clearTimeout(item.timer);item.accept(message);}else queue.push(message);});
 return {socket,send:message=>socket.send(JSON.stringify(message)),wait:type=>{const i=queue.findIndex(message=>message.type===type);if(i>=0)return Promise.resolve(queue.splice(i,1)[0]);return new Promise((accept,reject)=>{const item={type,accept,timer:setTimeout(()=>reject(new Error('Web client timed out: '+type)),15000)};waiting.push(item);});}};
}
try{
 for(const [mode,bots]of [['duel',1],['quad',3],['teams',3],['battle',98]])await run(['--mode',mode,'--bots',String(bots)]);
 const web=browserClient();await web.wait('hello');web.send({type:'create',name:'Browser host',mode:'duel'});const lobby=await web.wait('lobby');
 let started=false;
 const result=await run(['--mode','duel','--code',lobby.room],output=>{if(!started&&output.includes('GODOT_LOBBY_READY')){started=true;web.send({type:'start'});}});
 assert.match(result,/GODOT_PROTOCOL_OK/);const finish=await web.wait('finished');assert.equal(finish.won,true);web.socket.close();
 console.log('GODOT_CROSSPLAY_OK: browser host and real Godot client share a room and finish on departure');
}finally{await game.close();}
