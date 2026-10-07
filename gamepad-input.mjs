// Standard mapping positions, not printed controller letters.
export class GamepadInput {
  constructor(){this.buttons=[];this.direction='';this.repeatAt=0;this.target=0;}
  reset(){this.buttons=[];this.direction='';this.repeatAt=0;this.target=0;}
  sample(pad,now){
    if(!pad){this.reset();return [];}
    const result=[],pressed=pad.buttons.map(b=>b.pressed);
    const edge=n=>pressed[n]&&!this.buttons[n];
    const x=(pressed[15]?1:0)-(pressed[14]?1:0)||(Math.abs(pad.axes[0]||0)>.45?pad.axes[0]:0);
    const y=(pressed[13]?1:0)-(pressed[12]?1:0)||(Math.abs(pad.axes[1]||0)>.45?pad.axes[1]:0);
    const direction=Math.max(Math.abs(x),Math.abs(y))<.45?'':Math.abs(x)>=Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');
    if(direction&&(direction!==this.direction||now>=this.repeatAt)){
      result.push({type:'move',direction});this.repeatAt=now+(direction!==this.direction?230:75);
    }
    this.direction=direction;
    for(const [button,action]of [[0,'swap'],[2,'pulse'],[3,'shift'],[4,'surge'],[6,'overdrive'],[9,'pause'],[1,'back'],[11,'strategy']])if(edge(button))result.push({type:action});
    if(pressed[5]!==!!this.buttons[5])result.push({type:'boost',active:pressed[5]});
    const target=Math.abs(pad.axes[2]||0)>.65?Math.sign(pad.axes[2]):0;
    if(target&&target!==this.target)result.push({type:'target',direction:target});
    this.target=target;this.buttons=pressed;return result;
  }
}
