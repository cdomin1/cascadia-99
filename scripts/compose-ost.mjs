// Original authored score. No random pitch generation or borrowed material.
// Events: [sixteenth, MIDI, duration-in-sixteenths, level, voice, pan, layer].
import {writeFile} from 'node:fs/promises';
const motif=[62,69,65,64,72,69];
const phrases={
 neon:[ // clockwork funk: clipped pickup / long answer / displaced return
 [[0,62,2],[3,69,1],[6,65,2],[10,64,2],[14,72,2],[18,69,4],[25,67,2],[28,65,3]],
 [[1,64,2],[5,65,2],[8,69,3],[13,67,2],[17,65,3],[23,64,2],[26,60,2],[30,62,2]],
 [[0,74,2],[3,72,1],[7,69,2],[10,67,2],[15,65,2],[20,69,3],[26,64,2],[29,62,3]],
 [[2,65,1],[5,69,2],[9,72,2],[14,74,3],[21,72,2],[25,69,2],[29,67,3]]],
 midnight:[ // angular ostinato punctuated by wide-interval replies
 [[0,74,1],[2,69,1],[5,65,2],[9,76,1],[12,72,2],[17,69,2],[22,64,1],[25,65,3],[30,62,2]],
 [[0,69,2],[4,77,1],[7,76,1],[11,72,2],[16,74,3],[21,69,2],[26,67,2],[30,65,2]],
 [[1,62,1],[4,74,2],[8,72,1],[11,69,1],[15,65,3],[21,67,2],[25,64,2],[29,62,3]],
 [[0,76,2],[5,77,1],[8,74,2],[13,72,1],[18,69,3],[24,65,2],[28,64,4]]],
 coast:[ // playful machine-funk, bell answer and bass-led rests
 [[2,65,2],[6,69,1],[9,62,3],[15,64,1],[18,65,2],[23,72,2],[28,69,4]],
 [[0,67,3],[5,65,1],[9,64,2],[14,60,2],[19,62,3],[25,69,2],[29,65,3]],
 [[0,72,2],[4,69,2],[9,67,1],[13,65,3],[20,64,2],[25,62,2],[30,60,2]],
 [[1,65,2],[6,67,2],[10,69,3],[16,72,2],[21,74,2],[26,69,2],[30,62,2]]],
 chrome:[ // half-time low-end threat, a terse hook and rising pressure answer
 [[0,62,3],[6,65,2],[11,64,2],[18,69,3],[25,60,2],[29,62,3]],
 [[1,69,2],[7,72,3],[14,67,2],[20,65,3],[27,64,2],[30,62,2]],
 [[0,74,3],[7,69,2],[12,65,2],[18,64,3],[26,60,2],[30,62,2]],
 [[3,65,2],[9,64,2],[15,62,3],[22,69,2],[27,67,2],[30,65,2]]]
};
const profiles={
 neon:{name:'Circuit Animal',bpm:124,identity:'mechanical electro-funk',lead:'reed',bass:'rubber',roots:[38,38,41,36,43,38,46,45],kicks:[0,6,8,11],snares:[4,12],hats:[0,2,3,6,8,10,11,14],bassPattern:[[0,0,2],[3,12,1],[6,0,2],[9,7,1],[11,10,1],[14,12,2]]},
 midnight:{name:'Vector Teeth',bpm:148,identity:'angular fast sequencer',lead:'metal',bass:'pluck',roots:[38,43,38,46,41,48,45,38],kicks:[0,3,8,10,14],snares:[4,12],hats:[0,2,5,6,8,10,13,14,15],bassPattern:[[0,0,1],[2,12,1],[5,7,1],[8,0,2],[11,12,1],[13,5,1],[15,7,1]]},
 coast:{name:'Pocket Dimension',bpm:112,identity:'playful alternate-future funk',lead:'bell',bass:'rubber',roots:[38,41,43,38,46,43,36,45],kicks:[0,7,10],snares:[4,12],hats:[0,3,6,8,11,14],bassPattern:[[0,0,2],[4,7,1],[7,12,2],[10,0,1],[13,10,1],[15,7,1]]},
 chrome:{name:'Black Current',bpm:132,identity:'dark bass-heavy competitive electro',lead:'wire',bass:'sub',roots:[38,38,36,43,46,41,45,38],kicks:[0,5,8,14],snares:[8],hats:[0,2,6,7,10,12,14],bassPattern:[[0,0,3],[5,0,1],[7,12,1],[10,7,2],[14,10,1],[15,12,1]]}
};
const form=[['BOOT / HOOK',0],['A — CORE',0],['B — ANSWER',1],['A2 — DISPLACED',2],['C — ASCENT',3],['BREAK — BASS SPEAKS',1],['RETURN — FULL CIRCUIT',0],['TURNAROUND',2]];
const tracks={};
for(const [id,p]of Object.entries(profiles)){
 const bars=Array.from({length:64},()=>[]),sections=[];
 const add=(bar,s,n,d,v,voice,pan=0,layer='base')=>{if(s>=0&&s<16)bars[bar].push([s,n,d,v,voice,pan,layer]);};
 for(let bar=0;bar<64;bar++){
  const section=Math.floor(bar/8),within=bar%8,root=p.roots[(within+(section===2?3:section===4?5:0))%8];
  if(within===0)sections.push({bar,name:form[section][0]});
  const sparse=section===5,boot=section===0&&within<2;
  // Bass: every second bar answers the lead; cadence bars use a deliberate pickup.
  if(!boot||within===1)for(const [s,degree,d]of p.bassPattern){const offset=(within%2&&s===14)?-2:0;add(bar,s,root+degree+offset,d,.42,p.bass);}
  if(within===7){add(bar,12,root+12,1,.34,p.bass);add(bar,13,root+10,1,.30,p.bass);add(bar,15,p.roots[0]-1,1,.30,p.bass);}
  // Actual 2-bar melodic phrases, composed answers and restrained rests.
  const phrase=phrases[id][(form[section][1]+Math.floor(within/2))%4];
  if((!sparse||within>=4)&&!boot)for(const [s,n,d]of phrase){if(Math.floor(s/16)===within%2){const shift=section===6&&within>=4?12:0;const displaced=section===3&&within<4?(s%16+1)%16:s%16;add(bar,displaced,n+shift,d,.22,p.lead,.16);}}
  // The shared six-note signature appears as a phrase, not an endless arpeggio.
  if(section===0&&within<2)for(const [i,s]of [0,3,6,10,14,18].entries())if(Math.floor(s/16)===within)add(bar,s%16,motif[i],i===5?5:2,.25,'reed',-.12);
  if(!boot){for(const s of p.kicks)if(!sparse||s===0||s===8)add(bar,s,36,2,.58,'kick');for(const s of p.snares)if(!sparse||within>=4)add(bar,s,50,2,.28,'snare');for(const s of p.hats)if(!sparse||s%4===0)add(bar,s,90,.6,s%4===0?.10:.065,'hat',s%4?-.35:.35);}
  // A compact harmonic stab / its offbeat answer. No full-time pad wallpaper.
  if(!sparse&&!boot)for(const s of (within%2?[3,11]:[2,10]))for(const interval of [12,15,22])add(bar,s,root+interval,2,.075,'stab',interval===12?-.25:.25);
  if((within===3||within===7)&&!boot)for(const [i,s]of [13,14,15].entries())add(bar,s,55-i*3,1,.16+i*.025,'tom',-.25+i*.25);
  // Synchronized optional parts use the SAME root, metre and phrase structure.
  for(const s of [3,7,11,15])add(bar,s,root+24+(s===11?7:0),1,.095,'pluck',-.3,'momentum');
  for(const s of [2,6,10,14])add(bar,s,root+36+(within%2?5:7),1,.08,'metal',.3,'danger');
  for(const s of [5,9,13,15]){add(bar,s,root+24+(s===15?1:10),.7,.07,'wire',s%2?-.3:.3,'critical');add(bar,s,90,.5,.06,'hat',0,'critical');}
  for(const [s,n,d]of phrases[id][(form[section][1]+1)%4])if(Math.floor(s/16)===within%2)add(bar,s%16,n+12,d,.13,'bell',-.35,'overdrive');
  for(const s of [3,7,11,15]){add(bar,s,root+12,1,.17,p.bass,.1,'overdrive');add(bar,s,90,.6,.075,'hat',.4,'overdrive');}
  bars[bar].sort((a,b)=>a[0]-b[0]);
 }
 tracks[id]={...p,bars,sections,duration:64*240/p.bpm};
}
const sfx={
 move:[[0,74,.025,.10,'pluck']],confirm:[[0,62,.10,.32,'metal'],[.06,69,.12,.28,'bell']],back:[[0,69,.07,.20,'wire'],[.05,62,.08,.17,'pluck']],
 swap:[[0,74,.055,.32,'pluck'],[.035,67,.05,.22,'metal']],sent:[[0,62,.12,.36,'wire'],[.06,74,.15,.30,'metal']],attack:[[0,50,.11,.40,'metal'],[.05,38,.13,.30,'tom']],
 incoming:[[0,74,.12,.34,'wire'],[.11,65,.14,.29,'metal']],garbage:[[0,36,.18,.60,'kick'],[0,50,.15,.32,'snare'],[.06,38,.10,.28,'metal']],glitchBreak:[[0,62,.08,.30,'metal'],[.04,69,.12,.32,'bell'],[.08,74,.15,.25,'reed']],
 overdriveReady:[[0,62,.10,.27,'metal'],[.07,69,.12,.28,'bell'],[.14,72,.18,.30,'reed']],
 flux:[[0,81,.08,.16,'bell']],ready:[[0,62,.12,.25,'bell'],[.08,69,.16,.28,'metal']],pulse:[[0,62,.14,.40,'metal'],[.06,69,.12,.34,'bell'],[.12,74,.18,.30,'reed']],shift:[[0,74,.08,.32,'wire'],[.05,62,.10,.36,'metal'],[.10,38,.14,.40,'kick']],
 surge:[[0,62,.14,.34,'reed'],[.07,65,.12,.30,'metal'],[.14,69,.18,.35,'bell']],overdrive:[[0,36,.24,.65,'kick'],[0,62,.18,.36,'wire'],[.04,69,.16,.34,'metal'],[.08,65,.17,.34,'reed'],[.12,64,.18,.30,'metal'],[.16,72,.20,.36,'bell'],[.23,81,.35,.40,'reed']],
 go:[[0,62,.13,.35,'reed'],[.06,69,.12,.32,'metal'],[.12,65,.13,.30,'reed'],[.18,64,.12,.28,'metal'],[.24,72,.14,.32,'bell'],[.30,74,.22,.40,'reed']],danger:[[0,69,.10,.23,'wire'],[.13,72,.12,.25,'metal']],critical:[[0,74,.08,.30,'wire'],[.10,75,.07,.25,'metal'],[.2,74,.1,.30,'wire']],
 ko:[[0,36,.17,.6,'kick'],[.03,74,.15,.40,'metal'],[.12,62,.20,.35,'reed']],win:[[0,62,.18,.36,'reed'],[.1,69,.16,.34,'metal'],[.2,65,.15,.32,'reed'],[.3,72,.18,.34,'bell'],[.42,74,.45,.40,'reed'],[.42,65,.45,.18,'bell']],lose:[[0,69,.20,.34,'wire'],[.15,65,.18,.30,'metal'],[.3,64,.32,.28,'reed'],[.3,50,.35,.24,'sub']]
};
const score={version:2,motif,tracks,sfx,mix:{master:.85,music:.75,sfx:.85,curve:1.5,musicTrim:1.55,sfxTrim:1.5,ceiling:.94,context:{title:1,intro:.82,battle:1,victory:.65,defeat:.55}}};
await writeFile('audio-score.mjs','// Generated from the authored score in scripts/compose-ost.mjs.\nexport const SCORE='+JSON.stringify(score)+';\n');
await writeFile('godot/assets/audio-score.json',JSON.stringify(score)+'\n');
await writeFile('godot/assets/tracks.json',JSON.stringify(Object.fromEntries(Object.entries(tracks).map(([id,t])=>[id,{name:t.name,bpm:t.bpm,duration:t.duration}])) ,null,2)+'\n');
console.log('COMPOSED',Object.fromEntries(Object.entries(tracks).map(([id,t])=>[id,{name:t.name,bars:t.bars.length,seconds:t.duration}])));
