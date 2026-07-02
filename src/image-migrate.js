/* ───────────────────────────────────────────────────────────
   image-migrate.js — v3→v4 画像遷移 + 共通ヘルパー(P2 第3批 3-2)

   ・migrateShardsToStore: KV 分片(mg_imgs_◯・mg_xtra_◯)の base64 を
     image-store へ移設し、URL 項目は分流して返す。
     冪等(取込済み id は skip)・分片単位で確定(全件成功した分片のみ
     削除。失敗/壊れ分片は残置=データ温存)。途中クラッシュしても
     次回起動で残分片から再開できる。
   ・storage は window.storage 契約(get は無いキーで throw)を前提。
   ─────────────────────────────────────────────────────────── */

export const isHttpSrc = (v) => typeof v === "string" && /^https?:\/\//.test(v);

/* Blob → data:URL(FileReader 非依存:node でもテスト可能) */
export async function blobToDataURL(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) bin += String.fromCharCode.apply(null, buf.subarray(i, i + CHUNK));
  return "data:" + (blob.type || "application/octet-stream") + ";base64," + btoa(bin);
}

export async function migrateShardsToStore(storage, store, { imgShards = 8, xtraShards = 32 } = {}) {
  const keys = [];
  for (let i = 0; i < imgShards; i++) keys.push("mg_imgs_" + i);
  for (let i = 0; i < xtraShards; i++) keys.push("mg_xtra_" + i);
  const urlRows = {};      // http(s) URL 項目 → 呼び手が mg_imgurls へ合流
  const keptShards = [];   // 残置した分片(壊れ/一部失敗)
  let moved = 0;           // store へ新規取込した枚数
  for (const key of keys) {
    let r = null;
    try { r = await storage.get(key); } catch (e) { continue; } // 無し=遷移済み/未使用
    if (!r || !r.value) continue;
    let map;
    try { map = JSON.parse(r.value); } catch (e) { keptShards.push(key); continue; } // 壊れ分片は残置
    if (!map || typeof map !== "object" || Array.isArray(map)) { keptShards.push(key); continue; }
    let okAll = true;
    for (const [id, v] of Object.entries(map)) {
      if (typeof v !== "string" || !v) continue;
      if (isHttpSrc(v)) { urlRows[id] = v; continue; }
      if (v.indexOf("data:") !== 0) continue; // 不明形式は無視(取込も削除阻止もしない)
      try {
        if (await store.has(id)) continue;    // 冪等
        await store.putDataURL(id, v);
        moved++;
      } catch (e) { okAll = false; }          // 1件でも失敗した分片は削除しない
    }
    if (okAll) { try { await storage.delete(key); } catch (e) { keptShards.push(key); } }
    else keptShards.push(key);
  }
  return { moved, urlRows, keptShards };
}
