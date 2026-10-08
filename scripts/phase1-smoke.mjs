import {spawn} from 'node:child_process';
import {Board} from '../engine.mjs';
import {createGameServer} from '../server.mjs';

// Seed only inside this test process. The public server has no cheat/debug endpoint.
const boardFactory=()=>{
  const b=new Board(()=>.4);b.grid=b.grid.map(row=>row.map(()=>0));
  b.grid[11]=[1,2,3,4,1,2];b.flux=100;b.receive(12,100);return b;
};
const game=createGameServer({port:0,host:'127.0.0.1',boardFactory});
const url=await game.listen();
async function run(command,args){
  return new Promise((resolve,reject)=>{
    const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],env:{...process.env,PANEL99_WEB_URL:url}});
    let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
    const timer=setTimeout(()=>{child.kill();reject(Error('Phase 1 smoke timeout\n'+output));},65000);
    child.on('error',e=>{clearTimeout(timer);reject(e);});
    child.on('close',code=>{clearTimeout(timer);console.log(output.trim());if(code||/SCRIPT ERROR|ERROR: Failed to load/.test(output))reject(Error('Phase 1 launch check failed'));else resolve();});
  });
}
try{
  await run('godot',['--headless','--path','godot','--script','res://tests/phase1_smoke.gd','--','--server',url]);
  await run('./node_modules/.bin/electron',['scripts/phase1-web-smoke.cjs']);
}finally{await game.close();}
