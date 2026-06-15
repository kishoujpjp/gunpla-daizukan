import test from "node:test";
import assert from "node:assert/strict";
import { tsOf, mergeRec, mergeRecMap, mergeArrStamped, stampRec, stampRecAll } from "./merge.js";

const T1 = "2026-06-01T00:00:00.000Z";
const T2 = "2026-06-02T00:00:00.000Z";
const T3 = "2026-06-03T00:00:00.000Z";

/* フィールド値だけ比較(_ts / t を除く)するヘルパ */
const fields = (rec) => {
  const o = {};
  for (const k of Object.keys(rec)) if (k !== "_ts" && k !== "t") o[k] = rec[k];
  return o;
};

test("#1 中核:両端末がオフラインで別フィールドを編集 → 両方残る", () => {
  // 端末A:購入日を T1 に設定
  const a = stampRec({ owned: true, plan: false, purchaseDate: "", buildDate: "" }, { purchaseDate: "2026-05-10" }, T1);
  // 端末B:同じ record の完成日を T2(>T1)に設定(購入日は知らない)
  const b = stampRec({ owned: true, plan: false, purchaseDate: "", buildDate: "" }, { buildDate: "2026-05-20" }, T2);

  const m = mergeRec(a, b);
  assert.equal(m.purchaseDate, "2026-05-10", "購入日(A)が温存される");
  assert.equal(m.buildDate, "2026-05-20", "完成日(B)が反映される");
  assert.equal(m.owned, true);
});

test("マージは可換:mergeRec(a,b) と mergeRec(b,a) で値が一致", () => {
  const a = stampRec({ owned: true }, { purchaseDate: "2026-05-10" }, T1);
  const b = stampRec({ owned: true }, { buildDate: "2026-05-20" }, T2);
  assert.deepEqual(fields(mergeRec(a, b)), fields(mergeRec(b, a)));
});

test("旧データ(_ts 無し・頂層 t のみ)からの移行が成立", () => {
  // 旧形式:t だけを持つ record
  const old = { owned: true, plan: false, purchaseDate: "2026-05-01", buildDate: "", t: T1 };
  assert.ok(!old._ts, "前提:_ts は無い");
  // 新形式で完成日を T2 に更新
  const fresh = stampRec(old, { buildDate: "2026-05-09" }, T2);
  const m = mergeRec(old, fresh);
  assert.equal(m.purchaseDate, "2026-05-01", "旧の購入日は残る");
  assert.equal(m.buildDate, "2026-05-09", "新の完成日が勝つ");
});

test("フィールドのクリアも時戳で尊重される(後から空にした方が新しければ空になる)", () => {
  const a = stampRec({ purchaseDate: "2026-05-10" }, { purchaseDate: "2026-05-10" }, T1);
  // 後で T3 に購入日をクリア
  const b = stampRec(a, { purchaseDate: "" }, T3);
  const m = mergeRec(a, b);
  assert.equal(m.purchaseDate, "", "新しいクリアが勝つ");
});

test("古い変更は新しい値を上書きしない", () => {
  const newer = stampRec({}, { buildDate: "2026-05-20" }, T3);
  const older = stampRec({}, { buildDate: "2026-05-01" }, T1);
  assert.equal(mergeRec(newer, older).buildDate, "2026-05-20");
  assert.equal(mergeRec(older, newer).buildDate, "2026-05-20");
});

test("stampRec は patch されたフィールドのみ時戳を更新する", () => {
  const r0 = stampRec({ owned: true, plan: false }, { owned: true }, T1);
  const r1 = stampRec(r0, { plan: true }, T2);
  assert.equal(r1._ts.owned, T1, "owned の時戳は据え置き");
  assert.equal(r1._ts.plan, T2, "plan の時戳のみ更新");
});

test("墓碑(stampRecAll)は古い owned:true を確実に潰す", () => {
  const live = stampRec({}, { owned: true }, T1);
  const tomb = stampRecAll({ owned: false, plan: false, purchaseDate: "", buildDate: "", deleted: true }, T2);
  const m = mergeRec(live, tomb);
  assert.equal(m.owned, false, "削除後は owned が復活しない");
  assert.equal(m.deleted, true);
});

test("mergeRecMap:新規 id は追加、既存 id はフィールド級マージ、欠落 id は温存", () => {
  const prev = {
    k1: stampRec({ owned: true }, { purchaseDate: "2026-05-10" }, T1),
    k2: stampRec({ owned: true }, { owned: true }, T1),
  };
  const incoming = {
    k1: stampRec({ owned: true }, { buildDate: "2026-05-20" }, T2), // 別フィールド
    k3: stampRec({ owned: true }, { owned: true }, T2),             // 新規
  };
  const m = mergeRecMap(prev, incoming);
  assert.equal(m.k1.purchaseDate, "2026-05-10");
  assert.equal(m.k1.buildDate, "2026-05-20");
  assert.ok(m.k2, "incoming に無い k2 は温存");
  assert.ok(m.k3, "新規 k3 は追加");
});

test("mergeArrStamped(customKits)は従来の whole-object LWW を維持", () => {
  const prev = [{ id: "c1", name: "旧", t: T1 }];
  const incoming = [{ id: "c1", name: "新", t: T2 }, { id: "c2", name: "追加", t: T1 }];
  const m = mergeArrStamped(prev, incoming);
  const c1 = m.find((c) => c.id === "c1");
  assert.equal(c1.name, "新", "t の新しい方で丸ごと置換");
  assert.ok(m.find((c) => c.id === "c2"), "新規追加");
});

test("tsOf:_ts 優先、無ければ t から合成", () => {
  assert.deepEqual(tsOf({ a: 1, _ts: { a: T2 }, t: T1 }), { a: T2 });
  assert.deepEqual(tsOf({ a: 1, b: 2, t: T1 }), { a: T1, b: T1 });
});
