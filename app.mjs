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
let fluxConfig=FLUX,abilitySequence=0,resumeToken=null,reconnectTimer=null;
const abilitySession=globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
function requestAbility(ability){send({type:'ability',ability,requestId:`${abilitySession}:${++abilitySequence}`});}
let roomMode='battle',roomRules='classic',myTeam=null,previewingMusic=false;
function stopPreview(){if(previewingMusic){music.stop();previewingMusic=false;}$('preview-music').textContent='♫ Hear the soundtrack';$('preview-music').setAttribute('aria-pressed','false');}
let ws,id,room,host,total=0,state=null,playing=false,finished=false,mode='random',manualTarget=null,toastTimer,lastCountdown=null,lastDangerSound=0,eliminationSoundPlayed=false;
try{effects.enabled=localStorage.getItem('panel99-sound')!=='off';}catch{}
try{music.enabled=localStorage.getItem('panel99-music')!=='off';}catch{}
function updateSoundButton(){$('sound').textContent=effects.enabled?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(effects.enabled));}
function updateMusicButton(){$('music').textContent=music.enabled?'Music on':'Music off';$('music').setAttribute('aria-pressed',String(music.enabled));}
updateSoundButton();
updateMusicButton();
for(const [id,track]of Object.entries(TRACKS)){const option=document.createElement('option');option.value=id;option.textContent=track.name;$('track').append(option);}
try{const saved=localStorage.getItem('cascadia99-track');if(Object.hasOwn(TRACKS,saved))music.setTrack(saved);}catch{}
$('track').value=music.trackId;
$('track').addEventListener('change',async()=>{const id=$('track').value;if(await music.setTrack(id)){try{localStorage.setItem('cascadia99-track',id);}catch{}}});
document.addEventListener('palettechange',()=>{if(state)renderRivals();});
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{effects.unlock().then(()=>{if(playing&&!finished&&!eliminationSoundPlayed)music.start();});},{capture:true});
const canvas=$('board'),ctx=canvas.getContext('2d');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let tutorialGallery;
let demoPaused=false;
const presentation=new PresentationEffects({reducedMotion:reducedMotion.matches});
const animations=new BoardAnimations({reducedMotion:reducedMotion.matches,onImpact:block=>{presentation.trigger('garbage',performance.now(),{size:block.width*block.height});effects.play('garbage');}});
reducedMotion.addEventListener('change',event=>{animations.reducedMotion=event.matches;animations.flashing=!event.matches&&presentation.flashing==='full';presentation.configure({reducedMotion:event.matches});presentation.reset();animations.reset();refreshHomepageDemo();});
function show(section){stopPreview();if(section!=='arena')battleTargeting.stop();if(section!=='arena'){music.stop();document.body.classList.remove('small-match','team-match');}document.body.classList.toggle('in-match',section==='arena');for(const s of ['entry','lobby','arena'])$(s).hidden=s!==section;}
function send(data){if(ws?.readyState===1)ws.send(JSON.stringify(data));else error('Connection lost. Reload to reconnect.');}
function error(message){$('entry-error').textContent=message;$('lobby-error').textContent=message;if(playing)log(message);}
function connect(){
  ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/socket`);
  ws.onopen=()=>{$('connection').textContent='Connected';$('create').disabled=false;$('play-cpu').disabled=false;for(const b of document.querySelectorAll('#join-form button'))b.disabled=false;};
  ws.onclose=()=>{
    music.stop();
    $('connection').textContent='Disconnected';$('create').disabled=true;$('play-cpu').disabled=true;
    error(room?'Connection lost. Reconnecting…':'Disconnected. Reload to connect.');playing=false;
    if(!$('arena').hidden){overlay('Reconnecting','The match continues. Recovering your session…');$('leave-match').hidden=false;}
    if(room){clearTimeout(reconnectTimer);reconnectTimer=setTimeout(connect,750);}
    for(const b of document.querySelectorAll('#start,#join-form button'))b.disabled=true;
  };
  ws.onerror=()=>error('Could not reach the game server.');
  ws.onmessage=({data})=>{
    const msg=JSON.parse(data);
    if(['pulse','ability','attack','effect'].includes(msg.type))presentation.trigger(msg.ability||msg.type,performance.now(),msg);
    animations.event(msg,state?.players.find(p=>p.id===id)?.grid,state?.self.rise||0);
    if(msg.type==='hello'){const previous=resumeToken;id=msg.id;fluxConfig=msg.fluxConfig||FLUX;resumeToken=msg.resumeToken;send({type:'session',resumable:true});if(previous&&room)send({type:'resume',token:previous});}
    if(msg.type==='resumed'){id=msg.id;resumeToken=msg.resumeToken;room=msg.room;host=msg.host;}
    if(msg.type==='resumeRejected'){room=null;state=null;playing=false;show('entry');error('Session expired. Join a new room.');}
    if(msg.type==='host'){host=msg.host;if(finished)$('rematch').hidden=host!==id;}
    if(msg.type==='error')error(msg.message);
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
      battleTargeting.begin(msg,id);lastVisualTarget=null;
      animations.reset();presentation.reset();music.overdrive=false;state=null;roomMode=msg.mode||'battle';roomRules=msg.ruleset||'classic';myTeam=msg.team;
      document.body.classList.toggle('small-match',msg.total<=4);document.body.classList.toggle('team-match',roomMode==='teams');
      $('match-label').textContent=`${MODES[roomMode].label.toUpperCase()} / ${RULESETS[roomRules].label.toUpperCase()}`;
      $('team-status').hidden=roomMode!=='teams';$('pulse').disabled=true;$('pulse').textContent='Pulse · 0%';
      playing=true;finished=false;total=msg.total;manualTarget=null;mode='random';lastCountdown=null;lastDangerSound=0;eliminationSoundPlayed=false;show('arena');document.activeElement?.blur();$('rivals').replaceChildren();$('feed').replaceChildren();$('rematch').hidden=true;$('leave-match').hidden=true;$('battle-title').textContent='Make your move.';$('board-room').textContent=room;
      for(const b of document.querySelectorAll('.mode'))b.classList.toggle('active',b.dataset.mode===mode);
      overlay(msg.resumed?'Reconnected':'3',msg.resumed?'Synchronizing your board…':'Get ready. The stack is about to rise.');log(`${msg.humans} human${msg.humans===1?'':'s'}, ${msg.bots} CPUs. One survivor.`);
      music.target=0;music.start();
    }
    if(msg.type==='state'){
      state=msg;battleTargeting.state(msg);$('remaining').replaceChildren(document.createTextNode(msg.remaining));const denom=document.createElement('span');denom.textContent=` / ${total}`;$('remaining').append(denom);
      animations.state({...msg.self,blocks:msg.players.find(p=>p.id===id)?.blocks||[]});
      mode=msg.self.targetMode||mode;manualTarget=msg.self.target;
      for(const el of document.querySelectorAll('.mode'))el.classList.toggle('active',el.dataset.mode===mode);
      if(lastCountdown!==msg.countdown){if(!finished)effects.play(msg.countdown>0?'countdown':'go');lastCountdown=msg.countdown;}
      if(msg.self.danger>0&&performance.now()-lastDangerSound>900){effects.play('danger');lastDangerSound=performance.now();}
      records.observe(msg.self.score,msg.self.bestChain||msg.self.chain);updateRecords();
      const flux=msg.self.flux||0;presentation.meter(flux,fluxConfig.max,performance.now());
      $('flux-meter').dataset.charge=flux>=fluxConfig.max?'full':flux>=fluxConfig.max*.75?'high':'low';
      $('flux-label').textContent=`FLUX ${Math.floor(flux)} / ${fluxConfig.max}`;
      $('flux-meter').setAttribute('aria-valuemax',fluxConfig.max);$('flux-meter').setAttribute('aria-valuenow',Math.floor(flux));
      $('flux-fill').style.width=`${flux/fluxConfig.max*100}%`;
      for(const [ability,key]of Object.entries({pulse:'X',shift:'C',surge:'V',overdrive:'B'})){
        $(ability).textContent=`${ability[0].toUpperCase()+ability.slice(1)} · ${fluxConfig[ability].cost} · ${key}`;
        $(ability).disabled=!msg.self.abilities?.[ability]||msg.countdown>0||finished;
      }
      $('ability-timer').textContent=msg.self.activeAbility?`${msg.self.activeAbility.toUpperCase()} ${msg.self.abilityRemaining.toFixed(1)}s`:flux>=fluxConfig.max?`OVERDRIVE ${Math.max(0,fluxConfig.overdrive.hold-msg.self.maxFluxHeld).toFixed(1)}s`:'BUILD FLUX';
      music.overdrive=msg.self.activeAbility==='overdrive';
      $('pulse-note').textContent=`Pulse: cancel ${6*fluxConfig.pulse.rows} incoming blocks${roomMode==='teams'?' or rescue a teammate':''}. Shift: stable board only. Surge / Overdrive: attack boosts.`;
      if(msg.teamRemaining)$('team-status').textContent=`${TEAMS[myTeam]} team · Cyan ${msg.teamRemaining.a} / Coral ${msg.teamRemaining.b}`;
      $('kos').textContent=msg.self.kos;$('score').textContent=msg.self.score.toLocaleString();$('time').textContent=`${Math.floor(msg.elapsed/60)}:${String(Math.floor(msg.elapsed%60)).padStart(2,'0')}`;
      $('chain-label').textContent=msg.self.chain>1?`${msg.self.chain}× CHAIN`:'BUILD YOUR CHAIN';
      const count=msg.self.incoming.reduce((sum,a)=>sum+a.amount,0);$('garbage-count').textContent=count;$('garbage-meter').replaceChildren();for(let i=0;i<12;i++){const block=document.createElement('i');block.className=i<Math.min(count,12)?'filled':'';$('garbage-meter').append(block);}
      const self=msg.players.find(p=>p.id===id);if(self)$('player-name').textContent=self.name.toUpperCase();
      if(self&&!self.dead)music.update(self.grid);
      if(!finished&&self&&!self.dead){if(msg.countdown>0)overlay(String(msg.countdown),'Get ready.');else $('board-overlay').hidden=true;}
      $('board-status').textContent=msg.self.danger>0?'DANGER — clear the top!':count?`Garbage arrives in ${Math.max(0,Math.ceil(msg.self.incoming[0].delay))}s`:'Keep the stack below the top.';
      renderRivals();
    }
    if(msg.type==='ability'){effects.play(msg.ability);log(`${msg.ability.toUpperCase()} activated!`);}
    if(msg.type==='abilityRejected')log('Ability unavailable: check Flux, board state, and active effects.');
    if(msg.type==='move'||msg.type==='swap')effects.play(msg.type);
    if(msg.type==='pulse'){effects.play('pulse');log(msg.assist?`${msg.from} rescued ${msg.to}: ${msg.cancelled} blocks cancelled!`:`Pulse cancelled ${msg.cancelled} incoming blocks.`);}
    if(msg.type==='break'){effects.play('clear');log('Garbage cracked! Panels are breaking free.');}
    if(msg.type==='convert')effects.play('move');
    if(msg.type==='effect'){effects.play('clear',msg);if(msg.chain>1||msg.count>3)log(msg.chain>1?`${msg.chain}× chain! Keep it going.`:`${msg.count}-panel combo!`);}
    if(msg.type==='attack'){battleTargeting.confirm(msg);log(`${msg.from} sent ${msg.amount} garbage.`);effects.play('incoming');}
    if(msg.type==='sent'){battleTargeting.confirm(msg);log(`Sent ${msg.amount} garbage to ${msg.to}.`);effects.play('sent');}
    if(msg.type==='eliminated'){music.stop();effects.play('lose');eliminationSoundPlayed=true;overlay(`#${msg.place}`,'You’re out. Watch the remaining players.');log(`Eliminated in ${msg.place}${ordinal(msg.place)} place.`);$('leave-match').hidden=false;}
    if(msg.type==='finished'){
      music.stop();
      const won=msg.won??msg.winnerId===id;if(!finished){records.finish(won);updateRecords();}
      if(won)effects.play('win');else if(!eliminationSoundPlayed)effects.play('lose');finished=true;playing=false;host=msg.host;overlay(won?(roomMode==='teams'?'TEAM WIN':'VICTORY'):`#${msg.place}`,`${msg.winner} wins the battle!`);$('battle-title').textContent='The dust has settled.';$('rematch').hidden=host!==id;$('leave-match').hidden=false;log(`${msg.winner} is the last player standing.`);
    }
  };
}
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
    if(!el){el=document.createElement('button');el.className='rival';el.dataset.id=p.id;const c=document.createElement('canvas');c.width=total<=4?120:60;c.height=c.width*2;const name=document.createElement('small');el.append(c,name);el.onclick=()=>{if(p.dead||!playing||(roomMode==='teams'&&p.team===myTeam))return;manualTarget=p.id;send({type:'target',id:p.id});log(`Targeting ${p.name}.`);renderRivals();};$('rivals').append(el);}
    el.classList.toggle('dead',p.dead);el.classList.toggle('target',(roomMode==='battle'?battleTargeting.target:manualTarget)===p.id);el.classList.toggle('ally',roomMode==='teams'&&p.team===myTeam);el.dataset.team=p.team||'';el.disabled=p.dead||!playing||(roomMode==='teams'&&p.team===myTeam);el.title=`#${p.number||state.players.indexOf(p)+1} ${p.name}${p.bot?' (CPU)':''} · ${p.kos} KOs${p.dead?' · eliminated':''}`;el.setAttribute('aria-label',`${roomMode==='teams'&&p.team===myTeam?'Teammate':'Target'} ${p.name}`);el.lastChild.textContent=roomMode==='battle'?String(p.number||state.players.indexOf(p)+1).padStart(2,'0'):(roomMode==='teams'?TEAMS[p.team]+' · ':'')+p.name;
    if(roomMode==='battle'&&battleTargeting.target===p.id&&lastVisualTarget!==p.id){lastVisualTarget=p.id;requestAnimationFrame(()=>el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'}));}
    drawBoard(el.firstChild.getContext('2d'),p.grid,el.firstChild.width,el.firstChild.height,{mini:total>4,blocks:p.blocks,reducedMotion:reducedMotion.matches});
  }
}
function draw(){
  const now=performance.now(),offset=presentation.offset(now,true);
  $('arena').style.transform=`translate(${offset.x}px,${offset.y}px)`;
  if(state&&now>=presentation.hitStopUntil){const self=state.players.find(p=>p.id===id);if(self)drawBoard(ctx,self.grid,360,720,{rise:state.self.rise,matches:state.self.matches,cursor:state.self.cursor,danger:state.self.danger>0,blocks:self.blocks,animations,presentation,activeAbility:state.self.activeAbility});}
  battleTargeting.draw(now,{reducedMotion:reducedMotion.matches||presentation.reducedMotion,flashing:presentation.flashing});
  requestAnimationFrame(draw);
}
$('create').disabled=true;
$('play-cpu').disabled=true;
function matchSelection(){return {mode:$('quick-mode').value,ruleset:$('quick-rules').value};}
function updateQuickMode(){const mode=$('quick-mode').value,small=mode!=='battle';$('quick-count').disabled=small;if(small)$('quick-count').value=mode==='duel'?'1':'3';$('mode-note').textContent=mode==='teams'?'2v2 teams: defend together, rescue with Pulse, win as a team.':small?'Fill this room with friends, or play immediately against CPUs.':'No accounts. Play CPUs solo or invite your friends.';}
const three=document.createElement('option');three.value='3';three.textContent='3 CPUs · Full room';$('quick-count').insertBefore(three,$('quick-count').children[1]);
$('quick-mode').onchange=updateQuickMode;updateQuickMode();
$('apply-settings').onclick=()=>send({type:'settings',mode:$('room-mode').value,ruleset:$('room-rules').value});
for(const ability of ['pulse','shift','surge','overdrive'])$(ability).onclick=()=>{requestAbility(ability);$(ability).blur();};
$('effects-settings').onclick=()=>{$('effects-dialog').showModal();if(playing)send({type:'boost',active:false});};
$('close-effects').onclick=()=>$('effects-dialog').close();
function applyEffectsSettings(){
  document.body.dataset.flashing=$('flashing-effects').value;
  presentation.configure({shake:$('screen-shake').value,flashing:$('flashing-effects').value});
  animations.reset();presentation.reset();tutorialGallery?.refresh();refreshHomepageDemo();animations.shakeScale=0;animations.flashing=presentation.fullFlash;
  try{storage?.setItem('cascadia99-fx',JSON.stringify({shake:presentation.shake,flashing:presentation.flashing}));}catch{}
}
try{const saved=JSON.parse(storage?.getItem('cascadia99-fx')||'{}');if(['off','reduced','normal','maximum'].includes(saved.shake))$('screen-shake').value=saved.shake;if(['reduced','full'].includes(saved.flashing))$('flashing-effects').value=saved.flashing;}catch{}
for(const el of [$('screen-shake'),$('flashing-effects')])el.onchange=applyEffectsSettings;applyEffectsSettings();
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
function refreshHomepageDemo(){
  const reduced=reducedMotion.matches||presentation.flashing==='reduced';
  $('homepage-demo').src=`/demo/gameplay.${demoPaused||reduced?'png':'gif'}?v=12`;
  $('demo-pause').disabled=reduced;
  $('demo-pause').textContent=reduced?'Still':demoPaused?'Play':'Pause';
  $('demo-pause').setAttribute('aria-pressed',String(demoPaused||reduced));
}
$('demo-pause').onclick=()=>{demoPaused=!demoPaused;refreshHomepageDemo();};
$('help').onclick=()=>{$('help-dialog').showModal();tutorialGallery??=createTutorialGallery($('help-dialog'),{reducedMotion,flashing:()=>presentation.flashing});tutorialGallery.refresh();if(playing)send({type:'boost',active:false});};$('close-help').onclick=()=>$('help-dialog').close();
$('sound').onclick=async()=>{effects.setEnabled(!effects.enabled);if(!effects.enabled){music.stop();stopPreview();}updateSoundButton();try{localStorage.setItem('panel99-sound',effects.enabled?'on':'off');}catch{}if(await effects.unlock()){effects.play('swap');if(playing&&!finished&&!eliminationSoundPlayed)music.start();}};
$('preview-music').onclick=async()=>{
  if(previewingMusic){stopPreview();return;}
  effects.setEnabled(true);music.setEnabled(true);updateSoundButton();updateMusicButton();
  try{localStorage.setItem('panel99-sound','on');localStorage.setItem('panel99-music','on');}catch{}
  music.target=0;if(await music.start()){previewingMusic=true;$('preview-music').textContent='■ Stop soundtrack';$('preview-music').setAttribute('aria-pressed','true');}
};
$('music').onclick=()=>{music.setEnabled(!music.enabled);if(!music.enabled)stopPreview();updateMusicButton();try{localStorage.setItem('panel99-music',music.enabled?'on':'off');}catch{}if(music.enabled&&playing&&!finished&&!eliminationSoundPlayed)music.start();};
for(const b of document.querySelectorAll('.mode'))b.onclick=()=>{mode=b.dataset.mode;manualTarget=null;send({type:'target',id:null});send({type:'mode',mode});for(const el of document.querySelectorAll('.mode'))el.classList.toggle('active',el===b);};
document.addEventListener('keydown',e=>{
  if(!playing||$('effects-dialog').open||$('help-dialog').open||$('server-dialog').open||['INPUT','SELECT'].includes(document.activeElement?.tagName))return;
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
