/* ───────────────────────────────────────────────────────────
   kit-identify-modal.jsx — AI機体判別(画像→候補→図鑑に追加)
   App.jsx から抽出(Phase 1)。
   ─────────────────────────────────────────────────────────── */
import React, { useState, useMemo, useRef, useEffect } from "react";
import { notify } from "./dialogs.jsx";
import { normJa } from "./ja-text.js";
import { universeOfKit } from "./universe.jsx";
import { fileToCompressedDataURL, isOpenAImodel } from "./ai-config.js";
import { ModelPicker } from "./form-controls.jsx";

/* ───────── AI機体判別(Phase A):画像→候補→確認して図鑑に追加 ───────── */
const IDENT_PROMPT = `あなたはガンダムシリーズのプラモデル(ガンプラ)に精通した機体識別の専門家です。
画像に写る機体(モビルスーツ)が何かを推定してください。
手順: 箱・説明書・品番ラベルなどの印刷文字が読めれば、それを最優先の根拠にする。読めない場合は外見(シルエット・配色・特徴部位)から推定する。
回答方針(重要):
- 各候補は「正式名称(日本語)」と「登場作品」を必ず答える。
- 「型式番号」は確信があるときだけ書く。不確実なら空文字にすること(推測で型番をでっち上げない)。
- 確信が低くても、形状・配色から近いと思う機体を遠慮なく複数挙げること。1台に絞らなくてよい。「分からないので答えない」より「自信はないが近そうな候補を複数挙げる」方が望ましい。
- グレード(HG/MG/RG/PG等)やスケールは画像から判別できないため答えないこと。
確信度の高い順に最大5件。出力は次のJSONのみ。前後の文やマークダウンは一切付けないこと:
{"candidates":[{"name":"正式名称(日本語)","series":"作品名","code":"型式番号(確信があれば。なければ空文字)","confidence":0,"reason":"根拠"}]}
全く見当がつかない場合のみ candidates を空配列にする。`;
function _identStripJson(t) { return t ? String(t).replace(/```json/gi, "").replace(/```/g, "").trim() : ""; }
function _identParse(raw) {
  const s = _identStripJson(raw);
  try { return JSON.parse(s); } catch (e) {}
  const m = s && s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (e) {} }
  return null;
}
const IDF_BIG5 = ["UC", "SEED", "W", "G", "BF"];
const IDF_UNI_LABEL = { UC: "宇宙世紀(U.C.)", SEED: "コズミック・イラ(SEED系)", W: "アフターコロニー(Wガンダム系)", G: "フューチャーセンチュリー(Gガンダム系)", BF: "ビルドファイターズ系" };
const IDF_MODELS = [
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", note: "高精度・高速 推奨", p: "gemini" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", note: "最高精度・低速", p: "gemini" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", note: "高精度", p: "gemini" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", note: "標準・速い", p: "gemini" },
  { id: "gpt-4o", label: "GPT-4o", note: "高精度", p: "openai" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", note: "標準・速い", p: "openai" },
];

