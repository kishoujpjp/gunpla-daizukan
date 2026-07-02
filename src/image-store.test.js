/* image-store.test.js — node --test(fake-indexeddb 不要:memBackend 注入) */
import { test } from "node:test";
import assert from "node:assert";
import { createImageStore, memBackend, THUMB_EDGE, ORIG_MAX_EDGE } from "./image-store.js";

/* ── テスト用 deps ──
   imageOps: 「blob.__w/__h を寸法とみなす」フェイク。downscale は
   maxEdge 超過時のみ縮小 blob(サイズ半分の擬似)を返す本物同契約。 */
function fakeBlob(bytes, w, h, type = "image/jpeg") {
  const b = new Blob([new Uint8Array(bytes)], { type });
  b.__w = w; b.__h = h;
  return b;
}
function fakeOps(log = []) {
  return {
    measure: async (b) => (b.__w ? { w: b.__w, h: b.__h } : null),
    downscale: async (b, maxEdge, q) => {
      log.push(["downscale", maxEdge, q]);
      if (!b.__w) return null; // decode 不能
      const edge = Math.max(b.__w, b.__h);
      if (edge <= maxEdge) return { blob: null, w: b.__w, h: b.__h };
      const scale = maxEdge / edge;
      const out = fakeBlob(Math.max(1, Math.floor(b.size / 2)), Math.round(b.__w * scale), Math.round(b.__h * scale));
      return { blob: out, w: out.__w, h: out.__h };
    },
  };
}
function fakeUrls() {
  let n = 0;
  const live = new Set();
  return {
    create: (b) => { const u = "blob:fake/" + (++n); live.add(u); return u; },
    revoke: (u) => { live.delete(u); },
    live,
  };
}
function makeStore(opsLog) {
  const urls = fakeUrls();
  const store = createImageStore(memBackend(), { imageOps: fakeOps(opsLog), urls });
  return { store, urls };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

/* ── putOrig / 取得系 ── */
test("putOrig→getOrigBlob 往復・寸法自動計測・usage 反映", async () => {
  const { store } = makeStore();
  const b = fakeBlob(1000, 800, 600);
  const info = await store.putOrig("kit1", b);
  assert.deepStrictEqual({ w: info.w, h: info.h, bytes: info.bytes }, { w: 800, h: 600, bytes: 1000 });
  assert.strictEqual(await store.getOrigBlob("kit1"), b);
  const meta = await store.getOrigMeta("kit1");
  assert.strictEqual(meta.w, 800);
  const u = await store.usage();
  assert.deepStrictEqual({ count: u.count, origBytes: u.origBytes }, { count: 1, origBytes: 1000 });
});

test("putOrig: dims 明示指定時は計測を省略して採用", async () => {
  const { store } = makeStore();
  const info = await store.putOrig("k", fakeBlob(10, 0, 0), { w: 111, h: 222 });
  assert.deepStrictEqual({ w: info.w, h: info.h }, { w: 111, h: 222 });
});

test("getOrigBlob/URL: 不存在 id は null", async () => {
  const { store } = makeStore();
  assert.strictEqual(await store.getOrigBlob("nai"), null);
  assert.strictEqual(await store.getOrigURL("nai"), null);
  assert.strictEqual(await store.getThumbURL("nai"), null);
});

test("getOrigURL: 同一 id は同一 URL(重複生成しない)", async () => {
  const { store, urls } = makeStore();
  await store.putOrig("k", fakeBlob(10, 100, 100));
  const u1 = await store.getOrigURL("k");
  const u2 = await store.getOrigURL("k");
  assert.strictEqual(u1, u2);
  assert.strictEqual(urls.live.size, 1);
});

/* ── 縮図 ── */
test("getThumbURL: 大画像は派生して永続、2回目は再派生しない", async () => {
  const log = [];
  const { store } = makeStore(log);
  await store.putOrig("k", fakeBlob(1000, 2000, 1500));
  const u1 = await store.getThumbURL("k");
  assert.ok(u1);
  const derives = log.filter((e) => e[0] === "downscale").length;
  const u2 = await store.getThumbURL("k");
  assert.strictEqual(u2, u1);
  assert.strictEqual(log.filter((e) => e[0] === "downscale").length, derives, "2回目で再派生した");
});

test("getThumbURL: THUMB_EDGE 以下の画像は原 blob をそのまま縮図扱い", async () => {
  const { store } = makeStore();
  const small = fakeBlob(50, 300, 200); // 300 <= 480
  await store.putOrig("k", small);
  assert.ok(await store.getThumbURL("k"));
  const u = await store.usage();
  assert.strictEqual(u.thumbBytes, 50, "原 blob が thumb store に入るはず");
});

test("getThumbURL: decode 不能(未対応形式)は orig URL へフォールバック", async () => {
  const { store } = makeStore();
  await store.putOrig("k", fakeBlob(10, 0, 0), { w: 9, h: 9 }); // __w 無し=downscale null
  const u = await store.getThumbURL("k");
  assert.ok(u, "フォールバック URL が返るべき");
  assert.strictEqual((await store.usage()).thumbBytes, 0, "thumb store には入れない");
});

test("putOrig 上書き: 旧 thumb を無効化し次回要求で作り直す", async () => {
  const { store } = makeStore();
  await store.putOrig("k", fakeBlob(1000, 2000, 2000));
  const u1 = await store.getThumbURL("k");
  await store.putOrig("k", fakeBlob(2000, 2400, 2400));
  const u2 = await store.getThumbURL("k");
  assert.notStrictEqual(u2, u1);
});

/* ── 削除 / URL 生命周期 ── */
test("deleteImage: orig+thumb 消去・URL revoke・listIds から消える", async () => {
  const { store, urls } = makeStore();
  await store.putOrig("k", fakeBlob(1000, 2000, 2000));
  await store.getThumbURL("k");
  await store.getOrigURL("k");
  assert.strictEqual(urls.live.size, 2);
  await store.deleteImage("k");
  assert.strictEqual(urls.live.size, 0, "revoke 漏れ");
  assert.deepStrictEqual(await store.listIds(), []);
  assert.strictEqual(await store.getThumbURL("k"), null);
});

test("revokeAll: 全 URL 破棄・blob 本体は温存", async () => {
  const { store, urls } = makeStore();
  await store.putOrig("a", fakeBlob(10, 100, 100));
  await store.putOrig("b", fakeBlob(10, 100, 100));
  await store.getThumbURL("a"); await store.getOrigURL("b");
  store.revokeAll();
  assert.strictEqual(urls.live.size, 0);
  assert.ok(await store.getOrigBlob("a"), "blob は残るべき");
});

/* ── 起動一括構成 ── */
test("allThumbURLs: 既存 thumb は即時、未派生分は onLate で追い通知", async () => {
  const { store } = makeStore();
  await store.putOrig("hot", fakeBlob(100, 2000, 2000));
  await store.getThumbURL("hot"); // hot は thumb 済み
  await store.putOrig("cold", fakeBlob(100, 2000, 2000)); // cold は未派生
  const late = [];
  const now = await store.allThumbURLs((id, url) => late.push([id, url]));
  assert.ok(now.hot, "既存 thumb は即時 map に載る");
  assert.strictEqual(now.cold, undefined, "未派生は即時 map に載らない");
  await tick(); await tick();
  assert.strictEqual(late.length, 1);
  assert.strictEqual(late[0][0], "cold");
});

test("allThumbURLs: 二度呼びでも URL は再生成されない(同一参照)", async () => {
  const { store, urls } = makeStore();
  await store.putOrig("k", fakeBlob(100, 100, 100));
  await store.getThumbURL("k");
  const m1 = await store.allThumbURLs();
  const m2 = await store.allThumbURLs();
  assert.strictEqual(m1.k, m2.k);
  assert.strictEqual(urls.live.size, 1);
});

/* ── data URL 取込(v3 遷移の解碼路徑・node 原生 fetch 実測) ── */
test("putDataURL: base64 data URL を Blob 化して格納", async () => {
  const { store } = makeStore();
  // 1x1 JPEG 相当の適当なバイト列(decode はしない=寸法 0 で保存される)
  const b64 = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]).toString("base64");
  const info = await store.putDataURL("mig1", "data:image/jpeg;base64," + b64);
  assert.strictEqual(info.bytes, 8);
  const blob = await store.getOrigBlob("mig1");
  assert.strictEqual(blob.size, 8);
  assert.strictEqual(blob.type, "image/jpeg");
});

