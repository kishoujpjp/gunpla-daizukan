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
    const n = rule.n || 1;
    const m = kitsMatching(rule.match, owned);
    return { unlocked: m.length >= n, cur: Math.min(m.length, n), need: n, ids: m.map((k) => k.id) };
  }
  if (rule.all) {
    const simple = rule.all.every((p) => p.match);
    if (simple) {
      const sels = rule.all.map((p) => p.match);
      const candIds = sels.map((sel) => kitsMatching(sel, owned).map((k) => k.id));
      const order = candIds.map((_, i) => i).sort((a, b) => candIds[a].length - candIds[b].length);
      const used = new Set();
      for (const i of order) { const pick = candIds[i].find((id) => !used.has(id)); if (pick !== undefined) used.add(pick); }
      const ok = used.size === sels.length;
      const satisfied = candIds.filter((c) => c.length).length;
      return { unlocked: ok, cur: ok ? sels.length : satisfied, need: sels.length, ids: [...used] };
    }
    const sub = rule.all.map((p) => evalRule(p, owned));
    const ids = [].concat(...sub.map((x) => x.ids || []));
    return { unlocked: sub.every((x) => x.unlocked), cur: sub.filter((x) => x.unlocked).length, need: sub.length, ids };
  }
  if (rule.any) {
    const sub = rule.any.map((p) => evalRule(p, owned));
    const ids = [].concat(...sub.map((x) => x.ids || []));
    return { unlocked: sub.some((x) => x.unlocked), cur: Math.max(0, ...sub.map((x) => x.cur)), need: 1, ids };
  }
  if (rule.count) {
    const m = kitsMatching(rule.count, owned);
    return { unlocked: m.length >= rule.gte, cur: Math.min(m.length, rule.gte), need: rule.gte, ids: m.map((k) => k.id) };
  }
  if (rule.sameCodeAcrossGrades) {
    const grades = rule.sameCodeAcrossGrades;
    const byCode = new Map();
    for (const k of owned) {
      if (!k.code || k.code === "\u2014") continue;
      if (!byCode.has(k.code)) byCode.set(k.code, { grades: new Set(), ids: [] });
      const e = byCode.get(k.code); e.grades.add(gradeOf(k)); e.ids.push(k.id);
    }
    let ids = []; let hits = 0;
    for (const e of byCode.values()) if (grades.every((g) => e.grades.has(g))) { hits++; ids = ids.concat(e.ids); }
    return { unlocked: hits >= 1, cur: hits ? 1 : 0, need: 1, ids };
  }
  return { unlocked: false, cur: 0, need: 1, ids: [] };
}

/* 全成就を評価。
   ・評価池は既定で MG-class(gradeOf==="MG"。Ver.Ka/MGEX 含む)のみ。
     → UC 称号は MG コレクションを対象とする。
   ・rule.scope==="full" の時だけ全 grade を見る(親子丼・三段活用など跨 grade 用)。
   ・rule.state==="built" の時は完成済み集合で判定(既定は owned)。 */
export function evaluateAchievements(rules, allKits, getRec) {
  const isMG = (k) => gradeOf(k) === "MG";
  const ownedFull = allKits.filter((k) => getRec(k.id).owned);
  const ownedMG = ownedFull.filter(isMG);
  const builtSet = new Set(allKits.filter((k) => !!getRec(k.id).buildDate).map((k) => k.id));
  return rules.map((r) => {
    const pool = r.scope === "full" ? ownedFull : ownedMG;
    const ev = evalRule(r.rule, pool);
    const collectionMet = ev.unlocked;
    const builtGate = collectionMet && (ev.ids || []).some((id) => builtSet.has(id));
    return { id: r.id, name: r.name, group: r.group, sub: r.sub, hidden: !!r.hidden,
             cur: ev.cur, need: ev.need,
             unlocked: collectionMet && builtGate,
             collectionMet, builtGate, needBuild: collectionMet && !builtGate };
  });
}