export function KitIdentifyModal({ allKits, geminiKey, openaiKey, cameraMode, onAttach, onClose, onManual, L = (ja) => ja }) {
  const [phase, setPhase] = useState("pick"); // pick | loading | result | error
  const [storeImg, setStoreImg] = useState("");
  const [cands, setCands] = useState([]);
  const [matches, setMatches] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [model, setModel] = useState("");
  const [grounding, setGrounding] = useState(false);
  const [selUni, setSelUni] = useState("");
  const [selGrade, setSelGrade] = useState("");
  const [hint, setHint] = useState("");
  const fileRef = useRef(null);
  const manualRef = useRef(null);
  const hasKey = !!(geminiKey || openaiKey);
  const models = useMemo(() => IDF_MODELS.filter((m) => (m.p === "gemini" ? geminiKey : openaiKey)), [geminiKey, openaiKey]);
  useEffect(() => { if (!model && models.length) setModel(models[0].id); }, [models, model]);
  const modelLabel = (IDF_MODELS.find((x) => x.id === model) || {}).label || model;

  const callAI = async (b64, mime, dataUrl, prompt) => {
    const m = IDF_MODELS.find((x) => x.id === model) || models[0] || { id: "gemini-2.5-flash", p: "gemini" };
    if (m.p === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + openaiKey },
        body: JSON.stringify({ model: m.id, temperature: 0.2, response_format: { type: "json_object" },
          messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: dataUrl } }] }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "OpenAI error");
      return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    }
    const gbody = { contents: [{ parts: [{ inline_data: { mime_type: mime, data: b64 } }, { text: prompt }] }] };
    if (grounding) { gbody.tools = [{ google_search: {} }]; gbody.generationConfig = { temperature: 0.2 }; }
    else { gbody.generationConfig = { responseMimeType: "application/json", temperature: 0.2 }; }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m.id}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gbody),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "Gemini error");
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    return parts.map((p) => p.text || "").join("");
  };

  const normCode = (s) => normJa(s || "").replace(/[\s\-_./()]/g, "");
  const scoreKit = (k, cand) => {
    let sc = 0;
    const cCode = normCode(cand.code), kCode = normCode(k.code);
    if (cCode && cCode.length >= 3 && kCode) {
      if (kCode === cCode) sc += 100;
      else if (kCode.indexOf(cCode) === 0 || cCode.indexOf(kCode) === 0) sc += 75;
      else if (kCode.includes(cCode) || cCode.includes(kCode)) sc += 55;
    }
    const cName = normJa(cand.name || ""), kName = normJa(k.name || "");
    if (cName && kName) {
      if (kName === cName) sc += 60;
      else if (kName.includes(cName) || cName.includes(kName)) sc += 42;
      else {
        const ct = (cName.match(/[\u3040-\u30ff\u4e00-\u9fffa-z0-9]+/g) || []);
        const shared = ct.filter((t) => t.length >= 2 && kName.includes(t)).length;
        if (shared) sc += Math.min(40, shared * 18);
      }
    }
    const cSer = normJa(cand.series || ""), kSer = normJa(k.series || "");
    if (cSer && kSer && (kSer.includes(cSer) || cSer.includes(kSer))) sc += 15;
    const u = universeOfKit(k);
    if (selUni) { if (u === selUni) sc += 30; else sc -= 40; }
    else if (IDF_BIG5.includes(u)) sc -= 40;
    return sc;
  };

  const runIdentify = async (file) => {
    setErr(""); setPhase("loading");
    try {
      const storeData = await fileToCompressedDataURL(file, 1080, 0.8);
      const aiData = await fileToCompressedDataURL(file, 1024, 0.82);
      setStoreImg(storeData);
      const m = /^data:([^;]+);base64,(.*)$/.exec(aiData);
      const mime = m ? m[1] : "image/jpeg";
      const b64 = m ? m[2] : (aiData.split(",")[1] || "");
      let prompt = IDENT_PROMPT;
      if (selUni) prompt += "\nユーザー情報: この機体は『" + (IDF_UNI_LABEL[selUni] || selUni) + "』の作品系の機体である。この作品系を優先的に検討すること。";
      else prompt += "\nユーザー情報: この機体は U.C.(宇宙世紀)・SEED・Wガンダム・Gガンダム・ビルド系 のいずれにも属さない作品の機体である可能性が高い。";
      if (hint.trim()) prompt += "\nユーザーからのヒント: " + hint.trim();
      const raw = await callAI(b64, mime, aiData, prompt);
      const parsed = _identParse(raw);
      const list = (parsed && Array.isArray(parsed.candidates)) ? parsed.candidates : [];
      setCands(list);
      const best = new Map(); // kitId -> {kit, conf, reason, total}
      for (const cd of list) {
        const conf = Number(cd.confidence) || 0;
        for (const k of allKits) {
          const s = scoreKit(k, cd);
          if (s < 32) continue;
          const total = s + conf * 0.3;
          const prev = best.get(k.id);
          if (!prev || total > prev.total) best.set(k.id, { kit: k, conf, reason: cd.reason || "", total });
        }
      }
      const out = [...best.values()].sort((a, b) => b.total - a.total).slice(0, 30);
      setMatches(out);
      setPhase("result");
    } catch (e) { setErr((e && e.message) || String(e)); setPhase("error"); }
  };

  const searchResults = useMemo(() => {
    const s = normJa(q.trim());
    if (!s) return [];
    return allKits.filter((k) => normJa([k.name, k.code, k.series].filter(Boolean).join(" ")).includes(s)).slice(0, 20);
  }, [q, allKits]);
  const gradeOpts = useMemo(() => [...new Set((allKits || []).map((k) => k.grade).filter(Boolean))], [allKits]);
  const uniOk = (k) => (selUni ? universeOfKit(k) === selUni : !IDF_BIG5.includes(universeOfKit(k)));
  const shownMatches = matches.filter((mm) => (!selGrade || mm.kit.grade === selGrade) && uniOk(mm.kit)).slice(0, 16);
  const shownSearch = searchResults.filter((k) => (!selGrade || k.grade === selGrade) && uniOk(k));

  const attach = (kit) => {
    onAttach(kit.id, storeImg);
    notify(L("「","「","「") + kit.name + "（" + (kit.grade || "") + L("）」に画像を追加しました","）added an image","）已新增圖片"), { kind: "ok" });
    onClose();
  };

  return (
    <div className="modal-bg search-modal-bg" onClick={onClose}>
      <div className="modal search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sm-head">
          <span className="sm-title">{L(<>機体<em>判別</em></>,<>AI ID</>,<>機體<em>判別</em></>)} <span className="sm-eyebrow">AI IDENTIFY</span></span>
          <button className="modal-x static" onClick={onClose}>✕</button>
        </div>
        {!hasKey && <p className="idf-note">{L("設定タブで Gemini か OpenAI の APIキーを入力してください(画像はそのAIに送信されます)。","Add a Gemini or OpenAI API key in Settings (the image is sent to that AI).","請在設定填入 Gemini 或 OpenAI 的 API 金鑰(圖片會送往該 AI)。")}</p>}
        {phase === "pick" && hasKey && (
          <div className="idf-pick">
            <p className="idf-lead">{L("写真を選ぶと、AIが機体(MS)を推定し、図鑑の候補を提示します。グレードは写真で判別できないため、候補からあなたが選びます。","Pick a photo and the AI guesses the unit (MS) and suggests registry matches. Grade can't be read from a photo, so you pick it from the candidates.","選擇照片後，AI 會推測機體(MS)並提供圖鑑候選。等級無法由照片判別，需由你從候選中選擇。")}</p>
            <div className="idf-modelfield">
              <ModelPicker value={model} options={models.map((mm) => ({ value: mm.id, label: mm.label, note: mm.note }))} onChange={setModel} label={L("辨識モデル（精度テスト用）","Identify model (accuracy test)","辨識模型(精度測試用)")} />
            </div>
            <div className="idf-ground">
              <label className="idf-switch">
                <input type="checkbox" checked={grounding && !isOpenAImodel(model)} disabled={isOpenAImodel(model)} onChange={(e) => setGrounding(e.target.checked)} />
                <span>{L("Google検索でグラウンディング（Gemini限定・精度↑/低速。無料枠超過で課金注意）","Ground with Google Search (Gemini only · higher accuracy / slower. May incur charges beyond free tier)","以 Google 搜尋接地(限 Gemini・精度↑/較慢。超出免費額度可能計費)")}</span>
              </label>
            </div>
            <div className="idf-hints">
              <div className="idf-field">
                <span>{L("世界観で絞る（任意・1つ。未選択＝上記以外の世界として絞り込み）","Filter by universe (optional · one. Unselected = treat as other universe)","依世界觀篩選(選填・一個。未選＝視為其他世界觀)")}</span>
                <div className="idf-unis">
                  {[["UC", "UC"], ["SEED", "SEED"], ["W", "W"], ["G", "G"], ["BF", "BF"]].map(([v, l]) => (
                    <button key={v} type="button" className={"idf-ubtn" + (selUni === v ? " on" : "")}
                      onClick={() => setSelUni(selUni === v ? "" : v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="idf-field">
                <span>{L("グレードで絞る（任意・1つ。該当しないグレードを除外して候補を縮小）","Filter by grade (optional · one. Narrows candidates)","依等級篩選(選填・一個。縮小候選)")}</span>
                <div className="idf-grades">
                  {gradeOpts.map((g) => <button key={g} type="button" className={"idf-gbtn" + (selGrade === g ? " on" : "")} onClick={() => setSelGrade(selGrade === g ? "" : g)}>{g}</button>)}
                </div>
              </div>
              <label className="idf-field">
                <span>{L("ヒント(任意・AIへ送信)","Hint (optional · sent to AI)","提示(選填・送往 AI)")}</span>
                <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder={L("例: ○○の主役機 / 特徴的な配色","e.g. lead unit of ○○ / distinctive colors","例: ○○的主角機 / 特徵配色")} />
              </label>
            </div>
            <button className="btn primary idf-choose" onClick={() => fileRef.current && fileRef.current.click()}>{cameraMode ? L("カメラを起動して撮影","Open camera","開啟相機拍攝") : L("画像を選ぶ / 撮影","Choose / take a photo","選擇圖片 / 拍攝")}</button>
            <input ref={fileRef} type="file" accept="image/*" capture={cameraMode ? "environment" : undefined} style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) runIdentify(f); }} />
          </div>
        )}
        {phase === "loading" && <div className="idf-loading">{L("AIが判別中…","AI is identifying…","AI 判別中…")}</div>}
        {phase === "error" && (
          <div className="idf-pick">
            <p className="idf-note">{L("判別に失敗しました: ","Identification failed: ","判別失敗: ")}{err}</p>
            <button className="btn primary idf-choose" onClick={() => setPhase("pick")}>{L("やり直す","Try again","重試")}</button>
          </div>
        )}
        {phase === "result" && (
          <div className="idf-result">
            {storeImg && <div className="idf-preview"><img src={storeImg} alt="" /></div>}
            <div className="idf-modelnote">{L("判別モデル: ","Model: ","判別模型: ")}{modelLabel}</div>
            {cands.length > 0 ? (
              <div className="idf-ai">
                <div className="idf-sub">{L("AIの推定（タップで検索）","AI guesses (tap to search)","AI 推測(點擊搜尋)")}</div>
                <div className="idf-chips">
                  {cands.slice(0, 5).map((cd, i) => {
                    const lab = (cd.name || cd.code || "?") + (cd.code && cd.name ? " " + cd.code : "");
                    return <button key={i} className="idf-chip" onClick={() => { setQ(cd.name || cd.code || ""); setTimeout(() => { if (manualRef.current) manualRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60); }}>{lab}{cd.confidence ? " (" + cd.confidence + "%)" : ""}</button>;
                  })}
                </div>
              </div>
            ) : <p className="idf-note">{L("AIは機体を特定できませんでした。箱・説明書が写るように撮ると精度が大きく上がります。下で検索しても選べます。","The AI couldn't identify the unit. Including the box or manual in the shot improves accuracy a lot. You can also search below.","AI 無法判別機體。讓外盒・說明書入鏡可大幅提升精度。也可在下方搜尋。")}</p>}
            {gradeOpts.length > 0 && (
              <div className="idf-gfilter">
                <span>{L("グレードで絞る","Filter by grade","依等級篩選")}</span>
                <div className="idf-grades">
                  {gradeOpts.map((g) => <button key={g} type="button" className={"idf-gbtn" + (selGrade === g ? " on" : "")} onClick={() => setSelGrade(selGrade === g ? "" : g)}>{g}</button>)}
                </div>
              </div>
            )}
            {shownMatches.length > 0 ? (
              <div className="idf-cands">
                <div className="idf-sub">{L("候補（グレードを含め選択）","Candidates (pick incl. grade)","候選(含等級選擇)")}</div>
                {shownMatches.map(({ kit, conf, reason }) => (
                  <button key={kit.id} className="fix-row" onClick={() => attach(kit)}>
                    <span className="fix-row-name">{kit.name}{conf ? <em className="idf-conf"> {conf}%</em> : null}</span>
                    <span className="fix-row-sub">{[kit.grade, kit.code, kit.series].filter(Boolean).join(" · ")}{reason ? " ／ " + reason : ""}</span>
                  </button>
                ))}
              </div>
            ) : (matches.length > 0 && selGrade
              ? <p className="idf-note">{L("選択したグレード(","No candidates for the selected grade (","找不到所選等級(")}{selGrade}{L(")の候補が見つかりません。グレード選択を解除するか、下で検索してください。","). Clear the grade filter or search below.",")的候選。請取消等級篩選或於下方搜尋。")}</p>
              : null)}
            <div className="idf-manual" ref={manualRef}>
              <div className="idf-sub">{L("手動で検索","Search manually","手動搜尋")}</div>
              <div className="toolbar">
                <input className="search" placeholder={L("名称・型式・原作で検索","Search name, code, series","搜尋名稱・型式・原作")} value={q} onChange={(e) => setQ(e.target.value)} />
                {q && <button className="search-x" onClick={() => setQ("")}>✕</button>}
              </div>
              <div className="fix-results">
                {shownSearch.map((k) => (
                  <button key={k.id} className="fix-row" onClick={() => attach(k)}>
                    <span className="fix-row-name">{k.name}</span>
                    <span className="fix-row-sub">{[k.grade, k.code, k.series].filter(Boolean).join(" · ")}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {onManual && (
          <button type="button" className="idf-manual-add" onClick={onManual}>{L("自分で入力","Enter manually","自行輸入")}</button>
        )}
      </div>
    </div>
  );
}
