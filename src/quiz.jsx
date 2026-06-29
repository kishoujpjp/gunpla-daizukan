/* ───────────────────────────────────────────────────────────
   quiz.jsx — クイズ機能(出題生成 buildQuiz + 画面 QuizModal)
   App.jsx から切り出し。対外公開は QuizModal のみ。挙動不変。
   ─────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { ACHIEVEMENTS } from "./achievements-rules.js";
import { explainAchievement } from "./achievements-engine.js";
import { thumbSrcOf, acquireSrcOf, hasAnyImage } from "./storage-lib.js";
import { haptic, hapticStrong } from "./utils.js";

/* ───────────────── クイズ(Phase 1:機体事実類) ───────────────── */
function _qShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function _qPickDistinct(pool, exclude, n) {
  const out = [];
  for (const v of _qShuffle(pool)) {
    if (out.length >= n) break;
    if (v == null || v === "" || v === exclude || out.includes(v)) continue;
    out.push(v);
  }
  return out;
}
/* allKits + recs(所持記録) + achQuiz(称号索引) + photoKits(画像) から count 問を生成。
   category: mix | fig | rec | ach | img */
function buildQuiz(allKits, recs, count, category, achQuiz, photoKits, L = (ja) => ja) {
  const kits = (allKits || []).filter((k) => k && k.name);
  const kitById = new Map(kits.map((k) => [k.id, k]));
  const allGrades = [...new Set(kits.map((k) => k.grade).filter(Boolean))];
  const allSeries = [...new Set(kits.map((k) => k.series).filter(Boolean))];
  const allYears = [...new Set(kits.map((k) => (k.ym || "").slice(0, 4)).filter((y) => y.length === 4))];
  const premiumKits = kits.filter((k) => k.premium);
  const normalKits = kits.filter((k) => !k.premium);
  const pickKit = () => kits[Math.floor(Math.random() * kits.length)];
  const lbl = (k) => k.name + (k.grade ? "（" + k.grade + "）" : "");
  const uniq = (labels) => new Set(labels).size === labels.length;

  // ── 図鑑(機体事実) ──
  const makeGrade = (k) => {
    if (!k || !k.grade) return null;
    const d = _qPickDistinct(allGrades, k.grade, 2);
    if (d.length < 2) return null;
    const opts = _qShuffle([k.grade, ...d]);
    return { sub: "grade", sig: "g:" + k.id, options: opts, answer: opts.indexOf(k.grade),
      prompt: "「" + k.name + "」（" + (k.code || "?") + " ／ " + (((k.ym || "").replace("-", ".")) || "—") + L("）のグレードは?","）— what grade?","）的等級是?"),
      explain: k.name + L(" は "," is "," 是 ") + k.grade + "。" };
  };
  const makeYear = (k) => {
    if (!k) return null;
    const y = (k.ym || "").slice(0, 4);
    if (y.length !== 4) return null;
    const near = allYears.filter((yy) => yy !== y && Math.abs(+yy - +y) <= 6);
    const d = _qPickDistinct(near.length >= 2 ? near : allYears, y, 2);
    if (d.length < 2) return null;
    const opts = _qShuffle([y, ...d]);
    return { sub: "year", sig: "y:" + k.id, options: opts.map((o) => o + L("年","","年")), answer: opts.indexOf(y),
      prompt: "「" + k.name + "」（" + (k.grade || "") + " " + (k.code || "") + L("）の発売年は?","）— release year?","）的發售年是?"),
      explain: k.name + L(" の発売は "," released "," 發售於 ") + ((k.ym || "").replace("-", ".")) + "。" };
  };
  const makeSeries = (k) => {
    if (!k || !k.series) return null;
    const d = _qPickDistinct(allSeries, k.series, 2);
    if (d.length < 2) return null;
    const opts = _qShuffle([k.series, ...d]);
    return { sub: "series", sig: "s:" + k.id, options: opts, answer: opts.indexOf(k.series),
      prompt: "「" + k.name + "」（" + (k.grade || "") + " " + (k.code || "") + L("）が登場する作品は?","）— from which series?","）出自哪部作品?"),
      explain: k.name + L(" は『"," is from 『"," 出自『") + k.series + "』。" };
  };
  const makePreban = () => {
    if (premiumKits.length < 1 || normalKits.length < 2) return null;
    const pN = 1 + Math.floor(Math.random() * Math.min(3, premiumKits.length));
    const nN = 5 - pN;
    if (normalKits.length < nN) return null;
    const objs = _qShuffle([..._qShuffle(premiumKits).slice(0, pN), ..._qShuffle(normalKits).slice(0, nN)]);
    const labels = objs.map(lbl);
    if (!uniq(labels)) return null;
    const answer = objs.map((k, i) => (k.premium ? i : -1)).filter((i) => i >= 0);
    return { sub: "preban", multi: true, sig: "pb:" + objs.map((k) => k.id).sort().join(","),
      options: labels, answer,
      prompt: L("次のうち P-Bandai(プレミアムバンダイ)限定はどれ?（複数選択可）","Which of these are P-Bandai (Premium Bandai) exclusives? (multiple)","以下哪些是 P-Bandai(魂商店)限定?（可複選）"),
      explain: L("P-Bandai限定: ","P-Bandai: ","P-Bandai 限定: ") + objs.filter((k) => k.premium).map((k) => k.name).join("、") };
  };

  // ── 記録(あなたのデータ) ──
  const earliestBy = (field, prompt) => () => {
    const pool = recs.filter((r) => r[field]);
    if (pool.length < 4) return null;
    const pick = _qShuffle(pool).slice(0, 4);
    let min = pick[0];
    for (const r of pick) if (r[field] < min[field]) min = r;
    if (pick.filter((r) => r[field] === min[field]).length > 1) return null;
    return { sub: "early_" + field, sig: "e" + field + ":" + pick.map((r) => r.id).sort().join(","),
      options: pick.map(lbl), answer: pick.indexOf(min), prompt, explain: min.name + "（" + min[field] + "）。" };
  };
  const builtYear = () => {
    const built = recs.filter((r) => r.buildDate && r.buildDate.length >= 4);
    if (built.length < 1) return null;
    const target = _qShuffle(built)[0];
    const y = target.buildDate.slice(0, 4);
    const others = _qShuffle(recs.filter((r) => r.id !== target.id && !(r.buildDate && r.buildDate.slice(0, 4) === y)));
    if (others.length < 3) return null;
    const objs = _qShuffle([target, ...others.slice(0, 3)]);
    return { sub: "built_year", sig: "by:" + y + ":" + target.id, options: objs.map(lbl),
      answer: objs.indexOf(target), prompt: L("次のうち、","Which did you complete in ","以下哪一個是你在 ") + y + L("年に完成させたのは?"," ?","年完成的?"),
      explain: target.name + L(" を "," completed "," 於 ") + target.buildDate + L(" に完成。"," ."," 完成。") };
  };
  const countGrade = () => {
    const byG = {};
    recs.forEach((r) => { if (r.grade) byG[r.grade] = (byG[r.grade] || 0) + 1; });
    const grades = Object.keys(byG);
    if (grades.length === 0) return null;
    const g = _qShuffle(grades)[0];
    const cc = byG[g];
    const cand = [cc - 2, cc - 1, cc + 1, cc + 2, cc + 3].filter((n) => n > 0 && n !== cc);
    const d = _qPickDistinct(cand, cc, 2);
    if (d.length < 2) return null;
    const opts = _qShuffle([cc, ...d]);
    return { sub: "count_grade", sig: "cg:" + g, options: opts.map((n) => n + L("個","","個")), answer: opts.indexOf(cc),
      prompt: L("あなたが所持している ","How many ","你擁有幾個 ") + g + L(" は何個?"," do you own?"," ?"), explain: g + L(" は "," : "," : ") + cc + L("個 所持。"," owned"," 個") };
  };
  const mostGrade = () => {
    const byG = {};
    recs.forEach((r) => { if (r.grade) byG[r.grade] = (byG[r.grade] || 0) + 1; });
    const entries = Object.entries(byG).sort((a, b) => b[1] - a[1]);
    if (entries.length < 3 || entries[0][1] === entries[1][1]) return null;
    const top = entries[0][0];
    const d = _qShuffle(entries.slice(1).map((e) => e[0])).slice(0, 2);
    if (d.length < 2) return null;
    const opts = _qShuffle([top, ...d]);
    return { sub: "most_grade", sig: "mgr", options: opts, answer: opts.indexOf(top),
      prompt: L("あなたの所持で最も多いグレードは?","Which grade do you own the most of?","你擁有最多的等級是?"), explain: L("最多は ","Most: ","最多: ") + top + "（" + byG[top] + L("個）。"," )"," 個）") };
  };
  const mostExp = () => {
    const priced = recs.filter((r) => Number(r.price) > 0);
    if (priced.length < 4) return null;
    const top = priced.reduce((m, r) => (Number(r.price) > Number(m.price) ? r : m));
    const others = _qShuffle(priced.filter((r) => r.id !== top.id && Number(r.price) !== Number(top.price))).slice(0, 3);
    if (others.length < 3) return null;
    const objs = _qShuffle([top, ...others]);
    return { sub: "most_exp", sig: "me", options: objs.map(lbl), answer: objs.indexOf(top),
      prompt: L("あなたの所持で最も定価が高い機体は?","Which kit you own has the highest list price?","你擁有的機體中定價最高的是?"), explain: top.name + "（¥" + Number(top.price).toLocaleString() + "）。" };
  };
  const totalBuilt = () => {
    if (recs.length < 5) return null;
    const cc = recs.filter((r) => r.buildDate).length;
    const cand = [cc - 2, cc - 1, cc + 1, cc + 2, cc + 3].filter((n) => n >= 0 && n !== cc);
    const d = _qPickDistinct(cand, cc, 2);
    if (d.length < 2) return null;
    const opts = _qShuffle([cc, ...d]);
    return { sub: "total_built", sig: "tb", options: opts.map((n) => n + L("体","","體")), answer: opts.indexOf(cc),
      prompt: L("あなたが完成させた機体は何体?","How many kits have you completed?","你完成了幾體機體?"), explain: L("完成は ","Completed: ","完成: ") + cc + L("体。"," "," 體") };
  };
  const oldestYear = () => {
    const withY = recs.filter((r) => (r.ym || "").length >= 4);
    if (withY.length < 4) return null;
    const oldest = withY.reduce((m, r) => (r.ym < m.ym ? r : m));
    const others = _qShuffle(withY.filter((r) => r.id !== oldest.id && r.ym.slice(0, 7) !== oldest.ym.slice(0, 7))).slice(0, 3);
    if (others.length < 3) return null;
    const objs = _qShuffle([oldest, ...others]);
    return { sub: "oldest_year", sig: "oy", options: objs.map(lbl), answer: objs.indexOf(oldest),
      prompt: L("あなたの所持で最も発売年が古い機体は?","Which kit you own has the oldest release date?","你擁有的機體中發售最早的是?"), explain: oldest.name + "（" + (oldest.ym || "").replace("-", ".") + "）。" };
  };

  // ── 称号(④) ──
  const achToKits = () => {
    if (!achQuiz || !achQuiz.perAch || !achQuiz.perAch.length) return null;
    const pool = achQuiz.perAch.filter((e) => e.cands.length >= 2);
    if (!pool.length) return null;
    const e = pool[Math.floor(Math.random() * pool.length)];
    const correctKits = _qShuffle(e.cands).slice(0, Math.min(3, e.cands.length));
    if (correctKits.length < 2) return null;
    const wrongPool = kits.filter((k) => !e.candIds.has(k.id));
    const wrongs = _qShuffle(wrongPool).slice(0, Math.max(2, 5 - correctKits.length));
    if (wrongs.length < 2) return null;
    const objs = _qShuffle([...correctKits.map((c) => ({ id: c.id, name: c.name, ok: true })),
      ...wrongs.map((k) => ({ id: k.id, name: k.name, ok: false }))]);
    const labels = objs.map((o) => o.name);
    if (!uniq(labels)) return null;
    const answer = objs.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0);
    if (!answer.length) return null;
    return { sub: "ach_kits", multi: true, sig: "ak:" + e.id, options: labels, answer,
      prompt: "「" + e.name + L("」の条件に該当する機体はどれ?（複数選択可）","」— which kits meet this title? (multiple)","」的條件符合哪些機體?（可複選）"),
      explain: L("該当: ","Match: ","符合: ") + correctKits.map((c) => c.name).join("、") };
  };
  const kitToAchQ = () => {
    if (!achQuiz || !achQuiz.kitToAch || !achQuiz.kitToAch.size) return null;
    const singles = [];
    achQuiz.kitToAch.forEach((arr, kid) => { if (arr.length === 1) singles.push({ kid, achName: arr[0].name }); });
    if (!singles.length) return null;
    const allAchNames = [...new Set(achQuiz.perAch.map((e) => e.name))];
    if (allAchNames.length < 4) return null;
    const pick = singles[Math.floor(Math.random() * singles.length)];
    const k = kitById.get(pick.kid);
    if (!k) return null;
    const d = _qPickDistinct(allAchNames, pick.achName, 3);
    if (d.length < 3) return null;
    const opts = _qShuffle([pick.achName, ...d]);
    return { sub: "kit_ach", sig: "ka:" + pick.kid, options: opts, answer: opts.indexOf(pick.achName),
      prompt: "「" + k.name + L("」が条件に関わる称号は?","」relates to which title?","」與哪個稱號的條件有關?"), explain: k.name + " → 「" + pick.achName + "」" };
  };

  // ── 画像(⑤・局部放大) ──
  const imgToKit = () => {
    if (!photoKits || photoKits.length < 1) return null;
    const target = photoKits[Math.floor(Math.random() * photoKits.length)];
    if (!target.src) return null;
    let pool = kits.filter((k) => k.id !== target.id && (k.grade === target.grade || k.series === target.series));
    if (pool.length < 3) pool = kits.filter((k) => k.id !== target.id);
    const wrongs = _qShuffle(pool).slice(0, 3);
    if (wrongs.length < 3) return null;
    const objs = _qShuffle([{ id: target.id, name: target.name, ok: true },
      ...wrongs.map((k) => ({ id: k.id, name: k.name, ok: false }))]);
    const labels = objs.map((o) => o.name);
    if (!uniq(labels)) return null;
    const fx = 20 + Math.floor(Math.random() * 60), fy = 20 + Math.floor(Math.random() * 60);
    const scale = (2 + Math.random() * 0.8).toFixed(2);
    return { sub: "img_kit", sig: "ik:" + target.id + ":" + fx + "_" + fy, options: labels,
      answer: objs.findIndex((o) => o.ok),
      media: { src: target.src, frame: { transform: "scale(" + scale + ")", transformOrigin: fx + "% " + fy + "%" } },
      prompt: L("この拡大画像の機体は?","Which kit is in this zoomed image?","這張放大圖是哪個機體?"), explain: L("正解: ","Answer: ","正解: ") + target.name };
  };

  const figProducers = [() => makeGrade(pickKit()), () => makeYear(pickKit()), () => makeSeries(pickKit()), makePreban];
  const recProducers = [
    earliestBy("purchaseDate", L("次のうち、最も早く入手したのは?","Which did you acquire earliest?","以下哪個是你最早入手的?")),
    earliestBy("buildDate", L("次のうち、最初に完成させたのは?","Which did you complete first?","以下哪個是你最先完成的?")),
    builtYear, countGrade, mostGrade, mostExp, totalBuilt, oldestYear,
  ];
  const achProducers = [achToKits, kitToAchQ];
  const imgProducers = [imgToKit];

  let producers;
  if (category === "fig") producers = figProducers;
  else if (category === "rec") producers = recProducers;
  else if (category === "ach") producers = achProducers;
  else if (category === "img") producers = imgProducers;
  else producers = [...figProducers, ...recProducers, ...achProducers, ...imgProducers];
  if (!producers.length) producers = figProducers;

  const out = [];
  const sigs = new Set();
  let attempts = 0;
  const maxAttempts = count * 60 + 400;
  while (out.length < count && attempts < maxAttempts) {
    attempts++;
    const p = producers[Math.floor(Math.random() * producers.length)];
    const qq = p();
    if (!qq || sigs.has(qq.sig)) continue;
    sigs.add(qq.sig);
    out.push(qq);
  }
  return out;
}

