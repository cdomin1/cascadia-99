import {TUTORIALS} from './tutorials.mjs';
// Decode only the selected animation while Help is visible. GIFs bake in flashes,
// so reduced flashing uses the same still-frame fallback as reduced motion.
export function createTutorialGallery(dialog,{reducedMotion,flashing=()=> 'full'}={}){
 const gallery=dialog.querySelector('#tutorial-gallery');
 const label=document.createElement('label');label.textContent='WATCH A DEMONSTRATION';label.htmlFor='tutorial-topic';
 const select=document.createElement('select');select.id='tutorial-topic';
 for(const group of ['Modes','Mechanics','Flux']){
  const options=document.createElement('optgroup');options.label=group;
  for(const tutorial of TUTORIALS.filter(t=>t.group===group)){const option=document.createElement('option');option.value=tutorial.id;option.textContent=tutorial.title;options.append(option)}select.append(options);
 }
 const image=document.createElement('img');image.id='tutorial-image';image.width=384;image.height=216;image.decoding='async';image.setAttribute('aria-describedby','tutorial-caption');
 const caption=document.createElement('p');caption.id='tutorial-caption';caption.setAttribute('aria-live','polite');
 const pause=document.createElement('button');pause.type='button';pause.id='tutorial-pause';pause.className='quiet';
 let paused=false;
 function refresh(){
  const tutorial=TUTORIALS.find(t=>t.id===select.value);
  const reduced=!!reducedMotion?.matches||flashing()==='reduced';
  const still=!dialog.open||paused||reduced;
  image.src=`/demo/tutorials/${tutorial.id}.${still?'png':'gif'}?v=2`;image.alt=`${tutorial.title} gameplay demonstration`;
  caption.textContent=tutorial.description;
  pause.disabled=reduced;pause.textContent=reduced?'Reduced effects: still frame':paused?'Play animation':'Pause animation';pause.setAttribute('aria-pressed',String(paused||reduced));
 }
 select.addEventListener('change',()=>{paused=false;refresh()});pause.addEventListener('click',()=>{paused=!paused;refresh()});
 reducedMotion?.addEventListener('change',refresh);dialog.addEventListener('close',refresh);
 gallery.append(label,select,image,pause,caption);refresh();
 return {refresh};
}
