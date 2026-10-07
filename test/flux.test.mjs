import test from 'node:test';
import assert from 'node:assert/strict';
import {Board,COLS,ROWS} from '../engine.mjs';
import {FLUX,clearFlux} from '../flux-config.mjs';
import {useAbility,abilityStatus,cpuAbility} from '../abilities.mjs';
import {assignTeam} from '../match-rules.mjs';
import {PresentationEffects} from '../presentation-effects.mjs';
const blank=(balance=FLUX)=>{const b=new Board(()=>.4,balance);b.grid=Array.from({length:ROWS},()=>Array(COLS).fill(0));return b;};
function fixture(mode='battle'){
  const room={mode,players:new Map()};
  for(let i=0;i<4;i++){const p={id:String(i),name:`P${i}`,board:blank()};assignTeam(room,p);room.players.set(p.id,p);}
  return {room,players:[...room.players.values()]};
}
test('every combo and chain tier, including combined rewards, is bounded and awarded once',()=>{
  for(const [count,reward]of [[3,2],[4,4],[5,7],[6,10],[9,10]])assert.equal(clearFlux(count,1),reward);
  for(const [chain,reward]of [[2,8],[3,14],[4,22],[5,30],[8,30]])assert.equal(clearFlux(3,chain),2+reward);
  const b=blank();b.grid[11]=[1,1,1,1,2,3];b.resolve();b.chain=3;b.tick(.5,0);
  assert.equal(b.flux,18);b.tick(.05,0);assert.equal(b.flux,18);assert.equal(b.events.filter(e=>e.type==='clear').length,1);
  b.flux=99;b.grid[11]=[2,2,2,2,2,2];b.phase='idle';b.chain=0;b.resolve();b.tick(.5,0);assert.equal(b.flux,100);
});
test('Pulse spends 35 once, prioritizes self, rescues only a living teammate, rejects empty queues',()=>{
  const {room,players:[a,b,c]}=fixture('teams');a.board.flux=100;c.board.receive(12);b.board.receive(10);
  assert.equal(useAbility(a,room,'pulse').target,c);assert.equal(a.board.flux,65);assert.equal(c.board.incoming[0].amount,6);
  assert.equal(useAbility(a,room,'pulse'),null);a.board.tickAbilities(.31);a.board.receive(2);
  assert.equal(useAbility(a,room,'pulse').target,a);assert.equal(a.board.flux,30);
  a.board.tickAbilities(.31);a.board.flux=35;c.board.dead=true;
  assert.equal(useAbility(a,room,'pulse'),null);assert.equal(a.board.flux,35);assert.equal(b.board.incoming[0].amount,10);
});
test('all ability costs reject insufficient Flux; dead players and unknown abilities cannot activate',()=>{
  const {room,players:[a]}=fixture();a.board.receive(10);
  for(const kind of ['pulse','shift','surge','overdrive']){a.board.flux=FLUX[kind].cost-1;assert.equal(useAbility(a,room,kind),null);}
  for(const kind of ['__proto__','constructor','bogus'])assert.equal(useAbility(a,room,kind),null);
  a.board.flux=100;a.board.maxFluxHeld=3;a.board.dead=true;
  for(const kind of ['pulse','shift','surge','overdrive'])assert.equal(useAbility(a,room,kind),null);
});
test('Shift crops slabs crossing the bottom, deletes removed slabs, and grants no rewards or attacks',()=>{
  for(const width of [3,4,5,6])for(const height of [1,2,3]){
    const {room,players:[a]}=fixture(),b=a.board;b.flux=60;
    b.garbageBlocks=[{id:1,x:0,y:ROWS-height,width,height,state:'solid'}];
    for(let y=ROWS-height;y<ROWS;y++)for(let x=0;x<width;x++)b.grid[y][x]=6;
    b.grid[8][5]=2;b.rise=.7;b.danger=1.5;b.cursor.y=10;
    assert.ok(useAbility(a,room,'shift'));assert.equal(b.flux,0);assert.equal(b.score,0);assert.equal(b.chain,0);assert.deepEqual(b.events,[]);
    assert.equal(b.grid[9][5],2);assert.equal(b.cursor.y,11);assert.equal(b.rise,0);assert.equal(b.danger,0);
    assert.equal(b.grid.flat().filter(v=>v===6).length,width*(height-1));
    assert.equal(b.garbageBlocks.length,height>1?1:0);
    if(height>1){assert.equal(b.garbageBlocks[0].height,height-1);assert.equal(b.garbageBlocks[0].y,ROWS-height+1);}
  }
});
test('Shift rejects clears, falls, chain grace, and breaking slabs without spending Flux',()=>{
  const {room,players:[a]}=fixture();a.board.flux=60;
  for(const phase of ['clear','fall','grace']){a.board.phase=phase;assert.equal(useAbility(a,room,'shift'),null);assert.equal(a.board.flux,60);}
  a.board.phase='idle';a.board.garbageBlocks=[{state:'breaking'}];assert.equal(useAbility(a,room,'shift'),null);
});
test('Surge boosts outgoing and cancelled attacks and Flux; server timers expire during clears',()=>{
  const {room,players:[a]}=fixture(),b=a.board;b.flux=75;assert.ok(useAbility(a,room,'surge'));
  assert.equal(b.flux,0);assert.equal(b.abilityRemaining,8);
  b.grid[11]=[1,1,1,1,1,1];b.resolve();b.chain=3;b.receive(5);b.tick(.5,0);
  assert.ok(Math.abs(b.flux-(10+14)*1.2)<1e-8);
  assert.equal(b.events.find(e=>e.type==='clear').attack,Math.round(17*1.35)-5);
  b.phase='clear';b.timer=100;b.tick(7.5,0);assert.equal(b.activeAbility,null);assert.equal(b.abilityRemaining,0);
});
test('Overdrive requires continuous full Flux for 3s, consumes all, and excludes Surge both ways',()=>{
  const {room,players:[a]}=fixture(),b=a.board;b.flux=100;b.tickAbilities(2.9);assert.equal(useAbility(a,room,'overdrive'),null);
  b.flux=99;b.tickAbilities(.1);assert.equal(b.maxFluxHeld,0);b.flux=100;b.tickAbilities(3);assert.ok(useAbility(a,room,'overdrive'));
  assert.equal(b.flux,0);assert.equal(b.abilityRemaining,10);b.flux=100;b.tickAbilities(3);
  assert.equal(useAbility(a,room,'surge'),null);assert.equal(useAbility(a,room,'overdrive'),null);
  b.tickAbilities(7);assert.equal(b.activeAbility,null);assert.ok(useAbility(a,room,'surge'));
  b.flux=100;b.tickAbilities(3);assert.equal(useAbility(a,room,'overdrive'),null);
});
test('Overdrive modifiers affect natural rise and chain grace, never manual boost',()=>{
  const normal=blank(),over=blank();over.activeAbility='overdrive';over.abilityRemaining=10;
  normal.tick(.1,.2);over.tick(.1,.2);assert.ok(Math.abs(over.rise-normal.rise*1.15)<1e-9);
  normal.rise=over.rise=0;normal.tick(.1,.2,true);over.tick(.1,.2,true);assert.equal(over.rise,normal.rise);
  normal.chain=over.chain=2;normal.resolve();over.resolve();assert.equal(over.timer,normal.timer+.12);
  over.grid[11]=[1,1,2,1,0,0];over.cursor={x:2,y:11};assert.equal(over.swap(),true);assert.equal(over.chain,3);
  over.tick(.5,0);assert.equal(over.flux,(2+14)*1.25);assert.equal(over.events[0].attack,Math.round(12*1.5));
});
test('CPUs choose legal defense, Shift, Surge, and mature Overdrive through shared rules',()=>{
  const {room,players:[a]}=fixture();const b=a.board;b.flux=100;b.receive(6,1);assert.equal(cpuAbility(a,room),'pulse');useAbility(a,room,'pulse');
  b.tickAbilities(.31);b.flux=60;b.grid[2][0]=1;assert.equal(cpuAbility(a,room),'shift');useAbility(a,room,'shift');
  b.tickAbilities(.31);b.flux=80;b.grid[3][0]=0;b.grid[6][0]=1;b.chain=2;assert.equal(cpuAbility(a,room),'surge');useAbility(a,room,'surge');
  b.tickAbilities(8);b.flux=100;b.tickAbilities(3);assert.equal(cpuAbility(a,room),'overdrive');
});
test('balancing is injected into authoritative boards instead of hardcoded in abilities',()=>{
  const config=structuredClone(FLUX);config.pulse.cost=10;config.pulse.rows=2;config.combo[3]=5;
  const {room,players:[a]}=fixture();a.board=blank(config);a.board.flux=10;a.board.receive(20);
  assert.equal(useAbility(a,room,'pulse').cancelled,12);assert.equal(a.board.flux,0);
  a.board.grid[11]=[1,1,1,0,0,0];a.board.resolve();a.board.tick(.5,0);assert.equal(a.board.flux,5);
});
test('effects settings govern shake, flashes, and local hit-stop without modifying gameplay',()=>{
  const fx=new PresentationEffects();fx.trigger('overdrive',100);
  assert.ok(fx.hitStopUntil>100);assert.notDeepEqual(fx.offset(120,true),{x:0,y:0});
  fx.configure({shake:'off'});assert.deepEqual(fx.offset(120,true),{x:0,y:0});
  const strengths=[];for(const shake of ['reduced','normal','maximum']){fx.configure({shake});strengths.push(Math.abs(fx.offset(120,true).y));}assert.ok(strengths[0]<strengths[1]&&strengths[1]<strengths[2]);
  fx.reset();fx.configure({flashing:'reduced'});fx.trigger('overdrive',100);assert.equal(fx.hitStopUntil,0);assert.equal(fx.flashes.length,0);
  fx.reset();fx.configure({reducedMotion:true});fx.trigger('pulse',100);assert.equal(fx.waves.length,0);assert.deepEqual(fx.offset(120),{x:0,y:0});
});
