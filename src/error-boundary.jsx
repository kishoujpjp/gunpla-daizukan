/* ───────────────────────────────────────────────────────────
   error-boundary.jsx — 描画例外の境界 + 回報縫い目
   ・React ツリー内の例外を捕捉し、白画面の代わりに復帰 UI を出す。
   ・回報は setErrorReporter() で差し替え可能(既定は console.error)。
     Phase 2 で Sentry 等を導入する際、この 1 関数だけ呼べばよい:
       import * as Sentry from "@sentry/react";
       setErrorReporter((err, ctx) => Sentry.captureException(err, { extra: ctx }));
   ・unhandledrejection(Promise の未捕捉拒否)も同じ縫い目へ転送する。
     既存の window "error" オーバーレイ(App.jsx の __mgErrHook)は温存。
   ・フォールバック UI は app.css に依存しない(CSS 読込自体が壊れた場合
     でも表示できるよう、全て inline style)。文言は三語併記(設定の言語
     state に到達できない層のため)。
   ─────────────────────────────────────────────────────────── */
import React from "react";

let REPORTER = (err, ctx) => { try { console.error("[mg-zukan]", err, ctx || ""); } catch (e) {} };
export function setErrorReporter(fn) { if (typeof fn === "function") REPORTER = fn; }
export function reportError(err, ctx) { try { REPORTER(err, ctx); } catch (e) {} }

/* Promise 未捕捉拒否 → 回報縫い目へ(UI は出さない。挙動不変の観測のみ) */
if (typeof window !== "undefined" && !window.__mgRejHook) {
  window.__mgRejHook = true;
  window.addEventListener("unhandledrejection", (ev) => {
    reportError(ev && ev.reason, { source: "unhandledrejection" });
  });
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, showDetail: false };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    this.setState({ info });
    reportError(error, { source: "render", componentStack: info && info.componentStack });
  }
  render() {
    if (!this.state.error) return this.props.children;
    const err = this.state.error;
    const msg = (err && (err.message || String(err))) || "unknown error";
    const stack = (this.state.info && this.state.info.componentStack) || (err && err.stack) || "";
    const S = {
      wrap: { position: "fixed", inset: 0, background: "#0d1018", color: "#e7e2d6", zIndex: 99999,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "24px", fontFamily: "'Shippori Mincho','Hiragino Mincho ProN',serif", textAlign: "center" },
      stamp: { fontSize: 11, letterSpacing: ".3em", color: "#d9b36a", border: "1px solid #d9b36a",
               padding: "4px 14px 3px", marginBottom: 18 },
      h: { fontSize: 17, fontWeight: 700, margin: "0 0 10px", lineHeight: 1.6 },
      p: { fontSize: 12.5, color: "#9aa0ae", margin: "0 0 22px", lineHeight: 1.9, maxWidth: 420 },
      btn: { padding: "12px 28px", borderRadius: 10, border: "1px solid #d9b36a",
             background: "linear-gradient(160deg,rgba(217,179,106,.16),#171c28)", color: "#d9b36a",
             fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
      sub: { marginTop: 14, padding: "8px 16px", borderRadius: 10, border: "1px solid #2a3042",
             background: "transparent", color: "#565d6e", fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" },
      pre: { marginTop: 16, maxWidth: "92vw", maxHeight: "30vh", overflow: "auto", textAlign: "left",
             background: "#12161f", border: "1px solid #2a3042", borderRadius: 10, padding: "10px 12px",
             fontSize: 10.5, lineHeight: 1.5, color: "#9aa0ae", whiteSpace: "pre-wrap" },
    };
    return (
      <div style={S.wrap}>
        <span style={S.stamp}>SYSTEM&nbsp;ERROR</span>
        <h1 style={S.h}>予期しないエラーが発生しました</h1>
        <p style={S.p}>
          An unexpected error occurred. / 發生未預期的錯誤。<br />
          データは端末に保存済みです。再読み込みで復帰できます。<br />
          Your data is saved on this device — reloading should recover. / 資料已保存於裝置,重新載入即可復原。
        </p>
        <button style={S.btn} onClick={() => { try { window.location.reload(); } catch (e) {} }}>
          再読み込み / Reload / 重新載入
        </button>
        <button style={S.sub} onClick={() => this.setState((s) => ({ showDetail: !s.showDetail }))}>
          {this.state.showDetail ? "詳細を隠す / Hide detail" : "エラー詳細 / Detail"}
        </button>
        {this.state.showDetail && <pre style={S.pre}>{msg + "\n" + stack}</pre>}
      </div>
    );
  }
}
