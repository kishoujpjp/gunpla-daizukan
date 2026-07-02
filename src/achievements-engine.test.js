import test from "node:test";
import assert from "node:assert/strict";
import {
  gradeOf, factionOf, matchOne, assignDistinct,
  evalRule, evaluateAchievements, newlyUnlocked, newlyGold, explainAchievement,
} from "./achievements-engine.js";

/* ── テスト用 kit ファクトリ ──
   実データ(kits-data.js)には依存しない最小 fixture。 */
let seq = 0;
const kit = (over = {}) => ({
  id: over.id || "k" + (++seq),
  name: "テスト機", code: "RX-78-2", grade: "MG", line: "", series: "機動戦士ガンダム",
  premium: false, base: false, ...over,
});

/* evaluateAchievements 用:records マップ → getRec */
const getRecOf = (records) => (id) => records[id] || { owned: false };

/* ═══════════ gradeOf / factionOf ═══════════ */

test("gradeOf:grade 未指定は MG 扱い", () => {
  assert.equal(gradeOf({}), "MG");
  assert.equal(gradeOf({ grade: "HG" }), "HG");
});

test("factionOf:RX-/RGM- は連邦、MS-/MSN- はジオン、その他は other", () => {
  assert.equal(factionOf(kit({ code: "RX-78-2" })), "federation");
  assert.equal(factionOf(kit({ code: "RGM-79" })), "federation");
  assert.equal(factionOf(kit({ code: "MS-06F" })), "zeon");
  assert.equal(factionOf(kit({ code: "MSN-04" })), "zeon");
  assert.equal(factionOf(kit({ code: "XXXG-01W" })), "other");
});

/* ═══════════ matchOne ═══════════ */

test("matchOne:code '—'(配件)は既定で除外、accessory:true で許可", () => {
  const acc = kit({ code: "\u2014", name: "ミッションパック" });
  assert.equal(matchOne({ nameIncludes: "ミッション" }, acc), false, "既定は除外");
  assert.equal(matchOne({ nameIncludes: "ミッション", accessory: true }, acc), true, "accessory 指定で計数");
});

test("matchOne:id / idIn / codePrefix / nameIncludes / nameAll / nameExcludes", () => {
  const k = kit({ id: "x1", code: "RX-93", name: "νガンダム Ver.Ka" });
  assert.equal(matchOne({ id: "x1" }, k), true);
  assert.equal(matchOne({ id: "x2" }, k), false);
  assert.equal(matchOne({ idIn: ["a", "x1"] }, k), true);
  assert.equal(matchOne({ codePrefix: "RX-9" }, k), true);
  assert.equal(matchOne({ codePrefix: "MS-" }, k), false);
  assert.equal(matchOne({ nameIncludes: "νガンダム" }, k), true);
  assert.equal(matchOne({ nameAll: ["ν", "Ver.Ka"] }, k), true);
  assert.equal(matchOne({ nameAll: ["ν", "HWS"] }, k), false);
  assert.equal(matchOne({ nameIncludes: "ν", nameExcludes: "Ver.Ka" }, k), false);
  assert.equal(matchOne({ nameIncludes: "ν", nameExcludes: ["HWS", "Ver.Ka"] }, k), false);
});

test("matchOne:grade / series / premium / base フィルタ", () => {
  const k = kit({ grade: "HG", series: "機動戦士Zガンダム", premium: true, base: false });
  assert.equal(matchOne({ grade: "HG" }, k), true);
  assert.equal(matchOne({ grade: "MG" }, k), false);
  assert.equal(matchOne({ series: "Zガンダム" }, k), true);
  assert.equal(matchOne({ premium: true }, k), true);
  assert.equal(matchOne({ premium: false }, k), false);
  assert.equal(matchOne({ base: false }, k), true);
});

/* ═══════════ assignDistinct(最大二分マッチング) ═══════════ */

test("assignDistinct:貪欲では取りこぼす配置でも Kuhn 増広路で全割当できる", () => {
  // piece0 の候補 = {A,B} / piece1 の候補 = {A} 。
  // piece0 が先に A を取る貪欲だと piece1 が死ぬが、増広路で A を譲り B を取る。
  const A = kit({ id: "A", name: "共有候補" });
  const B = kit({ id: "B", name: "専用候補" });
  const sels = [{ idIn: ["A", "B"] }, { idIn: ["A"] }];
  const r = assignDistinct(sels, [A, B]);
  assert.equal(r.ok, true);
  assert.equal(r.count, 2);
  assert.deepEqual([...r.ids].sort(), ["A", "B"]);
});

