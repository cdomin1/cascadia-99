import {FLUX,clearFlux} from './flux-config.mjs';
export const COLS = 6, ROWS = 12, TILE_COUNT = 4;
export class Board {
  constructor(random = Math.random, balance = FLUX) {
    this.random = random; this.grid = Array.from({length:ROWS},()=>Array(COLS).fill(0));
    this.cursor = {x:2,y:9}; this.rise = 0; this.phase = 'idle'; this.timer = 0;
    this.matches = []; this.chain = 0; this.score = 0; this.dead = false; this.danger = 0;
    this.events = []; this.incoming = []; this.totalCleared = 0; this.flux=0;this.balance=balance;this.maxFluxHeld=0;this.activeAbility=null;this.abilityRemaining=0;this.abilityCooldown=0; this.bestChain=0;
    this.garbageBlocks=[];this.nextBlockId=1;this.falls=[];this.fallSerial=0;
    for(let y=7;y<ROWS;y++) for(let x=0;x<COLS;x++) this.grid[y][x]=this.color(y,x);
  }
  // Legacy snapshots used charge for Pulse. It is now a read-only wire alias of Flux.
  get charge(){return this.flux;}
  set charge(value){this.flux=Math.max(0,Math.min(this.balance.max,value));}
  tickAbilities(dt){
    this.abilityCooldown=Math.max(0,this.abilityCooldown-dt);
    if(this.activeAbility){
      this.abilityRemaining=Math.max(0,this.abilityRemaining-dt);
      if(this.abilityRemaining<=1e-8){this.abilityRemaining=0;this.activeAbility=null;}
    }
    this.maxFluxHeld=this.flux>=this.balance.max?Math.min(this.balance.overdrive.hold,this.maxFluxHeld+dt):0;
  }
  get modifiers(){return this.activeAbility?this.balance[this.activeAbility]:{};}
  canShift(){return this.phase==='idle'&&!this.garbageBlocks.some(b=>b.state==='breaking');}
  shiftDown(){
    // Crop the removed row, then translate every surviving cell and slab together.
    this.grid.pop();this.grid.unshift(Array(COLS).fill(0));
    for(const block of this.garbageBlocks){block.y++;block.height=Math.min(block.height,ROWS-block.y);}
    this.garbageBlocks=this.garbageBlocks.filter(b=>b.height>0);
    this.cursor.y=Math.min(ROWS-1,this.cursor.y+1);
    this.rise=0;this.danger=0;this.chain=0;this.matches=[];this.falls=[];this.fallSerial++;
  }
  color(y,x) {
    let choices=[1,2,3,4].filter(c=>!(x>=2&&this.grid[y][x-1]===c&&this.grid[y][x-2]===c)&&!(y>=2&&this.grid[y-1][x]===c&&this.grid[y-2][x]===c));
    return choices[Math.floor(this.random()*choices.length)];
  }
  move(dx,dy) {this.cursor.x=Math.max(0,Math.min(4,this.cursor.x+dx));this.cursor.y=Math.max(0,Math.min(11,this.cursor.y+dy));}
  swap() {
    if(this.dead||!['idle','grace'].includes(this.phase))return false;
    const {x,y}=this.cursor,a=this.grid[y][x],b=this.grid[y][x+1];
    if(a===6||b===6||(!a&&!b))return false;
    [this.grid[y][x],this.grid[y][x+1]]=[b,a];
    if(this.phase!=='grace')this.chain=0; this.resolve();return true;
  }
  findMatches() {
    const set=new Set();
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const c=this.grid[y][x];if(!c||c===6)continue;
      if(x<4&&this.grid[y][x+1]===c&&this.grid[y][x+2]===c){let k=x;while(k<COLS&&this.grid[y][k]===c)set.add(y*COLS+k++);}
      if(y<10&&this.grid[y+1][x]===c&&this.grid[y+2][x]===c){let k=y;while(k<ROWS&&this.grid[k][x]===c)set.add(k++*COLS+x);}
    }
    return [...set];
  }
  gravity() {
    let changed=false,moved=true;this.falls=[];
    const blocks=this.garbageBlocks||[];
    while(moved){
      moved=false;const grouped=new Set();
      for(const block of blocks)for(let y=block.y;y<block.y+block.height;y++)for(let x=block.x;x<block.x+block.width;x++)grouped.add(y*COLS+x);
      for(let x=0;x<COLS;x++)for(let y=ROWS-2;y>=0;y--)if(this.grid[y][x]&&!grouped.has(y*COLS+x)&&!this.grid[y+1][x]){
        let dest=y;while(dest+1<ROWS&&!this.grid[dest+1][x])dest++;
        const value=this.grid[y][x];this.grid[dest][x]=value;this.grid[y][x]=0;
        const previous=this.falls.find(move=>move.x===x&&move.to===y&&move.value===value);
        if(previous)previous.to=dest;else this.falls.push({x,from:y,to:dest,value});
        moved=changed=true;
      }
      for(const block of [...blocks].sort((a,b)=>(b.y+b.height)-(a.y+a.height))){
        let dest=block.y;
        while(dest+block.height<ROWS&&Array.from({length:block.width},(_,dx)=>this.grid[dest+block.height][block.x+dx]).every(c=>!c))dest++;
        if(dest===block.y)continue;
        for(let y=block.y;y<block.y+block.height;y++)for(let x=block.x;x<block.x+block.width;x++)this.grid[y][x]=0;
        for(let y=dest;y<dest+block.height;y++)for(let x=block.x;x<block.x+block.width;x++)this.grid[y][x]=6;
        block.y=dest;moved=changed=true;
      }
    }
    if(changed)this.fallSerial=(this.fallSerial||0)+1;
    return changed;
  }
  resolve() {
    this.matches=this.findMatches();
    if(this.matches.length){this.chain++;this.phase='clear';this.timer=.42;}
    else if(this.gravity()){this.phase='fall';this.timer=.16;}
    else if(this.chain>0&&this.phase!=='grace'){this.phase='grace';this.timer=this.balance.chainGrace+(this.modifiers.chainGrace||0);}
    else {this.phase='idle';this.chain=0;}
  }
  receive(amount, delay=4) {if(!this.dead)this.incoming.push({amount,delay});}
  cancel(amount) {
    while(amount>0&&this.incoming.length){const hit=Math.min(amount,this.incoming[0].amount);amount-=hit;this.incoming[0].amount-=hit;if(!this.incoming[0].amount)this.incoming.shift();}
    return amount;
  }
  dropGarbage(amount) {
    const dropped=[];
    while(amount>0){
      const width=Math.min(COLS,Math.max(3,amount)),height=amount>=COLS?Math.min(3,Math.floor(amount/COLS)):1;
      const options=[];
      for(let x=0;x<=COLS-width;x++){
        const tops=Array.from({length:width},(_,dx)=>{const top=this.grid.findIndex(row=>row[x+dx]);return top<0?ROWS:top;});
        options.push({x,y:Math.min(...tops)-height});
      }
      const lowest=Math.max(...options.map(option=>option.y)),choices=options.filter(option=>option.y===lowest);
      const {x,y}=choices[Math.floor(this.random()*choices.length)];
      if(y<0){this.dead=true;break;}
      const block={id:this.nextBlockId++,x,y,width,height,state:'solid'};
      for(let dy=0;dy<height;dy++)for(let dx=0;dx<width;dx++)this.grid[y+dy][x+dx]=6;
      this.garbageBlocks.push(block);dropped.push({...block});amount-=width*height;
    }
    if(dropped.length)this.events.push({type:'garbage',blocks:dropped});
  }
  advanceBreaking(dt){
    let converted=false;
    for(const block of this.garbageBlocks){
      if(block.state!=='breaking')continue;
      block.breakTimer-=dt;if(block.breakTimer>0)continue;
      const y=block.y+block.height-1,positions=[];
      for(let x=block.x;x<block.x+block.width;x++){this.grid[y][x]=1+Math.floor(this.random()*TILE_COUNT);positions.push(y*COLS+x);}
      block.height--;block.breakTimer=.18;converted=true;this.events.push({type:'convert',positions});
    }
    this.garbageBlocks=this.garbageBlocks.filter(block=>block.height>0);
    return converted;
  }
  tick(dt,speed=.055,boost=false) {
    this.tickAbilities(dt);
    if(this.dead)return;
    const converted=this.advanceBreaking(dt);
    if(converted&&this.phase==='idle')this.resolve();
    if(this.phase!=='idle'){
      this.timer-=dt;
      if(this.timer<=0){
        if(this.phase==='clear'){
          const count=this.matches.length;this.totalCleared+=count;this.score+=count*10*this.chain;
          this.bestChain=Math.max(this.bestChain,this.chain);this.flux=Math.min(this.balance.max,this.flux+clearFlux(count,this.chain,this.balance)*(this.modifiers.generation||1));
          const adjacent=new Set();
          for(const p of this.matches){const y=Math.floor(p/COLS),x=p%COLS;this.grid[y][x]=0;for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(this.grid[y+dy]?.[x+dx]===6)adjacent.add((y+dy)*COLS+x+dx);}
          // Connected garbage converts when a neighboring match breaks it.
          const queue=[...adjacent];for(let i=0;i<queue.length;i++){const p=queue[i],y=Math.floor(p/COLS),x=p%COLS;for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const q=(y+dy)*COLS+x+dx;if(x+dx>=0&&x+dx<COLS&&this.grid[y+dy]?.[x+dx]===6&&!adjacent.has(q)){adjacent.add(q);queue.push(q);}}}
          const grouped=new Set(),breaking=[];
          for(const block of this.garbageBlocks){
            let hit=false;for(let y=block.y;y<block.y+block.height;y++)for(let x=block.x;x<block.x+block.width;x++){const p=y*COLS+x;grouped.add(p);if(adjacent.has(p))hit=true;}
            if(hit&&block.state!=='breaking'){block.state='breaking';block.breakTimer=.38;breaking.push({...block});}
          }
          for(const p of adjacent)if(!grouped.has(p))this.grid[Math.floor(p/COLS)][p%COLS]=1+Math.floor(this.random()*TILE_COUNT);
          const attack=(count>3?count-1:0)+(this.chain>1?(this.chain-1)*6:0);
          this.events.push({type:'clear',count,chain:this.chain,attack:this.cancel(Math.round(attack*(this.modifiers.attack||1))),positions:[...this.matches]});
          if(breaking.length)this.events.push({type:'break',blocks:breaking});
          this.matches=[];this.gravity();this.phase='fall';this.timer=.2;
        }else this.resolve();
      }
      return;
    }
    for(const attack of this.incoming)attack.delay-=dt;
    while(this.incoming.length&&this.incoming[0].delay<=0)this.dropGarbage(this.incoming.shift().amount);
    const high=this.grid[0].some(Boolean);
    this.danger=high?this.danger+dt:0;if(this.danger>2){this.dead=true;return;}
    this.rise+=dt*(boost?1.4:speed*(this.modifiers.rise||1));
    if(this.rise>=1){
      if(high){this.danger+=dt;this.rise=1;return;}
      this.rise-=1;this.grid.shift();this.grid.push(Array(COLS).fill(0));
      for(const block of this.garbageBlocks)block.y--;
      for(let x=0;x<COLS;x++)this.grid[ROWS-1][x]=this.color(ROWS-1,x);
      this.cursor.y=Math.max(0,this.cursor.y-1);this.resolve();
    }
  }
}
