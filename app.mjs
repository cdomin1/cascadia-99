import {TrainingSession,LESSONS} from './training-session.mjs';
let training=null,trainingActive=false,trainingTick=0,trainingStatus=null;
import {BattleIntroTimeline} from './battle-intro.mjs';
const battleIntro=new BattleIntroTimeline();
import {browserGamepad} from './gamepad-web.mjs';
import {BattleTargeting} from './targeting-web.mjs';
import {createTutorialGallery} from './help-tutorials.mjs';
import {PresentationEffects} from './presentation-effects.mjs';
import {FLUX} from './flux-config.mjs';
import {effects} from './sound.mjs';
import {music,TRACKS} from './music.mjs';
import {drawBoard,BoardAnimations} from './visuals.mjs';
import {MODES,TEAMS,RULESETS} from './match-rules.mjs';
import {PersonalRecords} from './records.mjs';
const battleTargeting=new BattleTargeting();
let lastVisualTarget=null;
const $=id=>document.getElementById(id);
let storage=null;try{storage=localStorage;}catch{}
const records=new PersonalRecords(storage);
function updateRecords(){$('record-score').textContent=records.data.score.toLocaleString();$('record-chain').textContent=records.data.chain+'×';$('record-wins').textContent=records.data.wins;}
updateRecords();
let readyMatch=null;
let fluxConfig=FLUX,abilitySequence=0,resumeToken=null,reconnectTimer=null;
const abilitySession=globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
function requestAbility(ability){send({type:'ability',ability,requestId:`${abilitySession}:${++abilitySequence}`});}
let roomMode='battle',roomRules='classic',myTeam=null;
let ws,id,liveId,room,host,total=0,state=null,playing=false,finished=false,mode='random',manualTarget=null,toastTimer,lastCountdown=null,lastDangerSound=0,eliminationSoundPlayed=false;
try{effects.enabled=localStorage.getItem('panel99-sound')!=='off';}catch{}
try{music.enabled=localStorage.getItem('panel99-music')!=='off';}catch{}
function updateSoundButton(){$('sound').textContent=effects.enabled?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(effects.enabled));$('header-sound').setAttribute('aria-pressed',String(effects.enabled));$('header-sound').setAttribute('aria-label',effects.enabled?'Mute sound effects':'Enable sound effects');$('header-sound').title=effects.enabled?'Sound effects on':'Sound effects off';}
function updateMusicButton(){$('music').textContent=music.enabled?'Music on':'Music off';$('music').setAttribute('aria-pressed',String(music.enabled));}
updateSoundButton();
updateMusicButton();
for(const [id,track]of Object.entries(TRACKS)){const option=document.createElement('option');option.value=id;option.textContent=track.name;$('track').append(option);}
try{const saved=localStorage.getItem('cascadia99-track');if(Object.hasOwn(TRACKS,saved))music.setTrack(saved);}catch{}
$('track').value=music.trackId;
$('track').addEventListener('change',async()=>{const id=$('track').value;if(await music.setTrack(id)){try{localStorage.setItem('cascadia99-track',id);}catch{}}});
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{effects.unlock().then(()=>{if(!music.timer&&music.enabled)music.start();});},{capture:true});
const canvas=$('board'),ctx=canvas.getContext('2d');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const systemMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastSystemMotion=systemMotion(),motionPollAt=0;
let tutorialGallery;
const presentation=new PresentationEffects({reducedMotion:systemMotion()});
const animations=new BoardAnimations({reducedMotion:systemMotion(),onImpact:block=>{presentation.trigger('garbage',performance.now(),{size:block.width*block.height});effects.play('garbage');}});
reducedMotion.addEventListener('change',()=>applyEffectsSettings());
function show(section){if(section!=='arena')battleTargeting.stop();if(section!=='arena'){music.setContext('title');document.body.classList.remove('small-match','team-match');}document.body.classList.toggle('in-match',section==='arena');for(const s of ['entry','lobby','arena'])$(s).hidden=s!==section;}
function send(data){if(trainingActive&&training){if(data.type==='leave'){stopTraining();return;}training.handle(data);return;}if(ws?.readyState===1)ws.send(JSON.stringify(data));else error('Connection lost. Reload to reconnect.');}
function error(message){$('entry-error').textContent=message;$('lobby-error').textContent=message;if(playing)log(message);}
function connect(){
  ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/socket`);
  ws.onopen=()=>{$('connection').textContent='';$('create').disabled=false;$('play-cpu').disabled=false;for(const b of document.querySelectorAll('#join-form button'))b.disabled=false;};
  ws.onclose=()=>{
    if(trainingActive)return;
    music.setContext('title');
    $('connection').textContent='Disconnected';$('create').disabled=true;$('play-cpu').disabled=true;
    error(room?'Connection lost. Reconnecting…':'Disconnected. Reload to connect.');playing=false;
    if(!$('arena').hidden){overlay('Reconnecting','The match continues. Recovering your session…');$('leave-match').hidden=false;}
    if(room){clearTimeout(reconnectTimer);reconnectTimer=setTimeout(connect,750);}
    for(const b of document.querySelectorAll('#start,#join-form button'))b.disabled=true;
  };
  ws.onerror=()=>error('Could not reach the game server.');
  ws.onmessage=({data})=>{if(!trainingActive)receiveMessage(JSON.parse(data));};
}
function receiveMessage(msg){
  if(msg.type==='trainingVictory')effects.play('win');
  if(msg.type==='tutorialSuccess'){presentation.trigger('pulse',performance.now());effects.play('clear');}battleIntro.observe(msg);battleIntro.schedule(msg);
    if(['pulse','ability','attack','effect'].includes(msg.type))presentation.trigger(msg.ability||msg.type,performance.now(),msg);
    animations.event(msg,state?.players.find(p=>p.id===id)?.grid,state?.self.rise||0);
    if(msg.type==='hello'){const previous=resumeToken;id=msg.id;liveId=id;fluxConfig=msg.fluxConfig||FLUX;resumeToken=msg.resumeToken;send({type:'session',resumable:true,startProtocol:1});if(previous&&room)send({type:'resume',token:previous});}
    if(msg.type==='resumed'){id=msg.id;resumeToken=msg.resumeToken;room=msg.room;host=msg.host;}
    if(msg.type==='resumeRejected'){room=null;state=null;playing=false;show('entry');error('Session expired. Join a new room.');}
    if(msg.type==='host'){host=msg.host;if(finished)$('rematch').hidden=host!==id;}
    if(msg.type==='error'||msg.type==='startCancelled')error(msg.message);
    if(msg.type==='left'){show('entry');playing=false;room=null;state=null;}
    if(msg.type==='lobby'){
      room=msg.room;host=msg.host;roomMode=msg.mode||'battle';roomRules=msg.ruleset||'classic';myTeam=msg.players.find(p=>p.id===id)?.team;playing=false;finished=false;show('lobby');$('room-code').textContent=room;
      $('players-list').replaceChildren();
      for(const p of msg.players){const pill=document.createElement('div');pill.className='player-pill';const avatar=document.createElement('span');avatar.className='avatar';avatar.textContent=p.bot?'▦':p.name[0].toUpperCase();const name=document.createElement('span');name.textContent=p.name+(p.id===id?' (you)':'');pill.append(avatar,name);if(roomMode==='teams'){
        pill.dataset.team=p.team;const team=document.createElement('select');team.className='team-picker';team.setAttribute('aria-label',`Team for ${p.name}`);
        for(const [value,label]of Object.entries(TEAMS)){const option=document.createElement('option');option.value=value;option.textContent=label;team.append(option);}team.value=p.team;
        team.disabled=host!==id&&p.id!==id;team.onchange=()=>send({type:'team',id:p.id,team:team.value});pill.append(team);
      }if(p.id===host||p.bot){const badge=document.createElement('small');badge.textContent=p.bot?'CPU':'HOST';pill.append(badge);}$('players-list').append(pill);}
      $('lobby-count').textContent=`${msg.players.length} / ${msg.capacity}`;$('start').hidden=host!==id;$('start').disabled=msg.players.length<MODES[roomMode].required;
      $('lobby-note').textContent=host===id?(msg.players.length<MODES[roomMode].required?`Fill ${MODES[roomMode].required-msg.players.length} more seat(s) with CPUs or friends.`:`${MODES[roomMode].label} · ${RULESETS[roomRules].label}. Ready to start.`):'Waiting for the host to start the match.';
      $('bot-settings').hidden=host!==id;$('bot-count').value=msg.botCount;$('bot-difficulty').value=msg.difficulty;$('bot-count').max=msg.capacity-msg.players.filter(p=>!p.bot).length;
      $('room-settings').hidden=host!==id;$('room-mode').value=roomMode;$('room-rules').value=roomRules;
      updateShareAddress();
      $('lobby-error').textContent='';
    }
    if(msg.type==='start'){
      $('arena').setAttribute('aria-busy','true');
      battleIntro.begin(msg);
      battleTargeting.begin(msg,id);lastVisualTarget=null;
      animations.reset();presentation.reset();music.overdrive=false;state=null;roomMode=msg.mode||'battle';roomRules=msg.ruleset||'classic';myTeam=msg.team;
      document.body.classList.toggle('small-match',msg.total<=4);document.body.classList.toggle('team-match',roomMode==='teams');
      $('match-label').textContent=`${MODES[roomMode].label.toUpperCase()} / ${RULESETS[roomRules].label.toUpperCase()}`;
      $('team-status').hidden=roomMode!=='teams';$('pulse').disabled=true;$('pulse').textContent='Pulse · 0%';
      playing=true;finished=false;total=msg.total;manualTarget=null;mode='random';lastCountdown=null;lastDangerSound=0;eliminationSoundPlayed=false;show('arena');document.activeElement?.blur();$('rivals').replaceChildren();$('feed').replaceChildren();$('rematch').hidden=true;$('leave-match').hidden=true;
      for(const b of document.querySelectorAll('.mode'))b.classList.toggle('active',b.dataset.mode===mode);
      overlay(msg.resumed?'Reconnected':'READY?',msg.resumed?'Synchronizing your board…':'Get ready. The stack is about to rise.');log(`${msg.humans} human${msg.humans===1?'':'s'}, ${msg.bots} CPUs. One survivor.`);
      music.target=0;music.setContext('intro');music.start();
    }
    if(msg.type==='state'){
      $('arena').setAttribute('aria-busy',String(msg.countdown>0||msg.phase==='preparing'));
      state=msg;battleTargeting.state(msg);
      if(msg.phase==='preparing'&&readyMatch!==msg.matchId){readyMatch=msg.matchId;requestAnimationFrame(()=>{if(state?.matchId===msg.matchId)send({type:'ready',matchId:msg.matchId});});}
      $('remaining').replaceChildren(document.createTextNode(msg.remaining));const denom=document.createElement('span');denom.textContent=` / ${total}`;$('remaining').append(denom);
      animations.state({...msg.self,blocks:msg.players.find(p=>p.id===id)?.blocks||[]});
      mode=msg.self.targetMode||mode;manualTarget=msg.self.target;
      for(const el of document.querySelectorAll('.mode'))el.classList.toggle('active',el.dataset.mode===mode);

      if(msg.self.danger>0&&performance.now()-lastDangerSound>900){effects.play('danger');lastDangerSound=performance.now();}
      if(!trainingActive){records.observe(msg.self.score,msg.self.bestChain||msg.self.chain);updateRecords();}
      const flux=msg.self.flux||0;presentation.meter(flux,fluxConfig.max,performance.now());
      $('flux-meter').dataset.charge=flux>=fluxConfig.max?'full':flux>=fluxConfig.max*.75?'high':'low';
      $('flux-label').textContent=flux>=fluxConfig.max?'FLUX FULL!':`FLUX ${Math.floor(flux)} / ${fluxConfig.max}`;
      $('flux-meter').setAttribute('aria-valuemax',fluxConfig.max);$('flux-meter').setAttribute('aria-valuenow',Math.floor(flux));
      $('flux-fill').style.width=`${flux/fluxConfig.max*100}%`;
      for(const [ability,key]of Object.entries((document.body.dataset.input==='gamepad'?{pulse:'WEST',shift:'NORTH',surge:'LB',overdrive:'LT'}:{pulse:'X',shift:'C',surge:'V',overdrive:'B'}))){
        $(ability).textContent=`${ability[0].toUpperCase()+ability.slice(1)} · ${fluxConfig[ability].cost} · ${key}`;
        $(ability).disabled=!msg.self.abilities?.[ability]||msg.countdown>0||finished;
      }
      $('ability-timer').textContent=msg.self.activeAbility?`${msg.self.activeAbility.toUpperCase()} ${msg.self.abilityRemaining.toFixed(1)}s`:flux>=fluxConfig.max?`OVERDRIVE ${Math.max(0,fluxConfig.overdrive.hold-msg.self.maxFluxHeld).toFixed(1)}s`:'';
      music.overdrive=msg.self.activeAbility==='overdrive';
      if(msg.teamRemaining)$('team-status').textContent=`${TEAMS[myTeam]} team · Cyan ${msg.teamRemaining.a} / Coral ${msg.teamRemaining.b}`;
      $('kos').textContent=msg.self.kos;$('score').textContent=msg.self.score.toLocaleString();$('time').textContent=`${Math.floor(msg.elapsed/60)}:${String(Math.floor(msg.elapsed%60)).padStart(2,'0')}`;
      $('chain-label').textContent=msg.self.chain>1?`${msg.self.chain}× CHAIN`:'';
      const count=msg.self.incoming.reduce((sum,a)=>sum+a.amount,0);document.querySelector('.incoming').hidden=count===0;updateTargetSummary();$('garbage-count').textContent=count;$('garbage-meter').replaceChildren();for(let i=0;i<12;i++){const block=document.createElement('i');block.className=i<Math.min(count,12)?'filled':'';$('garbage-meter').append(block);}
      const self=msg.players.find(p=>p.id===id);if(self)$('player-name').textContent=self.name.toUpperCase();
      if(self&&!self.dead)music.update(self.grid);
      if(!finished&&self&&!self.dead){$('board-overlay').hidden=true;}
      $('board-status').textContent=msg.self.danger>=1?'CRITICAL — clear the top!':msg.self.danger>0?'DANGER — clear the top!':count?`GLITCH INCOMING! ${count} · ${Math.max(0,Math.ceil(msg.self.incoming[0].delay))}s`:'';
      renderRivals();
    }
    if(msg.type==='ability'){effects.play(msg.ability);log(`${msg.ability.toUpperCase()} activated!`);}
    if(msg.type==='abilityRejected')log('Ability unavailable: check Flux, board state, and active effects.');
    if(msg.type==='move'||msg.type==='swap')effects.play(msg.type);
    if(msg.type==='pulse'){effects.play('pulse');log(msg.assist?`${msg.from} rescued ${msg.to}: ${msg.cancelled} blocks cancelled!`:`Pulse cancelled ${msg.cancelled} incoming blocks.`);}
    if(msg.type==='break'){effects.play('clear');log('GLITCH BREAK! Tiles are breaking free.');}
    if(msg.type==='convert')effects.play('move');
    if(msg.type==='effect'){effects.play('clear',msg);if(msg.chain>1||msg.count>3)log(msg.chain>1?`${msg.chain}× chain! Keep it going.`:`${msg.count}-panel combo!`);}
    if(msg.type==='attack'){battleTargeting.confirm(msg);log(`${msg.from} sent ${msg.amount} Glitch Blocks.`);effects.play('incoming');}
    if(msg.type==='sent'){battleTargeting.confirm(msg);log(`Sent ${msg.amount} Glitch Blocks to ${msg.to}.`);effects.play('sent');}
    if(msg.type==='eliminated'){music.setContext('defeat');effects.play('lose');eliminationSoundPlayed=true;overlay(`#${msg.place}`,'You’re out. Watch the remaining players.');log(`Eliminated in ${msg.place}${ordinal(msg.place)} place.`);$('leave-match').hidden=false;}
    if(msg.type==='finished'){
      music.setContext(msg.won?'victory':'defeat');
      const won=msg.won??msg.winnerId===id;if(!finished&&!trainingActive){records.finish(won);updateRecords();}
      if(won)effects.play('win');else if(!eliminationSoundPlayed)effects.play('lose');finished=true;playing=false;host=msg.host;overlay(won?(roomMode==='teams'?'TEAM WIN':'VICTORY'):`#${msg.place}`,`${msg.winner} wins the battle!`);$('battle-title').textContent='The dust has settled.';$('rematch').hidden=host!==id;$('leave-match').hidden=false;log(`${msg.winner} is the last player standing.`);
    }
}

