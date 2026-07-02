/* ───────────────────────────────────────────────────────────
   ai-proxy.js — ガンプラ大図鑑 AI 代理 Worker(Cloudflare Workers)
   ─────────────────────────────────────────────────────────────
   目的(Phase 2):API キーを端末から撤去し、サーバ側で保持・計量する。
     POST /v1/identify … 機体判別(Gemini / OpenAI chat)→ { text }
     POST /v1/restyle  … 画像スタイル変換(Gemini / OpenAI images)→ { image:{b64,mime} }
     POST /v1/report   … 機体情報の修正提案(KV へ保存)→ { ok }
     GET  /v1/reports  … 修正提案一覧(ADMIN_TOKEN 必須)
     GET  /v1/health   … 稼働確認

   認証:Authorization: Bearer <token>。token は PROXY_TOKENS(カンマ区切り)
   のいずれかに一致。token がそのまま計量単位(=簡易 userId)になる。
   ★Phase 2 後半で Supabase Auth に移行する際は verifyToken() だけを
     「JWT 検証 + sub 抽出」に差し替える。呼び出し側は不変。

   計量:KV(USAGE バインド)に usage:{tokenHash}:{YYYY-MM-DD} を加算し、
   DAILY_QUOTA 超過で 429。KV 未バインドなら計量なしで通す(自用構成)。

   暴走防止:
     ・モデル白名単(ALLOWED_* env で上書き可)— 任意モデル中継によるコスト事故を防ぐ
     ・リクエスト本文 9MB 上限(base64 画像込みの安全域)
     ・CORS は ALLOWED_ORIGINS(カンマ区切り、既定 *)

   配置手順は DEPLOY.md を参照。
   ─────────────────────────────────────────────────────────── */

const VERSION = "0.1.0";
const MAX_BODY = 9 * 1024 * 1024;

/* 既定モデル白名単(client の IDF_MODELS / AI_MODELS と対応) */
const DEFAULT_IDENTIFY_MODELS = [
  "gemini-3.5-flash", "gemini-3.1-pro-preview", "gemini-2.5-pro", "gemini-2.5-flash",
  "gpt-4o", "gpt-4o-mini",
];
const DEFAULT_RESTYLE_MODELS = [
  "gemini-3-pro-image", "gemini-3.1-flash-image", "gemini-2.5-flash-image",
  "gpt-image-2", "gpt-image-1.5", "gpt-image-1-mini", "gpt-image-1",
];

export const isOpenAIModel = (m) => /^gpt/.test(m || "");

/* env の CSV → 配列(空なら fallback) */
export function csvList(v, fallback) {
  const a = String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
  return a.length ? a : fallback;
}

/* ── 認証(★Supabase Auth 差し替え点):token → userId | null ── */
export function verifyToken(req, env) {
  const h = req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  const token = m[1].trim();
  const accepted = csvList(env.PROXY_TOKENS, []);
  if (!accepted.length) return null;         // 未設定=全拒否(閉じて安全)
  if (!accepted.includes(token)) return null;
  return token;                               // 現状 token = userId(計量単位)
}

/* userId を KV キーに使う前に短縮(生 token を KV キーへ残さない) */
export async function tokenHash(userId) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ── 計量:超過なら false。KV 未バインドは常に true(自用) ── */
export async function checkAndCountQuota(env, userId) {
  if (!env.USAGE) return { ok: true, used: 0, quota: Infinity };
  const qn = parseInt(env.DAILY_QUOTA, 10);
  const quota = Number.isFinite(qn) ? qn : 50; // 0 は「全停止」として尊重(|| 50 だと 0 が既定に化ける)
  const day = new Date().toISOString().slice(0, 10);
  const key = `usage:${await tokenHash(userId)}:${day}`;
  const cur = parseInt(await env.USAGE.get(key), 10) || 0;
  if (cur >= quota) return { ok: false, used: cur, quota };
  // 競合下で厳密でない加算だが quota 用途には十分(厳密化は Durable Objects 案件)
  await env.USAGE.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 48 });
  return { ok: true, used: cur + 1, quota };
}

