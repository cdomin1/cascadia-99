import test from 'node:test';
import assert from 'node:assert/strict';
import {SoundEffects} from '../sound.mjs';
class Context {
  constructor(){this.state='suspended';this.sampleRate=44100;this.currentTime=1;this.destination={};this.started=[];this.buffers=[];}
  async resume(){this.state='running';}
  parameter(){return {value:0,setValueAtTime(){},exponentialRampToValueAtTime(value){assert.ok(value>0);}};}
  node(){return {connect(){},disconnect(){},start:()=>this.started.push(true),stop(){}};}
  createGain(){return {...this.node(),gain:this.parameter()};}
  createOscillator(){return {...this.node(),frequency:this.parameter()};}
  createBiquadFilter(){return {...this.node(),frequency:this.parameter()};}
  createBufferSource(){return this.node();}
  createBuffer(_channels,length){const data=new Float32Array(length);this.buffers.push(data);return {getChannelData:()=>data};}
}
test('audio remains silent before a gesture unlocks the context',async()=>{
  const context=new Context(),sound=new SoundEffects({contextFactory:()=>context});
  assert.equal(sound.play('swap'),false);assert.equal(context.started.length,0);
  assert.equal(await sound.unlock(),true);assert.equal(sound.play('swap'),true);assert.ok(context.started.length>0);
});
test('mute stops existing output and prevents new effects',async()=>{
  const sound=new SoundEffects({contextFactory:()=>new Context()});await sound.unlock();sound.play('clear');const played=sound.played;
  sound.setEnabled(false);assert.equal(sound.master.gain.value,0);assert.equal(sound.play('win'),false);assert.equal(sound.played,played);
  sound.setEnabled(true);assert.ok(sound.master.gain.value>0);assert.equal(sound.play('win'),true);
});
test('gameplay effects schedule audio and garbage generates a noise buffer',async()=>{
  for(const event of ['move','swap','clear','sent','incoming','garbage','countdown','go','danger','win','lose']){
    const context=new Context(),sound=new SoundEffects({contextFactory:()=>context});await sound.unlock();assert.equal(sound.play(event,{chain:3,count:5}),true,event);assert.ok(context.started.length>0,event);
    if(event==='garbage')assert.ok(context.buffers[0].some(sample=>sample!==0));
  }
});
test('unavailable audio fails gracefully without blocking play',async()=>{
  const sound=new SoundEffects({contextFactory:()=>{throw new Error('Audio unavailable');}});assert.equal(await sound.unlock(),false);assert.equal(sound.play('swap'),false);
});
