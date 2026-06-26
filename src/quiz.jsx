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
function buildQuiz(allKits, recs, count, category, achQuiz, photoKits) {
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
      prompt: "「" + k.name + "」（" + (k.code || "?") + " ／ " + (((k.ym || "").replace("-", ".")) || "—") + "）のグレードは?",
      explain: k.name + " は " + k.grade + "。" };
  };
  const makeYear = (k) => {
    if (!k) return null;
    const y = (k.ym || "").slice(0, 4);
    if (y.length !== 4) return null;
    const near = allYears.filter((yy) => yy !== y && Math.abs(+yy - +y) <= 6);
    const d = _qPickDistinct(near.length >= 2 ? near : allYears, y, 2);
    if (d.length < 2) return null;
    const opts = _qShuffle([y, ...d]);
    return { sub: "year", sig: "y:" + k.id, options: opts.map((o) => o + "年"), answer: opts.indexOf(y),
      prompt: "「" + k.name + "」（" + (k.grade || "") + " " + (k.code || "") + "）の発売年は?",
      explain: k.name + " の発売は " + ((k.ym || "").replace("-", ".")) + "。" };
  };
  const makeSeries = (k) => {
    if (!k || !k.series) return null;
    const d = _qPickDistinct(allSeries, k.series, 2);
    if (d.length < 2) return null;
    const opts = _qShuffle([k.series, ...d]);
    return { sub: "series", sig: "s:" + k.id, options: opts, answer: opts.indexOf(k.series),
      prompt: "「" + k.name + "」（" + (k.grade || "") + " " + (k.code || "") + "）が登場する作品は?",
      explain: k.name + " は『" + k.series + "』。" };
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
      prompt: "次のうち P-Bandai(プレミアムバンダイ)限定はどれ?（複数選択可）",
      explain: "P-Bandai限定: " + objs.filter((k) => k.premium).map((k) => k.name).join("、") };
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
      answer: objs.indexOf(target), prompt: "次のうち、" + y + "年に完成させたのは?",
      explain: target.name + " を " + target.buildDate + " に完成。" };
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
    return { sub: "count_grade", sig: "cg:" + g, options: opts.map((n) => n + "個"), answer: opts.indexOf(cc),
      prompt: "あなたが所持している " + g + " は何個?", explain: g + " は " + cc + "個 所持。" };
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
      prompt: "あなたの所持で最も多いグレードは?", explain: "最多は " + top + "（" + byG[top] + "個）。" };
  };
  const mostExp = () => {
    const priced = recs.filter((r) => Number(r.price) > 0);
    if (priced.length < 4) return null;
    const top = priced.reduce((m, r) => (Number(r.price) > Number(m.price) ? r : m));
    const others = _qShuffle(priced.filter((r) => r.id !== top.id && Number(r.price) !== Number(top.price))).slice(0, 3);
    if (others.length < 3) return null;
    const objs = _qShuffle([top, ...others]);
    return { sub: "most_exp", sig: "me", options: objs.map(lbl), answer: objs.indexOf(top),
      prompt: "あなたの所持で最も定価が高い機体は?", explain: top.name + "（¥" + Number(top.price).toLocaleString() + "）。" };
  };
  const totalBuilt = () => {
    if (recs.length < 5) return null;
    const cc = recs.filter((r) => r.buildDate).length;
    const cand = [cc - 2, cc - 1, cc + 1, cc + 2, cc + 3].filter((n) => n >= 0 && n !== cc);
    const d = _qPickDistinct(cand, cc, 2);
    if (d.length < 2) return null;
    const opts = _qShuffle([cc, ...d]);
    return { sub: "total_built", sig: "tb", options: opts.map((n) => n + "体"), answer: opts.indexOf(cc),
      prompt: "あなたが完成させた機体は何体?", explain: "完成は " + cc + "体。" };
  };
  const oldestYear = () => {
    const withY = recs.filter((r) => (r.ym || "").length >= 4);
    if (withY.length < 4) return null;
    const oldest = withY.reduce((m, r) => (r.ym < m.ym ? r : m));
    const others = _qShuffle(withY.filter((r) => r.id !== oldest.id && r.ym.slice(0, 7) !== oldest.ym.slice(0, 7))).slice(0, 3);
    if (others.length < 3) return null;
    const objs = _qShuffle([oldest, ...others]);
    return { sub: "oldest_year", sig: "oy", options: objs.map(lbl), answer: objs.indexOf(oldest),
      prompt: "あなたの所持で最も発売年が古い機体は?", explain: oldest.name + "（" + (oldest.ym || "").replace("-", ".") + "）。" };
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
      prompt: "「" + e.name + "」の条件に該当する機体はどれ?（複数選択可）",
      explain: "該当: " + correctKits.map((c) => c.name).join("、") };
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
      prompt: "「" + k.name + "」が条件に関わる称号は?", explain: k.name + " → 「" + pick.achName + "」" };
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
      prompt: "この拡大画像の機体は?", explain: "正解: " + target.name };
  };

  const figProducers = [() => makeGrade(pickKit()), () => makeYear(pickKit()), () => makeSeries(pickKit()), makePreban];
  const recProducers = [
    earliestBy("purchaseDate", "次のうち、最も早く入手したのは?"),
    earliestBy("buildDate", "次のうち、最初に完成させたのは?"),
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
function evalRank(rate) {
  return rate >= 100 ? { t: "皆伝", c: "gold" } : rate >= 80 ? { t: "師範", c: "gold" }
    : rate >= 60 ? { t: "目録", c: "silver" } : rate >= 40 ? { t: "切紙", c: "bronze" } : { t: "見習", c: "" };
}
export function QuizModal({ allKits, getRec, images, extras, albumMeta, builderName, onClose }) {
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
          const entry = { id: ach.id, name: ach.name || "称号", candIds: new Set(cands.map((c) => c.id)), cands };
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

  const genBatch = (n) => buildQuiz(allKits, recs, n, "mix", achQuiz, photoKits);
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
    const qs = buildQuiz(allKits, recs, n, cat, achQuiz, photoKits);
    if (qs.length === 0) { alert("出題できるデータが足りません。"); return; }
    setQuestions(qs); setQi(0); setAnswered(null); setSel([]);
    setScore(0); setStreak(0); setMaxStreak(0); setPhase("playing");
  };
  const startInfinite = () => {
    setMode("infinite");
    const qs = genBatch(QUIZ_INF_BATCH);
    if (qs.length === 0) { alert("出題できるデータが足りません。"); return; }
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
  const abort = () => { if (window.confirm("クイズを中断しますか?(進行中の結果は記録されません)")) { stopTimer(); if (advRef.current) clearTimeout(advRef.current); onClose(); } };

  const q = questions[qi];
  const isMulti = q && Array.isArray(q.answer);
  const ratio = Math.max(0, Math.min(1, remain / QUIZ_LIMIT));
  const low = ratio <= 0.25;
  const cats = [["mix", "ミックス"], ["fig", "図鑑"], ["rec", "記録"], ["ach", "称号"], ["img", "画像"]];
  const catOff = (v) => (v === "rec" && recCount < QUIZ_RECMIN) || (v === "img" && photoCount < QUIZ_RECMIN) || (v === "ach" && achCount < 3);
  const rate = Math.round((score / (questions.length || 1)) * 100);
  const er = evalRank(rate);

  return (
    <div className="quiz-bg">
      <div className="quiz-wrap">
        {phase === "config" && (
          <div className="quiz-config">
            <div className="quiz-eyebrow">QUIZ · 知識試験</div>
            <h2 className="quiz-h">機体知識<em>試験</em></h2>
            <p className="quiz-lead">図鑑・記録・称号・画像から出題。各問{QUIZ_LIMIT / 1000}秒。</p>
            <button className="quiz-inf" onClick={startInfinite}>無限モード<span>全領域・無制限・一問でも誤れば終了</span></button>
            <div className="quiz-count">通常モード — 出題ジャンル</div>
            <div className="quiz-cats">
              {cats.map(([v, l]) => {
                const off = catOff(v);
                return <button key={v} className={"quiz-chip" + (cat === v ? " on" : "") + (off ? " off" : "")} disabled={off} onClick={() => setCat(v)}>{l}</button>;
              })}
            </div>
            {(recCount < QUIZ_RECMIN || photoCount < QUIZ_RECMIN) && <div className="quiz-note">「記録」は所持{QUIZ_RECMIN}件、「画像」は写真{QUIZ_RECMIN}件以上で解放（所持 {recCount}・写真 {photoCount}）。</div>}
            <div className="quiz-count">出題数</div>
            <div className="quiz-count-row">
              {[5, 10, 15].map((n) => <button key={n} className="quiz-cbtn" onClick={() => start(n)}>{n}問</button>)}
            </div>
            {best && <div className="quiz-best">通常モード自己ベスト　正答率 {best.rate}%　／　最大連続 {best.streak}</div>}
            {board && board.length > 0 && (
              <div className="quiz-board">
                <div className="quiz-board-h">無限モード番付<span>INFINITE RANKING</span></div>
                {board.slice(0, 8).map((e, i) => (
                  <div key={i} className={"qb-row" + (i < 3 ? " top top" + (i + 1) : "")}>
                    <span className="qb-rank">{i < 3 ? ["①", "②", "③"][i] : i + 1}</span>
                    <span className="qb-name">{e.name}</span>
                    <span className="qb-count">{e.count}<i>問</i></span>
                  </div>
                ))}
              </div>
            )}
            <button className="quiz-close" onClick={onClose}>閉じる</button>
          </div>
        )}

        {phase === "playing" && q && (
          <div className="quiz-play">
            <div className="quiz-top">
              <span className="quiz-prog">{mode === "infinite" ? "∞ " + (qi + 1) + "問目" : (qi + 1) + " / " + questions.length}</span>
              <span className="quiz-sc">正解 {score}　連続 {streak}</span>
              <button className="quiz-abort" onClick={abort}>中断</button>
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
            {isMulti && !answered && <button className="quiz-decide" onClick={submitMulti}>決定する（{sel.length}件選択）</button>}
            {answered && (
              <div className={"quiz-fb " + (answered.correct ? "ok" : "ng")}>
                <div className="quiz-fb-mark">{answered.correct ? (mode === "infinite" ? "◎ 正解 ・ " + (qi + 1) + "問突破" : "◎ 正解") : (answered.timeout ? "✕ 時間切れ" : "✕ 不正解")}</div>
                {(mode === "normal" || !answered.correct) && <div className="quiz-fb-ex">{q.explain}</div>}
                {mode === "normal"
                  ? <button className="quiz-next" onClick={next}>{qi + 1 >= questions.length ? "結果を見る" : "次の問題へ"}</button>
                  : (!answered.correct && <button className="quiz-next" onClick={() => setPhase("result")}>結果へ</button>)}
              </div>
            )}
          </div>
        )}

        {phase === "result" && (
          <div className="quiz-result">
            {mode === "infinite" ? (
              <>
                <div className="quiz-eyebrow">INFINITE · 無限モード</div>
                {runNew && <div className="qr-new">★ 自己新記録 ★</div>}
                <div className="qr-ring"><div className="qr-big">{runCount}</div><div className="qr-unit">問突破</div></div>
                {runRank > 0 && <div className={"qr-rank" + (runRank <= 3 ? " top" : "")}>番付 第 {runRank} 位</div>}
                <div className="quiz-rate">挑戦者　{(builderName && builderName.trim()) || "NO NAME"}</div>
              </>
            ) : (
              <>
                <div className="quiz-eyebrow">RESULT · 結果</div>
                <div className={"qr-badge " + er.c}>{er.t}</div>
                <div className="qr-ring"><div className="qr-big">{score}</div><div className="qr-unit">/ {questions.length}</div></div>
                <div className="quiz-rate">正答率 {rate}%　最大連続 {maxStreak}</div>
                {best && <div className="quiz-best">自己ベスト　正答率 {best.rate}%　／　最大連続 {best.streak}</div>}
              </>
            )}
            <div className="quiz-res-btns">
              <button className="quiz-cbtn" onClick={() => setPhase("config")}>もう一度</button>
              <button className="quiz-close" onClick={onClose}>閉じる</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
