/* ───────────────────────────────────────────────────────────
   utils.js — 共有ユーティリティ(触覚フィードバック)
   App.jsx から切り出し。HAPTIC_ON は設定で切替、書き込みは setHapticEnabled 経由。
   ─────────────────────────────────────────────────────────── */

/* ── 觸覺回饋(iOS Safari 以 switch checkbox 技巧觸發,17.4+) ── */
let HAPTIC_ON = true; // 設定で切替(全体ON/OFF)
export function setHapticEnabled(b) { HAPTIC_ON = b !== false; }
export function haptic() {
  if (!HAPTIC_ON) return;
  try {
    if (navigator.vibrate) { navigator.vibrate(12); return; }
    const l = document.createElement("label");
    l.style.cssText = "position:fixed;left:-100px;top:-100px;opacity:0";
    const i = document.createElement("input");
    i.type = "checkbox";
    i.setAttribute("switch", "");
    l.appendChild(i);
    document.body.appendChild(l);
    l.click();
    setTimeout(() => { try { document.body.removeChild(l); } catch (e) {} }, 60);
  } catch (e) {}
}

/* ── 強めの触覚フィードバック(予定マーク・モード切替用) ── */
export function hapticStrong() {
  if (!HAPTIC_ON) return;
  try { if (navigator.vibrate) { navigator.vibrate([18, 30, 18]); return; } } catch (e) {}
  haptic();
}

/* ── ゴーストクリック対策(App.jsx から抽出・Phase 1) ── */
// pointerup 起点で閉じるビューアの「ゴーストクリック」を1回だけ握り潰す(背景への突き抜けタップ防止)。
export function swallowNextClick() {
  if (typeof document === "undefined") return;
  const h = (e) => { e.stopPropagation(); e.preventDefault(); document.removeEventListener("click", h, true); clearTimeout(t); };
  const t = setTimeout(() => document.removeEventListener("click", h, true), 700);
  document.addEventListener("click", h, true);
}

// 長押し中に画面遷移する場合の貫通対策。押下時点で swallowNextClick を仕込むと、
// 保持が長い(>700ms)と窓が切れて背景に貫通する。そこで「指を離した瞬間」に武装する。
export function swallowNextClickOnRelease() {
  if (typeof document === "undefined") return;
  const arm = () => { cleanup(); swallowNextClick(); };
  function cleanup() {
    document.removeEventListener("pointerup", arm, true);
    document.removeEventListener("pointercancel", arm, true);
    document.removeEventListener("touchend", arm, true);
    document.removeEventListener("mouseup", arm, true);
    clearTimeout(t);
  }
  const t = setTimeout(cleanup, 8000); // 保持がどれだけ長くてもOK。純粋なリーク防止用の上限
  document.addEventListener("pointerup", arm, true);
  document.addEventListener("pointercancel", arm, true);
  document.addEventListener("touchend", arm, true);
  document.addEventListener("mouseup", arm, true);
}
