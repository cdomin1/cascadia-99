import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('title offers direct match setup, canonical styles ignore saved theme state and settings retain accessibility/audio',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8'),css=await readFile(new URL('../style.css',import.meta.url),'utf8'),app=await readFile(new URL('../app.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(html,/id="(?:theme|palette|homepage-demo|effects-settings)"|theme\.js|palettes\.js/);assert.doesNotMatch(css,/\[data-theme|\[data-palette/);
 for(const id of ['quick-mode','play-cpu','create','join-form','online-options','pause-dialog','practice-tools','track','volume-music','volume-sfx','reduced-motion','flashing-effects','effect-quality','screen-shake','target-strategy'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(app,/id=liveId/);assert.match(app,/storage\?\.removeItem\(key\)/);
});
test('native gameplay background and settings have no selectable palettes or graph-paper grid',async()=>{
 const main=await readFile(new URL('../godot/scripts/main.gd',import.meta.url),'utf8');assert.doesNotMatch(main,/PALETTE_IDS|light_mode|COLOR PALETTE|LIGHT MODE|palettes\.json/);assert.match(main,/func cycle_strategy/);assert.match(main,/func refresh_training_hud/);
 const draw=main.slice(main.indexOf('func _draw()'),main.indexOf('func label('));assert.doesNotMatch(draw,/draw_line|range\(/);assert.match(draw,/neo.colors.background/);
});
test('official Kode Mono font is identical and licensed in both clients, with local routes and cache',async()=>{
 const font=await readFile(new URL('../fonts/kode-mono/KodeMono-Variable.ttf',import.meta.url));assert.ok(font.length>50000);assert.deepEqual(font,await readFile(new URL('../godot/assets/fonts/kode-mono/KodeMono-Variable.ttf',import.meta.url)));
 const license=await readFile(new URL('../fonts/kode-mono/OFL.txt',import.meta.url),'utf8');assert.match(license,/SIL OPEN FONT LICENSE/);
 for(const path of ['server.mjs','service-worker.js','style.css'])assert.match(await readFile(new URL('../'+path,import.meta.url),'utf8'),/fonts\/kode-mono\/KodeMono-Variable\.ttf/);
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');assert.doesNotMatch(html,/id="(?:play-menu|mode-menu|online-menu|setup-back)"/);assert.match(html,/PLAY CPUs/);
});
