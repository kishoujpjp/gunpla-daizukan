import test from "node:test";
import assert from "node:assert/strict";
import {
  SECRET_KEYS, stripSecrets, metaForCloud,
  validateBackup, SCHEMA_VERSION, migrateMeta,
  hashId, shardKey, xtraKey, IMG_SHARDS, XTRA_SHARDS,
  newXid, kitExtraIds, albumRefs, refSrc, pickRef, thumbSrcOf, hasAnyImage, imgMetaFrom,
  clampFraming, isDefaultFraming, framingStyle,
} from "./storage-lib.js";

/* ═══════════ 機密剝離 ═══════════ */

test("stripSecrets:機密キーは値を空にせず【削除】する(端末値温存の前提)", () => {
  const s = stripSecrets({ geminiKey: "AIza...", openaiKey: "sk-...", supaKey: "x", supaUrl: "https://x", lang: "ja" });
  for (const k of SECRET_KEYS) assert.equal(k in s, false, k + " はキーごと消える");
  assert.equal(s.lang, "ja", "非機密は残る");
});

test("metaForCloud:META JSON から settings の機密だけ抜く。壊れた JSON は素通し", () => {
  const meta = JSON.stringify({ records: { a: { owned: true } }, settings: { geminiKey: "AIza", lang: "ja" } });
  const out = JSON.parse(metaForCloud(meta));
  assert.equal("geminiKey" in out.settings, false);
  assert.equal(out.settings.lang, "ja");
  assert.deepEqual(out.records, { a: { owned: true } }, "records は無傷");
  assert.equal(metaForCloud("not-json{{"), "not-json{{", "破損時は原文を返す(送信を止めない)");
});

/* ═══════════ バックアップ検証 ═══════════ */

test("validateBackup:正常形は null(エラーなし)", () => {
  assert.equal(validateBackup({}), null);
  assert.equal(validateBackup({
    records: { k1: { owned: true } },
    overrides: { k1: { price: 5500 } },
    images: { k1: "data:image/jpeg;base64,xx" },
    settings: { lang: "ja" },
    customKits: [{ id: "c1", name: "自作" }],
  }), null);
});

test("validateBackup:壊れた形はユーザ向けメッセージ(文字列)を返す", () => {
  assert.equal(typeof validateBackup(null), "string");
  assert.equal(typeof validateBackup([1, 2]), "string");
  assert.equal(typeof validateBackup({ records: [] }), "string", "records が配列");
  assert.equal(typeof validateBackup({ records: { k: "str" } }), "string", "record 値が非 object");
  assert.equal(typeof validateBackup({ images: { k: 123 } }), "string", "image 値が非文字列");
  assert.equal(typeof validateBackup({ customKits: [{ name: "id無し" }] }), "string", "customKit に id 無し");
});

/* ═══════════ スキーマ遷移 ═══════════ */

test("migrateMeta:版数無印は v2 とみなし現行版まで遷移する", () => {
  const d = migrateMeta({ records: {} });
  assert.equal(d.schemaVersion, SCHEMA_VERSION);
});

test("migrateMeta:未来版はそのまま保持(前方互換・降格しない)", () => {
  const d = migrateMeta({ schemaVersion: SCHEMA_VERSION + 5 });
  assert.equal(d.schemaVersion, SCHEMA_VERSION + 5);
});

test("migrateMeta:非 object 入力は素通し", () => {
  assert.equal(migrateMeta(null), null);
  assert.deepEqual(migrateMeta([1]), [1]);
});

/* ═══════════ シャード ═══════════ */

test("hashId は決定的、shardKey/xtraKey はシャード数の範囲内", () => {
  assert.equal(hashId("mg001"), hashId("mg001"));
  for (const id of ["mg001", "hguc191", "pb-x", "自作001"]) {
    const s = parseInt(shardKey(id).replace("mg_imgs_", ""), 10);
    assert.ok(s >= 0 && s < IMG_SHARDS);
    const x = parseInt(xtraKey(id + "~abc").replace("mg_xtra_", ""), 10);
    assert.ok(x >= 0 && x < XTRA_SHARDS);
  }
});

/* ═══════════ アルバム(複数画像)モデル ═══════════ */

test("newXid / kitExtraIds:接頭一致で該当機体の追加画像のみ拾う", () => {
  const xid = newXid("kit1");
  assert.ok(xid.startsWith("kit1~"));
  const extras = { [xid]: "d1", "kit1~zzz": "d2", "kit10~aaa": "d3" };
  const ids = kitExtraIds("kit1", extras);
  assert.equal(ids.length, 2, "kit10 の画像を誤って含めない(接頭 'kit1~' 判定)");
  assert.ok(ids.every((i) => i.startsWith("kit1~")));
});

test("albumRefs:meta.order を尊重、無効 ref は除去、残りは primary 先頭で補完", () => {
  const images = { kit1: "main" };
  const extras = { "kit1~a": "d1", "kit1~b": "d2" };
  // order に存在しない ref(ghost)と、order 未収載の kit1~b が混在
  const meta = { kit1: { order: ["kit1~a", "ghost", "primary"] } };
  const refs = albumRefs("kit1", images, extras, meta);
  assert.deepEqual(refs, ["kit1~a", "primary", "kit1~b"], "order 優先 → 残りを補完");
});