function startTraining(mode,lesson=0){
  if(playing&&!trainingActive)send({type:'leave'});
  trainingActive=true;id='training-player';room='OFFLINE';host=id;trainingTick=performance.now();battleIntro.offset=Date.now()-performance.now();
  try{storage?.setItem('vexelon-onboarding',mode==='tutorial'?'tutorial':'skip');}catch{}
  const options={rise:$('practice-rise').value,glitch:$('practice-glitch').value,flux:$('practice-flux').value,gameOver:$('practice-game-over').checked};
  $('training-setup').close();$('training-controls').hidden=false;
  training=new TrainingSession({mode,lesson,options,id,emit:msg=>{
    if(msg.type==='trainingStatus'){trainingUI(msg);return;}
    receiveMessage(msg);
  }});
}
function trainingUI(msg){const justCompleted=msg.done&&!trainingStatus?.done;trainingStatus=msg;document.body.dataset.training=msg.mode;document.body.dataset.lesson=msg.lesson;document.body.classList.add('training');$('training-instruction').textContent=`${msg.mode==='tutorial'?`TUTORIAL ${msg.lesson+1} / 7 · `:''}${msg.title} — ${msg.done?'NICE!':msg.instruction}${msg.paused?' — PAUSED':''}`;$('training-controls').hidden=msg.mode!=='tutorial';document.querySelector('#training-controls [data-training=next]').hidden=!msg.done;if(justCompleted&&document.body.dataset.input==='gamepad'&&!$('pause-dialog').open)openPause();}
function stopTraining(){id=liveId;document.body.classList.remove('training');delete document.body.dataset.training;delete document.body.dataset.lesson;training=null;trainingActive=false;$('training-controls').hidden=true;playing=false;state=null;room=null;show('entry');if(ws?.readyState!==1)connect();}
function openTraining(mode){$('training-setup').dataset.mode=mode;$('practice-options').hidden=mode!=='practice';$('lesson-options').hidden=mode!=='tutorial';$('training-setup').showModal();$('training-start').focus();}
$('tutorial-start').onclick=()=>openTraining('tutorial');$('practice-start').onclick=()=>openTraining('practice');
$('training-start').onclick=()=>startTraining($('training-setup').dataset.mode,Number($('training-lesson').value));
$('training-close').onclick=()=>$('training-setup').close();
for(const b of document.querySelectorAll('[data-training]'))b.onclick=()=>{if(b.dataset.training==='exit'){stopTraining();return;}send({type:'trainingControl',action:b.dataset.training});if($('pause-dialog').open)$('pause-dialog').close();};
$('onboarding-tutorial').onclick=()=>{$('onboarding').close();openTraining('tutorial');};
$('onboarding-skip').onclick=()=>{try{storage?.setItem('vexelon-onboarding','skip');}catch{}$('onboarding').close();};
try{if(!storage?.getItem('vexelon-onboarding')){$('onboarding').showModal();$('onboarding-tutorial').focus();}}catch{}
function ordinal(n){return n%100>=11&&n%100<=13?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th';}
function overlay(title,text){$('board-overlay').hidden=false;$('overlay-title').textContent=title;$('overlay-text').textContent=text;}
function log(text){const p=document.createElement('p');p.textContent=text;$('feed').prepend(p);while($('feed').children.length>5)$('feed').lastChild.remove();}
function renderRivals(){
  if(!state)return;
  $('rivals').classList.toggle('br-grid',roomMode==='battle');
  const rivals=state.players.filter(p=>p.id!==id),ids=new Set(rivals.map(p=>p.id));
  for(const el of [...$('rivals').children])if(!ids.has(el.dataset.id))el.remove();
  for(const p of rivals){
    let el=[...$('rivals').children].find(el=>el.dataset.id===p.id);
    if(!el){el=document.createElement('button');el.className='rival';el.dataset.id=p.id;const c=document.createElement('canvas');c.width=total<=4?360:60;c.height=c.width*2;const name=document.createElement('small');el.append(c,name);el.onclick=()=>{if(p.dead||!playing||(roomMode==='teams'&&p.team===myTeam))return;manualTarget=p.id;send({type:'target',id:p.id});log(`Targeting ${p.name}.`);renderRivals();};$('rivals').append(el);}
    el.classList.toggle('dead',p.dead);el.classList.toggle('target',(roomMode==='battle'?battleTargeting.target:manualTarget)===p.id);el.classList.toggle('ally',roomMode==='teams'&&p.team===myTeam);el.dataset.team=p.team||'';el.disabled=p.dead||!playing||(roomMode==='teams'&&p.team===myTeam);el.title=`#${p.number||state.players.indexOf(p)+1} ${p.name}${p.bot?' (CPU)':''} · ${p.kos} KOs${p.dead?' · eliminated':''}`;el.setAttribute('aria-label',`${roomMode==='teams'&&p.team===myTeam?'Teammate':'Target'} ${p.name}`);el.lastChild.textContent=roomMode==='battle'?String(p.number||state.players.indexOf(p)+1).padStart(2,'0'):(roomMode==='teams'?TEAMS[p.team]+' · ':'')+p.name;
    if(roomMode==='battle'&&battleTargeting.target===p.id&&lastVisualTarget!==p.id){lastVisualTarget=p.id;requestAnimationFrame(()=>el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'}));}
    drawBoard(el.firstChild.getContext('2d'),p.grid,el.firstChild.width,el.firstChild.height,{mini:total>4,miniIntensity:(p.id===(battleTargeting.target||manualTarget)||el.classList.contains("attack-source")||el.classList.contains("ally"))?.85:.22,blocks:p.blocks,reducedMotion:systemMotion()});
  }
}
const keyboardHints=document.querySelector('.keyboard-hint').innerHTML;
function setInputMethod(method){
  if(document.body.dataset.input===method)return;document.body.dataset.input=method;
  const hint=document.querySelector('.keyboard-hint');
  if(method==='gamepad')hint.textContent='D-PAD / LEFT STICK: MOVE · SOUTH FACE: SWAP · WEST/NORTH/LB/LT: ABILITIES · RIGHT STICK: TARGET · START: SETTINGS';
  else hint.innerHTML=keyboardHints;
}
for(const event of ['keydown','pointerdown'])document.addEventListener(event,()=>setInputMethod('keyboard'),{capture:true});
const padControls=browserGamepad({canPlay:()=>playing&&!finished&&!(trainingActive&&training?.paused)&&battleIntro.canPlay(performance.now()),send,ability:requestAbility,target:direction=>{
  const rivals=state?.players.filter(p=>p.id!==id&&!p.dead&&!(roomMode==='teams'&&p.team===myTeam))||[];
  if(!rivals.length)return;let index=rivals.findIndex(p=>p.id===manualTarget);manualTarget=rivals[(index+direction+rivals.length)%rivals.length].id;send({type:'target',id:manualTarget});renderRivals();
},strategy:cycleStrategy,pause:()=>{$('pause-dialog').open?$('pause-dialog').close():playing?openPause():openSettings();},onMethod:setInputMethod});
function draw(){
  if(performance.now()>=motionPollAt){motionPollAt=performance.now()+500;const current=systemMotion();if(current!==lastSystemMotion){lastSystemMotion=current;applyEffectsSettings();}}
  if(trainingActive&&training){const now=performance.now();training.tick(Math.min(.05,(now-trainingTick)/1000));trainingTick=now;}
  padControls.tick(performance.now());
  const now=performance.now(),offset=presentation.offset(now,true);
  $('arena').style.transform=`translate(${offset.x}px,${offset.y}px)`;
  if(state&&now>=presentation.hitStopUntil){const self=state.players.find(p=>p.id===id);if(self)drawBoard(ctx,self.grid,360,720,{rise:state.self.rise,matches:state.self.matches,cursor:state.self.cursor,danger:state.self.danger>0,critical:state.self.danger>=1,blocks:self.blocks,animations,presentation,activeAbility:state.self.activeAbility,lessonHint:trainingActive&&trainingStatus?.mode==='tutorial'&&[0,1,3,4].includes(trainingStatus.lesson)?{x:trainingStatus.lesson===3&&!trainingStatus.actions.includes('combo')?0:2,y:11}:null});}
  if(playing&&!finished&&state&&!state.players.find(p=>p.id===id)?.dead)battleIntro.draw(ctx,now,{reducedMotion:presentation.reducedMotion,onCue:(kind,value)=>{effects.play(kind,{cue:value});if(kind==='go')music.setContext('battle');}});
  battleTargeting.draw(now,{reducedMotion:systemMotion()||presentation.reducedMotion,flashing:presentation.flashing});
  requestAnimationFrame(draw);
}
$('create').disabled=true;
$('play-cpu').disabled=true;
function matchSelection(){return {mode:$('quick-mode').value,ruleset:$('quick-rules').value};}
let battleCpuCount='9';
function saveMatchSetup(){try{storage?.setItem('vexelon-match-setup',JSON.stringify({...matchSelection(),count:battleCpuCount,difficulty:$('quick-difficulty').value}));}catch{}}
function updateQuickMode(){const mode=$('quick-mode').value,small=mode!=='battle';$('quick-count').disabled=small;$('quick-count').value=small?(mode==='duel'?'1':'3'):battleCpuCount;$('mode-note').textContent=small?(mode==='teams'?'2v2 · 3 CPU opponents':'Fixed seats · '+(mode==='duel'?'1 CPU opponent':'3 CPU opponents')):'';saveMatchSetup();}
const three=document.createElement('option');three.value='3';three.textContent='3 CPUs';$('quick-count').insertBefore(three,$('quick-count').children[1]);
try{const saved=JSON.parse(storage?.getItem('vexelon-match-setup')||'{}');if(Object.hasOwn(MODES,saved.mode))$('quick-mode').value=saved.mode;if(Object.hasOwn(RULESETS,saved.ruleset))$('quick-rules').value=saved.ruleset;if(['1','3','9','24','98'].includes(saved.count))battleCpuCount=saved.count;if(['easy','normal','hard'].includes(saved.difficulty))$('quick-difficulty').value=saved.difficulty;}catch{}
$('quick-mode').onchange=updateQuickMode;$('quick-count').onchange=()=>{battleCpuCount=$('quick-count').value;saveMatchSetup();};for(const field of ['quick-rules','quick-difficulty'])$(field).onchange=saveMatchSetup;updateQuickMode();
$('apply-settings').onclick=()=>send({type:'settings',mode:$('room-mode').value,ruleset:$('room-rules').value});
for(const ability of ['pulse','shift','surge','overdrive'])$(ability).onclick=()=>{requestAbility(ability);$(ability).blur();};
function openSettings(){$('effects-dialog').showModal();send({type:'boost',active:false});}
$('global-settings').onclick=()=>playing?openPause():openSettings();
$('settings-entry').onclick=openSettings;$('pause-settings').onclick=openSettings;
$('close-effects').onclick=()=>$('effects-dialog').close();
function openPause(){if(trainingActive&&training&&!training.paused)training.handle({type:'trainingControl',action:'pause'});send({type:'boost',active:false});$('practice-tools').hidden=!trainingActive||document.body.dataset.training!=='practice';document.getElementById('pause-next').hidden=!trainingActive||!trainingStatus?.done||trainingStatus.mode!=='tutorial';$('pause-status').textContent=trainingActive?'':`Online simulation continues. Room ${room||''}`;$('pause-dialog').showModal();$('resume').focus();}
$('pause').onclick=openPause;$('resume').onclick=()=>$('pause-dialog').close();
$('pause-dialog').addEventListener('close',()=>{if(trainingActive&&training?.paused)training.handle({type:'trainingControl',action:'pause'});});
$('pause-next').onclick=()=>{send({type:'trainingControl',action:'next'});$('pause-dialog').close();};
$('pause-leave').onclick=()=>{$('pause-dialog').close();if(trainingActive)stopTraining();else send({type:'leave'});};
for(const id of ['settings-controls','pause-controls'])$(id).onclick=()=>$('controls-dialog').showModal();
$('controls-close').onclick=()=>$('controls-dialog').close();
$('practice-settings').onclick=()=>openTraining('practice');
try{$('name').value=storage?.getItem('vexelon-player-name')||'Player';for(const key of ['panel99-theme','cascadia99-palette'])storage?.removeItem(key);}catch{}
$('name').onchange=()=>{try{storage?.setItem('vexelon-player-name',$('name').value);}catch{}};
function cycleStrategy(){const choices=['random','danger','attackers','badges'];mode=choices[(choices.indexOf(mode)+1)%4];manualTarget=null;send({type:'target',id:null});send({type:'mode',mode});updateTargetSummary();}
function cycleTarget(direction){const rivals=state?.players.filter(p=>p.id!==id&&!p.dead&&!(roomMode==='teams'&&p.team===myTeam))||[];if(!rivals.length)return;const index=rivals.findIndex(p=>p.id===manualTarget);manualTarget=rivals[(index+direction+rivals.length)%rivals.length].id;send({type:'target',id:manualTarget});renderRivals();updateTargetSummary();}
function updateTargetSummary(){const target=state?.players.find(p=>p.id===(manualTarget||state?.self.attackTarget));$('target-summary').textContent=target?`TARGET ${String(target.number||'').padStart(2,'0')}`:'TARGET AUTO';$('target-strategy').textContent={random:'RANDOM',danger:'NEAR TOP',attackers:'ATTACKERS',badges:'MOST KOs'}[state?.self.targetMode||mode];}
$('target-prev').onclick=()=>cycleTarget(-1);$('target-next').onclick=()=>cycleTarget(1);$('target-strategy').onclick=cycleStrategy;
function applyEffectsSettings(){
  document.body.dataset.flashing=$('flashing-effects').value;
  presentation.configure({shake:$('screen-shake').value,flashing:$('flashing-effects').value,quality:$('effect-quality').value,reducedMotion:systemMotion()||$('reduced-motion').checked});animations.quality=presentation.quality;animations.reducedMotion=presentation.reducedMotion;
  animations.reset();presentation.reset();tutorialGallery?.refresh();animations.shakeScale=0;animations.flashing=presentation.fullFlash;
  try{storage?.setItem('cascadia99-fx',JSON.stringify({shake:presentation.shake,flashing:presentation.flashing,quality:presentation.quality,reducedMotion:$('reduced-motion').checked}));}catch{}
}
try{const saved=JSON.parse(storage?.getItem('cascadia99-fx')||'{}');$('reduced-motion').checked=saved.reducedMotion===true;if(['minimal','reduced','full'].includes(saved.quality))$('effect-quality').value=saved.quality;if(['off','reduced','normal','maximum'].includes(saved.shake))$('screen-shake').value=saved.shake;if(['reduced','full'].includes(saved.flashing))$('flashing-effects').value=saved.flashing;}catch{}
for(const el of [$('screen-shake'),$('flashing-effects'),$('effect-quality'),$('reduced-motion')])el.onchange=applyEffectsSettings;applyEffectsSettings();
$('play-cpu').onclick=()=>{effects.unlock();clearErrors();send({type:'create',name:$('name').value,bots:Number($('quick-count').value),difficulty:$('quick-difficulty').value,...matchSelection(),quick:true});};
$('create').onclick=()=>{effects.unlock();clearErrors();send({type:'create',name:$('name').value,...matchSelection()});};
$('join-form').onsubmit=e=>{e.preventDefault();clearErrors();send({type:'join',name:$('name').value,code:$('code').value});};
function clearErrors(){$('entry-error').textContent='';$('lobby-error').textContent='';}
$('code').oninput=()=>{$('code').value=$('code').value.toUpperCase().replace(/[^A-Z0-9]/g,'');};
$('start').onclick=()=>send({type:'start'});
$('apply-bots').onclick=()=>{if(!$('bot-count').reportValidity())return;send({type:'bots',count:Number($('bot-count').value),difficulty:$('bot-difficulty').value});};
$('rematch').onclick=()=>send({type:'rematch'});
for(const name of ['leave-lobby','leave-match'])$(name).onclick=()=>{if(ws.readyState===1)send({type:'leave'});else location.reload();};
$('copy-code').onclick=async()=>{try{await navigator.clipboard.writeText(room);$('copy-label').textContent='Copied!';}catch{$('copy-label').textContent='Select and copy the code above';}clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('copy-label').textContent='Click to copy',2000);};
$('help').onclick=()=>{$('help-dialog').showModal();tutorialGallery??=createTutorialGallery($('help-dialog'),{reducedMotion:{get matches(){return systemMotion()||presentation.reducedMotion;},addEventListener:(...args)=>reducedMotion.addEventListener(...args)},flashing:()=>presentation.flashing});tutorialGallery.refresh();if(playing)send({type:'boost',active:false});};$('close-help').onclick=()=>$('help-dialog').close();
$('sound').onclick=async()=>{effects.setEnabled(!effects.enabled);if(!effects.enabled){}updateSoundButton();try{localStorage.setItem('panel99-sound',effects.enabled?'on':'off');}catch{}if(await effects.unlock()){effects.play('swap');if(playing&&!finished&&!eliminationSoundPlayed)music.start();}};
$('header-sound').onclick=()=>$('sound').click();
$('music').onclick=()=>{music.setEnabled(!music.enabled);updateMusicButton();try{localStorage.setItem('panel99-music',music.enabled?'on':'off');}catch{}if(music.enabled&&playing&&!finished&&!eliminationSoundPlayed)music.start();};
document.addEventListener('keydown',e=>{
  if(e.code==='Escape'&&playing&&!document.querySelector('dialog[open]')){e.preventDefault();openPause();return;}
  if(!playing||document.querySelector('dialog[open]')||['INPUT','SELECT'].includes(document.activeElement?.tagName))return;
  if(!e.repeat&&['KeyQ','KeyE','KeyT'].includes(e.code)){e.preventDefault();e.code==='KeyT'?cycleStrategy():cycleTarget(e.code==='KeyQ'?-1:1);return;}
  const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
  if(moves[e.key]){e.preventDefault();const [dx,dy]=moves[e.key];send({type:'move',dx,dy});}
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)send({type:'swap'});}
  const ability={KeyX:'pulse',KeyC:'shift',KeyV:'surge',KeyB:'overdrive'}[e.code];
  if(ability){e.preventDefault();if(!e.repeat)requestAbility(ability);}
  if(e.key==='Shift'){e.preventDefault();send({type:'boost',active:true});}
});
document.addEventListener('keyup',e=>{if(e.key==='Shift'&&playing)send({type:'boost',active:false});});
window.addEventListener('blur',()=>{if(playing)send({type:'boost',active:false});});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)send({type:'boost',active:false});});
for(const b of document.querySelectorAll('[data-move]'))b.onclick=()=>{const [dx,dy]=b.dataset.move.split(',').map(Number);send({type:'move',dx,dy});b.blur();};
$('swap').onclick=()=>{send({type:'swap'});$('swap').blur();};
$('raise').onpointerdown=e=>{e.preventDefault();$('raise').setPointerCapture(e.pointerId);send({type:'boost',active:true});};
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('raise').addEventListener(event,()=>{send({type:'boost',active:false});$('raise').blur();});
canvas.onpointerdown=e=>{
  if(!playing||!state)return;e.preventDefault();const rect=canvas.getBoundingClientRect(),x=Math.max(0,Math.min(4,Math.floor((e.clientX-rect.left)/rect.width*6))),y=Math.max(0,Math.min(11,Math.floor((e.clientY-rect.top)/rect.height*12+state.self.rise)));
  const cur=state.self.cursor;for(let i=0;i<Math.abs(x-cur.x);i++)send({type:'move',dx:Math.sign(x-cur.x),dy:0});for(let i=0;i<Math.abs(y-cur.y);i++)send({type:'move',dx:0,dy:Math.sign(y-cur.y)});
  document.activeElement?.blur();
};
let serverInfo=null;
async function updateShareAddress(){
  try{
    serverInfo??=await fetch('/api/info').then(response=>response.json());
    $('share-address').replaceChildren();
    const note=document.createElement('p');note.textContent=serverInfo.desktop?'Friends on your Wi-Fi can open this address, then enter the room code:':'Share this game address along with the room code:';$('share-address').append(note);
    const addresses=serverInfo.desktop?serverInfo.addresses:[location.origin];
    for(const address of addresses){const line=document.createElement('code');line.textContent=address;$('share-address').append(line);}
    if(serverInfo.desktop&&!addresses.length){const line=document.createElement('p');line.textContent='Connect to a local network to invite other devices.';$('share-address').append(line);}
  }catch{}
}
if(window.panelDesktop){
  $('server-settings').hidden=false;
  $('server-settings').onclick=()=>{$('server-dialog').showModal();$('server-error').textContent='';if(playing)send({type:'boost',active:false});};
  $('close-server').onclick=()=>$('server-dialog').close();
  $('server-form').onsubmit=async event=>{event.preventDefault();try{await window.panelDesktop.connect($('server-address').value);}catch(error){$('server-error').textContent=error.message;}};
  $('local-server').onclick=()=>window.panelDesktop.local();
}
connect();draw();

setInterval(()=>{if(ws?.readyState===1)send({type:"clock",sentAt:performance.now()});},2000);

if("serviceWorker" in navigator)navigator.serviceWorker.register("/service-worker.js").catch(()=>{});

for(const kind of ['music','sfx']){
 const control=$('volume-'+kind);try{control.value=storage?.getItem('vexelon-volume-'+kind)||'80';}catch{}
 control.oninput=()=>{const value=Number(control.value)/100;if(kind==='music'){music.volume=value;music.automateGain();}else{effects.sfxVolume=value;if(effects.sfxBus)effects.sfxBus.gain.value=value;}try{storage?.setItem('vexelon-volume-'+kind,control.value);}catch{}};control.oninput();
}
