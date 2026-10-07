// Offline onboarding shell only. Competitive rooms still require their server.
const VERSION='vexelon-home-kode-1';
const CORE=['/','/style.css','/app.mjs','/logo.svg','/favicon.svg','/fonts/kode-mono/KodeMono-Variable.ttf',...['sound','music','visuals','match-rules','records','flux-config','presentation-effects','targeting-vfx','targeting-web','tutorials','help-tutorials','neo-vector','vector-geometry','gamepad-input','gamepad-web','battle-intro','training-session','engine','abilities'].map(name=>`/${name}.mjs`)];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('vexelon-neovector-')||k.startsWith('vexelon-home-kode-'))&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(event.request,copy));}return response;}).catch(async()=>await caches.match(event.request)||await caches.match(url.pathname)||Response.error()));
});
