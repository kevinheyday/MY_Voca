const CACHE_VERSION = 'my-voca-v5.3.97';
const STATIC_CACHE = CACHE_VERSION + '-static';
const DATA_CACHE = CACHE_VERSION + '-data';

const STATIC_ASSETS = [
  './index.html',
  './app.css?v=5.3.97',
  './app.js?v=5.3.97'
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
      keys.filter(key => key !== STATIC_CACHE && key !== DATA_CACHE)
          .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if(event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request, {cache:'no-store'});
    if(response?.ok) await cache.put(request, response.clone());
    return response;
  } catch(err) {
    const cached = await cache.match(request, {ignoreSearch:true});
    if(cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, {ignoreSearch:true});
  const fresh = fetch(request, {cache:'no-store'}).then(async response => {
    if(response?.ok) await cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fresh;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;

  const path = url.pathname;

  if(req.mode === 'navigate' || path.endsWith('/index.html') || path.endsWith('/')) {
    event.respondWith(networkFirst(req, STATIC_CACHE));
    return;
  }

  if(path.endsWith('/app.js') || path.endsWith('/app.css')) {
    event.respondWith(networkFirst(req, STATIC_CACHE));
    return;
  }

  if(path.endsWith('/MY_VOCA_MASTER.csv')) {
    event.respondWith(staleWhileRevalidate(req, DATA_CACHE));
    return;
  }

  event.respondWith(fetch(req).catch(() => caches.match(req, {ignoreSearch:true})));
});