test("assignDistinct:1台が複数 piece を同時に満たす水増しをしない", () => {
  // 両 piece とも候補は A のみ → 相異割当は 1 つまで
  const A = kit({ id: "A" });
  const r = assignDistinct([{ idIn: ["A"] }, { idIn: ["A"] }], [A]);
  assert.equal(r.ok, false);
  assert.equal(r.count, 1, "進捗も 1 のまま(2 に水増ししない)");
});

test("assignDistinct:候補ゼロの piece は null のまま", () => {
  const A = kit({ id: "A" });
  const r = assignDistinct([{ idIn: ["A"] }, { idIn: ["Z"] }], [A]);
  assert.equal(r.ok, false);
  assert.equal(r.assign[0], "A");
  assert.equal(r.assign[1], null);
});

/* ═══════════ evalRule ═══════════ */

test("evalRule match:n 件以上で解錠、cur は n で頭打ち", () => {
  const pool = [kit({ code: "MS-06F" }), kit({ code: "MS-06S" }), kit({ code: "MS-06R" })];
  const r = evalRule({ match: { codePrefix: "MS-06" }, n: 2 }, pool);
  assert.equal(r.unlocked, true);
  assert.equal(r.cur, 2, "cur は need で頭打ち");
  assert.equal(r.need, 2);
});

test("evalRule count:gte 未達なら unlocked=false・cur は実数", () => {
  const pool = [kit({ code: "RX-78-2" })];
  const r = evalRule({ count: { codePrefix: "RX-" }, gte: 3 }, pool);
  assert.equal(r.unlocked, false);
  assert.equal(r.cur, 1);
  assert.equal(r.need, 3);
});

test("evalRule all(単純 match 群):相異機体割当で判定", () => {
  const g1 = kit({ id: "g1", code: "RX-78-2", name: "ガンダム" });
  const z1 = kit({ id: "z1", code: "MS-06F", name: "ザクII" });
  const rule = { all: [{ match: { codePrefix: "RX-" } }, { match: { codePrefix: "MS-" } }] };
  const ok = evalRule(rule, [g1, z1]);
  assert.equal(ok.unlocked, true);
  assert.equal(ok.cur, 2);
  const ng = evalRule(rule, [g1]);
  assert.equal(ng.unlocked, false);
  assert.equal(ng.cur, 1);
});

test("evalRule any:いずれか成立で解錠、cur は最大値", () => {
  const pool = [kit({ code: "RX-78-2" })];
  const rule = { any: [{ match: { codePrefix: "MS-" } }, { match: { codePrefix: "RX-" } }] };
  const r = evalRule(rule, pool);
  assert.equal(r.unlocked, true);
  assert.equal(r.need, 1);
});

test("evalRule sameCodeAcrossGrades:同一型式番号を指定グレード全てで所持", () => {
  const pool = [
    kit({ code: "RX-78-2", grade: "MG" }),
    kit({ code: "RX-78-2", grade: "HG" }),
    kit({ code: "MS-06F", grade: "MG" }),
  ];
  const ok = evalRule({ sameCodeAcrossGrades: ["MG", "HG"] }, pool);
  assert.equal(ok.unlocked, true);
  const ng = evalRule({ sameCodeAcrossGrades: ["MG", "HG", "PG"] }, pool);
  assert.equal(ng.unlocked, false);
});

test("evalRule:未知ルール形は安全側(false)", () => {
  const r = evalRule({}, [kit()]);
  assert.equal(r.unlocked, false);
});

/* ═══════════ evaluateAchievements(三段勲位) ═══════════ */

