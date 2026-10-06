const CACHE='sayward-runtime-v5.4.45';
const CORE=['./','./index.html','./sayward-core.css','./sayward-patches.css','./sayward-home.css'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    for(const u of CORE){
      try{const r=await fetch(u,{cache:'no-cache'});if(r&&r.ok)await c.put(u,r.clone())}catch(e){}
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('sayward-runtime-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function navigation(request){
  const c=await caches.open(CACHE);
  const cached=await c.match('./index.html')||await c.match('./');
  const net=fetch(request).then(async r=>{if(r&&r.ok)await c.put('./index.html',r.clone());return r}).catch(()=>null);
  if(!cached){const r=await net;return r||new Response('SAYWARD is temporarily unavailable.',{status:503,headers:{'content-type':'text/plain;charset=utf-8'}})}
  const fast=await Promise.race([net,sleep(900).then(()=>null)]);
  if(fast)return fast;
  net.then(()=>{}).catch(()=>{});
  return cached;
}
async function staticAsset(request){
  const c=await caches.open(CACHE);
  const cached=await c.match(request);
  if(cached){
    fetch(request).then(async r=>{if(r&&r.ok)await c.put(request,r.clone())}).catch(()=>{});
    return cached;
  }
  try{const r=await fetch(request);if(r&&r.ok)await c.put(request,r.clone());return r}catch(e){return new Response('',{status:504})}
}
self.addEventListener('fetch',event=>{
  const r=event.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==self.location.origin)return;
  if(r.mode==='navigate'){event.respondWith(navigation(r));return}
  event.respondWith(staticAsset(r));
});