const QUIZ_LIMIT = 16000; // 1問の制限時間(ms)
const QUIZ_RECMIN = 4;
const QUIZ_INF_BATCH = 30;
function evalRank(rate, L = (ja) => ja) {
  return rate >= 100 ? { t: L("皆伝","Master","皆傳"), c: "gold" } : rate >= 80 ? { t: L("師範","Expert","師範"), c: "gold" }
    : rate >= 60 ? { t: L("目録","Adept","目錄"), c: "silver" } : rate >= 40 ? { t: L("切紙","Novice","切紙"), c: "bronze" } : { t: L("見習","Apprentice","見習"), c: "" };
}
export function QuizModal({ allKits, getRec, images, extras, albumMeta, builderName, onClose, L = (ja) => ja }) {
  const [phase, setPhase] = useState("config");
  const [mode, setMode] = useState("normal");
  const [cat, setCat] = useState("mix");
  const [questions, setQuestions] = useState([]);
  const [qi, setQi] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [sel, setSel] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [remain, setRemain] = useState(QUIZ_LIMIT);
  const [best, setBest] = useState(null);
  const [board, setBoard] = useState([]);
  const [runCount, setRunCount] = useState(0);
  const [runRank, setRunRank] = useState(0);
  const [runNew, setRunNew] = useState(false);

  const deadlineRef = useRef(0);
  const timerRef = useRef(null);
  const advRef = useRef(null);
  const selRef = useRef([]);
  const scoreRef = useRef(0);
  const boardRef = useRef([]);
  useEffect(() => { selRef.current = sel; }, [sel]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { boardRef.current = board; }, [board]);
  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  useEffect(() => () => { stopTimer(); if (advRef.current) clearTimeout(advRef.current); }, []);

  const recs = useMemo(() => {
    try {
      return (allKits || []).filter((k) => { const r = getRec && getRec(k.id); return r && r.owned; })
        .map((k) => { const r = (getRec && getRec(k.id)) || {}; return { id: k.id, name: k.name, grade: k.grade, series: k.series, code: k.code, ym: k.ym, price: k.price, premium: !!k.premium, purchaseDate: r.purchaseDate || "", buildDate: r.buildDate || "" }; });
    } catch (e) { return []; }
  }, [allKits]);
  const recCount = recs.length;

  const photoKits = useMemo(() => {
    try {
      return (allKits || []).filter((k) => hasAnyImage(k.id, images, extras)).map((k) => {
        let src = "";
        try { src = thumbSrcOf(k.id, images, extras, albumMeta) || acquireSrcOf(k.id, images, extras, albumMeta) || ""; } catch (e) {}
        return src ? { id: k.id, name: k.name, grade: k.grade, series: k.series, ym: k.ym, src } : null;
      }).filter(Boolean);
    } catch (e) { return []; }
  }, [allKits, images, extras, albumMeta]);
  const photoCount = photoKits.length;

  const achQuiz = useMemo(() => {
    try {
      const perAch = []; const kitToAch = new Map();
      for (const ach of ACHIEVEMENTS) {
        let ex;
        try { ex = explainAchievement(ach, allKits, getRec); } catch (e) { continue; }
        if (!ex) continue;
        const cands = []; const seen = new Set();
        const push = (o) => { if (o && o.id && !seen.has(o.id)) { seen.add(o.id); cands.push({ id: o.id, name: o.name }); } };
        if (ex.kind === "combo") { (ex.pieces || []).forEach((p) => { if (p.owned) push(p.owned); (p.candidates || []).forEach(push); }); }
        else if (ex.kind === "count") { (ex.have || []).forEach(push); (ex.candidates || []).forEach(push); }
        if (cands.length >= 2) {
          const entry = { id: ach.id, name: ach.name || L("称号","Title","稱號"), candIds: new Set(cands.map((c) => c.id)), cands };
          perAch.push(entry);
          cands.forEach((c) => { const a = kitToAch.get(c.id) || []; a.push({ achId: entry.id, name: entry.name }); kitToAch.set(c.id, a); });
        }
      }
      return { perAch, kitToAch };
    } catch (e) { return { perAch: [], kitToAch: new Map() }; }
  }, [allKits]);
  const achCount = achQuiz.perAch.length;

  useEffect(() => {
    let live = true;
    (async () => {
      try { const r = await window.storage.get("mg_quiz_best"); if (live && r && r.value) setBest(JSON.parse(r.value)); } catch (e) {}
      try { const r2 = await window.storage.get("mg_quiz_infinite"); if (live && r2 && r2.value) { const b = JSON.parse(r2.value); setBoard(b); boardRef.current = b; } } catch (e) {}
    })();
    return () => { live = false; };
  }, []);

  const genBatch = (n) => buildQuiz(allKits, recs, n, "mix", achQuiz, photoKits, L);
  const grade = (correct) => {
    if (correct) { setScore((s) => s + 1); setStreak((st) => { const ns = st + 1; setMaxStreak((m) => Math.max(m, ns)); return ns; }); }
    else setStreak(0);
  };
  const advance = () => {
    setQuestions((qs) => (qi + 1 >= qs.length ? [...qs, ...genBatch(QUIZ_INF_BATCH)] : qs));
    setQi((i) => i + 1); setAnswered(null); setSel([]);
  };
  const endInfinite = (count) => {
    const name = (builderName && builderName.trim()) || "NO NAME";
    const prevMax = (boardRef.current || []).reduce((m, e) => Math.max(m, e.count), 0);
    const entry = { name, count, date: new Date().toISOString().slice(0, 10) };
    const arr = [...(boardRef.current || []), entry].sort((a, b) => (b.count - a.count) || (a.date < b.date ? -1 : 1)).slice(0, 10);
    boardRef.current = arr; setBoard(arr);
    try { window.storage.set("mg_quiz_infinite", JSON.stringify(arr)); } catch (e) {}
    setRunCount(count); setRunRank(arr.indexOf(entry) + 1); setRunNew(count > prevMax && count > 0);
  };
  const finalize = (correct, picked, timeout) => {
    stopTimer();
    setAnswered({ picked, correct, timeout: !!timeout });
    grade(correct);
    if (correct) {
      haptic();
      if (mode === "infinite") { if (advRef.current) clearTimeout(advRef.current); advRef.current = setTimeout(advance, 650); }
    } else {
      hapticStrong();
      if (mode === "infinite") endInfinite(scoreRef.current);
    }
  };
  const onTimeout = () => {
    const cur = questions[qi];
    let correct = false;
    if (cur && Array.isArray(cur.answer)) { const ans = cur.answer, s = selRef.current; correct = s.length === ans.length && s.every((x) => ans.includes(x)); }
    if (mode === "infinite") correct = false;
    finalize(correct, cur && Array.isArray(cur.answer) ? selRef.current.slice() : -1, true);
  };

  useEffect(() => {
    if (phase !== "playing" || answered !== null) { stopTimer(); return; }
    deadlineRef.current = Date.now() + QUIZ_LIMIT;
    setRemain(QUIZ_LIMIT);
    stopTimer();
    timerRef.current = setInterval(() => {
      const r = deadlineRef.current - Date.now();
      if (r <= 0) { stopTimer(); setRemain(0); onTimeout(); }
      else setRemain(r);
    }, 100);
    return stopTimer;
  }, [phase, qi, answered]);

  useEffect(() => {
    if (phase !== "result" || mode === "infinite") return;
    const total = questions.length || 1;
    const rate = Math.round((score / total) * 100);
    const nb = { rate: Math.max(rate, (best && best.rate) || 0), streak: Math.max(maxStreak, (best && best.streak) || 0) };
    setBest(nb);
    try { window.storage.set("mg_quiz_best", JSON.stringify(nb)); } catch (e) {}
  }, [phase]);

  const start = (n) => {
    setMode("normal");
    const qs = buildQuiz(allKits, recs, n, cat, achQuiz, photoKits, L);
    if (qs.length === 0) { alert(L("出題できるデータが足りません。","Not enough data to generate questions.","資料不足，無法出題。")); return; }
    setQuestions(qs); setQi(0); setAnswered(null); setSel([]);
    setScore(0); setStreak(0); setMaxStreak(0); setPhase("playing");
  };
  const startInfinite = () => {
    setMode("infinite");
    const qs = genBatch(QUIZ_INF_BATCH);
    if (qs.length === 0) { alert(L("出題できるデータが足りません。","Not enough data to generate questions.","資料不足，無法出題。")); return; }
    setQuestions(qs); setQi(0); setAnswered(null); setSel([]);
    setScore(0); setStreak(0); setMaxStreak(0); setRunCount(0); setRunRank(0); setRunNew(false); setPhase("playing");
  };
  const choose = (i) => {
    if (answered !== null) return;
    const cur = questions[qi];
    if (Array.isArray(cur.answer)) { setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i])); return; }
    finalize(i === cur.answer, i, false);
  };
  const submitMulti = () => {
    if (answered !== null) return;
    const ans = questions[qi].answer;
    finalize(sel.length === ans.length && sel.every((x) => ans.includes(x)), sel.slice(), false);
  };
  const next = () => {
    if (qi + 1 >= questions.length) setPhase("result");
    else { setQi((i) => i + 1); setAnswered(null); setSel([]); }
  };
  const abort = () => { if (window.confirm(L("クイズを中断しますか?(進行中の結果は記録されません)","Abort the quiz? (progress won't be saved)","要中斷測驗嗎?(進行中的結果不會記錄)"))) { stopTimer(); if (advRef.current) clearTimeout(advRef.current); onClose(); } };

  const q = questions[qi];
  const isMulti = q && Array.isArray(q.answer);
  const ratio = Math.max(0, Math.min(1, remain / QUIZ_LIMIT));
  const low = ratio <= 0.25;
  const cats = [["mix", L("ミックス","Mix","綜合")], ["fig", L("図鑑","Registry","圖鑑")], ["rec", L("記録","Records","紀錄")], ["ach", L("称号","Titles","稱號")], ["img", L("画像","Images","圖片")]];
  const catOff = (v) => (v === "rec" && recCount < QUIZ_RECMIN) || (v === "img" && photoCount < QUIZ_RECMIN) || (v === "ach" && achCount < 3);
  const rate = Math.round((score / (questions.length || 1)) * 100);
  const er = evalRank(rate, L);

  return (
    <div className="quiz-bg">
      <div className="quiz-wrap">
        {phase === "config" && (
          <div className="quiz-config">
            <div className="quiz-eyebrow">{L("QUIZ · 知識試験","QUIZ","QUIZ · 知識測驗")}</div>
            <h2 className="quiz-h">{L(<>機体知識<em>試験</em></>,<>Kit <em>Quiz</em></>,<>機體知識<em>測驗</em></>)}</h2>
            <p className="quiz-lead">{L("図鑑・記録・称号・画像から出題。各問","Questions from the registry, records, titles & images. ","題目來自圖鑑・紀錄・稱號・圖片。每題") + (QUIZ_LIMIT / 1000) + L("秒。","s each.","秒。")}</p>
            <button className="quiz-inf" onClick={startInfinite}>{L("無限モード","Endless mode","無限模式")}<span>{L("全領域・無制限・一問でも誤れば終了","All topics · unlimited · one wrong answer ends it","全領域・無限・答錯一題即結束")}</span></button>
            <div className="quiz-count">{L("通常モード — 出題ジャンル","Normal mode — category","一般模式 — 出題類別")}</div>
            <div className="quiz-cats">
              {cats.map(([v, l]) => {
                const off = catOff(v);
                return <button key={v} className={"quiz-chip" + (cat === v ? " on" : "") + (off ? " off" : "")} disabled={off} onClick={() => setCat(v)}>{l}</button>;
              })}
            </div>
            {(recCount < QUIZ_RECMIN || photoCount < QUIZ_RECMIN) && <div className="quiz-note">{L("「記録」は所持","Records needs ","「紀錄」需擁有 ") + QUIZ_RECMIN + L("件、「画像」は写真"," owned, Images needs "," 件、「圖片」需照片 ") + QUIZ_RECMIN + L("件以上で解放（所持 ","+ photos to unlock (owned ","件以上解鎖（擁有 ") + recCount + L("・写真 "," · photos "," ・照片 ") + photoCount + "）。"}</div>}
            <div className="quiz-count">{L("出題数","Questions","題數")}</div>
            <div className="quiz-count-row">
              {[5, 10, 15].map((n) => <button key={n} className="quiz-cbtn" onClick={() => start(n)}>{n}{L("問","Q","題")}</button>)}
            </div>
            {best && <div className="quiz-best">{L("通常モード自己ベスト　正答率 ","Best　Accuracy ","一般模式最佳　正確率 ") + best.rate + L("%　／　最大連続 ","%　/　Max streak ","%　／　最大連續 ") + best.streak}</div>}
            {board && board.length > 0 && (
              <div className="quiz-board">
                <div className="quiz-board-h">{L("無限モード番付","Endless ranking","無限模式排行")}<span>INFINITE RANKING</span></div>
                {board.slice(0, 8).map((e, i) => (
                  <div key={i} className={"qb-row" + (i < 3 ? " top top" + (i + 1) : "")}>
                    <span className="qb-rank">{i < 3 ? ["①", "②", "③"][i] : i + 1}</span>
                    <span className="qb-name">{e.name}</span>
                    <span className="qb-count">{e.count}<i>{L("問","Q","題")}</i></span>
                  </div>
                ))}
              </div>
            )}
            <button className="quiz-close" onClick={onClose}>{L("閉じる","Close","關閉")}</button>
          </div>
        )}

        {phase === "playing" && q && (
          <div className="quiz-play">
            <div className="quiz-top">
              <span className="quiz-prog">{mode === "infinite" ? "∞ " + (qi + 1) + L("問目"," ","題") : (qi + 1) + " / " + questions.length}</span>
              <span className="quiz-sc">{L("正解 ","Correct ","正解 ") + score + L("　連続 ","　Streak ","　連續 ") + streak}</span>
              <button className="quiz-abort" onClick={abort}>{L("中断","Abort","中斷")}</button>
            </div>
            <div className="quiz-timer"><span className={"quiz-timer-fill" + (low ? " low" : "")} style={{ width: (ratio * 100) + "%" }} /></div>
            {q.media && <div className="quiz-media"><img src={q.media.src} alt="" style={answered ? null : q.media.frame} /></div>}
            <div className="quiz-q">{q.prompt}</div>
            <div className="quiz-opts">
              {q.options.map((o, i) => {
                let cls = "quiz-opt";
                if (answered) {
                  if (isMulti ? q.answer.includes(i) : i === q.answer) cls += " correct";
                  else if (isMulti ? answered.picked.includes(i) : i === answered.picked) cls += " wrong";
                  else cls += " dim";
                } else if (isMulti && sel.includes(i)) cls += " on";
                return <button key={i} className={cls} disabled={!!answered} onClick={() => choose(i)}>{o}</button>;
              })}
            </div>
            {isMulti && !answered && <button className="quiz-decide" onClick={submitMulti}>{L("決定する（","Submit (","確定（") + sel.length + L("件選択）"," selected)"," 項）")}</button>}
            {answered && (
              <div className={"quiz-fb " + (answered.correct ? "ok" : "ng")}>
                <div className="quiz-fb-mark">{answered.correct ? (mode === "infinite" ? L("◎ 正解 ・ ","◎ Correct · ","◎ 正解 ・ ") + (qi + 1) + L("問突破"," cleared","題突破") : L("◎ 正解","◎ Correct","◎ 正解")) : (answered.timeout ? L("✕ 時間切れ","✕ Time up","✕ 時間到") : L("✕ 不正解","✕ Wrong","✕ 答錯"))}</div>
                {(mode === "normal" || !answered.correct) && <div className="quiz-fb-ex">{q.explain}</div>}
                {mode === "normal"
                  ? <button className="quiz-next" onClick={next}>{qi + 1 >= questions.length ? L("結果を見る","See result","查看結果") : L("次の問題へ","Next","下一題")}</button>
                  : (!answered.correct && <button className="quiz-next" onClick={() => setPhase("result")}>{L("結果へ","Result","結果")}</button>)}
              </div>
            )}
          </div>
        )}

        {phase === "result" && (
          <div className="quiz-result">
            {mode === "infinite" ? (
              <>
                <div className="quiz-eyebrow">{L("INFINITE · 無限モード","INFINITE","INFINITE · 無限模式")}</div>
                {runNew && <div className="qr-new">{L("★ 自己新記録 ★","★ New record ★","★ 自我新紀錄 ★")}</div>}
                <div className="qr-ring"><div className="qr-big">{runCount}</div><div className="qr-unit">{L("問突破","cleared","題突破")}</div></div>
                {runRank > 0 && <div className={"qr-rank" + (runRank <= 3 ? " top" : "")}>{L("番付 第 ","Rank #","排行 第 ") + runRank + L(" 位",""," 位")}</div>}
                <div className="quiz-rate">{L("挑戦者　","Challenger　","挑戰者　") + ((builderName && builderName.trim()) || "NO NAME")}</div>
              </>
            ) : (
              <>
                <div className="quiz-eyebrow">{L("RESULT · 結果","RESULT","RESULT · 結果")}</div>
                <div className={"qr-badge " + er.c}>{er.t}</div>
                <div className="qr-ring"><div className="qr-big">{score}</div><div className="qr-unit">/ {questions.length}</div></div>
                <div className="quiz-rate">{L("正答率 ","Accuracy ","正確率 ") + rate + L("%　最大連続 ","%　Max streak ","%　最大連續 ") + maxStreak}</div>
                {best && <div className="quiz-best">{L("自己ベスト　正答率 ","Best　Accuracy ","最佳　正確率 ") + best.rate + L("%　／　最大連続 ","%　/　Max streak ","%　／　最大連續 ") + best.streak}</div>}
              </>
            )}
            <div className="quiz-res-btns">
              <button className="quiz-cbtn" onClick={() => setPhase("config")}>{L("もう一度","Again","再來一次")}</button>
              <button className="quiz-close" onClick={onClose}>{L("閉じる","Close","關閉")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
