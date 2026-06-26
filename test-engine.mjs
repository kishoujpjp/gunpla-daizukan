import { evaluateAchievements, evalRule, assignDistinct, matchOne } from "./achievements-engine.js";

let pass = 0, fail = 0;
const eq = (got, exp, msg) => {
  const g = JSON.stringify(got), e = JSON.stringify(exp);
  if (g === e) { pass++; }
  else { fail++; console.log(`  ✗ ${msg}\n      期待 ${e} / 実際 ${g}`); }
};

// 機体生成(matchOne が読むフィールドのみ)
const k = (id, code, name, series = "", grade = "MG") =>
  ({ id, code, name, series, grade, line: "", premium: false, base: false });
// getRec スタブ:owned 集合 / built 集合で制御
const mkRec = (ownedIds, builtIds = []) => (id) =>
  ({ owned: ownedIds.includes(id), buildDate: builtIds.includes(id) ? "2024-01-01" : "" });

console.log("── assignDistinct(厳密最大マッチング) ──");
// 重複候補:2 piece が同一機体しか満たせない → count=1(水増ししない)
{
  const sels = [{ grade: "MG" }, { grade: "MG" }];
  const owned = [k("a", "RX-78-2", "ガンダム")];
  const r = assignDistinct(sels, owned);
  eq(r.count, 1, "重複候補:count は 1(水増ししない)");
  eq(r.ok, false, "重複候補:ok=false");
}
// 全 piece に相異機体:ok=true count=3
{
  const sels = [{ codePrefix: "MS-06" }, { codePrefix: "RX-78" }, { codePrefix: "MSN-" }];
  const owned = [k("z", "MS-06S", "ザク"), k("g", "RX-78-2", "ガンダム"), k("s", "MSN-04", "サザビー")];
  const r = assignDistinct(sels, owned);
  eq(r.count, 3, "相異3機:count=3"); eq(r.ok, true, "相異3機:ok=true");
}
// 増広必要:A,B,C が機体1,2 を取り合い(3 piece・2 機体)→ 最大2
{
  const sels = [{ nameIncludes: "甲" }, { nameIncludes: "甲" }, { nameIncludes: "乙" }];
  const owned = [k("p", "X", "甲機"), k("q", "Y", "甲乙機")]; // q は甲乙両方に該当
  const r = assignDistinct(sels, owned);
  eq(r.count, 2, "3piece/2機:最大マッチング=2"); eq(r.ok, false, "3piece/2機:ok=false");
}

console.log("── evalRule:rule.all simple(進捗 cur の水増し回帰) ──");
{
  // 重複条件の成就。MG を1台だけ所持 → cur=1(旧実装は 2 に水増しした)
  const rule = { all: [{ match: { grade: "MG" } }, { match: { grade: "MG" } }] };
  const owned = [k("a", "RX-78-2", "ガンダム")];
  const ev = evalRule(rule, owned);
  eq(ev.cur, 1, "cur=1(満格に水増ししない)");
  eq(ev.unlocked, false, "未解錠");
  eq(ev.need, 2, "need=2");
}
{
  // 2機を相異に満たす → 解錠・cur=2
  const rule = { all: [{ match: { codePrefix: "MS-06" } }, { match: { codePrefix: "RX-78" } }] };
  const owned = [k("z", "MS-06S", "ザク"), k("g", "RX-78-2", "ガンダム")];
  const ev = evalRule(rule, owned);
  eq(ev.cur, 2, "cur=2"); eq(ev.unlocked, true, "解錠");
}

console.log("── evaluateAchievements:tier(金/銀/灰)伝播 ──");
{
  const rules = [{ id: "t1", universe: "UC", name: "二機",
    rule: { all: [{ match: { codePrefix: "MS-06" } }, { match: { codePrefix: "RX-78" } }] } }];
  const allKits = [k("z", "MS-06S", "ザク"), k("g", "RX-78-2", "ガンダム")];
  // 全入手・未制作 → 銀(tier1)
  let res = evaluateAchievements(rules, allKits, mkRec(["z", "g"], []))[0];
  eq([res.tier, res.silver, res.gold], [1, true, false], "全入手・未制作=銀");
  // 全入手・全制作 → 金(tier2)
  res = evaluateAchievements(rules, allKits, mkRec(["z", "g"], ["z", "g"]))[0];
  eq([res.tier, res.gold], [2, true], "全入手・全制作=金");
  // 1台のみ → 灰(tier0)・cur=1
  res = evaluateAchievements(rules, allKits, mkRec(["z"], []))[0];
  eq([res.tier, res.cur, res.need], [0, 1, 2], "1台のみ=灰・cur=1/2");
}

console.log("── 実データ冒煙テスト ──");
{
  const { ACHIEVEMENTS } = await import("./achievements-rules.js");
  const { ALL_BASE } = await import("./kits-data.js");
  // 全機 owned+built
  const allOwned = (id) => ({ owned: true, buildDate: "2024-01-01" });
  const noneOwned = (id) => ({ owned: false, buildDate: "" });
  const full = evaluateAchievements(ACHIEVEMENTS, ALL_BASE, allOwned);
  const none = evaluateAchievements(ACHIEVEMENTS, ALL_BASE, noneOwned);
  eq(full.length, ACHIEVEMENTS.length, `評価件数=ルール件数(${ACHIEVEMENTS.length})`);
  eq(none.every((e) => e.tier === 0), true, "未所持なら全て灰(tier0)");
  const golds = full.filter((e) => e.gold).length;
  console.log(`  (参考)全機所持+制作で金章 ${golds}/${full.length} 件`);
  eq(golds > 0, true, "全所持+制作で金章が1件以上出る");
  // cur が need を超えない(水増し検出)
  eq(full.every((e) => e.cur <= e.need), true, "全成就で cur<=need(水増しなし)");
  eq(none.every((e) => e.cur === 0), true, "未所持なら cur=0");
}

console.log(`\n結果: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
