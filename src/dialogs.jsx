/* ───────────────────────────────────────────────────────────
   dialogs.jsx — アプリ内通知/確認(native alert・confirm の置換)
   CustomEvent 経由で疎結合。App.jsx から抽出(Phase 1)。
   ─────────────────────────────────────────────────────────── */
import React, { useState, useEffect } from "react";

/* ── アプリ内 通知/確認(native alert/confirm の置き換え。APP風) ── */
let _toastSeq = 0;
export function notify(msg, opt) {
  try { window.dispatchEvent(new CustomEvent("app-toast", { detail: { id: ++_toastSeq, msg, kind: (opt && opt.kind) || "ok", variant: (opt && opt.variant) || "", tag: (opt && opt.tag) || "", tap: (opt && opt.tap) || "", dur: (opt && opt.dur) || 2400 } })); }
  catch (e) {}
}
export function appConfirm(message, opt) {
  return new Promise((resolve) => {
    try { window.dispatchEvent(new CustomEvent("app-confirm", { detail: { message, opt: opt || {}, resolve } })); }
    catch (e) { resolve(typeof window !== "undefined" && window.confirm ? window.confirm(message) : false); }
  });
}
export function AppDialogHost() {
  const [toasts, setToasts] = useState([]);
  const [cf, setCf] = useState(null);
  useEffect(() => {
    const onT = (e) => { const t = e.detail; setToasts((a) => [...a, t]); setTimeout(() => setToasts((a) => a.filter((x) => x.id !== t.id)), t.dur); };
    const onC = (e) => setCf(e.detail);
    window.addEventListener("app-toast", onT);
    window.addEventListener("app-confirm", onC);
    return () => { window.removeEventListener("app-toast", onT); window.removeEventListener("app-confirm", onC); };
  }, []);
  const done = (v) => { if (cf && cf.resolve) cf.resolve(v); setCf(null); };
  const ic = { ok: "✓", err: "✕", warn: "!", info: "◈" };
  return (
    <>
      <div className="toast-host">
        {toasts.map((t) => (
          t.variant === "decree" ? (
            <div key={t.id} className="toast decree"
              {...(t.tap ? { role: "button", style: { pointerEvents: "auto", cursor: "pointer" },
                onClick: () => { window.dispatchEvent(new CustomEvent("app-toast-tap", { detail: t.tap })); setToasts((a) => a.filter((x) => x.id !== t.id)); } } : {})}>
              <span className="toast-hex"><svg viewBox="0 0 64 64" aria-hidden="true"><polygon points="32,8 50,18 50,40 32,52 14,40 14,18" fill="none" stroke="var(--gold)" strokeWidth="4" /></svg></span>
              <span className="tm">{t.msg}</span>
              {t.tag ? <span className="toast-tag">{t.tag}</span> : null}
              {t.tap ? <span aria-hidden="true" style={{ flex: "none", color: "var(--gold)", fontSize: "13px", opacity: .7, marginLeft: "1px" }}>›</span> : null}
            </div>
          ) : (
            <div key={t.id} className={"toast " + t.kind}><span className="ti">{ic[t.kind] || "◈"}</span><span className="tm">{t.msg}</span></div>
          )
        ))}
      </div>
      {cf ? (
        <div className="cf-bg" onClick={() => done(false)}>
          <div className="cf-card" onClick={(e) => e.stopPropagation()}>
            <div className="cf-line" />
            {cf.opt.title ? <div className="cf-h">{cf.opt.title}</div> : null}
            <div className="cf-m">{cf.message}</div>
            <div className="cf-acts">
              <button className="cf-btn" onClick={() => done(false)}>{cf.opt.cancelText || "キャンセル"}</button>
              <button className={"cf-btn ok" + (cf.opt.danger ? " danger" : "")} onClick={() => done(true)}>{cf.opt.okText || "OK"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
