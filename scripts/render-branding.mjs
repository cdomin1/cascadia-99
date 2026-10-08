import {readFile,writeFile} from 'node:fs/promises';
import {NEO} from '../neo-vector.mjs';
function wordmark(inline=false){let x=5,paths='';for(const char of 'VEXELON 99'){for(const points of NEO.font[char])paths+=`<polyline points="${points.map(([px,py])=>`${x+px*8},${10+py*8}`).join(' ')}"/>`;x+=68;}return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x+5} 84" ${inline?'class="pixel-wordmark" aria-hidden="true"':'role="img" aria-label="VEXELON 99"'} fill="none" stroke="${inline?'currentColor':'#ECFAFF'}" stroke-width="3" stroke-linejoin="miter">${paths}</svg>`;}
for(const path of ['logo.svg','godot/assets/logo.svg'])await writeFile(path,wordmark()+'\n');
const html=await readFile('index.html','utf8');await writeFile('index.html',html.replace(/<svg[^>]*class="pixel-wordmark"[\s\S]*?<\/svg>/,wordmark(true)));
