import test from 'node:test';
import assert from 'node:assert/strict';
import {Board} from '../engine.mjs';
import {assignTeam,opponents,startError,matchOutcome,pulseTarget,usePulse} from '../match-rules.mjs';
function fixture(){const room={mode:'teams',players:new Map()};for(let n=0;n<4;n++){const player={id:String(n),name:`P${n}`,board:new Board()};assignTeam(room,player);room.players.set(player.id,player);}return room;}
test('mode capacity and exact player counts are enforced',()=>{
  const room=fixture();assert.equal(startError(room),null);room.players.delete('3');assert.match(startError(room),/exactly 4/);
  room.mode='duel';assert.match(startError(room),/exactly 2/);room.players.delete('2');assert.equal(startError(room),null);
  room.mode='quad';assert.match(startError(room),/exactly 4/);room.mode='battle';assert.equal(startError(room),null);
});
test('balanced teams exclude teammates from all attack candidates',()=>{
  const room=fixture(),[a,b,c,d]=room.players.values();assert.equal(a.team,c.team);assert.equal(b.team,d.team);assert.notEqual(a.team,b.team);
  assert.deepEqual(opponents(a,room).map(p=>p.id),[b.id,d.id]);b.board.dead=true;assert.deepEqual(opponents(a,room).map(p=>p.id),[d.id]);
  room.mode='quad';assert.ok(opponents(a,room).includes(c));
});
test('team wins include an eliminated teammate and finish with two survivors',()=>{
  const room=fixture(),[a,b,c,d]=room.players.values();assert.equal(matchOutcome(room).finished,false);
  b.board.dead=d.board.dead=true;let outcome=matchOutcome(room);assert.equal(outcome.finished,true);assert.equal(outcome.alive.length,2);assert.deepEqual(outcome.winnerIds,[a.id,c.id]);
  c.board.dead=true;outcome=matchOutcome(room);assert.deepEqual(outcome.winnerIds,[a.id,c.id]);
  a.board.dead=true;assert.deepEqual(matchOutcome(room).winnerIds,[]);
});
test('FFA still requires one survivor even when players have prior teams',()=>{
  const room=fixture();room.mode='quad';const [a,b,c,d]=room.players.values();b.board.dead=d.board.dead=true;assert.equal(matchOutcome(room).finished,false);c.board.dead=true;assert.deepEqual(matchOutcome(room).winnerIds,[a.id]);
});
test('Pulse clears six queued cells, costs 35 Flux, and cannot be spammed',()=>{
  const room=fixture(),player=room.players.get('0');player.board.receive(4);player.board.receive(5);player.board.flux=34;assert.equal(usePulse(player,room),null);
  player.board.flux=35;assert.equal(usePulse(player,room).cancelled,6);assert.equal(player.board.flux,0);assert.deepEqual(player.board.incoming.map(a=>a.amount),[3]);assert.equal(usePulse(player,room),null);
});
test('Pulse rescues only a living teammate after defending its own board',()=>{
  const room=fixture(),[a,b,c]=room.players.values();a.board.charge=100;b.board.receive(20);c.board.receive(4);
  assert.equal(pulseTarget(a,room),c);assert.equal(usePulse(a,room).cancelled,4);assert.equal(b.board.incoming[0].amount,20);assert.equal(c.board.incoming.length,0);
  a.board.abilityCooldown=0;a.board.charge=100;assert.equal(usePulse(a,room),null);assert.equal(a.board.charge,100);
  a.board.receive(2);c.board.receive(3);assert.equal(pulseTarget(a,room),a);usePulse(a,room);assert.equal(c.board.incoming[0].amount,3);
  c.board.dead=true;assert.equal(pulseTarget(a,room),a);room.mode='quad';assert.equal(pulseTarget(a,room),a);
});
test('real clears generate Flux and track the best chain while sending combo and chain attacks',()=>{
  const board=new Board(()=>.5);board.grid=board.grid.map(row=>row.map(()=>0));board.grid[11]=[1,1,1,1,2,3];board.resolve();board.chain=3;board.tick(.5,0);
  assert.equal(board.flux,18);assert.equal(board.bestChain,3);assert.equal(board.events[0].attack,15);board.flux=98;board.chain=0;board.grid[11]=[1,1,1,1,2,3];board.resolve();board.tick(.5,0);assert.equal(board.charge,100);assert.equal(board.bestChain,3);
});
