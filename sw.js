const CACHE='study-shell-2fa3f1d3e4a5';const ASSETS=["./", "./index.html", "./loader.js", "./home.js", "./pdf-library.js", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./mock.template.json", "./practice.template.json", "./전산_모의고사.html", "./필기후기_분석보고서.html", "./필기후기_연습시험.html", "./학습자료_색인.html"];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('study-shell-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith((async()=>{const cached=await (await caches.open(CACHE)).match(event.request,{ignoreSearch:true});return cached||fetch(event.request);})());});

