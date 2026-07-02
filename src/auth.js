/* ───────────────────────────────────────────────────────────
   auth.js — Supabase Auth の REST クライアント(SDK 非依存・零依存方針)
   ─────────────────────────────────────────────────────────────
   フロー:メール OTP(6桁コード)。パスワードレス=リセット導線が不要。
     sendOtp    → POST /auth/v1/otp        (メールにコード送信・未登録なら作成)
     verifyOtp  → POST /auth/v1/verify     (コード検証 → セッション発行)
     refresh    → POST /auth/v1/token?grant_type=refresh_token
     signOut    → POST /auth/v1/logout
   セッションは端末ローカル(window.storage "mg_auth")にのみ保存。
   同期(kv)にも備份にも一切載らない(settings 外の独立鍵)。

   ★Sign in with Apple 差し替え点(Phase 3・Capacitor):
     原生フローで得た id_token を
       POST {url}/auth/v1/token?grant_type=id_token
       body: { provider: "apple", id_token }
     に渡せば同形のセッションが返る。normalizeSession 以降は共通。
   ─────────────────────────────────────────────────────────── */

export const AUTH_KEY = "mg_auth";

const hdr = (anonKey, token) => ({
  "Content-Type": "application/json",
  apikey: anonKey,
  ...(token ? { Authorization: "Bearer " + token } : {}),
});

async function jfetch(url, opt) {
  const res = await fetch(url, opt);
  let data = null;
  try { data = await res.json(); } catch (e) { /* 空応答(logout 等) */ }
  if (!res.ok) {
    const msg = (data && (data.msg || data.message || (data.error_description) || (data.error && data.error.message))) || ("HTTP " + res.status);
    const err = new Error(msg); err.status = res.status; throw err;
  }
  return data;
}

/* ── 純関数:セッション正規化・有効判定(テスト対象) ── */
export function normalizeSession(raw, nowMs) {
  if (!raw || !raw.access_token) return null;
  const now = nowMs != null ? nowMs : Date.now();
  // expires_at(秒)優先、無ければ expires_in から合成
  const expSec = typeof raw.expires_at === "number" ? raw.expires_at
    : now / 1000 + (typeof raw.expires_in === "number" ? raw.expires_in : 3600);
  const u = raw.user || {};
  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token || "",
    expiresAt: Math.floor(expSec * 1000),
    user: { id: u.id || "", email: u.email || "" },
  };
}
export function sessionValid(s, skewMs = 60 * 1000, nowMs) {
  const now = nowMs != null ? nowMs : Date.now();
  return !!(s && s.access_token && s.expiresAt - skewMs > now);
}

/* ── Auth REST(cfg = { url, anonKey })── */
export async function sendOtp(cfg, email) {
  return jfetch(cfg.url + "/auth/v1/otp", {
    method: "POST", headers: hdr(cfg.anonKey),
    body: JSON.stringify({ email, create_user: true }),
  });
}
export async function verifyOtp(cfg, email, code) {
  const data = await jfetch(cfg.url + "/auth/v1/verify", {
    method: "POST", headers: hdr(cfg.anonKey),
    body: JSON.stringify({ type: "email", email, token: String(code || "").trim() }),
  });
  return normalizeSession(data);
}
export async function refreshSession(cfg, refresh_token) {
  const data = await jfetch(cfg.url + "/auth/v1/token?grant_type=refresh_token", {
    method: "POST", headers: hdr(cfg.anonKey),
    body: JSON.stringify({ refresh_token }),
  });
  return normalizeSession(data);
}
export async function signOutRemote(cfg, access_token) {
  try {
    await jfetch(cfg.url + "/auth/v1/logout", { method: "POST", headers: hdr(cfg.anonKey, access_token) });
  } catch (e) { /* 失効済み等は無視(ローカル破棄が本体) */ }
}

/* ── アカウント削除:Worker 経由(service_role はサーバにのみ存在) ── */
export async function deleteAccountRemote(workerUrl, access_token) {
  const root = String(workerUrl || "").trim().replace(/\/+$/, "");
  if (!root) throw new Error("workerUrl not configured");
  return jfetch(root + "/v1/account/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + access_token },
    body: "{}",
  });
}

/* ── セッションの端末保存(window.storage。同期・備份の対象外) ── */
export async function loadStoredSession() {
  try {
    const r = await window.storage.get(AUTH_KEY);
    if (r && r.value) return JSON.parse(r.value);
  } catch (e) { /* 未ログイン */ }
  return null;
}
export async function saveStoredSession(s) {
  try { await window.storage.set(AUTH_KEY, JSON.stringify(s)); } catch (e) {}
}
export async function clearStoredSession() {
  try { await window.storage.delete(AUTH_KEY); } catch (e) {
    try { await window.storage.set(AUTH_KEY, ""); } catch (e2) {}
  }
}
