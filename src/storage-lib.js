/* ───────────────────────────────────────────────────────────
   storage-lib.js — 永続化/同期の「純計算」ヘルパー群
   App.jsx から機械的に切り出したもの。React 非依存・副作用なし。
   挙動は App.jsx 同梱時と一切変えていない。
   ─────────────────────────────────────────────────────────── */

export const META_KEY = "mg_zukan_v2";
export const IMG_SHARDS = 8;
// 追加画像(アルバムの2枚目以降)用シャード。サムネ(images)は触らず別系統で保持。
export const XTRA_SHARDS = 32;
export const MAX_IMGS_PER_KIT = 6; // サムネ含む1機体あたりの画像上限
// クラウド同期 1 行あたりの上限(超える画像シャードは送らず本地保存のみ)。
// Supabase/プロキシの行・リクエスト上限に余裕を持たせた保守値。必要なら調整可。
export const MAX_SYNC_BYTES = 4 * 1024 * 1024;

/* ── 機密キーは端末ローカルにのみ保存し、雲端・バックアップには出さない ──
   キーは値を空にするのではなく【削除】する。受信側の applyMeta /
   importData は `{ ...prev, ...incoming.settings }` で合成するため、
   削除しておけば既存の端末ローカルの値が上書きされず温存される。 */
export const SECRET_KEYS = ["geminiKey", "openaiKey", "supaKey", "supaUrl"];
export const stripSecrets = (settings) => {
  const out = { ...(settings || {}) };
  for (const k of SECRET_KEYS) delete out[k];
  return out;
};
// META の JSON 文字列から settings の機密だけを抜いた版を返す(送信用)
export const metaForCloud = (v) => {
  try {
    const d = JSON.parse(v);
    if (d && d.settings) d.settings = stripSecrets(d.settings);
    return JSON.stringify(d);
  } catch (e) { return v; }
};

/* ── バックアップ JSON の構造検証 ──
   壊れた/別物の JSON を読み込んでも state を汚さないための門番。
   問題があればユーザ向けメッセージ(文字列)を返す。OK なら null。 */
export const isPlainObj = (x) => x != null && typeof x === "object" && !Array.isArray(x);
export const SORT_KEYS = ["year", "name", "purchase", "build", "price"];
export function validateBackup(d) {
  if (!isPlainObj(d)) return "ファイルの中身がバックアップ形式ではありません。";
  if (d.records !== undefined && !isPlainObj(d.records)) return "records の形式が不正です。";
  if (d.overrides !== undefined && !isPlainObj(d.overrides)) return "overrides の形式が不正です。";
  if (d.images !== undefined && !isPlainObj(d.images)) return "images の形式が不正です。";
  if (d.settings !== undefined && !isPlainObj(d.settings)) return "settings の形式が不正です。";
  if (d.customKits !== undefined && !Array.isArray(d.customKits)) return "customKits の形式が不正です。";
  // records / overrides の各値は object であるべき
  for (const m of [d.records, d.overrides]) {
    if (isPlainObj(m)) for (const v of Object.values(m)) if (!isPlainObj(v)) return "records/overrides に不正なレコードが含まれています。";
  }
  // images の各値は文字列(data URL / URL)
  if (isPlainObj(d.images)) for (const v of Object.values(d.images)) if (typeof v !== "string") return "images に不正なデータが含まれています。";
  // customKits の各要素は id を持つ object
  if (Array.isArray(d.customKits)) for (const c of d.customKits) if (!isPlainObj(c) || typeof c.id !== "string") return "customKits に不正な項目が含まれています。";
  return null;
}

/* ── スキーマ版数と漸進的マイグレーション ──
   META を取り込む全経路(起動時ロード・クラウド受信・バックアップ復元)で
   migrateMeta を通す。schemaVersion 無印は v2(本機構導入前)とみなす。
   将来データ構造を変えるたびに SCHEMA_VERSION を上げ、MIGRATIONS に
   「N → N+1」変換を1つ追記する。各変換が実装を伴う時はテストを書くこと。 */
export const SCHEMA_VERSION = 3;
export const MIGRATIONS = {
  // v2 → v3:フィールド級時戳(_ts)導入。旧 record は読み出し時に tsOf が
  // 頂層 t から合成するため、ここでは明示変換は不要(no-op)。
  2: (d) => d,
};
export function migrateMeta(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const start = typeof data.schemaVersion === "number" ? data.schemaVersion : 2;
  let v = start;
  let d = data;
  while (v < SCHEMA_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) break;            // 該当変換が無ければ打ち切り(前方互換)
    d = step(d) || d;
    v++;
  }
  d.schemaVersion = Math.max(v, start); // 未来版(start>現行)はそのまま保持
  return d;
}

