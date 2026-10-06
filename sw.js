// SAYWARD v5.4.46 - retirement worker. No fetch interception.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith('sayward-runtime-')).map(k=>caches.delete(k)));
    }catch(e){}
    try{await self.registration.unregister()}catch(e){}
  })());
});
