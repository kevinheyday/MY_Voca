// SAYWARD v5.4.55 RECOVERY WORKER — ZERO PREFLIGHT release
// Purpose: remove historical SAYWARD caches/service-worker registration centrally.
// It intentionally has NO fetch handler and never touches localStorage learning data.
const RECOVERY_VERSION='5.4.55';
const RECOVERY_TAG='555';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const deletedCaches=[];
    try{
      const keys=await caches.keys();
      for(const key of keys){
        if(/^sayward/i.test(key)){
          try{if(await caches.delete(key))deletedCaches.push(key)}catch(e){}
        }
      }
    }catch(e){}

    let windows=[];
    try{
      await self.clients.claim();
      windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    }catch(e){}

    for(const client of windows){
      try{client.postMessage({type:'SAYWARD_RECOVERY_DONE',version:RECOVERY_VERSION,deletedCaches})}catch(e){}
    }

    // Remove this recovery worker itself. Existing controlled clients are then navigated
    // once so their next document starts with no SAYWARD service worker at all.
    try{await self.registration.unregister()}catch(e){}

    await Promise.all(windows.map(async client=>{
      try{
        const u=new URL(client.url);
        if(u.origin!==self.location.origin)return;
        const p=u.pathname.replace(/\\+/g,'/');
        if(!(p.endsWith('/')||p.endsWith('/index.html')||p.endsWith('/sayward-app.html')))return;
        if(u.searchParams.get('swrecovery')===RECOVERY_TAG)return;
        u.searchParams.set('swrecovery',RECOVERY_TAG);
        u.searchParams.set('_',Date.now());
        await client.navigate(u.href);
      }catch(e){}
    }));
  })());
});
