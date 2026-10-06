// Run against a packaged app launched with --remote-debugging-port=9339.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const pages=await fetch('http://127.0.0.1:9339/json').then(response=>response.json());
const page=pages.find(page=>page.type==='page'&&page.url.startsWith('http://127.0.0.1:'));
assert.ok(page,'Packaged game page is available');
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
let next=1;const pending=new Map();
ws.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(!msg.id)return;const request=pending.get(msg.id);pending.delete(msg.id);if(msg.error)request.reject(new Error(msg.error.message));else request.resolve(msg.result);});
function call(method,params={}){return new Promise((resolve,reject)=>{const id=next++;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});}
const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
async function waitFor(expression){const deadline=Date.now()+12000;while(Date.now()<deadline){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error(`Timed out: ${expression}`);}
try{
  assert.equal(await evaluate("typeof process==='undefined' && typeof require==='undefined'"),true);
  assert.equal((await fetch(page.url+'api/info').then(response=>response.json())).desktop,true);
  await waitFor("!document.getElementById('play-cpu').disabled");
  await evaluate("document.getElementById('name').value='Packaged app'; document.getElementById('quick-count').value='98'; document.getElementById('play-cpu').click();");
  await waitFor("document.getElementById('rivals').children.length===98");
  await waitFor("document.getElementById('board-overlay').hidden");
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
  await new Promise(resolve=>setTimeout(resolve,2000));
  assert.equal(await evaluate("document.getElementById('connection').textContent"),'Connected');
  const sound=await evaluate("import('/sound.mjs').then(({effects})=>({status:effects.status,played:effects.played,enabled:effects.enabled}))");
  assert.equal(sound.status,'running');assert.equal(sound.enabled,true);assert.ok(sound.played>0);
  const screenshot=await call('Page.captureScreenshot',{format:'png'});await mkdir('.desktop-smoke',{recursive:true});await writeFile('.desktop-smoke/packaged-99-battle.png',Buffer.from(screenshot.data,'base64'));
  console.log('PACKAGED_SMOKE_OK: bundled server, isolated renderer, 98 CPU opponents, sound effects, and keyboard input');
}finally{ws.close();}
