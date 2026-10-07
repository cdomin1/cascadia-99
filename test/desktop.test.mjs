import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {serverAddress} from '../desktop/address.mjs';
import {createGameServer} from '../server.mjs';
test('desktop server gets its own free port and closes cleanly',async t=>{
  const a=createGameServer({port:0,host:'127.0.0.1',desktop:true});
  const b=createGameServer({port:0,host:'127.0.0.1',desktop:true});
  t.after(async()=>{await a.close();await b.close();});
  const [one,two]=await Promise.all([a.listen(),b.listen()]);assert.notEqual(one,two);
  const info=await fetch(one+'/api/info').then(r=>r.json());assert.equal(info.desktop,true);assert.ok(Array.isArray(info.addresses));
  const page=await fetch(one);assert.match(page.headers.get('content-security-policy'),/script-src 'self'/);assert.match(await page.text(),/Play CPUs/i);
  const css=await fetch(one+'/style.css').then(r=>r.text());assert.doesNotMatch(css,/https?:\/\//);
});
test('desktop accepts game origins and rejects paths and unsafe URLs',()=>{
  assert.equal(serverAddress('http://192.168.1.20:3000/'),'http://192.168.1.20:3000');
  assert.equal(serverAddress('https://game.example/'),'https://game.example');
  for(const url of ['file:///tmp/game','javascript:alert(1)','https://user:password@example.com','https://game.example/path','https://game.example/?x=1','https://game.example/#x','not a url'])assert.throws(()=>serverAddress(url));
});
test('desktop build includes every runtime module and assets',async()=>{
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  for(const file of ['desktop/main.mjs','desktop/address.mjs','desktop/preload.cjs','desktop/assets/icon.png','bot.mjs','sound.mjs','server.mjs','engine.mjs','index.html','app.mjs','style.css'])assert.ok(pkg.build.files.includes(file),`Missing ${file}`);
  assert.deepEqual(pkg.build.linux.target,['AppImage','tar.gz']);assert.deepEqual(pkg.build.mac.target,['dmg','zip']);assert.deepEqual(pkg.build.win.target,['nsis','portable']);
});
