import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MusicPlayer} from '../music.mjs';
import {normalizeManifest} from '../music-library.mjs';
const track=(id,category='gameplay',extra={})=>({id,title:id,path:category+'/'+id+'.ogg',category,loop:true,...extra});
function fixture(tracks){
 const nodes=[];const parameter=()=>({value:1,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}});
 const ctx={currentTime:1,createGain:()=>({gain:parameter(),connect(){},disconnect(){}}),createBufferSource(){const source={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};nodes.push(source);return source;},decodeAudioData:async()=>({duration:60})};
 const audio={context:ctx,master:{},unlockCalls:0,async unlock(){this.unlockCalls++;return true;}};
 const fetcher=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});
 return {player:new MusicPlayer(audio,{manifest:{tracks},fetcher}),audio,nodes};
}
test('canonical shared library is empty and generated music assets are retired',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../assets/audio/music/manifest.json',import.meta.url)));
 assert.deepEqual(manifest,{version:1,tracks:[]});assert.deepEqual(JSON.parse(readFileSync(new URL('../godot/assets/audio/music/manifest.json',import.meta.url))),manifest);
 for(const path of ['audio-score.mjs','godot/assets/audio-score.json','scripts/compose-ost.mjs','docs/audio-preview/neon.ogg'])assert.equal(existsSync(new URL('../'+path,import.meta.url)),false);
});
test('empty/missing library never unlocks audio or creates playback nodes',async()=>{
 const {player,audio,nodes}=fixture([]);await player.setContext('battle');assert.equal(await player.start(),false);player.setEnabled(false);player.setEnabled(true);player.stop();
 assert.equal(audio.unlockCalls,0);assert.equal(nodes.length,0);assert.equal(player.status.playing,false);assert.equal(player.status.track,'NO TRACKS INSTALLED');
 const missing=new MusicPlayer(audio,{fetcher:async()=>{throw Error('offline');}});await missing.loadLibrary();assert.equal(await missing.start(),false);assert.equal(audio.unlockCalls,0);
});
test('registry rejects unsafe paths, duplicates and invalid loop ranges',()=>{
 const valid=track('licensed','menu',{artist:'Developer supplied',credit:'License on file',loopStart:.5,loopEnd:10});
 const registry=normalizeManifest({tracks:[valid,valid,track('bad','gameplay',{path:'../private.mp3'}),track('end','gameplay',{loopStart:3,loopEnd:2}),track('remote','gameplay',{path:'https://example.com/track.ogg'})]});
 assert.deepEqual(Object.keys(registry),['licensed']);assert.equal(registry.licensed.artist,valid.artist);assert.equal(registry.licensed.loopStart,.5);
});
test('file playback loops, fades, preserves same-track phase, transitions and mutes independently',async()=>{
 const {player,nodes}=fixture([track('title','menu'),track('battle','gameplay',{loopStart:2,loopEnd:30}),track('results','results',{loop:false})]);
 await player.setContext('title');assert.equal(await player.start(),true);const first=nodes[0];assert.equal(await player.start(),true);assert.equal(nodes.length,1);
 await player.setContext('intro');assert.equal(nodes.length,1);await player.setContext('battle');assert.equal(nodes.length,2);assert.equal(first.stopped,true);assert.equal(nodes[1].loopStart,2);assert.equal(nodes[1].loopEnd,30);
 player.setEnabled(false);assert.equal(player.bus.gain.value,0);assert.equal(nodes[1].stopped,undefined);player.setEnabled(true);assert.equal(nodes.length,2);
 await player.setContext('victory');assert.equal(nodes[2].loop,false);player.stop();assert.equal(player.status.playing,false);assert.equal(nodes[2].stopped,true);
});
test('missing files/decode failures and cancelled async loads fail safely without fallback',async()=>{
 const {player,nodes}=fixture([track('battle')]);player.context='battle';player.fetcher=async()=>({ok:false});assert.equal(await player.start(),false);assert.equal(nodes.length,0);
 let release;player.fetcher=async()=>({ok:true,arrayBuffer:()=>new Promise(r=>{release=r;})});const pending=player.start();while(!release)await new Promise(r=>setImmediate(r));player.stop();release(new ArrayBuffer(0));assert.equal(await pending,false);assert.equal(nodes.length,0);
});
test('library loading hides missing recordings and stale selections are rejected',async()=>{
 const {audio}=fixture([]);const player=new MusicPlayer(audio,{fetcher:async(path,options)=>options?.method==='HEAD'?{ok:!path.includes('missing')}:{ok:true,json:async()=>({tracks:[track('valid'),track('missing')]})}});
 await player.loadLibrary();assert.deepEqual(Object.keys(player.tracks),['valid']);assert.equal(await player.setTrack('neon'),false);assert.equal(await player.setTrack('valid'),true);assert.equal(audio.unlockCalls,0);
});
