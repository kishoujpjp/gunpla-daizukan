import test from "node:test";
import assert from "node:assert/strict";
import { APP_VERSION, cmpVer, hasFeature, FEATURES, ENTITLEMENTS } from "./entitlements.js";
import {
  CATALOG_SCHEMA, validateCatalog, applyCatalog, diffCatalog,
  canonicalCatalog, catalogChecksum, verifyCatalogIntegrity,
} from "./catalog-lib.js";

/* テスト用基礎目錄(ALL_BASE の代役。diffCatalog は依存注入で受ける) */
const BASE = [
  { id: "a1", name: "ガンダム", code: "RX-78-2", line: "", no: "001", series: "s", premium: false, base: false },
  { id: "a2", name: "ザクII", code: "MS-06F", line: "", no: "002", series: "s", premium: false, base: false },
];

/* ═══════════ cmpVer / hasFeature(entitlements) ═══════════ */

test("cmpVer:桁数差・非数値にも耐える緩い semver 比較", () => {
  assert.equal(cmpVer("1.0.0", "1.0.0"), 0);
  assert.equal(cmpVer("1.0.0", "1.0.1"), -1);
  assert.equal(cmpVer("1.10", "1.9"), 1, "数値比較(辞書順でない)");
  assert.equal(cmpVer("1.0", "1.0.0"), 0, "桁数差は 0 詰め");
  assert.equal(cmpVer(null, "0"), 0);
  assert.equal(cmpVer("2.x", "2.0"), 0, "非数値は 0 扱い");
});

test("hasFeature:未宣言の機能は全員可(現状=全機能開放)", () => {
  assert.equal(hasFeature("anything"), true);
  assert.equal(ENTITLEMENTS.tier, "free");
  assert.deepEqual(FEATURES, {}, "宣言が空である限り挙動不変");
});

test("APP_VERSION は semver 形式", () => {
  assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
});

/* ═══════════ validateCatalog ═══════════ */

test("validateCatalog:正常 delta を通す", () => {
  assert.equal(validateCatalog({ catalogVersion: 3 }), true);
  assert.equal(validateCatalog({
    catalogVersion: 3, add: [{ id: "n1", name: "新機" }], patch: { a1: { price: 5500 } },
    retract: ["a2"], notes: "x", minAppVersion: "1.0.0", schema: 1, count: 1,
  }), true);
});

test("validateCatalog:壊れた形を弾く", () => {
  assert.equal(validateCatalog(null), false);
  assert.equal(validateCatalog([]), false);
  assert.equal(validateCatalog({}), false, "catalogVersion 必須");
  assert.equal(validateCatalog({ catalogVersion: "3" }), false, "catalogVersion は number");
  assert.equal(validateCatalog({ catalogVersion: 1, add: {} }), false, "add は配列");
  assert.equal(validateCatalog({ catalogVersion: 1, add: [{ name: "id無し" }] }), false, "id は必須");
  assert.equal(validateCatalog({ catalogVersion: 1, add: [{ id: "x" }, { id: "x" }] }), false, "delta 内重複禁止");
  assert.equal(validateCatalog({ catalogVersion: 1, add: [{ id: "x" }], count: 2 }), false, "count 不一致");
  assert.equal(validateCatalog({ catalogVersion: 1, patch: [] }), false, "patch は object");
});

/* ═══════════ applyCatalog ═══════════ */

test("applyCatalog:add 新規は既定値補完で追記、base は不変(純関数)", () => {
  const out = applyCatalog(BASE, { catalogVersion: 1, add: [{ id: "n1", name: "νガンダム" }] });
  assert.equal(out.length, 3);
  const n = out.find((k) => k.id === "n1");
  assert.equal(n.premium, false, "既定値が補完される");
  assert.equal(n.code, "");
  assert.equal(BASE.length, 2, "元配列は無改変");
});

test("applyCatalog:add が既存 id と衝突したら patch 扱いでマージ", () => {
  const out = applyCatalog(BASE, { catalogVersion: 1, add: [{ id: "a1", price: 5500 }] });
  const a = out.find((k) => k.id === "a1");
  assert.equal(a.price, 5500);
  assert.equal(a.name, "ガンダム", "既存フィールドは温存");
  assert.equal(out.length, 2, "件数は増えない");
});

