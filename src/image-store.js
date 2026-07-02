/* ───────────────────────────────────────────────────────────
   image-store.js — 画像バイナリ本地層(P2 第3批 3-1)

   ・orig(原図 Blob)+ thumb(縮図 Blob キャッシュ)の二層。
   ・KV(window.storage / mg-zukan)とは別 DB「mg-zukan-img」。
     既存 storage.js には一切触れない(version 衝突回避)。
   ・thumb は純キャッシュ:全損しても orig から再派生できる。

   ★ Phase 3 (Capacitor) 差し替え点 ★
   永続化は backend 介面(get/put/delete/keys)に収斂している。
   原生化時は idbBackend() を Capacitor Filesystem 実装に置換する
   だけでよい(公開 API・App 側は無改変)。entitlements.js と同じ
   seam 方式。テストは memBackend()(in-memory)を注入して行う。
   ─────────────────────────────────────────────────────────── */

const DB_NAME = "mg-zukan-img";
const ORIG = "orig";   // id → { blob, w, h, bytes, at }
const THUMB = "thumb"; // id → Blob

export const THUMB_EDGE = 480;    // 縮図 長辺(現行「再圧縮」と同値)
export const THUMB_QUALITY = 0.74;
export const ORIG_MAX_EDGE = 1600; // 取込時の原図上限(決定点③。既存データは原様)
export const ORIG_QUALITY = 0.82;

/* ── backend: IndexedDB 実装(既定) ── */
export function idbBackend() {
  let dbp = null;
  const open = () => {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(ORIG); req.result.createObjectStore(THUMB); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  };
  const tx = async (store, mode, fn) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };
  return {
    get: (store, id) => tx(store, "readonly", (s) => s.get(id)),
    put: (store, id, val) => tx(store, "readwrite", (s) => s.put(val, id)),
    delete: (store, id) => tx(store, "readwrite", (s) => s.delete(id)),
    keys: (store) => tx(store, "readonly", (s) => s.getAllKeys()).then((ks) => ks.map(String)),
  };
}

/* ── backend: in-memory 実装(テスト/緊急フォールバック用) ── */
export function memBackend() {
  const m = { [ORIG]: new Map(), [THUMB]: new Map() };
  return {
    get: async (store, id) => m[store].get(id),
    put: async (store, id, val) => { m[store].set(id, val); },
    delete: async (store, id) => { m[store].delete(id); },
    keys: async (store) => Array.from(m[store].keys()),
  };
}

/* ── 画像演算(browser 既定・テストでは注入で差し替え) ──
   decode 失敗(未対応形式など)は null を返し、呼び手がフォールバックする。 */
export function canvasImageOps() {
  const draw = async (blob, maxEdge, quality) => {
    let bmp;
    try { bmp = await createImageBitmap(blob); } catch (e) { return null; }
    try {
      const scale = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      if (scale >= 1) return { blob: null, w: bmp.width, h: bmp.height }; // 縮小不要
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(bmp, 0, 0, w, h);
      const out = await new Promise((res) => c.toBlob(res, "image/jpeg", quality));
      return out ? { blob: out, w, h } : null;
    } finally { bmp.close && bmp.close(); }
  };
  return {
    // 寸法計測のみ(縮小せず)。失敗時 null。
    measure: async (blob) => {
      try { const b = await createImageBitmap(blob); const d = { w: b.width, h: b.height }; b.close && b.close(); return d; }
      catch (e) { return null; }
    },
    // maxEdge 以下へ縮小。縮小不要なら {blob:null,w,h}(原 blob を使え)。失敗時 null。
    downscale: draw,
  };
}

/* ── URL 管理(browser 既定・テストでは注入) ── */
function realUrls() {
  return { create: (blob) => URL.createObjectURL(blob), revoke: (u) => URL.revokeObjectURL(u) };
}

/* ─────────────────────────────────────────────────────────
   本体ファクトリ
   ───────────────────────────────────────────────────────── */
