import {spawn} from 'node:child_process';
import {createGameServer} from '../server.mjs';
const game=createGameServer({port:0,host:'127.0.0.1'});
const url=await game.listen();
async function run(command,args){
 return new Promise((resolve,reject)=>{
  const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],env:{...process.env,PANEL99_WEB_URL:url}});
  let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
  const timer=setTimeout(()=>{child.kill();reject(Error('Retro fixture timeout\n'+output))},60000);
  child.on('error',e=>{clearTimeout(timer);reject(e)});
  child.on('close',code=>{clearTimeout(timer);console.log(output.trim());if(code||/SCRIPT ERROR|^ERROR:/m.test(output))reject(Error('Retro fixture check failed'));else resolve()});
 });
}
try{
 await run('godot',['--path','godot','--script','res://tests/retro_vfx_smoke.gd']);
 await run('./node_modules/.bin/electron',['scripts/retro-vfx-smoke.cjs']);
}finally{await game.close()}