export function hashId(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
export const shardKey = (id) => "mg_imgs_" + (hashId(id) % IMG_SHARDS);
export const xtraKey = (imgId) => "mg_xtra_" + (hashId(imgId) % XTRA_SHARDS);

/* ── 複数画像(アルバム)モデル ──────────────────────────────
   ・images[kitId]   = 主画像(従来通り。8シャード mg_imgs_*、kitId キー)
   ・extras[xid]     = 追加画像(32シャード mg_xtra_*、xid キー)。xid は "kitId~乱数"。
   ・albumMeta[kitId]= { order:[ref…], thumb:ref, acquire:ref, framing:{ref:{x,y,scale}}, imeta:{ref:{src,model,at,by}} }
                       ref は "primary" もしくは xid。META に同梱して同期。
   既存データは無改変(主画像はそのまま)。albumMeta/extras が空なら従来と同一挙動。 */
export function newXid(kitId) { return kitId + "~" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
export function kitExtraIds(kitId, extras) {
  const pre = kitId + "~";
  return Object.keys(extras || {}).filter((k) => k.indexOf(pre) === 0).sort();
}
export function albumRefs(kitId, images, extras, albumMeta) {
  const have = [];
  if (images && images[kitId]) have.push("primary");
  for (const x of kitExtraIds(kitId, extras)) have.push(x);
  const haveSet = new Set(have);
  const meta = albumMeta && albumMeta[kitId];
  const order = (meta && Array.isArray(meta.order)) ? meta.order.filter((r) => haveSet.has(r)) : [];
  const rest = have.filter((r) => order.indexOf(r) < 0);
  rest.sort((a, b) => (a === "primary" ? -1 : b === "primary" ? 1 : a < b ? -1 : 1));
  return order.concat(rest);
}
export function refSrc(ref, kitId, images, extras) {
  if (!ref) return undefined;
  return ref === "primary" ? (images ? images[kitId] : undefined) : (extras ? extras[ref] : undefined);
}
export function pickRef(kind, kitId, images, extras, albumMeta) {
  const refs = albumRefs(kitId, images, extras, albumMeta);
  if (!refs.length) return null;
  const meta = albumMeta && albumMeta[kitId];
  const want = meta && meta[kind];
  if (want && refs.indexOf(want) >= 0) return want;
  return refs[0];
}
export function thumbSrcOf(kitId, images, extras, albumMeta) {
  return refSrc(pickRef("thumb", kitId, images, extras, albumMeta), kitId, images, extras);
}
export function acquireSrcOf(kitId, images, extras, albumMeta) {
  return refSrc(pickRef("acquire", kitId, images, extras, albumMeta), kitId, images, extras);
}
export function hasAnyImage(kitId, images, extras) {
  return !!(images && images[kitId]) || kitExtraIds(kitId, extras).length > 0;
}
/* 画像メタ(由来/モデル/時刻/撮影者)。ref 単位で albumMeta[kitId].imeta に格納 */
export function imgMetaFrom(albumMeta, kitId, ref) {
  const m = albumMeta && albumMeta[kitId];
  return (m && m.imeta && m.imeta[ref]) || null;
}
/* ── 構図(framing): サムネ表示時の pan/zoom を記憶。原画像は無加工。
   scale∈[1,3]、x/y はビューポート%(中心0)。満版維持のため ±(scale-1)/2*100 にクランプ。 */
export function clampFraming(fr) {
  if (!fr) return null;
  const s = Math.min(3, Math.max(1, Number(fr.scale) || 1));
  const lim = (s - 1) / 2 * 100;
  const cl = (v) => Math.max(-lim, Math.min(lim, Number(v) || 0));
  return { scale: s, x: cl(fr.x), y: cl(fr.y) };
}
export function isDefaultFraming(fr) {
  return !fr || ((Number(fr.scale) || 1) <= 1.001 && Math.abs(Number(fr.x) || 0) < 0.5 && Math.abs(Number(fr.y) || 0) < 0.5);
}
export function framingStyle(fr) {
  if (isDefaultFraming(fr)) return undefined;
  const c = clampFraming(fr);
  return { transform: `translate(${c.x}%, ${c.y}%) scale(${c.scale})`, transformOrigin: "center center" };
}
// 追加画像のID。機体IDを接頭にし、衝突しにくい短い乱数を付す。
export const newImgId = (kitId) => kitId + "~" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
