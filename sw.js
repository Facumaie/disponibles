// Service worker DISPONIBLES DPEM — cachea la app para abrir rápido; los datos (Firestore) siempre van a la red.
const CACHE='dpem-v1';
const SHELL=['./','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(/firestore\.googleapis\.com|firebaseio\.com|identitytoolkit|securetoken/.test(u.host)) return; // datos: nunca cachear
  if(r.mode==='navigate'){ // la app: red primero, caché si no hay conexión
    e.respondWith(fetch(r).then(res=>{ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); return res; }).catch(()=>caches.match(r).then(m=>m||caches.match('./')))); return;
  }
  // librerías, fuentes e íconos: caché primero y se actualiza en segundo plano
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{ if(res&&(res.ok||res.type==='opaque')){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); } return res; }).catch(()=>m);
    return m||net;
  }));
});