test("albumRefs:meta 無しなら primary が先頭", () => {
  const refs = albumRefs("kit1", { kit1: "m" }, { "kit1~a": "x" }, null);
  assert.equal(refs[0], "primary");
});

test("refSrc / pickRef / thumbSrcOf:役割 ref が失われたら先頭へフォールバック", () => {
  const images = { kit1: "MAIN" };
  const extras = { "kit1~a": "EXTRA" };
  assert.equal(refSrc("primary", "kit1", images, extras), "MAIN");
  assert.equal(refSrc("kit1~a", "kit1", images, extras), "EXTRA");
  // thumb 指定が有効
  let meta = { kit1: { thumb: "kit1~a" } };
  assert.equal(thumbSrcOf("kit1", images, extras, meta), "EXTRA");
  // thumb 指定の画像が削除済み → 先頭(primary)へ
  meta = { kit1: { thumb: "kit1~deleted" } };
  assert.equal(thumbSrcOf("kit1", images, extras, meta), "MAIN");
});

test("hasAnyImage / imgMetaFrom", () => {
  assert.equal(hasAnyImage("k", {}, {}), false);
  assert.equal(hasAnyImage("k", { k: "m" }, {}), true);
  assert.equal(hasAnyImage("k", {}, { "k~a": "x" }), true);
  const meta = { k: { imeta: { primary: { src: "camera", at: "2026" } } } };
  assert.deepEqual(imgMetaFrom(meta, "k", "primary"), { src: "camera", at: "2026" });
  assert.equal(imgMetaFrom(meta, "k", "k~a"), null);
});

/* ═══════════ 構図(framing) ═══════════ */

test("clampFraming:scale∈[0.2,3]、平移は ±520 にクランプ", () => {
  const c = clampFraming({ scale: 99, x: 9999, y: -9999 });
  assert.equal(c.scale, 3);
  assert.equal(c.x, 520);
  assert.equal(c.y, -520);
  assert.equal(clampFraming({ scale: 0.01 }).scale, 0.2, "letterbox 下限 0.2");
  assert.equal(clampFraming(null), null);
});

test("clampFraming:アスペクト a は正の有限値のみ保持", () => {
  assert.equal(clampFraming({ scale: 1.5, a: 1.78 }).a, 1.78);
  assert.equal("a" in clampFraming({ scale: 1.5, a: -1 }), false);
  assert.equal("a" in clampFraming({ scale: 1.5, a: Infinity }), false);
});

test("isDefaultFraming:scale≈1 かつ無移動のみ既定。scale<1 は既定でない", () => {
  assert.equal(isDefaultFraming(null), true);
  assert.equal(isDefaultFraming({ scale: 1, x: 0, y: 0 }), true);
  assert.equal(isDefaultFraming({ scale: 1.004, x: 0.4, y: 0 }), true, "許容誤差内");
  assert.equal(isDefaultFraming({ scale: 0.8, x: 0, y: 0 }), false, "letterbox は transform 適用対象");
  assert.equal(isDefaultFraming({ scale: 1, x: 5, y: 0 }), false);
});

test("framingStyle:既定は undefined、正方形容器は素の transform 文字列", () => {
  assert.equal(framingStyle(null), undefined);
  assert.equal(framingStyle({ scale: 1, x: 0, y: 0 }), undefined);
  const st = framingStyle({ scale: 2, x: 10, y: -5 });
  assert.equal(st.transform, "translate(10%, -5%) scale(2)");
  assert.equal(st.transformOrigin, "center center");
});

test("framingStyle:a 無しの旧データは非正方形容器でも旧式 transform(後方互換)", () => {
  const st = framingStyle({ scale: 2, x: 10, y: 0 }, 16 / 9);
  assert.equal(st.transform, "translate(10%, 0%) scale(2)");
});

test("framingStyle:a 有り+非正方形は再計算 transform を返す(有限値・書式検証)", () => {
  const st = framingStyle({ scale: 1.6, x: 12, y: -8, a: 1.5 }, 16 / 9);
  assert.ok(st && st.transform, "transform を生成");
  const m = st.transform.match(/^translate\((-?[\d.]+)%, (-?[\d.]+)%\) scale\(([\d.]+)\)$/);
  assert.ok(m, "書式: translate(x%, y%) scale(s)");
  const [, tx, ty, s] = m.map(Number);
  assert.ok(isFinite(tx) && isFinite(ty) && isFinite(s));
  assert.ok(s > 0, "scale は正");
});

test("framingStyle:恒等 framing(a 有り・容器も同アスペクト)は cover と整合する変換になる", () => {
  // scale=1・無移動は isDefault で undefined(そもそも変換不要)
  assert.equal(framingStyle({ scale: 1, x: 0, y: 0, a: 1.5 }, 1.5), undefined);
});
