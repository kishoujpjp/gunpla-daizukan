import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import "./app.css";
import { ErrorBoundary } from "./error-boundary.jsx";
import { mergeRec, mergeRecMap, mergeArrStamped, stampRec, stampRecAll } from "./merge.js";
import { ACHIEVEMENTS } from "./achievements-rules.js";
import { ACH_I18N } from "./achievements-i18n.js";
import { evaluateAchievements, explainAchievement } from "./achievements-engine.js";
import { ALL_BASE } from "./kits-data.js";
import { QuizModal } from "./quiz.jsx";
import { haptic, hapticStrong, setHapticEnabled, swallowNextClick, swallowNextClickOnRelease } from "./utils.js";
/* ── Phase 1 拆分モジュール(挙動不変・App.jsx から抽出) ── */
import { UNI_TAG, UNI_PICK, universeOfKit, Emblem, SeriesWatermark } from "./universe.jsx";
import { normJa, toRomaji } from "./ja-text.js";
import { fileToCompressedDataURL, AI_STYLES, AI_MODELS, aiProviderLabel, aiAvailable } from "./ai-config.js";
import { DateSetField, Picker } from "./form-controls.jsx";
import { notify, appConfirm, AppDialogHost } from "./dialogs.jsx";
import { useSync, SETTINGS_KEY, ALBUM_KEY, SERIFS_KEY, secretFieldList } from "./use-sync.js";
import { useAuth } from "./use-auth.js";
import { MANAGED_BACKEND, managedOn } from "./backend-config.js";
import { useCatalog } from "./use-catalog.js";
import { applyCatalog, CATALOG_DEFAULT_BASE } from "./catalog-lib.js";
import { APP_VERSION, ENTITLEMENTS } from "./entitlements.js";
import { SwipeViewer } from "./swipe-viewer.jsx";
import { FramingEditor } from "./framing-editor.jsx";
import { KitFixModal } from "./kit-fix-modal.jsx";
import { KitIdentifyModal } from "./kit-identify-modal.jsx";
import { AIRestyleModal } from "./ai-restyle-modal.jsx";
import { CropModal } from "./crop-modal.jsx";
import { ImageEditorModal } from "./image-editor-modal.jsx";
import {
  META_KEY,
  IMG_SHARDS,
  XTRA_SHARDS,
  MAX_IMGS_PER_KIT,
  SECRET_KEYS,
  stripSecrets,
  metaForCloud,
  isPlainObj,
  SORT_KEYS,
  validateBackup,
  SCHEMA_VERSION,
  MIGRATIONS,
  migrateMeta,
  hashId,
  newXid,
  kitExtraIds,
  albumRefs,
  refSrc,
  pickRef,
  thumbSrcOf,
  acquireSrcOf,
  hasAnyImage,
  imgMetaFrom,
  clampFraming,
  isDefaultFraming,
  framingStyle,
  newImgId
} from "./storage-lib.js";
import { imageStore } from "./image-store.js";
import { migrateShardsToStore, isHttpSrc, blobToDataURL } from "./image-migrate.js";





/* ─────────────────────────────────────────────────────────
   MG GUNPLA 図鑑・蒐集帖 v2
   ・収録254件(一般販売 No.001–223 + Ver.Ka 01–30、MGEX含む)
   ・資料整理自公開型錄資訊(発売年月・税込価格・原作)
   ・所有欄位可編輯(以覆寫方式保存)、可新增機體、可上傳圖像
   ───────────────────────────────────────────────────────── */

if (typeof window !== "undefined" && !window.__mgErrHook) {
  window.__mgErrHook = true;
  let el = null, hideTimer = null;
  window.addEventListener("error", (ev) => {
    try {
      if (!ev.message || (/^Script error\.?$/i.test(ev.message) && !ev.filename)) return;
      if (!el) {
        el = document.createElement("pre");
        el.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:#5a1410;color:#fff;padding:10px 12px;border-radius:var(--r-md);font-size:11px;line-height:1.5;white-space:pre-wrap;max-height:42vh;overflow:auto;cursor:pointer";
        el.addEventListener("click", () => { if (el) { el.remove(); el = null; } });
        document.body.appendChild(el);
      }
      // 積み重ねず最新の1件だけを表示。8秒で自動的に消す。
      el.textContent = "⚠ " + ev.message + "\n" + (ev.filename || "") + ":" + (ev.lineno || 0) + "\n(タップで閉じる)";
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { if (el) { el.remove(); el = null; } }, 8000);
    } catch (e) {}
  });
}

/* ── Web フォントを非ブロッキングで注入(旧 @import の置換)──
   media="print"→onload で "all" に切替える定石。CDN 失敗(オフライン等)は
   onerror で握り潰し、CSS のフォールバック書体に委ねる。@import と違い
   初回ペイントを止めない。 */
if (typeof document !== "undefined" && typeof window !== "undefined" && !window.__mgFonts) {
  window.__mgFonts = true;
  try {
    const PRECONN = ["https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"];
    PRECONN.forEach((href) => {
      const l = document.createElement("link");
      l.rel = "preconnect"; l.href = href; l.crossOrigin = "";
      document.head.appendChild(l);
    });
    const FONTS = [
      "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Lugrasimo&display=swap",
      "https://fonts.googleapis.com/css2?family=STIX+Two+Math&display=swap",
      "https://cdn.jsdelivr.net/npm/lxgw-wenkai-tc-webfont/style.css",
      "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont/style.css",
    ];
    FONTS.forEach((href) => {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = href; l.media = "print";
      l.onload = function () { this.media = "all"; };
      l.onerror = function () { /* オフライン/CDN 不達:フォールバック書体に委ねる */ };
      document.head.appendChild(l);
    });
  } catch (e) {}
}

/* ── iOS 向け viewport 正規化 ──
   1) viewport-fit=cover を強制 → env(safe-area-inset-*) が 0 にならず、ノッチ/ホーム
      インジケータ回避(本アプリは safe-area を多用)。index.html に cover が無い場合の保険。
   2) maximum-scale=1 → 入力フォーカス時の iOS オートズーム(縮小されず版面がずれる不具合)を抑止。
      画像の拡大は本アプリ独自のピンチズームで担保済み。
   既存 content の他キーは保持し、上記2点のみ上書き/追加する。 */
if (typeof document !== "undefined" && typeof window !== "undefined" && !window.__mgViewport) {
  window.__mgViewport = true;
  try {
    let m = document.querySelector('meta[name="viewport"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "viewport"); document.head.appendChild(m); }
    const parts = new Map();
    (m.getAttribute("content") || "").split(",").forEach((p) => {
      const i = p.indexOf("=");
      const k = (i < 0 ? p : p.slice(0, i)).trim();
      const v = i < 0 ? "" : p.slice(i + 1).trim();
      if (k) parts.set(k, v);
    });
    if (!parts.has("width")) parts.set("width", "device-width");
    if (!parts.has("initial-scale")) parts.set("initial-scale", "1");
    parts.set("viewport-fit", "cover");
    parts.set("maximum-scale", "1");
    m.setAttribute("content", [...parts].map(([k, v]) => (v ? k + "=" + v : k)).join(", "));
  } catch (e) {}
}

/* ── 圖像不存在時的抽象簡筆畫(種子化變化) ── */
function MechSketch({ seedKey, owned, built, size = 84 }) {
  const h = hashId(seedKey);
  const antenna = h % 4, eye = (h >> 3) % 2, shoulder = (h >> 5) % 3, chest = (h >> 7) % 2;
  const stroke = owned ? "var(--ink-strong)" : "var(--ink-dim)";
  const acc = built ? "var(--teal)" : owned ? "var(--shu)" : "var(--ink-dim)";
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden="true">
      <g fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="40" y="14" width="20" height="16" rx="4" />
        {antenna === 0 && <path d="M44 14 L36 3 M56 14 L64 3" stroke={acc} />}
        {antenna === 1 && <path d="M50 14 L50 2" stroke={acc} />}
        {antenna === 2 && <path d="M44 14 L42 6 M56 14 L58 6" stroke={acc} />}
        {eye === 0 ? <line x1="44" y1="22" x2="56" y2="22" stroke={acc} strokeWidth="3" />
                   : <circle cx="50" cy="22" r="2.6" fill={acc} stroke="none" />}
        <path d="M42 32 H58 L62 50 H38 Z" />
        {chest === 0 ? <path d="M46 38 H54" /> : <path d="M50 36 L46 44 M50 36 L54 44" />}
        {shoulder === 0 && <><rect x="26" y="32" width="12" height="12" rx="2" /><rect x="62" y="32" width="12" height="12" rx="2" /></>}
        {shoulder === 1 && <><circle cx="32" cy="38" r="6.5" /><circle cx="68" cy="38" r="6.5" /></>}
        {shoulder === 2 && <><path d="M38 32 L26 36 L30 46 L38 44" /><path d="M62 32 L74 36 L70 46 L62 44" /></>}
        <path d="M31 45 L29 62 M69 45 L71 62" />
        <circle cx="29" cy="66" r="3.4" /><circle cx="71" cy="66" r="3.4" />
        <path d="M41 50 L40 58 H60 L59 50" />
        <path d="M44 58 L42 84 M56 58 L58 84" />
        <path d="M42 84 L36 88 H46 M58 84 L64 88 H54" />
        <path d="M40 58 L36 68 M60 58 L64 68" />
      </g>
    </svg>
  );
}



function CRTPlaceholder() {
  return (
    <div className="crt-ph" aria-hidden="true">
      <div className="crt-data">
        <div>UNIT&nbsp;&nbsp;: ////</div>
        <div>SPEC&nbsp;&nbsp;: ////</div>
        <div>CLASS&nbsp;: ////</div>
        <div>AFFIL&nbsp;: ////</div>
      </div>
      <svg className="crt-art" viewBox="0 0 220 200" preserveAspectRatio="xMidYMid meet">
        <g fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.4">
          <circle cx="110" cy="80" r="58" strokeDasharray="3 6" />
          <path d="M110 4 v12 M110 144 v12 M30 80 h12 M178 80 h12" />
        </g>
        <g transform="translate(50,16) scale(1.2)" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
          <rect x="40" y="14" width="20" height="16" rx="4" />
          <path d="M44 14 L36 3 M56 14 L64 3" />
          <line x1="44" y1="22" x2="56" y2="22" strokeWidth="2.4" />
          <path d="M42 32 H58 L62 50 H38 Z" /><path d="M46 38 H54" />
          <rect x="26" y="32" width="12" height="12" rx="2" /><rect x="62" y="32" width="12" height="12" rx="2" />
          <path d="M31 45 L29 62 M69 45 L71 62" />
          <circle cx="29" cy="66" r="3.4" /><circle cx="71" cy="66" r="3.4" />
          <path d="M41 50 L40 58 H60 L59 50" />
          <path d="M44 58 L42 84 M56 58 L58 84" />
          <path d="M42 84 L36 88 H46 M58 84 L64 88 H54" />
        </g>
        <g fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.55">
          <path d="M110 43 L148 36 L162 36" /><path d="M131 62 L150 54 L162 54" />
          <path d="M110 117 L148 126 L162 126" /><path d="M110 64 L74 74 L58 74" />
        </g>
        <g fill="currentColor" stroke="none" opacity="0.7">
          <circle cx="110" cy="43" r="1.3" /><circle cx="131" cy="62" r="1.3" />
          <circle cx="110" cy="117" r="1.3" /><circle cx="110" cy="64" r="1.3" />
        </g>
        <g className="crt-clabel" fill="currentColor" stroke="none" fontSize="6" fontFamily="ui-monospace, monospace" opacity="0.85">
          <text x="165" y="38">SENSOR</text>
          <text x="165" y="56">THRUSTER</text>
          <text x="165" y="128">ACTUATOR</text>
          <text x="55" y="77" textAnchor="end">ENERGY CORE</text>
        </g>
      </svg>
      <div className="crt-label">UNIDENTIFIED</div>
    </div>
  );
}

/* 機体名の折返し(列表・詳細共通):
   標準的な日本語の行分割に委ねる。CSS 側で
   ・word-break:normal — CJK は字単位で折返し可(日本語では普通の挙動)
   ・line-break:strict — 禁則処理(開き括弧の直後・閉じ括弧の直前で切らない、
     小書き仮名 ァィゥ… や 長音 ー、句読点 。、 を行頭に置かない)
   ・overflow-wrap:break-word — 長い英数字トークンの保険
   を指定する(.kn 参照)。
   これにより——
   ・「(注釈)」が行幅を超えても括弧群の内部で綺麗に折返す(孤立括弧なし)
   ・連続括弧 (A)(B)(C)、入れ子括弧『…』、本体＋括弧＋後続テキストも崩れない
   ——を満たす。keep-all で括弧群を不可分にしていた旧実装は、群単体が
   1行幅を超えると緊急折返しで崩れていたため撤廃。 */
function KitName({ name }) {
  return <span className="kn">{name}</span>;
}

/* 名称枠(固定高さ)に対しフォントを自動配適: 短名は大きく・長名は縮小(截断なし)。卡片高さは揃う */
function FitName({ name, max, min = 12 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const span = ref.current;
    if (!span) return;
    const box = span.parentElement;
    if (!box) return;
    const fit = () => {
      const bh = box.clientHeight;
      if (!bh) return;
      let lo = min, hi = max, best = min;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        span.style.fontSize = mid + "px";
        if (span.scrollHeight <= bh) { best = mid; lo = mid + 1; } else hi = mid - 1;
      }
      span.style.fontSize = best + "px";
    };
    fit();
    let raf = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fit); });
    ro.observe(box);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [name, max, min]);
  return <span ref={ref} className="sl-name-fit" style={{ fontSize: max }}>{name}</span>;
}


function GradeBracket({ grade }) {
  const g = (grade || "MG").toUpperCase();
  const cls = { MG: "mg", HG: "hg", RG: "rg", PG: "pg", HIRM: "hirm", RE: "re", FM: "fm", MGSD: "sd", EXTRA: "ex" }[g] || "ex";
  return <span className={`tc-grade-tx g-${cls}`}>【{g}】</span>;
}

function KitImage({ kit, img, owned, built, size = 84, cls = "", frame }) {
  if (img) {
    if (frame) return (
      <span className={`kit-img ${cls} framed`}>
        <img src={img} alt={kit.name} className="kit-img-inner" style={frame} loading="lazy" decoding="async" />
      </span>
    );
    return <img src={img} alt={kit.name} className={`kit-img ${cls}`} loading="lazy" decoding="async" />;
  }
  if (cls.indexOf("tc") !== -1) return <CRTPlaceholder />;
  return <SeriesWatermark kit={kit} variant={cls.indexOf("sm") !== -1 ? "list" : "grid"} size={size} />;
}

/* 指でのピンチズーム/パン。画像にのみ適用。タップ(移動なし)で onTap を発火。
   Pointer Events で実装(iOS Safari 対応)。touch-action:none で既定のスクロールを抑止。 */



function GradeChip({ grade }) {
  const g = (grade || "MG").toUpperCase();
  const cls = { MG: "mg", HG: "hg", RG: "rg", PG: "pg", HIRM: "hirm", RE: "re", FM: "fm", MGSD: "sd", EXTRA: "ex" }[g] || "ex";
  return <span className={`grade-chip g-${cls}`}>{g}</span>;
}

/* ── 印章:入手=朱「済」/完成=青磁「済」,兩者並存時朱在前、青磁右下偏移 ── */
function StampSet({ owned, built }) {
  if (!owned && !built) return null;
  return (
    <span className="stamp-set">
      {built && <i className={`stamp teal ${owned ? "back" : ""}`}>済</i>}
      {owned && <i className="stamp shu">済</i>}
    </span>
  );
}

const fmtDate = (d) => (d ? d.replaceAll("-", ".") : "—");
const fmtYen = (n) => (n ? "¥" + Number(n).toLocaleString("ja-JP") : "—");
const yearOf = (ym) => (ym || "").slice(0, 4) || "----";



/* ── ガンプラ歴:開始日→「X年Yヶ月Z日」 ── */
function careerStr(since) {
  if (!since) return "—";
  const s = new Date(since), n = new Date();
  if (isNaN(s.getTime()) || s > n) return "—";
  let y = n.getFullYear() - s.getFullYear();
  let m = n.getMonth() - s.getMonth();
  let d = n.getDate() - s.getDate();
  if (d < 0) { m -= 1; d += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); }
  if (m < 0) { y -= 1; m += 12; }
  return `${y}年${m}ヶ月${d}日`;
}






/* ── 機體編輯表單(新增/編輯共用) ── */
function Roll({ value, resetKey }) {
  const [disp, setDisp] = useState(0);
  const fromRef = useRef(0);
  const keyRef = useRef(resetKey);
  useEffect(() => {
    let from = fromRef.current;
    if (resetKey !== keyRef.current) { from = 0; keyRef.current = resetKey; }
    const to = value;
    if (from === to) { setDisp(to); fromRef.current = to; return; }
    let raf, start = null; const dur = 700;
    const tick = (t) => {
      if (start === null) start = t;
      const pr = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - pr, 3);
      setDisp(Math.round(from + (to - from) * e));
      if (pr < 1) raf = requestAnimationFrame(tick);
      else { fromRef.current = to; setDisp(to); }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); fromRef.current = to; };
  }, [value, resetKey]);
  return <>{disp}</>;
}

function TagField({ tags, onCommit, enterOnLongPress = false, onTagTap = null, L = (ja) => ja }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const lp = useRef({ timer: null, fired: false });
  const start = (e) => { if (e) e.stopPropagation(); setDraft(tags.join("; ")); setEditing(true); };
  const commit = () => {
    const next = [];
    for (const part of draft.split(/[;；]/)) {
      const t = part.trim();
      if (t && !next.includes(t)) next.push(t);
    }
    onCommit(next);
    setEditing(false);
  };
  if (editing) {
    return (
      <input className="kt-edit" autoFocus value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          else if (e.key === "Escape") { e.preventDefault(); setEditing(false); }
        }}
        placeholder={L("タグを半角「;」区切りで入力","Enter tags separated by ;","以半形「;」分隔輸入標籤")} />
    );
  }
  // 長按=編集モード(タグ自体は短タップで onTagTap へ。鉛筆/空欄タップでも編集へ)
  const beginLong = (e) => {
    if (e) e.stopPropagation();
    lp.current.fired = false;
    clearTimeout(lp.current.timer);
    lp.current.timer = setTimeout(() => { lp.current.fired = true; hapticStrong(); start(); }, 480);
  };
  const cancelLong = () => clearTimeout(lp.current.timer);
  const wrapProps = enterOnLongPress
    ? { className: "kt-field", onTouchStart: beginLong, onTouchEnd: cancelLong, onTouchMove: cancelLong,
        onMouseDown: beginLong, onMouseUp: cancelLong, onMouseLeave: cancelLong, onContextMenu: (e) => e.preventDefault() }
    : { className: "kt-field", role: "button", tabIndex: 0, onClick: start,
        onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); } } };
  const tapTag = (t) => (e) => {
    if (e) e.stopPropagation();
    if (lp.current.fired) { lp.current.fired = false; return; } // 長按誤発を無視
    if (onTagTap) onTagTap(t);
  };
  return (
    <span {...wrapProps}>
      {tags.length
        ? tags.map((t) => (
            <span key={t} className={"dc-tag" + (enterOnLongPress && onTagTap ? " tap" : "")}
              {...(enterOnLongPress && onTagTap ? { role: "button", onClick: tapTag(t) } : {})}>{t}</span>
          ))
        : <span className="kt-empty" onClick={enterOnLongPress ? start : undefined}>{L("タグを追加…","Add tag…","新增標籤…")}</span>}
      <i className="kt-pen" aria-hidden="true" onClick={enterOnLongPress ? start : undefined}>✎</i>
    </span>
  );
}

function NoteField({ note, onCommit, enterOnLongPress = false, L = (ja) => ja }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const lp = useRef({ timer: null, fired: false });
  const start = (e) => { if (e) e.stopPropagation(); setDraft(note || ""); setEditing(true); };
  const commit = () => { onCommit(draft.trim()); setEditing(false); };
  if (editing) {
    return (
      <textarea className="dc-memo-edit" autoFocus rows={2} value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setEditing(false); } }}
        placeholder={L("改修予定、塗装レシピ、保管場所など","build plans, paint recipe, storage…","改修計畫、塗裝配方、保管位置等")} />
    );
  }
  const beginLong = (e) => {
    if (e) e.stopPropagation();
    lp.current.fired = false;
    clearTimeout(lp.current.timer);
    lp.current.timer = setTimeout(() => { lp.current.fired = true; hapticStrong(); start(); }, 480);
  };
  const cancelLong = () => clearTimeout(lp.current.timer);
  const props = enterOnLongPress
    ? { className: "dc-memo", onTouchStart: beginLong, onTouchEnd: cancelLong, onTouchMove: cancelLong,
        onMouseDown: beginLong, onMouseUp: cancelLong, onMouseLeave: cancelLong, onContextMenu: (e) => e.preventDefault() }
    : { className: "dc-memo", role: "button", tabIndex: 0, onClick: start,
        onKeyDown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); } } };
  return (
    <span {...props}>
      {note ? note : <span className="kt-empty">{L("メモを追加…","Add memo…","新增備註…")}</span>}
    </span>
  );
}



function KitForm({ initial, currentImg, onSave, onCancel, onDelete, isCustom, seriesOptions = [], ai, recInitial = null, onSaveRec,
  album, onAddImage, onRemoveImage, onSetRole, onFrame, onEditImages, thumbRef, acqRef, maxImgs = 6, tags = [], onTags = null, L = (ja) => ja }) {
  const albumMode = typeof onAddImage === "function";
  const [f, setF] = useState({
    name: initial.name || "", code: initial.code || "", ym: initial.ym || "",
    price: initial.price || "", series: initial.series || "", note: initial.note || "", premium: !!initial.premium, grade: initial.grade || "MG",
  });
  const [tagsLocal, setTagsLocal] = useState(tags);
  const commitTags = (next) => { setTagsLocal(next); if (onTags) onTags(next); }; // 既存機体は即時書込、新規は保存時に適用
  const [dates, setDates] = useState({ purchaseDate: (recInitial && recInitial.purchaseDate) || "", buildDate: (recInitial && recInitial.buildDate) || "" });
  const [imgVal, setImgVal] = useState(undefined); // undefined=不變 null=刪除 string=新圖(新規機体用)
  const [urlInput, setUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSrc, setAiSrc] = useState(null);  // AI変換の元画像(アルバム時)
  const [sel, setSel] = useState(null);       // 選択中のアルバム画像 ref
  const [pendingMeta, setPendingMeta] = useState(null); // 新規primary画像の由来メタ(AI生成時など)
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const previewImg = imgVal === undefined ? currentImg : imgVal;
  const atCap = albumMode && (album || []).length >= maxImgs;
  // 新画像を反映: アルバム時は追加、新規機体時は単一スロットへ
  const applyNewImage = (src, meta) => { if (!src) return; if (albumMode) onAddImage(src, meta); else { setImgVal(src); setPendingMeta(meta || null); } };

  const pickFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      const raw = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result); r.onerror = rej;
        r.readAsDataURL(file);
      });
      setCropSrc(raw);
    } catch (err) { console.error(err); notify(L("画像の読み込みに失敗しました", "Failed to load the image", "圖片載入失敗"), { kind: "err" }); }
    setBusy(false);
    e.target.value = "";
  };

  return (
    <div className="form">
      {!albumMode && (
        <>
          <div className="f-sec">{L("画像", "Image", "圖片")}<span>IMAGES</span></div>
          <div className="form-img-row">
            <div className="form-img-box">
              {previewImg
                ? <img src={previewImg} alt="" className="kit-img big" />
                : <MechSketch seedKey={initial.id || f.name || "new"} owned built={false} size={72} />}
            </div>
            <div className="form-img-btns">
              <button className="mini-btn" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}>
                {busy ? L("読込中…", "Loading…", "載入中…") : L("画像をアップロード", "Upload image", "上傳圖片")}
              </button>
              <div className="url-row">
                <input placeholder={L("または画像URLを貼り付け", "or paste an image URL", "或貼上圖片網址")} value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                <button className="mini-btn" onClick={() => { if (urlInput.trim()) { setImgVal(urlInput.trim()); setUrlInput(""); } }}>{L("適用", "Apply", "套用")}</button>
              </div>
              <button className="mini-btn ai" onClick={() => {
                if (!previewImg) { notify(L("先に画像を設定してください", "Set an image first", "請先設定圖片"), { kind: "warn" }); return; }
                if (!aiAvailable(ai)) { notify(aiProviderLabel(ai && ai.model) + L(" のAPIキーを設定タブで入力してください", " API key is required — add it in Settings", " 的 API 金鑰請至設定填入"), { kind: "warn", dur: 3200 }); return; }
                setAiOpen(true);
              }}>{L("✨ AIスタイル変換", "✨ AI restyle", "✨ AI 風格轉換")}</button>
              {previewImg && <button className="mini-btn" onClick={() => setCropSrc(previewImg)}>{L("✂ 切り抜き", "✂ Crop", "✂ 裁切")}</button>}
              {previewImg && <button className="mini-btn ghost" onClick={() => setImgVal(null)}>{L("画像を削除(スケッチに戻す)", "Remove image (back to sketch)", "刪除圖片(回到草圖)")}</button>}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pickFile} />
            </div>
          </div>
        </>
      )}

      <div className="fld-row name-row">
        <label className="fld grow2"><span>{L("機体名 *", "Name *", "機體名 *")}</span><input value={f.name} onChange={set("name")} placeholder={L("例: νガンダム Ver.Ka", "e.g. ν Gundam Ver.Ka", "例: ν鋼彈 Ver.Ka")} /></label>
        <label className="fld"><span>Grade</span>
          <Picker value={f.grade} onChange={(v) => set("grade")({ target: { value: v } })} options={[["MG", "MG"], ["HG", "HG"], ["RG", "RG"], ["MGSD", "MGSD"], ["EXTRA", "EXTRA"]]} />
        </label>
      </div>
      <label className="fld"><span>{L("原作", "Series", "原作")}</span>
        <input list="series-options" value={f.series} onChange={set("series")} placeholder={L("入力または一覧から選択", "type or pick from the list", "輸入或從清單選擇")} />
        <datalist id="series-options">{seriesOptions.map((s) => <option key={s} value={s} />)}</datalist>
      </label>
      <div className="fld-row">
        <label className="fld"><span>{L("型式番号", "Model code", "型式番號")}</span><input value={f.code} onChange={set("code")} placeholder="RX-93" /></label>
        <label className="fld"><span>{L("発売年月", "Release", "發售年月")}</span><DateSetField mode="month" value={f.ym} ph={L("タップで選択", "Tap to set", "點擊選擇")} clearLabel={L("クリア", "Clear", "清除")} onPick={(v) => set("ym")({ target: { value: v } })} /></label>
      </div>
      <div className="fld-row">
        <label className="fld"><span>{L("定価(円・税込)", "Price (JPY, incl. tax)", "定價(日圓・含稅)")}</span><input type="number" value={f.price} onChange={set("price")} placeholder="7700" /></label>
        <div className="fld"><span>{L("限定", "Limited", "限定")}</span>
          <button type="button" className={`prem-toggle ${f.premium ? "on" : ""}`}
            onClick={() => setF((s) => ({ ...s, premium: !s.premium }))}>
            <i>{f.premium ? "✓" : ""}</i> {L("プレバン限定", "P-Bandai", "魂商店限定")}
          </button>
        </div>
      </div>
      <div className="form-dates">
        <div className="fld"><span>{L("入手日", "Acquired date", "入手日")}</span>
          <DateSetField value={dates.purchaseDate} ph={L("タップで選択", "Tap to set", "點擊選擇")} clearLabel={L("クリア", "Clear", "清除")} onPick={(v) => setDates((d) => ({ ...d, purchaseDate: v }))} />
        </div>
        <div className="fld"><span>{L("制作完了日", "Completion date", "完成日")}</span>
          <DateSetField value={dates.buildDate} ph={L("タップで選択", "Tap to set", "點擊選擇")} clearLabel={L("クリア", "Clear", "清除")} onPick={(v) => setDates((d) => ({ ...d, buildDate: v }))} />
        </div>
      </div>
      <label className="fld"><span>{L("メモ", "Memo", "備註")}</span><textarea rows={2} value={f.note} onChange={set("note")} placeholder={L("改修予定、塗装レシピ、保管場所など", "build plans, paint recipe, storage…", "改修計畫、塗裝配方、保管位置等")} /></label>
      <div className="fld"><span>{L("タグ", "Tags", "標籤")}</span>
        <div className="form-tagfield"><TagField tags={tagsLocal} onCommit={commitTags} L={L} /></div>
      </div>

      <div className="form-actions">
        <button className="btn primary" disabled={!f.name.trim()}
          onClick={() => { if (onSaveRec) onSaveRec(dates); onSave({ ...f, price: f.price ? Number(f.price) : "" }, imgVal, pendingMeta, tagsLocal); }}>{L("保存", "Save", "儲存")}</button>
        <button className="btn" onClick={onCancel}>{L("やめる", "Cancel", "取消")}</button>
        {isCustom && onDelete && <button className="btn danger" onClick={async () => { if (await appConfirm(L("この機体を完全に削除します。記録・画像も消え、元に戻せません。", "Delete this kit permanently. Its records and images will be erased and cannot be recovered.", "將永久刪除此機體，收藏紀錄與圖片一併清除，無法復原。"), { title: L("機体を削除", "Delete kit", "刪除機體"), okText: L("削除する", "Delete", "刪除"), cancelText: L("やめる", "Cancel", "取消"), danger: true })) onDelete(); }}>{L("この機体を削除", "Delete this kit", "刪除此機體")}</button>}
      </div>
      {cropSrc && <CropModal src={cropSrc} onCancel={() => setCropSrc(null)} L={L}
        onDone={(out) => { applyNewImage(out); setCropSrc(null); }} />}
      {aiOpen && (albumMode ? aiSrc : previewImg) && (
        <AIRestyleModal src={albumMode ? aiSrc : previewImg} geminiKey={ai && ai.geminiKey} openaiKey={ai && ai.openaiKey} proxy={ai && ai.proxy} model={(ai && ai.model) || "gemini-3-pro-image"}
          prompts={ai && ai.prompts} lastStyle={ai && ai.style} onModel={ai && ai.onModel} onStyle={ai && ai.onStyle} L={L}
          onAdopt={(out, meta) => { applyNewImage(out, meta); setAiOpen(false); }}
          onClose={() => setAiOpen(false)} />
      )}
    </div>
  );
}