test("has: 遷移の冪等 skip 判定に使える", async () => {
  const { store } = makeStore();
  assert.strictEqual(await store.has("x"), false);
  await store.putOrig("x", fakeBlob(1, 10, 10));
  assert.strictEqual(await store.has("x"), true);
});

/* ── normalizeImport(取込上限・決定点③) ── */
test("normalizeImport: 上限超過は縮小 blob、以下は原 blob を返す", async () => {
  const { store } = makeStore();
  const big = fakeBlob(1000, 4000, 3000);
  const nb = await store.normalizeImport(big);
  assert.notStrictEqual(nb.blob, big);
  assert.strictEqual(Math.max(nb.w, nb.h), ORIG_MAX_EDGE);
  const small = fakeBlob(100, 800, 600);
  const ns = await store.normalizeImport(small);
  assert.strictEqual(ns.blob, small);
});

test("normalizeImport: decode 不能は原 blob 素通し(保存は諦めない)", async () => {
  const { store } = makeStore();
  const raw = fakeBlob(100, 0, 0);
  const n = await store.normalizeImport(raw);
  assert.strictEqual(n.blob, raw);
});

/* ── rebuildThumbs(「再圧縮」新意味の部品) ── */
test("rebuildThumbs: 全 thumb 破棄→orig から再派生、件数を返す", async () => {
  const { store, urls } = makeStore();
  await store.putOrig("a", fakeBlob(100, 2000, 2000));
  await store.putOrig("b", fakeBlob(100, 300, 300));
  await store.getThumbURL("a"); await store.getThumbURL("b");
  const n = await store.rebuildThumbs();
  assert.strictEqual(n, 2);
  assert.strictEqual(urls.live.size, 0, "旧 thumb URL は revoke されるべき");
});

test("usage: orig/thumb 双方の合計と件数", async () => {
  const { store } = makeStore();
  await store.putOrig("a", fakeBlob(100, 2000, 2000));
  await store.putOrig("b", fakeBlob(200, 300, 300));
  await store.getThumbURL("a"); // 派生(50 bytes)
  await store.getThumbURL("b"); // 原様(200 bytes)
  const u = await store.usage();
  assert.deepStrictEqual(u, { count: 2, origBytes: 300, thumbBytes: 250 });
});