/* ── CORS ── */
export function corsHeaders(req, env) {
  const origins = csvList(env.ALLOWED_ORIGINS, ["*"]);
  const origin = req.headers.get("Origin") || "";
  const allow = origins.includes("*") ? "*" : (origins.includes(origin) ? origin : origins[0]);
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

const json = (obj, status, extra) =>
  new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json", ...(extra || {}) } });
const errRes = (message, status, extra) => json({ error: { message } }, status, extra);

/* ── 上流呼び出し:identify ── */
async function upstreamIdentify(env, { provider, model, image, prompt, grounding }) {
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.OPENAI_API_KEY },
      body: JSON.stringify({
        model, temperature: 0.2, response_format: { type: "json_object" },
        messages: [{ role: "user", content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${image.mime};base64,${image.b64}` } },
        ] }],
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "OpenAI error");
    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    return { text };
  }
  // gemini(client の callAI と同一 payload)
  const gbody = { contents: [{ parts: [{ inline_data: { mime_type: image.mime, data: image.b64 } }, { text: prompt }] }] };
  if (grounding) { gbody.tools = [{ google_search: {} }]; gbody.generationConfig = { temperature: 0.2 }; }
  else { gbody.generationConfig = { responseMimeType: "application/json", temperature: 0.2 }; }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(gbody) }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Gemini error");
  const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  return { text: parts.map((p) => p.text || "").join("") };
}

/* ── 上流呼び出し:restyle ── */
async function upstreamRestyle(env, { provider, model, image, prompt }) {
  if (provider === "openai") {
    // /v1/images/edits は multipart。b64 → Blob を再構成(client と同じ意味論)
    const bin = Uint8Array.from(atob(image.b64), (c) => c.charCodeAt(0));
    const ext = ((image.mime.split("/")[1] || "png").replace("jpeg", "jpg"));
    const form = new FormData();
    form.append("model", model);
    form.append("image", new Blob([bin], { type: image.mime }), `kit.${ext}`);
    form.append("prompt", prompt);
    form.append("size", "auto");
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST", headers: { Authorization: "Bearer " + env.OPENAI_API_KEY }, body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data.error && data.error.message) || "HTTP " + res.status);
    const out = data.data && data.data[0] && data.data[0].b64_json;
    if (!out) return { image: null };  // モデレーション等:client 側が文言化
    return { image: { b64: out, mime: "image/png" } };
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
    {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: image.mime, data: image.b64 } }, { text: prompt }] }] }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || "HTTP " + res.status);
  const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
  const imgPart = parts.find((pt) => pt.inline_data || pt.inlineData);
  if (!imgPart) return { image: null };      // セーフティブロック等:client 側が文言化
  const pd = imgPart.inline_data || imgPart.inlineData;
  return { image: { b64: pd.data, mime: pd.mime_type || pd.mimeType || "image/png" } };
}

/* ── 本文の共通検証(認証後)。問題なければ parsed body を返す ── */
export function validateAiBody(body, kind, env) {
  if (!body || typeof body !== "object") return { err: "invalid body" };
  const provider = body.provider === "openai" ? "openai" : body.provider === "gemini" ? "gemini" : null;
  if (!provider) return { err: "provider must be 'gemini' or 'openai'" };
  const model = typeof body.model === "string" ? body.model : "";
  const allow = kind === "identify"
    ? csvList(env.ALLOWED_IDENTIFY_MODELS, DEFAULT_IDENTIFY_MODELS)
    : csvList(env.ALLOWED_RESTYLE_MODELS, DEFAULT_RESTYLE_MODELS);
  if (!allow.includes(model)) return { err: `model not allowed: ${model}` };
  if (provider === "openai" ? !isOpenAIModel(model) : isOpenAIModel(model)) return { err: "provider/model mismatch" };
  const img = body.image;
  if (!img || typeof img.b64 !== "string" || !img.b64 || typeof img.mime !== "string" || img.mime.indexOf("image/") !== 0)
    return { err: "image {b64,mime} required" };
  if (typeof body.prompt !== "string" || !body.prompt.trim()) return { err: "prompt required" };
  const key = provider === "openai" ? env.OPENAI_API_KEY : env.GEMINI_API_KEY;
  if (!key) return { err: `server has no ${provider} key configured` };
  return { ok: { provider, model, image: { b64: img.b64, mime: img.mime }, prompt: body.prompt, grounding: !!body.grounding } };
}

export default {
  async fetch(req, env) {
    const cors = corsHeaders(req, env);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "");

    if (req.method === "GET" && path === "/v1/health") return json({ ok: true, version: VERSION }, 200, cors);

    if (req.method === "GET" && path === "/v1/reports") {
      const h = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/, "");
      if (!env.ADMIN_TOKEN || h !== env.ADMIN_TOKEN) return errRes("unauthorized", 401, cors);
      if (!env.REPORTS) return json({ reports: [] }, 200, cors);
      const list = await env.REPORTS.list({ prefix: "report:" });
      const reports = [];
      for (const k of list.keys.slice(0, 100)) {
        const v = await env.REPORTS.get(k.name);
        try { reports.push({ key: k.name, ...JSON.parse(v) }); } catch (e) { /* skip broken */ }
      }
      return json({ reports }, 200, cors);
    }

    if (req.method !== "POST") return errRes("not found", 404, cors);

    // サイズ上限(Content-Length が無い場合は読み込み後に判定)
    const clen = parseInt(req.headers.get("Content-Length"), 10);
    if (clen && clen > MAX_BODY) return errRes("payload too large", 413, cors);

    if (path === "/v1/report") {
      // 修正提案は認証を必須にしない(旧 REPORT_SECRET と同じ「簡易 bot 避け」思想)。
      // REPORT_SECRET が設定されていれば X-Report-Secret を検査する。
      if (env.REPORT_SECRET && req.headers.get("X-Report-Secret") !== env.REPORT_SECRET)
        return errRes("unauthorized", 401, cors);
      let body; try { body = await req.json(); } catch (e) { return errRes("invalid json", 400, cors); }
      if (!env.REPORTS) return errRes("reports storage not configured", 503, cors);
      const key = "report:" + new Date().toISOString() + ":" + Math.random().toString(36).slice(2, 8);
      await env.REPORTS.put(key, JSON.stringify({ at: new Date().toISOString(), payload: body }), { expirationTtl: 60 * 60 * 24 * 180 });
      return json({ ok: true }, 200, cors);
    }

    if (path === "/v1/identify" || path === "/v1/restyle") {
      const userId = verifyToken(req, env);
      if (!userId) return errRes("unauthorized", 401, cors);
      let raw; try { raw = await req.text(); } catch (e) { return errRes("read failed", 400, cors); }
      if (raw.length > MAX_BODY) return errRes("payload too large", 413, cors);
      let body; try { body = JSON.parse(raw); } catch (e) { return errRes("invalid json", 400, cors); }
      const kind = path === "/v1/identify" ? "identify" : "restyle";
      const v = validateAiBody(body, kind, env);
      if (v.err) return errRes(v.err, 400, cors);
      const q = await checkAndCountQuota(env, userId);
      if (!q.ok) return errRes(`daily quota exceeded (${q.used}/${q.quota})`, 429, cors);
      try {
        const out = kind === "identify" ? await upstreamIdentify(env, v.ok) : await upstreamRestyle(env, v.ok);
        return json(out, 200, cors);
      } catch (e) {
        return errRes(String((e && e.message) || e), 502, cors);
      }
    }

    return errRes("not found", 404, cors);
  },
};
