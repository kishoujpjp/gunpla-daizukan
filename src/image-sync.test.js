/* image-sync.test.js — node --test(fetch 注入・二端末シナリオ含む) */
import { test } from "node:test";
import assert from "node:assert";
import {
  storagePath, uploadImage, downloadImage, deleteRemoteImage,
  parseIdx, mergeIdx, isDeadIdx, stampIdxUp, tombstoneIdx, idxDiff,
  parseQ, qAdd, qRemove, userIdFromJWT,
} from "./image-sync.js";

const CFG = { url: "https://x.supabase.co", anonKey: "anonK", accessToken: "jwtT", userId: "u1" };
function recFetch(status, body) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init: init || {} });
    return { ok: status >= 200 && status < 300, status, blob: async () => body };
  };
  fn.calls = calls;
  return fn;
}

/* ── REST 契約 ── */
test("storagePath: userId/画像id。~ は素通し、危険文字はエンコード", () => {
  assert.strictEqual(storagePath("u1", "b194~abc"), "u1/b194~abc");
  assert.strictEqual(storagePath("u1", "a/b?c"), "u1/a%2Fb%3Fc");
});

test("uploadImage: URL/メソッド/認証/upsert/型 が契約どおり", async () => {
  const f = recFetch(200);
  const blob = new Blob([new Uint8Array([1])], { type: "image/jpeg" });
  assert.strictEqual(await uploadImage(CFG, "kit1", blob, f), true);
  const c = f.calls[0];
  assert.strictEqual(c.url, "https://x.supabase.co/storage/v1/object/images/u1/kit1");
  assert.strictEqual(c.init.method, "POST");
  assert.strictEqual(c.init.headers.apikey, "anonK");
  assert.strictEqual(c.init.headers.Authorization, "Bearer jwtT");
  assert.strictEqual(c.init.headers["x-upsert"], "true");
  assert.strictEqual(c.init.headers["Content-Type"], "image/jpeg");
});

test("uploadImage: 失敗は status 付きで throw(呼び手がキューに残す)", async () => {
  await assert.rejects(() => uploadImage(CFG, "k", new Blob([]), recFetch(503)), (e) => e.status === 503);
});

test("downloadImage: 200=Blob / 404・400=null / 500=throw", async () => {
  const body = new Blob([new Uint8Array([9, 9])]);
  const f200 = recFetch(200, body);
  assert.strictEqual(await downloadImage(CFG, "k", f200), body);
  assert.strictEqual(f200.calls[0].url, "https://x.supabase.co/storage/v1/object/authenticated/images/u1/k");
  assert.strictEqual(await downloadImage(CFG, "k", recFetch(404)), null);
  assert.strictEqual(await downloadImage(CFG, "k", recFetch(400)), null);
  await assert.rejects(() => downloadImage(CFG, "k", recFetch(500)), (e) => e.status === 500);
});

test("deleteRemoteImage: 404 は冪等成功、5xx は throw", async () => {
  assert.strictEqual(await deleteRemoteImage(CFG, "k", recFetch(200)), true);
  assert.strictEqual(await deleteRemoteImage(CFG, "k", recFetch(404)), true);
  await assert.rejects(() => deleteRemoteImage(CFG, "k", recFetch(500)));
});

/* ── 索引 LWW ── */
test("parseIdx: 壊れ JSON・非 object は {} に安全化", () => {
  assert.deepStrictEqual(parseIdx("{壊れ"), {});
  assert.deepStrictEqual(parseIdx("[1]"), {});
  assert.deepStrictEqual(parseIdx('{"a":{"w":1}}'), { a: { w: 1 } });
});

test("二端末シナリオ: A が追加、B が別画像を追加 → マージで両方生きる", () => {
  const a = stampIdxUp({}, "img1", { w: 100, h: 80, bytes: 500 }, "2026-07-03T10:00:00Z");
  const b = stampIdxUp({}, "img2", { w: 50, h: 50, bytes: 200 }, "2026-07-03T10:01:00Z");
  const m = mergeIdx(a, b);
  assert.ok(!isDeadIdx(m.img1) && !isDeadIdx(m.img2));
  assert.strictEqual(m.img1.w, 100);
});

