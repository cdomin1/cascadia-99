import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {Board} from '../engine.mjs';
import {chooseSwap} from '../bot.mjs';
import {useAbility} from '../abilities.mjs';
import {createGameServer} from '../server.mjs';
import {TUTORIALS} from '../tutorials.mjs';
const clone=structuredClone;
const snapshot=b=>clone({grid:b.grid,blocks:b.garbageBlocks,cursor:b.cursor,rise:b.rise,matches:b.matches,phase:b.phase,chain:b.chain,score:b.score,falls:b.falls,fallSerial:b.fallSerial,flux:b.flux,maxFluxHeld:b.maxFluxHeld,activeAbility:b.activeAbility,abilityRemaining:b.abilityRemaining,incoming:b.incoming});
function seedBoard(){
 let seed=718;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const b=new Board(random);b.grid=Array.from({length:12},()=>Array(6).fill(0));
 b.grid[7]=[3,4,2,3,2,2];b.grid[8]=[4,3,3,1,2,4];b.grid[9]=[3,2,4,2,1,3];b.grid[10]=[2,0,2,4,3,3];b.grid[11]=[1,1,2,1,3,4];b.cursor={x:2,y:10};return b;
}
export function recordMechanic(id){
 const b=seedBoard(),frames=[];const player={id:'demo',name:'Demo',board:b};const room={mode:'battle',players:new Map([['demo',player]])};
 const ability=['pulse','shift','surge','overdrive'].includes(id);if(ability)b.flux=100;if(id==='pulse')b.receive(12,10);
 let activated=false;
 for(let tick=0;tick<400;tick++){
  const events=[];
  function swap(x,y){b.move(x-b.cursor.x,y-b.cursor.y);const left=b.grid[y][x],right=b.grid[y][x+1];if(b.swap())events.push({type:'swap',x,y,left,right});}
  if(!ability){if(tick===38)swap(2,11);if(tick===150&&id==='garbage')b.dropGarbage(12);if(tick===203)swap(2,9);if(tick===278)swap(3,9);}
  if(ability&&tick===(id==='overdrive'?165:50)){
   const before=b.flux,result=useAbility(player,room,id);assert.ok(result,`${id} demonstration activation rejected`);activated=true;
   events.push({type:id==='pulse'?'pulse':'ability',ability:id,cancelled:result.cancelled});
   assert.equal(b.flux,before-(id==='overdrive'?before:b.balance[id].cost));
  }
  if(ability&&['surge','overdrive'].includes(id)&&tick===(id==='overdrive'?210:100))swap(2,11);
  b.tick(.02,ability ? .025 : 0,false);events.push(...b.events.splice(0));
  if(tick%5===0)frames.push({now:tick*20,boards:[snapshot(b)],events,own:snapshot(b)});
  else if(frames.length)frames.at(-1).events.push(...events);
 }
 if(ability)assert.ok(activated);
 if(id==='chains')assert.ok(frames.some(f=>f.own.chain>=2),'Chain footage must contain a real chain');
 if(id==='garbage')assert.ok(frames.some(f=>f.events.some(e=>e.type==='convert')),'Garbage footage must contain conversion');
 return frames;
}
async function recordMode(url,mode,bots){
 return new Promise((resolve,reject)=>{
  const socket=new WebSocket(url.replace('http','ws')+'/socket'),frames=[],events=[];let id,plan;
  const timeout=setTimeout(()=>{socket.close();reject(Error(`Recording ${mode} timed out`))},20000);
  socket.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('Tutorial socket failed'))});
  socket.addEventListener('message',({data})=>{
   const m=JSON.parse(data);
   if(m.type==='hello'){id=m.id;socket.send(JSON.stringify({type:'create',name:'DEMO',mode,bots,difficulty:'hard',quick:true}));}
   if(['effect','swap','garbage','break','convert','ability','pulse'].includes(m.type))events.push(m);
   if(m.type!=='state'||m.countdown>0)return;
   assert.equal(m.players.length,bots+1);assert.equal(m.mode,mode);
   const players=[m.players.find(p=>p.id===id),...m.players.filter(p=>p.id!==id)];
   frames.push({now:frames.length*100,boards:players.slice(0,10),own:m.self,events:events.splice(0),remaining:m.remaining,seats:m.players.length,team:m.team});
   if(m.self.phase==='idle'){
    const board=Object.assign(Object.create(Board.prototype),{grid:players[0].grid,cursor:m.self.cursor,phase:m.self.phase,garbageBlocks:players[0].blocks});
    if(!plan)plan=chooseSwap(board,'hard',()=>.8);
    const send=message=>socket.send(JSON.stringify(message));
    if(plan){if(board.cursor.x!==plan.x)send({type:'move',dx:Math.sign(plan.x-board.cursor.x),dy:0});else if(board.cursor.y!==plan.y)send({type:'move',dx:0,dy:Math.sign(plan.y-board.cursor.y)});else{send({type:'swap'});plan=null;}}
   }else plan=null;
   if(frames.length===80){clearTimeout(timeout);socket.close();resolve(frames)}
  });
 });
}
if(process.argv[1]?.endsWith('record-tutorials.mjs')){
 const game=createGameServer({port:0,host:'127.0.0.1'}),url=await game.listen();
 try{
  const clips={};for(const t of TUTORIALS.filter(t=>t.group!=='Modes'))clips[t.id]=recordMechanic(t.id);
  const modes=await Promise.all([['duel',1],['quad',3],['teams',3],['battle',98]].map(async([mode,bots])=>[mode,await recordMode(url,mode,bots)]));
  for(const [id,frames]of modes)clips[id]=frames;
  await mkdir('.web-smoke',{recursive:true});await writeFile('.web-smoke/tutorial-recordings.json',JSON.stringify(clips));
  console.log('TUTORIAL_RECORD_OK: four real server rooms and six authoritative engine/ability examples');
  await new Promise((resolve,reject)=>{const child=spawn('./node_modules/.bin/electron',['scripts/render-tutorials.cjs'],{stdio:'inherit',env:{...process.env,PANEL99_WEB_URL:url}});child.on('error',reject);child.on('close',code=>code?reject(Error('Tutorial renderer failed')):resolve())});
 }finally{await game.close()}
}