export function createImageStore(backend, deps = {}) {
  const ops = deps.imageOps || canvasImageOps();
  const urls = deps.urls || realUrls();

  const thumbURL = new Map(); // id → objectURL(thumb 由来。thumb 不能時は orig 由来)
  const origURL = new Map();  // id → objectURL(orig 由来。viewer 等が要求した分のみ)

  const revokeOf = (map, id) => { const u = map.get(id); if (u) { urls.revoke(u); map.delete(id); } };

  async function getOrigRec(id) { return (await backend.get(ORIG, id)) || null; }

  /* 縮図 Blob を確保(無ければ orig から派生し永続)。派生不能なら null。 */
  async function ensureThumbBlob(id) {
    const hit = await backend.get(THUMB, id);
    if (hit) return hit;
    const rec = await getOrigRec(id);
    if (!rec) return null;
    const d = await ops.downscale(rec.blob, THUMB_EDGE, THUMB_QUALITY);
    if (d === null) return null;                 // decode 失敗
    const tb = d.blob || rec.blob;               // 縮小不要=原 blob をそのまま縮図扱い
    await backend.put(THUMB, id, tb);
    return tb;
  }

  return {
    /* 原図保存。dims 省略時は計測を試みる(不能でも保存は成立)。
       既存 id への上書きは旧 thumb/URL を無効化して作り直す。 */
    async putOrig(id, blob, dims) {
      let w = dims && dims.w, h = dims && dims.h;
      if (!(w > 0 && h > 0)) { const m = await ops.measure(blob); if (m) { w = m.w; h = m.h; } }
      await backend.put(ORIG, id, { blob, w: w || 0, h: h || 0, bytes: blob.size, at: Date.now() });
      await backend.delete(THUMB, id);
      revokeOf(thumbURL, id); revokeOf(origURL, id);
      return { w: w || 0, h: h || 0, bytes: blob.size };
    },

    /* 取込用:data URL / base64 → putOrig(v3 遷移・バックアップ復元・互換 shim が使用) */
    async putDataURL(id, dataURL) {
      const blob = await (await fetch(dataURL)).blob();
      return this.putOrig(id, blob);
    },

    /* 取込時の原図上限適用(決定点③)。縮小不要/decode不能なら原 blob を返す。 */
    async normalizeImport(blob) {
      const d = await ops.downscale(blob, ORIG_MAX_EDGE, ORIG_QUALITY);
      if (d === null) return { blob, w: 0, h: 0 };
      return { blob: d.blob || blob, w: d.w, h: d.h };
    },

    async getOrigBlob(id) { const r = await getOrigRec(id); return r ? r.blob : null; },
    async getOrigMeta(id) { const r = await getOrigRec(id); return r ? { w: r.w, h: r.h, bytes: r.bytes, at: r.at } : null; },
    async getOrigURL(id) {
      if (origURL.has(id)) return origURL.get(id);
      const r = await getOrigRec(id);
      if (!r) return null;
      const u = urls.create(r.blob);
      origURL.set(id, u);
      return u;
    },

    /* 縮図 URL。thumb 派生不能(未対応形式)時は orig URL へフォールバック。 */
    async getThumbURL(id) {
      if (thumbURL.has(id)) return thumbURL.get(id);
      const tb = await ensureThumbBlob(id);
      if (tb) { const u = urls.create(tb); thumbURL.set(id, u); return u; }
      const rec = await getOrigRec(id);
      if (!rec) return null;
      const u = urls.create(rec.blob);
      thumbURL.set(id, u);
      return u;
    },

    /* 起動用:既存 thumb から {id:url} を即時構成。thumb 未派生の id は
       背景で逐次派生し onLate(id,url) で通知(state 追い差し用)。 */
    async allThumbURLs(onLate) {
      const out = {};
      const tKeys = new Set(await backend.keys(THUMB));
      const oKeys = await backend.keys(ORIG);
      for (const id of oKeys) {
        if (tKeys.has(id)) {
          if (!thumbURL.has(id)) {
            const tb = await backend.get(THUMB, id);
            thumbURL.set(id, urls.create(tb));
          }
          out[id] = thumbURL.get(id);
        }
      }
      const pending = oKeys.filter((id) => !tKeys.has(id));
      if (pending.length) {
        (async () => {
          for (const id of pending) {
            try { const u = await this.getThumbURL(id); if (u && onLate) onLate(id, u); }
            catch (e) { /* 個別失敗は握り潰さず次へ(表示は「画像なし」のまま) */ }
          }
        })();
      }
      return out;
    },

    async deleteImage(id) {
      await backend.delete(ORIG, id);
      await backend.delete(THUMB, id);
      revokeOf(thumbURL, id); revokeOf(origURL, id);
    },

    async listIds() { return backend.keys(ORIG); },
    async has(id) { return (await getOrigRec(id)) !== null; },

    async usage() {
      let bytes = 0, count = 0;
      for (const id of await backend.keys(ORIG)) {
        const r = await getOrigRec(id);
        if (r) { bytes += r.bytes || 0; count++; }
      }
      let tBytes = 0;
      for (const id of await backend.keys(THUMB)) {
        const b = await backend.get(THUMB, id);
        if (b) tBytes += b.size || 0;
      }
      return { count, origBytes: bytes, thumbBytes: tBytes };
    },

    /* 縮図キャッシュ全再構築(「再圧縮」ボタンの新意味の一部)。 */
    async rebuildThumbs() {
      let n = 0;
      for (const id of await backend.keys(THUMB)) { await backend.delete(THUMB, id); revokeOf(thumbURL, id); }
      for (const id of await backend.keys(ORIG)) { if (await ensureThumbBlob(id)) n++; }
      return n;
    },

    revokeAll() {
      for (const [, u] of thumbURL) urls.revoke(u);
      for (const [, u] of origURL) urls.revoke(u);
      thumbURL.clear(); origURL.clear();
    },
  };
}

/* 既定シングルトン(App 用)。テストは createImageStore(memBackend(), …) を使う。 */
export const imageStore = typeof indexedDB !== "undefined"
  ? createImageStore(idbBackend())
  : null; // node 等 IDB 無し環境では未初期化(App 以外から誤用させない)
