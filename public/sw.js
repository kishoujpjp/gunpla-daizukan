/* ─────────────────────────────────────────────────────────
   Service Worker(自動版数・クロスオリジン素通し版)
   ・CACHE 名の __SW_VERSION__ はビルド時に vite.config.js が
     dist のハッシュへ置換する → デプロイのたびに版が変わり、
     手動 bump 不要・旧キャッシュ(古いハッシュ資産)も自動掃除。
   ・未置換(dev 等)でも文字列のまま安定動作(従来の手動定数相当)。
   ───────────────────────────────────────────────────────── */
const CACHE = "mgz-__SW_VERSION__";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      // 旧版キャッシュを削除(古いハッシュ資産の累積=容量圧迫を防ぐ)
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

  // 同一オリジン以外(Supabase 同期・Gemini・外部画像など)は SW を介さず素通し。
  // → API 通信・クラウド同期に SW が一切干渉しない(オフライン誤判やキャッシュ汚染を回避)。
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  // HTML 文件:ネットワーク優先(オンラインなら常に最新版)、失敗時のみキャッシュへ回退
  if (isDoc(req)) {
    e.respondWith(
      (async () => {
        try {
          const net = await fetch(req);
          if (net && net.ok) {
            const c = await caches.open(CACHE);
            c.put(req, net.clone());
          }
          return net;
        } catch (err) {
          const c = await caches.open(CACHE);
          return (await c.match(req)) || (await c.match("/index.html")) || Response.error();
        }
      })()
    );
    return;
  }

  // その他(ハッシュ化された JS/CSS/画像など、内容不変):キャッシュ優先 + 背景更新
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req)
        .then((r) => {
          if (r && r.ok) c.put(req, r.clone());
          return r;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
