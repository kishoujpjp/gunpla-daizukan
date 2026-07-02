/* ───────────────────────────────────────────────────────────
   use-sync.js — 永続化+クラウド同期フック(App.jsx から抽出・Phase 1)
   ─────────────────────────────────────────────────────────────
   持つもの:同期トランスポート抽象(SYNC_TRANSPORT)・LWW 時戳簿記・
   dirty 再送キュー・防抖 push・守衛付き本地保存(persist/saveKey)・
   容量監視。state への反映だけは applyRow コールバックで App 側に委譲する
   (records/images 等の setter とマージ規則は App の関心事のため)。

   ★Phase 2(托管バックエンド+認証)の差し替え点は本檔に集約:
     ・SYNC_TRANSPORT の pull/push 実装
     ・supaRef(url/key/userId)の供給元
   pushKey/pullCloud 以上のロジック・呼び出し側(App)は不変のまま移行できる。
   ─────────────────────────────────────────────────────────── */
import { useState, useEffect, useRef, useCallback } from "react";
import { META_KEY, MAX_SYNC_BYTES, IMG_SHARDS, XTRA_SHARDS, SECRET_KEYS, stripSecrets, metaForCloud } from "./storage-lib.js";

// ── ③ 同期トランスポート抽象 + userId 名前空間(★将来の差し替え点)──
// 現状:使用者自带 Supabase(kv テーブル / anon key)、userId="" で名前空間なし=現行の挙動。
// 将来:托管バックエンド + 認証へ移行する際、この 1 オブジェクトと userId の供給元だけ差し替える。
// LWW・dirty キュー・各キー変換(META/SETTINGS)等、pushKey/pullCloud 以上のロジックは不変。
function syncNsKey(userId, k) { return userId ? userId + ":" + k : k; } // userId 無し=識別子そのまま
const SYNC_TRANSPORT = {
  // cfg = { url, key, userId? }。戻り:行配列 [{key,value,updated_at}](名前空間は剥がした論理キー)。
  async pull(cfg) {
    const res = await fetch(`${cfg.url}/rest/v1/kv?select=key,value,updated_at`, {
      // 託管(認証)モード:accessToken を Bearer に。BYO は従来通り anon key(挙動不変)。
      headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.accessToken || cfg.key}` },
    });
    if (!res.ok) {
      let detail = "";
      try { const j = await res.json(); detail = j.message || j.hint || ""; } catch (e) {}
      throw new Error("HTTP " + res.status + (detail ? " — " + detail : "") +
        (res.status === 404 ? "(kvテーブル未作成、またはURLがプロジェクトAPI URLでない可能性)" : ""));
    }
    const rows = await res.json();
    const uid = cfg.userId || "";
    if (!uid) return rows; // 名前空間なし=全行そのまま(現行)
    const pre = uid + ":";
    return rows.filter((r) => r.key && r.key.indexOf(pre) === 0).map((r) => ({ ...r, key: r.key.slice(pre.length) }));
  },
  // items = [{key,value,updated_at}](論理キー)。戻り:{ok} | {ok:false,status,message} | {ok:false,offline:true}
  async push(cfg, items) {
    const uid = cfg.userId || "";
    const body = uid ? items.map((it) => ({ ...it, key: syncNsKey(uid, it.key) })) : items;
    try {
      // 託管モードは主キーが (user_id,key)。user_id は DB 既定値 auth.uid() が入る。
      const conflict = cfg.accessToken ? "user_id,key" : "key";
      const res = await fetch(`${cfg.url}/rest/v1/kv?on_conflict=${conflict}`, {
        method: "POST",
        headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.accessToken || cfg.key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(body),
      });
      if (res.ok) return { ok: true };
      let detail = "";
      try { const j = await res.json(); detail = j.message || ""; } catch (e) {}
      return { ok: false, status: res.status, message: detail };
    } catch (e) {
      return { ok: false, offline: true };
    }
  },
};

/* settings / albumMeta / serifs を mg_meta から独立した雲端鍵へ分離。
   各キーが独自の updated_at を持つため、粗粒度の単一META gate を回避でき、
   設定トグル等での「META 丸ごと再シリアライズ&再送(書込み増幅)」も無くなる。 */
export const SETTINGS_KEY = "mg_settings";
export const ALBUM_KEY = "mg_album";
export const SERIFS_KEY = "mg_serifs";
/* クラウドへ絶対に出さない憑證キー。storage-lib の SECRET_KEYS に依存せず、
   ここで明示的にも剝離する(SECRET_KEYS が supaUrl 等を含まない場合の保険)。 */
export const CRED_KEYS = ["supaUrl", "supaKey", "geminiKey", "openaiKey", "aiProxyUrl", "aiProxyToken"];
export const secretFieldList = () => [...new Set([...(typeof SECRET_KEYS !== "undefined" && SECRET_KEYS ? SECRET_KEYS : []), ...CRED_KEYS])];

/* ── フック本体 ──
   引数:
     loaded   … 起動ロード完了フラグ(effect の門番。App の state)
     L        … 三語ヘルパ(メッセージ文言用)
     applyRow … pullCloud の行を state へ反映する(App 側)。
                戻り値 true=反映済み(時戳を進める)/ false=スキップ(解析失敗・未知キー)。
   返値:{ syncMsg, setSyncMsg, storageErr, setStorageErr, supaRef,
           persist, saveKey, flushDirty, pullCloud, initFromStorage } */
export function useSync({ loaded, L, applyRow }) {
  const [syncMsg, setSyncMsg] = useState("");
  const [storageErr, setStorageErr] = useState(""); // 端末保存失敗(容量不足等)の可視化
  const syncTsRef = useRef({});
  const pushTimers = useRef({});
  const supaRef = useRef({ url: "", key: "" });
  const dirtyRef = useRef(new Set()); // 雲端へ未確定の変更キー(オフライン再送用)

  /* ── 守衛付き本地保存:成否を返す。失敗は握り潰さず可視化する ──
     重要:時戳(syncTsRef)は「確実に端末へ落ちた値」だけを指すべき。
     書き込み失敗時に時戳を進めると、再起動後に端末の【古い値】が
     【新しい時戳】を帯び、pullCloud の LWW が雲端の正しい副本を
     「本地が新しい」と誤判してスキップ → 静かに古いデータに固着する。 */
  const persist = useCallback(async (k, v) => {
    try {
      await window.storage.set(k, v);
      setStorageErr((prev) => (prev ? "" : prev)); // 成功したら警告を消す
      return true;
    } catch (e) {
      console.error("storage error", e);
      setStorageErr(L("⚠ 端末への保存に失敗しました(空き容量不足の可能性)。クラウド同期またはバックアップ書き出しで保全してください。","⚠ Failed to save to this device (storage may be full). Use cloud sync or export a backup to keep your data safe.","⚠ 儲存到此裝置失敗(可能空間不足)。請以雲端同步或匯出備份保全資料。"));
      return false;
    }
  }, []);

  /* ── オフライン再送キュー ──
     雲端へ未確定の変更キーを dirtyRef に貯め、端末にも mg_dirty として保存。
     push 成功で解除、失敗で残置。online / 復帰 / 定期で flushDirty が再送する。
     値は push 時に IndexedDB から読むので、再起動・オフラインをまたいでも
     最新の本地値が、変更時の時戳(syncTsRef)付きで正しく送られる。 */
  const persistDirty = useCallback(async () => {
    try { await window.storage.set("mg_dirty", JSON.stringify([...dirtyRef.current])); } catch (e) {}
  }, []);
  const markDirty = useCallback((k) => { dirtyRef.current.add(k); persistDirty(); }, [persistDirty]);
  const unmarkDirty = useCallback((k) => { if (dirtyRef.current.delete(k)) persistDirty(); }, [persistDirty]);

  // 単一キーを雲端へ送る。成功=true。失敗時は dirty に残す。
  const pushKey = useCallback(async (k) => {
    const { url, key } = supaRef.current;
    if (!url || !key) return false;
    let v;
    try { const r = await window.storage.get(k); v = r && r.value; }
    catch (e) {
      if (e && /not found/i.test(e.message || "")) { unmarkDirty(k); return true; } // 値が無い→送る物なし
      return false; // 一時的エラー→残して後で再送
    }
    if (v == null) { unmarkDirty(k); return true; }
    // settings 独立鍵は秘密鍵(APIキー/Supabase認証)を雲端へ出さない。値と、残存し得る
    // 秘密フィールドの _ts も剝離して、別端末で古い時戳の undefined が鍵を消すのを防ぐ。
    const settingsForCloud = (s) => {
      try {
        const o = stripSecrets(JSON.parse(s));
        const secrets = secretFieldList();
        const ts = o && o._ts ? { ...o._ts } : null;
        for (const sk of secrets) { delete o[sk]; if (ts) delete ts[sk]; } // 値と _ts を明示剝離
        if (ts) o._ts = ts;
        return JSON.stringify(o);
      } catch (e) { return s; }
    };
    const pushVal = k === META_KEY ? metaForCloud(v) : k === SETTINGS_KEY ? settingsForCloud(v) : v;
    // 画像シャードが大きすぎるとクラウドの行/リクエスト上限を超え、永久に
    // 失敗→再送ループになり、しかも flushDirty の queue を塞ぐ。事前にサイズ確認し、
    // 超過分は本地保存のみとして dirty を外し、最適化を促す(圧縮後の保存で再送される)。
    if (k.indexOf("mg_imgs_") === 0 || k.indexOf("mg_xtra_") === 0) {
      let bytes;
      try { bytes = new Blob([pushVal]).size; } catch (e) { bytes = pushVal.length; }
      if (bytes > MAX_SYNC_BYTES) {
        unmarkDirty(k);
        setSyncMsg(L("画像が大きすぎてクラウド同期できません(","Image too large for cloud sync (","圖片過大無法雲端同步(") + Math.round(bytes / 1048576) +
          L("MB)。設定→「画像を最適化(容量削減)」で圧縮してください(本地には保存済み)。","MB). Compress it via Settings → Optimize images (saved locally).","MB)。請至 設定→最佳化圖片 壓縮(已存於本機)。"));
        return true; // 取りこぼし扱いで queue を進める
      }
    }
    const updated_at = syncTsRef.current[k] || new Date().toISOString();
    const r = await SYNC_TRANSPORT.push({ url, key, accessToken: supaRef.current.accessToken, userId: supaRef.current.userId }, [{ key: k, value: pushVal, updated_at }]);
    if (r.ok) { unmarkDirty(k); setSyncMsg(L("クラウド同期済み ","Cloud-synced ","已雲端同步 ") + new Date().toLocaleTimeString()); return true; }
    if (r.offline) { setSyncMsg(L("オフライン — 接続回復後に再送します","Offline — will retry when reconnected","離線 — 連線恢復後重送")); return false; }
    setSyncMsg(L("同期エラー HTTP ","Sync error HTTP ","同步錯誤 HTTP ") + r.status + (r.message ? " — " + r.message : "") + L("(後で再送します)"," (will retry later)","(稍後重送)"));
    return false;
  }, [unmarkDirty]);

  /* ── 本地保存 + 雲端推送(防抖) ── */
  const saveKey = useCallback(async (k, v) => {
    // 防護:空集合の META は本地保存のみ——時戳を更新せず、推送もしない。
    // (時戳が空状態で進むと、LWW が本地を新しいと誤判し雲端復元を跳ばす)
    if (k === META_KEY) {
      try {
        const d = JSON.parse(v);
        const emptyish =
          (!d.records || !Object.keys(d.records).length) &&
          (!d.overrides || !Object.keys(d.overrides).length) &&
          (!d.customKits || !d.customKits.length);
        if (emptyish) { await persist(k, v); return; }
      } catch (e) {}
    }
    // 本地書き込みが失敗したら時戳を進めず、推送もしない(復元の安全網を守る)
    const ok = await persist(k, v);
    if (!ok) return;
    syncTsRef.current[k] = new Date().toISOString();
    await persist("mg_sync_ts", JSON.stringify(syncTsRef.current));
    const { url, key } = supaRef.current;
    if (!url || !key) return;
    // 未確定としてキューに積み、防抖後に送信。失敗しても pushKey が dirty に残す。
    markDirty(k);
    clearTimeout(pushTimers.current[k]);
    pushTimers.current[k] = setTimeout(() => { pushKey(k); }, 900);
  }, [persist, markDirty, pushKey]);

  // dirty キューを順次再送(オフライン中は何もしない)
  const flushDirty = useCallback(async () => {
    const { url, key } = supaRef.current;
    if (!url || !key || !dirtyRef.current.size) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;
    for (const k of [...dirtyRef.current]) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await pushKey(k);
      if (!ok) break; // 1件失敗(オフライン等)したら以降は次の機会に
    }
  }, [pushKey]);

  // online 復帰・前景復帰・定期で未送信分を再送
  useEffect(() => {
    if (!loaded) return;
    const fn = () => flushDirty();
    const onVis = () => { if (document.visibilityState === "visible") flushDirty(); };
    window.addEventListener("online", fn);
    document.addEventListener("visibilitychange", onVis);
    const iv = setInterval(fn, 60 * 1000);
    const kick = setTimeout(fn, 1500); // 起動直後にも一度(supaRef 確定後)
    return () => {
      window.removeEventListener("online", fn);
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(iv);
      clearTimeout(kick);
    };
  }, [loaded, flushDirty]);

  // ストレージ永続化の要求 + 残容量の監視(端末側データ消失への備え)
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const s = navigator.storage;
        if (s && s.persist) {
          const already = s.persisted ? await s.persisted() : false;
          if (!already) await s.persist(); // 退避(eviction)されにくくする。iOS は限定的
        }
        if (s && s.estimate) {
          const { usage, quota } = await s.estimate();
          if (quota && usage / quota > 0.8) {
            setStorageErr(L("⚠ 端末の保存容量が残りわずかです(使用 ","⚠ This device is low on storage (using ","⚠ 裝置儲存空間所剩無幾(已用 ") + Math.round(usage / 1048576) +
              "MB / " + Math.round(quota / 1048576) + L("MB)。設定→画像を最適化、またはバックアップ書き出しをおすすめします。","MB). Consider Settings → Optimize images, or export a backup.","MB)。建議至 設定→最佳化圖片，或匯出備份。"));
          }
        }
      } catch (e) { /* 非対応環境は黙ってスキップ */ }
    })();
  }, [loaded]);

  /* ── 起動時復元:LWW 時戳(mg_sync_ts)と未送信キュー(mg_dirty)。
     App の load effect から一度だけ呼ぶ(移設前と同じ位置・同じ順序)。 */
  const initFromStorage = useCallback(async () => {
      try {
        const tsr = await window.storage.get("mg_sync_ts");
        syncTsRef.current = JSON.parse(tsr.value) || {};
      } catch (e) { syncTsRef.current = {}; }
      try {
        const dr = await window.storage.get("mg_dirty");
        const arr = JSON.parse(dr.value);
        if (Array.isArray(arr)) dirtyRef.current = new Set(arr);
      } catch (e) { /* 未送信なし */ }
  }, []);

  /* ── 雲端 pull:LWW 判定・persist・時戳簿記は移設前と不変。
     行の state 反映のみ applyRow(App)に委譲。applyRow が false を
     返した行は移設前の continue と同様、時戳を進めずスキップする。 ── */
  const pullCloud = useCallback(async (cfg, force) => {
    const url = cfg.url, key = cfg.key;
    if (!url || !key) return 0;
    const rows = await SYNC_TRANSPORT.pull({ url, key, accessToken: cfg.accessToken, userId: cfg.userId });
    let applied = 0;
    for (const row of rows) {
      const lts = syncTsRef.current[row.key];
      if (!force && lts && lts >= row.updated_at) continue;
      if (!applyRow(row)) continue;
      // 次回 pull で再適用させる(古い本地値に新時戳が付くのを防ぐ)。
      const okSet = await persist(row.key, row.value);
      if (!okSet) continue;
      syncTsRef.current[row.key] = row.updated_at;
      applied++;
    }
    await persist("mg_sync_ts", JSON.stringify(syncTsRef.current));
    return applied;
  }, [applyRow, persist]);

  /* ── 初回移行用:標準キー全量を dirty 化(値は push 時に端末から読む。
     値の無いキーは pushKey が自動で dirty から外す)。ログイン直後の
     「本地→雲端の全量アップロード」に使う。 ── */
  const markAllDirty = useCallback(() => {
    const keys = [META_KEY, SETTINGS_KEY, ALBUM_KEY, SERIFS_KEY];
    for (let i = 0; i < IMG_SHARDS; i++) keys.push("mg_imgs_" + i);
    for (let i = 0; i < XTRA_SHARDS; i++) keys.push("mg_xtra_" + i);
    for (const k of keys) dirtyRef.current.add(k);
    persistDirty();
  }, [persistDirty]);

  return { syncMsg, setSyncMsg, storageErr, setStorageErr, supaRef,
           persist, saveKey, flushDirty, pullCloud, initFromStorage, markAllDirty };
}
