/* ───────────────────────────────────────────────────────────
   機体目錄(クラウド配信)── 選項1:静的 delta JSON を CDN/Repo から取得
   ・ALL_BASE(bundle)は「離線地板」。雲端は add/patch/retract の増量のみ。
   ・合併順:ALL_BASE → 雲端 delta → overrides(端末) → customKits(端末)。
   ・本地キャッシュは saveKey を通さない(= per-user 同期に混ぜない・上雲しない)。
   ・★商用化の差し替え点はこの 2 つの fetch 関数だけ。applyCatalog 以上は不変。
     例: fetchCatalogDelta を「認証付き API / Supabase の権限別配信」に置換しても、
         戻り値の形(delta オブジェクト)さえ守れば上位ロジックは一切変更不要。
   ─────────────────────────────────────────────────────────── */
export const CATALOG_SCHEMA = 1;
export const CATALOG_CACHE_KEY = "mg_catalog";   // 本地キャッシュ鍵(同期対象外)
export const CATALOG_LOG_KEY = "mg_catalog_log"; // 更新履歴(本地のみ・同期対象外)
export const CATALOG_LOG_MAX = 30;               // 履歴保持件数
/* 注:diffCatalog は基礎目錄を引数 baseKits で受ける(依存注入)。
   呼び出し側(use-catalog.js)が ALL_BASE を渡す。純関数化しテスト可能に。 */
export const CATALOG_DEFAULT_BASE = "";          // 既定の配信元。例:
//   "https://cdn.jsdelivr.net/gh/<user>/<repo>@main/catalog"
//   (末尾に /version.json・/delta.json を付けて取得。空なら目錄更新は無効=ALL_BASE のみ)

// delta の最低限スキーマ検証(壊れた/半端な取得を弾き、現行データに固着させない)
export function validateCatalog(d) {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  if (typeof d.catalogVersion !== "number") return false;
  if (d.add != null && !Array.isArray(d.add)) return false;
  if (d.patch != null && (typeof d.patch !== "object" || Array.isArray(d.patch))) return false;
  if (d.retract != null && !Array.isArray(d.retract)) return false;
  if (d.notes != null && typeof d.notes !== "string") return false;
  if (d.minAppVersion != null && typeof d.minAppVersion !== "string") return false;
  if (d.checksum != null && typeof d.checksum !== "string") return false;
  if (d.schema != null && typeof d.schema !== "number") return false;
  const seen = new Set();
  for (const k of (d.add || [])) {
    if (!k || typeof k.id !== "string" || !k.id) return false; // id は永久・必須
    if (seen.has(k.id)) return false;                          // delta 内重複禁止
    seen.add(k.id);
  }
  if (typeof d.count === "number" && d.count !== (d.add ? d.add.length : 0)) return false;
  return true;
}

// ALL_BASE に delta を適用して合併済み配列を返す(純関数・ALL_BASE は不変)
export function applyCatalog(base, cat) {
  if (!cat) return base;
  const out = base.slice();
  const pos = new Map();
  for (let i = 0; i < out.length; i++) pos.set(out[i].id, i);
  // add:新規IDは追記。既存IDと衝突したら patch 扱いでマージ(取りこぼし防止)。
  for (const rec of (cat.add || [])) {
    if (pos.has(rec.id)) {
      const i = pos.get(rec.id);
      out[i] = { ...out[i], ...rec };
    } else {
      out.push({ line: "", no: "", code: "", series: "", premium: false, base: false, ...rec });
      pos.set(rec.id, out.length - 1);
    }
  }
  // patch:既存機体の部分更新(定価・alias 等の公式修正)
  if (cat.patch) {
    for (const id in cat.patch) {
      const i = pos.get(id);
      if (i != null) out[i] = { ...out[i], ...cat.patch[id] };
    }
  }
  // retract(下架/撤回):重大な誤りの緊急取り下げ用。削除せず retracted フラグを立てる
  // だけ(収藏記録・画像を孤児化させない)。表示は allKits 側で隠す。再公開は retract
  // から外せば、記録が残っているのでそのまま復活する。
  if (cat.retract && cat.retract.length) {
    for (const id of cat.retract) {
      const i = pos.get(id);
      if (i != null) out[i] = { ...out[i], retracted: true };
    }
  }
  return out;
}

