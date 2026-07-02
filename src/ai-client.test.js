import test from "node:test";
import assert from "node:assert/strict";
import {
  proxyOn, buildGeminiIdentifyBody, parseGeminiText, parseOpenAIChatText,
  parseGeminiImage, buildProxyBody,
} from "./ai-client.js";
import worker, {
  csvList, isOpenAIModel, verifyToken, validateAiBody, checkAndCountQuota, corsHeaders,
} from "./worker/ai-proxy.js";

/* ═══════════ ai-client 純関数 ═══════════ */

test("proxyOn:proxyUrl の有無で判定(空白のみは off)", () => {
  assert.equal(proxyOn({ proxyUrl: "https://x.workers.dev" }), true);
  assert.equal(proxyOn({ proxyUrl: "  " }), false);
  assert.equal(proxyOn({}), false);
  assert.equal(proxyOn(null), false);
});

test("buildGeminiIdentifyBody:grounding で tools/JSON モードが切り替わる(modal と同一)", () => {
  const base = { b64: "AAAA", mime: "image/jpeg", prompt: "p" };
  const a = buildGeminiIdentifyBody({ ...base, grounding: false });
  assert.equal(a.generationConfig.responseMimeType, "application/json");
  assert.equal(a.tools, undefined);
  assert.equal(a.contents[0].parts[0].inline_data.mime_type, "image/jpeg");
  const b = buildGeminiIdentifyBody({ ...base, grounding: true });
  assert.deepEqual(b.tools, [{ google_search: {} }]);
  assert.equal(b.generationConfig.responseMimeType, undefined, "grounding 時は JSON 強制なし");
});

test("parseGeminiText / parseOpenAIChatText:欠損に安全", () => {
  assert.equal(parseGeminiText({ candidates: [{ content: { parts: [{ text: "a" }, { text: "b" }] } }] }), "ab");
  assert.equal(parseGeminiText({}), "");
  assert.equal(parseOpenAIChatText({ choices: [{ message: { content: "x" } }] }), "x");
  assert.equal(parseOpenAIChatText({}), "");
});

