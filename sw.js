/* BPCL Standard Drawings — Service Worker v1 */
var CACHE = 'bpcl-drawings-v2';
var BASE = '/BPCL_Standard_Drawings/prototype/';
var SHELL = [
  BASE + 'std-drawings-standalone.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.png',
  BASE + 'icon-512.png',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

/* Install — cache app shell */
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
  );
  self.skipWaiting();
});

/* Activate — clean old caches */
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

/* Fetch — cache-first for shell, network-first for PDFs */
self.addEventListener('fetch', function(e){
  var url = e.request.url;

  /* PDFs: always try network, don't cache (too large) */
  if(url.indexOf('.pdf')>-1 || url.indexOf('.PDF')>-1){
    e.respondWith(fetch(e.request).catch(function(){
      return new Response('PDF not available offline.', {status:503});
    }));
    return;
  }

  /* App shell: cache-first */
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(response){
        /* Cache successful GET responses for shell assets */
        if(response.ok && e.request.method==='GET'){
          var clone = response.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return response;
      }).catch(function(){
        /* Offline fallback for navigation */
        if(e.request.mode==='navigate') return caches.match(BASE+'std-drawings-standalone.html');
      });
    })
  );
});
