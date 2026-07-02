/* ───────────────────────────────────────────────────────────
   use-auth.js — アカウント(託管バックエンド)セッションフック
   ─────────────────────────────────────────────────────────────
   ・起動時:端末保存のセッションを復元。期限切れなら refresh_token で更新。
   ・自動更新:期限 60 秒前に refresh(失敗=ログアウト扱いにせず据え置き。
     次回 API 401 時にユーザーが再ログインすればよい——静かに壊さない)。
   ・managedOn() が false の間は何もしない(挙動不変)。
   ─────────────────────────────────────────────────────────── */
import { useState, useEffect, useRef, useCallback } from "react";
import { MANAGED_BACKEND, managedOn } from "./backend-config.js";
import {
  sendOtp, verifyOtp, refreshSession, signOutRemote, deleteAccountRemote,
  loadStoredSession, saveStoredSession, clearStoredSession, sessionValid,
} from "./auth.js";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!managedOn()); // 託管オフなら即 ready
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState("");
  const timerRef = useRef(null);
  const cfg = MANAGED_BACKEND;

  const adopt = useCallback(async (s) => {
    setSession(s);
    if (s) await saveStoredSession(s); else await clearStoredSession();
  }, []);

  /* 起動時復元(+期限切れなら更新) */
  useEffect(() => {
    if (!managedOn()) return;
    let alive = true;
    (async () => {
      try {
        const stored = await loadStoredSession();
        if (stored && stored.refresh_token) {
          // 起動時は常に refresh を先試行(server 側失効・時計ずれによる 401 を予防)。
          try {
            const fresh = await refreshSession(cfg, stored.refresh_token);
            if (alive && fresh) { setSession(fresh); await saveStoredSession(fresh); }
          } catch (e) {
            // refresh 不可でもローカル的に有効なら据え置き採用(オフライン起動)
            if (alive && sessionValid(stored)) setSession(stored);
          }
        } else if (stored && sessionValid(stored)) { if (alive) setSession(stored); }
      } finally { if (alive) setAuthReady(true); }
    })();
    return () => { alive = false; };
  }, []);

  /* 自動更新:期限 60 秒前 */
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!session || !session.refresh_token) return;
    const ms = Math.max(5000, session.expiresAt - Date.now() - 60 * 1000);
    timerRef.current = setTimeout(async () => {
      try {
        const fresh = await refreshSession(cfg, session.refresh_token);
        if (fresh) await adopt(fresh);
      } catch (e) { /* 静かに据え置き。次回操作の 401 で再ログイン導線へ */ }
    }, ms);
    return () => clearTimeout(timerRef.current);
  }, [session, adopt]);

  /* ── UI 用 API ── */
  const startSignIn = useCallback(async (email, L) => {
    setAuthBusy(true); setAuthMsg("");
    try {
      await sendOtp(cfg, String(email || "").trim());
      setAuthMsg(L("6桁コードをメールに送信しました", "A 6-digit code was sent to your email", "已寄出 6 位數驗證碼"));
      setAuthBusy(false); return true;
    } catch (e) {
      setAuthMsg(L("送信失敗:", "Failed to send: ", "寄送失敗:") + ((e && e.message) || e));
      setAuthBusy(false); return false;
    }
  }, []);

  const confirmCode = useCallback(async (email, code, L) => {
    setAuthBusy(true); setAuthMsg("");
    try {
      const s = await verifyOtp(cfg, String(email || "").trim(), code);
      if (!s) throw new Error("no session");
      await adopt(s);
      setAuthMsg(""); setAuthBusy(false); return true;
    } catch (e) {
      setAuthMsg(L("コード検証に失敗しました:", "Code verification failed: ", "驗證碼驗證失敗:") + ((e && e.message) || e));
      setAuthBusy(false); return false;
    }
  }, [adopt]);

  const signOut = useCallback(async () => {
    const s = session;
    await adopt(null);
    if (s) signOutRemote(cfg, s.access_token); // 待たない(ローカル破棄が本体)
  }, [session, adopt]);

  const removeAccount = useCallback(async () => {
    if (!session) return false;
    await deleteAccountRemote(cfg.workerUrl, session.access_token); // 失敗は throw → 呼び出し側で表示
    await adopt(null);
    return true;
  }, [session, adopt]);

  return { session, user: session && session.user, authReady, authBusy, authMsg, setAuthMsg,
           startSignIn, confirmCode, signOut, removeAccount };
}
