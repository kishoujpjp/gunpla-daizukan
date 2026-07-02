/* ───────────────────────────────────────────────────────────
   ai-restyle-modal.jsx — AI スタイル変換モーダル
   App.jsx から抽出(Phase 1)。
   ─────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useRef } from "react";
import { AI_STYLES, initStyleOpts, isOpenAImodel, aiProviderLabel, AI_MODEL_OPTS } from "./ai-config.js";
import { aiRestyle } from "./ai-client.js";
import { ModelPicker } from "./form-controls.jsx";

export function AIRestyleModal({ src, geminiKey, openaiKey, proxy, model, prompts, lastStyle, onModel, onStyle, onAdopt, onClose, L = (ja) => ja }) {
  const [style, setStyle] = useState(lastStyle || AI_STYLES[0].id);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [chosenModel, setChosenModel] = useState(model);
  const [styleOpts, setStyleOpts] = useState(() => initStyleOpts(AI_STYLES.find((s) => s.id === (lastStyle || AI_STYLES[0].id)) || AI_STYLES[0]));
  const curStyle = AI_STYLES.find((s) => s.id === style) || AI_STYLES[0];
  const ctrlRef = useRef(null);
  const aliveRef = useRef(true);
  // モーダルが閉じた/再生成で差し替わった時に進行中のリクエストを確実に中止する。
  // aliveRef でアンマウント後の setState(警告/無駄な更新)も防ぐ。
  useEffect(() => () => { aliveRef.current = false; if (ctrlRef.current) ctrlRef.current.abort(); }, []);
  const cancel = () => { if (ctrlRef.current) ctrlRef.current.abort(); };

  const generate = async () => {
    setBusy(true); setError("");
    if (ctrlRef.current) ctrlRef.current.abort();      // 二重実行の保護
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const timer = setTimeout(() => ctrl.abort(), 90000); // 90秒で打ち切り(無限 busy 防止)
    try {
      const styleDef = AI_STYLES.find((s) => s.id === style) || AI_STYLES[0];
      let prompt = (prompts && prompts[style]) || styleDef.prompt;
      if (styleDef.extra) prompt = prompt + " " + styleDef.extra(styleOpts);
      /* 呼び出しは ai-client(代理 or 直叩き)。null=画像が返らない → 文言化はここ(i18n) */
      const out = await aiRestyle({ model: chosenModel, src, prompt, signal: ctrl.signal,
        cfg: { proxyUrl: proxy && proxy.url, proxyToken: proxy && proxy.token, geminiKey, openaiKey } });
      if (!out) throw new Error(isOpenAImodel(chosenModel)
        ? L("画像が返されませんでした(モデレーションの可能性があります)", "No image returned (possibly blocked by moderation)", "未回傳圖片(可能被審核阻擋)")
        : L("画像が返されませんでした(セーフティブロックの可能性があります)", "No image returned (possibly blocked by safety)", "未回傳圖片(可能被安全機制阻擋)"));
      if (aliveRef.current) setResult(out);
    } catch (e) {
      if (!aliveRef.current) { /* アンマウント済み:状態更新しない */ }
      else if (e && e.name === "AbortError") setError(L("中止しました(90秒で時間切れ、または手動キャンセル)", "Cancelled (timed out after 90s, or cancelled manually)", "已中止(90秒逾時或手動取消)"));
      else setError(String((e && e.message) || e));
    }
    clearTimeout(timer);
    ctrlRef.current = null;
    if (aliveRef.current) setBusy(false);
  };

  const adopt = async () => {
    const out = await new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        const sc = Math.min(1, 1280 / im.width);
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      im.onerror = () => res(result);
      im.src = result;
    });
    onAdopt(out, { src: "ai", model: chosenModel, style });
  };

  return (
    <div className="crop-bg">
      <div className="crop-panel">
        <div className="crop-head">{L("AIスタイル変換", "AI restyle", "AI 風格轉換")}<span>{chosenModel}</span></div>
        <div className="ai-modelpick"><ModelPicker value={chosenModel} options={AI_MODEL_OPTS} onChange={(v) => { setChosenModel(v); setResult(null); if (onModel) onModel(v); }} label={L("変換モデル", "Model", "轉換模型")} /></div>
        <div className="ai-modelpick"><ModelPicker value={style} label={L("スタイル", "Style", "風格")} options={AI_STYLES.map((s) => ({ value: s.id, label: s.label }))}
          onChange={(v) => { setStyle(v); setResult(null); setStyleOpts(initStyleOpts(AI_STYLES.find((s) => s.id === v) || AI_STYLES[0])); if (onStyle) onStyle(v); }} /></div>
        {curStyle.fields ? (
          <div className="ai-fields">
            {curStyle.fields.map((f) => f.type === "select" ? (
              <ModelPicker key={f.key} label={f.label} value={styleOpts[f.key] || ((f.options[0] && f.options[0].value) || "")}
                options={f.options} onChange={(v) => { setStyleOpts((o) => ({ ...o, [f.key]: v })); setResult(null); }} />
            ) : (
              <div key={f.key} className="ai-field">
                <div className="ai-field-lab">{f.label}</div>
                <input className="ai-field-in" value={styleOpts[f.key] || ""} placeholder={f.placeholder || ""}
                  onChange={(e) => setStyleOpts((o) => ({ ...o, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        ) : null}
        <div className="ai-preview">
          {busy ? (
            <div className="ai-progress">
              <div className="ai-bar"><i /></div>
              <span>{L("生成中…(10〜30秒ほどかかります)", "Generating… (about 10–30s)", "生成中…(約 10–30 秒)")}</span>
            </div>
          ) : (
            <img src={result || src} alt="" />
          )}
        </div>
        {error && <p className="ai-error">{error}</p>}
        <div className="crop-actions">
          {result && !busy && <button className="btn primary" onClick={adopt}>{L("この画像を採用", "Use this image", "採用此圖")}</button>}
          <button className="btn" disabled={busy} onClick={generate}>{busy ? L("生成中…", "Generating…", "生成中…") : result ? L("もう一度生成", "Regenerate", "再生成一次") : L("生成する", "Generate", "生成")}</button>
          <button className="btn" onClick={busy ? cancel : onClose}>{busy ? L("中止", "Stop", "中止") : L("やめる", "Cancel", "取消")}</button>
        </div>
        <p className="ai-note">{L("画像はお使いの端末から", "Your image is sent directly from this device to the ", "圖片會直接從此裝置送往 ")}{aiProviderLabel(model)}{L(" APIへ直接送信されます。", " API.", " API。")}</p>
      </div>
    </div>
  );
}
