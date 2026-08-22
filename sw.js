// MY VOCA Service Worker v5.3.124
const CACHE_VERSION = 'my-voca-v5.3.124';
const APP_SHELL = [
  './',
  './index.html',
  './app.css?v=5.3.124',
  './app.js?v=5.3.124',
  './MY_VOCA_MASTER.csv'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key !== CACHE_VERSION)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  try {
    const fresh = await fetch(request, { cache: 'no-store' });
    const cache = await caches.open(CACHE_VERSION);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    throw err;
  }
}

async function cacheThenRefresh(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const refresh = fetch(request, { cache: 'no-store' })
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || refresh || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Always get the newest HTML and core app code when online.
  const isNavigation = request.mode === 'navigate';
  const isHtml = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  const isCoreAsset =
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/app.css') ||
    url.pathname.endsWith('/sw.js');

  if (sameOrigin && (isNavigation || isHtml || isCoreAsset)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Keep other same-origin assets fast, but refresh them in the background.
  if (sameOrigin) {
    event.respondWith(cacheThenRefresh(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
