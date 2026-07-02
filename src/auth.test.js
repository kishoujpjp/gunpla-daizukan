import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSession, sessionValid } from "./auth.js";
import { managedOn, MANAGED_BACKEND } from "./backend-config.js";

/* ═══════════ normalizeSession / sessionValid ═══════════ */

const NOW = Date.parse("2026-07-02T00:00:00Z");

test("normalizeSession:expires_at(秒)優先で ms に正規化", () => {
  const s = normalizeSession({ access_token: "a", refresh_token: "r", expires_at: NOW / 1000 + 3600, user: { id: "u1", email: "e@x" } }, NOW);
  assert.equal(s.expiresAt, NOW + 3600 * 1000);
  assert.deepEqual(s.user, { id: "u1", email: "e@x" });
});

test("normalizeSession:expires_at 無しは expires_in から合成、既定 3600 秒", () => {
  const a = normalizeSession({ access_token: "a", expires_in: 100 }, NOW);
  assert.equal(a.expiresAt, NOW + 100 * 1000);
  const b = normalizeSession({ access_token: "a" }, NOW);
  assert.equal(b.expiresAt, NOW + 3600 * 1000);
  assert.equal(b.refresh_token, "", "refresh 欠損は空文字");
});

test("normalizeSession:access_token 無しは null", () => {
  assert.equal(normalizeSession(null, NOW), null);
  assert.equal(normalizeSession({ refresh_token: "r" }, NOW), null);
});

test("sessionValid:期限 60 秒前から失効扱い(先回り更新の余白)", () => {
  const s = { access_token: "a", expiresAt: NOW + 120 * 1000 };
  assert.equal(sessionValid(s, 60 * 1000, NOW), true);
  assert.equal(sessionValid(s, 60 * 1000, NOW + 61 * 1000), false, "残り59秒 → 無効扱い");
  assert.equal(sessionValid(null, 60 * 1000, NOW), false);
});

/* ═══════════ backend-config ═══════════ */

test("managedOn:url/anonKey が空の間は託管モード不活性(=挙動不変の保証)", () => {
  assert.equal(managedOn(), !!(MANAGED_BACKEND.url && MANAGED_BACKEND.anonKey));
  assert.equal(managedOn(), false, "リポジトリ初期状態では off");
});

/* ═══════════ SYNC_TRANSPORT 双モード(mock fetch で往路を検証) ═══════════
   use-sync.js は React 依存のためフック本体は node では読めないが、
   SYNC_TRANSPORT はモジュール頂層…ではなく同檔内。ここでは fetch を
   モックして「送信される URL / ヘッダ」の形だけを検証する軽量統合テスト。 */
import fs from "node:fs";
test("transport:BYO は Bearer=anon key・on_conflict=key / 託管は Bearer=JWT・on_conflict=user_id,key", async () => {
  // use-sync.js から SYNC_TRANSPORT 定義部だけを抽出して評価(React import を避ける)
  const src = fs.readFileSync(new URL("./use-sync.js", import.meta.url), "utf8");
  const a = src.indexOf("function syncNsKey");
  const b = src.indexOf("\n};", src.indexOf("const SYNC_TRANSPORT")) + 3; // 行頭の }; = オブジェクト終端("return { ok: true };" を誤検出しない)
  assert.ok(a >= 0 && b > a, "SYNC_TRANSPORT 抽出");
  const mod = new Function(src.slice(a, b) + "; return SYNC_TRANSPORT;")();

  const seen = [];
  const orig = globalThis.fetch;
  globalThis.fetch = async (url, opt = {}) => {
    seen.push({ url: String(url), headers: opt.headers || {}, method: opt.method });
    return new Response("[]", { status: 200 });
  };
  try {
    // BYO(従来)
    await mod.pull({ url: "https://byo.supabase.co", key: "ANON" });
    assert.equal(seen[0].headers.Authorization, "Bearer ANON");
    await mod.push({ url: "https://byo.supabase.co", key: "ANON" }, [{ key: "k", value: "v", updated_at: "t" }]);
    assert.ok(seen[1].url.includes("on_conflict=key"));
    assert.equal(seen[1].headers.Authorization, "Bearer ANON");
    // 託管(accessToken あり)
    await mod.pull({ url: "https://managed.supabase.co", key: "ANON", accessToken: "JWT" });
    assert.equal(seen[2].headers.Authorization, "Bearer JWT");
    assert.equal(seen[2].headers.apikey, "ANON", "apikey は anon のまま(PostgREST 要件)");
    await mod.push({ url: "https://managed.supabase.co", key: "ANON", accessToken: "JWT" }, [{ key: "k", value: "v", updated_at: "t" }]);
    assert.ok(seen[3].url.includes("on_conflict=user_id,key"));
    assert.equal(seen[3].headers.Authorization, "Bearer JWT");
  } finally { globalThis.fetch = orig; }
});
