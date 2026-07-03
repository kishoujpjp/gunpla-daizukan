/* ───────────────────────────────────────────────────────────
   image-sync.js — 雲端画像同期の純部品(P2 第3批 3-3)

   三つの部品から成る。いずれも React 非依存・fetch 注入可(テスト容易)。

   1) Storage REST: Supabase Storage への upload / download / delete。
      cfg = { url, anonKey, accessToken, userId }(session から直構成=時序免疫)。
      パスは {userId}/{画像id}。404 は「無い」として静かに扱う。

   2) 索引 mg_imgidx: { [id]: {w,h,bytes,del?,_ts,t} }。merge.js の
      フィールド級 LWW をそのまま復用。削除は墓碑(del:1)、再追加は
      del:0 の新時戳で自然に復活する。KV 行として従来の同期に乗る。

   3) 再送キュー mg_imgq(端末ローカル・同期に乗せない): [{op,id,at}]。
      同一 id は最新意図が勝つ(up→del は del のみ、del→up は up のみ)。

   ★安全原則(iOS 事故の教訓)★
   「本地の読取失敗 ≠ 画像が存在しない」。墓碑を打ってよいのは
   ユーザの明示削除だけ。idxDiff の呼び手は localIds の取得に失敗したら
   照合そのものを中止すること(このモジュールは判定しない=させない)。
   ─────────────────────────────────────────────────────────── */
import { mergeRecMap, stampRec } from "./merge.js";

export const IMGIDX_KEY = "mg_imgidx";
export const IMGQ_KEY = "mg_imgq";
const BUCKET = "images";

export function storagePath(userId, id) { return userId + "/" + encodeURIComponent(id); }

const authHeaders = (cfg) => ({ apikey: cfg.anonKey, Authorization: "Bearer " + cfg.accessToken });

/* upload(x-upsert: 再圧縮後の上書きも同一路徑)。成功 true、失敗は {status} 付きで throw */
export async function uploadImage(cfg, id, blob, fetchFn = globalThis.fetch) {
  const r = await fetchFn(cfg.url + "/storage/v1/object/" + BUCKET + "/" + storagePath(cfg.userId, id), {
    method: "POST",
    headers: { ...authHeaders(cfg), "Content-Type": blob.type || "application/octet-stream", "x-upsert": "true" },
    body: blob,
  });
  if (r.ok) return true;
  const e = new Error("upload " + r.status);
  e.status = r.status;
  throw e;
}

/* download。200 → Blob / 404 → null(無い)/ その他 → throw */
export async function downloadImage(cfg, id, fetchFn = globalThis.fetch) {
  const r = await fetchFn(cfg.url + "/storage/v1/object/authenticated/" + BUCKET + "/" + storagePath(cfg.userId, id), {
    headers: authHeaders(cfg),
  });
  if (r.status === 404 || r.status === 400) return null; // Supabase は無いキーで 400 を返す事がある
  if (!r.ok) { const e = new Error("download " + r.status); e.status = r.status; throw e; }
  return r.blob();
}

/* delete。404 は「既に無い」= 成功扱い(冪等) */
export async function deleteRemoteImage(cfg, id, fetchFn = globalThis.fetch) {
  const r = await fetchFn(cfg.url + "/storage/v1/object/" + BUCKET + "/" + storagePath(cfg.userId, id), {
    method: "DELETE",
    headers: authHeaders(cfg),
  });
  if (r.ok || r.status === 404 || r.status === 400) return true;
  const e = new Error("delete " + r.status);
  e.status = r.status;
  throw e;
}

/* ── 索引(mg_imgidx) ── */
export function parseIdx(json) {
  try {
    const d = JSON.parse(json);
    return d && typeof d === "object" && !Array.isArray(d) ? d : {};
  } catch (e) { return {}; }
}
export const mergeIdx = (a, b) => mergeRecMap(a || {}, b || {});
export const isDeadIdx = (rec) => !!(rec && rec.del);
/* upload 成功時:寸法等を刻み del:0 で(墓碑からの)復活も兼ねる */
export function stampIdxUp(idx, id, meta, now) {
  const next = { ...(idx || {}) };
  next[id] = stampRec(next[id], { w: (meta && meta.w) || 0, h: (meta && meta.h) || 0, bytes: (meta && meta.bytes) || 0, del: 0 }, now);
  return next;
}
/* ユーザの明示削除時のみ呼ぶこと(★安全原則★) */
export function tombstoneIdx(idx, id, now) {
  const next = { ...(idx || {}) };
  next[id] = stampRec(next[id], { del: 1 }, now);
  return next;
}
/* 照合:索引 vs 本地実在。localIds は Set。呼び手は取得失敗時に照合を中止する事。 */
export function idxDiff(idx, localIds) {
  const download = [], removeLocal = [], upload = [];
  for (const [id, rec] of Object.entries(idx || {})) {
    if (isDeadIdx(rec)) { if (localIds.has(id)) removeLocal.push(id); }
    else if (!localIds.has(id)) download.push(id);
  }
  for (const id of localIds) if (!(idx && idx[id])) upload.push(id);
  return { download, removeLocal, upload };
}

/* ── 再送キュー(mg_imgq)── 同一 id は最新意図のみ残す */
export function parseQ(json) {
  try { const d = JSON.parse(json); return Array.isArray(d) ? d : []; } catch (e) { return []; }
}
export function qAdd(q, op, id, now) {
  return (q || []).filter((e) => e.id !== id).concat([{ op, id, at: now }]);
}
export function qRemove(q, op, id) {
  return (q || []).filter((e) => !(e.op === op && e.id === id));
}

/* JWT(access_token)payload の sub = Supabase user id。session 形状に依存しない取得法。 */
export function userIdFromJWT(token) {
  try {
    const b64 = String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(b64));
    return (p && p.sub) || "";
  } catch (e) { return ""; }
}
