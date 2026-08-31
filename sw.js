// MY VOCA v5.3.173
// Service Worker intentionally disabled during active development.
// The page unregisters legacy workers and clears old caches.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',(event)=>{
  event.waitUntil(self.registration.unregister().then(()=>self.clients.claim()));
});
self.addEventListener('fetch',()=>{});
