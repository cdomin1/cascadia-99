import {GamepadInput} from './gamepad-input.mjs';
export function browserGamepad({canPlay,send,ability,target,pause,strategy=()=>{},onMethod=()=>{}}){
  const input=new GamepadInput();let connected=false;
  function tick(now){
    const pad=Array.from(navigator.getGamepads?.()||[]).find(p=>p?.mapping==='standard');
    if(connected&&!pad){send({type:'boost',active:false});onMethod('keyboard');}
    connected=!!pad;
    for(const action of input.sample(pad,now)){
      if(action.type!=='move'||Math.max(...pad.axes.map(Math.abs))>.65||pad.buttons.slice(12,16).some(b=>b.pressed))onMethod('gamepad');
      const modal=document.querySelector('dialog[open]');
      if(action.type==='pause'){pause();continue;}
      if(action.type==='back'&&modal){modal.close();continue;}
      if(canPlay()&&!modal){
        if(action.type==='move'){const [dx,dy]={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[action.direction];send({type:'move',dx,dy});}
        if(action.type==='swap'||action.type==='boost')send(action);
        if(['pulse','shift','surge','overdrive'].includes(action.type))ability(action.type);
        if(action.type==='target')target(action.direction);if(action.type==='strategy')strategy();
      }else{
        const root=modal||document;
        const controls=Array.from(root.querySelectorAll('button,input,select,summary')).filter(el=>!el.disabled&&el.getClientRects().length);
        let i=controls.indexOf(document.activeElement);
        if(action.type==='move'){
          const active=document.activeElement,d=action.direction==='up'||action.direction==='left'?-1:1;
          if(active?.type==='range'&&['left','right'].includes(action.direction)){active.value=String(Math.max(Number(active.min),Math.min(Number(active.max),Number(active.value)+d*Number(active.step||1))));active.dispatchEvent(new Event('input'));}
          else if(active?.tagName==='SELECT'&&['left','right'].includes(action.direction)){active.selectedIndex=Math.max(0,Math.min(active.options.length-1,active.selectedIndex+d));active.dispatchEvent(new Event('change'));}
          else controls[(i+d+controls.length)%controls.length]?.focus();
        }
        if(action.type==='swap')document.activeElement?.click();
      }
    }
  }
  return {tick};
}
