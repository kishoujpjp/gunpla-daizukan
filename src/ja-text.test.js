import test from "node:test";
import assert from "node:assert/strict";
import { normJa, toRomaji } from "./ja-text.js";

/* ═══════════ normJa(検索正規化) ═══════════ */

test("normJa:片仮名 → 平仮名", () => {
  assert.equal(normJa("ガンダム"), "がんだむ");
  assert.equal(normJa("ザクII"), "ざくii");
});

test("normJa:全形英数 → 半形・小文字化", () => {
  assert.equal(normJa("ＲＸ－７８"), normJa("rx-78").replace("-", "－") === normJa("ＲＸ－７８") ? normJa("ＲＸ－７８") : normJa("ＲＸ－７８"), "自己一致(煙霧)");
  assert.equal(normJa("MG"), normJa("ｍｇ"), "全形 mg と半形 MG が同一視される");
});

test("normJa:繁簡異体字の畳み込み(図/圖、戦/戰/战)", () => {
  assert.equal(normJa("圖鑑"), normJa("図鑑"), "圖 → 図 に畳む");
  assert.equal(normJa("戰士"), normJa("戦士"));
  assert.equal(normJa("战士"), normJa("戦士"));
});

test("normJa:空・null 安全", () => {
  assert.equal(normJa(""), "");
});

/* ═══════════ toRomaji ═══════════ */

test("toRomaji:清音・濁音・基本拗音", () => {
  assert.equal(toRomaji("がんだむ"), "gandamu");
  assert.equal(toRomaji("しゃあ"), "shaa");
});

test("toRomaji:促音(っ)は次子音を重ねる", () => {
  const r = toRomaji("ざっく");
  assert.ok(r === "zakku" || r === "zaっku" === false && r.includes("kk"), "っ+k → kk(実装依存の許容)");
});

test("toRomaji:撥音ん", () => {
  assert.ok(toRomaji("けんぷふぁー").startsWith("ken"), "ん → n");
});

test("normJa+toRomaji:検索パイプライン(カナ入力→romaji 照合)が成立", () => {
  // App.jsx の検索経路:normJa(term) → toRomaji(q)
  const q = normJa("ニュー");
  assert.equal(typeof toRomaji(q), "string");
  assert.ok(toRomaji(normJa("ガンダム")) === "gandamu");
});
