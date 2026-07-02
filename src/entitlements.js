/* ───────────────────────────────────────────────────────────
   entitlements.js — 版本・権益(entitlement)の単一の真実源
   App.jsx から抽出(Phase 1)。★Phase 4(IAP/RevenueCat)の差し替え点:
   ENTITLEMENTS.tier の供給元と FEATURES の宣言だけを差し替える。
   ─────────────────────────────────────────────────────────── */
/* ───────── 商用化シーム(① 版本/公告 ② 権益)──────────────────────────
   いずれも「接縫のみ・現状の挙動は不変」。将来の商用化はこの周辺の
   供給元を差し替えるだけで済むよう、判断を 1 箇所に集約しておく。 */
export const APP_VERSION = "1.0.0";              // 設定に表示。delta の minAppVersion と比較
// semver 緩い比較(-1 / 0 / 1)。数値以外や桁数差にも耐える。
export function cmpVer(a, b) {
  const pa = String(a == null ? "0" : a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b == null ? "0" : b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}
// 権益(entitlement)の単一の真実源。現在は全機能を free で開放(= 挙動不変)。
// 将来の課金導入時は (a) ENTITLEMENTS.tier の供給元(IAP/Stripe/バックエンド)と
// (b) FEATURES の宣言、この 2 箇所だけ差し替える。UI 側は hasFeature() を呼ぶだけ。
export const ENTITLEMENTS = { tier: "free" };
export const FEATURES = {};                      // 例: { aiUnlimited: ["pro","max"] }(必要 tier を宣言)
export function hasFeature(feature) {
  const need = FEATURES[feature];
  if (!need || !need.length) return true; // 未宣言の機能は誰でも可(現状=全機能開放)
  return need.indexOf(ENTITLEMENTS.tier) >= 0;
}
