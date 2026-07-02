/* image-migrate.test.js — node --test(遷移の契約回帰) */
import { test } from "node:test";
import assert from "node:assert";
import { migrateShardsToStore, isHttpSrc, blobToDataURL } from "./image-migrate.js";
import { createImageStore, memBackend } from "./image-store.js";

/* window.storage 契約のフェイク(get は無いキーで throw) */
function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return {
    m,
    async get(k) { if (!m.has(k)) throw new Error("key not found: " + k); return { key: k, value: m.get(k) }; },
    async set(k, v) { m.set(k, v); },
    async delete(k) { m.delete(k); },
  };
}
const noopOps = { measure: async () => null, downscale: async () => null };
const fakeUrls = () => ({ create: () => "blob:x", revoke: () => {} });
const mkStore = () => createImageStore(memBackend(), { imageOps: noopOps, urls: fakeUrls() });
const dURL = (bytes) => "data:image/jpeg;base64," + Buffer.from(bytes).toString("base64");

test("基本遷移: base64→store・URL→urlRows・処理済み分片は削除", async () => {
  const storage = fakeStorage({
    mg_imgs_0: JSON.stringify({ kitA: dURL([1, 2, 3]), kitB: "https://example.com/b.jpg" }),
    mg_xtra_5: JSON.stringify({ "kitA~x1": dURL([9, 9]) }),
  });
  const store = mkStore();
  const r = await migrateShardsToStore(storage, store, { imgShards: 8, xtraShards: 32 });
  assert.strictEqual(r.moved, 2);
  assert.deepStrictEqual(r.urlRows, { kitB: "https://example.com/b.jpg" });
  assert.deepStrictEqual(r.keptShards, []);
  assert.strictEqual((await store.getOrigBlob("kitA")).size, 3);
  assert.strictEqual((await store.getOrigBlob("kitA~x1")).size, 2);
  assert.ok(!storage.m.has("mg_imgs_0") && !storage.m.has("mg_xtra_5"), "分片は削除されるべき");
});

test("冪等: 再実行は moved=0(取込済み skip)・再開可能", async () => {
  const store = mkStore();
  const shard = JSON.stringify({ kitA: dURL([1]), kitC: dURL([2]) });
  // 1回目(kitA のみ取込済みの途中状態を再現)
  await store.putDataURL("kitA", dURL([1]));
  const s1 = fakeStorage({ mg_imgs_0: shard });
  const r1 = await migrateShardsToStore(s1, store);
  assert.strictEqual(r1.moved, 1, "未取込の kitC だけ移すべき");
  // 2回目(分片復活のケース=旧端末 pull 落地):全 skip
  const s2 = fakeStorage({ mg_imgs_0: shard });
  const r2 = await migrateShardsToStore(s2, store);
  assert.strictEqual(r2.moved, 0);
  assert.ok(!s2.m.has("mg_imgs_0"), "全 skip でも分片は掃除される");
});

test("壊れ分片(JSON不正/非object)は削除せず残置", async () => {
  const storage = fakeStorage({ mg_imgs_1: "{壊れ", mg_imgs_2: JSON.stringify([1, 2]) });
  const r = await migrateShardsToStore(fakeStorageMerge(storage), mkStore());
  assert.deepStrictEqual(r.keptShards.sort(), ["mg_imgs_1", "mg_imgs_2"]);
  assert.ok(storage.m.has("mg_imgs_1") && storage.m.has("mg_imgs_2"));
  function fakeStorageMerge(s) { return s; }
});

test("取込失敗が1件でもある分片は削除しない(データ温存)", async () => {
  const storage = fakeStorage({ mg_imgs_0: JSON.stringify({ ok1: dURL([1]), bad1: dURL([2]), ok2: dURL([3]) }) });
  const store = mkStore();
  const orig = store.putDataURL.bind(store);
  store.putDataURL = async (id, v) => { if (id === "bad1") throw new Error("書込失敗"); return orig(id, v); };
  const r = await migrateShardsToStore(storage, store);
  assert.strictEqual(r.moved, 2, "成功分は取り込む");
  assert.deepStrictEqual(r.keptShards, ["mg_imgs_0"]);
  assert.ok(storage.m.has("mg_imgs_0"), "分片残置=次回再試行");
});

test("不明形式の値(blob:等)は無視され、分片削除は阻止しない", async () => {
  const storage = fakeStorage({ mg_imgs_0: JSON.stringify({ a: "blob:xxx", b: dURL([7]) }) });
  const r = await migrateShardsToStore(storage, mkStore());
  assert.strictEqual(r.moved, 1);
  assert.ok(!storage.m.has("mg_imgs_0"));
});

test("isHttpSrc: http/https のみ真", () => {
  assert.ok(isHttpSrc("https://a/b.jpg") && isHttpSrc("http://a/b.jpg"));
  assert.ok(!isHttpSrc("data:image/jpeg;base64,xx") && !isHttpSrc("blob:x") && !isHttpSrc(null) && !isHttpSrc(""));
});

test("blobToDataURL: 往復一致(export 経路の契約)", async () => {
  const bytes = new Uint8Array([0, 1, 2, 253, 254, 255]);
  const d = await blobToDataURL(new Blob([bytes], { type: "image/png" }));
  assert.ok(d.startsWith("data:image/png;base64,"));
  const back = new Uint8Array(await (await fetch(d)).arrayBuffer());
  assert.deepStrictEqual([...back], [...bytes]);
});

test("blobToDataURL: 大 blob(チャンク境界跨ぎ)でも破綻しない", async () => {
  const bytes = new Uint8Array(0x8000 * 2 + 7).map((_, i) => i % 251);
  const d = await blobToDataURL(new Blob([bytes]));
  const back = new Uint8Array(await (await fetch(d)).arrayBuffer());
  assert.strictEqual(back.length, bytes.length);
  assert.strictEqual(back[0x8000], bytes[0x8000]);
  assert.strictEqual(back[back.length - 1], bytes[bytes.length - 1]);
});
