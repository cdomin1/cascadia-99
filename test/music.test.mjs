import test from 'node:test';
import assert from 'node:assert/strict';
import {AdaptiveMusic,boardPressure,musicIntensity,musicTempo,TRACKS} from '../music.mjs';
const grid=rows=>Array.from({length:12},(_,y)=>Array(6).fill(y>=12-rows?1:0));
test('music pressure grows with stack height and occupancy',()=>{
  assert.equal(boardPressure(grid(0)),0);assert.equal(boardPressure(grid(12)),1);
  assert.ok(boardPressure(grid(5))<boardPressure(grid(8)));assert.ok(boardPressure(grid(8))<boardPressure(grid(11)));
  const uneven=grid(5);uneven[0][0]=1;assert.ok(boardPressure(uneven)>boardPressure(grid(5)));
});
test('pressure preserves authored tempo and changes musical parts instead',()=>{for(const id of Object.keys(TRACKS))assert.equal(musicTempo(0,id),musicTempo(1,id));assert.equal(musicTempo(0),124);});
test('music target follows the board and returns to calm after clears',()=>{
  const music=new AdaptiveMusic();music.update(grid(11));assert.ok(music.target>.9);music.update(grid(4));assert.equal(music.target,0);
});
test('disabled or unavailable audio never starts a scheduler',async()=>{
  const music=new AdaptiveMusic({unlock:async()=>false});assert.equal(await music.start(),false);assert.equal(music.status.playing,false);
  music.enabled=false;assert.equal(await music.start(),false);music.stop();assert.equal(music.requested,false);
});

test('soundtrack selection preserves pressure and mute without starting audio',async()=>{
  const synth=new AdaptiveMusic({unlock:async()=>{throw new Error('Selecting a silent track must not unlock audio');}});
  synth.update(grid(11));const pressure=synth.target;synth.setEnabled(false);
  for(const id of Object.keys(TRACKS)){assert.equal(await synth.setTrack(id),true);assert.equal(synth.status.track,TRACKS[id].name);assert.equal(synth.status.playing,false);assert.equal(synth.target,pressure);assert.equal(synth.enabled,false);assert.equal(musicTempo(1,id),musicTempo(0,id));}
  assert.equal(await synth.setTrack('missing'),false);assert.equal(synth.trackId,'chrome');
});
