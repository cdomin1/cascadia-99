import {Board} from './engine.mjs';
import {abilityStatus,useAbility} from './abilities.mjs';
import {FLUX} from './flux-config.mjs';
export const LESSONS=[
 ['MOVE & SWAP','Move the selector to column 3 on the bottom row. Then swap!'],
 ['MATCH THREE','Line up 3! Swap the bottom pair in columns 3 and 4.'],
 ['RISING STACK','The stack keeps rising. Watch the top! Try raising it.'],
 ['COMBOS & CHAINS','Bigger clears send stronger attacks! Make the marked swap.'],
 ['GLITCH BLOCKS','Match next to Glitch Blocks to break them.'],
 ['FLUX','Make matches to fill Flux. Try Pulse, Shift, Surge and Overdrive!'],
 ['BATTLE BASICS','Target the training rival. Send an attack, then block one with Pulse.']
];
export const PRACTICE_DEFAULTS={rise:'off',glitch:'off',flux:'normal',gameOver:false};
const seedBoard=()=>{
 let seed=718;const b=new Board(()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;});
 b.grid=Array.from({length:12},()=>Array(6).fill(0));b.grid[7]=[3,4,2,3,2,2];b.grid[8]=[4,3,3,1,2,4];b.grid[9]=[3,2,4,2,1,3];b.grid[10]=[2,0,2,4,3,3];b.grid[11]=[1,1,2,1,3,4];b.cursor={x:2,y:11};return b;
};
const comboBoard=()=>{const b=seedBoard();b.grid=b.grid.map(r=>r.map(()=>0));for(let y=8;y<11;y++)b.grid[y][0]=1;b.grid[11]=[2,1,3,4,2,3];b.cursor={x:0,y:11};return b;};
export class TrainingSession {
 constructor({mode='practice',lesson=0,options={},id='training-player',emit=()=>{}}={}){
  this.mode=mode==='tutorial'?'tutorial':'practice';this.lesson=Math.max(0,Math.min(6,Math.trunc(lesson)||0));this.options={...PRACTICE_DEFAULTS};
  for(const [key,allowed]of Object.entries({rise:['off','slow','normal','fast'],glitch:['off','training'],flux:['normal','unlimited']}))if(allowed.includes(options[key]))this.options[key]=options[key];
  if(typeof options.gameOver==='boolean')this.options.gameOver=options.gameOver;
  this.id=id;this.emit=emit;this.serial=0;this.elapsed=0;this.paused=false;this.done=false;this.actions=new Set();this.requests=new Set();this.target=null;this.restart();
 }
 restart(){
  this.player={id:this.id,name:'YOU',board:seedBoard()};this.opponent={id:'training-rival',name:'TRAINING RIVAL',board:seedBoard()};this.room={mode:'duel',players:new Map([[this.id,this.player],[this.opponent.id,this.opponent]])};
  this.done=false;this.paused=false;this.actions.clear();this.requests.clear();this.elapsed=0;this.recoveries=0;this.serial=0;this.matchId=`training-${++TrainingSession.nextId}`;
  const b=this.player.board;
  if(this.mode==='tutorial'&&this.lesson===0)b.cursor={x:0,y:9};
  if(this.mode==='tutorial'&&this.lesson===1){b.grid=b.grid.map(r=>r.map(()=>0));b.grid[11]=[1,1,2,1,3,4];}
  if(this.mode==='tutorial'&&this.lesson===4){b.grid=b.grid.map(r=>r.map(()=>0));b.grid[11]=[1,1,2,1,3,4];b.dropGarbage(6);}
  if(this.mode==='tutorial'&&this.lesson>=5){b.flux=100;if(this.lesson===5)b.receive(12,30);}
  if(this.mode==='tutorial'&&this.lesson===3)this.player.board=comboBoard();
  if(this.mode==='practice'&&this.options.glitch==='training')b.dropGarbage(6);
  const now=Date.now();this.emit({type:'start',training:true,resumed:true,matchId:this.matchId,total:2,humans:1,bots:1,mode:'duel',ruleset:'classic',serverNow:now,startAt:now-1,countdownAt:now-3001});this.status();this.snapshot();
 }
 status(){this.emit({type:'trainingStatus',mode:this.mode,lesson:this.lesson,done:this.done,paused:this.paused,title:this.mode==='tutorial'?LESSONS[this.lesson][0]:'RELAXED PRACTICE',instruction:this.done?'Great! Choose NEXT, or try again.':this.mode==='tutorial'?LESSONS[this.lesson][1]:'Move. Swap. Match. Try a combo or chain!',actions:[...this.actions],recoveries:this.recoveries,options:this.options});}
 complete(){if(!this.done){this.done=true;this.status();this.emit({type:'tutorialSuccess'});}}
 handle(message){
  const b=this.player.board;
  if(message.type==='trainingControl'){
   const action=message.action;
   if(action==='restart'){this.restart();return;}
   if(this.mode==='practice'&&['combo','chain'].includes(action)){this.player.board=action==='combo'?comboBoard():seedBoard();this.paused=false;this.snapshot();return;}
   if(action==='pause'){this.paused=!this.paused;this.status();return;}
   if(action==='attack'&&b.incoming.length<32){b.receive(6,this.mode==='tutorial'?30:4);this.emit({type:'attack',from:this.opponent.name,to:'YOU',sourceId:this.opponent.id,targetId:this.id,amount:6,matchId:this.matchId,attackSequence:++this.serial,eventId:`${this.matchId}:${this.serial}`});this.status();return;}
   if(action==='next'||action==='back'){this.lesson=Math.max(0,Math.min(6,this.lesson+(action==='next'?1:-1)));this.restart();return;}
   if(action==='lesson'&&Number.isInteger(message.lesson)&&message.lesson>=0&&message.lesson<7){this.lesson=message.lesson;this.restart();return;}
  }
  if(this.paused||b.dead)return;
  if(message.type==='target'){this.target=this.opponent.id;this.actions.add('target');}
  if(message.type==='boost'){this.boost=message.active===true;if(this.mode==='tutorial'&&this.lesson===2&&this.elapsed>1&&this.boost)this.complete();}
  if(message.type==='move'&&Number.isInteger(message.dx)&&Number.isInteger(message.dy)&&Math.abs(message.dx)+Math.abs(message.dy)===1){b.move(message.dx,message.dy);this.actions.add('move');}
  if(message.type==='swap'){
   const {x,y}=b.cursor,left=b.grid[y][x],right=b.grid[y][x+1];
   if(b.swap()){this.emit({type:'swap',x,y,left,right});this.actions.add('swap');if(this.mode==='tutorial'&&this.lesson===0&&this.actions.has('move')&&x===2&&y===11)this.complete();}
   if(this.mode==='tutorial'&&[1,3,4].includes(this.lesson)&&b.phase==='idle'){
    const cursor={...b.cursor};this.player.board=seedBoard();this.player.board.cursor=cursor;
    if(this.lesson===1||this.lesson===4){this.player.board.grid=this.player.board.grid.map(r=>r.map(()=>0));this.player.board.grid[11]=[1,1,2,1,3,4];if(this.lesson===4)this.player.board.dropGarbage(6);}
   }
  }
  if(message.type==='ability'||message.type==='pulse'){
   if(typeof message.requestId!=='string'||message.requestId.length>80||this.requests.size>=4096||this.requests.has(message.requestId))return;
   this.requests.add(message.requestId);const ability=message.ability||'pulse',result=useAbility(this.player,this.room,ability);
   if(result){this.actions.add(ability);this.emit({type:ability==='pulse'?'pulse':'ability',ability,cancelled:result.cancelled});
    if(this.mode==='tutorial'&&this.lesson===5){if(['pulse','shift','surge','overdrive'].every(a=>this.actions.has(a)))this.complete();else{if(this.player.board.activeAbility)this.player.board.abilityRemaining=Math.min(this.player.board.abilityRemaining,1);this.player.board.flux=100;this.player.board.receive(6,30);}}
    if(this.mode==='tutorial'&&this.lesson===6&&ability==='pulse'&&this.actions.has('sent')&&this.actions.has('target')){this.opponent.board.dead=true;this.complete();this.emit({type:'trainingVictory'});}
   }else this.emit({type:'abilityRejected',ability});
  }
  this.snapshot();
 }
 tick(dt){
  if(this.paused)return;dt=Math.max(0,Math.min(.1,dt));this.elapsed+=dt;
  const b=this.player.board;
  if(this.mode==='practice'&&this.options.flux==='unlimited')b.flux=100;
  const speed=this.mode==='tutorial'?(this.lesson===2?.08:0):({off:0,slow:.025,normal:.055,fast:.11}[this.options.rise]||0);
  b.tick(dt,speed,!!this.boost);
  for(const event of b.events.splice(0)){
   this.emit({...event,type:event.type==='clear'?'effect':event.type});
   if(this.mode==='tutorial'){
    if(this.lesson===1&&event.type==='clear')this.complete();
    if(this.lesson===3&&event.type==='clear'&&event.count>=4&&!this.actions.has('combo')){this.actions.add('combo');this.player.board=seedBoard();this.status();}
    if(this.lesson===3&&this.actions.has('combo')&&event.type==='clear'&&event.chain>=2)this.complete();
    if(this.lesson===4&&event.type==='convert'){this.handle({type:'trainingControl',action:'attack'});this.complete();}
   }
   if(event.attack){this.actions.add('sent');if(this.mode==='tutorial'&&this.lesson===6)this.handle({type:'trainingControl',action:'attack'});this.opponent.board.receive(event.attack);this.emit({type:'sent',from:'YOU',to:this.opponent.name,amount:event.attack,sourceId:this.id,targetId:this.opponent.id,matchId:this.matchId,attackSequence:++this.serial,eventId:`${this.matchId}:${this.serial}`});}
  }
  if(b.dead&&(this.mode==='tutorial'||!this.options.gameOver)){
   // Safe recovery is isolated to this noncompetitive session; no balance changes.
   this.player.board=seedBoard();this.recoveries++;this.status();
  }
  this.snapshot();
 }
 snapshot(){
  const b=this.player.board,now=Date.now();
  this.emit({type:'state',training:true,matchId:this.matchId,serverNow:now,startAt:now-1,countdownAt:now-3001,phase:'active',countdown:0,mode:'duel',ruleset:'classic',remaining:2,elapsed:this.elapsed,players:[this.player,this.opponent].map((p,i)=>({id:p.id,name:p.name,bot:i===1,number:i+1,grid:p.board.grid.map(r=>[...r]),blocks:structuredClone(p.board.garbageBlocks),dead:p.board.dead,kos:0})),self:{cursor:{...b.cursor},rise:b.rise,matches:[...b.matches],phase:b.phase,falls:b.falls,fallSerial:b.fallSerial,score:b.score,chain:b.chain,bestChain:b.bestChain,danger:b.danger,incoming:structuredClone(b.incoming),kos:0,target:this.target,targetMode:'random',attackTarget:this.target,flux:b.flux,maxFluxHeld:b.maxFluxHeld,activeAbility:b.activeAbility,abilityRemaining:b.abilityRemaining,abilities:abilityStatus(this.player,this.room)}});
 }
}
TrainingSession.nextId=0;