test("二端末シナリオ: 追加 → 他端末で削除(墓碑が新しい)→ マージで死ぬ", () => {
  const a = stampIdxUp({}, "img1", { w: 1, h: 1, bytes: 1 }, "2026-07-03T10:00:00Z");
  const b = tombstoneIdx(a, "img1", "2026-07-03T10:05:00Z");
  // 順不同マージでも同結果(可換)
  assert.ok(isDeadIdx(mergeIdx(a, b).img1));
  assert.ok(isDeadIdx(mergeIdx(b, a).img1));
});

test("墓碑後の再追加(より新しい stampIdxUp)で復活する", () => {
  const dead = tombstoneIdx(stampIdxUp({}, "x", { w: 1, h: 1, bytes: 1 }, "2026-07-03T09:00:00Z"), "x", "2026-07-03T10:00:00Z");
  const revived = stampIdxUp(dead, "x", { w: 2, h: 2, bytes: 2 }, "2026-07-03T11:00:00Z");
  const m = mergeIdx(dead, revived);
  assert.ok(!isDeadIdx(m.x));
  assert.strictEqual(m.x.w, 2);
});

test("古い墓碑は新しい追加を殺せない(オフライン分岐の順序逆転)", () => {
  const oldDead = tombstoneIdx({}, "x", "2026-07-03T08:00:00Z");
  const newUp = stampIdxUp({}, "x", { w: 3, h: 3, bytes: 3 }, "2026-07-03T09:00:00Z");
  assert.ok(!isDeadIdx(mergeIdx(oldDead, newUp).x));
});

test("idxDiff: download / removeLocal / upload の三分類", () => {
  let idx = stampIdxUp({}, "cloudOnly", { w: 1, h: 1, bytes: 1 }, "2026-07-03T10:00:00Z");
  idx = stampIdxUp(idx, "both", { w: 1, h: 1, bytes: 1 }, "2026-07-03T10:00:00Z");
  idx = tombstoneIdx(stampIdxUp(idx, "deadHere", { w: 1, h: 1, bytes: 1 }, "2026-07-03T10:00:00Z"), "deadHere", "2026-07-03T10:01:00Z");
  idx = tombstoneIdx(stampIdxUp(idx, "deadGone", { w: 1, h: 1, bytes: 1 }, "2026-07-03T10:00:00Z"), "deadGone", "2026-07-03T10:01:00Z");
  const local = new Set(["both", "deadHere", "localOnly"]);
  const d = idxDiff(idx, local);
  assert.deepStrictEqual(d.download, ["cloudOnly"]);
  assert.deepStrictEqual(d.removeLocal, ["deadHere"]);
  assert.deepStrictEqual(d.upload, ["localOnly"]);
});

/* ── 再送キュー ── */
test("qAdd: 同一 id は最新意図が勝つ(up→del は del のみ、del→up は up のみ)", () => {
  let q = qAdd([], "up", "a", 1);
  q = qAdd(q, "del", "a", 2);
  assert.deepStrictEqual(q.map((e) => e.op + ":" + e.id), ["del:a"]);
  q = qAdd(q, "up", "a", 3);
  assert.deepStrictEqual(q.map((e) => e.op + ":" + e.id), ["up:a"]);
});

test("qAdd/qRemove: 異なる id は共存、qRemove は op+id 一致のみ除去", () => {
  let q = qAdd(qAdd([], "up", "a", 1), "del", "b", 2);
  assert.strictEqual(q.length, 2);
  q = qRemove(q, "up", "a");
  assert.deepStrictEqual(q.map((e) => e.op + ":" + e.id), ["del:b"]);
  assert.strictEqual(qRemove(q, "up", "b").length, 1, "op 不一致は残す");
});

test("parseQ: 壊れ JSON は [] に安全化", () => {
  assert.deepStrictEqual(parseQ("junk"), []);
  assert.deepStrictEqual(parseQ('[{"op":"up","id":"a","at":1}]'), [{ op: "up", id: "a", at: 1 }]);
});

test("userIdFromJWT: payload.sub を取得、壊れ token は空文字", () => {
  const payload = Buffer.from(JSON.stringify({ sub: "uuid-123", role: "authenticated" })).toString("base64url");
  assert.strictEqual(userIdFromJWT("head." + payload + ".sig"), "uuid-123");
  assert.strictEqual(userIdFromJWT("junk"), "");
  assert.strictEqual(userIdFromJWT(null), "");
});
