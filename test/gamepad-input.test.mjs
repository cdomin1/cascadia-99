import test from 'node:test';import assert from 'node:assert/strict';import {GamepadInput} from '../gamepad-input.mjs';
const pad=(axes=[0,0,0,0],buttons=[])=>({axes,buttons:Array.from({length:16},(_,i)=>({pressed:buttons.includes(i)}))});
test('controller movement rejects drift, arbitrates diagonals and repeats by elapsed time',()=>{
 const input=new GamepadInput();assert.deepEqual(input.sample(pad([.2,.1]),0),[]);
 assert.deepEqual(input.sample(pad([.9,.7]),1),[{type:'move',direction:'right'}]);
 assert.deepEqual(input.sample(pad([.9,.7]),200),[]);
 assert.deepEqual(input.sample(pad([.9,.7]),231),[{type:'move',direction:'right'}]);
 assert.deepEqual(input.sample(pad([0,-1]),232),[{type:'move',direction:'up'}]);
});
test('buttons and targeting are edge-triggered and disconnect clears held input',()=>{
 const input=new GamepadInput();assert.deepEqual(input.sample(pad([0,0,1],[0,6]),0),[{type:'swap'},{type:'overdrive'},{type:'target',direction:1}]);
 assert.deepEqual(input.sample(pad([0,0,1],[0,6]),1),[]);input.sample(null,2);
 assert.equal(input.sample(pad([0,0,0],[0]),3)[0].type,'swap');
});