const PALETTE = ["var(--pal-1)", "var(--pal-2)", "var(--pal-3)", "var(--pal-4)", "var(--pal-5)", "var(--pal-6)", "var(--pal-7)", "var(--pal-8)", "var(--pal-9)"];

function Pie({ data, size = 150, center }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;
  let acc = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {data.map((d, i) => {
        if (d.value === total) return <circle key={i} cx={cx} cy={cy} r={r} fill={d.color} />;
        const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2;
        acc += d.value;
        const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        return <path key={i} d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`}
          fill={d.color} stroke="var(--bg2)" strokeWidth="1.5" />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.52} fill="var(--bg2)" />
      {center && <text x={cx} y={cy + 5} textAnchor="middle" className="pie-center">{center}</text>}
    </svg>
  );
}

function LineChart({ years, series }) {
  const W = 680, H = 180, padL = 30, padR = 10, padT = 12, padB = 24;
  const maxV = Math.max(1, ...series.flatMap((s) => s.points));
  const x = (i) => padL + (i / Math.max(1, years.length - 1)) * (W - padL - padR);
  const y = (v) => padT + (1 - v / maxV) * (H - padT - padB);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="line-chart">
      {[0, 0.5, 1].map((t) => (
        <line key={t} x1={padL} x2={W - padR} y1={y(maxV * t)} y2={y(maxV * t)}
          stroke="var(--line-soft)" strokeWidth="1" />
      ))}
      <text x={padL - 6} y={y(maxV) + 4} textAnchor="end" className="lc-lbl">{maxV}</text>
      <text x={padL - 6} y={y(0) + 4} textAnchor="end" className="lc-lbl">0</text>
      {years.map((yr, i) => (Number(yr) % 5 === 0
        ? <text key={yr} x={x(i)} y={H - 6} textAnchor="middle" className="lc-lbl">{yr}</text> : null))}
      {series.map((s) => (
        <polyline key={s.label}
          points={s.points.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          fill="none" stroke={s.color} strokeWidth="2.4"
          strokeLinejoin="round" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/* 年代選択用の年リスト(降順) */
const YEARS = Array.from({ length: 2027 - 1990 + 1 }, (_, i) => 2027 - i);

/* 作品ピッカー:検索付きの一覧から選ぶ。Appの外で定義し再生成を防ぐ(入力フォーカスが飛ばない) */
function SeriesPicker({ open, value, options, onPick, onClose, L = (ja) => ja }) {
  const [q, setQ] = useState("");
  useEffect(() => { if (open) setQ(""); }, [open]);
  if (!open) return null;
  const ql = q.trim().toLowerCase();
  const filtered = ql ? options.filter((s) => s.toLowerCase().includes(ql)) : options;
  return (
    <div className="modal-bg sp-bg" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-head">
          <input className="sp-search" autoFocus placeholder={L("作品名で絞り込み","Filter by series","以作品名篩選")} value={q}
            onChange={(e) => setQ(e.target.value)} />
          <button className="modal-x static" onClick={onClose}>✕</button>
        </div>
        <div className="sp-list">
          <button className={"sp-item" + (value === "" ? " on" : "")} onClick={() => onPick("")}>{L("すべての作品","All series","所有作品")}</button>
          {filtered.map((s) => (
            <button key={s} className={"sp-item" + (value === s ? " on" : "")} onClick={() => onPick(s)}>{s}</button>
          ))}
          {filtered.length === 0 && <div className="sp-empty">{L("該当する作品がありません","No matching series","沒有符合的作品")}</div>}
        </div>
      </div>
    </div>
  );
}

/* 世界観ピッカー(数が少ないため検索欄なし・純リスト直選)。options は [value,label] の配列。 */
function UniPicker({ open, value, options, onPick, onClose, L = (ja) => ja }) {
  if (!open) return null;
  return (
    <div className="modal-bg sp-bg" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-head sp-head-plain">
          <span className="sp-title">{L("世界観","Universe","世界觀")}</span>
          <button className="modal-x static" onClick={onClose}>✕</button>
        </div>
        <div className="sp-list">
          <button className={"sp-item" + (value === "" ? " on" : "")} onClick={() => onPick("")}>{L("すべての世界観","All universes","所有世界觀")}</button>
          {options.map(([u, l]) => (
            <button key={u} className={"sp-item" + (value === u ? " on" : "")} onClick={() => onPick(u)}>{l}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 表頭標題:表裏切換アニメ(A翻面/B捲軸/C滑移)。alt=配對名(暗示)。
   ※ App 内に定義すると毎レンダーで identity が変わり remount→アニメ再生してしまう
     (起動時の多段ロードで2〜3回跳ねる原因)。純粋なので module scope に固定。 */
function LedgerTitle({ scheme, title, alt, akey, dir }) {
  const sv = scheme === "flip" ? {} : scheme === "roll" ? { "--fromY": dir >= 0 ? "100%" : "-100%" } : { "--fromX": dir >= 0 ? "14px" : "-14px" };
  return (
    <span className={"lt lt-" + scheme}>
      <span className="lt-win"><span key={akey} className="sb-title lt-cur" style={sv}>{title}</span></span>
      {alt ? <span className="lt-alt"><span className="lt-x">⇄</span>{alt}</span> : null}
    </span>
  );
}

const EMPTY_ADV = { series: "", uni: "", prem: "", stat: "", yFrom: "", yTo: "", tag: "" };
const SORT_ICON = { purchase: "入", year: "販", name: "名", build: "完", price: "価" };
const SORT_MENU = ["purchase", "year", "name", "build", "price"];

function App() {
  const [tab, setTab] = useState("zukan");
  const [records, setRecords] = useState({});
  const [kitTags, setKitTags] = useState({});
  const [serifs, setSerifs] = useState({}); // {imgRef: "台詞"} 画像鑑賞のセリフ
  const [serifEdit, setSerifEdit] = useState(null); // {ref, text} | null
  const [tagInput, setTagInput] = useState("");
  const [overrides, setOverrides] = useState({});
  const [customKits, setCustomKits] = useState([]);
  const [images, setImages] = useState({});
  const [extras, setExtras] = useState({});       // 追加画像 {xid: src}
  const [albumMeta, setAlbumMeta] = useState({});  // {kitId:{order,thumb,acquire,framing}}
  const [settings, setSettings] = useState({ view: "list", compact: false, dimUnowned: true, showCode: false, showSeries: false, showPrice: false, showNo: false, showGrade: false, showYm: false, salonCols: 2, salonFit: "cover", listGrade: true, listTags: true, listSeries: false, listNo: true, listCode: true, listPrice: true, listPurchase: false, listBuild: false, theme: "dark", tabPad: "min", haptic: true, hfPin: false, crtScan: true, vfFilter: true, lang: "ja", builderName: "", builderSince: "", supaUrl: "", supaKey: "", catalogUrl: "", geminiKey: "", openaiKey: "", aiProxyUrl: "", aiProxyToken: "", geminiModel: "gemini-3-pro-image", aiStyle: "ukiyoe" });
  // 設定の書込みは patchSettings 経由でフィールド級に時戳付け(records と同じ stamped LWW)。
  // patch はオブジェクト、または現在値を読むトグル用に (s) => patch の関数も可。
  // 変更したフィールドだけ時戳が進むため、別端末が別フィールドを変えても互いに潰さない。
  const patchSettings = useCallback(
    (patch) => setSettings((s) => stampRec(s, typeof patch === "function" ? patch(s) : patch, new Date().toISOString())),
    []);
  // 設定のフィールド級マージ。秘密鍵(API キー/Supabase 認証)は端末ローカル専用で
  // クラウドへ値を出さない。古い _ts だけが残ると、値 undefined で「勝って」しまい
  // ローカルの鍵を消す恐れがあるため、incoming 側の秘密フィールドを時戳ごと除外する。
  const mergeSettings = useCallback((local, incoming) => {
    if (!incoming) return local;
    const inc = { ...incoming };
    const ts = inc._ts ? { ...inc._ts } : null;
    for (const k of secretFieldList()) { delete inc[k]; if (ts) delete ts[k]; }
    if (ts) inc._ts = ts;
    return mergeRec(local, inc);
  }, []);
  // 既定画像モデルをNano Banana Proへ一度だけ移行(旧既定flash-imageのみ。明示選択は尊重)
  useEffect(() => {
    if (settings.geminiModel === "gemini-2.5-flash-image" && !settings._mdef3) {
      setSettings((s) => ({ ...s, geminiModel: "gemini-3-pro-image", _mdef3: true }));
    }
  }, [settings.geminiModel, settings._mdef3]);
  const lang = settings.lang || "ja";
  const L = (ja, en, zh) => (lang === "en" ? (en ?? ja) : lang === "zh" ? (zh ?? ja) : ja);
  // 称号の名称・説明を言語別オーバーレイから取得(未訳は原文へフォールバック)
  const achName = (t) => { const o = t && ACH_I18N[t.id]; return (o && o[lang] && o[lang].name) || (t && t.name); };
  const achSub = (t) => { const o = t && ACH_I18N[t.id]; return (o && o[lang] && o[lang].sub) || (t && t.sub); };
  const [sortKeyMap, setSortKeyMap] = useState({ zukan: "year", gallery: "year" });
  const [sortDirMap, setSortDirMap] = useState({ zukan: "asc", gallery: "asc" });
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [advMap, setAdvMap] = useState({ zukan: EMPTY_ADV, gallery: EMPTY_ADV }); // 図鑑/画廊で独立した絞り込み
  const advTab = tab === "gallery" ? "gallery" : "zukan";
  const adv = advMap[advTab];
  const sortKey = sortKeyMap[advTab];
  const sortDir = sortDirMap[advTab];
  const setSortKey = (v) => setSortKeyMap((m) => ({ ...m, [advTab]: typeof v === "function" ? v(m[advTab]) : v }));
  const setSortDir = (v) => setSortDirMap((m) => ({ ...m, [advTab]: typeof v === "function" ? v(m[advTab]) : v }));
  const setAdv = (updater) =>
    setAdvMap((m) => ({ ...m, [advTab]: typeof updater === "function" ? updater(m[advTab]) : updater }));
  const [queries, setQueries] = useState({ zukan: "", gallery: "" });
  const query = queries[advTab];
  const gfStoreKey = tab === "gallery" ? "gfGallery" : "gfZukan";
  // グレード絞り込みは複数選択(配列)。旧データの単一文字列も [str] へ正規化して相容。
  const gfList = useMemo(() => {
    const raw = settings[gfStoreKey];
    const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return arr.map((g) => String(g).toUpperCase()).filter(Boolean);
  }, [settings, gfStoreKey]);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [pillOpen, setPillOpen] = useState(false);
  const [doneIntent, setDoneIntent] = useState(false);
  useEffect(() => { setPillOpen(false); setDoneIntent(false); }, [detail]);
  const [adding, setAdding] = useState(false);
  const [seriesPickerOpen, setSeriesPickerOpen] = useState(false);
  const [viewer, setViewer] = useState(null); // 画像鑑賞: {kitId, idx} | null
  const [viewerDel, setViewerDel] = useState(false); // 鑑賞内の削除確認
  const [frameEdit, setFrameEdit] = useState(null); // 構図調整: {kitId, ref} | null
  const [imgEdit, setImgEdit] = useState(null); // 画像編集ウィンドウ対象 kitId | null
  const [ownConfirm, setOwnConfirm] = useState(null); // 入手取消確認 kit
  const [loaded, setLoaded] = useState(false);
  // 初回起動のみ:ブラウザ言語から日/英/中を自動選択(以後はユーザー設定を尊重)
  useEffect(() => {
    if (!loaded || settings._langInit) return;
    const nl = (navigator.language || "ja").toLowerCase();
    const detected = nl.startsWith("zh") ? "zh" : nl.startsWith("en") ? "en" : "ja";
    patchSettings(detected !== (settings.lang || "ja") ? { lang: detected, _langInit: true } : { _langInit: true });
  }, [loaded, settings._langInit]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [dispTarget, setDispTarget] = useState("list");
  // 設定頁:折りたたみ区画の開閉。既定でプロフィール/外観/表示のみ展開。
  const [openSec, setOpenSec] = useState({ profile: true, look: true, disp: true, ai: false, cloud: false, data: false, danger: false, feedback: false });
  const toggleSec = (k) => { haptic(); setOpenSec((s) => ({ ...s, [k]: !s[k] })); };
  const [promptEdit, setPromptEdit] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [uniPickerOpen, setUniPickerOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [identifyOpen, setIdentifyOpen] = useState(false);
  const [identifyCam, setIdentifyCam] = useState(false);
  const [achvSeen, setAchvSeen] = useState(null);
  const [achvPop, setAchvPop] = useState(null);
  const [titleUniverse, setTitleUniverse] = useState("all");
  const [segOpen, setSegOpen] = useState(false);
  const prevUnlockedRef = useRef(null);
  const [toastQueue, setToastQueue] = useState([]);
  const [toast, setToast] = useState(null);
  const [toastOut, setToastOut] = useState(false);
  const [titleDetail, setTitleDetail] = useState(null);
  const [titleReturn, setTitleReturn] = useState(null);
  /* ── 雲端 META の state 反映(use-sync の applyRow から使用) ── */
  const applyMeta = useCallback((raw) => {
    const d = migrateMeta(raw);
    if (!d || typeof d !== "object") return;
    if (d.records) setRecords((prev) => mergeRecMap(prev, d.records));
    if (d.overrides) setOverrides((prev) => mergeRecMap(prev, d.overrides));
    if (d.customKits) setCustomKits((prev) => mergeArrStamped(prev, d.customKits));
    if (d.kitTags) setKitTags((prev) => mergeRecMap(prev, d.kitTags));
    if (d.settings) setSettings((s) => mergeSettings(s, d.settings));
    if (d.sortKeyMap) setSortKeyMap((m) => ({ ...m, ...d.sortKeyMap }));
    else if (d.sortKey) setSortKeyMap({ zukan: d.sortKey, gallery: d.sortKey });
    if (d.sortDirMap) setSortDirMap((m) => ({ ...m, ...d.sortDirMap }));
    else if (d.sortDir) setSortDirMap({ zukan: d.sortDir, gallery: d.sortDir });
    if (d.achvSeen) setAchvSeen(d.achvSeen);
    // albumMeta は {kitId: record} 構造 → kit ごとにフィールド級 LWW(構図/縮圖/順序/imeta を各々時戳比較)。
    // 以前の {...prev,...incoming} は kit 単位の丸ごと上書きで、別端末の新しい編集を消し、削除済みの画像を復活させていた。
    if (d.albumMeta) setAlbumMeta((prev) => mergeRecMap(prev, d.albumMeta));
    // serifs は {ref: 台詞} のフラット map → 全体を1つの record とみなし、台詞ごとに時戳比較。
    if (d.serifs) setSerifs((prev) => mergeRec(prev, d.serifs));
  }, []);
  /* ── pullCloud の行別 state 反映(use-sync から委譲)。挙動は旧 dispatch と同一:
     解析失敗・未知キーは false(=スキップ、時戳を進めない)。 ── */
  const applyRow = useCallback((row) => {
    if (row.key === META_KEY) {
      try { applyMeta(JSON.parse(row.value)); } catch (e) { return false; }
      return true;
    }
    if (row.key.indexOf("mg_imgs_") === 0 || row.key.indexOf("mg_xtra_") === 0) {
      /* v3 端末からの分片行(互換 shim):追加のみ取込(削除は伝播させない=混版期の誤消去防止)。
         v3 の「分片全置換」意味論は捨てる:v4 端末の新画像を旧端末の無知が消すため。
         取込後、pullCloud が本地へ落とした分片行を掃除(起動遷移が後備網)。 */
      let m;
      try { m = JSON.parse(row.value); } catch (e) { return false; }
      (async () => {
        for (const [id, v] of Object.entries(m)) {
          if (typeof v !== "string") continue;
          if (isHttpSrc(v)) { setImages((p) => (p[id] ? p : { ...p, [id]: v })); continue; }
          if (v.indexOf("data:") !== 0) continue;
          try {
            if (await imageStore.has(id)) continue;
            await imageStore.putDataURL(id, v);
            const u = await imageStore.getThumbURL(id);
            if (!u) continue;
            if (id.indexOf("~") >= 0) setExtras((p) => ({ ...p, [id]: u }));
            else setImages((p) => ({ ...p, [id]: u }));
          } catch (e) { /* 個別失敗は次へ */ }
        }
        try { await window.storage.delete(row.key); } catch (e) {}
      })();
      return true;
    }
    if (row.key === "mg_imgurls") {
      // URL 画像行:URL 項目のみ行全置換(v3 分片と同じ置換意味論)。blob 由来項目は温存。
      try {
        const um = JSON.parse(row.value);
        setImages((prev) => {
          const next = {};
          for (const [k, v] of Object.entries(prev)) if (!isHttpSrc(v)) next[k] = v;
          return { ...next, ...um };
        });
      } catch (e) { return false; }
      return true;
    }
    if (row.key === SETTINGS_KEY) {
      try { setSettings((s) => mergeSettings(s, JSON.parse(row.value))); } catch (e) { return false; }
      return true;
    }
    if (row.key === ALBUM_KEY) {
      try { setAlbumMeta((prev) => mergeRecMap(prev, JSON.parse(row.value))); } catch (e) { return false; }
      return true;
    }
    if (row.key === SERIFS_KEY) {
      try { setSerifs((prev) => mergeRec(prev, JSON.parse(row.value))); } catch (e) { return false; }
      return true;
    }
    return false;
  }, [applyMeta, mergeSettings]);
  /* ── アカウント(託管バックエンド)。managedOn()=false の間は不活性 ── */
  const auth = useAuth();
  /* AI 代理の実効設定:手入力を優先し、ログイン中は託管 Worker+JWT で自動補完
     (=ログインすれば AI 代理トークンの手入力が不要)。 */
  const aiProxyCfg = {
    url: (settings.aiProxyUrl || "").trim() || (auth.session ? (MANAGED_BACKEND.workerUrl || "") : ""),
    token: (settings.aiProxyToken || "").trim() || (auth.session ? auth.session.access_token : ""),
  };
  const { syncMsg, setSyncMsg, storageErr, setStorageErr, supaRef,
          persist, saveKey, flushDirty, pullCloud, initFromStorage, markAllDirty } = useSync({ loaded, L, applyRow });
  const { catalog, catalogLog, catalogLogOpen, setCatalogLogOpen,
          refreshCatalog, initCatalogFromStorage } = useCatalog({ L, persist, catalogUrl: settings.catalogUrl });
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [setupMsg, setSetupMsg] = useState("");
  const [acctEmail, setAcctEmail] = useState("");   // アカウント(託管)ログイン UI
  const [acctCode, setAcctCode] = useState("");
  const [acctPhase, setAcctPhase] = useState("email"); // email → code
  const bodyRef = useRef(null);
  const [limit, setLimit] = useState(60);
  // 分頁切替時の体感カク付き対策(B-lite): 切替直後は少数だけ即描画 → 次フレームで満載まで補充。
  // 重い60格一括マウントを2段に割り、最初の paint を軽くして切替を即時に感じさせる。
  const FIRST_BATCH = 24;
  const [gridReady, setGridReady] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [manifestUrl, setManifestUrl] = useState("");   // 箱絵 manifest の公開URL
  const [imgBusy, setImgBusy] = useState(false);
  const [imgMsg, setImgMsg] = useState("");
  const localImgRef = useRef(null);                     // ローカル画像一括取り込み用
  const moreRef = useRef(null);
  const [honLimit, setHonLimit] = useState(60);   // 称号一覧の遅延ロード上限
  const honMoreRef = useRef(null);                // 称号のセンチネル(無限スクロール)
  const scrollPosRef = useRef({});
  const [hfHide, setHfHide] = useState(false); // 報頭收合(捲動駆動、V5浮遊)
  const [hfAnim, setHfAnim] = useState(false); // 頂端展開の柔和 transition スイッチ
  /* 分頁切換時保留各自捲動位置 */
  const changeTab = (next) => {
    const el = bodyRef.current;
    if (el) scrollPosRef.current[tab] = el.scrollTop;
    haptic(); // 分頁切換觸覺回饋
    setTab(next);
    const target = scrollPosRef.current[next] || 0;
    /* 內容(含懶載入清單)渲染撐高需數幀,連續嘗試還原避免被夾住 */
    let tries = 0;
    const restore = () => {
      const b = bodyRef.current;
      if (!b) return;
      b.scrollTop = target;
      if (Math.abs(b.scrollTop - target) > 2 && tries < 10) {
        tries++;
        requestAnimationFrame(restore);
      }
    };
    requestAnimationFrame(restore);
    hfNoAnimRef.current = Date.now() + 400; // 分頁切替は即時同期(展開アニメ抑制)
    onBodyScrollHf();
  };
  /* 捲動で報頭を running-head へ收合(V5)。ヒステリシス: >24px で收 / ≤8px で展。
     注意: アプリは起動画面(!loaded)を先に描画するため、mount時の useEffect で
     bodyRef に addEventListener すると main 不在で永久に張られない。
     → main の onScroll prop で張る(React が装着時機を保証)。 */
  const hfTickRef = useRef(false);
  const hfRef = useRef(null);      // .hf 要素へ --hfp を直書き(毎フレームの re-render を回避)
  const hfPRef = useRef(0);        // 現在の收合度 0..1
  const hfLastYRef = useRef(0);    // 方向判定用
  const hfNoAnimRef = useRef(0);   // この時刻まで展開アニメ抑制(分頁切替の即時同期)
  const hfAnimTRef = useRef(0);
  /* 方向感知棘輪:
     下捲 = 捲動に1:1連動して收合(跟手)。
     上捲 = 凍結(閲讀中に膨らんで内容を押し下げない)。頂端(y≤8)に達した時だけ
            柔らかい transition(.hf-anim)で展開。固定モード(hfPin)は收合後展開しない。 */
  const onBodyScrollHf = () => {
    if (hfTickRef.current) return;
    hfTickRef.current = true;
    requestAnimationFrame(() => {
      hfTickRef.current = false;
      const b = bodyRef.current;
      if (!b) return;
      const y = b.scrollTop;
      const room = b.scrollHeight - b.clientHeight; // 短頁では畳まない(クランプ振動防止)
      const goingDown = y > hfLastYRef.current;
      hfLastYRef.current = y;
      let p = hfPRef.current;
      if (room <= 160) p = 0;
      else if (goingDown) p = Math.max(p, Math.min(1, Math.max(0, (y - 6) / 110)));
      else if (y <= 8 && !(settings.hfPin && p >= 1)) p = 0;
      if (p !== hfPRef.current) {
        const expanding = p < hfPRef.current;
        hfPRef.current = p;
        if (hfRef.current) hfRef.current.style.setProperty("--hfp", p.toFixed(4));
        if (expanding && Date.now() > hfNoAnimRef.current) {
          setHfAnim(true);
          clearTimeout(hfAnimTRef.current);
          hfAnimTRef.current = setTimeout(() => setHfAnim(false), 480);
        }
      }
      setHfHide((h) => (h ? p > 0.35 : p > 0.6)); // 非レイアウト装飾(影/灯/字間)だけ閾値駆動
    });
  };
  const tabPtrRef = useRef(null); // 分頁の pointerdown 切替と click の二重発火防止
  const lpRef = useRef({ timer: null, fired: false });
  /* 長按手勢:回傳可展開到元素的 handlers。fired 時阻止後續 click。 */
  const makeLongPress = (onLong, ms = 480) => {
    const start = () => {
      lpRef.current.fired = false;
      clearTimeout(lpRef.current.timer);
      lpRef.current.timer = setTimeout(() => { lpRef.current.fired = true; onLong(); }, ms);
    };
    const cancel = () => clearTimeout(lpRef.current.timer);
    return {
      onTouchStart: start,
      onTouchEnd: cancel,
      onTouchMove: cancel,
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
      onContextMenu: (e) => e.preventDefault(),
    };
  };
  const consumeLP = () => { if (lpRef.current.fired) { lpRef.current.fired = false; return true; } return false; };
  /* 画像領域の長押し=工房(編集室)へ直行。stopPropagation で下層(カード/行)への伝播を止め、
     短タップのみカードの onClick(詳細表示)へ委ねる。 */
  const imgPress = (kitId, action) => {
    const lp = makeLongPress(() => { hapticStrong(); (action || (() => setImgEdit(kitId)))(); });
    return {
      onTouchStart: (e) => { e.stopPropagation(); lp.onTouchStart(); },
      onTouchEnd: lp.onTouchEnd,
      onTouchMove: lp.onTouchMove,
      onMouseDown: (e) => { e.stopPropagation(); lp.onMouseDown(); },
      onMouseUp: lp.onMouseUp,
      onMouseLeave: lp.onMouseLeave,
      onContextMenu: (e) => e.preventDefault(),
    };
  };

  /* ── 載入永續資料 ── */
  useEffect(() => {
    (async () => {
      let metaSettings = null;
      let metaEmpty = true;
      try {
        const r = await window.storage.get(META_KEY);
        if (r && r.value) {
          const d = migrateMeta(JSON.parse(r.value));
          metaEmpty =
            (!d.records || !Object.keys(d.records).length) &&
            (!d.overrides || !Object.keys(d.overrides).length) &&
            (!d.customKits || !d.customKits.length);
          if (d.records) setRecords(d.records);
          if (d.overrides) setOverrides(d.overrides);
          if (d.customKits) setCustomKits(d.customKits);
          if (d.settings) { setSettings((s) => ({ ...s, ...d.settings })); metaSettings = d.settings; }
          if (d.sortKeyMap) setSortKeyMap((m) => ({ ...m, ...d.sortKeyMap }));
          else if (d.sortKey) setSortKeyMap({ zukan: d.sortKey, gallery: d.sortKey });
          if (d.sortDirMap) setSortDirMap((m) => ({ ...m, ...d.sortDirMap }));
          else if (d.sortDir) setSortDirMap({ zukan: d.sortDir, gallery: d.sortDir });
          if (d.achvSeen) setAchvSeen(d.achvSeen);
          if (d.albumMeta) setAlbumMeta(d.albumMeta);
          if (d.serifs) setSerifs(d.serifs);
        }
      } catch (e) { /* 初次使用 */ }
      // 独立鍵を読み、旧 META 由来の値の上にフィールド級でマージ(独立鍵が新しい本地正本)。
      // settings は本地正本に秘密鍵を含むため mergeRec(剝離しない)で取り込む。初回更新後は
      // 独立鍵が無いので旧 META の値がそのまま残る。
      try {
        const sr = await window.storage.get(SETTINGS_KEY);
        if (sr && sr.value) { const sv = JSON.parse(sr.value); setSettings((s) => mergeRec(s, sv)); metaSettings = { ...(metaSettings || {}), ...sv }; }
      } catch (e) { /* 旧データ:独立鍵なし */ }
      try {
        const ar = await window.storage.get(ALBUM_KEY);
        if (ar && ar.value) setAlbumMeta((prev) => mergeRecMap(prev, JSON.parse(ar.value)));
      } catch (e) { /* 同上 */ }
      try {
        const fr = await window.storage.get(SERIFS_KEY);
        if (fr && fr.value) setSerifs((prev) => mergeRec(prev, JSON.parse(fr.value)));
      } catch (e) { /* 同上 */ }
      setAchvSeen((s) => (s === null ? {} : s));
      // LWW 時戳と未送信キューの復元(use-sync へ移設。位置・順序は移設前と同一)
      await initFromStorage();
      // 機体目錄キャッシュ+更新履歴の復元(use-catalog へ移設。位置・順序は移設前と同一)
      await initCatalogFromStorage();
      setLoaded(true); // UI 立即顯示,画像は背景で(v3→v4 遷移→)縮図 URL を構成して逐次反映
      (async () => {
        // v3→v4:分片(base64)→ image-store。冪等・分片単位確定、URL 項目は分流(image-migrate.js)。
        const mig = await migrateShardsToStore(window.storage, imageStore, { imgShards: IMG_SHARDS, xtraShards: XTRA_SHARDS });
        // URL 画像行(mg_imgurls):既存 + 遷移分を合流。遷移分があれば保存(同期にも乗る)。
        let urlMap = {};
        try { const ur = await window.storage.get("mg_imgurls"); if (ur && ur.value) urlMap = JSON.parse(ur.value); } catch (e) {}
        if (Object.keys(mig.urlRows).length) {
          urlMap = { ...urlMap, ...mig.urlRows };
          await saveKey("mg_imgurls", JSON.stringify(urlMap));
        }
        // 縮図 URL を一括構成。未派生分は背景派生後に追い差し(onLate)。
        const lateSet = (id, u) => { if (id.indexOf("~") >= 0) setExtras((p) => ({ ...p, [id]: u })); else setImages((p) => ({ ...p, [id]: u })); };
        const thumbs = await imageStore.allThumbURLs(lateSet);
        const imgs0 = {}, xtras0 = {};
        for (const [id, u] of Object.entries(thumbs)) { if (id.indexOf("~") >= 0) xtras0[id] = u; else imgs0[id] = u; }
        setImages((prev) => ({ ...imgs0, ...urlMap, ...prev }));
        setExtras((prev) => ({ ...xtras0, ...prev }));
        /* ▼診断用(3-4で除去)▼ */ console.info("[mg-zukan] img-mig: moved=" + mig.moved + " urls=" + Object.keys(mig.urlRows).length + " kept=" + mig.keptShards.join(",") + " thumbs=" + Object.keys(thumbs).length);
      })();
      // 託管建置(managedOn)では BYO 起動同期を行わない:
      //   残留した旧 supaUrl/supaKey が託管テーブルへ誤射する事故を防ぐ
      //  (on_conflict=key が (user_id,key) 主鍵と不一致 → 400 の実例あり)。
      //   初回同期はログイン確立時の account effect が担う。
      const su = managedOn() ? "" : ((metaSettings && metaSettings.supaUrl) || "").trim().replace(/\/+$/, "");
      const sk = managedOn() ? "" : ((metaSettings && metaSettings.supaKey) || "").trim();
      if (su && sk) {
        pullCloud({ url: su, key: sk })
          .then((nn) => {
            if (nn) setSyncMsg(L("起動時同期:受信 ","Synced on launch: ","啟動同步:收到 ") + nn + L(" 件 "," items "," 筆 ") + new Date().toLocaleTimeString());
            else if (metaEmpty && !managedOn()) setSetupOpen(true);
          })
          .catch(() => { if (metaEmpty && !managedOn()) setSetupOpen(true); });
      } else if (metaEmpty && !managedOn()) {
        setSetupOpen(true);
      }
      // 機体目錄:本地キャッシュで即描画済み。ここで背景刷新(失敗は無感)。
      // settings state はまだ反映前なので、直読みした metaSettings の URL を渡す。
      refreshCatalog((metaSettings && metaSettings.catalogUrl) || "");
    })();
  }, []);

  /* ── 保存中繼資料 ── */
  const latestMetaRef = useRef("");
  const latestSettingsRef = useRef("");
  const latestAlbumRef = useRef("");
  const latestSerifsRef = useRef("");
  // META 本体(settings / albumMeta / serifs は独立鍵へ分離したので含めない)
  useEffect(() => {
    if (!loaded) return;
    const payload = JSON.stringify({ schemaVersion: SCHEMA_VERSION, records, overrides, customKits, sortKey: sortKeyMap.zukan, sortDir: sortDirMap.zukan, sortKeyMap, sortDirMap, achvSeen, kitTags });
    latestMetaRef.current = payload; // 背景化/終了時に debounce を待たず即落とすための最新版
    const t = setTimeout(() => { saveKey(META_KEY, payload); }, 350);
    return () => clearTimeout(t);
  }, [records, overrides, customKits, sortKeyMap, sortDirMap, achvSeen, kitTags, loaded, saveKey]);
  // settings 独立鍵(秘密鍵は push 時に剝離)。設定変更で META 全体を再送しなくなる。
  useEffect(() => {
    if (!loaded) return;
    const payload = JSON.stringify(settings);
    latestSettingsRef.current = payload;
    const t = setTimeout(() => { saveKey(SETTINGS_KEY, payload); }, 350);
    return () => clearTimeout(t);
  }, [settings, loaded, saveKey]);
  // albumMeta 独立鍵
  useEffect(() => {
    if (!loaded) return;
    const payload = JSON.stringify(albumMeta);
    latestAlbumRef.current = payload;
    const t = setTimeout(() => { saveKey(ALBUM_KEY, payload); }, 350);
    return () => clearTimeout(t);
  }, [albumMeta, loaded, saveKey]);
  // serifs 独立鍵
  useEffect(() => {
    if (!loaded) return;
    const payload = JSON.stringify(serifs);
    latestSerifsRef.current = payload;
    const t = setTimeout(() => { saveKey(SERIFS_KEY, payload); }, 350);
    return () => clearTimeout(t);
  }, [serifs, loaded, saveKey]);

  /* ── 背景化/終了の直前に未保存の META を即時 flush(debounce 350ms の取りこぼし防止)──
     visibilitychange→hidden は freeze 前に発火するため非同期書き込みも概ね間に合う。
     pagehide も併せて捕捉。クラウド未送信分も同時に再送試行。 */
  useEffect(() => {
    if (!loaded) return;
    const doFlush = () => {
      if (latestMetaRef.current) saveKey(META_KEY, latestMetaRef.current);
      if (latestSettingsRef.current) saveKey(SETTINGS_KEY, latestSettingsRef.current);
      if (latestAlbumRef.current) saveKey(ALBUM_KEY, latestAlbumRef.current);
      if (latestSerifsRef.current) saveKey(SERIFS_KEY, latestSerifsRef.current);
      flushDirty();
    };
    const onVisHide = () => { if (document.visibilityState === "hidden") doFlush(); };
    document.addEventListener("visibilitychange", onVisHide);
    window.addEventListener("pagehide", doFlush);
    return () => {
      document.removeEventListener("visibilitychange", onVisHide);
      window.removeEventListener("pagehide", doFlush);
    };
  }, [loaded, saveKey, flushDirty]);

  useEffect(() => { setLimit(60); }, [gfList, sortKey, sortDir, settings.view]);
  // 切替直後は gridReady=false(少数描画)。2フレーム後に満載へ。クリーンアップで取り消し。
  useEffect(() => {
    setGridReady(false);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setGridReady(true)); });
    return () => { cancelAnimationFrame(r1); if (r2) cancelAnimationFrame(r2); };
  }, [tab]);
  const paintLimit = gridReady ? limit : Math.min(limit, FIRST_BATCH);

  useEffect(() => {
    if (managedOn() && auth.session) {
      // 託管モード:開発者管理の Supabase + RLS。accessToken が Bearer になる。
      supaRef.current = { url: MANAGED_BACKEND.url.replace(/\/+$/, ""), key: MANAGED_BACKEND.anonKey,
                          accessToken: auth.session.access_token, userId: "" };
    } else if (managedOn()) {
      // 託管建置・未ログイン:同期は完全停止(残留 BYO 憑證の誤射防止)
      supaRef.current = { url: "", key: "", userId: "" };
    } else {
      // 従来(BYO)モード:挙動不変
      supaRef.current = { url: (settings.supaUrl || "").trim().replace(/\/+$/, ""), key: (settings.supaKey || "").trim(), userId: (settings.userId || "") };
    }
  }, [settings.supaUrl, settings.supaKey, auth.session]);

  /* ── ログイン確立時の初回同期:雲端 pull(LWW)→ 本地全量を dirty 化 → push。
     セッション毎に一度。ログアウトでリセット。 ── */
  const managedSyncedRef = useRef(false);
  useEffect(() => {
    if (!auth.session) { managedSyncedRef.current = false; return; }
    if (!loaded || !managedOn() || managedSyncedRef.current) return;
    managedSyncedRef.current = true;
    (async () => {
      try {
        setSyncMsg(L("アカウント同期中…", "Syncing account…", "帳號同步中…"));
        // supaRef の更新時機に依存しない:session からその場で構成(時序免疫)
        const mcfg = { url: MANAGED_BACKEND.url.replace(/\/+$/, ""), key: MANAGED_BACKEND.anonKey,
                       accessToken: auth.session.access_token, userId: "" };
        const nn = await pullCloud(mcfg);
        markAllDirty();
        flushDirty();
        setSyncMsg(L("アカウント同期:受信 ", "Account synced: ", "帳號同步:收到 ") + nn + L(" 件 ", " items ", " 筆 ") + new Date().toLocaleTimeString());
      } catch (e) { setSyncMsg(L("アカウント同期エラー:", "Account sync error: ", "帳號同步錯誤:") + ((e && e.message) || e)); }
    })();
  }, [loaded, auth.session]);

  useEffect(() => {
    document.body.style.background = settings.theme === "light" ? "#efe9dc" : "#0d1018";
  }, [settings.theme]);
  useEffect(() => { setHapticEnabled(settings.haptic !== false); }, [settings.haptic]);

  /* ── 旧 Android(dvh 非対応)向け視口高フォールバック ──
     CSS は height:100vh → var(--app-vh) → 100dvh の順。dvh 対応ブラウザ(現行 Chrome/Safari)は
     100dvh が勝つので JS は何もしない。非対応環境のみ --app-vh を実測高で与え、
     URL バー表示時に底部タブバーが切れる 100vh 問題を回避する。 */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.CSS && CSS.supports && CSS.supports("height", "100dvh")) return; // 現行ブラウザは CSS に委譲
    const root = document.documentElement;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
      if (h) root.style.setProperty("--app-vh", h + "px");
    };
    const onResize = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", onResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", onResize);
    };
  }, []);

  /* 無限スクロールの監視は sorted/ownedKits/planKits 確定後に定義(下方)。
     依存配列なしで毎レンダー再生成すると observer churn と limit の暴走増分を招くため。 */

  /* ── 保存圖像分片 ── */
  /* ── v4 画像書込ヘルパー ──
     値の種別で分流:data:URL → image-store(orig+縮図)/ http(s) URL → mg_imgurls 行 / null → 削除。
     state には縮図 URL(または http URL)。即時表示のため一旦 data:URL を置き、store 化後に差し替える。 */
  const persistUrlRow = useCallback(async (nextImages) => {
    const um = {};
    for (const [k, v] of Object.entries(nextImages)) if (isHttpSrc(v)) um[k] = v;
    await saveKey("mg_imgurls", JSON.stringify(um));
  }, [saveKey]);
  const storeImage = useCallback(async (id, dataURL) => {
    const blob = await (await fetch(dataURL)).blob();
    const norm = await imageStore.normalizeImport(blob);
    await imageStore.putOrig(id, norm.blob, norm.w ? { w: norm.w, h: norm.h } : undefined);
    return imageStore.getThumbURL(id);
  }, []);
  /* AI変換などが原図(data:URL)を要する時の解決器。store 原図 → 無ければ http URL → null */
  const resolveOrigDataURL = useCallback(async (kitId, ref) => {
    const id = ref === "primary" ? kitId : ref;
    try {
      const blob = await imageStore.getOrigBlob(id);
      if (blob) return await blobToDataURL(blob);
    } catch (e) {}
    const v = ref === "primary" ? images[kitId] : extras[ref];
    return isHttpSrc(v) ? v : null;
  }, [images, extras]);

  const syncNow = async () => {
    const cfg = (managedOn() && auth.session)
      ? { url: MANAGED_BACKEND.url.replace(/\/+$/, ""), key: MANAGED_BACKEND.anonKey,
          accessToken: auth.session.access_token, userId: "" }
      : supaRef.current;
    if (!cfg.url || !cfg.key) {
      notify(managedOn()
        ? L("同期にはログインが必要です(設定 → アカウント)", "Sign in to sync (Settings → Account)", "同步需要先登入(設定 → 帳號)")
        : L("Supabase URL と anon キーを入力してください", "Enter the Supabase URL and anon key", "請輸入 Supabase URL 與 anon 金鑰"), { kind: "warn" });
      return;
    }
    setSyncMsg(L("同期中…","Syncing…","同步中…"));
    try {
      // 1) 雲端を取り込む(LWW で state へマージ)
      const nn = await pullCloud(cfg);
      // 2) 未送信のローカル変更だけを、変更時の時戳付きで再送する。
      //    以前はここで pull 直後の「古い閉包の state」を新しい時戳で全件 push しており、
      //    取り込んだばかりの雲端データ(特に時戳保護の無い settings/albumMeta/serifs)を
      //    上書きして消す競合があった。dirty キューは正しい時戳を保持するため安全。
      await flushDirty();
      setSyncMsg(L("同期完了(受信 ","Synced (","同步完成(收到 ") + nn + L(" 件)"," items)"," 筆)") + new Date().toLocaleTimeString());
    } catch (e) { setSyncMsg(L("同期エラー:","Sync error: ","同步錯誤:") + ((e && e.message) || e)); }
  };

  /* ── 初期復元:憑證輸入後僅拉取(不推送) ── */
  const setupSync = async () => {
    const url = (settings.supaUrl || "").trim().replace(/\/+$/, "");
    const key = (settings.supaKey || "").trim();
    if (!url || !key) { setSetupMsg(L("URL と anon キーを入力してください","Enter the URL and anon key","請輸入 URL 與 anon 金鑰")); return; }
    setSetupBusy(true);
    setSetupMsg(L("同期中…","Syncing…","同步中…"));
    try {
      const nn = await pullCloud({ url, key }, true);
      if (nn) {
        setSetupMsg(`受信 ${nn} 件 — 復元完了`);
        setTimeout(() => setSetupOpen(false), 900);
      } else {
        setSetupMsg(L("クラウドにデータが見つかりませんでした(新規の場合はこのまま閉じてOK)","No data found in the cloud (if you're new, just close this).","雲端找不到資料(新使用者可直接關閉)。"));
      }
    } catch (e) { setSetupMsg(L("エラー:","Error: ","錯誤:") + ((e && e.message) || e)); }
    setSetupBusy(false);
  };


  const setImage = (id, val) => {
    if (val == null) {
      setImages((prev) => {
        const next = { ...prev };
        const wasUrl = isHttpSrc(next[id]);
        delete next[id];
        imageStore.deleteImage(id);
        if (wasUrl) persistUrlRow(next);
        return next;
      });
      return;
    }
    if (isHttpSrc(val)) {
      setImages((prev) => { const next = { ...prev, [id]: val }; persistUrlRow(next); return next; });
      return;
    }
    // data:URL:即時表示 → 背景 store 化 → 縮図 URL に差し替え
    setImages((prev) => ({ ...prev, [id]: val }));
    (async () => {
      try { const u = await storeImage(id, val); if (u) setImages((p) => ({ ...p, [id]: u })); }
      catch (e) { console.error(e); }
    })();
  };

  /* ── アルバム(複数画像)操作 ── */
  // 1 kit の album record に対し、patch のフィールドだけ now で時戳付け(他フィールドの時戳は温存)。
  // これにより別端末が別フィールドを編集しても衝突せず、削除(null/空)も新時戳で正しく伝播する。
  const stampAlbum = useCallback(
    (prev, kitId, patch) => ({ ...prev, [kitId]: stampRec(prev[kitId] || {}, patch, new Date().toISOString()) }),
    []);
  // 画像メタを記録(由来/モデル/時刻/撮影者)。撮影者は未指定なら現在のビルダー名。
  const recordImgMeta = useCallback((kitId, ref, meta) => {
    if (!ref) return;
    setAlbumMeta((prev) => {
      const m = prev[kitId] || {};
      const imeta = { ...(m.imeta || {}) };
      imeta[ref] = {
        src: (meta && meta.src) || "photo",
        model: (meta && meta.model) || "",
        style: (meta && meta.style) || "",
        at: (meta && meta.at) || Date.now(),
        by: (meta && meta.by) || settings.builderName || "",
      };
      return stampAlbum(prev, kitId, { imeta });
    });
  }, [settings.builderName]);
  // 新規画像を追加(extras へ)。meta で由来を記録。枚数上限なし。
  const addAlbumImage = useCallback((kitId, src, meta) => {
    if (!src) return false;
    const xid = newXid(kitId);
    setExtras((prev) => ({ ...prev, [xid]: src })); // 即時表示(data:URL)→ store 化後に縮図 URL へ
    (async () => {
      try { const u = await storeImage(xid, src); if (u) setExtras((p) => ({ ...p, [xid]: u })); }
      catch (e) { console.error(e); }
    })();
    setAlbumMeta((prev) => {
      const m = prev[kitId] || {};
      const base = (m.order && m.order.length) ? m.order.slice() : albumRefs(kitId, images, extras, prev);
      return stampAlbum(prev, kitId, { order: base.filter((r) => r !== xid).concat([xid]) });
    });
    recordImgMeta(kitId, xid, meta || { src: "photo" });
    return true;
  }, [images, extras, albumMeta, storeImage, recordImgMeta]);

  // アルバムから1枚削除(primary か extra)。役割/順序/構図も掃除。
  const removeAlbumImage = useCallback((kitId, ref) => {
    if (ref === "primary") {
      setImages((prev) => { const next = { ...prev }; const wasUrl = isHttpSrc(next[kitId]); delete next[kitId]; imageStore.deleteImage(kitId); if (wasUrl) persistUrlRow(next); return next; });
    } else {
      setExtras((prev) => { const next = { ...prev }; delete next[ref]; imageStore.deleteImage(ref); return next; });
    }
    setAlbumMeta((prev) => {
      const m = prev[kitId] || {};
      const patch = { order: (m.order || []).filter((r) => r !== ref) };
      // 削除は null を新時戳で書くことで別端末の旧値を確実に上書きする(復活を防ぐ)。
      if (m.thumb === ref) patch.thumb = null;
      if (m.acquire === ref) patch.acquire = null;
      if (m.framing && m.framing[ref]) { const fr = { ...m.framing }; delete fr[ref]; patch.framing = fr; }
      if (m.imeta && m.imeta[ref]) { const im = { ...m.imeta }; delete im[ref]; patch.imeta = im; }
      return stampAlbum(prev, kitId, patch);
    });
  }, [persistUrlRow]);

  /* ── 鑑賞ビューア:現在機体の原図 URL を先読み(縮図 → 原図へ自然置換) ── */
  const [viewerOrig, setViewerOrig] = useState({});
  useEffect(() => {
    if (!viewer || !viewer.kitId) return;
    let dead = false;
    (async () => {
      const refs = albumRefs(viewer.kitId, images, extras, albumMeta);
      for (const ref of refs) {
        const id = ref === "primary" ? viewer.kitId : ref;
        try {
          const u = await imageStore.getOrigURL(id);
          if (dead || !u) continue;
          const vk = viewer.kitId + "/" + ref;
          setViewerOrig((p) => (p[vk] ? p : { ...p, [vk]: u }));
        } catch (e) {}
      }
    })();
    return () => { dead = true; };
  }, [viewer && viewer.kitId]);

  // 役割割り当て: role='thumb'|'acquire'
  const setAlbumRole = useCallback((kitId, ref, role) => {
    setAlbumMeta((prev) => stampAlbum(prev, kitId, { [role]: ref }));
  }, [stampAlbum]);

  // 構図(framing)を保存。null で既定に戻す。
  const setFraming = useCallback((kitId, ref, framing) => {
    setAlbumMeta((prev) => {
      const m = prev[kitId] || {};
      const framingMap = { ...(m.framing || {}) };
      if (framing) framingMap[ref] = framing; else delete framingMap[ref];
      return stampAlbum(prev, kitId, { framing: framingMap });
    });
  }, [stampAlbum]);

  // 画像の並び順を保存。先頭画像を自動的にサムネ(銘牌)兼入手表示に設定。
  const setAlbumOrder = useCallback((kitId, order) => {
    setAlbumMeta((prev) => {
      const m = prev[kitId] || {};
      const first = (order && order[0]) || m.thumb;
      return stampAlbum(prev, kitId, { order: (order || []).slice(), thumb: first, acquire: first });
    });
  }, [stampAlbum]);
  // 画像メタの場所(任意・手動)を更新。他のメタは保持。
  const setImgLoc = useCallback((kitId, ref, loc) => {
    setAlbumMeta((prev) => {
      const m = prev[kitId] || {}; const imeta = { ...(m.imeta || {}) };
      const cur = imeta[ref] || { src: "photo", model: "", at: Date.now(), by: settings.builderName || "" };
      imeta[ref] = { ...cur, loc: loc || "" };
      return stampAlbum(prev, kitId, { imeta });
    });
  }, [settings.builderName]);

  // 表示用: ref の framing を取得
  const framingOf = useCallback((kitId, ref) => {
    const m = albumMeta[kitId];
    return (m && m.framing && m.framing[ref]) || null;
  }, [albumMeta]);

  const thumbFrameStyle = useCallback((id) => framingStyle(framingOf(id, pickRef("thumb", id, images, extras, albumMeta))), [framingOf, images, extras, albumMeta]);
  // salon(繪測卷)は直式コンテナ。container-aspect を渡して自適応描画(B方式)
  const salonFrameStyle = useCallback((id) => framingStyle(framingOf(id, pickRef("thumb", id, images, extras, albumMeta)), (settings.salonCols || 2) === 3 ? 3 / 4 : 4 / 5), [framingOf, images, extras, albumMeta, settings.salonCols]);
  const acqFrameStyle = useCallback((id) => framingStyle(framingOf(id, pickRef("acquire", id, images, extras, albumMeta))), [framingOf, images, extras, albumMeta]);

  // 鑑賞モードを開く(入手指定の画像から)
  const viewerGuard = useRef(0);
  const openViewer = useCallback((kitId, from = "detail") => {
    if (Date.now() - viewerGuard.current < 400) return; // 閉じた直後のゴーストクリック対策
    const refs = albumRefs(kitId, images, extras, albumMeta).filter((ref) => refSrc(ref, kitId, images, extras));
    if (!refs.length) return;
    const acqRef = pickRef("acquire", kitId, images, extras, albumMeta);
    const ref = refs.includes(acqRef) ? acqRef : refs[0];
    haptic();
    setViewerDel(false);
    setViewer({ kitId, ref, from });
  }, [images, extras, albumMeta]);

  /* ── 画像最適化(v4):原図を上限(1600px)へ再圧縮し、縮図キャッシュを全再構築 ── */
  const optimizeImages = async () => {
    if (optimizing) return;
    setOptimizing(true);
    try {
      let changed = 0;
      for (const id of await imageStore.listIds()) {
        const blob = await imageStore.getOrigBlob(id);
        if (!blob) continue;
        const norm = await imageStore.normalizeImport(blob);
        if (norm.blob !== blob) { await imageStore.putOrig(id, norm.blob, { w: norm.w, h: norm.h }); changed++; }
      }
      const rebuilt = await imageStore.rebuildThumbs();
      // state の縮図 URL を作り直したものへ全差し替え(URL 項目は温存)
      const lateSet = (id, u) => { if (id.indexOf("~") >= 0) setExtras((p) => ({ ...p, [id]: u })); else setImages((p) => ({ ...p, [id]: u })); };
      const thumbs = await imageStore.allThumbURLs(lateSet);
      const imgs0 = {}, xtras0 = {};
      for (const [id, u] of Object.entries(thumbs)) { if (id.indexOf("~") >= 0) xtras0[id] = u; else imgs0[id] = u; }
      setImages((prev) => { const keep = {}; for (const [k, v] of Object.entries(prev)) if (isHttpSrc(v)) keep[k] = v; return { ...imgs0, ...keep }; });
      setExtras(() => ({ ...xtras0 }));
      notify(changed
        ? (changed + L(" 枚の原図を再圧縮しました"," originals recompressed"," 張原圖已重新壓縮") + L("(縮図","(thumbs ","(縮圖") + rebuilt + L("件再構築)"," rebuilt)","筆重建)"))
        : (L("再圧縮が必要な画像はありませんでした","No images needed recompressing","沒有需要重新壓縮的圖片") + L("(縮図","(thumbs ","(縮圖") + rebuilt + L("件再構築)"," rebuilt)","筆重建)")), { kind: changed ? "ok" : "info" });
    } finally { setOptimizing(false); }
  };

  /* ── 箱絵 manifest の一括インポート(路徑B: URL 参照) ──
     manifest = { kit_id: 公開URL }。既存機体に該当する URL だけを取り込み、
     mg_imgurls 行に保存+推送(値は短いURLなので同期は軽量)。 */
  const importManifest = async () => {
    const u = (manifestUrl || "").trim();
    if (!u) { setImgMsg(L("manifest の URL を入力してください","Enter the manifest URL","請輸入 manifest 的 URL")); return; }
    setImgBusy(true); setImgMsg(L("取得中…","Fetching…","取得中…"));
    try {
      const res = await fetch(u, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const map = await res.json();
      if (!map || typeof map !== "object" || Array.isArray(map)) throw new Error("形式が不正です(オブジェクトでない)");
      const valid = new Set(allKits.map((k) => k.id));
      const next = { ...images };
      let n = 0, skip = 0;
      for (const [id, url] of Object.entries(map)) {
        if (typeof url !== "string" || !url) continue;
        if (!valid.has(id)) { skip++; continue; }
        if (next[id] === url) continue;
        next[id] = url; n++;
      }
      if (!n) { setImgMsg(L("差分なし(取り込み 0 / 対象外 ","No changes (imported 0 / skipped ","無差異(匯入 0 / 略過 ") + skip + L(")",")",")")); setImgBusy(false); return; }
      setImages(next);
      await persistUrlRow(next);
      setImgMsg(L("取り込み完了: ","Imported: ","匯入完成: ") + n + L(" 件更新"," updated"," 筆更新") + (skip ? (L(" / 対象外 "," / skipped "," / 略過 ") + skip) : ""));
    } catch (e) {
      setImgMsg(L("失敗: ","Failed: ","失敗: ") + ((e && e.message) || e));
    }
    setImgBusy(false);
  };

  /* ── URL 画像をオフライン用にプリキャッシュ ──
     SW が制御中なら postMessage で一括(並列制御つき)。未制御なら Cache API へ直接(分割実行)。 */
  const precacheImages = async () => {
    const urls = Object.values(images).filter((v) => typeof v === "string" && /^https?:\/\//.test(v));
    if (!urls.length) { setImgMsg(L("オフライン保存できる URL 画像がありません","No URL images available to cache offline","沒有可離線快取的 URL 圖片")); return; }
    const ctrl = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (ctrl) {
      setImgMsg(L("オフライン保存中… (","Caching offline… (","離線快取中… (") + urls.length + L(" 件)"," items)"," 筆)"));
      ctrl.postMessage({ type: "precache-images", urls });
      return; // 完了は message リスナーで受信
    }
    if (!("caches" in window)) { setImgMsg(L("この端末は Cache API 非対応です","This device doesn't support the Cache API","此裝置不支援 Cache API")); return; }
    setImgBusy(true); setImgMsg(L("オフライン保存中… (","Caching offline… (","離線快取中… (") + urls.length + L(" 件)"," items)"," 筆)"));
    try {
      const cache = await caches.open("mg-kit-img-v1");
      let done = 0, fail = 0, idx = 0;
      const worker = async () => {
        while (idx < urls.length) {
          const url = urls[idx++];
          try {
            if (await cache.match(url, { ignoreVary: true })) { done++; continue; }
            await cache.put(url, await fetch(url, { mode: "no-cors" }));
            done++;
          } catch (_) { fail++; }
        }
      };
      await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
      setImgMsg(L("オフライン保存完了: ","Cached offline: ","離線快取完成: ") + done + L(" 件"," items"," 筆") + (fail ? (L(" / 失敗 "," / failed "," / 失敗 ") + fail) : ""));
    } catch (e) { setImgMsg(L("失敗: ","Failed: ","失敗: ") + ((e && e.message) || e)); }
    setImgBusy(false);
  };

  /* AI判別 等から画像を1台に追加(主画像が空なら主に、あれば追加画像に)。既存の分片保存を再利用。 */
  const attachPhoto = useCallback(async (kitId, dataURL) => {
    if (!dataURL) return;
    if (!images[kitId]) {
      setImages((prev) => ({ ...prev, [kitId]: dataURL })); // 即時表示 → store 化後に縮図 URL へ
      recordImgMeta(kitId, "primary", { src: "photo" });
      try { const u = await storeImage(kitId, dataURL); if (u) setImages((p) => ({ ...p, [kitId]: u })); }
      catch (e) { console.error(e); }
    } else {
      const xid = newXid(kitId);
      setExtras((prev) => ({ ...prev, [xid]: dataURL }));
      recordImgMeta(kitId, xid, { src: "photo" });
      try { const u = await storeImage(xid, dataURL); if (u) setExtras((p) => ({ ...p, [xid]: u })); }
      catch (e) { console.error(e); }
    }
  }, [images, extras, storeImage, recordImgMeta]);

  /* ── ローカル画像をファイル名(=kit_id)で一括取り込み ──
     例: b001.jpg → 機体 b001 に紐付け。画像は 480px JPEG へ圧縮(同期上限に安全)。
     8 シャードを各1回だけ保存+推送。ファイル名が kit_id に一致しない物は未対応として一覧。 */
  const importLocalImages = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setImgBusy(true); setImgMsg(`取り込み中… 0/${files.length}`);
    const valid = new Map(allKits.map((k) => [k.id.toLowerCase(), k.id]));
    const next = { ...images };
    let ok = 0; const bad = []; const okIds = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const base = (f.name || "").replace(/\.[^.]+$/, "").trim();
      const lead = base.split(/[ _\-(（\[]/)[0]; // 「b001_ガンダム.jpg」等にも対応(先頭トークン)
      const id = valid.get(base.toLowerCase()) || valid.get(lead.toLowerCase());
      if (!id) { bad.push(f.name); continue; }
      try { next[id] = await fileToCompressedDataURL(f, 1080, 0.8); ok++; okIds.push(id); }
      catch (e) { bad.push(f.name + "(変換失敗)"); }
      if (i % 4 === 0) setImgMsg(`取り込み中… ${i + 1}/${files.length}`);
    }
    if (ok) {
      setImages(next);
      okIds.forEach((id) => recordImgMeta(id, "primary", { src: "photo" }));
      for (const id of okIds) {
        try { const u = await storeImage(id, next[id]); if (u) setImages((p) => ({ ...p, [id]: u })); }
        catch (e) { console.error(e); }
      }
    }
    setImgBusy(false);
    setImgMsg(L("取り込み完了: ","Imported: ","匯入完成: ") + ok + L(" 件"," items"," 筆") +
      (bad.length ? ` / 未対応 ${bad.length}件: ${bad.slice(0, 3).join(", ")}${bad.length > 3 ? " …" : ""}` : ""));
  };

  /* Service Worker 登録(オフライン画像キャッシュ用)。/sw.js を配信ルートに置くこと。 */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (import.meta.env.PROD) navigator.serviceWorker.register("/sw.js").catch(() => {}); // dev は登録しない(main.jsx と同方針)
    const onMsg = (e) => {
      const d = (e && e.data) || {};
      if (d.type === "precache-done") {
        setImgBusy(false);
        setImgMsg(L("オフライン保存完了: ","Cached offline: ","離線快取完成: ") + d.done + L(" 件"," items"," 筆") + (d.fail ? (L(" / 失敗 "," / failed "," / 失敗 ") + d.fail) : ""));
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  /* ── 備份匯出 / 匯入 ── */
  const importRef = useRef(null);
  const exportData = async () => {
    // バックアップにも機密キーは含めない(端末ローカルにのみ残す)
    // v4: 画像は store の原図を base64 へ逆変換して同梱(自包含・v3 でも読める形式)。URL 項目はそのまま。
    const exImages = {}, exExtras = {};
    for (const [k, v] of Object.entries(images)) if (isHttpSrc(v)) exImages[k] = v;
    for (const id of await imageStore.listIds()) {
      try {
        const blob = await imageStore.getOrigBlob(id);
        if (!blob) continue;
        const dURL = await blobToDataURL(blob);
        if (id.indexOf("~") >= 0) exExtras[id] = dURL; else exImages[id] = dURL;
      } catch (e) { /* 個別失敗はスキップ */ }
    }
    const data = { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), records, overrides, customKits, settings: stripSecrets(settings), sortKey: sortKeyMap.zukan, sortDir: sortDirMap.zukan, sortKeyMap, sortDirMap, images: exImages, extras: exExtras, albumMeta, kitTags, serifs };
    const json = JSON.stringify(data);
    const name = `mg_zukan_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], name, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: L("MG図鑑バックアップ","Gunpla Daizukan backup","鋼彈大圖鑑備份") }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a); // 一部ブラウザ(Firefox 等)は DOM 接続が必要
    a.click();
    // 即時 revoke は一部端末でダウンロードを取り消すため遅延。要素も後始末。
    setTimeout(() => { try { URL.revokeObjectURL(url); a.remove(); } catch (e) {} }, 1500);
  };
  const importData = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const raw = JSON.parse(await f.text());
      const verr = validateBackup(raw);
      if (verr) { notify(L("読み込みに失敗しました:","Import failed: ","載入失敗:") + verr, { kind: "err", dur: 3200 }); e.target.value = ""; return; }
      const d = migrateMeta(raw);
      const now = new Date().toISOString();
      // 復元は全フィールドを now で時戳付けして確実に勝たせる(フィールド級マージ)
      const stampMap = (m) => { const o = {}; for (const k of Object.keys(m || {})) o[k] = stampRecAll(m[k], now); return o; };
      if (d.records) setRecords((prev) => mergeRecMap(prev, stampMap(d.records)));
      if (d.overrides) setOverrides((prev) => mergeRecMap(prev, stampMap(d.overrides)));
      if (d.customKits) setCustomKits((prev) => mergeArrStamped(prev, d.customKits.map((c) => ({ ...c, t: now }))));
      if (d.kitTags) setKitTags((prev) => mergeRecMap(prev, stampMap(d.kitTags)));
      if (d.settings) setSettings((s) => mergeRec(s, stampRecAll(d.settings, now)));
      if (d.sortKeyMap) setSortKeyMap((m) => ({ ...m, ...d.sortKeyMap }));
      else if (d.sortKey && SORT_KEYS.includes(d.sortKey)) setSortKeyMap({ zukan: d.sortKey, gallery: d.sortKey });
      if (d.sortDirMap) setSortDirMap((m) => ({ ...m, ...d.sortDirMap }));
      else if (d.sortDir === "asc" || d.sortDir === "desc") setSortDirMap({ zukan: d.sortDir, gallery: d.sortDir });
      if (d.images) {
        // 復元は全置換の意味論(v3 同様):バックアップに無い主画像は store から削除。
        setImages(d.images); // 即時表示(base64/URL のまま)→ store 化後に縮図 URL へ順次差し替え
        for (const id of await imageStore.listIds()) if (id.indexOf("~") < 0 && !(id in d.images)) await imageStore.deleteImage(id);
        const um = {};
        for (const [k, v] of Object.entries(d.images)) {
          if (typeof v !== "string") continue;
          if (isHttpSrc(v)) { um[k] = v; continue; }
          if (v.indexOf("data:") !== 0) continue;
          try { const u = await storeImage(k, v); if (u) setImages((p) => ({ ...p, [k]: u })); } catch (e) {}
        }
        await saveKey("mg_imgurls", JSON.stringify(um));
      }
      if (d.extras && isPlainObj(d.extras)) {
        setExtras(d.extras);
        for (const id of await imageStore.listIds()) if (id.indexOf("~") >= 0 && !(id in d.extras)) await imageStore.deleteImage(id);
        for (const [k, v] of Object.entries(d.extras)) {
          if (typeof v !== "string" || v.indexOf("data:") !== 0) continue;
          try { const u = await storeImage(k, v); if (u) setExtras((p) => ({ ...p, [k]: u })); } catch (e) {}
        }
      }
      if (d.albumMeta && isPlainObj(d.albumMeta)) setAlbumMeta(d.albumMeta);
      if (d.serifs && isPlainObj(d.serifs)) setSerifs(d.serifs);
      notify(L("バックアップの読み込みが完了しました","Backup imported","已匯入備份"), { kind: "ok" });
    } catch (err) { console.error(err); notify(L("読み込みに失敗しました(ファイル形式を確認してください)","Import failed (check the file format)","載入失敗(請確認檔案格式)"), { kind: "err", dur: 3200 }); }
    e.target.value = "";
  };

  /* ── 合成機體清單(基礎 + 雲端目錄 + 覆寫 + 自訂) ── */
  const baseCatalog = useMemo(() => applyCatalog(ALL_BASE, catalog), [catalog]);
  const allKits = useMemo(() => {
    const merged = baseCatalog
      .map((k) => (overrides[k.id] ? { ...k, ...overrides[k.id] } : k))
      .filter((k) => !k.retracted); // 下架した機体は一覧・検索・統計から隠す(記録は保持・復活可)
    return merged.concat(customKits.filter((c) => !c.deleted).map((c) => ({ line: "CUSTOM", no: "—", code: "", series: "", note: "", ...c })));
  }, [baseCatalog, overrides, customKits]);

  const seriesOptions = useMemo(
    () => [...new Set(allKits.map((k) => k.series).filter(Boolean))].sort((x, y) => x.localeCompare(y, "ja")),
    [allKits]);
  const kitById = useMemo(() => { const m = {}; for (const k of allKits) m[k.id] = k; return m; }, [allKits]);

  const getRec = useCallback((id) => records[id] || { owned: false, plan: false, purchaseDate: "", buildDate: "" }, [records]);

  /* アルバム解決の薄いラッパ(現在の state を閉じ込め) */
  const thumbSrc = useCallback((id) => thumbSrcOf(id, images, extras, albumMeta), [images, extras, albumMeta]);
  const acquireSrc = useCallback((id) => acquireSrcOf(id, images, extras, albumMeta), [images, extras, albumMeta]);
  const kitAlbum = useCallback((id) => albumRefs(id, images, extras, albumMeta)
    .map((ref) => ({ ref, src: refSrc(ref, id, images, extras), frame: framingStyle((albumMeta[id] && albumMeta[id].framing && albumMeta[id].framing[ref]) || null) })).filter((e) => e.src), [images, extras, albumMeta]);
  const setRec = (id, patch) => setRecords((r) => {
    const cur = r[id] || { owned: false, plan: false, purchaseDate: "", buildDate: "" };
    return { ...r, [id]: stampRec(cur, patch, new Date().toISOString()) };
  });
  /* ── カスタムタグ(機体ごとの自由タグ。records と同じ stamped LWW で同期) ── */
  const getTags = useCallback((id) => {
    const user = (kitTags[id] && kitTags[id].tags) || [];
    const k = kitById[id];
    const uni = k ? UNI_TAG[universeOfKit(k)] : null;
    return uni && !user.includes(uni) ? [uni, ...user] : user;
  }, [kitTags, kitById]);
  const setTags = (id, tags) => setKitTags((m) => {
    const cur = m[id] || { tags: [] };
    return { ...m, [id]: stampRec(cur, { tags }, new Date().toISOString()) };
  });
  const addTag = (id, raw) => {
    const t = (raw || "").trim().replace(/\s+/g, " ");
    if (!t) return;
    const cur = (kitTags[id] && kitTags[id].tags) || [];
    if (cur.includes(t)) return;
    setTags(id, [...cur, t]);
  };
  const removeTag = (id, t) => setTags(id, ((kitTags[id] && kitTags[id].tags) || []).filter((x) => x !== t));
  const allTags = useMemo(() => {
    const set = new Set(Object.values(UNI_TAG));
    for (const id in kitTags) for (const t of ((kitTags[id] && kitTags[id].tags) || [])) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b, "ja"));
  }, [kitTags]);
  /* 入手/予定互斥切換 */
  const toggleOwned = (id) => {
    const r = getRec(id);
    setRec(id, r.owned ? { owned: false, purchaseDate: "", buildDate: "" } : { owned: true, plan: false });
  };
  const togglePlan = (id) => {
    const r = getRec(id);
    setRec(id, r.plan ? { plan: false } : { plan: true, owned: false, purchaseDate: "", buildDate: "" });
  };

  /* ── 記録(成就)計算 ── */
  const achievements = useMemo(() => {
    const owned = allKits.filter((k) => getRec(k.id).owned);
    if (!owned.length) return [];
    const priced = owned.filter((k) => Number(k.price) > 0);
    const exp = priced.length ? priced.reduce((m, k) => (k.price > m.price ? k : m)) : null;
    const chp = priced.length ? priced.reduce((m, k) => (k.price < m.price ? k : m)) : null;
    const now = Date.now();
    let tsumi = null;
    owned.forEach((k) => {
      const r = getRec(k.id);
      if (!r.buildDate && r.purchaseDate) {
        const days = Math.floor((now - new Date(r.purchaseDate).getTime()) / 86400000);
        if (days >= 0 && (!tsumi || days > tsumi.days)) tsumi = { k, days };
      }
    });
    const byNameLen = [...owned].sort((x, y) => (y.name || "").length - (x.name || "").length);
    const ln = byNameLen[0], sn = byNameLen[byNameLen.length - 1];
    const bySeries = {};
    owned.forEach((k) => { const s = k.series || "原作不明"; bySeries[s] = (bySeries[s] || 0) + 1; });
    const sArr = Object.entries(bySeries).sort((x, y) => y[1] - x[1]);
    const byYear = {};
    owned.forEach((k) => { const d = getRec(k.id).purchaseDate; if (d) { const y = d.slice(0, 4); byYear[y] = (byYear[y] || 0) + 1; } });
    const yArr = Object.entries(byYear).sort((x, y) => y[1] - x[1]);
    const builtL = owned.filter((k) => getRec(k.id).buildDate);
    const tsumiN = owned.length - builtL.length;
    const totalPrice = priced.reduce((s, k) => s + Number(k.price), 0);
    const ty = String(new Date().getFullYear());
    const ySpend = owned.reduce((s, k) => {
      const d = getRec(k.id).purchaseDate;
      return d && d.slice(0, 4) === ty && Number(k.price) > 0 ? s + Number(k.price) : s;
    }, 0);
    const prem = owned.filter((k) => k.premium).length;
    const sighted = allKits.filter((k) => hasAnyImage(k.id, images, extras)).length;
    const shotOwned = owned.filter((k) => hasAnyImage(k.id, images, extras)).length;
    const pcv = (v) => Math.round((v / owned.length) * 100);
    const list = [];
    list.push({ id: "total", label: "収蔵総数", value: `${owned.length}体`, sub: "" });
    list.push({ id: "prem", label: "プレバン限定", value: `${prem}体`, sub: `収蔵の ${pcv(prem)}%` });
    list.push({ id: "built", label: "完成", value: `${builtL.length}体`, sub: `完成率 ${pcv(builtL.length)}%` });
    list.push({ id: "sighted", label: "目撃数", value: `${sighted}体`, sub: `収蔵撮影率 ${pcv(shotOwned)}%` });
    list.push({ id: "tsumi_n", label: "積み", value: `${tsumiN}体`, sub: `未制作 ${pcv(tsumiN)}%` });
    list.push({ id: "yspend", label: "年間消費", value: fmtYen(ySpend), sub: `${ty}年購入分・定価` });
    list.push({ id: "tprice", label: "定価合計", value: fmtYen(totalPrice), sub: `記録 ${priced.length} 体分` });
    if (exp) list.push({ id: "max", label: "最高額", value: fmtYen(exp.price), sub: exp.name });
    if (chp) list.push({ id: "min", label: "最安値", value: fmtYen(chp.price), sub: chp.name });
    if (tsumi) list.push({ id: "tsumi", label: "積み最長", value: `${tsumi.days}日`, sub: tsumi.k.name });
    if (ln) list.push({ id: "lname", label: "名称最長のガンプラ", value: ln.name, sub: `${(ln.name || "").length}文字`, nameVal: true });
    if (sn && owned.length > 1) list.push({ id: "sname", label: "名称最短のガンプラ", value: sn.name, sub: `${(sn.name || "").length}文字` });
    if (sArr.length) list.push({ id: "topser", label: "収蔵最多の作品", value: sArr[0][0], sub: `${sArr[0][1]}体` });
    if (sArr.length) list.push({ id: "lowser", label: "収蔵最少の作品", value: sArr[sArr.length - 1][0], sub: `${sArr[sArr.length - 1][1]}体` });
    if (yArr.length) list.push({ id: "topyear", label: "購入最多の年", value: `${yArr[0][0]}年`, sub: `${yArr[0][1]}体` });
    return list.map((x) => ({ ...x, key: x.value + "|" + x.sub }));
  }, [allKits, records, getRec, images, extras]);

  /* ── 称号(成就)評価 ── */
  const titles = useMemo(
    () => evaluateAchievements(ACHIEVEMENTS, allKits, getRec),
    [allKits, records]
  );
  const titleIsNew = useCallback(
    (t) => !!achvSeen && achvSeen.__a === 1 && t.unlocked && !achvSeen["t:" + t.id],
    [achvSeen]
  );
  const ackTitle = useCallback((id) => {
    setAchvSeen((s) => ({ ...(s || {}), ["t:" + id]: 1 }));
  }, []);

  // 統計カード(殿堂)の初回ベースライン:既存値を保持してマージ
  useEffect(() => {
    if (!loaded || !achvSeen || achvSeen.__b) return;
    setAchvSeen((s) => {
      const base = { ...(s || {}), __b: 1 };
      achievements.forEach((x) => { base[x.id] = x.key; });
      return base;
    });
  }, [loaded, achvSeen, achievements]);

  // 称号の初回サイレント・ベースライン:既達成を静かに「確認済み」化(初回トースト抑止)
  useEffect(() => {
    if (!loaded || !achvSeen || achvSeen.__a) return;
    setAchvSeen((s) => {
      const base = { ...(s || {}), __a: 1 };
      titles.forEach((t) => { if (t.unlocked) base["t:" + t.id] = 1; });
      return base;
    });
  }, [loaded, achvSeen, titles]);

  // 称号の新規解錠を検知 → トーストキューへ(初回 seed 前は基準のみ)
  useEffect(() => {
    if (!loaded) return;
    const curSet = new Set(titles.filter((t) => t.unlocked).map((t) => t.id));
    const prev = prevUnlockedRef.current;
    if (prev === null || !achvSeen || !achvSeen.__a) {
      prevUnlockedRef.current = curSet;
      return;
    }
    const newly = titles.filter((t) => t.unlocked && !prev.has(t.id)).map((t) => t.id);
    prevUnlockedRef.current = curSet;
    if (newly.length) setToastQueue((q) => [...q, ...newly]);
  }, [titles, loaded, achvSeen]);

  // キューを1件ずつ表示
  useEffect(() => {
    if (toast || !toastQueue.length) return;
    const id = toastQueue[0];
    const t = titles.find((x) => x.id === id);
    setToastQueue((q) => q.slice(1));
    if (!t) return;
    hapticStrong();
    setAchvPop("t:" + id);
    setToast(t);
  }, [toast, toastQueue, titles]);

  // 5 秒表示 →(上へスライドアウト)→ 次へ。タップでも同様に滑り出して消える
  useEffect(() => {
    if (!toast) return;
    let t2;
    const t1 = setTimeout(() => {
      setToastOut(true);
      t2 = setTimeout(() => { setToast(null); setAchvPop(null); }, 360);
    }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); setToastOut(false); };
  }, [toast]);

  const searchIndex = useMemo(() => {
    const m = {};
    for (const k of allKits) {
      const base = normJa([k.name, k.code, k.series, k.no].filter(Boolean).join(" "));
      m[k.id] = base + " " + toRomaji(base);
    }
    return m;
  }, [allKits]);

  const filtered = useMemo(() => {
    let pool = allKits;
    if (gfList.length) pool = pool.filter((k) => {
      const kg = (k.grade || "MG").toUpperCase();
      return gfList.some((g) => (g === "MG" ? (kg === "MG" || kg === "MGSD") : kg === g));
    });
    if (adv.series) pool = pool.filter((k) => (k.series || "") === adv.series);
    if (adv.uni) pool = pool.filter((k) => universeOfKit(k) === adv.uni);
    if (adv.tag) pool = pool.filter((k) => getTags(k.id).includes(adv.tag));
    // 確定済み検索語をリストへ反映(✓/Enter で commit された query)。候補ジャンプ時は query 未確定なので不動。
    const term = (query || "").trim();
    if (term) {
      const q = normJa(term); const rq = toRomaji(q);
      pool = pool.filter((k) => { const idx = searchIndex[k.id] || ""; return idx.includes(q) || (rq && rq !== q && idx.includes(rq)); });
    }
    if (tab === "gallery") pool = pool.filter((k) => !!thumbSrc(k.id));
    if (adv.prem === "pb") pool = pool.filter((k) => !!k.premium);
    else if (adv.prem === "base") pool = pool.filter((k) => !!k.base);
    else if (adv.prem === "normal") pool = pool.filter((k) => !k.premium && !k.base);
    if (adv.stat) pool = pool.filter((k) => {
      const r = getRec(k.id);
      return adv.stat === "owned" ? r.owned : adv.stat === "plan" ? r.plan : adv.stat === "built" ? !!r.buildDate : adv.stat === "none" ? (!r.owned && !r.plan) : true;
    });
    if (adv.yFrom || adv.yTo) {
      const lo = adv.yFrom ? parseInt(adv.yFrom, 10) : -Infinity;
      const hi = adv.yTo ? parseInt(adv.yTo, 10) : Infinity;
      pool = pool.filter((k) => {
        const y = k.ym ? parseInt(k.ym.slice(0, 4), 10) : NaN;
        return !isNaN(y) && y >= lo && y <= hi;
      });
    }
    return pool;
  }, [allKits, gfList, searchIndex, adv, getRec, getTags, tab, thumbSrc, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    const cmpStr = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    arr.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "ja") * dir;
      if (sortKey === "price") return (((a.price || 0) - (b.price || 0)) * dir) || a.name.localeCompare(b.name, "ja");
      if (sortKey === "purchase") {
        return cmpStr(getRec(a.id).purchaseDate || "9999", getRec(b.id).purchaseDate || "9999") * dir;
      }
      if (sortKey === "build") {
        return cmpStr(getRec(a.id).buildDate || "9999", getRec(b.id).buildDate || "9999") * dir;
      }
      return (cmpStr(a.ym || "9999", b.ym || "9999") * dir) || a.name.localeCompare(b.name, "ja");
    });
    return arr;
  }, [filtered, sortKey, sortDir, getRec]);

  const visible = useMemo(() => sorted.slice(0, paintLimit), [sorted, paintLimit]);

  /* 画像鑑賞の横断スライド: 繪測(salon)ビュー時のみ現在のビュー順(sorted)で連結。
     他モードでは空配列を返し、ビューア側で単独機体にフォールバックする。 */
  const viewerFlat = useMemo(() => {
    if (tab !== "gallery") return [];
    const list = [];
    for (const k of sorted) for (const ref of albumRefs(k.id, images, extras, albumMeta)) {
      if (refSrc(ref, k.id, images, extras)) list.push({ kitId: k.id, ref, name: k.name, code: k.code, no: k.no, series: k.series });
    }
    return list;
  }, [tab, sorted, images, extras, albumMeta]);
  const ownedKits = sorted.filter((k) => getRec(k.id).owned);
  const ownedVisible = ownedKits.slice(0, paintLimit);
  const ownedAll = allKits.filter((k) => getRec(k.id).owned).length;
  const builtAll = allKits.filter((k) => getRec(k.id).buildDate).length;
  const planAll = allKits.filter((k) => getRec(k.id).plan).length;
  const collectPct = Math.round((ownedAll / Math.max(1, allKits.length)) * 100);
  const futurePct = Math.round(((ownedAll + planAll) / Math.max(1, allKits.length)) * 100);
  const builtPct = Math.round((builtAll / Math.max(1, ownedAll)) * 100); // 完成率:完成÷所持
  // 繪測卷ヘッダ用:撮影数(機体画像の総数)と 撮影率(画像ありの機体 / 全収録)。
  const imgStats = useMemo(() => {
    let total = 0, kitsWith = 0;
    for (const k of allKits) {
      const n = albumRefs(k.id, images, extras, albumMeta).filter((ref) => refSrc(ref, k.id, images, extras)).length;
      if (n) { kitsWith++; total += n; }
    }
    return { total, kitsWith, pct: Math.round((kitsWith / Math.max(1, allKits.length)) * 100) };
  }, [allKits, images, extras, albumMeta]);
  const planKits = sorted.filter((k) => getRec(k.id).plan);
  const planVisible = planKits.slice(0, paintLimit);

  /* ── 無限スクロール:末尾センチネルが視界に入ったら limit を伸ばす ──
     依存配列で「センチネルの有無(moreVisible)/タブ/limit」が変わった時だけ
     observer を張り直す。依存なしの旧実装は毎レンダー再生成し、センチネルが
     視界内にあると isIntersecting の初回コールバックが繰り返し発火して limit が
     一気に跳ね上がっていた(遅延ロードの意図が崩れる)。 */
  const moreVisible = ((tab === "zukan" || tab === "gallery") ? sorted.length : 0) > limit;
  useEffect(() => {
    const el = moreRef.current;
    if (!el || !moreVisible || typeof IntersectionObserver === "undefined") return;
    const ob = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setLimit((n) => n + 80); }),
      { rootMargin: "200px" }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [moreVisible, tab, limit]);

  /* 称号一覧の遅延ロード。IIFE 内の list.length は pool(=絞り込み後)長と一致するため
     App スコープで honTotal を再計算し、observer の依存/ガードに使う。 */
  const honTotal = useMemo(
    () => titles.filter((t) => titleUniverse === "all" || (t.universe || "UC") === titleUniverse).length,
    [titles, titleUniverse]);
  useEffect(() => { setHonLimit(60); }, [titleUniverse, tab]); // 世界観切替・タブ切替でリセット
  const honMoreVisible = tab === "honors" && honTotal > honLimit;
  useEffect(() => {
    const el = honMoreRef.current;
    if (!el || !honMoreVisible || typeof IntersectionObserver === "undefined") return;
    const ob = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setHonLimit((n) => n + 80); }),
      { rootMargin: "200px" }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [honMoreVisible, tab, honLimit]);

  const seriesList = useMemo(() => {
    const s = new Set();
    for (const k of allKits) if (k.series) s.add(k.series);
    return [...s].sort((a, b) => a.localeCompare(b, "ja"));
  }, [allKits]);

  const grouped = useMemo(() => {
    if (sortKey !== "year") return null;
    const m = new Map();
    for (const k of visible) {
      const y = yearOf(k.ym);
      if (!m.has(y)) m.set(y, []);
      m.get(y).push(k);
    }
    return [...m.entries()];
  }, [visible, sortKey]);

  const sortLabel = { year: L("発売年月","Release","發售年月"), name: L("名称(五十音)","Name","名稱"), purchase: L("入手日","Acquired","入手日"), build: L("制作完了日","Completion","完成日"), price: L("定価","Price","定價") };

  const GF_OPTS = [["", "全部"], ["MG", "MG"], ["HG", "HG"], ["RG", "RG"], ["PG", "PG"], ["HIRM", "HIRM"], ["RE", "RE"], ["FM", "FM"], ["EXTRA", "EXTRA"]];
  const GfRow = ({ skey }) => {
    const raw = settings[skey];
    const cur = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((g) => String(g).toUpperCase());
    const isOn = (v) => (v === "" ? cur.length === 0 : cur.includes(v.toUpperCase()));
    const toggle = (v) => {
      haptic();
      if (v === "") { patchSettings({ [skey]: [] }); return; } // 「全部」=複数選択を解除
      const V = v.toUpperCase();
      const next = cur.includes(V) ? cur.filter((x) => x !== V) : [...cur, V];
      patchSettings({ [skey]: next });
    };
    return (
      <div className="gf-row">
        {GF_OPTS.map(([v, l]) => (
          <button key={v || "all"} className={"gf-btn" + (isOn(v) ? " on" : "")}
            onClick={() => toggle(v)}>{l}</button>
        ))}
      </div>
    );
  };

  /* 篩選/検索の使用後、リスト上に「条件:◯◯」膠囊を並べる。各膠囊タップで当該条件のみ解除。
     構造化フィルタ(作品・世界観・区分・状態・年代)は分類名を、検索語/タグは "値" を表示。 */
  const renderCondChips = () => {
    const qkey = advTab;
    const term = (queries[qkey] || "").trim();
    const gKey = gfStoreKey;
    const gRaw = settings[gKey];
    const grades = (Array.isArray(gRaw) ? gRaw : gRaw ? [gRaw] : []).map((g) => String(g).toUpperCase());
    const PREM_L = { pb: "プレバン", base: "ベース", normal: "一般" };
    const STAT_L = { owned: "入手", plan: "予定", none: "未入手", built: "完成" };
    const uniLabel = (u) => ((UNI_PICK.find(([v]) => v === u) || [null, u])[1] || u).split(" ")[0];
    const yearLabel = adv.yFrom && adv.yTo ? (adv.yFrom === adv.yTo ? adv.yFrom : `${adv.yFrom}〜${adv.yTo}`)
      : adv.yFrom ? `${adv.yFrom}〜` : adv.yTo ? `〜${adv.yTo}` : "";
    const items = [];
    if (adv.series) items.push({ k: "series", text: adv.series, clear: () => setAdv((a) => ({ ...a, series: "" })) });
    if (adv.uni) items.push({ k: "uni", text: uniLabel(adv.uni), clear: () => setAdv((a) => ({ ...a, uni: "" })) });
    if (adv.prem) items.push({ k: "prem", text: PREM_L[adv.prem] || adv.prem, clear: () => setAdv((a) => ({ ...a, prem: "" })) });
    if (adv.stat) items.push({ k: "stat", text: STAT_L[adv.stat] || adv.stat, clear: () => setAdv((a) => ({ ...a, stat: "" })) });
    if (yearLabel) items.push({ k: "year", text: yearLabel, clear: () => setAdv((a) => ({ ...a, yFrom: "", yTo: "" })) });
    if (adv.tag) items.push({ k: "tag", text: adv.tag, clear: () => setAdv((a) => ({ ...a, tag: "" })) });
    for (const g of grades) items.push({ k: "gf:" + g, text: g, clear: () => patchSettings({ [gKey]: grades.filter((x) => x !== g) }) });
    if (term) items.push({ k: "q", text: term, clear: () => setQueries((s) => ({ ...s, [qkey]: "" })) });
    if (!items.length) return null;
    return (
      <div className="section-note cond-line">
        <span className="cond-lead">{L("条件：", "Filters: ", "條件：")}</span>
        {items.map((c, i) => (
          <span key={c.k} className="cond-itemwrap">
            {i > 0 ? <span className="cond-sep">、</span> : null}
            <button className="cond-item" onClick={() => { haptic(); c.clear(); }}>{c.text}</button>
          </span>
        ))}
      </div>
    );
  };

  /* 設定頁の折りたたみ区画。関数で <section> を返す(コンポーネント化しないことで
     入力欄が毎レンダーで remount されずフォーカスを失わないようにする)。 */
  const secWrap = (id, jp, en, body, danger) => (
    <section className={"set-sec" + (danger ? " set-sec-danger" : "") + (openSec[id] ? " open" : "")}>
      <button type="button" className="set-sec-head" onClick={() => toggleSec(id)} aria-expanded={!!openSec[id]}>
        <h2 className="panel-title">{jp}<span>{en}</span></h2>
        <i className="set-chev" aria-hidden="true">▾</i>
      </button>
      {openSec[id] && <div className="set-sec-body">{body}</div>}
    </section>
  );

  const SortBar = () => (
    <div className="sort-bar">
      <Picker className="sort-pick" value={sortKey} onChange={(v) => setSortKey(v)} options={Object.entries(sortLabel)} />
      <button onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>{sortDir === "asc" ? "↑" : "↓"}</button>
    </div>
  );

  const ViewToggle = () => (
    <div className="view-toggle">
      <button className={settings.view === "grid" ? "on" : ""} onClick={() => patchSettings({ view: "grid" })}>{L("▦ カード","▦ Card","▦ 卡片")}</button>
      <button className={settings.view === "list" ? "on" : ""} onClick={() => patchSettings({ view: "list" })}>{L("☰ リスト","☰ List","☰ 列表")}</button>
    </div>
  );

  const SalonControls = () => (
    <div className="salon-ctrl">
      <div className="view-toggle salon-seg">
        <button className={(settings.salonCols || 2) === 2 ? "on" : ""} onClick={() => { haptic(); patchSettings({ salonCols: 2 }); }}>{L("２列","2 col","2 欄")}</button>
        <button className={(settings.salonCols || 2) === 3 ? "on" : ""} onClick={() => { haptic(); patchSettings({ salonCols: 3 }); }}>{L("３列","3 col","3 欄")}</button>
      </div>
      <div className="view-toggle salon-seg">
        <button className={(settings.salonFit || "cover") === "cover" ? "on" : ""} onClick={() => { haptic(); patchSettings({ salonFit: "cover" }); }}>{L("切抜","Crop","裁切")}</button>
        <button className={(settings.salonFit || "cover") === "contain" ? "on" : ""} onClick={() => { haptic(); patchSettings({ salonFit: "contain" }); }}>{L("全体","Fit","完整")}</button>
      </div>
    </div>
  );

  const advActive = adv.series || adv.uni || adv.prem || adv.stat || adv.yFrom || adv.yTo || adv.tag;
  const openFilter = useCallback(() => { haptic(); setFilterOpen(true); }, []);
  const closeFilter = useCallback(() => { setFilterOpen(false); }, []);
  /* タップ=onTap / 長押し=onLong。既存の makeLongPress/consumeLP を再利用 */
  const longPress = (onTap, onLong) => ({
    ...makeLongPress(() => { hapticStrong(); onLong && onLong(); }),
    onClick: (e) => { if (e) e.stopPropagation(); if (consumeLP()) return; onTap && onTap(); },
  });
  /* 全条件クリア:現在のタブの 絞り込み(adv)+検索語+グレード を一括解除 */
  const clearAllConds = () => {
    haptic();
    setAdv(EMPTY_ADV);
    setQueries((s) => ({ ...s, [advTab]: "" }));
    patchSettings({ [gfStoreKey]: [] });
  };
  /* ── 簿冊表頭(博物誌/繪測巻/蔵品帳/発注簿):仿叙勲録の表頭。タップで検索窓 ── */
  /* LedgerTitle は module scope へ移動済み(remount による表頭アニメ再生を防ぐため)。 */

  const LedgerHead = ({ eyebrow, title, alt, countNode, active, variant, onSwitch, scheme = "slide", akey, dir = 1, searchActive, onClearSearch }) => {
    const titleInner = (
      <>
        <span className="sb-eyebrow">{eyebrow}</span>
        <span className="sb-titlewrap">
          <LedgerTitle scheme={scheme} title={title} alt={onSwitch ? alt : null} akey={akey} dir={dir} />
        </span>
      </>
    );
    return (
    <div key={variant} className={"sb-band sb-v-" + variant}>
      <div className={"sb-head" + (active ? " on" : "")}>
        {onSwitch
          ? <button type="button" className="sb-switch" onClick={() => { hapticStrong(); onSwitch(); }}
              aria-label={alt ? "「" + alt + "」へ切り替え" : "切り替え"}>{titleInner}</button>
          : <div className="sb-switch sb-static">{titleInner}</div>}
        <span className="sb-head-r">
          <span className="sb-count">{countNode}</span>
          <div className="sb-sort">
            <button type="button" className="sb-sort-key" onClick={() => { haptic(); setSortMenuOpen(true); }} aria-label={L("並び替えの基準","Sort by","排序依據")}>{SORT_ICON[sortKey] || "販"}</button>
            <button type="button" className="sb-sort-dir" onClick={() => { haptic(); setSortDir((d) => (d === "asc" ? "desc" : "asc")); }} aria-label={L("昇順・降順","Ascending / descending","升冪・降冪")}>{sortDir === "asc" ? "↑" : "↓"}</button>
          </div>
          <button type="button" className={"sb-icon" + ((advActive || !!queries[advTab]) ? " on" : "")} aria-label={L("絞り込み・検索(長押しで解除)","Filter & search (long-press to clear)","篩選・搜尋(長按解除)")}
            {...longPress(openFilter, () => { clearAllConds(); notify(L("絞り込みを解除しました", "Filters cleared", "已清除篩選"), { variant: "decree", tag: L("解除", "CLEARED", "解除") }); })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5h18M6 12h12M10 19h4" />
            </svg>
          </button>
        </span>
      </div>
      <div className="sb-rule" />
    </div>
    );
  };

  const AdvPanel = () => (
    <div className="adv-panel">
      <div className="adv-row">
        <span className="adv-lbl">検索</span>
        <div className="adv-search">
          <input className="adv-search-input" value={queries[advTab] || ""}
            placeholder={L("機体名・型式・原作で検索","Search name, code, series","搜尋機體名・型式・原作")}
            onChange={(e) => setQueries((s) => ({ ...s, [advTab]: e.target.value }))} />
          {queries[advTab] ? <button type="button" className="adv-search-x" aria-label={L("検索をクリア","Clear search","清除搜尋")}
            onClick={() => setQueries((s) => ({ ...s, [advTab]: "" }))}>✕</button> : null}
        </div>
      </div>
      <div className="adv-row">
        <span className="adv-lbl">{L("作品","Series","作品")}</span>
        <button className="adv-sel adv-series-btn" onClick={() => setSeriesPickerOpen(true)}>
          <span className={adv.series ? "" : "ph"}>{adv.series || L("すべての作品","All series","所有作品")}</span>
          <span className="adv-series-caret">▾</span>
        </button>
      </div>
      <div className="adv-row">
        <span className="adv-lbl">{L("世界","Universe","世界")}</span>
        <button className="adv-sel adv-series-btn" onClick={() => setUniPickerOpen(true)}>
          <span className={adv.uni ? "" : "ph"}>{adv.uni ? ((UNI_PICK.find(([u]) => u === adv.uni) || [null, L("すべての世界観","All universes","所有世界觀")])[1]) : L("すべての世界観","All universes","所有世界觀")}</span>
          <span className="adv-series-caret">▾</span>
        </button>
      </div>
      <div className="adv-row">
        <span className="adv-lbl">{L("区分","Type","區分")}</span>
        <div className="adv-seg">
          {[["", L("全","All","全")], ["pb", L("プレバン","PB","魂商店")], ["base", L("ベース","Base","基地")], ["normal", L("一般","Retail","一般")]].map(([v, l]) => (
            <button key={v || "all"} className={"adv-seg-btn" + (adv.prem === v ? " on" : "")}
              onClick={() => setAdv((a) => ({ ...a, prem: v }))}>{l}</button>
          ))}
        </div>
      </div>
      <div className="adv-row">
        <span className="adv-lbl">{L("状態","Status","狀態")}</span>
        <div className="adv-seg">
          {[["", L("全", "All", "全")], ["none", L("未", "None", "未")], ["plan", L("予", "Plan", "予")], ["owned", L("入", "Own", "入")], ["built", L("完", "Built", "完")]].map(([v, l]) => (
            <button key={v || "all"} className={"adv-seg-btn" + (adv.stat === v ? " on" : "")}
              onClick={() => setAdv((a) => ({ ...a, stat: v }))}>{l}</button>
          ))}
        </div>
      </div>
      <div className="adv-row">
        <span className="adv-lbl">{L("年代","Years","年代")}</span>
        <div className="adv-years">
          <Picker className="adv-pick" value={adv.yFrom} onChange={(v) => setAdv((a) => ({ ...a, yFrom: v }))} options={[["", L("最古", "Earliest", "最早")], ...YEARS.map((y) => [String(y), String(y)])]} />
          <span className="adv-tilde">〜</span>
          <Picker className="adv-pick" value={adv.yTo} onChange={(v) => setAdv((a) => ({ ...a, yTo: v }))} options={[["", L("最新", "Latest", "最新")], ...YEARS.map((y) => [String(y), String(y)])]} />
        </div>
      </div>
      <div className="adv-foot">
        {(advActive || query || gfList.length) ? <button className="adv-clear" onClick={clearAllConds}>{L("全条件をクリア","Clear all","清除全部")}</button> : <span className="adv-hint">{L("作品・区分・状態・年代で絞り込み","Filter by series, type, status, years","依作品・區分・狀態・年代篩選")}</span>}
        <button className="adv-close" onClick={closeFilter}>{L("閉じる","Close","關閉")}</button>
      </div>
    </div>
  );

  /* ── 保存編輯 / 新增 ── */
  const saveEdit = (kit, values, imgVal, imgMeta) => {
    const now = new Date().toISOString();
    const fields = { name: values.name, code: values.code, ym: values.ym, price: values.price, series: values.series, note: values.note, premium: !!values.premium, grade: values.grade || "MG" };
    if (kit.line === "CUSTOM") {
      setCustomKits((cs) => cs.map((c) => (c.id === kit.id ? { ...c, ...fields, t: now } : c)));
    } else {
      setOverrides((o) => ({ ...o, [kit.id]: stampRec(o[kit.id], fields, now) }));
    }
    if (imgVal !== undefined) setImage(kit.id, imgVal);
    if (imgVal !== undefined && imgVal !== null) recordImgMeta(kit.id, "primary", imgMeta || { src: "photo" });
    setEditing(false);
  };

  const setNote = (kit, note) => {
    const now = new Date().toISOString();
    if (kit.line === "CUSTOM") {
      setCustomKits((cs) => cs.map((c) => (c.id === kit.id ? { ...c, note, t: now } : c)));
    } else {
      setOverrides((o) => ({ ...o, [kit.id]: stampRec(o[kit.id], { note }, now) }));
    }
  };

  const saveNew = (values, imgVal, imgMeta, tags) => {
    const now = new Date().toISOString();
    const id = "c" + Date.now().toString(36);
    setCustomKits((cs) => [...cs, { id, no: "—", line: "CUSTOM", ...values, t: now }]);
    if (adding === "owned") setRecords((r) => ({ ...r, [id]: stampRecAll({ owned: true, plan: false, purchaseDate: "", buildDate: "" }, now) }));
    if (adding === "plan") setRecords((r) => ({ ...r, [id]: stampRecAll({ owned: false, plan: true, purchaseDate: "", buildDate: "" }, now) }));
    if (imgVal !== undefined && imgVal !== null) { setImage(id, imgVal); recordImgMeta(id, "primary", imgMeta || { src: "photo" }); }
    if (tags && tags.length) setTags(id, tags);
    setAdding(false);
    setDetail(id);
  };

  const deleteCustom = (id) => {
    const now = new Date().toISOString();
    // 墓碑:保留 deleted 旗標並打新時戳,阻止雲端/別台用舊資料復活
    setCustomKits((cs) => cs.map((c) => (c.id === id ? { ...c, deleted: true, t: now } : c)));
    setRecords((r) => ({ ...r, [id]: stampRecAll({ owned: false, plan: false, purchaseDate: "", buildDate: "", deleted: true }, now) }));
    setImage(id, null);
    setDetail(null); setEditing(false); setTitleReturn(null);
  };

  /* 入手視窗を閉じる。称号条件頁から来た場合は条件頁へ戻す(称号一覧ではなく) */
  const closeDetail = () => {
    setDetail(null); setEditing(false); setTagInput("");
    if (titleReturn) { setTitleDetail(titleReturn); setTitleReturn(null); }
  };
  /* 詳細頁→図鑑へ:他の条件を一掃し、指定の単一条件だけを残してクリーンな結果頁を出す。
     図鑑は独立タブ(画廊と分離)なので利用者既定の list/card 表示で着地する。 */
  const gotoZukanFiltered = (patch) => {
    closeDetail();
    setAdvMap((m) => ({ ...m, zukan: { ...EMPTY_ADV, ...patch } }));
    setQueries((s) => ({ ...s, zukan: "" }));
    patchSettings({ gfZukan: [] });
    setLimit(60);
    changeTab("zukan");
  };
  const jumpToSeries = (s) => { if (s) gotoZukanFiltered({ series: s }); };
  const jumpToYear = (y) => { if (y) gotoZukanFiltered({ yFrom: String(y), yTo: String(y) }); };
  const jumpToTag = (t) => { if (t) gotoZukanFiltered({ tag: t }); };

  /* ── 卡片 ── */
  const lineBadge = (k, showPb = true) => (
    <>
      {k.line === "Ver.Ka" && <span className="line-chip ka">Ver.Ka</span>}
      {k.line === "MGEX" && <span className="line-chip ex">MGEX</span>}
      {k.line === "CUSTOM" && <span className="line-chip cu">{L("追加","Added","新增")}</span>}
      {showPb && k.premium && <span className="line-chip pb">{L("プレバン","P-Bandai","魂商店")}</span>}
    </>
  );

  const salonView = tab === "gallery";
  const slPad = typeof window !== "undefined" && !!(window.matchMedia && window.matchMedia("(min-width:768px)").matches);
  const Card = ({ kit }) => {
    const rec = getRec(kit.id);
    const dim = settings.dimUnowned && !rec.owned && !rec.plan;
    const img = thumbSrc(kit.id);
    const onCardClick = () => { if (consumeLP()) return; setDetail(kit.id); setEditing(false); };
    // 画廊: タップ=作品(写真)を見る。写真あり→鑑賞ビューア / 写真なし→詳細(そこから追加へ)。長押し=工房(ATELIER)。
    const onSalonClick = () => { if (consumeLP()) return; if (img) openViewer(kit.id, "salon"); else { setDetail(kit.id); setEditing(false); } };
    const sketchCrt = !rec.owned && !img; // 未入手かつ画像なし=ベクター→CRT風に
    if (salonView) {
      return (
        <button key={kit.id} className={`sl-card ${dim ? "dim" : ""} ${rec.owned ? "owned" : ""} ${rec.plan ? "planned" : ""} ${rec.buildDate ? "built" : ""}`} onClick={onSalonClick}>
          <div className="sl-frame" {...imgPress(kit.id)}>
            {settings.showGrade && kit.grade ? <span className="sl-grade">{kit.grade}</span> : null}
            {img
              ? <img className="sl-img" src={img} alt={kit.name} loading="lazy" decoding="async"
                  style={(settings.salonFit || "cover") === "cover" ? salonFrameStyle(kit.id) : undefined} />
              : <SeriesWatermark kit={kit} variant="list" />}
          </div>
          <div className="sl-body">
            <div className="sl-name"><FitName name={kit.name} max={(settings.salonCols || 2) === 3 ? (slPad ? 30 : 22) : (slPad ? 38 : 28)} /></div>
            {(settings.showYm || (settings.showPrice && kit.price)) && (
              <div className="sl-meta">
                {settings.showYm && <span className="kz-year">{kit.ym ? kit.ym.replace("-", ".") : "—"}</span>}
                {settings.showPrice && kit.price ? <span className="kz-price">{fmtYen(kit.price)}</span> : null}
              </div>
            )}
          </div>
        </button>
      );
    }
    if (settings.view === "list") {
      const noCode = [
        settings.listNo && kit.no && kit.no !== "—" ? `No.${kit.no}` : null,
        settings.listCode && kit.code ? kit.code : null,
      ].filter(Boolean).join(" · ");
      return (
        <div key={kit.id} className="kz-rowscroll">
          <button className={`kz-row ${dim ? "dim" : ""} ${rec.owned ? "owned" : ""} ${rec.plan ? "planned" : ""} ${rec.buildDate ? "built" : ""}`} onClick={onCardClick}>
            <div className="kz-rframe" {...imgPress(kit.id)}>
              {img
                ? <KitImage kit={kit} img={img} owned={rec.owned} built={!!rec.buildDate} size={88} cls="sm" frame={thumbFrameStyle(kit.id)} />
                : <SeriesWatermark kit={kit} variant="list" />}
            </div>
            <div className="kz-rmain">
              {settings.listTags !== false ? (
                <div className="kz-rtags">
                  <GradeChip grade={kit.grade} />
                  {kit.base && <span className="line-chip base">{L("ベース","Base","基地")}</span>}
                  {lineBadge(kit, true)}
                  {settings.listSeries && kit.series && <span className="kz-rtno">{kit.series}</span>}
                </div>
              ) : (
                <>
                  <div className="kz-rno">{[settings.listGrade !== false ? kit.grade : null, noCode].filter(Boolean).join(" · ")}</div>
                  {settings.listSeries && kit.series && <div className="kz-rseries">{kit.series}</div>}
                </>
              )}
              <div className="kz-rname"><KitName name={kit.name} /></div>
              {settings.listTags !== false && noCode && <div className="kz-rseries">{noCode}</div>}
              <div className="kz-rmeta">
                <span className="kz-year">{kit.ym ? kit.ym.replace("-", ".") : "—"}</span>
                {settings.listPrice && kit.price ? <span className="kz-price">{fmtYen(kit.price)}</span> : null}
                {settings.listPurchase && rec.purchaseDate && <span className="kz-date">{L("入手","Acquired","入手")} {fmtDate(rec.purchaseDate)}</span>}
                {settings.listBuild && rec.buildDate && <span className="kz-date done">{L("完成","Done","完成")} {fmtDate(rec.buildDate)}</span>}
              </div>
            </div>
            {rec.buildDate ? <span className="kz-rseal">済</span> : rec.plan ? <span className="kz-rplan">予</span> : null}
          </button>
        </div>
      );
    }
    const noLine = [
      settings.showGrade && kit.grade,
      settings.showNo && kit.no && kit.no !== "—" && `No.${kit.no}`,
      settings.showCode && kit.code,
    ].filter(Boolean).join(" · ");
    return (
      <button key={kit.id} className={`kz-card ${dim ? "dim" : ""} ${settings.compact ? "compact" : ""} ${rec.owned ? "owned" : ""} ${rec.plan ? "planned" : ""} ${rec.buildDate ? "built" : ""}`} onClick={onCardClick}>
        {noLine && <div className="kz-no">{noLine}</div>}
        {rec.buildDate ? <span className="kz-seal">済</span> : rec.plan ? <span className="kz-plan">予</span> : null}
        <div className="kz-frame" {...imgPress(kit.id)}>
          <KitImage kit={kit} img={img} owned={rec.owned} built={!!rec.buildDate} size={settings.compact ? 56 : 78} frame={thumbFrameStyle(kit.id)} />
          {kit.premium && <span className="line-chip pb corner-pb">{L("プレバン","P-Bandai","魂商店")}</span>}
          {kit.base && <span className="line-chip base corner-base">{L("ベース","Base","基地")}</span>}
        </div>
        <div className="kz-name"><KitName name={kit.name} /></div>
        <div className="kz-hair" />
        <div className="kz-meta">
          {settings.showYm && <span className="kz-year">{kit.ym ? kit.ym.replace("-", ".") : "—"}</span>}
          {settings.showPrice && kit.price ? <span className="kz-price">{fmtYen(kit.price)}</span> : null}
          {lineBadge(kit, false)}
        </div>
        {settings.showSeries && !settings.compact && kit.series && <div className="kz-series">{kit.series}</div>}
      </button>
    );
  };

  const Grid = ({ kits }) => (
    <div className={salonView ? `salon-grid cols-${settings.salonCols || 2} fit-${settings.salonFit || "cover"}`
      : settings.view === "list" ? "list-wrap" : `grid-wrap ${settings.compact ? "compact" : ""}`}>
      {kits.map((k) => Card({ kit: k }))}
    </div>
  );

  const detailKit = useMemo(() => (detail ? allKits.find((k) => k.id === detail) : null), [detail, allKits]);
  const detailRec = detailKit ? getRec(detailKit.id) : null;
  const detailEyeNo = detailKit ? [detailKit.no !== "—" ? `No.${detailKit.no}` : null, detailKit.code || null].filter(Boolean).join(" · ") : "";
  const pillState = detailRec ? (detailRec.buildDate || doneIntent ? "done" : detailRec.owned ? "own" : detailRec.plan ? "plan" : "none") : "none";
  const PILL_LABEL = { none: L("未入手", "Unowned", "未入手"), plan: L("予定", "Planned", "預定"), own: L("入手", "Owned", "入手"), done: L("完成", "Built", "完成") };
  const PILL_MENU = { none: ["plan", "own", "done"], plan: ["none", "own", "done"], own: ["none", "plan", "done"], done: ["none", "plan", "own"] };
  const applyPill = async (s) => {
    if (!detailKit) return;
    const id = detailKit.id;
    const cur = getRec(id);
    const losesPurchase = (s === "none" || s === "plan") && !!cur.purchaseDate;
    const losesBuild = (s === "none" || s === "plan" || s === "own") && !!cur.buildDate;
    if (losesPurchase || losesBuild) {
      const lost = [losesPurchase ? L("入手日", "the acquired date", "入手日期") : null, losesBuild ? L("完成日", "the completion date", "完成日期") : null].filter(Boolean).join(L("・", " and ", "、"));
      const ok = await appConfirm(
        L(`${lost}が削除されます。状態を変更しますか？`, `${lost} will be cleared. Change the status?`, `將清除${lost}。要變更狀態嗎？`),
        { okText: L("変更する", "Change", "變更"), cancelText: L("キャンセル", "Cancel", "取消"), danger: true }
      );
      if (!ok) { setPillOpen(false); return; }
    }
    if (s === "none") { setRec(id, { owned: false, plan: false, purchaseDate: "", buildDate: "" }); setDoneIntent(false); }
    else if (s === "plan") { setRec(id, { plan: true, owned: false, purchaseDate: "", buildDate: "" }); setDoneIntent(false); }
    else if (s === "own") { setRec(id, { owned: true, plan: false, buildDate: "" }); setDoneIntent(false); }
    else { setRec(id, { owned: true, plan: false }); setDoneIntent(true); }
    setPillOpen(false); haptic();
  };
  /* 掃描線:開くたびに各ビームへランダムな負の animation-delay を与え、
     開始位置(=出現タイミング)を毎回ばらけさせる。2本も同期しない。
     負の遅延=その分だけ既に進んだ状態で開始するので、上縁から同時に
     現れる固定挙動を解消する。detail(開いた機体)が変わるたびに再抽選。 */
  const beamDelay = useMemo(() => [
    -(Math.random() * 8.6).toFixed(2),  // 太線(周期8.6s)
    -(Math.random() * 7).toFixed(2),    // 細線(周期7s)
  ], [detail]);

  /* ── Android 返回鍵:逐層關閉浮層 ──
     各浮層 = 1 個 history entry。返回鍵(popstate)關閉最上層;UI で閉じた時は
     余剰 entry を history.go で巻き戻して同期を保つ。浮層が無い時は素通りで通常の
     戻る(アプリ離脱)を許す。配列は「内側(先に閉じる)→外側」の順。
     ※ATELIER(ImageEditorModal)内部のレイヤー(鑑賞ビューア / 画像情報シート / 追加メニュー /
       AI変換)は onBack 経由で atelierDepth として本スタックへ橋渡しする。 */
  const [atelierDepth, setAtelierDepth] = useState(0);
  const atelierCloseRef = useRef(null);
  const histDepthRef = useRef(0);
  const swallowRef = useRef(0);
  const overlayLayersRef = useRef([]);
  const overlayLayers = [
    { open: serifEdit != null, close: () => setSerifEdit(null) },
    { open: ownConfirm != null, close: () => setOwnConfirm(null) },
    { open: seriesPickerOpen, close: () => setSeriesPickerOpen(false) },
    { open: uniPickerOpen, close: () => setUniPickerOpen(false) },
    { open: frameEdit != null, close: () => setFrameEdit(null) },
    ...Array.from({ length: atelierDepth }, () => ({ open: true, close: () => { const f = atelierCloseRef.current; if (f) f(); } })),
    { open: imgEdit != null, close: () => setImgEdit(null) },
    { open: viewer != null, close: () => {
        const kid = viewer && viewer.kitId;
        const vf = viewer && viewer.from;
        viewerGuard.current = Date.now();
        setViewerDel(false); setSerifEdit(null); setViewer(null); setEditing(false);
        if (kid && vf !== "salon") setDetail(kid); // 通常は詳細へ復帰。salon 起点は繪測卷へ戻る
      } },
    { open: promptEdit != null, close: () => setPromptEdit(null) },
    { open: profileOpen, close: () => setProfileOpen(false) },
    { open: setupOpen, close: () => setSetupOpen(false) },
    { open: fixOpen, close: () => setFixOpen(false) },
    { open: quizOpen, close: () => setQuizOpen(false) },
    { open: identifyOpen, close: () => setIdentifyOpen(false) },
    { open: sortMenuOpen, close: () => setSortMenuOpen(false) },
    { open: titleDetail != null, close: () => setTitleDetail(null) },
    { open: !!adding, close: () => setAdding(false) },
    { open: !!detailKit && editing, close: () => setEditing(false) },
    { open: filterOpen, close: () => setFilterOpen(false) },
    { open: !!detailKit, close: closeDetail },
  ];
  overlayLayersRef.current = overlayLayers;
  const overlayCount = overlayLayers.reduce((n, l) => n + (l.open ? 1 : 0), 0);

  useEffect(() => {
    const onPop = () => {
      // 自分の history.go(...) で発生した popstate は1回ぶん吞んで何もしない
      if (swallowRef.current > 0) { swallowRef.current -= 1; return; }
      const top = overlayLayersRef.current.find((l) => l.open);
      if (top) {
        histDepthRef.current = Math.max(0, histDepthRef.current - 1);
        top.close();
      }
      // 浮層が無ければ素通り(ブラウザの戻るに委ねる)
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!loaded || typeof window === "undefined" || !window.history) return;
    if (overlayCount > histDepthRef.current) {
      const add = overlayCount - histDepthRef.current;
      for (let i = 0; i < add; i++) window.history.pushState({ mgOverlay: true }, "");
      histDepthRef.current = overlayCount;
    } else if (overlayCount < histDepthRef.current) {
      const surplus = histDepthRef.current - overlayCount;
      histDepthRef.current = overlayCount;
      // go(-n) は popstate を1回だけ発火する仕様 → 吞むのは1回
      swallowRef.current += 1;
      window.history.go(-surplus);
    }
  }, [overlayCount, loaded]);

  if (!loaded) return (
    <div className={"app lang-" + lang + " " + (settings.theme === "light" ? "light" : "")}>
      <div className="empty" style={{ paddingTop: 120, paddingBottom: 80 }}>
        <span className="empty-stamp">{L("準備中","OPEN","準備中")}</span>
        <div className="empty-eye">OPENING THE ARCHIVE</div>
        <MechSketch seedKey="loading" owned={false} built={false} size={70} />
        <p>{L("図鑑を準備中…", "Preparing the registry…", "圖鑑準備中…")}</p>
      </div>
    </div>
  );

  // 更新履歴モーダルの 1 カテゴリ行(該当なしは描画しない)
  const catLogRow = (label, arr, color, withFields) => {
    if (!arr || !arr.length) return null;
    return (
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 10, letterSpacing: ".14em", color, textTransform: "uppercase", marginRight: 8 }}>{label}</span>
        <span style={{ fontFamily: "var(--serif)", fontSize: 12.5, color: "var(--ink)", lineHeight: 1.7 }}>
          {arr.map((x) => x.name + (withFields && x.fields && x.fields.length ? "（" + x.fields.join("・") + "）" : "")).join("、")}
        </span>
      </div>
    );
  };

  return (
    <div className={"app lang-" + lang + " " + (settings.theme === "light" ? "light" : "") + (detailKit || adding || promptEdit || profileOpen || setupOpen || titleDetail || filterOpen || fixOpen || quizOpen || identifyOpen || sortMenuOpen || imgEdit ? " lock" : "")}>
      <AppDialogHost />

      {catalogLogOpen && (
        <div className="cf-bg" onClick={() => setCatalogLogOpen(false)}>
          <div className="cf-card" style={{ maxWidth: 480, width: "92vw", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
            <div className="cf-line" />
            <div className="cf-h">{L("機体データ更新履歴", "Catalog changelog", "機體資料更新履歷")}</div>
            <div style={{ overflowY: "auto", marginTop: 4 }}>
              {catalogLog.length === 0 ? (
                <div className="cf-m" style={{ opacity: .7 }}>{L("まだ更新履歴はありません", "No updates yet", "尚無更新紀錄")}</div>
              ) : catalogLog.map((e, i) => (
                <div key={i} style={{ borderTop: i ? "1px solid var(--line)" : "none", padding: "12px 2px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, letterSpacing: ".12em", color: "var(--gold)" }}>v{e.version}</span>
                    <span style={{ fontFamily: "ui-monospace,Menlo,monospace", fontSize: 11, color: "var(--ink)", opacity: .55 }}>{String(e.ts).slice(0, 10)}</span>
                  </div>
                  {e.notes ? <div style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--ink-strong)", marginBottom: 8, lineHeight: 1.6 }}>{e.notes}</div> : null}
                  {catLogRow(L("追加", "Added", "新增"), e.added, "var(--teal)")}
                  {catLogRow(L("修正", "Updated", "修正"), e.patched, "var(--gold)", true)}
                  {catLogRow(L("取り下げ", "Removed", "下架"), e.retracted, "var(--shu)")}
                  {catLogRow(L("再公開", "Restored", "重新上架"), e.restored, "var(--teal)")}
                </div>
              ))}
            </div>
            <div className="cf-acts">
              <button className="cf-btn ok" onClick={() => setCatalogLogOpen(false)}>{L("閉じる", "Close", "關閉")}</button>
            </div>
          </div>
        </div>
      )}

      {storageErr && (
        <div
          role="alert"
          onClick={() => setStorageErr("")}
          style={{
            position: "fixed", left: 8, right: 8, top: "calc(env(safe-area-inset-top) + 8px)",
            zIndex: 99998, background: "#5a1410", color: "#ffd9d2",
            padding: "10px 14px", borderRadius: "var(--r-md)", fontSize: 12.5, lineHeight: 1.5,
            boxShadow: "0 6px 24px rgba(0,0,0,.5)", cursor: "pointer",
            display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between",
          }}
        >
          <span>{storageErr}</span>
          <span style={{ opacity: 0.7, fontSize: 14, flexShrink: 0 }}>✕</span>
        </div>
      )}

      {/* 称号 叙勲トースト */}
      {toast && (
        <button className={"av-toast" + (toastOut ? " out" : "")} onClick={() => { setToastOut(true); setTimeout(() => { setToast(null); setAchvPop(null); }, 360); }}>
          <span className="av-toast-medal"><svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="avGoldT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--gold-hi)" /><stop offset="1" stopColor="var(--gold-lo)" /></linearGradient></defs><polygon points="32,7 49,16 49,40 32,57 15,40 15,16" fill="none" stroke="url(#avGoldT)" strokeWidth="2" /><polygon points="32,12 44,19 44,38 32,50 20,38 20,19" fill="rgba(217,179,106,.12)" stroke="url(#avGoldT)" strokeWidth="2.4" /><text x="32" y="39" textAnchor="middle" fontFamily="Shippori Mincho,serif" fontWeight="800" fontSize="20" fill="url(#avGoldT)">章</text></svg></span>
          <div className="av-toast-body">
            <div className="av-toast-kick">{L("DECORATED · 叙勲","DECORATED","DECORATED · 敘勳")}</div>
            <div className="av-toast-name">{toast.name}</div>
          </div>
          {toastQueue.length > 0 && <span className="av-toast-more">+{toastQueue.length}</span>}
        </button>
      )}

      <header className="head">
        {(() => {
          const arc = tab === "zukan" ? { en: "REGISTRY" }
            : tab === "gallery" ? { en: "GALLERY" }
            : tab === "honors" ? { en: "DECORATIONS" }
            : tab === "analysis" ? { en: "ANALYSIS" }
            : { en: "ADMINISTRATION" };
          const isDecor = tab === "honors";
          const isSalon = tab === "gallery";
          const isAnalysis = tab === "analysis";
          const titlesGot = titles.filter((t) => t.unlocked).length;
          const titlesPct = Math.round((titlesGot / Math.max(1, titles.length)) * 100);
          const pct = isDecor ? titlesPct
            : isSalon ? imgStats.pct
            : collectPct;
          return (
            <div ref={hfRef} className={`hf ${hfHide ? "collapsed" : ""} ${hfAnim ? "hf-anim" : ""}`} role="button" tabIndex={0}
              onClick={() => { haptic(); if (bodyRef.current) bodyRef.current.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <span className="hf-tag">Ⓐ ARCHIVE</span>
              <span className="hf-part" key={arc.en}><i className="hf-rl">Ⓡ</i>{arc.en}</span>
              <span className="hf-gate gl" style={{ top: "50%" }} /><span className="hf-gate gr" style={{ top: "50%" }} />
              <div className="hf-top">
                <div className="hf-rcol">
                  <div className="hf-main">
                    <div className="nf-left">
                      <div className="hf-eye">CLASSIFIED</div>
                      <h1 className="nf-gunpla">ガンプラ</h1>
                    </div>
                    <div className="nf-right"><div className="nf-big">大図鑑</div><span className="nf-run-bot" aria-hidden="true" /></div>
                  </div>
                  <div className="hf-rule" />
                  <div className="hf-stats">
                    <button className="hf-seal" aria-label={L("カメラで機体を判別","Identify kit by camera","以相機判別機體")} onClick={(e) => { e.stopPropagation(); haptic(); setIdentifyCam(true); setIdentifyOpen(true); }}>鑑</button>
                    {isDecor ? (
                      <>
                        <div className="s"><b><Roll value={titles.length} resetKey={arc.en} /></b><span>{L("称号","Titles","稱號")}</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={titlesGot} resetKey={arc.en} /></b><span>{L("獲得","Earned","獲得")}</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={titlesPct} resetKey={arc.en} />%</b><span>{L("叙勲率","Decorated %","敘勳率")}</span></div>
                      </>
                    ) : isSalon ? (
                      <>
                        <div className="s"><b><Roll value={allKits.length} resetKey={arc.en} /></b><span>{L("収録","Listed","收錄")}</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={imgStats.kitsWith} resetKey={arc.en} /></b><span>{L("目撃数","Sighted","目擊數")}</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={imgStats.pct} resetKey={arc.en} />%</b><span>{L("撮影率","Shot %","拍攝率")}</span></div>
                      </>
                    ) : isAnalysis ? (
                      <>
                        <div className="s"><b><Roll value={collectPct} resetKey={arc.en} />%</b><span>{L("収集率","Collected","收集率")}</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={imgStats.pct} resetKey={arc.en} />%</b><span>{L("撮影率","Shot %","拍攝率")}</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={titlesPct} resetKey={arc.en} />%</b><span>{L("叙勲率","Decorated %","敘勳率")}</span></div>
                      </>
                    ) : (
                      <>
                        <div className="s"><b><Roll value={allKits.length} resetKey={arc.en} /></b><span>{L("収録","Listed","收錄")}</span></div>
                        <div className="hf-div" />
                        <div className="s"><b><Roll value={ownedAll} resetKey={arc.en} /></b><span>{L("入手","Owned","入手")}</span></div>
                        <div className="hf-div" />
                        <div className="s"><b><Roll value={collectPct} resetKey={arc.en} />%</b><span>{L("収集率","Collected","收集率")}</span></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* V5 running-head: 收合終態。刊名+欄目+壓縮stats+鑑。彈簧落位は CSS 側 */}
              <div className="hf-mini" aria-hidden={!hfHide}>
                <span className="hm-wm">大<i>図鑑</i></span>
                <span className="hm-sep" />
                <span className="hm-arc">{arc.en}</span>
                <span className="hm-stat">
                  {isDecor ? (<>{L("獲得","Earned","獲得")} <b>{titlesGot}</b> · {L("叙勲率","Dec.","敘勳率")} <b>{titlesPct}%</b></>)
                  : isSalon ? (<>{L("目撃","Sighted","目擊")} <b>{imgStats.kitsWith}</b> · {L("撮影率","Shot","拍攝率")} <b>{imgStats.pct}%</b></>)
                  : isAnalysis ? (<>{L("収集","Col.","收集")} <b>{collectPct}%</b> · {L("撮影","Shot","拍攝")} <b>{imgStats.pct}%</b> · {L("叙勲","Dec.","敘勳")} <b>{titlesPct}%</b></>)
                  : (<>{L("入手","Owned","入手")} <b>{ownedAll}</b> · {L("収集率","Col.","收集率")} <b>{collectPct}%</b></>)}
                </span>
                {!(isAnalysis || tab === "settings") && (
                  <button className="hm-seal" aria-label={L("カメラで機体を判別","Identify kit by camera","以相機判別機體")}
                    onClick={(e) => { e.stopPropagation(); haptic(); setIdentifyCam(true); setIdentifyOpen(true); }}>鑑</button>
                )}
              </div>
              <div className="hf-prog"><i className={isDecor ? "kin" : ""} style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })()}
      </header>

      <main className="body" ref={bodyRef} onScroll={onBodyScrollHf}>
        <div key={tab} className="tab-page">
        {(tab === "zukan" || tab === "gallery") && (
          <>
            {LedgerHead({
              variant: salonView ? "salon" : "registry",
              eyebrow: salonView ? L("GALLERY · 画廊", "GALLERY", "GALLERY · 畫廊") : L("REGISTRY · 図鑑", "REGISTRY", "REGISTRY · 圖鑑"),
              title: salonView
                ? L(<>絵<em>測</em>巻</>, <>Gallery</>, <>繪<em>測</em>卷</>)
                : L(<><span>博</span><em>物</em><span>誌</span></>, <>Registry</>, <><span>博</span><em>物</em><span>誌</span></>),
              scheme: "slide",
              akey: salonView ? "salon" : "registry",
              dir: salonView ? 1 : -1,
              searchActive: !!queries[advTab],
              onClearSearch: () => setQueries((s) => ({ ...s, [advTab]: "" })),
              active: !!queries[advTab] || advActive,
              countNode: salonView
                ? <><b>{sorted.length}</b> / {imgStats.kitsWith} {L("目撃", "shot", "目擊")}</>
                : <><b>{sorted.length}</b> / {allKits.length} {L("収録", "listed", "收錄")}</>,
            })}
            {filterOpen && (
              <div className="modal-bg search-modal-bg" onClick={closeFilter}>
                <div className="modal search-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="sm-head">
                    <span className="sm-title">{salonView ? L(<>絵<em>測</em>巻</>, <>Gallery</>, <>繪<em>測</em>卷</>) : L(<>博<em>物</em>誌</>, <>Registry</>, <>博<em>物</em>誌</>)} <span className="sm-eyebrow">FILTER</span></span>
                    <button className="modal-x static" onClick={closeFilter}>✕</button>
                  </div>
                  {AdvPanel()}
                  <div className="drawer-sub">
                    <GfRow skey={gfStoreKey} />
                  </div>
                  <div className="drawer-tools">
                    <SortBar />
                    {salonView ? <SalonControls /> : <ViewToggle />}
                    {!salonView && <button className="add-btn" onClick={() => { closeFilter(); setAdding("zukan"); }}>{L("＋ 追加","＋ Add","＋ 新增")}</button>}
                  </div>
                </div>
              </div>
            )}
            {renderCondChips()}
            {salonView && sorted.length === 0 ? (
              <div className="empty">
                <span className="empty-stamp">{imgStats.kitsWith === 0 ? L("未撮影","NONE","未拍攝") : L("該当なし","N/A","無符合")}</span>
                <div className="empty-eye">{imgStats.kitsWith === 0 ? "NO PHOTOGRAPHS" : "NO RECORD FOUND"}</div>
                <MechSketch seedKey="gallery" owned={false} built={false} size={70} />
                {imgStats.kitsWith === 0 ? (
                  <>
                    <p>{L("まだ撮影した機体がありません。", "No photographed kits yet.", "尚未拍攝任何機體。")}</p>
                    <p className="empty-sub">{L("図鑑で機体を開き、写真を追加すると画廊に並びます。", "Open a kit in the Registry and add a photo to fill the gallery.", "在圖鑑開啟機體並加入照片，就會出現在畫廊。")}</p>
                  </>
                ) : (
                  <>
                    <p>{L("条件に一致する撮影がありません。", "No photos match your filters.", "沒有符合條件的照片。")}</p>
                    <p className="empty-sub">{L("絞り込みや検索を解除してみてください。", "Try clearing the filters or search.", "試著清除篩選或搜尋條件。")}</p>
                  </>
                )}
              </div>
            ) : (
              <>
                {grouped
                  ? grouped.map(([year, kits]) => (
                      <section key={year} className="year-sec">
                        <div className="year-head"><span className="year-num">{year}</span><span className="year-rule" /><span className="year-count">{kits.length} 体</span></div>
                        {Grid({ kits })}
                      </section>
                    ))
                  : Grid({ kits: visible })}
                {sorted.length > limit && (
                  <button ref={moreRef} className="more-btn" onClick={() => setLimit((n) => n + 80)}>
                    <span className="mb-l" /><span className="mb-t"><b>{L("続き","More","續頁")}</b><span>REMAINING {sorted.length - limit}</span></span><span className="mb-r" />
                  </button>
                )}
                {sorted.length > 0 && sorted.length <= limit && (
                  <div className="fin"><span className="fin-l" /><span className="fin-m"><i>◈</i> {L("完","End","完")}</span><span className="fin-r" /></div>
                )}
              </>
            )}
            {!salonView && <p className="footnote">{L('※ 収録データはGUNPLA ROOM等の公開型録情報を整理(一般販売:MG No.001–223+プレバン207 / Ver.Ka 01–30+プレバン20 / MGEX、HG 統一ナンバリング 全収録 No.001–268+プレバン205、HG SEED系 全86(01–59/R01–17/MSV-01–07+プレバン3)、HG 00系 全収録 No.01–72+プレバン12、HG ビルドファイターズ系 全収録 No.1–69(支援機含む。23/30/32/41欠番)+プレバン25、HG 鉄血のオルフェンズ系 全収録 No.1–47+O-1~9+プレバン23、HG ガンダムブレイカー バトローグ系 全10(うちプレバン4)、HG ククルス・ドアンの島 全11、HG THE ORIGIN系 全収録 No.001–026+プレバン001–026、HG Gのレコンギスタ系 全収録 No.001–017+プレバン4、HG AGE系 全収録 No.001–034+プレバン7、HG サンダーボルト系 全収録 No.001–013+プレバン1、HG ビルドダイバーズ系 全収録 No.001–083+プレバン6、HG ビルドメタバース系 全8、HG GQuuuuuuX系 No.1–15+プレバン4(続刊)、HG 水星の魔女系 全収録 No.01–26+プレバン12、RG 全43+プレバン74、PG 全26+プレバン5(早期プレバン数点は確認中)、HIRM 01–05(06以降確認中)、RE/100 01–06+プレバン4(他確認中)、ベース限定MG 全39・RG 01–29(以降確認中)・HG 主線分(系列網羅は順次)、MGSD 全5。ホビーオンライン/プレバン限定は「プレバン」表記で収録、イベント限定は未収録、ガンダムベース限定は「ベース限定」タグで順次収録中(現在MG分))。各欄位は詳細画面の「編集」で随時修正可能。','* Catalog data is compiled from public sources such as GUNPLA ROOM. Coverage spans MG / HG / RG / PG / RE/100 / MGSD / MGEX and P-Bandai lines; event-only items are excluded, Gundam Base-limited items are tagged and added progressively. Every field is editable from a kit’s detail screen.','* 收錄資料整理自 GUNPLA ROOM 等公開型錄資訊，涵蓋 MG／HG／RG／PG／RE/100／MGSD／MGEX 及魂商店限定等系列；活動限定未收錄，Gundam Base 限定以標籤逐步補入。各欄位皆可於詳細頁「編輯」隨時修正。')}</p>}
          </>
        )}

        {tab === "honors" && (() => {
          const UNIVERSES = [["all", "すべて"], ["UC", "U.C."], ["SEED", "SEED"], ["W", "W"], ["X", "X"], ["G", "G"], ["00", "00"], ["AGE", "A.G."], ["IBO", "P.D."], ["AS", "A.S."], ["RC", "R.C."], ["CC", "C.C."], ["GQX", "GQX"], ["BF", "BF"], ["other", "その他"]];
          const UNI_PREFIX = { UC: "U.C.", SEED: "C.E.", W: "A.C.", X: "A.W.", G: "F.C.", "00": "A.D.", AGE: "A.G.", IBO: "P.D.", AS: "A.S.", RC: "R.C.", CC: "C.C.", GQX: "GQX", BF: "BF", other: "" };
          const inUni = (t) => titleUniverse === "all" ? true : (t.universe || "UC") === titleUniverse;
          const rank = (t) => (t.tier === 1 ? 0 : (t.tier === 0 ? (t.cur > 0 ? 1 : 2) : 3));
          const pool = titles.filter(inUni);
          const list = pool.slice().sort((a, b) => {
            const na = titleIsNew(a) ? 0 : 1, nb = titleIsNew(b) ? 0 : 1;
            if (na !== nb) return na - nb;
            const r = rank(a) - rank(b);
            if (r !== 0) return r;
            if (rank(a) === 1) return (b.cur / b.need) - (a.cur / a.need);
            return (a.no || 0) - (b.no || 0);
          });
          const got = pool.filter((t) => t.unlocked).length;
          const newN = pool.filter(titleIsNew).length;
          const curUni = UNIVERSES.find(([v]) => v === titleUniverse);
          /* 称号メダルは <Emblem universe tier/> で描画 */
          return (
            <section className="ana-sec av-sec">
              <svg className="av-defs" width="0" height="0" aria-hidden="true"><defs>
                <linearGradient id="avGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--gold-hi)" /><stop offset="1" stopColor="var(--gold-lo)" /></linearGradient>
              </defs></svg>
              <div className="av-head">
                <div className="sb-switch sb-static">
                  <span className="av-eyebrow">{(curUni && curUni[0] !== "all" ? (UNI_PREFIX[curUni[0]] || curUni[1]) + " " : "") + L("DECORATIONS · 称号","DECORATIONS","DECORATIONS · 稱號")}</span>
                  <span className="sb-titlewrap">
                    <LedgerTitle scheme="slide" akey="record" dir={-1} title={L(<>叙<em>勲</em>録</>,<>Honors</>,<>敘<em>勳</em>錄</>)} />
                  </span>
                </div>
                <span className="av-head-r">
                  <span className="av-count"><b>{got}</b> / {pool.length} {L("叙勲","awarded","敘勳")}{newN > 0 ? ` · NEW ${newN}` : ""}</span>
                  <button type="button" className={"sb-icon" + (segOpen || titleUniverse !== "all" ? " on" : "")} aria-label={L("世界観で絞り込み(長押しで解除)","Filter by universe (long-press to clear)","依世界觀篩選(長按解除)")}
                    {...longPress(() => { haptic(); setSegOpen((o) => !o); }, () => { setTitleUniverse("all"); setSegOpen(false); notify(L("世界観の絞り込みを解除しました", "Universe filter cleared", "已清除世界觀篩選"), { variant: "decree", tag: L("解除", "CLEARED", "解除") }); })}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5h18M6 12h12M10 19h4" />
                    </svg>
                  </button>
                </span>
              </div>
              <div className="av-rule" />
              <div className={"av-drop" + (segOpen ? " open" : "")}>
                <div className="av-drop-inner av-unitabs">
                  {UNIVERSES.map(([v, l]) => {
                    const n = v === "all" ? titles.length : titles.filter((t) => (t.universe || "UC") === v).length;
                    const label = v === "all" ? "ALL" : (UNI_PREFIX[v] || l);
                    return (
                      <button key={v} className={"av-unitab" + (titleUniverse === v ? " on" : "") + (n === 0 ? " empty" : "")}
                        onClick={() => { haptic(); setTitleUniverse(v); setSegOpen(false); }}>{label}</button>
                    );
                  })}
                </div>
              </div>
              <div className="av-reg">
                {/* 遅延ロード:切替直後(gridReady=false)は先頭40件、以降は honLimit 件まで描画。
                    末尾センチネルが視界に入るたび +80。407件の一括マウント/長リスト由来のカク付き対策。 */}
                {list.slice(0, gridReady ? honLimit : 40).map((t) => {
                  const isNew = titleIsNew(t);
                  const hiddenLocked = t.hidden && !t.unlocked;
                  const remain = Math.max(0, t.need - t.cur);
                  const cls = t.tier === 2 ? "gold" : (t.tier === 1 ? "silver" : "locked");
                  return (
                    <button key={t.id} className={"av-entry " + cls + (isNew ? " new" : "") + (achvPop === "t:" + t.id ? " pop" : "")}
                      onClick={() => { haptic(); ackTitle(t.id); setTitleDetail(t); }}>
                      <span className={"av-medal " + cls}><Emblem universe={t.universe || "UC"} tier={t.tier} /></span>
                      <span className="av-ebody">
                        <span className="av-eno">{(UNI_PREFIX[t.universe] || t.universe || "U.C.")} · No.{String(t.no || 0).padStart(3, "0")}</span>
                        <span className="av-ename">{hiddenLocked ? "？？？" : achName(t)}</span>
                        {t.tier >= 1 && <span className="av-ehair" />}
                        {t.tier >= 1 && <span className="av-eflavor">{achSub(t)}</span>}
                        {t.tier === 1 && <span className="av-etag silver">{L("あと ","","還差 ")}{Math.max(0, (t.builtNeed || 1) - (t.builtCur || 0))}{L(" 体完成で金章"," builds to gold"," 體完成得金章")}</span>}
                        {t.tier === 0 && t.need > 1 && (
                          <span className="av-eprog"><span className="av-ebar"><i style={{ width: `${Math.round(t.cur / t.need * 100)}%` }} /></span><span className="av-erem">{L("あと ","","還差 ")}{remain}{L("","  left","")}</span></span>
                        )}
                        {t.tier === 0 && t.need === 1 && <span className="av-etag locked">{L("未叙勲","Locked","未敘勳")}</span>}
                      </span>
                      {isNew && <i className="av-dot" />}
                    </button>
                  );
                })}
                {list.length === 0 && <div className="av-empty">{L("この世界の称号は準備中…","Titles for this universe are coming soon…","此世界觀的稱號準備中…")}</div>}
                {list.length > honLimit && (
                  <button ref={honMoreRef} className="more-btn" onClick={() => setHonLimit((n) => n + 80)}>
                    <span className="mb-l" /><span className="mb-t"><b>{L("続き","More","續頁")}</b><span>REMAINING {list.length - honLimit}</span></span><span className="mb-r" />
                  </button>
                )}
                {list.length > 0 && list.length <= honLimit && (
                  <div className="fin"><span className="fin-l" /><span className="fin-m"><i>◈</i> {L("完","End","完")}</span><span className="fin-r" /></div>
                )}
              </div>
            </section>
          );
        })()}

        {tab === "analysis" && (() => {
          const owned = allKits.filter((k) => getRec(k.id).owned);
          if (owned.length === 0) return (
            <>
              <div className="empty">
                <span className="empty-stamp">{L("収蔵なし","EMPTY","無收藏")}</span>
                <div className="empty-eye">NO COLLECTION DATA</div>
                <MechSketch seedKey="ana" owned={false} built={false} size={70} />
                <p>{L("分析できる収蔵がまだありません。", "Nothing to analyze yet.", "尚無可分析的收藏。")}</p>
                <p className="empty-sub">{L("図鑑で「入手済み」を記録すると、ここに収蔵分析が表示されます。", "Mark kits as owned in the Registry to see your collection analysis here.", "在圖鑑標記「已入手」後，這裡會顯示收藏分析。")}</p>
              </div>
            </>
          );

          const bySeries = {};
          owned.forEach((k) => { const s = k.series || "原作不明"; bySeries[s] = (bySeries[s] || 0) + 1; });
          const sArr = Object.entries(bySeries).sort((x, y) => y[1] - x[1]);
          const topS = sArr.slice(0, 8);
          if (sArr.length > 8) topS.push(["その他", sArr.slice(8).reduce((s, [, v]) => s + v, 0)]);
          const seriesData = topS.map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }));

          const gradeColors = { MG: "var(--g-mg)", HG: "var(--g-hg)", RG: "var(--g-rg)", PG: "var(--g-pg)", HIRM: "var(--g-hirm)", RE: "var(--g-re)", FM: "var(--g-fm)", MGSD: "var(--g-mgsd)", EXTRA: "var(--g-extra)" };
          const byGrade = {};
          owned.forEach((k) => { const g = k.grade || "MG"; byGrade[g] = (byGrade[g] || 0) + 1; });
          const gradeData = Object.entries(byGrade).sort((x, y) => y[1] - x[1])
            .map(([label, value]) => ({ label, value, color: gradeColors[label] || "var(--g-none)" }));

          const byYear = {};
          owned.forEach((k) => { const d = getRec(k.id).purchaseDate; if (d) { const y = d.slice(0, 4); byYear[y] = (byYear[y] || 0) + 1; } });
          const yearData = Object.keys(byYear).sort().map((y) => ({ label: y, value: byYear[y] }));
          const maxYear = Math.max(1, ...yearData.map((d) => d.value));

          const byBuildYear = {};
          owned.forEach((k) => { const d = getRec(k.id).buildDate; if (d) { const y = d.slice(0, 4); byBuildYear[y] = (byBuildYear[y] || 0) + 1; } });
          const buildYearData = Object.keys(byBuildYear).sort().map((y) => ({ label: y, value: byBuildYear[y] }));
          const maxBuildYear = Math.max(1, ...buildYearData.map((d) => d.value));

          const relYears = allKits.map((k) => yearOf(k.ym)).filter((yy) => yy !== "----").map(Number);
          const yMin = Math.min(...relYears), yMax = Math.max(...relYears);
          const lineYears = [];
          for (let yy = yMin; yy <= yMax; yy++) lineYears.push(String(yy));
          const gradeYearCounts = {};
          allKits.forEach((k) => {
            const yy = yearOf(k.ym);
            if (yy === "----") return;
            const g = k.grade || "MG";
            (gradeYearCounts[g] = gradeYearCounts[g] || {})[yy] = (gradeYearCounts[g][yy] || 0) + 1;
          });
          const lineSeries = ["MG", "HG", "RG", "PG", "HIRM", "RE", "FM", "MGSD", "EXTRA"].filter((g) => gradeYearCounts[g])
            .map((g) => ({ label: g, color: gradeColors[g], points: lineYears.map((yy) => (gradeYearCounts[g][yy] || 0)) }));

          return (
            <>
              <div className="sb-band">
                <div className="sb-head">
                  <div className="sb-switch sb-static">
                    <span className="sb-eyebrow">{L("ANALYSIS · 分析","ANALYSIS","ANALYSIS · 分析")}</span>
                    <span className="sb-titlewrap">
                      <LedgerTitle scheme="slide" akey="analysis" dir={1} title={L(<>解<em>題</em>書</>,<>Analysis</>,<>解<em>題</em>書</>)} />
                    </span>
                  </div>
                  <span className="sb-head-r">
                    <button type="button" className="quiz-entry" onClick={(e) => { e.stopPropagation(); setQuizOpen(true); }}>{L("知識試験","Quiz","知識測驗")}<i>◇</i></button>
                  </span>
                </div>
                <div className="sb-rule" />
              </div>
              <section className="ana-sec">
                <div className="achv-grid">
                  {achievements.map((x) => {
                    const isNew = achvSeen && achvSeen.__b === 1 && achvSeen[x.id] !== x.key;
                    return (
                      <button key={x.id}
                        className={`achv ${isNew ? "new" : ""} ${achvPop === x.id ? "pop" : ""}`}
                        onClick={() => {
                          haptic();
                          setAchvPop(x.id);
                          setTimeout(() => setAchvPop(null), 500);
                          setAchvSeen((s) => ({ ...(s || {}), __b: 1, [x.id]: x.key }));
                        }}>
                        <span className="achv-label">{x.label}</span>
                        <b className="achv-value">{x.nameVal ? <KitName name={x.value} /> : x.value}</b>
                        {x.sub ? <small className="achv-sub">{x.sub}</small> : null}
                        {isNew && <i className="achv-dot" />}
                      </button>
                    );
                  })}
                </div>
              </section>
              {/* チャート群は切替後2フレーム目に描画(集計サマリは即時)。切替時のカク付き対策。 */}
              {gridReady && (<>
              <section className="ana-sec">
                <div className="year-head"><span className="year-num">{L("構成比","Breakdown","構成比")}</span><span className="year-rule" /><span className="year-count">{L("作品別・Grade別","By series · grade","依作品・等級")}</span></div>
                <div className="pie-wrap">
                  <Pie data={seriesData} center={L("作品別","Series","作品")} />
                  <div className="legend">
                    {seriesData.map((d) => (
                      <div className="legend-item" key={d.label}>
                        <i style={{ background: d.color }} /><span>{d.label}</span>
                        <b>{d.value}({Math.round((d.value / owned.length) * 100)}%)</b>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pie-wrap" style={{ marginTop: 20 }}>
                  <Pie data={gradeData} center={L("Grade別","Grade","等級")} />
                  <div className="legend">
                    {gradeData.map((d) => (
                      <div className="legend-item" key={d.label}>
                        <i style={{ background: d.color }} /><span>{d.label}</span>
                        <b>{d.value}({Math.round((d.value / owned.length) * 100)}%)</b>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="ana-sec">
                <div className="year-head"><span className="year-num">{L("入手年別","By acquired year","依入手年")}</span><span className="year-rule" /><span className="year-count">{L("入手数推移","Acquisitions over time","入手數推移")}</span></div>
                {yearData.length === 0
                  ? <p className="ana-note">{L("入手日が記録された機体がまだありません。","No kits with an acquired date yet.","尚無記錄入手日的機體。")}</p>
                  : (
                    <div className="bars">
                      {yearData.map((d) => (
                        <div className="bar" key={d.label}>
                          <em>{d.value}</em>
                          <i style={{ height: `${Math.max(5, (d.value / maxYear) * 108)}px` }} />
                          <span>{d.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </section>
              <section className="ana-sec">
                <div className="year-head"><span className="year-num">{L("完成年別","By completion year","依完成年")}</span><span className="year-rule" /><span className="year-count">{L("完成数推移","Completions over time","完成數推移")}</span></div>
                {buildYearData.length === 0
                  ? <p className="ana-note">{L("完成日が記録された機体がまだありません。","No kits with a completion date yet.","尚無記錄完成日的機體。")}</p>
                  : (
                    <div className="bars">
                      {buildYearData.map((d) => (
                        <div className="bar" key={d.label}>
                          <em>{d.value}</em>
                          <i style={{ height: `${Math.max(5, (d.value / maxBuildYear) * 108)}px` }} />
                          <span>{d.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </section>
              <section className="ana-sec">
                <div className="year-head"><span className="year-num">{L("発売数推移","Releases over time","發售數推移")}</span><span className="year-rule" /><span className="year-count">{L("Grade別・年間発売数","By grade · per year","依等級・年發售數")}</span></div>
                <LineChart years={lineYears} series={lineSeries} />
                <div className="legend horizontal">
                  {lineSeries.map((s) => (
                    <div className="legend-item" key={s.label}><i style={{ background: s.color }} /><span>{s.label}</span></div>
                  ))}
                </div>
              </section>
              </>)}
              <p className="footnote">{L("※ 金額は税込定価ベースの集計です(実購入額ではありません)。発売数推移のみ図鑑収録データ全体、その他は「入手済み」記録のみから算出。","* Amounts are tallied from tax-included list prices (not actual paid amounts). Only the release trend uses the full registry; everything else is computed from owned records.","* 金額以含稅定價統計(非實際購入額)。僅發售數趨勢採用全圖鑑資料，其餘均由「已入手」紀錄計算。")}</p>
            </>
          );
        })()}

        {tab === "settings" && (
          <div className="panel-wrap">
            {secWrap("profile", L("プロフィール", "Profile", "個人檔案"), "BUILDER",
              <button className="builder-line builder-tap" onClick={() => setProfileOpen(true)}>
                <span>BUILDER<b>{settings.builderName || "—"}</b></span>
                <span>{L("ガンプラ歴", "Building since", "模型資歷")}<b>{careerStr(settings.builderSince)}</b></span>
              </button>
            )}

            {secWrap("look", L("外観", "Appearance", "外観"), "APPEARANCE",
              <>
                <div className="set-sublabel">{L("言語", "Language", "語言")}</div>
                <div className="opt-group horizontal">
                  <button className={`opt ${lang === "ja" ? "on" : ""}`} onClick={() => patchSettings({ lang: "ja" })}>日本語</button>
                  <button className={`opt ${lang === "en" ? "on" : ""}`} onClick={() => patchSettings({ lang: "en" })}>English</button>
                  <button className={`opt ${lang === "zh" ? "on" : ""}`} onClick={() => patchSettings({ lang: "zh" })}>中文</button>
                </div>
                <div className="set-sublabel" style={{ marginTop: 12 }}>{L("テーマ", "Theme", "主題")}</div>
                <div className="opt-group horizontal">
                  <button className={`opt ${settings.theme !== "light" ? "on" : ""}`} onClick={() => patchSettings({ theme: "dark" })}>{L("ダーク(漆黒)", "Dark", "深色")}</button>
                  <button className={`opt ${settings.theme === "light" ? "on" : ""}`} onClick={() => patchSettings({ theme: "light" })}>{L("ライト(生成り)", "Light", "淺色")}</button>
                </div>
                <div className="set-sublabel" style={{ marginTop: 12 }}>{L("触覚フィードバック", "Haptics", "觸覺回饋")}</div>
                <div className="opt-group horizontal">
                  <button className={`opt ${settings.haptic !== false ? "on" : ""}`} onClick={() => { patchSettings({ haptic: true }); setHapticEnabled(true); haptic(); }}>{L("オン", "On", "開")}</button>
                  <button className={`opt ${settings.haptic === false ? "on" : ""}`} onClick={() => patchSettings({ haptic: false })}>{L("オフ", "Off", "關")}</button>
                </div>
              </>
            )}

            {secWrap("disp", L("表示", "Display", "顯示"), "DISPLAY",
              <>
                <div className="set-sublabel">{L("表示する項目(カード/リスト別に設定)", "Fields to show (set per view)", "顯示項目(卡片/列表分別設定)")}</div>
                <div className="opt-group horizontal">
                  <button className={`opt ${dispTarget === "card" ? "on" : ""}`} onClick={() => setDispTarget("card")}>{L("カード", "Card", "卡片")}</button>
                  <button className={`opt ${dispTarget === "list" ? "on" : ""}`} onClick={() => setDispTarget("list")}>{L("リスト", "List", "列表")}</button>
                </div>
                <div className="opt-group" style={{ marginTop: 8 }}>
                  {(dispTarget === "card"
                    ? [
                        ["compact", L("コンパクト表示", "Compact", "緊湊顯示")],
                        ["showGrade", L("グレードを表示", "Show grade", "顯示等級")],
                        ["showYm", L("発売年月を表示", "Show release date", "顯示發售年月")],
                        ["showNo", L("No.番号を表示", "Show No.", "顯示編號")],
                        ["showCode", L("型式番号を表示", "Show model code", "顯示型式番號")],
                        ["showPrice", L("定価を表示", "Show price", "顯示定價")],
                        ["showSeries", L("作品名を表示", "Show series", "顯示作品名")],
                      ]
                    : [
                        ["listTags", L("分類CHIPSを表示", "Show category chips", "顯示分類標籤")],
                        ["listGrade", L("グレードを表示", "Show grade", "顯示等級")],
                        ["listSeries", L("作品名を表示", "Show series", "顯示作品名")],
                        ["listNo", L("No.番号を表示", "Show No.", "顯示編號")],
                        ["listCode", L("型式番号を表示", "Show model code", "顯示型式番號")],
                        ["listPrice", L("定価を表示", "Show price", "顯示定價")],
                        ["listPurchase", L("入手日を表示", "Show acquired date", "顯示入手日")],
                        ["listBuild", L("完成日を表示", "Show completion date", "顯示完成日")],
                      ]
                  ).map(([key, label]) => (
                    <button key={key} className="opt toggle" onClick={() => patchSettings((s) => ({ [key]: !s[key] }))}>
                      <span>{label}</span>
                      <i className={`switch ${settings[key] ? "on" : ""}`}><b /></i>
                    </button>
                  ))}
                </div>
                <div className="opt-group" style={{ marginTop: 8 }}>
                  <button className="opt toggle" onClick={() => patchSettings((s) => ({ hfPin: !s.hfPin }))}>
                    <span>{L("報頭を収合のまま固定(頂端でも自動展開しない)", "Keep masthead collapsed after first collapse", "報頭收合後固定(不自動展開)")}</span>
                    <i className={`switch ${settings.hfPin ? "on" : ""}`}><b /></i>
                  </button>
                  <button className="opt toggle" onClick={() => patchSettings((s) => ({ dimUnowned: !s.dimUnowned }))}>
                    <span>{L("未入手を淡色表示(共通)", "Dim un-owned kits", "未入手淡色顯示")}</span>
                    <i className={`switch ${settings.dimUnowned ? "on" : ""}`}><b /></i>
                  </button>
                </div>
              </>
            )}

            {secWrap("ai", L("AI画像生成", "AI Imaging", "AI 影像生成"), "IMAGE AI",
              <div className="opt-group">
                <label className="fld pad"><span>{L("Gemini APIキー(この端末にのみ保存)","Gemini API key (stored on this device only)","Gemini API 金鑰(僅存於此裝置)")}</span>
                  <input type="password" value={settings.geminiKey || ""} placeholder="AIza..."
                    onChange={(e) => patchSettings({ geminiKey: e.target.value })} />
                </label>
                <label className="fld pad"><span>{L("OpenAI APIキー(この端末にのみ保存)","OpenAI API key (stored on this device only)","OpenAI API 金鑰(僅存於此裝置)")}</span>
                  <input type="password" value={settings.openaiKey || ""} placeholder="sk-..."
                    onChange={(e) => patchSettings({ openaiKey: e.target.value })} />
                </label>
                <label className="fld pad"><span>{L("AI 代理 URL(設定すると代理経由・端末キー不要)","AI proxy URL (routes AI via your proxy; device keys not needed)","AI 代理 URL(設定後經代理呼叫,免端末金鑰)")}</span>
                  <input type="url" value={settings.aiProxyUrl || ""} placeholder="https://gunpla-ai-proxy.xxxx.workers.dev"
                    onChange={(e) => patchSettings({ aiProxyUrl: e.target.value })} />
                </label>
                <label className="fld pad"><span>{L("AI 代理トークン(この端末にのみ保存)","AI proxy token (stored on this device only)","AI 代理權杖(僅存於此裝置)")}</span>
                  <input type="password" value={settings.aiProxyToken || ""} placeholder="token"
                    onChange={(e) => patchSettings({ aiProxyToken: e.target.value })} />
                </label>
                <label className="fld pad"><span>{L("画像生成モデル(選択した提供元のキーを使用)","Image model (uses the selected provider's key)","影像生成模型(使用所選供應商金鑰)")}</span>
                  <Picker value={settings.geminiModel || "gemini-3-pro-image"} onChange={(v) => patchSettings({ geminiModel: v })} groups={AI_MODELS} />
                </label>
                <div className="fld pad"><span>{L("スタイル別プロンプト(タップで編集・点灯=カスタム済み)","Per-style prompts (tap to edit · lit = customized)","各風格提示詞(點擊編輯・亮起=已自訂)")}</span>
                  <div className="prompt-chips">
                    {AI_STYLES.map((s) => (
                      <button key={s.id} className={`opt ${settings.aiPrompts && settings.aiPrompts[s.id] ? "on" : ""}`}
                        onClick={() => setPromptEdit(s.id)}>{s.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {managedOn() && secWrap("account", L("アカウント", "Account", "帳號"), "ACCOUNT",
              <div className="opt-group">
                {auth.user ? (
                  <>
                    <p className="ana-note">{L("ログイン中:", "Signed in: ", "已登入:") + (auth.user.email || auth.user.id)}</p>
                    {syncMsg && <p className="ana-note">{syncMsg}</p>}
                    <button className="opt" onClick={syncNow}><span>{L("今すぐ同期", "Sync now", "立即同步")}</span><i>⇅</i></button>
                    <button className="opt" onClick={async () => { await auth.signOut(); setAcctPhase("email"); setAcctCode(""); notify(L("ログアウトしました(データは端末に残ります)", "Signed out (data remains on this device)", "已登出(資料仍保留在裝置)"), { kind: "ok" }); }}>
                      <span>{L("ログアウト", "Sign out", "登出")}</span><i>→</i></button>
                    <button className="opt" onClick={async () => {
                      if (!(await appConfirm(
                        L("アカウントを削除します。クラウド上の同期データも完全に削除され、元に戻せません。(端末内のデータは残ります)",
                          "Delete your account. Cloud sync data will be permanently erased. This cannot be undone. (Local data stays on this device.)",
                          "將刪除帳號。雲端同步資料將被永久刪除且無法復原。(裝置內資料會保留)"),
                        { title: L("アカウント削除", "Delete account", "刪除帳號"), okText: L("削除する", "Delete", "刪除"), cancelText: L("やめる", "Cancel", "取消"), danger: true }))) return;
                      try { await auth.removeAccount(); notify(L("アカウントを削除しました", "Account deleted", "帳號已刪除"), { kind: "ok" }); }
                      catch (e) { notify(L("削除に失敗しました:", "Deletion failed: ", "刪除失敗:") + ((e && e.message) || e), { kind: "warn", dur: 4200 }); }
                    }}><span>{L("アカウント削除(取り消し不可)", "Delete account (permanent)", "刪除帳號(不可復原)")}</span><i>✕</i></button>
                  </>
                ) : (
                  <>
                    <p className="ana-note">{L("メールの6桁コードでログイン。複数端末のデータが同じアカウントに同期されます。",
                      "Sign in with a 6-digit email code. Your data syncs across devices under one account.",
                      "以電子郵件 6 位數驗證碼登入。多裝置資料將同步至同一帳號。")}</p>
                    <label className="fld pad"><span>{L("メールアドレス", "Email", "電子郵件")}</span>
                      <input type="email" inputMode="email" autoComplete="email" value={acctEmail} placeholder="you@example.com"
                        onChange={(e) => setAcctEmail(e.target.value)} />
                    </label>
                    {acctPhase === "code" && (
                      <label className="fld pad"><span>{L("6桁コード", "6-digit code", "6 位數驗證碼")}</span>
                        <input inputMode="numeric" autoComplete="one-time-code" value={acctCode} placeholder="123456"
                          onChange={(e) => setAcctCode(e.target.value)} />
                      </label>
                    )}
                    <button className="opt" disabled={auth.authBusy} onClick={async () => {
                      if (acctPhase === "email") { if (await auth.startSignIn(acctEmail, L)) setAcctPhase("code"); }
                      else { if (await auth.confirmCode(acctEmail, acctCode, L)) { setAcctCode(""); setAcctPhase("email"); notify(L("ログインしました", "Signed in", "已登入"), { kind: "ok" }); } }
                    }}><span>{auth.authBusy ? L("処理中…", "Working…", "處理中…") : acctPhase === "email" ? L("コードを送信", "Send code", "寄送驗證碼") : L("ログイン", "Sign in", "登入")}</span><i>→</i></button>
                    {auth.authMsg && <p className="ana-note">{auth.authMsg}</p>}
                  </>
                )}
              </div>
            )}

            {!managedOn() && secWrap("cloud", L("クラウド同期", "Cloud Sync", "雲端同步"), "SUPABASE",
              <div className="opt-group">
                <label className="fld pad"><span>Supabase URL</span>
                  <input value={settings.supaUrl || ""} placeholder="https://xxxx.supabase.co"
                    onChange={(e) => patchSettings({ supaUrl: e.target.value })} />
                </label>
                <label className="fld pad"><span>{L("anon キー(この端末にのみ保存)","anon key (stored on this device only)","anon 金鑰(僅存於此裝置)")}</span>
                  <input type="password" value={settings.supaKey || ""} placeholder="eyJhbGciOi..."
                    onChange={(e) => patchSettings({ supaKey: e.target.value })} />
                </label>
                <button className="opt" onClick={syncNow}><span>{L("今すぐ同期","Sync now","立即同步")}</span><i>⇅</i></button>
                <button className="opt" onClick={async () => {
                  const cfg = supaRef.current;
                  if (!cfg.url || !cfg.key) { notify(L("Supabase URL と anon キーを入力してください","Enter the Supabase URL and anon key","請輸入 Supabase URL 與 anon 金鑰"), { kind: "warn" }); return; }
                  if (!(await appConfirm(L("クラウドのデータでこの端末を上書き復元します。この端末だけの未同期の変更は失われます。", "Restore from the cloud, overwriting this device. Unsynced changes on this device only will be lost.", "以雲端資料覆寫還原此裝置。此裝置上尚未同步的變更將遺失。"), { title: L("クラウドから復元", "Restore from cloud", "從雲端還原"), okText: L("上書き復元", "Overwrite", "覆寫還原"), cancelText: L("やめる", "Cancel", "取消"), danger: true }))) return;
                  setSyncMsg(L("復元中…","Restoring…","還原中…"));
                  try {
                    const nn = await pullCloud(cfg, true);
                    setSyncMsg(L("復元完了(受信 ","Restored (",`還原完成(收到 `) + nn + L(" 件)"," items)"," 筆)"));
                  } catch (e) { setSyncMsg(L("復元エラー:","Restore error: ","還原錯誤:") + ((e && e.message) || e)); }
                }}><span>{L("クラウドから復元(上書き)","Restore from cloud (overwrite)","從雲端還原(覆寫)")}</span><i>⬇</i></button>
                {syncMsg && <p className="ana-note">{syncMsg}</p>}
                <div className="set-sublabel" style={{ marginTop: 10 }}>{L("機体データ(クラウド配信)","Catalog (cloud-delivered)","機體資料(雲端配信)")}</div>
                <label className="fld pad"><span>{L("目錄 URL(version.json / delta.json を置くベース)","Catalog base URL (hosts version.json / delta.json)","目錄 URL(放置 version.json / delta.json 的基底)")}</span>
                  <input value={settings.catalogUrl || ""} placeholder="https://cdn.jsdelivr.net/gh/<user>/<repo>@main/catalog"
                    onChange={(e) => patchSettings({ catalogUrl: e.target.value })} />
                </label>
                <button className="opt" onClick={async () => {
                  const base = (settings.catalogUrl || "").trim() || CATALOG_DEFAULT_BASE;
                  if (!base) { notify(L("目錄 URL を設定してください","Set the catalog URL first","請先設定目錄 URL"), { kind: "warn" }); return; }
                  const n = await refreshCatalog();
                  // 更新があった時は refreshCatalog 側が decree トーストを出すので、ここは「最新」のみ。
                  if (!n) notify(L("機体データは最新です", "Catalog is up to date", "機體資料已是最新"),
                    { variant: "decree", tag: L("最新", "CURRENT", "最新") });
                }}><span>{L("機体データを今すぐ確認","Check for catalog updates","立即檢查機體資料更新")}</span><i>⟳</i></button>
                {catalog && <p className="ana-note">{L("目錄版本 v","Catalog v","目錄版本 v") + catalog.catalogVersion + (catalog.generatedAt ? " · " + String(catalog.generatedAt).slice(0, 10) : "")}</p>}
                <button className="opt" onClick={() => { haptic(); setCatalogLogOpen(true); }}>
                  <span>{L("機体データ更新履歴", "Catalog changelog", "機體資料更新履歷") + (catalogLog.length ? "（" + catalogLog.length + "）" : "")}</span><i>›</i>
                </button>
                <p className="ana-note">{"App v" + APP_VERSION + " · " + ENTITLEMENTS.tier}</p>
              </div>
            )}

            {secWrap("data", L("データ管理", "Data", "資料管理"), "DATA",
              <>
                <div className="set-sublabel">{L("画像","Images","圖片")}</div>
                <div className="opt-group">
                  <button className="opt" onClick={optimizeImages}>
                    <span>{optimizing ? L("画像を再圧縮中…","Recompressing…","重新壓縮中…") : L("画像を最適化(容量削減)","Optimize images (reduce size)","最佳化圖片(減少容量)")}</span><i>▣</i>
                  </button>
                  <label className="fld" style={{ padding: "0 2px 4px" }}>
                    <span>manifest URL(kit_id → 画像URL の JSON)</span>
                    <input value={manifestUrl} placeholder="https://xxxx.supabase.co/storage/v1/object/public/kit-images/mg_images_manifest.json"
                      onChange={(e) => setManifestUrl(e.target.value)} />
                  </label>
                  <button className="opt" disabled={imgBusy} onClick={importManifest}>
                    <span>{imgBusy ? L("処理中…","Processing…","處理中…") : L("画像を一括インポート(URL参照)","Bulk import images (by URL)","批次匯入圖片(URL 參照)")}</span><i>⬇</i>
                  </button>
                  <button className="opt" disabled={imgBusy} onClick={() => localImgRef.current && localImgRef.current.click()}>
                    <span>{L("ローカル画像を一括取り込み(ファイル名=kit_id)","Bulk import local images (filename = kit_id)","批次匯入本機圖片(檔名=kit_id)")}</span><i>⊞</i>
                  </button>
                  <input ref={localImgRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                    onChange={(e) => { importLocalImages(e.target.files); e.target.value = ""; }} />
                  <button className="opt" disabled={imgBusy} onClick={precacheImages}>
                    <span>{L("オフライン用に画像を保存(プリキャッシュ)","Cache images for offline","快取圖片供離線使用")}</span><i>⤓</i>
                  </button>
                  {imgMsg && <p className="setup-note" style={{ padding: "2px 2px 0" }}>{imgMsg}</p>}
                </div>
                <div className="set-sublabel" style={{ marginTop: 12 }}>{L("バックアップ","Backup","備份")}</div>
                <div className="opt-group">
                  <button className="opt" onClick={exportData}><span>{L("データを書き出す(JSON)","Export data (JSON)","匯出資料(JSON)")}</span><i>↓</i></button>
                  <button className="opt" onClick={() => importRef.current && importRef.current.click()}><span>{L("バックアップを読み込む","Import backup","匯入備份")}</span><i>↑</i></button>
                  <input ref={importRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={importData} />
                </div>
                <p className="footnote">{L("記録・編集・追加機体・画像はすべて自動保存され、次回起動時に復元されます。アップロード画像は自動圧縮(横440px・JPEG)で保存。","Records, edits, added kits and images are auto-saved and restored next launch. Uploaded images are auto-compressed (440px wide, JPEG).","紀錄・編輯・新增機體・圖片皆自動儲存，下次啟動時還原。上傳圖片自動壓縮(寬 440px・JPEG)。")}</p>
              </>
            )}

            {secWrap("danger", L("危険区域", "Danger Zone", "危險區域"), "DANGER",
              <div className="opt-group">
                {!confirmReset ? (
                  <button className="opt danger" onClick={() => setConfirmReset(true)}>{L("収蔵記録をすべて消去…", "Erase all collection records…", "清除所有收藏紀錄…")}</button>
                ) : (
                  <div className="confirm-box">
                    <span>{L("収蔵記録(入手・購入日・完成日)を消去します。編集内容・追加機体・画像は残ります。よろしいですか?", "This erases collection records (owned, purchase & completion dates). Your edits, added kits and images are kept. Continue?", "將清除收藏紀錄(入手・購入日・完成日)。編輯內容・新增機體・圖片會保留。確定嗎?")}</span>
                    <div>
                      <button className="opt danger solid" onClick={async () => { if (await appConfirm(L("収蔵記録(入手・購入日・完成日)を完全に消去します。元に戻せません。", "Permanently erase collection records (owned, purchase & completion dates). This cannot be undone.", "將永久清除收藏紀錄(入手・購入日・完成日)，無法復原。"), { title: L("収蔵記録を消去", "Erase records", "清除收藏紀錄"), okText: L("消去する", "Erase", "清除"), cancelText: L("やめる", "Cancel", "取消"), danger: true })) setRecords({}); setConfirmReset(false); }}>{L("消去する", "Erase", "清除")}</button>
                      <button className="opt" onClick={() => setConfirmReset(false)}>{L("やめる", "Cancel", "取消")}</button>
                    </div>
                  </div>
                )}
              </div>
            , true)}

            {secWrap("feedback", L("問題報告・ご要望", "Feedback", "問題回報・建議"), "FEEDBACK",
              <>
                <div className="opt-group">
                  {[
                    [L("バグ報告","Bug report","錯誤回報"), "⚠", L("不具合・バグを報告する","Report a bug or issue","回報問題或錯誤")],
                    [L("改善提案","Suggestion","改善建議"), "✎", L("改善のご提案を送る","Send a suggestion","提出改善建議")],
                  ].map(([label, icon, desc]) => (
                    <button key={label} className="opt" onClick={() => {
                      const subject = encodeURIComponent("【" + label + "】ガンプラ大図鑑");
                      window.location.href = "mailto:kishoujpjp@gmail.com?subject=" + subject;
                    }}>
                      <span>{desc}</span><i>{icon}</i>
                    </button>
                  ))}
                  <button className="opt" onClick={() => setFixOpen(true)}>
                    <span>{L("機体情報の修正を提案する","Suggest a kit-info fix","提議修正機體資訊")}</span><i>✑</i>
                  </button>
                </div>
                <p className="footnote">{L("タップするとメールアプリが開きます。件名のタグはそのままで、本文にご記入のうえ送信してください。","Tapping opens your mail app. Keep the subject tag and write your message in the body before sending.","點擊會開啟郵件 app。請保留主旨標籤，於內文填寫後寄出。")}</p>
              </>
            )}
          </div>
        )}
        </div>
      </main>

      {fixOpen && <KitFixModal allKits={allKits} onClose={() => setFixOpen(false)} L={L} />}
      {quizOpen && <QuizModal allKits={allKits} getRec={getRec} images={images} extras={extras} albumMeta={albumMeta} builderName={settings.builderName} onClose={() => setQuizOpen(false)} L={L} />}
      {identifyOpen && <KitIdentifyModal allKits={allKits} geminiKey={settings.geminiKey} openaiKey={settings.openaiKey} proxy={aiProxyCfg} cameraMode={identifyCam} onAttach={attachPhoto} onClose={() => setIdentifyOpen(false)} onManual={() => { setIdentifyOpen(false); setAdding("zukan"); }} L={L} />}

      {sortMenuOpen && (
        <div className="modal-bg" onClick={() => setSortMenuOpen(false)} style={{ zIndex: 94 }}>
          <div className="sort-menu" onClick={(e) => e.stopPropagation()}>
            <div className="sort-menu-head">並び替え<span>SORT</span></div>
            {SORT_MENU.map((k) => (
              <button key={k} className={"sort-menu-item" + (sortKey === k ? " on" : "")}
                onClick={() => { haptic(); setSortKey(k); setSortMenuOpen(false); }}>
                <span className="sort-menu-ico">{SORT_ICON[k]}</span>
                <span className="sort-menu-lbl">{sortLabel[k]}</span>
                {sortKey === k && <span className="sort-menu-chk">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 詳細 / 編輯彈窗 ── */}
      {ownConfirm && (
        <div className="modal-bg confirm-bg" onClick={() => setOwnConfirm(null)} style={{ zIndex: 90 }}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon" style={{ color: "var(--shu)" }}>✦</div>
            <div className="confirm-title">{L("入手記録を解除しますか?", "Clear owned status?", "解除入手紀錄?")}</div>
            <div className="confirm-name">{ownConfirm.name}</div>
            <div className="confirm-btns">
              <button className="btn" onClick={() => setOwnConfirm(null)}>{L("やめる", "Cancel", "取消")}</button>
              <button className="btn primary" onClick={() => { toggleOwned(ownConfirm.id); setOwnConfirm(null); }}>{L("解除する", "Clear", "解除")}</button>
            </div>
          </div>
        </div>
      )}

      {viewer && (() => {
        let flat = viewerFlat;
        let gi = flat.findIndex((s) => s.kitId === viewer.kitId && s.ref === viewer.ref);
        if (gi < 0) { // 現在機体が現ビューに無い場合は単独で構成
          const k0 = allKits.find((k) => k.id === viewer.kitId) || {};
          const refs = albumRefs(viewer.kitId, images, extras, albumMeta).filter((ref) => refSrc(ref, viewer.kitId, images, extras));
          flat = refs.length
            ? refs.map((ref) => ({ kitId: viewer.kitId, ref, name: k0.name || "", code: k0.code, no: k0.no, series: k0.series }))
            : [{ kitId: viewer.kitId, ref: null, name: k0.name || "", code: k0.code, no: k0.no, series: k0.series }];
          gi = Math.max(0, flat.findIndex((s) => s.ref === viewer.ref));
        }
        if (!flat.length) { setTimeout(() => { setViewer(null); setViewerDel(false); }, 0); return null; }
        const slide = flat[gi];
        const curKitId = slide.kitId, curRef = slide.ref;
        const vfrom = viewer.from; // "salon"=繪測卷へ復帰(入手ページは開かない) / それ以外=入手ページへ
        const close = () => { viewerGuard.current = Date.now(); setViewer(null); setViewerDel(false); setSerifEdit(null); if (vfrom !== "salon") { setDetail(curKitId); setEditing(false); } };
        const curAlbum = kitAlbum(curKitId);
        const aIdx = Math.max(0, curAlbum.findIndex((a) => a.ref === curRef));
        const thumbRef = pickRef("thumb", curKitId, images, extras, albumMeta);
        const acqRef = pickRef("acquire", curKitId, images, extras, albumMeta);
        const curSerif = curRef ? (serifs[curRef] || "") : "";
        const saveSerif = () => {
          const t = serifEdit.text || ""; // トリムせず空白・記号もそのまま保存
          // 台詞ごとに時戳付け。削除は空文字を新時戳で書き、別端末へ「クリア」を伝播させる(読取側は serifs[ref]||"" なので無害)。
          setSerifs((m) => stampRec(m, { [serifEdit.ref]: t.length ? t : "" }, new Date().toISOString()));
          setSerifEdit(null);
        };
        return (
          <div className="viewer-bg" onClick={close}>
            <SwipeViewer slides={flat} index={gi} resetKey={String(curRef)}
              resolveSrc={(sl) => (sl.ref ? (viewerOrig[sl.kitId + "/" + sl.ref] || refSrc(sl.ref, sl.kitId, images, extras)) : null)}
              serifOf={(sl) => (sl.ref ? (serifs[sl.ref] || "") : "")}
              onSerif={(sl) => { if (sl.ref) setSerifEdit({ ref: sl.ref, text: serifs[sl.ref] || "" }); }}
              onIndex={(i) => { setViewerDel(false); setSerifEdit(null); setViewer({ kitId: flat[i].kitId, ref: flat[i].ref, from: vfrom }); }}
              L={L} onClose={() => { swallowNextClick(); close(); }}
              onLongPress={() => { hapticStrong(); swallowNextClickOnRelease(); viewerGuard.current = Date.now(); setViewerDel(false); setSerifEdit(null); setViewer(null); setDetail(curKitId); setEditing(false); }} />

            {serifEdit && (
              <div className="serif-edit-bg" onClick={(e) => { e.stopPropagation(); setSerifEdit(null); }}>
                <div className="serif-edit" onClick={(e) => e.stopPropagation()}>
                  <textarea className="se-input" autoFocus value={serifEdit.text} maxLength={120} rows={3}
                    onChange={(e) => setSerifEdit((s) => ({ ...s, text: e.target.value }))}
                    placeholder={L("台詞を入力(改行・空白・記号もそのまま反映)","Enter caption (line breaks & symbols kept as-is)","輸入台詞(換行・空白・符號原樣保留)")} />
                  <div className="se-btns">
                    <button className="btn" onClick={() => setSerifEdit(null)}>{L("取消","Cancel","取消")}</button>
                    <button className="btn solid" onClick={saveSerif}>{L("保存","Save","儲存")}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {imgEdit && (() => {
        const ek = allKits.find((k) => k.id === imgEdit);
        if (!ek) return null;
        return (
          <ImageEditorModal kit={ek} images={images} extras={extras} albumMeta={albumMeta} builderName={settings.builderName}
            resolveOrig={(ref) => resolveOrigDataURL(imgEdit, ref)}
            initialCols={settings.ieCols === 3 ? 3 : 2} onCols={(n) => patchSettings({ ieCols: n })}
            ai={{ geminiKey: settings.geminiKey, openaiKey: settings.openaiKey, proxy: aiProxyCfg, model: settings.geminiModel, prompts: settings.aiPrompts, style: settings.aiStyle, onModel: (m) => patchSettings({ geminiModel: m }), onStyle: (st) => patchSettings({ aiStyle: st }) }}
            onAddImage={(src, meta) => addAlbumImage(imgEdit, src, meta)}
            onRemoveImage={(ref) => removeAlbumImage(imgEdit, ref)}
            onSetRole={(ref, role) => setAlbumRole(imgEdit, ref, role)}
            onFrame={(ref) => setFrameEdit({ kitId: imgEdit, ref })}
            onReorder={(order) => setAlbumOrder(imgEdit, order)}
            onSetLoc={(ref, loc) => setImgLoc(imgEdit, ref, loc)}
            onBack={(depth, closeTop) => { atelierCloseRef.current = closeTop; setAtelierDepth(depth); }}
            onClose={() => setImgEdit(null)} L={L} />
        );
      })()}

      {frameEdit && (() => {
        const src = refSrc(frameEdit.ref, frameEdit.kitId, images, extras);
        if (!src) { setTimeout(() => setFrameEdit(null), 0); return null; }
        return (
          <FramingEditor src={src} initial={framingOf(frameEdit.kitId, frameEdit.ref)} L={L}
            onCancel={() => setFrameEdit(null)}
            onSave={(fr) => { setFraming(frameEdit.kitId, frameEdit.ref, fr); setFrameEdit(null); }} />
        );
      })()}

      <SeriesPicker open={seriesPickerOpen} value={adv.series} options={seriesList}
        onPick={(v) => { setAdv((a) => ({ ...a, series: v })); setSeriesPickerOpen(false); }}
        onClose={() => setSeriesPickerOpen(false)} L={L} />

      <UniPicker open={uniPickerOpen} value={adv.uni} options={UNI_PICK}
        onPick={(v) => { setAdv((a) => ({ ...a, uni: v })); setUniPickerOpen(false); }}
        onClose={() => setUniPickerOpen(false)} L={L} />

      {detailKit && (
        <div className="modal-bg" onClick={() => { if (!editing) closeDetail(); }}>
          <div className="modal dc-modal" onClick={(e) => e.stopPropagation()}>
            {!editing && <button className="dc-x" onClick={(e) => { e.stopPropagation(); closeDetail(); }} aria-label={L("閉じる","Close","關閉")}>✕</button>}
            {!editing ? (
              <>
                <div className="dc-head">
                  <div className="dc-eye dc-eye-tags">
                    <GradeChip grade={detailKit.grade} />
                    {detailKit.base && <span className="line-chip base">{L("ベース","Base","基地")}</span>}
                    {lineBadge(detailKit)}
                    {detailEyeNo && <span className="dc-eye-no">{detailEyeNo}</span>}
                  </div>
                  <div className="dc-name"><KitName name={detailKit.name} /></div>
                  <div className="dc-rule" />
                </div>
                <div className={"dc-art" + (acquireSrc(detailKit.id) ? " has-photo" : " blank") + (detailRec.owned ? " owned" : "")}>
                  {acquireSrc(detailKit.id)
                    ? <div className="dc-frame" onClick={() => openViewer(detailKit.id)}>
                        <img src={acquireSrc(detailKit.id)} alt={detailKit.name} className="kit-img tc" draggable={false}
                          loading="lazy" decoding="async" style={acqFrameStyle(detailKit.id)} />
                      </div>
                    : <div className="dc-classified">
                        <span className="dc-tick tl" /><span className="dc-tick tr" /><span className="dc-tick bl" /><span className="dc-tick br" />
                        <span className="dc-unid">UNIDENTIFIED</span>
                        <span className="dc-unsub">NO VISUAL ON FILE</span>
                        <span className="dc-unref">REF · {detailKit.code || (detailKit.no !== "—" ? "No." + detailKit.no : "—")}</span>
                      </div>}
                  <button className="dc-frame-btn" onClick={(e) => { e.stopPropagation(); setImgEdit(detailKit.id); }}>
                    <svg className="bico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l5 5-9 9-5-5z" /><path d="M7 12l-2.5 2.5a2.1 2.1 0 0 0 3 3L10 15" /></svg>
                    {L("編集","Edit","編輯")}
                  </button>
                </div>
                <div className="dc-spec">
                  <div className="dc-srow"><span className="dc-k">{L("原作", "Series", "原作")}</span><span className="dc-v dc-v-series">
                    {detailKit.series
                      ? <button className="dc-link dc-series" onClick={() => jumpToSeries(detailKit.series)}>{detailKit.series}</button>
                      : "—"}
                  </span></div>
                  <div className="dc-srow dc-srow-duo">
                    <span className="dc-k">{L("発売", "Release", "發售")}</span>
                    <span className="dc-v dc-duo-rel">{detailKit.ym
                      ? <button className="dc-link dc-gold" onClick={() => jumpToYear(detailKit.ym.slice(0, 4))}>{detailKit.ym.replace("-", ".")}</button>
                      : <span className="dc-gold">—</span>}</span>
                    <span className="dc-k dc-k2">{L("定価", "Price", "定價")}</span>
                    <span className="dc-v dc-v-status dc-duo-price">
                      <span className="dc-mono">{detailKit.price ? fmtYen(detailKit.price) : "—"}</span>
                      <span className="rec-pill-cell">
                        <button type="button" className={`rec-pill ${pillState}`} onClick={() => setPillOpen((o) => !o)} aria-expanded={pillOpen}>
                          <span className={`dc-statdot ${pillState}`} />{PILL_LABEL[pillState]}<span className="rec-chev">▾</span>
                        </button>
                        <span className={`rec-pop ${pillOpen ? "open" : ""}`}>
                          {PILL_MENU[pillState].map((v) => (
                            <button key={v} type="button" className="rec-pop-opt" onClick={() => applyPill(v)}><span className={`dc-statdot ${v}`} />{PILL_LABEL[v]}</button>
                          ))}
                        </span>
                      </span>
                    </span>
                  </div>
                  {detailRec.owned && (
                    <div className="dc-srow dc-srow-duo">
                      <span className="dc-k">{L("入手", "Acquired", "入手")}</span>
                      <span className="dc-v dc-duo-rel">{detailRec.purchaseDate
                        ? <span className="rec-dateval">{fmtDate(detailRec.purchaseDate)}</span>
                        : <DateSetField ph={L("日付", "Date", "日期")} onPick={(v) => setRec(detailKit.id, { purchaseDate: v, owned: true, plan: false })} />}</span>
                      <span className="dc-k dc-k2">{L("完成", "Done", "完成")}</span>
                      <span className="dc-v dc-duo-price">{detailRec.buildDate
                        ? <span className="rec-dateval done">{fmtDate(detailRec.buildDate)}</span>
                        : pillState === "done"
                          ? <DateSetField ph={L("日付", "Date", "日期")} cls="done" onPick={(v) => setRec(detailKit.id, { buildDate: v, owned: true, plan: false })} />
                          : <span className="rec-dateval">—</span>}</span>
                    </div>
                  )}
                  <div className="dc-srow dc-srow-tag"><span className="dc-k">{L("タグ", "Tags", "標籤")}</span><span className="dc-v"><TagField tags={getTags(detailKit.id)} onCommit={(next) => setTags(detailKit.id, next)} enterOnLongPress onTagTap={jumpToTag} L={L} /></span></div>
                  <div className="dc-srow dc-srow-memo"><span className="dc-k">{L("メモ", "Memo", "備註")}</span><span className="dc-v"><NoteField note={detailKit.note} onCommit={(v) => setNote(detailKit, v)} enterOnLongPress L={L} /></span></div>
                </div>

                <button className="edit-link" onClick={() => setEditing(true)}>{L("✎ 機体情報を編集", "✎ Edit kit info", "✎ 編輯機體資訊")}</button>
              </>
            ) : (
              <>
                <div className="modal-form-head">
                  <span>{L("機体情報の編集", "Edit kit", "編輯機體")} <span className="sm-eyebrow">EDIT</span></span>
                  <button className="modal-x static" onClick={() => setEditing(false)}>✕</button>
                </div>
                <KitForm
                  seriesOptions={seriesOptions}
                  ai={{ geminiKey: settings.geminiKey, openaiKey: settings.openaiKey, proxy: aiProxyCfg, model: settings.geminiModel, prompts: settings.aiPrompts, style: settings.aiStyle, onModel: (m) => patchSettings({ geminiModel: m }), onStyle: (st) => patchSettings({ aiStyle: st }) }}
                  initial={detailKit}
                  currentImg={images[detailKit.id]}
                  album={kitAlbum(detailKit.id)}
                  onEditImages={() => setImgEdit(detailKit.id)}
                  onAddImage={(src, meta) => addAlbumImage(detailKit.id, src, meta)}
                  onRemoveImage={(ref) => removeAlbumImage(detailKit.id, ref)}
                  onSetRole={(ref, role) => setAlbumRole(detailKit.id, ref, role)}
                  onFrame={(ref) => setFrameEdit({ kitId: detailKit.id, ref })}
                  thumbRef={pickRef("thumb", detailKit.id, images, extras, albumMeta)}
                  acqRef={pickRef("acquire", detailKit.id, images, extras, albumMeta)}
                  maxImgs={MAX_IMGS_PER_KIT}
                  tags={getTags(detailKit.id)}
                  onTags={(next) => setTags(detailKit.id, next)}
                  isCustom={detailKit.line === "CUSTOM"}
                  recInitial={detailRec.owned ? detailRec : null}
                  onSaveRec={(dates) => {
                    const patch = { ...dates };
                    if (dates.purchaseDate || dates.buildDate) { patch.owned = true; patch.plan = false; }
                    setRec(detailKit.id, patch);
                  }}
                  onSave={(v, img) => saveEdit(detailKit, v, img)}
                  onCancel={() => setEditing(false)}
                  onDelete={() => deleteCustom(detailKit.id)}
                  L={L}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 新增機體彈窗 ── */}
      {adding && (
        <div className="modal-bg">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-head">
              <span>{L("機体を追加", "Add a kit", "新增機體")}</span>
              <button className="modal-x static" onClick={() => setAdding(false)}>✕</button>
            </div>
            <KitForm seriesOptions={seriesOptions} ai={{ geminiKey: settings.geminiKey, openaiKey: settings.openaiKey, proxy: aiProxyCfg, model: settings.geminiModel, prompts: settings.aiPrompts, style: settings.aiStyle, onModel: (m) => patchSettings({ geminiModel: m }), onStyle: (st) => patchSettings({ aiStyle: st }) }} initial={{}} currentImg={null} isCustom={false}
              onSave={saveNew} onCancel={() => setAdding(false)} L={L} />
          </div>
        </div>
      )}

      {/* ── 初期復元彈窗 ── */}
      {setupOpen && (
        <div className="modal-bg">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-head">
              <span>{L("クラウドから復元","Restore from cloud","從雲端還原")}</span>
              <button className="modal-x static" onClick={() => setSetupOpen(false)}>✕</button>
            </div>
            <p className="setup-note">{L("この端末の図鑑データは空です。Supabase の接続情報を入力すると、クラウドに保存済みのコレクション(記録・編集・画像)を復元できます。初めて使う場合は「新規ではじめる」を選んでください。","This device has no registry data yet. Enter your Supabase connection to restore a collection saved in the cloud (records, edits, images). First time? Choose “Start fresh”.","此裝置尚無圖鑑資料。填入 Supabase 連線資訊可還原雲端已存的收藏(紀錄・編輯・圖片)。初次使用請選「全新開始」。")}</p>
            <label className="fld pad"><span>Supabase URL</span>
              <input value={settings.supaUrl || ""} placeholder="https://xxxx.supabase.co"
                onChange={(e) => patchSettings({ supaUrl: e.target.value })} />
            </label>
            <div style={{ height: 8 }} />
            <label className="fld pad"><span>{L("anon キー","anon key","anon 金鑰")}</span>
              <input type="password" value={settings.supaKey || ""} placeholder="eyJhbGciOi..."
                onChange={(e) => patchSettings({ supaKey: e.target.value })} />
            </label>
            {setupMsg && <p className="ana-note">{setupMsg}</p>}
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={setupBusy} onClick={setupSync}>{setupBusy ? L("同期中…","Syncing…","同步中…") : L("同期して復元","Sync & restore","同步並還原")}</button>
              <button className="btn" disabled={setupBusy} onClick={() => setSetupOpen(false)}>{L("新規ではじめる","Start fresh","全新開始")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── プロフィール編集彈窗 ── */}
      {profileOpen && (
        <div className="modal-bg">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-head">
              <span>{L("プロフィール編集","Edit profile","編輯個人檔案")}</span>
              <button className="modal-x static" onClick={() => setProfileOpen(false)}>✕</button>
            </div>
            <label className="fld pad"><span>{L("Builder名","Builder name","Builder 名稱")}</span>
              <input value={settings.builderName || ""} placeholder={L("あなたの名前 / ID","Your name / ID","你的名字 / ID")}
                onChange={(e) => patchSettings({ builderName: e.target.value })} />
            </label>
            <div style={{ height: 8 }} />
            <label className="fld pad"><span>{L("ガンプラ歴 開始日","Building since","模型資歷起始日")}</span>
              <DateSetField value={settings.builderSince || ""} ph={L("タップで選択", "Tap to set", "點擊選擇")} clearLabel={L("クリア", "Clear", "清除")} onPick={(v) => patchSettings({ builderSince: v })} />
            </label>
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => setProfileOpen(false)}>{L("保存して閉じる","Save & close","儲存並關閉")}</button>
            </div>
            <p className="ai-note">{L("変更は自動保存されます。","Changes save automatically.","變更會自動儲存。")}</p>
          </div>
        </div>
      )}

      {/* ── 提示詞編輯彈窗 ── */}
      {promptEdit && (
        <div className="modal-bg" onClick={() => setPromptEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-head">
              <span>{L("プロンプト編集:","Edit prompt: ","編輯提示詞:")}{AI_STYLES.find((s) => s.id === promptEdit).label}</span>
              <button className="modal-x static" onClick={() => setPromptEdit(null)}>✕</button>
            </div>
            <textarea className="prompt-ta" rows={9}
              value={(settings.aiPrompts && settings.aiPrompts[promptEdit]) != null
                ? settings.aiPrompts[promptEdit]
                : AI_STYLES.find((s) => s.id === promptEdit).prompt}
              onChange={(e) => patchSettings((s) => ({ aiPrompts: { ...(s.aiPrompts || {}), [promptEdit]: e.target.value } }))} />
            <div className="form-actions">
              <button className="btn primary" onClick={() => setPromptEdit(null)}>{L("保存して閉じる","Save & close","儲存並關閉")}</button>
              <button className="btn" onClick={() => patchSettings((s) => {
                const ap = { ...(s.aiPrompts || {}) };
                delete ap[promptEdit];
                return { aiPrompts: ap };
              })}>{L("初期値に戻す","Reset to default","回復預設")}</button>
            </div>
            <p className="ai-note">{L("変更は自動保存されます。「初期値に戻す」で標準プロンプトに復帰。","Changes save automatically. “Reset to default” restores the standard prompt.","變更會自動儲存。「回復預設」可還原標準提示詞。")}</p>
          </div>
        </div>
      )}

      {/* ── 称号 詳細モーダル ── */}
      {titleDetail && (() => {
        const t = titleDetail;
        const ach = ACHIEVEMENTS.find((a) => a.id === t.id);
        const ex = ach ? explainAchievement(ach, allKits, getRec) : null;
        const jump = (id) => { setTitleReturn(t); setTitleDetail(null); setEditing(false); setDetail(id); };
        return (
          <div className="modal-bg" onClick={() => setTitleDetail(null)}>
            <div className="modal title-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-form-head">
                <span>{t.tier === 2 ? L("金章 — 全入手・全完成","Gold — all owned & built","金章 — 全入手・全完成") : t.tier === 1 ? L("銀章 — 全入手","Silver — all owned","銀章 — 全入手") : L("称号の条件","Title requirements","稱號條件")}</span>
                <button className="modal-x static" onClick={() => setTitleDetail(null)}>✕</button>
              </div>
              <div className="tm-head">
                <span className={"av-medal big " + (t.tier === 2 ? "gold" : t.tier === 1 ? "silver" : "locked")}><Emblem universe={t.universe || "UC"} tier={t.tier} /></span>
                <div className="tm-headbody">
                  <div className="tm-name">{achName(t)}</div>
                  <div className="tm-sub">{achSub(t)}</div>
                  {!t.unlocked && t.need > 1 && (
                    <div className="title-foot" style={{ marginTop: 8 }}>
                      <div className="hp-track"><i style={{ width: `${Math.round(t.cur / t.need * 100)}%` }} /></div>
                      <span className="title-need">{t.cur}/{t.need}</span>
                    </div>
                  )}
                </div>
              </div>

              {ex && ex.kind === "combo" && (
                <div className="tm-cond">
                  {ex.pieces.map((p, i) => (
                    <div key={i} className={"tm-piece" + (p.satisfied ? " ok" : "")}>
                      <i className="tm-mark">{p.satisfied ? "✓" : "✗"}</i>
                      {p.satisfied
                        ? <button className="tm-pname own-link" onClick={() => jump(p.owned.id)}><span className="tm-cn">{p.owned.name}</span><b className="tm-tag own">{L("所持","Owned","持有")}</b></button>
                        : <div className="tm-cands">
                            {p.candidates.slice(0, 4).map((c) => (
                              <button key={c.id} className="tm-cand" onClick={() => jump(c.id)}>
                                <span className="tm-cn">{c.name}</span>
                                {c.owned ? <b className="tm-tag own">{L("所持","Owned","持有")}</b> : <b className="tm-tag">{L("未所持","Not owned","未持有")}</b>}
                              </button>
                            ))}
                            {p.candidates.length > 4 && <span className="tm-more2">{L("ほか","+","其他 ")}{p.candidates.length - 4}{L("機が該当"," more match"," 機符合")}</span>}
                          </div>}
                    </div>
                  ))}
                  {ex.countPieces.map((cp, i) => (
                    <div key={"cp" + i} className={"tm-piece" + (cp.have.length >= cp.need ? " ok" : "")}>
                      <i className="tm-mark">{cp.have.length >= cp.need ? "✓" : "✗"}</i>
                      <span className="tm-pname">{L("ミッションパック等","Mission packs etc.","任務包等")} <b className="tm-cnt">{cp.have.length}/{cp.need}</b></span>
                    </div>
                  ))}
                </div>
              )}

              {ex && ex.kind === "count" && (() => {
                const remain = Math.max(0, ex.need - ex.have.length);
                const more = ex.candidates.filter((c) => !c.owned).slice(0, 8);
                return (
                  <div className="tm-cond">
                    <div className="tm-countbar"><b>{ex.have.length}</b> / {ex.need}{remain > 0 ? L("\u3000あと" + remain, "\u2003" + remain + " left", "\u3000還差" + remain) : L("\u3000達成", "\u2003Done", "\u3000達成")}</div>
                    {ex.have.slice(0, 30).map((c) => (
                      <button key={c.id} className="tm-cand row ok" onClick={() => jump(c.id)}>
                        <i className="tm-mark">✓</i><span className="tm-cn">{c.name}</span>
                      </button>
                    ))}
                    {remain > 0 && more.length > 0 && (
                      <>
                        <div className="tm-hint">候補(未所持・一例):</div>
                        {more.map((c) => (
                          <button key={c.id} className="tm-cand row" onClick={() => jump(c.id)}>
                            <i className="tm-mark dim">・</i><span className="tm-cn">{c.name}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                );
              })()}

              {ex && ex.kind === "grades" && (
                <div className="tm-cond">
                  <div className="tm-grades">
                    {ex.grades.map((g) => (
                      <span key={g} className={"tm-grd" + (ex.best && ex.best.grades.includes(g) ? " on" : "")}>{g}</span>
                    ))}
                  </div>
                  <p className="tm-hint">{ex.best
                    ? `「${ex.best.names[0]}」系で ${ex.best.hit}/${ex.grades.length} グレード所持`
                    : "対象になる同一機体がまだありません"}</p>
                </div>
              )}

              {ex && ex.buildGate && (
                <div className="tm-cond tm-gate">
                  <div className="tm-hint">制作条件</div>
                  <div className={"tm-piece" + (ex.buildGate.satisfied ? " ok" : " miss")}>
                    <i className="tm-mark">{ex.buildGate.satisfied ? "✓" : "✗"}</i>
                    <span className="tm-pname">全機を完成(金章条件)
                      {ex.buildGate.pendingCount > 0 ? <b className="tm-tag">未制作 {ex.buildGate.pendingCount}</b> : null}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── 底部分頁 ── */}
      <nav className="tabbar pad-min" style={{ paddingBottom: "4px" }}>
        {[
          ["zukan", L("図鑑", "Registry", "圖鑑"),
            (<svg className="tab-line-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6.2 4.6h11c.6 0 1 .4 1 1v12.8c0 .6-.4 1-1 1h-11c-.6 0-1-.4-1-1V5.6c0-.6.4-1 1-1z" /><path d="M8.4 4.6v14.8" /><path d="M13.4 4.6v5.4l1.8-1.3 1.8 1.3V4.6" /></svg>)],
          ["gallery", L("画廊", "Gallery", "畫廊"),
            (<svg className="tab-line-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4.4" y="5" width="15.2" height="14" rx="1.4" /><circle cx="9.2" cy="9.7" r="1.5" /><path d="M4.6 15.8l4-3.6 3 2.6 3.5-3.3 4.3 3.9" /></svg>)],
          ["honors", L("称号", "Honors", "稱號"),
            (<svg className="tab-line-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="9.4" r="4.7" /><circle cx="12" cy="9.4" r="1.5" /><path d="M9.6 13.4 8.2 20l3.8-2.1 3.8 2.1-1.4-6.6" /></svg>)],
          ["analysis", L("分析", "Analysis", "分析"),
            (<svg className="tab-line-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.4 19.5h15.2" /><path d="M7.4 19.5v-5.4M12 19.5V9.7M16.6 19.5V4.9" strokeWidth="2.4" /></svg>)],
          ["settings", L("設定", "Settings", "設定"),
            (<svg className="tab-line-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.6 7.2h3.1M12.2 7.2h7.2" /><circle cx="10" cy="7.2" r="1.9" /><path d="M4.6 12h7.5M16.6 12h2.8" /><circle cx="14.4" cy="12" r="1.9" /><path d="M4.6 16.8h1.7M10.8 16.8h8.6" /><circle cx="8.6" cy="16.8" r="1.9" /></svg>)],
        ].map(([k, label, icon]) => {
          return (
            <button key={k}
              className={`tab ${tab === k ? "on" : ""} `
                + (k === "settings" ? "set-tab " : "")}
              onPointerDown={(e) => { if (e.pointerType === "mouse" && e.button !== 0) return; tabPtrRef.current = k; changeTab(k); setConfirmReset(false); }}
              onClick={() => { if (tabPtrRef.current === k) { tabPtrRef.current = null; return; } changeTab(k); setConfirmReset(false); }}>
              <span className="tab-icon">{icon}</span>
              <span className="tab-label">{label}</span>
            </button>
          );
        })}
        {(() => {
          const order = ["zukan", "gallery", "honors", "analysis", "settings"];
          const idx = Math.max(0, order.indexOf(tab));
          const col = tab === "settings" ? "var(--ink-strong)" : "var(--gold)";
          return <i className="tab-slider" style={{ transform: `translateX(${idx * 100}%)` }}><b style={{ background: col }} /></i>;
        })()}
      </nav>
    </div>
  );
}

/* ───────────── 樣式 ─────────────
   CSS は app.css へ抽出済み(Phase 1 重構)。Vite が import "./app.css" で
   バンドルする。テンプレートリテラル時代と挙動同一(グローバル適用)。 */

/* ── ルート:ErrorBoundary で包んで公開 ──
   ・App 内部の描画例外を白画面ではなく復帰可能なフォールバックに変える。
   ・既存の window "error" オーバーレイ(__mgErrHook)は開発診断として温存。
   ・回報先は error-boundary.jsx の setErrorReporter() で差し替え可能
     (Phase 2 で Sentry 等に接続する縫い目)。 */
export default function AppRoot() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
