/* ───────────────────────────────────────────────────────────
   ai-client.js — AI 呼び出しの統一層(双トランスポート)
   ─────────────────────────────────────────────────────────────
   cfg = { proxyUrl, proxyToken, geminiKey, openaiKey }
   ・proxyUrl あり → 代理 Worker(/v1/identify・/v1/restyle)経由。
     端末に Gemini/OpenAI キー不要。計量・キー保持はサーバ側。
   ・proxyUrl なし → 従来の BYO キー直叩き(挙動不変。modal から verbatim 移設)。

   返り値の意味論は modal 時代と同一:
     aiIdentify → text(モデル出力の生テキスト)。エラーは throw。
     aiRestyle  → dataURL 文字列 | null(null=画像が返らない:モデレーション/
                  セーフティ。文言化は呼び出し側=i18n は modal に残す)。
   ─────────────────────────────────────────────────────────── */

export const proxyOn = (cfg) => !!(cfg && String(cfg.proxyUrl || "").trim());
const proxyRoot = (cfg) => String(cfg.proxyUrl || "").trim().replace(/\/+$/, "");

/* ── 純関数(テスト対象):本文組み立て・応答解析 ─────────────── */

export function buildGeminiIdentifyBody({ b64, mime, prompt, grounding }) {
  const gbody = { contents: [{ parts: [{ inline_data: { mime_type: mime, data: b64 } }, { text: prompt }] }] };
  if (grounding) { gbody.tools = [{ google_search: {} }]; gbody.generationConfig = { temperature: 0.2 }; }
  else { gbody.generationConfig = { responseMimeType: "application/json", temperature: 0.2 }; }
  return gbody;
}
export function parseGeminiText(data) {
  const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  return parts.map((p) => p.text || "").join("");
}
export function parseOpenAIChatText(data) {
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
}
export function parseGeminiImage(data) {
  const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
  const imgPart = parts.find((pt) => pt.inline_data || pt.inlineData);
  if (!imgPart) return null;
  const pd = imgPart.inline_data || imgPart.inlineData;
  return `data:${pd.mime_type || pd.mimeType || "image/png"};base64,${pd.data}`;
}
export function buildProxyBody({ provider, model, b64, mime, prompt, grounding }) {
  const o = { provider, model, image: { b64, mime }, prompt };
  if (grounding !== undefined) o.grounding = !!grounding;
  return o;
}

/* ── 代理経由の共通 POST ── */
async function proxyPost(cfg, path, body, signal) {
  const res = await fetch(proxyRoot(cfg) + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + (cfg.proxyToken || "") },
    body: JSON.stringify(body),
    signal,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* 非JSON応答 */ }
  if (!res.ok) throw new Error((data && data.error && data.error.message) || "HTTP " + res.status);
  if (data && data.error) throw new Error(data.error.message || "proxy error");
  return data || {};
}

/* ── 機体判別:text を返す ──
   args = { provider:"gemini"|"openai", model, b64, mime, dataUrl, prompt, grounding, cfg, signal } */
export async function aiIdentify(args) {
  const { provider, model, b64, mime, dataUrl, prompt, grounding, cfg, signal } = args;
  if (proxyOn(cfg)) {
    const out = await proxyPost(cfg, "/v1/identify", buildProxyBody({ provider, model, b64, mime, prompt, grounding }), signal);
    return typeof out.text === "string" ? out.text : "";
  }
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + cfg.openaiKey },
      body: JSON.stringify({ model, temperature: 0.2, response_format: { type: "json_object" },
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: dataUrl } }] }] }),
      signal,
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "OpenAI error");
    return parseOpenAIChatText(data);
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cfg.geminiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildGeminiIdentifyBody({ b64, mime, prompt, grounding })),
    signal,
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Gemini error");
  return parseGeminiText(data);
}

/* ── スタイル変換:dataURL | null を返す ──
   args = { model, src(dataURL), prompt, cfg, signal } */
export async function aiRestyle(args) {
  const { model, src, prompt, cfg, signal } = args;
  const isOA = /^gpt-image/.test(model || "");
  const b64 = src.split(",")[1];
  const mime = (src.match(/^data:([^;]+);/) || [])[1] || "image/jpeg";
  if (proxyOn(cfg)) {
    const out = await proxyPost(cfg, "/v1/restyle",
      buildProxyBody({ provider: isOA ? "openai" : "gemini", model, b64, mime, prompt }), signal);
    if (!out.image || !out.image.b64) return null;
    return `data:${out.image.mime || "image/png"};base64,${out.image.b64}`;
  }
  if (isOA) {
    /* OpenAI 画像編集: /v1/images/edits(multipart, b64_json を返す) */
    const blob = await (await fetch(src)).blob();
    const ext = ((blob.type.split("/")[1] || "png").replace("jpeg", "jpg"));
    const form = new FormData();
    form.append("model", model);
    form.append("image", blob, `kit.${ext}`);
    form.append("prompt", prompt);
    form.append("size", "auto");
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST", headers: { Authorization: `Bearer ${cfg.openaiKey}` }, body: form, signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error((data.error && data.error.message) || "HTTP " + res.status);
    const out = data.data && data.data[0] && data.data[0].b64_json;
    if (!out) return null;
    return `data:image/png;base64,${out}`;
  }
  /* Google Gemini: generateContent(inline_data で画像返却) */
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cfg.geminiKey)}`,
    {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: mime, data: b64 } }, { text: prompt }] }] }),
      signal,
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || "HTTP " + res.status);
  return parseGeminiImage(data);
}