/* 解錠差分(トースト用):前回 unlocked 集合 → 今回新たに解錠された id 配列。 */
export function newlyUnlocked(prevUnlockedSet, evaluated) {
  return evaluated.filter((e) => e.unlocked && !prevUnlockedSet.has(e.id)).map((e) => e.id);
}

/* ── 称号の内訳(条件ごとの達成/不足)を返す。自動ラベル(候補機体名そのまま)。 ──
   返値 kind: "combo" | "count" | "grades"
   ・combo : pieces[]  各 { satisfied, owned:{id,name}|null, candidates:[{id,name,owned}] }
             + countPieces[](F90 ミッションパック等のインライン計数)
   ・count : { have:[{id,name}], need, candidates:[{id,name,owned}] }
   ・grades: { grades:[…], best:{code,hit,grades:[…],names:[…]}|null } */
export function explainAchievement(ach, allKits, getRec) {
  const full = ach.scope === "full";
  const isMG = (k) => gradeOf(k) === "MG";
  const ownedAll = allKits.filter((k) => getRec(k.id).owned);
  const owned = full ? ownedAll : ownedAll.filter(isMG);
  const cand = full ? allKits : allKits.filter(isMG);
  const ownedSet = new Set(owned.map((k) => k.id));
  const builtSet = new Set(allKits.filter((k) => !!getRec(k.id).buildDate).map((k) => k.id));
  const byId = new Map(allKits.map((k) => [k.id, k]));
  const named = (k) => ({ id: k.id, name: k.name, code: k.code, owned: ownedSet.has(k.id), built: builtSet.has(k.id) });
  const rule = ach.rule;
  let result, satisfyingIds = [];

  if (rule.all || rule.match) {
    const parts = rule.all || [{ match: rule.match }];
    const sels = parts.filter((p) => p.match).map((p) => p.match);
    const counts = parts.filter((p) => p.count);
    const candIds = sels.map((sel) => kitsMatching(sel, owned).map((k) => k.id));
    const order = candIds.map((_, i) => i).sort((a, b) => candIds[a].length - candIds[b].length);
    const used = new Set(); const assign = new Array(sels.length).fill(null);
    for (const i of order) { const pick = candIds[i].find((id) => !used.has(id)); if (pick !== undefined) { used.add(pick); assign[i] = pick; } }
    const pieces = sels.map((sel, i) => ({
      satisfied: assign[i] !== null,
      owned: assign[i] !== null ? named(byId.get(assign[i])) : null,
      candidates: kitsMatching(sel, cand).map(named),
    }));
    const countPieces = counts.map((p) => ({ have: kitsMatching(p.count, owned).map(named), need: p.gte }));
    satisfyingIds = [...used].concat(...countPieces.map((cp) => cp.have.map((h) => h.id)));
    result = { kind: "combo", pieces, countPieces };
  } else if (rule.count) {
    const have = kitsMatching(rule.count, owned).map(named);
    satisfyingIds = have.map((h) => h.id);
    result = { kind: "count", have, need: rule.gte, candidates: kitsMatching(rule.count, cand).map(named) };
  } else if (rule.sameCodeAcrossGrades) {
    const grades = rule.sameCodeAcrossGrades;
    const byCode = new Map();
    for (const k of ownedAll) {
      if (!k.code || k.code === "\u2014") continue;
      if (!byCode.has(k.code)) byCode.set(k.code, { grades: new Set(), names: [], ids: [] });
      const e = byCode.get(k.code); e.grades.add(gradeOf(k)); e.names.push(k.name); e.ids.push(k.id);
    }
    let best = null;
    for (const [code, info] of byCode) {
      const hit = grades.filter((g) => info.grades.has(g)).length;
      if (!best || hit > best.hit) best = { code, hit, grades: [...info.grades], names: info.names, ids: info.ids };
    }
    if (best) satisfyingIds = best.ids;
    result = { kind: "grades", grades, best };
  } else {
    result = { kind: "unknown" };
  }

  const builtId = satisfyingIds.find((id) => builtSet.has(id));
  result.buildGate = { satisfied: !!builtId, builtName: builtId ? byId.get(builtId).name : null };
  return result;
}
