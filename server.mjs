import {TrainingSession} from './training-session.mjs';
import {prepareStart,readyStart,startStatus,startFields} from './match-start.mjs';
import {FLUX} from './flux-config.mjs';
import {TUTORIALS} from './tutorials.mjs';
import {abilityStatus,useAbility,cpuAbility} from './abilities.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,extname} from 'node:path';
import {networkInterfaces} from 'node:os';
import {Board} from './engine.mjs';
import {CpuController,DIFFICULTIES} from './bot.mjs';
import {MODES,TEAMS,RULESETS,modeRules,assignTeam,opponents,startError,matchOutcome} from './match-rules.mjs';

// Small dependency-free WebSocket transport. Gameplay remains server authoritative.
export function createGameServer({port=3000,host='0.0.0.0',desktop=false,balance=FLUX,boardFactory=()=>new Board(Math.random,balance),training=false}={}){
if(training&&host!=='127.0.0.1')throw Error('Offline training server must bind loopback.');
const rooms=new Map(),clients=new Set(),sessions=new Map();
// Epoch-shaped monotonic clock: wall-clock adjustments cannot alter a match countdown.
const epoch=Date.now()-performance.now(), now=()=>epoch+performance.now();
const root=new URL('./',import.meta.url);
const publicFiles={'/':'index.html','/app.mjs':'app.mjs','/sound.mjs':'sound.mjs','/music.mjs':'music.mjs','/visuals.mjs':'visuals.mjs','/match-rules.mjs':'match-rules.mjs','/records.mjs':'records.mjs','/flux-config.mjs':'flux-config.mjs','/presentation-effects.mjs':'presentation-effects.mjs','/targeting-vfx.mjs':'targeting-vfx.mjs','/targeting-web.mjs':'targeting-web.mjs','/style.css':'style.css','/fonts/VT323-Regular.ttf':'fonts/VT323-Regular.ttf','/fonts/kode-mono/KodeMono-Variable.ttf':'fonts/kode-mono/KodeMono-Variable.ttf','/favicon.svg':'favicon.svg','/logo.svg':'logo.svg','/demo/gameplay.gif':'demo/gameplay.gif','/demo/gameplay.png':'demo/gameplay.png'};
// Presentation assets only; room simulation and rules are unchanged.
publicFiles['/tutorials.mjs']='tutorials.mjs';
publicFiles['/neo-vector.mjs']='neo-vector.mjs';
for(const file of ['audio-score.mjs','audio-dsp.mjs'])publicFiles['/'+file]=file;
publicFiles['/vector-geometry.mjs']='vector-geometry.mjs';
publicFiles['/gamepad-input.mjs']='gamepad-input.mjs';
publicFiles['/gamepad-web.mjs']='gamepad-web.mjs';
publicFiles['/battle-intro.mjs']='battle-intro.mjs';
publicFiles['/service-worker.js']='service-worker.js';
for(const file of ['training-session.mjs','engine.mjs','abilities.mjs'])publicFiles['/'+file]=file;
publicFiles['/help-tutorials.mjs']='help-tutorials.mjs';
for(const {id}of TUTORIALS)for(const extension of ['gif','png'])publicFiles[`/demo/tutorials/${id}.${extension}`]=`demo/tutorials/${id}.${extension}`;
const mime={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.gif':'image/gif','.png':'image/png','.html':'text/html','.ttf':'font/ttf'};
const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/api/info'){
    const port=server.address()?.port;
    const addresses=Object.values(networkInterfaces()).flat().filter(address=>address&&address.family==='IPv4'&&!address.internal).map(address=>`http://${address.address}:${port}`);
    res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
    return res.end(JSON.stringify({desktop,addresses}));
  }
  const file=publicFiles[pathname];
  if(!file){res.writeHead(404);return res.end('Not found');}
  try{const data=await readFile(new URL(file,root));res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ws: wss:; object-src 'none'; frame-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(data);}catch{res.writeHead(500);res.end('Unable to load game');}
});
function frame(socket,data,opcode=1){
  if(!socket||socket.destroyed||socket.writableLength>1024*1024)return;
  const payload=Buffer.from(data),header=Buffer.alloc(payload.length<126?2:payload.length<=65535?4:10);header[0]=128|opcode;
  if(payload.length<126)header[1]=payload.length;else if(payload.length<=65535){header[1]=126;header.writeUInt16BE(payload.length,2);}else{header[1]=127;header.writeBigUInt64BE(BigInt(payload.length),2);}socket.write(Buffer.concat([header,payload]));
}
function send(c,message){if(!c.bot)frame(c.socket,JSON.stringify(message));}
function notify(room){for(const c of room.players.values())send(c,{type:'lobby',room:room.code,host:room.host,mode:room.mode,ruleset:room.ruleset,capacity:modeRules(room).capacity,players:[...room.players.values()].map(p=>({id:p.id,name:p.name,bot:!!p.bot,team:p.team})),botCount:[...room.players.values()].filter(p=>p.bot).length,difficulty:room.difficulty||'normal',state:room.state});}
function configureBots(room,count,difficulty){
  if(!Number.isInteger(count)||count<0||count>98||!Object.hasOwn(DIFFICULTIES,difficulty))return 'Choose 0–98 CPUs and a valid difficulty.';
  const humans=[...room.players.values()].filter(p=>!p.bot);
  if(humans.length+count>modeRules(room).capacity)return `Humans and CPUs together cannot exceed ${modeRules(room).capacity} players in this mode.`;
  for(const p of [...room.players.values()])if(p.bot)room.players.delete(p.id);
  room.difficulty=difficulty;
  for(let n=1;n<=count;n++){
    const id='cpu-'+randomBytes(6).toString('hex');
    const bot={id,name:`CPU ${String(n).padStart(2,'0')}`,bot:true,room,controller:new CpuController(difficulty)};assignTeam(room,bot);room.players.set(id,bot);
  }
  return null;
}
function startMatch(c,room){
  const error=startError(room);if(error)return send(c,{type:'error',message:error});
  room.state='playing';room.elapsed=0;room.countdown=3;
  room.start=prepareStart([...room.players.values()],now(),randomBytes(8).toString('hex'));
  room.matchId=room.start.id;room.attackSerial=0;let playerNumber=0;
  const seed=boardFactory().grid;
  const humans=[...room.players.values()].filter(p=>!p.bot).length;
  for(const p of room.players.values()){
    p.number=++playerNumber;p.lastAttackTarget=null;
    p.board=boardFactory();p.board.grid=seed.map(row=>[...row]);p.place=null;p.kos=0;p.boost=false;p.mode='random';p.target=null;p.lastAttacker=null;p.abilityRequests=new Set();
    if(p.bot)p.controller=new CpuController(room.difficulty);
    send(p,{type:'start',...startFields(room.start,now()),total:room.players.size,humans,bots:room.players.size-humans,mode:room.mode,ruleset:room.ruleset,team:p.team});
  }
}
function cancelStart(room,reason){
  room.state='waiting';room.countdown=3;room.start=null;
  for(const p of room.players.values())send(p,{type:'startCancelled',message:reason});
  notify(room);
}
function leave(c){
  const room=c.room;if(!room)return;
  if(room.state==='playing'&&c.board&&!c.board.dead){c.board.dead=true;c.place=[...room.players.values()].filter(p=>!p.board.dead).length+1;}
  room.players.delete(c.id);c.room=null;
  const humans=[...room.players.values()].filter(p=>!p.bot);
  if(!humans.length){rooms.delete(room.code);return;}
  if(room.host===c.id){room.host=humans[0].id;for(const p of room.players.values())send(p,{type:'host',host:room.host});}
  if(room.state==='playing'&&room.start&&startStatus(room.start,now()).phase!=='active'&&(startError(room)||room.start.required.has(c.id)))cancelStart(room,'A player left before GO. Start again when everyone is ready.');
  else if(room.state==='waiting')notify(room);
}
function onMessage(c,msg){
  if(!msg||typeof msg!=='object')return;
  if(training&&msg.type==='trainingStart'){
    c.training=new TrainingSession({...msg,id:c.id,emit:message=>send(c,message)});return;
  }
  if(c.training){
    if(msg.type==='leave'){c.training=null;send(c,{type:'left'});return;}
    c.training.handle(msg);return;
  }
  if(msg.type==='clock'&&Number.isFinite(msg.sentAt)){send(c,{type:'clock',sentAt:msg.sentAt,serverNow:now()});return;}
  if(msg.type==='session'){c.startProtocol=msg.startProtocol===1?1:0;c.resumable=msg.resumable===true;if(c.resumable)sessions.set(c.resumeToken,c);else sessions.delete(c.resumeToken);return;}
  if(msg.type==='resume'){
    const prior=sessions.get(msg.token);
    if(c.room||!prior||prior===c||!prior.disconnectedAt||Date.now()-prior.disconnectedAt>balance.reconnectSeconds*1000||!prior.room)return send(c,{type:'resumeRejected'});
    const room=prior.room;
    sessions.delete(c.resumeToken);
    // Transfer only session/game fields. Keep the fresh transport's buffers and socket.
    for(const key of ['id','name','room','team','board','place','kos','boost','mode','target','lastAttacker','abilityRequests','resumeToken','startProtocol','number','lastAttackTarget'])c[key]=prior[key];
    c.boost=false;c.resumable=true;c.disconnectedAt=null;
    room.players.set(c.id,c);sessions.set(c.resumeToken,c);prior.room=null;prior.resumable=false;
    send(c,{type:'resumed',id:c.id,resumeToken:c.resumeToken,room:room.code,host:room.host});
    if(room.state==='waiting')notify(room);
    else{
      const humans=[...room.players.values()].filter(p=>!p.bot).length;
      send(c,{type:'start',resumed:true,...startFields(room.start,now()),total:room.players.size,humans,bots:room.players.size-humans,mode:room.mode,ruleset:room.ruleset,team:c.team});
      send(c,stateMessage(c,room));
      if(room.state==='finished')send(c,finishMessage(c,room,room.outcome||matchOutcome(room)));
      else if(c.board.dead)send(c,{type:'eliminated',place:c.place});
    }
    return;
  }
  if(msg.type==='create'||msg.type==='join'){
    let room;
    if(msg.type==='create'){
      if(rooms.size>=100)return send(c,{type:'error',message:'Server is full. Try again later.'});
      let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));
      if(msg.mode!==undefined&&!Object.hasOwn(MODES,msg.mode))return send(c,{type:'error',message:'Choose a valid match mode.'});
      if(msg.ruleset!==undefined&&!Object.hasOwn(RULESETS,msg.ruleset))return send(c,{type:'error',message:'Choose Classic or Rush rules.'});
      room={code,host:c.id,players:new Map(),state:'waiting',elapsed:0,mode:msg.mode||'battle',ruleset:msg.ruleset||'classic'};rooms.set(code,room);
    }else room=rooms.get(String(msg.code).trim().toUpperCase());
    if(!room)return send(c,{type:'error',message:'Room not found. Check the six-character code.'});
    if(c.room===room){notify(room);return;}
    if(room.state!=='waiting')return send(c,{type:'error',message:'This match already started.'});
    if(room.players.size>=modeRules(room).capacity)return send(c,{type:'error',message:`This room has ${modeRules(room).capacity} players. It is full.`});
    leave(c);c.name=String(msg.name||'Player').trim().slice(0,18)||'Player';c.room=room;assignTeam(room,c);room.players.set(c.id,c);
    if(msg.type==='create'&&msg.bots!==undefined){const error=configureBots(room,msg.bots,msg.difficulty||'normal');if(error)send(c,{type:'error',message:error});}
    notify(room);if(msg.type==='create'&&msg.quick===true&&room.players.size>=2)startMatch(c,room);return;
  }
  const room=c.room;if(!room)return;
  if(msg.type==='leave'){leave(c);send(c,{type:'left'});return;}
  if(msg.type==='settings'&&room.host===c.id&&room.state==='waiting'){
    if(!Object.hasOwn(MODES,msg.mode)||!Object.hasOwn(RULESETS,msg.ruleset))return send(c,{type:'error',message:'Choose valid match settings.'});
    if(room.players.size>MODES[msg.mode].capacity)return send(c,{type:'error',message:'Remove CPUs or players before choosing a smaller mode.'});
    const changed=room.mode!==msg.mode;room.mode=msg.mode;room.ruleset=msg.ruleset;
    if(changed){for(const p of room.players.values())p.team=null;for(const p of room.players.values())assignTeam(room,p);}
    notify(room);return;
  }
  if(msg.type==='team'&&room.mode==='teams'&&room.state==='waiting'){
    const player=room.players.get(msg.id||c.id);
    if(!player||(player!==c&&room.host!==c.id)||!Object.hasOwn(TEAMS,msg.team))return;
    const members=[...room.players.values()].filter(p=>p!==player&&p.team===msg.team);
    if(members.length>=2){const swap=room.host===c.id?members[0]:members.find(p=>p.bot);if(!swap)return send(c,{type:'error',message:'That team is full. Ask the host to switch players between teams.'});swap.team=player.team;}
    player.team=msg.team;notify(room);return;
  }
  if(msg.type==='bots'&&room.host===c.id&&room.state==='waiting'){
    const error=configureBots(room,msg.count,msg.difficulty);
    if(error)send(c,{type:'error',message:error});else notify(room);return;
  }
  if(msg.type==='start'&&room.host===c.id&&room.state==='waiting'){
    startMatch(c,room);return;
  }
  if(msg.type==='rematch'&&room.host===c.id&&room.state==='finished'){room.state='waiting';notify(room);return;}
  if(msg.type==='ready'&&room.state==='playing'&&msg.matchId===room.start.id){
    if(readyStart(room.start,c.id,now()))for(const p of room.players.values())send(p,{type:'startScheduled',...startFields(room.start,now())});
    return;
  }
  if(room.state!=='playing'||startStatus(room.start,now()).phase!=='active'||c.board.dead)return;
  if(msg.type==='move'){const dx=Number(msg.dx),dy=Number(msg.dy);if(Number.isInteger(dx)&&Number.isInteger(dy)&&Math.abs(dx)+Math.abs(dy)===1){const previous={...c.board.cursor};c.board.move(dx,dy);if(previous.x!==c.board.cursor.x||previous.y!==c.board.cursor.y)send(c,{type:'move'});}}
  if(msg.type==='swap'){
    const {x,y}=c.board.cursor,left=c.board.grid[y][x],right=c.board.grid[y][x+1];
    if(c.board.swap())send(c,{type:'swap',x,y,left,right});
  }
  if(msg.type==='boost')c.boost=msg.active===true;
  if(msg.type==='mode'&&['random','danger','attackers','badges'].includes(msg.mode))c.mode=msg.mode;
  if(msg.type==='target'&&(msg.id===null||opponents(c,room).some(p=>p.id===msg.id)))c.target=msg.id;
  if(msg.type==='pulse'||msg.type==='ability'){
    const ability=msg.type==='pulse'?'pulse':msg.ability;
    // Request IDs survive retries/resumption; repeated requests never spend twice.
    if(typeof msg.requestId!=='string'||msg.requestId.length>80||!msg.requestId.length)return;
    if(c.abilityRequests.has(msg.requestId))return;
    if(c.abilityRequests.size>=4096)return;
    c.abilityRequests.add(msg.requestId);
    if(!activateAbility(c,room,ability))send(c,{type:'abilityRejected',ability,requestId:msg.requestId});
  }
}
server.on('upgrade',(req,socket,head)=>{
  const key=req.headers['sec-websocket-key'];
  if(req.url!=='/socket'||typeof key!=='string'||req.headers['sec-websocket-version']!=='13'||clients.size>=1000){socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');return;}
  const origin=req.headers.origin;
  if(origin){try{if(new URL(origin).host!==req.headers.host){socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');return;}}catch{socket.destroy();return;}}
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')+'\r\n\r\n');
  const c={id:randomBytes(6).toString('hex'),resumeToken:randomBytes(24).toString('hex'),socket,room:null,buffer:Buffer.alloc(0),fragments:[],fragmentSize:0,rate:0};clients.add(c);send(c,{type:'hello',id:c.id,resumeToken:c.resumeToken,fluxConfig:balance});
  const fail=()=>socket.destroy();
  const consume=chunk=>{
    c.buffer=Buffer.concat([c.buffer,chunk]);if(c.buffer.length>16384)return fail();
    while(c.buffer.length>=2){
      const b=c.buffer,fin=!!(b[0]&128),op=b[0]&15,masked=!!(b[1]&128);let len=b[1]&127,offset=2;
      if((b[0]&112)||!masked||len===127)return fail();
      if(len===126){if(b.length<4)return;len=b.readUInt16BE(2);offset=4;}
      if(len>8192||(op>=8&&(!fin||len>125)))return fail();
      if(b.length<offset+4+len)return;
      const mask=b.subarray(offset,offset+4),payload=Buffer.from(b.subarray(offset+4,offset+4+len));c.buffer=b.subarray(offset+4+len);
      for(let i=0;i<len;i++)payload[i]^=mask[i%4];
      if(op===8){frame(socket,payload,8);socket.end();return;}
      if(op===9){frame(socket,payload,10);continue;}if(op===10)continue;
      if(op!==0&&op!==1)return fail();
      if(op===1&&c.fragments.length)return fail();if(op===0&&!c.fragments.length)return fail();
      c.fragmentSize+=len;if(c.fragmentSize>8192)return fail();c.fragments.push(payload);
      if(!fin)continue;
      const text=Buffer.concat(c.fragments).toString('utf8');c.fragments=[];c.fragmentSize=0;
      if(++c.rate>100)return fail();
      try{onMessage(c,JSON.parse(text));}catch{send(c,{type:'error',message:'Invalid game message.'});}
    }
  };
  socket.on('data',consume);socket.on('error',()=>{});socket.on('close',()=>{clients.delete(c);if(c.resumable&&c.room){c.socket=null;c.boost=false;c.disconnectedAt=Date.now();}else{leave(c);sessions.delete(c.resumeToken);}});if(head.length)consume(head);
});
function activateAbility(player,room,ability){
  const result=useAbility(player,room,ability);if(!result)return false;
  const message={type:ability==='pulse'?'pulse':'ability',ability,from:player.name,to:result.target.name,cancelled:result.cancelled,assist:result.target!==player};
  send(player,message);if(result.target!==player)send(result.target,message);
  return true;
}
function targetFor(c,room){
  const alive=opponents(c,room);if(!alive.length)return null;
  const manual=alive.find(p=>p.id===c.target);if(manual)return manual;
  if(c.mode==='danger')return alive.sort((a,b)=>b.board.grid.flat().filter(Boolean).length-a.board.grid.flat().filter(Boolean).length)[0];
  if(c.mode==='badges')return alive.sort((a,b)=>b.kos-a.kos)[0];
  if(c.mode==='attackers'){const attacker=alive.find(p=>p.id===c.lastAttacker);if(attacker)return attacker;}
  return alive[Math.floor(Math.random()*alive.length)];
}
function publicPlayers(room){return [...room.players.values()].map(p=>({id:p.id,number:p.number,name:p.name,bot:!!p.bot,team:p.team,grid:p.board.grid,blocks:p.board.garbageBlocks,dead:p.board.dead,kos:p.kos,flux:p.board.flux,activeAbility:p.board.activeAbility}));}
function stateMessage(p,room,players=publicPlayers(room)){
  const alive=[...room.players.values()].filter(p=>!p.board.dead);
  const abilities=abilityStatus(p,room);
  return {type:'state',...startFields(room.start,now()),remaining:alive.length,mode:room.mode,ruleset:room.ruleset,team:p.team,teamRemaining:room.mode==='teams'?Object.fromEntries(Object.keys(TEAMS).map(team=>[team,alive.filter(p=>p.team===team).length])):null,elapsed:room.elapsed,countdown:Math.ceil(room.countdown),players,self:{attackTarget:opponents(p,room).find(q=>q.id===p.target)?.id||opponents(p,room).find(q=>q.id===p.lastAttackTarget)?.id||null,cursor:p.board.cursor,rise:p.board.rise,matches:p.board.matches,phase:p.board.phase,falls:p.board.falls,fallSerial:p.board.fallSerial,score:p.board.score,chain:p.board.chain,danger:p.board.danger,incoming:p.board.incoming,kos:p.kos,target:p.target,targetMode:p.mode,charge:p.board.charge,bestChain:p.board.bestChain,flux:p.board.flux,maxFluxHeld:p.board.maxFluxHeld,activeAbility:p.board.activeAbility,abilityRemaining:p.board.abilityRemaining,abilities,pulseAvailable:abilities.pulse}};
}
function finishMessage(p,room,outcome){
  return {type:'finished',winner:outcome.winner,winnerId:outcome.winnerIds[0],winnerIds:outcome.winnerIds,winnerTeam:outcome.winnerTeam,won:outcome.winnerIds.includes(p.id),place:outcome.winnerIds.includes(p.id)?1:p.place||outcome.alive.length+1,host:room.host};
}
let tick=0;
const interval=setInterval(()=>{
  tick++;
  for(const c of clients)if(c.training)c.training.tick(.05);
  for(const [token,c]of sessions)if(c.disconnectedAt&&Date.now()-c.disconnectedAt>balance.reconnectSeconds*1000){leave(c);sessions.delete(token);}
  for(const room of rooms.values()){
    if(room.state!=='playing')continue;
    const time=now();
    if(room.start.startAt===null&&time>=room.start.expiresAt){cancelStart(room,'Board loading timed out. Start again when all players are connected.');continue;}
    room.countdown=startStatus(room.start,time).countdown;
    if(room.countdown===0)room.elapsed+=.05;
    if(room.countdown===0)for(const p of room.players.values()){
      const wasDead=p.board.dead;if(p.bot){p.controller.tick(p,.05);const ability=cpuAbility(p,room);if(ability)activateAbility(p,room,ability);}
      p.board.tick(.05,(.055+room.elapsed*.0008)*RULESETS[room.ruleset].speed,p.boost);
      if(!wasDead&&p.board.dead){p.place=[...room.players.values()].filter(q=>!q.board.dead).length+1;const killer=room.players.get(p.lastAttacker);if(killer&&killer!==p)killer.kos++;send(p,{type:'eliminated',place:p.place});}
      for(const event of p.board.events.splice(0)){
        send(p,{...event,type:event.type==='clear'?'effect':event.type});
        if(event.attack){const target=targetFor(p,room);if(target){const amount=Math.min(Math.round(24*(p.board.modifiers.attack||1)),Math.max(3,event.attack+Math.round(Math.floor(p.kos/2)*(p.board.modifiers.attack||1))));target.board.receive(amount);target.lastAttacker=p.id;p.lastAttackTarget=target.id;
          const attackSequence=++room.attackSerial,confirmed={matchId:room.matchId,eventId:`${room.matchId}:${attackSequence}`,attackSequence,sourceId:p.id,targetId:target.id,from:p.name,to:target.name,amount};
          send(target,{type:'attack',...confirmed});send(p,{type:'sent',...confirmed});}}
      }
    }
    const outcome=matchOutcome(room),alive=outcome.alive;
    if(room.countdown===0&&outcome.finished){room.state='finished';room.outcome=outcome;for(const p of room.players.values())send(p,finishMessage(p,room,outcome));}
    if(tick%2===0||room.state==='finished'){
      const players=publicPlayers(room);
      for(const p of room.players.values())if(!p.bot)send(p,stateMessage(p,room,players));
    }
  }
  if(tick%20===0)for(const c of clients){c.rate=0;frame(c.socket,'',9);}
},50);
return {
  server,
  listen:()=>new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.removeListener('error',reject);resolve(`http://127.0.0.1:${server.address().port}`);});}),
  close:()=>new Promise(resolve=>{clearInterval(interval);for(const c of clients)c.socket.destroy();server.close(()=>resolve());server.closeAllConnections();})
};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const game=createGameServer({port:process.env.PORT===undefined?3000:Number(process.env.PORT),host:process.env.HOST||'0.0.0.0'});
  game.listen().then(url=>console.log(`VEXELON 99 listening on ${url}`)).catch(error=>{console.error(error);game.close();process.exitCode=1;});
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>game.close());
}
