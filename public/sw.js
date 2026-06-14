const CACHE = "mgz-v83";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      // 舊版快取清掉,避免卡在過時資產
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  )
);

const isDoc = (req) =>
  req.mode === "navigate" ||
  req.destination === "document" ||
  (req.headers.get("accept") || "").includes("text/html");

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // HTML 文件:網路優先(線上一定拿最新版),離線才回退快取
  if (isDoc(req)) {
    e.respondWith(
      (async () => {
        try {
          const net = await fetch(req);
          if (net && net.ok && req.url.startsWith(self.location.origin)) {
            const c = await caches.open(CACHE);
            c.put(req, net.clone());
          }
          return net;
        } catch {
          const c = await caches.open(CACHE);
          return (await c.match(req)) || (await c.match("/index.html")) || Response.error();
        }
      })()
    );
    return;
  }

  // 其餘(hash 化的 JS/CSS/圖片等,內容不變):快取優先 + 背景更新
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req)
        .then((r) => {
          if (r && r.ok && req.url.startsWith(self.location.origin)) c.put(req, r.clone());
          return r;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
