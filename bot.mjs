import {Board,COLS,ROWS} from './engine.mjs';

export const DIFFICULTIES={
  easy:{step:.32,think:.8,mistake:.28},
  normal:{step:.13,think:.35,mistake:.09},
  hard:{step:.07,think:.18,mistake:.02}
};

function trialBoard(board){
  const trial=Object.create(Board.prototype);
  trial.grid=board.grid.map(row=>[...row]);
  trial.garbageBlocks=board.garbageBlocks.map(block=>({...block}));
  return trial;
}
function potential(grid){
  let score=0;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const c=grid[y][x];if(!c||c===6)continue;
    if(x+1<COLS&&grid[y][x+1]===c)score+=2;
    if(y+1<ROWS&&grid[y+1][x]===c)score+=2;
    if(x+2<COLS&&grid[y][x+2]===c)score++;
    if(y+2<ROWS&&grid[y+2][x]===c)score++;
  }
  return score;
}

// Evaluate legal swaps against the actual board. Bots use the same cursor,
// swap, gravity, scoring, and garbage rules as humans.
export function chooseSwap(board,difficulty='normal',random=Math.random){
  const options=[],settings=DIFFICULTIES[difficulty]||DIFFICULTIES.normal;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS-1;x++){
    const a=board.grid[y][x],b=board.grid[y][x+1];
    if(a===6||b===6||a===b)continue;
    const trial=trialBoard(board);
    [trial.grid[y][x],trial.grid[y][x+1]]=[b,a];
    let matches=trial.findMatches();
    if(!matches.length){trial.gravity();matches=trial.findMatches();}
    let score=matches.length*100;
    if(matches.length){
      for(const p of matches){const my=Math.floor(p/COLS),mx=p%COLS;if(my<4)score+=25;for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(trial.grid[my+dy]?.[mx+dx]===6)score+=40;trial.grid[my][mx]=0;}
      trial.gravity();score+=trial.findMatches().length*75;
    }else score+=potential(trial.grid);
    score-=(Math.abs(board.cursor.x-x)+Math.abs(board.cursor.y-y))*.6;
    options.push({x,y,score});
  }
  if(!options.length)return null;
  if(random()<settings.mistake)return options[Math.floor(random()*options.length)];
  // A little noise keeps setup moves from getting stuck in a two-swap loop.
  return options.map(option=>({...option,score:option.score+random()*8})).sort((a,b)=>b.score-a.score)[0];
}

export class CpuController {
  constructor(difficulty='normal',random=Math.random){
    this.difficulty=DIFFICULTIES[difficulty]?difficulty:'normal';this.random=random;
    this.wait=random()*.7;this.plan=null;this.signature='';
  }
  tick(player,dt){
    const board=player.board,settings=DIFFICULTIES[this.difficulty];
    player.boost=false;
    if(board.dead||board.phase!=='idle'){this.plan=null;return;}
    const occupied=board.grid.flat().filter(Boolean).length;
    player.boost=occupied<24&&!board.incoming.length&&board.danger===0;
    this.wait-=dt;if(this.wait>0)return;
    const signature=board.grid.flat().join('');
    if(!this.plan||signature!==this.signature){
      this.plan=chooseSwap(board,this.difficulty,this.random);this.signature=signature;
      if(!this.plan){this.wait=settings.think;return;}
    }
    const {x,y}=this.plan;
    if(board.cursor.x!==x){board.move(Math.sign(x-board.cursor.x),0);this.wait=settings.step;}
    else if(board.cursor.y!==y){board.move(0,Math.sign(y-board.cursor.y));this.wait=settings.step;}
    else {board.swap();this.plan=null;this.wait=settings.think;}
  }
}
