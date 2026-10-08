import {spawn} from 'node:child_process';
import {createGameServer} from '../server.mjs';
const game=createGameServer({port:0,host:'127.0.0.1'}),url=await game.listen();
async function run(command,args){await new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],env:{...process.env,PANEL99_WEB_URL:url}});let output='';const timer=setTimeout(()=>{child.kill();reject(Error('Selector check timeout'));},60000);child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);child.on('error',reject);child.on('close',code=>{clearTimeout(timer);console.log(output.trim());code||/^ERROR:|SCRIPT ERROR/m.test(output)?reject(Error('Selector check failed')):resolve();});});}
try{await run('godot',['--path','godot','--script','res://tests/selector_smoke.gd']);await run('./node_modules/.bin/electron',['scripts/selector-web-smoke.cjs']);}finally{await game.close();}
