const CACHE = "mgz-v77";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(e.request);
      const net = fetch(e.request)
        .then((r) => {
          if (r.ok && e.request.url.startsWith(self.location.origin)) c.put(e.request, r.clone());
          return r;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
