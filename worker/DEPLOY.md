# AI 代理 Worker — 配置手順

## 0. 前提
- Cloudflare アカウント(無料枠で可)
- `npm i -g wrangler` → `wrangler login`

## 1. 機密の登録(worker/ ディレクトリで)
```bash
wrangler secret put GEMINI_API_KEY     # AIza...
wrangler secret put OPENAI_API_KEY    # sk-...(OpenAI を使わないなら省略可)
wrangler secret put PROXY_TOKENS      # 例: openssl rand -hex 24 の出力。複数はカンマ区切り
```

## 2.(任意)計量 KV
```bash
wrangler kv namespace create USAGE
# 出力された id を wrangler.toml の [[kv_namespaces]] に貼ってコメント解除
```
KV 無しでも動く(計量スキップ)。修正提案(/v1/report)を使うなら REPORTS も同様に作成。

## 3. デプロイ
```bash
wrangler deploy
# → https://gunpla-ai-proxy.<subdomain>.workers.dev
```

## 4. 動作確認
```bash
curl https://gunpla-ai-proxy.<subdomain>.workers.dev/v1/health
# {"ok":true,"version":"0.1.0"}
```

## 5. アプリ側の設定
設定 → AI画像生成 →
- 「AI 代理 URL」に Worker の URL
- 「AI 代理トークン」に PROXY_TOKENS のいずれか

以後、識別・スタイル変換は Worker 経由になり、端末の Gemini/OpenAI キーは不要
(空にしてよい)。代理 URL を空に戻せば従来の BYO キー直叩きに戻る。

## 6. 本番前に
- ALLOWED_ORIGINS を PWA のドメインに絞る
- DAILY_QUOTA を調整
- Phase 2 後半:PROXY_TOKENS → Supabase Auth JWT 検証へ(ai-proxy.js の verifyToken のみ差し替え)
