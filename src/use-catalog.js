/* ───────────────────────────────────────────────────────────
   use-catalog.js — 機体目錄(クラウド配信 delta)フック
   App.jsx から抽出(Phase 1)。挙動不変。
   ・本地キャッシュで即描画 → version.json で新鮮度判定 → delta 取得・検証。
   ・失敗は握り潰して現行データ続行(オフライン安全)。
   ・★商用化の差し替え点は catalog-lib.js の fetch 2 関数(認証付き API 等へ)。
   ・運営お知らせ(notice)/最低版本(minAppVersion)の seam も本檔に同居。
   ─────────────────────────────────────────────────────────── */
import { useState, useEffect, useRef, useCallback } from "react";
import { ALL_BASE } from "./kits-data.js";
import { notify } from "./dialogs.jsx";
import { APP_VERSION, cmpVer } from "./entitlements.js";
import {
  CATALOG_CACHE_KEY, CATALOG_LOG_KEY, CATALOG_LOG_MAX, CATALOG_DEFAULT_BASE,
  validateCatalog, diffCatalog, fetchCatalogVersion, fetchCatalogDelta,
} from "./catalog-lib.js";

/* 引数:
     L          … 三語ヘルパ
     persist    … 守衛付き本地保存(use-sync より)
     catalogUrl … settings.catalogUrl(依存配列用に値で受ける)
   返値:{ catalog, catalogLog, catalogLogOpen, setCatalogLogOpen,
           refreshCatalog, initCatalogFromStorage } */
