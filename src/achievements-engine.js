/* ───────────────────────────────────────────────────────────
   成就判定エンジン(純関数・フレームワーク非依存)
   ・rules(achievements-rules.js)を allKits + records に対して評価
   ・各成就に {unlocked, cur, need} を返す(cur/need は進捗バー用)
   使い方:
     import { ACHIEVEMENTS } from "./achievements-rules.js";
     import { evaluateAchievements } from "./achievements-engine.js";
     const titles = evaluateAchievements(ACHIEVEMENTS, allKits, getRec);
   ─────────────────────────────────────────────────────────── */

export const gradeOf = (k) => (k.grade || "MG");

/* faction 推導:型式番号の接頭+作品名から。例外は OVERRIDE で上書き。 */
const FACTION_OVERRIDE = {
  // 例: 鹵獲機・連邦運用のジオン機など。必要に応じて id→faction を追記。
  // "b0xx": "federation",
};
export function factionOf(k) {
  if (FACTION_OVERRIDE[k.id]) return FACTION_OVERRIDE[k.id];
  const c = k.code || "", s = k.series || "";
  if (/ジオン|ZZ/.test(s) && /^(MS-|MSM-|MSN-|AMX-)/.test(c)) return "zeon";
  if (/^(RX-|RGM-|RGC-|RGZ-|FA-|GP|RB-|FF-|FXA|PF-)/.test(c)) return "federation";
  if (/^(MS-|MSM-|MSN-|AMX-|YMS-|RMS-|AMS-|PMX-|NZ-)/.test(c)) return "zeon";
  return "other";
}

/* 単体セレクタ。code==="—"(型式なし=拡張/配件)は既定で除外。
   F90 ミッションパック計数など配件を数えたい時のみ {accessory:true}。 */
export function matchOne(sel, k) {
  if (k.code === "\u2014" && !sel.accessory) return false;
  if (sel.id && k.id !== sel.id) return false;
  if (sel.idIn && sel.idIn.indexOf(k.id) < 0) return false;
  if (sel.code && k.code !== sel.code) return false;
  if (sel.codePrefix && (k.code || "").indexOf(sel.codePrefix) !== 0) return false;
  if (sel.nameIncludes && (k.name || "").indexOf(sel.nameIncludes) < 0) return false;
  if (sel.nameAll && !sel.nameAll.every((t) => (k.name || "").indexOf(t) >= 0)) return false;
  if (sel.nameExcludes) {
    const ex = Array.isArray(sel.nameExcludes) ? sel.nameExcludes : [sel.nameExcludes];
    if (ex.some((t) => (k.name || "").indexOf(t) >= 0)) return false;
  }
  if (sel.series && (k.series || "").indexOf(sel.series) < 0) return false;
  if (sel.grade && gradeOf(k) !== sel.grade) return false;
  if (sel.line && k.line !== sel.line) return false;
  if (sel.faction && factionOf(k) !== sel.faction) return false;
  if (sel.premium !== undefined && !!k.premium !== sel.premium) return false;
  if (sel.base !== undefined && !!k.base !== sel.base) return false;
  return true;
}
const kitsMatching = (sel, pool) => pool.filter((k) => matchOne(sel, k));

/* AND 組合せ:各 piece に「異なる機体」を割り当てられるか(貪欲・候補少ない順)。
   これにより 1 台が複数 piece を同時に満たす誤判定を防ぐ。
   返値: { ok, satisfied }(satisfied=最低1台命中した piece 数=進捗) */
function assignDistinct(sels, owned) {
  const cand = sels.map((s) => kitsMatching(s, owned).map((k) => k.id));
  const order = cand.map((_, i) => i).sort((a, b) => cand[a].length - cand[b].length);
  const used = new Set();
  let ok = true;
  for (const i of order) {
    const pick = cand[i].find((id) => !used.has(id));
    if (pick === undefined) { ok = false; continue; }
    used.add(pick);
  }
  const satisfied = cand.filter((c) => c.length).length;
  return { ok, satisfied };
}

/* ルール評価 → { unlocked, cur, need } */
export function evalRule(rule, owned) {
  if (rule.match) {
    const n = rule.n || 1, c = kitsMatching(rule.match, owned).length;
    return { unlocked: c >= n, cur: Math.min(c, n), need: n };
  }
  if (rule.all) {
    const simple = rule.all.every((p) => p.match);
    if (simple) {
      const sels = rule.all.map((p) => p.match);
      const { ok, satisfied } = assignDistinct(sels, owned);
      return { unlocked: ok, cur: ok ? sels.length : satisfied, need: sels.length };
    }
    const sub = rule.all.map((p) => evalRule(p, owned));
    return { unlocked: sub.every((s) => s.unlocked),
             cur: sub.filter((s) => s.unlocked).length, need: sub.length };
  }
  if (rule.any) {
    const sub = rule.any.map((p) => evalRule(p, owned));
    return { unlocked: sub.some((s) => s.unlocked),
             cur: Math.max(0, ...sub.map((s) => s.cur)), need: 1 };
  }
  if (rule.count) {
    const c = kitsMatching(rule.count, owned).length;
    return { unlocked: c >= rule.gte, cur: Math.min(c, rule.gte), need: rule.gte };
  }
  if (rule.sameCodeAcrossGrades) {
    const grades = rule.sameCodeAcrossGrades;
    const byCode = new Map();
    for (const k of owned) {
      if (!k.code || k.code === "\u2014") continue;
      (byCode.get(k.code) || byCode.set(k.code, new Set()).get(k.code)).add(gradeOf(k));
    }
    let hits = 0;
    for (const gs of byCode.values()) if (grades.every((g) => gs.has(g))) hits++;
    return { unlocked: hits >= 1, cur: hits ? 1 : 0, need: 1 };
  }
  return { unlocked: false, cur: 0, need: 1 };
}

/* 全成就を評価。
   ・評価池は既定で MG-class(gradeOf==="MG"。Ver.Ka/MGEX 含む)のみ。
     → UC 称号は MG コレクションを対象とする。
   ・rule.scope==="full" の時だけ全 grade を見る(親子丼・三段活用など跨 grade 用)。
   ・rule.state==="built" の時は完成済み集合で判定(既定は owned)。 */
export function evaluateAchievements(rules, allKits, getRec) {
  const isMG = (k) => gradeOf(k) === "MG";
  const ownedFull = allKits.filter((k) => getRec(k.id).owned);
  const builtFull = allKits.filter((k) => !!getRec(k.id).buildDate);
  const ownedMG = ownedFull.filter(isMG);
  const builtMG = builtFull.filter(isMG);
  return rules.map((r) => {
    const full = r.scope === "full";
    const pool = r.state === "built"
      ? (full ? builtFull : builtMG)
      : (full ? ownedFull : ownedMG);
    const ev = evalRule(r.rule, pool);
    return { id: r.id, name: r.name, group: r.group, sub: r.sub,
             hidden: !!r.hidden, ...ev };
  });
}

/* 解錠差分(トースト用):前回 unlocked 集合 → 今回新たに解錠された id 配列。 */
export function newlyUnlocked(prevUnlockedSet, evaluated) {
  return evaluated.filter((e) => e.unlocked && !prevUnlockedSet.has(e.id)).map((e) => e.id);
}
