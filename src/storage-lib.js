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
export const SECRET_KEYS = ["geminiKey", "openaiKey", "supaKey", "supaUrl", "aiProxyUrl", "aiProxyToken"];
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
  // scale<1 を許可(letterbox=全画像表示)。下限0.2で最大5:1まで全体表示可。
  const s = Math.min(3, Math.max(0.2, Number(fr.scale) || 1));
  // 平行移動(%)はelement box基準。letterboxや広い画像の高倍率で大きく振れるため緩い安全域で通す。
  const cl = (v) => Math.max(-520, Math.min(520, Number(v) || 0));
  const out = { scale: s, x: cl(fr.x), y: cl(fr.y) };
  // a=編集時の画像アスペクト(iw/ih)。非正方形容器での自適応描画に用いる(任意・後方互換)。
  if (fr.a) { const av = Number(fr.a); if (av > 0 && isFinite(av)) out.a = av; }
  return out;
}
export function isDefaultFraming(fr) {
  if (!fr) return true;
  // scale≈1 かつ無移動のみ既定。scale<1(全画像letterbox)は既定ではない→transformを適用させる。
  const s = Number(fr.scale) || 1;
  return Math.abs(s - 1) < 0.005 && Math.abs(Number(fr.x) || 0) < 0.5 && Math.abs(Number(fr.y) || 0) < 0.5;
}
// ar=描画先コンテナのアスペクト(cw/ch)。既定1(正方形)。
// 正方形(ar=1)や a 無しの旧framingは従来transformそのまま(後方互換・正方形は厳密一致)。
// 非正方形は「正方形エディタで選んだ焦点矩形」を導出し、その矩形を内包する ar-crop を
// 焦点中心に置いて cover+transform を再計算する(直式salon等でも構図が破綻しない)。
export function framingStyle(fr, ar = 1) {
  if (isDefaultFraming(fr)) return undefined;
  const c = clampFraming(fr);
  if (!c.a || Math.abs(ar - 1) < 1e-4) {
    return { transform: `translate(${c.x}%, ${c.y}%) scale(${c.scale})`, transformOrigin: "center center" };
  }
  const a = c.a;
  // 1) 正方形容器での可視領域 = 焦点矩形(image-normalized)
  const sqWD = a >= 1 ? a : 1, sqHD = a >= 1 ? 1 : 1 / a;
  const s0 = c.scale, tx0 = c.x / 100, ty0 = c.y / 100;
  const unAt = (cx) => { const ex = 0.5 + (cx - 0.5 - tx0) / s0; return (ex - (1 - sqWD) / 2) / sqWD; };
  const vnAt = (cy) => { const ey = 0.5 + (cy - 0.5 - ty0) / s0; return (ey - (1 - sqHD) / 2) / sqHD; };
  const fx0 = unAt(0), fx1 = unAt(1), fy0v = vnAt(0), fy1v = vnAt(1);
  const fcx = (fx0 + fx1) / 2, fcy = (fy0v + fy1v) / 2;
  const fw = fx1 - fx0, fh = fy1v - fy0v;
  // 2) 焦点矩形を内包する最小 ar-crop を中心配置(pixel基準: ih=1, iw=a)
  const fpw = fw * a, fph = fh;
  const cph = Math.max(fph, fpw / ar), cpw = ar * cph;
  const crw = cpw / a, crh = cph; // normalized
  const rx0 = fcx - crw / 2, ry0 = fcy - crh / 2, rx1 = fcx + crw / 2, ry1 = fcy + crh / 2;
  // 3) ar容器の cover 寸法 → crop矩形を埋めるtransform
  const WD = Math.max(1, a / ar), HD = Math.max(1, ar / a);
  const s = 1 / ((rx1 - rx0) * WD);
  const exn0 = (1 - WD) / 2 + rx0 * WD;
  const eyn0 = (1 - HD) / 2 + ry0 * HD;
  const txn = -(0.5 + (exn0 - 0.5) * s);
  const tyn = -(0.5 + (eyn0 - 0.5) * s);
  return { transform: `translate(${(txn * 100).toFixed(3)}%, ${(tyn * 100).toFixed(3)}%) scale(${s.toFixed(4)})`, transformOrigin: "center center" };
}
// 追加画像のID。機体IDを接頭にし、衝突しにくい短い乱数を付す。
export const newImgId = (kitId) => kitId + "~" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
