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
