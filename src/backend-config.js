/* ───────────────────────────────────────────────────────────
   backend-config.js — 託管バックエンド(開発者管理の Supabase)設定
   ─────────────────────────────────────────────────────────────
   Phase 2:BYO(使用者自带 Supabase)から託管+認証への移行点。
   ・url / anonKey が空 → 託管モードは UI に現れず、従来挙動のまま。
   ・anonKey は「公開前提」のキー(RLS が防壁。秘密は service_role のみ)。
   ・workerUrl はアカウント削除 API(/v1/account/delete)の経路。
   値は supabase/SETUP.md の手順で取得して記入する。
   ─────────────────────────────────────────────────────────── */
export const MANAGED_BACKEND = {
  url: "",        // 例: "https://xxxx.supabase.co"
  anonKey: "",    // 例: "eyJ..."(anon public)
  workerUrl: "",  // 例: "https://gunpla-ai-proxy.kishoujpjp.workers.dev"
};

export const managedOn = () => !!(MANAGED_BACKEND.url && MANAGED_BACKEND.anonKey);