test("applyCatalog:patch は既存のみ部分更新、未知 id は無視", () => {
  const out = applyCatalog(BASE, { catalogVersion: 1, patch: { a2: { price: 900 }, ghost: { price: 1 } } });
  assert.equal(out.find((k) => k.id === "a2").price, 900);
  assert.equal(out.length, 2);
});

test("applyCatalog:retract は削除せず retracted フラグのみ(記録を孤児化させない)", () => {
  const out = applyCatalog(BASE, { catalogVersion: 1, retract: ["a1"] });
  const a = out.find((k) => k.id === "a1");
  assert.equal(a.retracted, true);
  assert.equal(a.name, "ガンダム", "データ本体は残る");
  assert.equal(out.length, 2);
});

test("applyCatalog:cat=null は base をそのまま返す", () => {
  assert.equal(applyCatalog(BASE, null), BASE);
});

/* ═══════════ diffCatalog(依存注入版) ═══════════ */

test("diffCatalog:added / patched(変更フィールド名付き)/ retracted / restored", () => {
  const prev = { catalogVersion: 1, add: [{ id: "n1", name: "旧新規" }], patch: { a1: { price: 5000 } }, retract: ["a2"] };
  const next = { catalogVersion: 2,
    add: [{ id: "n1", name: "旧新規" }, { id: "n2", name: "今回新規" }],
    patch: { a1: { price: 5500 } },
    retract: [] };
  const d = diffCatalog(prev, next, BASE);
  assert.deepEqual(d.added.map((x) => x.id), ["n2"], "前回から居る n1 は数えない");
  assert.deepEqual(d.patched[0].fields, ["price"], "値が変わったフィールドのみ");
  assert.equal(d.retracted.length, 0);
  assert.deepEqual(d.restored.map((x) => x.id), ["a2"], "retract から外れた=再公開");
  assert.equal(d.restored[0].name, "ザクII", "名前は基礎目錄から解決");
});

test("diffCatalog:prev=null(初回)は全 add が added 扱い", () => {
  const d = diffCatalog(null, { catalogVersion: 1, add: [{ id: "n1", name: "x" }], retract: ["a1"] }, BASE);
  assert.equal(d.added.length, 1);
  assert.equal(d.retracted.length, 1);
});

/* ═══════════ canonical / checksum / integrity ═══════════ */

test("canonicalCatalog:キー順に依存しない決定的 JSON(配列順は保持)", () => {
  const a = canonicalCatalog({ notes: "n", add: [{ id: "x", name: "N" }], patch: { p: { b: 1, a: 2 } }, retract: [] });
  const b = canonicalCatalog({ retract: [], patch: { p: { a: 2, b: 1 } }, add: [{ name: "N", id: "x" }], notes: "n" });
  assert.equal(a, b);
  const c = canonicalCatalog({ add: [{ id: "x" }, { id: "y" }] });
  const d = canonicalCatalog({ add: [{ id: "y" }, { id: "x" }] });
  assert.notEqual(c, d, "配列順は意味を持つ");
});

test("catalogChecksum:決定的・8桁hex・内容変化で変わる。version 等は対象外", () => {
  const d1 = { catalogVersion: 1, add: [{ id: "x", name: "N" }] };
  const h1 = catalogChecksum(d1);
  assert.match(h1, /^[0-9a-f]{8}$/);
  assert.equal(catalogChecksum(d1), h1, "決定的");
  assert.notEqual(catalogChecksum({ ...d1, add: [{ id: "x", name: "M" }] }), h1, "内容変化で変わる");
  assert.equal(catalogChecksum({ ...d1, catalogVersion: 99, generatedAt: "t" }), h1, "version/generatedAt は checksum 対象外");
});

test("verifyCatalogIntegrity:checksum/schema は在る時だけ検証", () => {
  const d = { catalogVersion: 1, add: [{ id: "x", name: "N" }] };
  assert.equal(verifyCatalogIntegrity(d), true, "checksum 無し=現状不変で通す");
  assert.equal(verifyCatalogIntegrity({ ...d, checksum: catalogChecksum(d) }), true, "一致→通す");
  assert.equal(verifyCatalogIntegrity({ ...d, checksum: "deadbeef" }), false, "不一致→拒否");
  assert.equal(verifyCatalogIntegrity({ ...d, schema: CATALOG_SCHEMA + 1 }), false, "client が古すぎ→拒否");
  assert.equal(verifyCatalogIntegrity({ ...d, schema: CATALOG_SCHEMA }), true);
});