test("parseGeminiImage:inline_data / inlineData 両対応、無ければ null", () => {
  const d1 = { candidates: [{ content: { parts: [{ inline_data: { mime_type: "image/png", data: "QQ==" } }] } }] };
  assert.equal(parseGeminiImage(d1), "data:image/png;base64,QQ==");
  const d2 = { candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/webp", data: "Zg==" } }] } }] };
  assert.equal(parseGeminiImage(d2), "data:image/webp;base64,Zg==");
  assert.equal(parseGeminiImage({ candidates: [{ content: { parts: [{ text: "no img" }] } }] }), null);
});

test("buildProxyBody:Worker プロトコル形", () => {
  const b = buildProxyBody({ provider: "gemini", model: "m", b64: "QQ==", mime: "image/jpeg", prompt: "p", grounding: true });
  assert.deepEqual(b, { provider: "gemini", model: "m", image: { b64: "QQ==", mime: "image/jpeg" }, prompt: "p", grounding: true });
  const c = buildProxyBody({ provider: "openai", model: "m", b64: "QQ==", mime: "image/png", prompt: "p" });
  assert.equal("grounding" in c, false, "restyle は grounding を送らない");
});

/* ═══════════ Worker ガード(ネットワーク不要の経路のみ) ═══════════ */

const mkReq = (path, { method = "POST", token, body, origin, headers = {} } = {}) =>
  new Request("https://proxy.test" + path, {
    method,
    headers: {
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(origin ? { Origin: origin } : {}),
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const IMG = { b64: "QUFB", mime: "image/jpeg" };
const ENV = { PROXY_TOKENS: "tok1,tok2", GEMINI_API_KEY: "g", OPENAI_API_KEY: "o" };

test("csvList / isOpenAIModel", () => {
  assert.deepEqual(csvList(" a , b ,", ["z"]), ["a", "b"]);
  assert.deepEqual(csvList("", ["z"]), ["z"]);
  assert.equal(isOpenAIModel("gpt-image-2"), true);
  assert.equal(isOpenAIModel("gpt-4o"), true);
  assert.equal(isOpenAIModel("gemini-2.5-pro"), false);
});

test("verifyToken:PROXY_TOKENS 一致のみ通す。未設定は全拒否(閉じて安全)", () => {
  assert.equal(verifyToken(mkReq("/v1/identify", { token: "tok1" }), ENV), "tok1");
  assert.equal(verifyToken(mkReq("/v1/identify", { token: "bad" }), ENV), null);
  assert.equal(verifyToken(mkReq("/v1/identify", {}), ENV), null);
  assert.equal(verifyToken(mkReq("/v1/identify", { token: "tok1" }), {}), null, "PROXY_TOKENS 未設定");
});

test("validateAiBody:白名単・provider/model 整合・画像/プロンプト必須", () => {
  const ok = validateAiBody({ provider: "gemini", model: "gemini-2.5-flash", image: IMG, prompt: "p" }, "identify", ENV);
  assert.ok(ok.ok);
  assert.equal(validateAiBody({ provider: "gemini", model: "evil-model", image: IMG, prompt: "p" }, "identify", ENV).err.includes("not allowed"), true);
  assert.ok(validateAiBody({ provider: "openai", model: "gemini-2.5-flash", image: IMG, prompt: "p" }, "identify", ENV).err, "provider/model 不整合");
  assert.ok(validateAiBody({ provider: "gemini", model: "gemini-2.5-flash", image: { b64: "", mime: "image/png" }, prompt: "p" }, "identify", ENV).err);
  assert.ok(validateAiBody({ provider: "gemini", model: "gemini-2.5-flash", image: IMG, prompt: "  " }, "identify", ENV).err);
  assert.ok(validateAiBody({ provider: "gemini", model: "gemini-3-pro-image", image: IMG, prompt: "p" }, "restyle", ENV).ok, "restyle 白名単");
  assert.ok(validateAiBody({ provider: "gemini", model: "gemini-2.5-flash", image: IMG, prompt: "p" }, "restyle", ENV).err, "identify 用モデルは restyle 不可");
  assert.ok(validateAiBody({ provider: "openai", model: "gpt-4o", image: IMG, prompt: "p" }, "identify", { ...ENV, OPENAI_API_KEY: "" }).err.includes("no openai key"), "鍵未設定はサーバ側で明示エラー");
  assert.ok(validateAiBody({ provider: "gemini", model: "x,gemini-x", image: IMG, prompt: "p" }, "identify", { ...ENV, ALLOWED_IDENTIFY_MODELS: "gemini-x,x" }).err, "CSV 上書き時も未収載は拒否");
  assert.ok(validateAiBody({ provider: "gemini", model: "gemini-x", image: IMG, prompt: "p" }, "identify", { ...ENV, ALLOWED_IDENTIFY_MODELS: "gemini-x" }).ok, "CSV 上書きで許可");
});

test("checkAndCountQuota:KV 無し=無制限、KV 有り=日次上限で 429 相当", async () => {
  const noKv = await checkAndCountQuota({}, "tok1");
  assert.equal(noKv.ok, true);
  // モック KV
  const store = new Map();
  const USAGE = { get: async (k) => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } };
  const env = { USAGE, DAILY_QUOTA: "2" };
  assert.equal((await checkAndCountQuota(env, "tok1")).ok, true);
  assert.equal((await checkAndCountQuota(env, "tok1")).ok, true);
  const third = await checkAndCountQuota(env, "tok1");
  assert.equal(third.ok, false);
  assert.equal(third.used, 2);
  assert.equal((await checkAndCountQuota(env, "tok2")).ok, true, "別 token は独立計量");
  for (const k of store.keys()) assert.ok(!k.includes("tok1"), "生 token を KV キーへ残さない(hash 化)");
});

test("corsHeaders:* 既定、限定時は一致 Origin のみ反映", () => {
  assert.equal(corsHeaders(mkReq("/", { origin: "https://a.example" }), {})["Access-Control-Allow-Origin"], "*");
  const env = { ALLOWED_ORIGINS: "https://a.example,https://b.example" };
  assert.equal(corsHeaders(mkReq("/", { origin: "https://b.example" }), env)["Access-Control-Allow-Origin"], "https://b.example");
  assert.equal(corsHeaders(mkReq("/", { origin: "https://evil.example" }), env)["Access-Control-Allow-Origin"], "https://a.example", "不一致は第一許可元(=拒否と同義)");
});

test("fetch ハンドラ:health / 認証 / 白名単 / 404 / 413 / quota(上流呼び出しなし経路)", async () => {
  const env = { ...ENV };
  const health = await worker.fetch(mkReq("/v1/health", { method: "GET" }), env);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);

  const noAuth = await worker.fetch(mkReq("/v1/identify", { body: {} }), env);
  assert.equal(noAuth.status, 401);

  const badModel = await worker.fetch(mkReq("/v1/identify", { token: "tok1", body: { provider: "gemini", model: "evil", image: IMG, prompt: "p" } }), env);
  assert.equal(badModel.status, 400);

  const nf = await worker.fetch(mkReq("/v1/nope", { token: "tok1", body: {} }), env);
  assert.equal(nf.status, 404);

  const big = await worker.fetch(mkReq("/v1/identify", { token: "tok1", body: {}, headers: { "Content-Length": String(20 * 1024 * 1024) } }), env);
  assert.equal(big.status, 413);

  const opt = await worker.fetch(mkReq("/v1/identify", { method: "OPTIONS" }), env);
  assert.equal(opt.status, 204);

  // quota 尽きた状態で 429(上限0のモック KV)
  const USAGE = { get: async () => "0", put: async () => {} };
  const q = await worker.fetch(mkReq("/v1/identify", { token: "tok1", body: { provider: "gemini", model: "gemini-2.5-flash", image: IMG, prompt: "p" } }), { ...env, USAGE, DAILY_QUOTA: "0" });
  assert.equal(q.status, 429);

  // /v1/report:REPORTS 未設定は 503、モック KV で 200
  const r503 = await worker.fetch(mkReq("/v1/report", { body: { a: 1 } }), env);
  assert.equal(r503.status, 503);
  const stored = new Map();
  const REPORTS = { put: async (k, v) => { stored.set(k, v); }, list: async () => ({ keys: [...stored.keys()].map((name) => ({ name })) }), get: async (k) => stored.get(k) };
  const r200 = await worker.fetch(mkReq("/v1/report", { body: { name: "νガンダム", fix: { price: 5500 } } }), { ...env, REPORTS });
  assert.equal(r200.status, 200);
  assert.equal(stored.size, 1);
  // /v1/reports は ADMIN_TOKEN 必須
  const la = await worker.fetch(mkReq("/v1/reports", { method: "GET" }), { ...env, REPORTS, ADMIN_TOKEN: "adm" });
  assert.equal(la.status, 401);
  const lb = await worker.fetch(mkReq("/v1/reports", { method: "GET", token: "adm" }), { ...env, REPORTS, ADMIN_TOKEN: "adm" });
  assert.equal(lb.status, 200);
  assert.equal((await lb.json()).reports.length, 1);
});
