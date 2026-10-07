import {FLUX} from '../flux-config.mjs';
import {recordMechanic} from './record-tutorials.mjs';
export const SHOWCASE_FPS=25;
export const SHOWCASE_CHAPTERS=[
 {id:'chains',seconds:8,title:'SWAP AND CHAIN',lines:['MATCH PANELS','CHARGE YOUR FLUX'],hint:'MATCHES AND CHAINS EARN FLUX'},
 {id:'garbage',seconds:8,title:'GLITCH BREAK',lines:['SEND GLITCH BLOCKS','MAKE A COMEBACK'],hint:'SLABS RELEASE TILES BOTTOM UP'},
 {id:'pulse',seconds:4,title:'PULSE',lines:['CYAN SHOCKWAVE','CANCEL INCOMING'],hint:'BLOCK AN INCOMING ATTACK'},
 {id:'shift',seconds:3,title:'SHIFT',lines:['MAKE SOME ROOM','DROP THE STACK'],hint:'BOTTOM ROW OUT  NO FREE SCORE'},
 {id:'surge',seconds:4,title:'SURGE',lines:['POWER YOUR ATTACK','BUILD MORE FLUX'],hint:`ATTACK AND FLUX BOOST FOR ${FLUX.surge.duration}S`},
 {id:'overdrive',seconds:6,title:'OVERDRIVE',lines:['HOLD FULL CHARGE','UNLEASH THE BURST'],hint:`HOLD FULL ${FLUX.overdrive.hold}S  BOOST FOR ${FLUX.overdrive.duration}S`}
];
export function buildShowcase(){
 const frames=[];
 for(const [chapterIndex,chapter]of SHOWCASE_CHAPTERS.entries()){
  const clip=recordMechanic(chapter.id,{fps:SHOWCASE_FPS}).slice(0,chapter.seconds*SHOWCASE_FPS);
  for(const frame of clip)frames.push({...frame,chapterIndex,chapter,globalNow:frames.length*1000/SHOWCASE_FPS});
 }
 return frames;
}