// 更新履歴用の差分:前回適用した delta(prev)と今回(next)を比べ、今回「新たに」
// 追加/修正/下架/再公開された項目だけを名前付きで返す。delta はスナップショットのため、
// 単純な件数ではなくこの差分が「今回の変化」を正確に表す。add から消えた項目
// (= kits-data.js への折込み等)は利用者向けの「削除」ではないので意図的に無視する。
export function diffCatalog(prev, next, baseKits) {
  const nameMap = {};
  for (const k of applyCatalog(baseKits, next)) nameMap[k.id] = k.name;
  const nameOf = (id) => nameMap[id] || id;
  const prevAdd = new Set(((prev && prev.add) || []).map((k) => k.id));
  const prevPatch = (prev && prev.patch) || {};
  const prevRet = new Set((prev && prev.retract) || []);
  const nextRet = new Set(next.retract || []);
  const added = [], patched = [], retracted = [], restored = [];
  for (const k of (next.add || [])) if (!prevAdd.has(k.id)) added.push({ id: k.id, name: k.name || k.id });
  for (const id in (next.patch || {})) {
    const nf = next.patch[id] || {}, of = prevPatch[id] || {};
    const fields = Object.keys(nf).filter((f) => JSON.stringify(of[f]) !== JSON.stringify(nf[f]));
    if (fields.length) patched.push({ id, name: nameOf(id), fields });
  }
  for (const id of nextRet) if (!prevRet.has(id)) retracted.push({ id, name: nameOf(id) });
  for (const id of prevRet) if (!nextRet.has(id)) restored.push({ id, name: nameOf(id) });
  return { added, patched, retracted, restored };
}

/* ── ④ 目錄完整性 + schema 互換シーム ──
   checksum / schema は「在る時だけ」検証。無ければ true=現状不変。
   canonical: キーを再帰ソート(配列順は保持)した決定的 JSON。生成側と検証側で一致させる。
   ※ checksum は add/patch/retract/notes のみを対象(version/generatedAt/checksum 自体は除外)。 */
export function canonicalCatalog(d) {
  const sort = (v) => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === "object") {
      const o = {};
      for (const k of Object.keys(v).sort()) o[k] = sort(v[k]);
      return o;
    }
    return v;
  };
  return JSON.stringify(sort({ add: d.add || [], patch: d.patch || {}, retract: d.retract || [], notes: d.notes || "" }));
}
// FNV-1a 32bit(Math.imul で正しい 32bit 乗算)→ 8桁hex。破損/半端ダウンロード/不一致の
// 検出に十分。暗号強度はない(改竄対策の署名は将来の別案件)。
export function catalogChecksum(d) {
  const s = canonicalCatalog(d);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, "0");
}
export function verifyCatalogIntegrity(d) {
  if (typeof d.schema === "number" && d.schema > CATALOG_SCHEMA) return false; // client が古すぎて解釈不可→拒否
  if (typeof d.checksum === "string" && d.checksum && d.checksum !== catalogChecksum(d)) return false; // 破損/不一致→拒否
  return true;
}

// ── 配信トランスポート(★商用化の差し替え点はここだけ)──
export async function fetchCatalogVersion(base) {
  const root = String(base || "").trim().replace(/\/+$/, "");
  if (!root) return null;
  const res = await fetch(root + "/version.json", { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}
export async function fetchCatalogDelta(base) {
  const root = String(base || "").trim().replace(/\/+$/, "");
  if (!root) return null;
  const res = await fetch(root + "/delta.json", { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const d = await res.json();
  if (!validateCatalog(d)) throw new Error("catalog schema invalid");
  if (!verifyCatalogIntegrity(d)) throw new Error("catalog integrity/compat failed"); // 破損/非互換→失敗扱い=快取へ退避
  return d;
}