test("勲位:未入手=灰(0) / 全入手=銀(1) / 全入手+全完成=金(2)", () => {
  const g = kit({ id: "g", code: "RX-78-2" });
  const z = kit({ id: "z", code: "MS-06F" });
  const rules = [{ id: "t1", no: 1, name: "宿命の対決", rule: { all: [{ match: { id: "g" } }, { match: { id: "z" } }] } }];

  // 灰:片方しか持っていない
  let ev = evaluateAchievements(rules, [g, z], getRecOf({ g: { owned: true } }))[0];
  assert.equal(ev.tier, 0);
  assert.equal(ev.unlocked, false);

  // 銀:両方入手、完成は片方のみ
  ev = evaluateAchievements(rules, [g, z], getRecOf({
    g: { owned: true, buildDate: "2026-01-01" }, z: { owned: true },
  }))[0];
  assert.equal(ev.tier, 1);
  assert.equal(ev.silver, true);
  assert.equal(ev.unlocked, true, "銀以上で称号獲得");
  assert.equal(ev.needBuild, true);

  // 金:両方入手かつ両方完成
  ev = evaluateAchievements(rules, [g, z], getRecOf({
    g: { owned: true, buildDate: "2026-01-01" }, z: { owned: true, buildDate: "2026-02-01" },
  }))[0];
  assert.equal(ev.tier, 2);
  assert.equal(ev.gold, true);
  assert.equal(ev.needBuild, false);
});

test("評価池:既定は MG のみ、scope:'full' で全グレード", () => {
  const hg = kit({ id: "h", code: "RX-78-2", grade: "HG" });
  const recs = getRecOf({ h: { owned: true } });
  const mgOnly = evaluateAchievements([{ id: "a", rule: { match: { codePrefix: "RX-" } } }], [hg], recs)[0];
  assert.equal(mgOnly.unlocked, false, "HG 機は既定池に入らない");
  const full = evaluateAchievements([{ id: "a", scope: "full", rule: { match: { codePrefix: "RX-" } } }], [hg], recs)[0];
  assert.equal(full.unlocked, true, "scope:full なら HG も対象");
});

test("金章判定:未完成機を貪欲に使った誤金章が起きない(完成プール再評価)", () => {
  // 同型 2 台。1 台だけ完成 → count gte:2 は入手で成立(銀)だが完成では不成立(金にしない)。
  const a = kit({ id: "a", code: "MS-06F" });
  const b = kit({ id: "b", code: "MS-06J" });
  const rules = [{ id: "c", rule: { count: { codePrefix: "MS-06" }, gte: 2 } }];
  const ev = evaluateAchievements(rules, [a, b], getRecOf({
    a: { owned: true, buildDate: "2026-01-01" }, b: { owned: true },
  }))[0];
  assert.equal(ev.tier, 1);
  assert.equal(ev.builtCur, 1);
  assert.equal(ev.builtNeed, 2);
});

/* ═══════════ 差分検出(トースト) ═══════════ */

test("newlyUnlocked / newlyGold:前回集合との差分のみ返す", () => {
  const evaluated = [
    { id: "a", unlocked: true, gold: false },
    { id: "b", unlocked: true, gold: true },
    { id: "c", unlocked: false, gold: false },
  ];
  assert.deepEqual(newlyUnlocked(new Set(["a"]), evaluated), ["b"]);
  assert.deepEqual(newlyGold(new Set(), evaluated), ["b"]);
  assert.deepEqual(newlyGold(new Set(["b"]), evaluated), []);
});

/* ═══════════ explainAchievement(内訳) ═══════════ */

test("explainAchievement combo:pieces の satisfied と buildGate.pending が正しい", () => {
  const g = kit({ id: "g", code: "RX-78-2", name: "ガンダム" });
  const z = kit({ id: "z", code: "MS-06F", name: "ザクII" });
  const ach = { id: "t", rule: { all: [{ match: { id: "g" } }, { match: { id: "z" } }] } };
  const recs = getRecOf({ g: { owned: true, buildDate: "2026-01-01" }, z: { owned: true } });
  const ex = explainAchievement(ach, [g, z], recs);
  assert.equal(ex.kind, "combo");
  assert.equal(ex.pieces.length, 2);
  assert.ok(ex.pieces.every((p) => p.satisfied), "両 piece とも入手済み");
  assert.equal(ex.buildGate.satisfied, false, "ザク未完成 → 金章ゲート未達");
  assert.deepEqual(ex.buildGate.pending, ["ザクII"]);
});

test("explainAchievement count:have / need / candidates を返す", () => {
  const a = kit({ id: "a", code: "MS-06F" });
  const b = kit({ id: "b", code: "MS-06J" });
  const ach = { id: "c", rule: { count: { codePrefix: "MS-06" }, gte: 2 } };
  const ex = explainAchievement(ach, [a, b], getRecOf({ a: { owned: true } }));
  assert.equal(ex.kind, "count");
  assert.equal(ex.have.length, 1);
  assert.equal(ex.need, 2);
  assert.equal(ex.candidates.length, 2, "未所持も候補に出る");
});
