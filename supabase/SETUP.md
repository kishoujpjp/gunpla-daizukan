# 託管バックエンド(Supabase)構築手順 — Phase 2

## 1. プロジェクト作成
1. https://supabase.com → New project(無料枠で可)
2. Project Settings → API から控える:
   - **Project URL**(https://xxxx.supabase.co)
   - **anon public key**

## 2. スキーマ適用
SQL Editor → `schema.sql` の内容を貼って Run。

## 3. Auth 設定(メール OTP)
Authentication → Providers → Email:
- Enable Email provider: ON
- Confirm email: ON のままで可(OTP verify が確認を兼ねる)
Authentication → Email Templates → Magic Link / OTP はデフォルトで可
(6桁コードは {{ .Token }}。件名等は後で整える)

※ Sign in with Apple は Phase 3(Capacitor 原生化)で追加。
   Providers → Apple を有効化し、原生フローの id_token を
   /auth/v1/token?grant_type=id_token に渡すだけで、本批の
   セッション機構はそのまま使える(auth.js に差し替え点コメント有)。

## 4. アプリへの組み込み
`src/backend-config.js` を編集:
```js
export const MANAGED_BACKEND = {
  url: "https://xxxx.supabase.co",   // Project URL
  anonKey: "eyJ...",                  // anon public key(公開前提のキー。秘密は RLS が守る)
  workerUrl: "https://gunpla-ai-proxy.kishoujpjp.workers.dev", // アカウント削除の経路
};
```
空のままなら託管モードは現れず、従来挙動(BYO Supabase / 同期なし)のまま。

## 5. Worker 側(JWT 検証 + アカウント削除)
worker/ ディレクトリで:
```bash
npx wrangler secret put SUPABASE_URL --config wrangler.toml               # Project URL
npx wrangler secret put SUPABASE_ANON_KEY --config wrangler.toml          # anon key
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.toml  # service_role(削除API用・厳重管理)
npx wrangler deploy --config wrangler.toml
```
これで AI 代理は「PROXY_TOKENS の固定トークン」に加えて
「ログイン済みユーザーの Supabase JWT」も受け付ける
(=ログインすれば AI 代理トークンの手入力が不要になる)。

## 6. 動作確認
1. アプリ 設定 → アカウント → メール入力 → 送信された6桁コードを入力
2. ログイン成功後、自動で「雲端 pull → 本地全量 push」の初回移行が走る
3. 別端末で同じアカウントにログイン → データが揃うことを確認
4. 設定 → アカウント → ログアウト/アカウント削除(削除は取り消し不可・同期データも消える)
