const CACHE_VERSION = 'my-voca-v5.3.111';
const STATIC_CACHE = CACHE_VERSION + '-static';
const DATA_CACHE = CACHE_VERSION + '-data';

const STATIC_ASSETS = [
  './',
  './index.html',
  './app.css?v=5.3.111',
  './app.js?v=5.3.111'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('my-voca-') && ![STATIC_CACHE, DATA_CACHE].includes(key))
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
  if(event.data && event.data.type === 'CLEAR_MY_VOCA_CACHE'){
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.startsWith('my-voca-')).map(k => caches.delete(k)));
    })());
  }
});

async function networkFirst(request, cacheName){
  const cache = await caches.open(cacheName);
  try{
    const fresh = await fetch(request, {cache:'no-store'});
    if(fresh && fresh.ok){
      cache.put(request, fresh.clone());
    }
    return fresh;
  }catch(err){
    const cached = await cache.match(request, {ignoreSearch:true});
    if(cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName){
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, {ignoreSearch:true});
  const fetchPromise = fetch(request, {cache:'no-store'})
    .then(res => {
      if(res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;

  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;

  const path = url.pathname;

  // HTML/navigation: always try network first so new deployments appear quickly.
  if(request.mode === 'navigate' || path.endsWith('/index.html') || path.endsWith('/')){
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Main JS/CSS: network first, ignoring stale browser HTTP cache.
  if(path.endsWith('/app.js') || path.endsWith('/app.css')){
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Master CSV: allow fast cached startup but refresh in background.
  if(path.endsWith('/MY_VOCA_MASTER.csv')){
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // Other local assets: normal network, cache fallback.
  event.respondWith(
    fetch(request).catch(() => caches.match(request, {ignoreSearch:true}))
  );
});
