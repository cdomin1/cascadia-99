import test from 'node:test';
import assert from 'node:assert/strict';
import {PersonalRecords} from '../records.mjs';
test('personal records persist and improve without lowering earlier bests',()=>{
  const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  const records=new PersonalRecords(storage);records.observe(300,3);records.observe(200,2);records.finish(true);records.finish(false);
  assert.deepEqual(new PersonalRecords(storage).data,{score:300,chain:3,wins:1,matches:2});
});
test('corrupt or inaccessible browser storage does not interrupt play',()=>{
  const records=new PersonalRecords({getItem:()=>'{bad',setItem:()=>{throw Error('disabled');}});records.observe(50,2);records.finish(true);assert.equal(records.data.wins,1);
  const invalid=new PersonalRecords({getItem:()=>'{"score":-1,"wins":"many","chain":3}'});assert.equal(invalid.data.score,0);assert.equal(invalid.data.wins,0);assert.equal(invalid.data.chain,3);
});