export function useCatalog({ L, persist, catalogUrl }) {
  const [catalog, setCatalog] = useState(null);   // クラウド配信の目錄 delta(検証済み or null)
  const catalogRef = useRef(null);                // 最新版判定用(load effect の単発クロージャ回避)
  const [catalogLog, setCatalogLog] = useState([]);       // 更新履歴(本地のみ・同期しない)
  const catalogLogRef = useRef([]);
  const [catalogLogOpen, setCatalogLogOpen] = useState(false);
  // トースト(decree)のタップ→更新履歴を開く連携
  useEffect(() => {
    const onTap = (e) => { if (e && e.detail === "catalog-log") setCatalogLogOpen(true); };
    window.addEventListener("app-toast-tap", onTap);
    return () => window.removeEventListener("app-toast-tap", onTap);
  }, []);

  /* ── 起動時復元:本地キャッシュ+更新履歴(App の load effect から一度だけ呼ぶ。
     移設前と同じ位置・同じ順序=initFromStorage(sync) の直後)。 ── */
  const initCatalogFromStorage = useCallback(async () => {
      try {
        const cr = await window.storage.get(CATALOG_CACHE_KEY);
        if (cr && cr.value) { const cv = JSON.parse(cr.value); if (validateCatalog(cv)) { catalogRef.current = cv; setCatalog(cv); } }
      } catch (e) { /* 初回はキャッシュ無し:ALL_BASE のみで起動 */ }
      try {
        const lr = await window.storage.get(CATALOG_LOG_KEY);
        if (lr && lr.value) { const lg = JSON.parse(lr.value); if (Array.isArray(lg)) { catalogLogRef.current = lg; setCatalogLog(lg); } }
      } catch (e) { /* 履歴なし */ }
  }, []);

  /* ── 機体目錄の刷新(選項1)──
     version.json で新鮮度を先判定 → 新しければ delta.json を取得・検証 → state 更新 +
     本地キャッシュ(saveKey を通さない=同期に混ぜない)。失敗は握り潰し、現行データを維持。
     baseArg は load effect から「直読みした catalogUrl」を渡す用(App 側の settings から注入)(state 反映前のため)。 */
  /* ── 商用化シーム:運営お知らせ(notice)と最低 app バージョン(minAppVersion)──
     version.json / delta.json にこれらの欄位が「在る時だけ」反応する。現状のデータには
     無いので挙動は不変。notice は同じ内容を一度だけ通知(本地 dedupe・同期しない)。
     minAppVersion は現状ソフト通知のみ(将来の強制更新はここを 1 行強める)。 */
  const processCatalogMeta = useCallback(async (meta) => {
    if (!meta || typeof meta !== "object") return;
    try {
      if (typeof meta.minAppVersion === "string" && cmpVer(APP_VERSION, meta.minAppVersion) < 0) {
        let seen = ""; try { const s = await window.storage.get("mg_minver_seen"); seen = (s && s.value) || ""; } catch (e) {}
        if (seen !== meta.minAppVersion) {
          notify(L("新しいバージョンが利用可能です。更新して最新のデータを取得してください。", "A new version is available — update to get the latest data.", "有新版可用,請更新以取得最新資料。"), { kind: "info", dur: 4200 });
          try { await window.storage.set("mg_minver_seen", meta.minAppVersion); } catch (e) {}
        }
      }
      const n = meta.notice;
      if (n) {
        const ntext = typeof n === "object" ? String(n.text || "") : String(n);
        const nid = typeof n === "object" ? String(n.id || ntext) : ntext;
        if (ntext) {
          let seen = ""; try { const s = await window.storage.get("mg_notice_seen"); seen = (s && s.value) || ""; } catch (e) {}
          if (seen !== nid) {
            notify(ntext, { kind: "info", dur: 5200 });
            try { await window.storage.set("mg_notice_seen", nid); } catch (e) {}
          }
        }
      }
    } catch (e) { /* 失敗は無視 */ }
  }, []);

  const refreshCatalog = useCallback(async (baseArg) => {
    const raw = baseArg != null ? baseArg : (catalogUrl || "");
    const base = (String(raw).trim() || CATALOG_DEFAULT_BASE).replace(/\/+$/, "");
    if (!base) return 0;
    const curVer = (catalogRef.current && typeof catalogRef.current.catalogVersion === "number")
      ? catalogRef.current.catalogVersion : -1;
    try {
      // 1) version.json で先に新鮮度判定 + 運営メタ(公告/最低版本)を処理
      let remoteVer = null;
      let vmeta = null;
      try { vmeta = await fetchCatalogVersion(base); } catch (e) {}
      processCatalogMeta(vmeta); // 公告/最低版本は catalogVersion と独立に毎回チェック(無ければ無反応)
      if (vmeta && typeof vmeta.catalogVersion === "number") remoteVer = vmeta.catalogVersion;
      if (remoteVer != null && remoteVer <= curVer) return 0; // 既に最新:delta を取りに行かない
      // 2) delta 取得・検証
      const d = await fetchCatalogDelta(base);
      if (!d) return 0;
      if (typeof d.catalogVersion === "number" && d.catalogVersion <= curVer) return 0;
      const prev = catalogRef.current;
      const isFirst = !prev;
      const diff = diffCatalog(prev, d, ALL_BASE);
      const total = diff.added.length + diff.patched.length + diff.retracted.length + diff.restored.length;
      catalogRef.current = d;
      setCatalog(d);
      persist(CATALOG_CACHE_KEY, JSON.stringify(d)); // 同期対象外の本地キャッシュ
      if (total > 0) {
        // 更新履歴(log):本地のみ・同期しない。最近 CATALOG_LOG_MAX 件を保持。
        const entry = { ts: new Date().toISOString(), version: d.catalogVersion,
          notes: (typeof d.notes === "string" ? d.notes : ""),
          added: diff.added, patched: diff.patched, retracted: diff.retracted, restored: diff.restored };
        const nextLog = [entry, ...catalogLogRef.current].slice(0, CATALOG_LOG_MAX);
        catalogLogRef.current = nextLog; setCatalogLog(nextLog);
        persist(CATALOG_LOG_KEY, JSON.stringify(nextLog));
        // 通知は「絞り込み解除」と同じ decree 様式。代表名+件数を出し、タップで更新履歴を開く。
        // 初回適用(prev 無し)は全件が新規扱いになり大量表示になるため通知は出さない(履歴には残す)。
        if (!isFirst) {
          const cats = [
            { arr: diff.added,     lab: L("追加", "added", "新增") },
            { arr: diff.patched,   lab: L("修正", "updated", "修正") },
            { arr: diff.retracted, lab: L("取り下げ", "removed", "下架") },
            { arr: diff.restored,  lab: L("再公開", "restored", "重新上架") },
          ].filter((c) => c.arr.length);
          let body;
          if (cats.length === 1) {
            const c = cats[0];
            body = c.lab + " " + c.arr[0].name +
              (c.arr.length > 1 ? L("　他" + (c.arr.length - 1) + "件", " +" + (c.arr.length - 1), " 等 " + c.arr.length + " 件") : "");
          } else {
            body = cats.map((c) => c.lab + " " + c.arr.length).join(" · ");
          }
          notify(L("機体データ更新", "Catalog updated", "機體資料已更新") + L("：", ": ", "：") + body,
            { variant: "decree", tag: L("更新", "UPDATED", "更新"), tap: "catalog-log", dur: 3600 });
        }
      }
      return total;
    } catch (e) { /* オフライン/取得失敗/検証失敗:無感で現行データ続行 */ return 0; }
  }, [catalogUrl, persist, processCatalogMeta]);

  return { catalog, catalogLog, catalogLogOpen, setCatalogLogOpen,
           refreshCatalog, initCatalogFromStorage };
}
