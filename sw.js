const CACHE_NAME="velocitytype-static-v14";
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./css/reset.css",
  "./css/variables.css",
  "./css/typography.css",
  "./css/layout.css",
  "./css/navbar.css",
  "./css/footer.css",
  "./css/utilities.css",
  "./css/landing.css",
  "./css/typing.css",
  "./css/progress.css",
  "./css/settings.css","./css/liquid-motion.css",
  "./js/app.js",
  "./js/landing.js",
  "./js/settings.js","./js/glass-motion.js",
  "./js/typing-engine.js",
  "./js/progress.js"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const requestUrl=new URL(event.request.url);
  if(requestUrl.origin!==self.location.origin)return;
  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached)return cached;
      return fetch(event.request).then(response=>{
        if(response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
        }
        return response;
      }).catch(()=>caches.match("./index.html"));
    })
  );
});