import {readFile,writeFile} from 'node:fs/promises';
import {RETRO} from '../presentation-effects.mjs';
function pixels(text,x=0){let d='';for(const c of text){RETRO.font[c].forEach((row,y)=>[...row].forEach((p,i)=>{if(p==='1')d+=`M${x+i} ${y}h1v1h-1z`;}));x+=6;}return d;}
const letters=pixels('VEXELON'),digits=pixels('99',48);
const svg=(inline=false)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 7" ${inline?'class="pixel-wordmark" aria-hidden="true"':'role="img" aria-label="VEXELON 99"'} shape-rendering="crispEdges"><path fill="${inline?'currentColor':'#F8F9FA'}" d="${letters}"/><path ${inline?'class="logo-accent" ':''}fill="${inline?'#c9ef70':'#00E5A3'}" d="${digits}"/></svg>`;
await writeFile('logo.svg',svg()+'\n');await writeFile('godot/assets/logo.svg',svg()+'\n');
const html=await readFile('index.html','utf8');await writeFile('index.html',html.replace(/<svg[^>]*class="pixel-wordmark"[\s\S]*?<\/svg>/,svg(true)));
