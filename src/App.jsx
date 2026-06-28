import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import { mergeRec, mergeRecMap, mergeArrStamped, stampRec, stampRecAll } from "./merge.js";
import { ACHIEVEMENTS } from "./achievements-rules.js";
import { evaluateAchievements, explainAchievement } from "./achievements-engine.js";
import { ALL_BASE } from "./kits-data.js";
import { QuizModal } from "./quiz.jsx";
import { haptic, hapticStrong, setHapticEnabled } from "./utils.js";
import {
  META_KEY,
  IMG_SHARDS,
  XTRA_SHARDS,
  MAX_IMGS_PER_KIT,
  MAX_SYNC_BYTES,
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
  shardKey,
  xtraKey,
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

/* settings / albumMeta / serifs を mg_meta から独立した雲端鍵へ分離。
   各キーが独自の updated_at を持つため、粗粒度の単一META gate を回避でき、
   設定トグル等での「META 丸ごと再シリアライズ&再送(書込み増幅)」も無くなる。 */
const SETTINGS_KEY = "mg_settings";
const ALBUM_KEY = "mg_album";
const SERIFS_KEY = "mg_serifs";
/* クラウドへ絶対に出さない憑證キー。storage-lib の SECRET_KEYS に依存せず、
   ここで明示的にも剝離する(SECRET_KEYS が supaUrl 等を含まない場合の保険)。 */
const CRED_KEYS = ["supaUrl", "supaKey", "geminiKey", "openaiKey"];
const secretFieldList = () => [...new Set([...(typeof SECRET_KEYS !== "undefined" && SECRET_KEYS ? SECRET_KEYS : []), ...CRED_KEYS])];

const UNI_EMBLEM = {
  /* UC = 地球儀(経線3・緯線3のみ) */
  UC:`<circle class="s2" cx="32" cy="32" r="19" style="stroke-width:2.4"/>
      <line class="s2" x1="32" y1="13" x2="32" y2="51" style="stroke-width:1.7"/>
      <ellipse class="s2" cx="32" cy="32" rx="9" ry="19" style="stroke-width:1.7"/>
      <line class="s2" x1="13" y1="32" x2="51" y2="32" style="stroke-width:1.7"/>
      <ellipse class="s2" cx="32" cy="32" rx="19" ry="9" style="stroke-width:1.7"/>`,

  /* SEED(C.E.) = 殖民地 PLANT(蝶ネクタイ型) */
  SEED:`<path class="m" d="M15 13L49 13L32 32Z"/>
        <path class="m" d="M15 51L49 51L32 32Z"/>`,

  /* X(A.W.) = 月(三日月＋星) */
  X:`<path class="m" d="M32 9A23 23 0 1 0 32 55A19 23 0 0 1 32 9Z"/>
     <path class="m" d="M45 15l1.6 4.3 4.4 1.6-4.4 1.6-1.6 4.3-1.6-4.3-4.4-1.6 4.4-1.6Z"/>`,

  /* W(A.C.) = 「W」字標(Lucida Calligraphy 風) */
  W:`<text class="m cal" x="31.5" y="33" text-anchor="middle" dominant-baseline="central" font-size="44">W</text>`,

  /* CC(∀) = ∀ 記号(Cambria Math 風・開口 +12%。地球儀バッジと同寸・線+1px) */
  CC:`<g transform="translate(32 0) scale(1.12 1) translate(-32 0)"><text class="m cmath" style="stroke:currentColor;stroke-width:1;stroke-linejoin:round" x="32" y="33" text-anchor="middle" dominant-baseline="central" font-size="53">&#8704;</text></g>`,

  /* F.C.(G) = 「G」字標(Lucida Calligraphy 風) */
  G:`<text class="m cal" x="33" y="33" text-anchor="middle" dominant-baseline="central" font-size="50">G</text>`,

  /* 00(A.D.) = 「OO」二重環の字標 */
  "00":`<path class="m" fill-rule="evenodd" d="M23 21a11 11 0 1 0 0 22a11 11 0 1 0 0-22Z M23 27a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z"/>
        <path class="m" fill-rule="evenodd" d="M41 21a11 11 0 1 0 0 22a11 11 0 1 0 0-22Z M41 27a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z"/>`,

  /* A.G.(AGE) = 「AG」字標(Lucida Calligraphy 風) */
  AGE:`<text class="m cal" x="33" y="34" text-anchor="middle" dominant-baseline="central" font-size="31">AG</text>`,

  /* P.D.(鉄血) = 鎚と剣の交差(剣を錘と同等の長さに) */
  IBO:`<path class="m" d="M48 52L52 48L25 21L21 25Z"/>
       <rect class="m" x="10" y="12" width="15" height="9" rx="1.5" transform="rotate(-45 17.5 16.5)"/>
       <g transform="rotate(-45 32 32)">
         <path class="m" d="M5 32L13 29.5H40V34.5H13Z"/>
         <rect class="m" x="38" y="23" width="4.5" height="18" rx="1"/>
         <rect class="m" x="42.5" y="29.5" width="10" height="5" rx="1.5"/>
         <circle class="m" cx="55" cy="32" r="3.4"/>
       </g>`,

  /* A.S.(水星の魔女) = 水星 ☿(1.5倍)【提案】 */
  AS:`<g transform="translate(32 34) scale(1.5) translate(-32 -34)"><circle class="s" cx="32" cy="33" r="8"/><path class="s" d="M25 23a7 7 0 0 0 14 0"/><path class="s" d="M32 41V53 M26 47H38"/></g>`,

  /* R.C.(G-Reco) = 軌道塔【提案】 */
  RC:`<path class="m" d="M27 52L30 20H34L37 52Z"/>
      <rect class="m" x="23" y="52" width="18" height="4.5" rx="1.5"/>
      <circle class="m" cx="32" cy="17" r="3.4"/>
      <ellipse class="s2" cx="32" cy="17" rx="12" ry="4"/>`,

  /* GQX = 「IF」の字標(if/もしも) */
  GQX:`<rect class="m" x="16" y="16" width="6" height="32"/>
       <rect class="m" x="11" y="16" width="16" height="5.5" rx="1"/>
       <rect class="m" x="11" y="42.5" width="16" height="5.5" rx="1"/>
       <rect class="m" x="35" y="16" width="6" height="32"/>
       <rect class="m" x="35" y="16" width="17" height="5.5" rx="1"/>
       <rect class="m" x="35" y="29" width="13" height="5.5" rx="1"/>`,

  /* BF = ニッパー寄り(刃を短く厚い斜刃に。地球儀バッジと中心一致のため全体を上へ) */
  BF:`<g transform="translate(0 -6.5)">
      <path class="m" d="M32 32L22 21L28 19L33 29Z"/>
      <path class="m" d="M32 32L42 21L36 19L31 29Z"/>
      <path class="m" d="M31 34L23 46L26 48L34 37Z"/>
      <path class="m" d="M33 34L41 46L38 48L30 37Z"/>
      <path class="m" fill-rule="evenodd" d="M22 44a7 7 0 1 0 0.1 0Z M22 47.6a3.6 3.6 0 1 0 0.1 0Z"/>
      <path class="m" fill-rule="evenodd" d="M42 44a7 7 0 1 0 0.1 0Z M42 47.6a3.6 3.6 0 1 0 0.1 0Z"/>
      <circle class="m" cx="32" cy="32.5" r="2.6"/></g>`,

  /* extra(世界観なし)= 「?」字標(serif) */
  extra:`<text class="m qm" x="32" y="34" text-anchor="middle" dominant-baseline="central" font-size="52">?</text>`,
};

/* 世界観タグ文字列(UNI_PREFIX と同一表記。ピリオド有り・内部スペース無し) */
const UNI_TAG = { UC: "U.C.", SEED: "C.E.", W: "A.C.", X: "A.W.", G: "F.C.", "00": "A.D.", AGE: "A.G.", IBO: "P.D.", AS: "A.S.", RC: "R.C.", CC: "C.C.", GQX: "GQX", BF: "BF", extra: "extra" };

/* 世界観フィルター用の表示順＋ラベル(コード, 表示名) */
const UNI_PICK = [["UC", "U.C. 宇宙世紀"], ["SEED", "C.E. コズミック・イラ"], ["W", "A.C. アフターコロニー"], ["X", "A.W. アフターウォー"], ["G", "F.C. フューチャーセンチュリー"], ["00", "A.D. 西暦"], ["AGE", "A.G. アドバンスド・ジェネレイション"], ["IBO", "P.D. ポスト・ディザスター"], ["AS", "A.S. アド・ステラ"], ["RC", "R.C. リギルド・センチュリー"], ["CC", "C.C. 正暦"], ["GQX", "GQX ジークアクス"], ["BF", "BF ビルド系"], ["extra", "extra その他"]];

/* 系列名 → 世界観コード(順序厳守: Build/メタ→BF → クロスオーバー/SD・戦国→extra → 各世界観 → U.C. 総取り → 残り extra) */
function universeOfSeries(series) {
  const s = series || "";
  if (!s) return "extra";
  // Build / ガンプラ・メタ作品 → BF
  if (/ビルドファイターズ|ビルドダイバー|ビルドメタバース|ビルドリアル|ガンダムブレイカー|ガンプラビルダーズ|ガンプラバトル|プラモ狂四郎|量産型リコ|ビギニングG|イメージングビルダーズ/.test(s)) return "BF";
  // クロスオーバー / 対戦ゲーム / SD・戦国 → extra
  if (/EXTREME VS|エクストリームバーサス|マキシブースト|フルブースト|EVOLVE|トライエイジ|戦国|英雄譚/.test(s)) return "extra";
  // 各世界観(専用パターンで衝突回避)
  if (/水星の魔女/.test(s)) return "AS";
  if (/ジークアクス/.test(s)) return "GQX";
  if (/レコンギスタ/.test(s)) return "RC";
  if (/∀|ターンエー/.test(s)) return "CC";
  if (/鉄血のオルフェンズ/.test(s)) return "IBO";
  if (/ガンダムAGE/.test(s)) return "AGE";
  if (/ガンダム00(?![0-9])/.test(s)) return "00"; // 0080/0083/0079/0087 は除外 → UC へ
  if (/SEED/.test(s)) return "SEED";
  if (/新機動戦記/.test(s)) return "W";
  if (/機動新世紀/.test(s)) return "X";
  if (/機動武闘伝/.test(s)) return "G";
  // U.C. 総取り(「ガンダム」を含む残り＋「ガンダム」表記の無い U.C. 作品)
  if (/ガンダム|GUNDAM|ADVANCE OF Z|A\.O\.Z|アドバンス・オブ・ゼータ|閃光のハサウェイ|逆襲のシャア|MSV|MSイグルー|MS IGLOO|サンダーボルト|THUNDERBOLT|F90|U\.C\.|アナハイム/.test(s)) return "UC";
  return "extra";
}
/* 個別ID上書き(系列パターンより優先する例外マップ)。コードは UC/SEED/W/X/G/00/AGE/IBO/AS/RC/CC/GQX/BF/extra */
const UNI_OVERRIDE = {
  // → U.C.
  rgp19: "UC", pg017: "UC", bmg012: "UC", bmg022: "UC", bp128: "UC", bp143: "UC", bp159: "UC", bp174: "UC",
  hghp001: "UC", hghp027: "UC", hghp048: "UC", hghp052: "UC", hghp148: "UC", bp039: "UC", bp042: "UC", hghp160: "UC",
  // → C.E.
  rgp02: "SEED", pg013: "SEED", bp036: "SEED",
  // → A.D.
  rgp03: "00",
};
const universeOfKit = (k) => (k && UNI_OVERRIDE[k.id]) || universeOfSeries(k && k.series);

/* 世界別エンブレム(単色 currentColor / 金=tier2・銀=tier1・灰=tier0) */
function Emblem({ universe, tier }) {
  const fin = tier === 2 ? "gold" : tier === 1 ? "silver" : "ghost";
  return <svg viewBox="0 0 64 64" className={"av-emblem fin-" + fin} aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: UNI_EMBLEM[universe] || UNI_EMBLEM.UC }} />;
}

/* 画像なしプレースホルダー: 系列の世界観エンブレムを灰色の透かしで表示(grid 73% / list 78%) */
function SeriesWatermark({ kit, variant, size = 84 }) {
  const inner = UNI_EMBLEM[universeOfKit(kit)] || UNI_EMBLEM.extra;
  if (variant === "list") return (
    <div className="series-wm-box wm-list">
      <svg viewBox="0 0 64 64" className="av-emblem fin-ghost series-wm" aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: inner }} />
    </div>
  );
  return (
    <div className="series-wm-box wm-grid" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="av-emblem fin-ghost series-wm" aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: inner }} />
    </div>
  );
}


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
        el.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:#5a1410;color:#fff;padding:10px 12px;border-radius:8px;font-size:11px;line-height:1.5;white-space:pre-wrap;max-height:42vh;overflow:auto;cursor:pointer";
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
/* ── 画像鑑賞: 指追従の横スワイプでページング(離すと次へ自然遷移)＋ピンチズーム。
   ボタン/X 無し、タップで閉じる。ズーム中(>1倍)は1本指でパン、等倍時のみページング ── */
// pointerup 起点で閉じるビューアの「ゴーストクリック」を1回だけ握り潰す(背景への突き抜けタップ防止)。
function swallowNextClick() {
  if (typeof document === "undefined") return;
  const h = (e) => { e.stopPropagation(); e.preventDefault(); document.removeEventListener("click", h, true); clearTimeout(t); };
  const t = setTimeout(() => document.removeEventListener("click", h, true), 700);
  document.addEventListener("click", h, true);
}

function SwipeViewer({ slides, index, onIndex, onClose, resolveSrc, resetKey, serifOf, onSerif, watermarkOf }) {
  const n = slides.length;
  const wrapRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [paging, setPaging] = useState(false);
  const [z, setZ] = useState({ scale: 1, x: 0, y: 0 });
  const zr = useRef({ scale: 1, x: 0, y: 0 });
  const pts = useRef(new Map());
  const st = useRef(null);

  useEffect(() => { zr.current = { scale: 1, x: 0, y: 0 }; setZ({ scale: 1, x: 0, y: 0 }); }, [index, resetKey]);

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clampZoom = (s, x, y) => {
    s = Math.max(1, Math.min(5, s));
    const el = wrapRef.current;
    if (el) { const mx = el.clientWidth * (s - 1) / 2, my = el.clientHeight * (s - 1) / 2; x = Math.max(-mx, Math.min(mx, x)); y = Math.max(-my, Math.min(my, y)); }
    if (s <= 1.001) { x = 0; y = 0; }
    return { scale: s, x, y };
  };
  const setZoom = (r) => { zr.current = r; setZ(r); };

  const down = (e) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const arr = [...pts.current.values()];
    if (arr.length >= 2) {
      st.current = { mode: "pinch", baseDist: dist(arr[0], arr[1]) || 1, baseScale: zr.current.scale, bx: zr.current.x, by: zr.current.y, moved: true };
    } else {
      st.current = { mode: null, sx: e.clientX, sy: e.clientY, bx: zr.current.x, by: zr.current.y, moved: false, t0: Date.now() };
      setPaging(false);
    }
  };
  const move = (e) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const arr = [...pts.current.values()];
    const s = st.current; if (!s) return;
    if (s.mode === "pinch" && arr.length >= 2) {
      setZoom(clampZoom(s.baseScale * (dist(arr[0], arr[1]) / s.baseDist), s.bx, s.by));
      return;
    }
    if (arr.length !== 1) return;
    const dx = arr[0].x - s.sx, dy = arr[0].y - s.sy;
    if (zr.current.scale > 1) {
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) s.moved = true;
      setZoom(clampZoom(zr.current.scale, s.bx + dx, s.by + dy));
    } else {
      if (s.mode === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) s.mode = Math.abs(dx) > Math.abs(dy) ? "page" : "vert";
      if (s.mode === "page") {
        s.moved = true;
        let d = dx;
        if ((index === 0 && d > 0) || (index === n - 1 && d < 0)) d *= 0.35;
        setDragX(d);
      }
    }
  };
  const up = (e) => {
    pts.current.delete(e.pointerId);
    const arr = [...pts.current.values()];
    if (arr.length >= 1) {
      st.current = { mode: zr.current.scale > 1 ? "pan" : null, sx: arr[0].x, sy: arr[0].y, bx: zr.current.x, by: zr.current.y, moved: true };
      return;
    }
    const s = st.current; st.current = null;
    if (!s) return;
    if (s.mode === "page") {
      const el = wrapRef.current;
      const w = el ? el.clientWidth : 360;
      const th = Math.min(60, w * 0.16);                 // ページ送り確定の距離(従来 80→60 で感度↑)
      const flick = (Date.now() - (s.t0 || 0)) < 260 && Math.abs(dragX) > 24; // 素早いフリックは小移動でも送る
      setPaging(true);
      if ((dragX <= -th || (flick && dragX < 0)) && index < n - 1) onIndex(index + 1);
      else if ((dragX >= th || (flick && dragX > 0)) && index > 0) onIndex(index - 1);
      setDragX(0);
    } else if (!s.moved && zr.current.scale <= 1.01 && (Date.now() - (s.t0 || 0)) < 500) {
      onClose(e);
    }
  };

  const lo = Math.max(0, index - 1), hi = Math.min(n - 1, index + 1);
  const win = [];
  for (let i = lo; i <= hi; i++) win.push(i);
  return (
    <div ref={wrapRef} className="sv-wrap" style={{ touchAction: "none" }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {win.map((i) => {
        const sl = slides[i];
        const isCur = i === index;
        const src = resolveSrc(sl);
        const wm = watermarkOf ? watermarkOf(sl) : "";
        return (
          <div className="sv-slide" key={sl.kitId + "/" + sl.ref}
            style={{ transform: `translateX(calc(${(i - index) * 100}% + ${dragX}px))`, transition: paging ? "transform .3s cubic-bezier(.25,.8,.3,1)" : "none" }}>
            <div className="sv-stage">
              {sl.ref && (onSerif || (serifOf && serifOf(sl))) ? (() => {
                const sf = serifOf ? serifOf(sl) : "";
                return (
                  <div className="sv-serif" onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); if (onSerif) onSerif(sl); }}>
                    {sf ? <span className="vs-text">{sf}</span> : (isCur && onSerif ? <span className="vs-hint">＋ セリフを追加</span> : null)}
                  </div>
                );
              })() : null}
              <div className="sv-imgwrap">
                {src
                  ? <img src={src} alt="" draggable={false} className="sv-img"
                      style={isCur ? { transform: `translate(${z.x}px,${z.y}px) scale(${z.scale})` } : undefined} />
                  : <div className="dc-classified sv-classified">
                      <span className="dc-tick tl" /><span className="dc-tick tr" /><span className="dc-tick bl" /><span className="dc-tick br" />
                      <span className="dc-unid">UNIDENTIFIED</span>
                      <span className="dc-unsub">NO VISUAL ON FILE · 機密</span>
                      <span className="dc-unref">REF · {sl.code || (sl.no && sl.no !== "—" ? "No." + sl.no : "—")}</span>
                    </div>}
                {wm ? <div className="sv-wm">{wm}</div> : null}
              </div>
              {/* 銘牌(様式4:枠なし・最小)— 作品名(小) / 機体名(楷体)。画像直下に追従 */}
              <div className="sv-plate">
                {sl.series ? <div className="svp-work">{sl.series}</div> : null}
                <div className="svp-div" />
                <div className="svp-kit">{sl.name}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PinchZoom({ src, alt = "", className = "", imgClassName = "", imgStyle, onTap, onSwipe, resetKey, maxScale = 5 }) {
  const box = useRef(null);
  const cur = useRef({ scale: 1, x: 0, y: 0 });
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const pts = useRef(new Map());
  const g = useRef(null);
  const moved = useRef(false);
  const startPt = useRef({ x: 0, y: 0 });

  useEffect(() => {
    cur.current = { scale: 1, x: 0, y: 0 };
    setView({ scale: 1, x: 0, y: 0 });
  }, [resetKey, src]);

  const clamp = (s, x, y) => {
    s = Math.max(1, Math.min(maxScale, s));
    const el = box.current;
    if (el) {
      const mx = (el.clientWidth * (s - 1)) / 2;
      const my = (el.clientHeight * (s - 1)) / 2;
      x = Math.max(-mx, Math.min(mx, x));
      y = Math.max(-my, Math.min(my, y));
    }
    if (s <= 1.001) { x = 0; y = 0; }
    return { scale: s, x, y };
  };
  const set = (r) => { cur.current = r; setView(r); };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const down = (e) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    const arr = [...pts.current.values()];
    if (arr.length >= 2) {
      g.current = { mode: "pinch", d: dist(arr[0], arr[1]) || 1, s: cur.current.scale, x: cur.current.x, y: cur.current.y };
    } else {
      g.current = { mode: "pan", px: arr[0].x, py: arr[0].y, x: cur.current.x, y: cur.current.y };
      startPt.current = { x: e.clientX, y: e.clientY };
    }
  };
  const move = (e) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const arr = [...pts.current.values()];
    const gg = g.current;
    if (!gg) return;
    if (gg.mode === "pinch" && arr.length >= 2) {
      moved.current = true;
      set(clamp(gg.s * (dist(arr[0], arr[1]) / gg.d), gg.x, gg.y));
    } else if (gg.mode === "pan" && arr.length === 1 && cur.current.scale > 1) {
      const dx = arr[0].x - gg.px, dy = arr[0].y - gg.py;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true;
      set(clamp(cur.current.scale, gg.x + dx, gg.y + dy));
    }
  };
  const up = (e) => {
    pts.current.delete(e.pointerId);
    const arr = [...pts.current.values()];
    if (arr.length === 1) {
      g.current = { mode: "pan", px: arr[0].x, py: arr[0].y, x: cur.current.x, y: cur.current.y };
    } else if (arr.length === 0) {
      const wasMoved = moved.current;
      g.current = null;
      const dx = e.clientX - startPt.current.x, dy = e.clientY - startPt.current.y;
      if (onSwipe && cur.current.scale <= 1.01 && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        onSwipe(dx < 0 ? 1 : -1);
      } else if (!wasMoved && onTap) {
        onTap(e);
      }
    }
  };

  return (
    <div ref={box} className={"pz " + className} style={{ touchAction: "none" }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <img src={src} alt={alt} className={imgClassName} draggable={false}
        style={{ ...imgStyle, transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`, transformOrigin: "center center", willChange: "transform", touchAction: "none" }} />
    </div>
  );
}

/* ── 構図調整モーダル: ドラッグ平移 + ピンチ/ホイール拡大 + 中央リセット ──
   方形ビューポート内で object-fit:cover の画像を pan/zoom。保存値は {scale,x,y}。原画像は無加工。 */
function FramingEditor({ src, initial, onSave, onCancel }) {
  /* 全画像を表示し、正方形の枠を自由に移動/サイズ変更して構図を選ぶ。
     枠は既存の cover+transform モデル({scale,x,y})へ変換して保存(全描画箇所と互換)。
     枠が画像より大きい=letterbox(全体表示) / 小さい=拡大トリミング。 */
  const stageRef = useRef(null);
  const [nat, setNat] = useState(null);   // 画像自然サイズ {w,h}
  const [box, setBox] = useState(null);   // 枠 正規化(0-1, ステージ基準) {x,y,s}
  const drag = useRef(null);
  const inited = useRef("");

  useEffect(() => { setNat(null); setBox(null); inited.current = ""; }, [src]);

  // ステージ(正方形)内での画像表示矩形(contain) + cover寸法(container単位)
  const disp = useMemo(() => {
    if (!nat) return null;
    const a = (nat.w || 1) / (nat.h || 1);
    let iw, ih;
    if (a >= 1) { iw = 1; ih = 1 / a; } else { ih = 1; iw = a; }
    return { a, iw, ih, ix: (1 - iw) / 2, iy: (1 - ih) / 2, Wd: a >= 1 ? a : 1, Hd: a >= 1 ? 1 : 1 / a };
  }, [nat]);

  // 初期化: 既存framingを逆変換して枠へ / なければ cover中央正方形
  useEffect(() => {
    if (!disp || inited.current === src) return;
    inited.current = src;
    const { iw, ih, ix, iy, Wd, Hd } = disp;
    const fr = initial && !isDefaultFraming(initial) ? clampFraming(initial) : null;
    if (!fr) {
      const s = Math.min(iw, ih);
      setBox({ x: ix + (iw - s) / 2, y: iy + (ih - s) / 2, s });
      return;
    }
    const sc = fr.scale, tx = fr.x / 100, ty = fr.y / 100;
    const bw = 1 / (sc * Wd), boxS = bw * iw;
    const ex1 = 0.5 - (tx + 0.5) / sc, bx = (ex1 - (1 - Wd) / 2) / Wd;
    const ey1 = 0.5 - (ty + 0.5) / sc, by = (ey1 - (1 - Hd) / 2) / Hd;
    setBox({ x: ix + bx * iw, y: iy + by * ih, s: boxS });
  }, [disp, src, initial]);

  // 枠 → framing {scale,x,y}(cover+transform 基準)
  const toFraming = (b) => {
    const { iw, ih, ix, iy, Wd, Hd } = disp;
    const bx = (b.x - ix) / iw, by = (b.y - iy) / ih, bw = b.s / iw;
    const sc = 1 / (bw * Wd);
    const ex1 = (1 - Wd) / 2 + bx * Wd, ey1 = (1 - Hd) / 2 + by * Hd;
    return { scale: sc, x: (-0.5 - (ex1 - 0.5) * sc) * 100, y: (-0.5 - (ey1 - 0.5) * sc) * 100 };
  };

  const MINS = 0.12;
  const clampBox = (b) => {
    const s = Math.max(MINS, Math.min(1, b.s));
    return { s, x: Math.max(0, Math.min(1 - s, b.x)), y: Math.max(0, Math.min(1 - s, b.y)) };
  };
  const vpPx = () => { const el = stageRef.current; return el ? el.clientWidth : 1; };

  const onDown = (mode) => (e) => {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    drag.current = { mode, px: e.clientX, py: e.clientY, box };
  };
  const onMove = (e) => {
    if (!drag.current || !box) return;
    const vp = vpPx();
    const dx = (e.clientX - drag.current.px) / vp, dy = (e.clientY - drag.current.py) / vp;
    const b0 = drag.current.box;
    if (drag.current.mode === "move") setBox(clampBox({ ...b0, x: b0.x + dx, y: b0.y + dy }));
    else setBox(clampBox({ ...b0, s: b0.s + Math.max(dx, dy) })); // 角ドラッグ=正方形維持
  };
  const onUp = () => { drag.current = null; };

  const setFull = () => { if (disp) setBox(clampBox({ x: 0, y: 0, s: 1 })); };
  const setSquare = () => { if (!disp) return; const { iw, ih, ix, iy } = disp; const s = Math.min(iw, ih); setBox({ x: ix + (iw - s) / 2, y: iy + (ih - s) / 2, s }); };

  const frLive = box && disp ? toFraming(box) : null;

  return (
    <div className="crop-bg" onClick={onCancel}>
      <div className="crop-panel frm" onClick={(e) => e.stopPropagation()}>
        <div className="crop-head">構図を選ぶ<span>枠をドラッグ・角でサイズ変更 / 枠外は切り取り</span></div>
        <div className="frm-stage" ref={stageRef} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ touchAction: "none" }}>
          <img src={src} alt="" className="frm-fullimg" draggable={false}
            onLoad={(e) => setNat({ w: e.target.naturalWidth || 1, h: e.target.naturalHeight || 1 })} />
          {box && (
            <div className="frm-cropbox" onPointerDown={onDown("move")}
              style={{ left: box.x * 100 + "%", top: box.y * 100 + "%", width: box.s * 100 + "%", height: box.s * 100 + "%" }}>
              <span className="frm-cg" aria-hidden="true"><i /><i /><i /><i /></span>
              <button type="button" className="frm-handle" onPointerDown={onDown("resize")} onClick={(e) => e.stopPropagation()} aria-label="サイズ変更" />
            </div>
          )}
        </div>
        <div className="frm-tools">
          <div className="frm-mini" aria-hidden="true">
            <img src={src} alt="" draggable={false} style={frLive ? (framingStyle(frLive) || undefined) : undefined} />
          </div>
          <div className="frm-qbtns">
            <button type="button" className="btn" onClick={setSquare}>中央正方</button>
            <button type="button" className="btn" onClick={setFull}>全体表示</button>
          </div>
        </div>
        <div className="crop-actions">
          <button className="btn primary" onClick={() => onSave(frLive && !isDefaultFraming(frLive) ? clampFraming({ ...frLive, a: nat ? nat.w / nat.h : undefined }) : null)}>保存</button>
          <button className="btn" onClick={onCancel}>やめる</button>
        </div>
      </div>
    </div>
  );
}

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

/* ── 検索正規化:片仮名→平仮名、全形→半形、平仮名→ローマ字 ── */
const KR = {
  "あ":"a","い":"i","う":"u","え":"e","お":"o",
  "か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko",
  "が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go",
  "さ":"sa","し":"shi","す":"su","せ":"se","そ":"so",
  "ざ":"za","じ":"ji","ず":"zu","ぜ":"ze","ぞ":"zo",
  "た":"ta","ち":"chi","つ":"tsu","て":"te","と":"to",
  "だ":"da","ぢ":"ji","づ":"zu","で":"de","ど":"do",
  "な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no",
  "は":"ha","ひ":"hi","ふ":"fu","へ":"he","ほ":"ho",
  "ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo",
  "ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po",
  "ま":"ma","み":"mi","む":"mu","め":"me","も":"mo",
  "や":"ya","ゆ":"yu","よ":"yo",
  "ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro",
  "わ":"wa","を":"o","ん":"n","ゔ":"vu",
  "ぁ":"a","ぃ":"i","ぅ":"u","ぇ":"e","ぉ":"o","ゃ":"ya","ゅ":"yu","ょ":"yo",
  "きゃ":"kya","きゅ":"kyu","きょ":"kyo","ぎゃ":"gya","ぎゅ":"gyu","ぎょ":"gyo",
  "しゃ":"sha","しゅ":"shu","しょ":"sho","じゃ":"ja","じゅ":"ju","じょ":"jo",
  "ちゃ":"cha","ちゅ":"chu","ちょ":"cho","にゃ":"nya","にゅ":"nyu","にょ":"nyo",
  "ひゃ":"hya","ひゅ":"hyu","ひょ":"hyo","びゃ":"bya","びゅ":"byu","びょ":"byo",
  "ぴゃ":"pya","ぴゅ":"pyu","ぴょ":"pyo","みゃ":"mya","みゅ":"myu","みょ":"myo",
  "りゃ":"rya","りゅ":"ryu","りょ":"ryo",
  "ふぁ":"fa","ふぃ":"fi","ふぇ":"fe","ふぉ":"fo","てぃ":"ti","でぃ":"di",
  "うぃ":"wi","うぇ":"we","うぉ":"wo","しぇ":"she","ちぇ":"che","じぇ":"je","つぁ":"tsa","つぉ":"tso"
};
/* 中日繁簡の異体字を代表字へ畳む(あいまい検索用・主要字の curated 集合)。各群の先頭が代表字。 */
const CJK_FOLD = (() => {
  const groups = [
    "図圖", "画畫", "巻卷", "戦戰战", "闘鬪鬥", "竜龍龙", "機机", "専專专", "弾彈弹", "鋼钢",
    "砲炮", "銃铳", "剣劍剑", "騎骑", "駆驅驱", "黒黑", "紅红", "緑綠绿", "衛衞卫", "号號",
    "体體", "関關关", "広廣广", "鉄鐵铁", "将將", "学學", "宝寶", "国國", "亀龜龟", "万萬",
    "楽樂乐", "点點", "経經经", "変變变", "観観观", "庁廳厅", "総總总", "続續续", "発發发", "対對对",
    "児兒儿", "価價价", "団團团", "囲圍围", "気氣气", "戸戶户", "円圓圆", "読讀读", "蔵藏", "駅驛",
    "鶏鷄鸡", "霊靈灵", "実實实", "両兩两", "顔顏颜", "増增", "豊豐丰", "様樣样", "覇霸", "聖圣",
    "黄黃", "齢齡", "騰腾", "麗丽", "壊壞坏", "懐懷怀", "拝拜", "覚覺觉", "応應应", "従從从",
    "巌巖岩", "嶽岳", "竪豎", "盤盘", "陽阳", "陰阴隂", "雲云", "風风", "雷", "焔焰",
  ];
  const m = new Map();
  for (const g of groups) { const c = g[0]; for (const ch of g) m.set(ch, c); }
  return m;
})();
function normJa(s) {
  return (s || "").toLowerCase()
    .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/[\u3400-\u9fff\uf900-\ufaff]/g, (ch) => CJK_FOLD.get(ch) || ch);
}
function toRomaji(hira) {
  let out = "";
  for (let i = 0; i < hira.length; i++) {
    const two = hira.slice(i, i + 2);
    if (KR[two]) { out += KR[two]; i++; continue; }
    const c = hira[i];
    if (c === "っ") {
      const nx = KR[hira.slice(i + 1, i + 3)] || KR[hira[i + 1]];
      if (nx) out += nx[0];
      continue;
    }
    if (c === "ー") {
      const last = out.slice(-1);
      if ("aiueo".includes(last)) out += last;
      continue;
    }
    out += KR[c] || c;
  }
  return out;
}


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

/* ── 圖像壓縮(上傳用) ── */
async function fileToCompressedDataURL(file, maxW = 1080, quality = 0.78) {
  const dataURL = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = rej;
    r.readAsDataURL(file);
  });
  return await new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      const scale = Math.min(1, maxW / im.width);
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * scale);
      c.height = Math.round(im.height * scale);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", quality));
    };
    im.onerror = rej;
    im.src = dataURL;
  });
}

/* ── AIスタイル変換(nano banana) ── */
const AI_STYLES = [
  { id: "ukiyoe", label: "浮世絵風",
    prompt: "Completely repaint this image as a Japanese ukiyo-e woodblock print (浮世絵). You MUST restyle the SUBJECT itself, not only the background: rebuild the subject's colors as bold flat planes of ukiyo-e pigment, and redraw all of its contours and lines as strong calligraphic black woodblock linework. Apply ukiyo-e treatment everywhere — flat color fills, hand-carved outline quality, woodblock-print paper texture, decorative stylized waves and clouds, bokashi gradients, and a vivid ornamental traditional palette. Do not leave the subject looking photographic while only the background changes; the subject's color and linework must be fully reinterpreted in ukiyo-e style. Output only the image." },
  { id: "cel", label: "80年代セル画風",
    prompt: "Completely redraw this entire image — BOTH the subject AND the background — as a 1980s Japanese robot/mecha anime cel-animation frame. Fully re-render everything by hand in that era's style: rough, slightly uneven hand-drawn ink outlines, visibly hand-painted limited flat colors with hard two-tone cel shading, and the coarse texture of vintage analog animation cels. Embrace imperfection — the linework should look hand-inked and a little rough, not clean or digital. Add a moderate amount of film grain / analog noise and slight VHS-style softness throughout. Nothing should remain photographic; the whole frame must read as a hand-drawn 80s anime cel. Output only the image." },
  { id: "impressionist", label: "印象派風",
    prompt: "Completely repaint this image as a French Impressionist oil painting in the manner of Monet and Renoir. Re-render BOTH the subject AND the background entirely with loose, broken brushstrokes and small dabs of pure, unmixed color placed side by side; capture vibrant natural daylight, shimmering atmosphere, soft blurred edges and visible canvas texture, in the plein-air spirit of Impressionism. Nothing may remain photographic — every surface must read as dappled Impressionist paint. CONSTRAINTS: do NOT change the composition, camera angle, pose, proportions or framing; only the medium becomes an Impressionist painting. Output only the image." },
  { id: "shiningfinger", label: "シャイニングフィンガー風",
    prompt: "Redraw this mobile suit as a dynamic finishing-move action scene in the hand-drawn cel-animation art style of mid-1990s Japanese super-robot anime (in the visual spirit of Mobile Fighter G Gundam). Re-pose the machine performing the legendary 'Shining Finger' attack: a powerful forward lunge with the right arm thrust out and the open right hand blazing with a brilliant glowing energy aura, radiating intense heat-haze, light streaks and sparks; add explosive energy bursts, speed lines and dramatic rim lighting in the background. Use bold hand-inked outlines, flat two-tone cel shading with hard highlights, and the vivid saturated palette and analog texture of 90s mecha TV anime. You MAY change the pose, camera angle and background to depict this action dramatically, but keep it recognizably the same machine. Output only the image." },
  { id: "lineart", label: "設定線稿風",
    prompt: "Redraw this mobile suit as a SINGLE comprehensive mechanical design sheet (設定ラフ・線画) drawn entirely with REAL graphite PENCIL on off-white sketch paper: visible hand-drawn pencil strokes with varied line pressure, light construction/guide lines, faint smudging and eraser marks, and genuine pencil-on-paper texture — NOT clean digital vector lines. In ONE image, lay out together: a full-body upright front-view figure as the main reference; surrounding rough detail studies of key parts (head/face, hands, joints, backpack); a small internal-structure cutaway; and the machine's weapons/equipment as separate item sketches. Add plenty of HANDWRITTEN annotations and labels drawn in pencil (Japanese and/or English notes naming the parts, arrows pointing to details, small measurements and remarks) as on a real mechanical designer's working sheet. Monochrome graphite only. Output only the image." },
  { id: "manga", label: "漫畫風",
    prompt: "Redraw this image as a dramatic black-and-white Japanese manga panel: pure monochrome (no color), bold confident ink linework, high-contrast screentone (網点) shading and expressive manga hatching. CRITICAL: faithfully preserve the subject's EXACT pose, proportions, orientation, framing and overall composition from the original photo — do NOT change the pose, action or viewpoint; only the drawing medium becomes manga.",
    fields: [
      { key: "artist", label: "漫畫家の作風(任意)", type: "text", placeholder: "例: 大友克洋 / 鳥山明" },
      { key: "line", label: "セリフ(任意)", type: "text", placeholder: "コマ内のセリフ" },
    ],
    extra: (o) => {
      let s = "";
      if (o.artist && o.artist.trim()) s += " You MUST strongly and unmistakably emulate the highly distinctive drawing style of manga artist " + o.artist.trim() + " — their characteristic linework, inking, anatomy, screentone usage, eyes and overall art-style signature must be clearly and recognizably reproduced.";
      if (o.line && o.line.trim()) s += " Add a manga speech balloon containing this dialogue, hand-lettered naturally: 「" + o.line.trim() + "」.";
      return s + " Remember: keep the subject's original pose and composition unchanged. Output only the image.";
    } },
  { id: "cubism", label: "キュビスム風",
    prompt: "Completely repaint this image as a Cubist painting in the manner of Pablo Picasso and Georges Braque (c.1910s). You MUST fully fracture and reconstruct BOTH the subject AND the background — nothing may remain photographic. Shatter the machine into faceted, overlapping geometric planes seen simultaneously from multiple viewpoints (front, side and three-quarter angles fused into one image), flattening depth into an interlocking mosaic of angular shards. Use the restrained Cubist palette of ochres, greys, browns, muted greens and blacks, with passages of flat collaged color and stencilled letters or numbers in the Synthetic Cubist manner. Apply visible brushwork, facet shading and a shallow, ambiguous picture space. The machine must dissolve into Cubist geometry yet stay just recognizable. You MAY freely fragment and recompose the forms. Output only the image." },
  { id: "constructivism", label: "構成主義風",
    prompt: "Completely redesign this image as a 1920s Russian Constructivist / avant-garde propaganda poster in the manner of Alexander Rodchenko and El Lissitzky. You MUST rebuild the whole image — nothing photographic may remain. Reduce the machine to bold high-contrast graphic forms and place it in a dynamic, diagonal, off-kilter composition driven by strong geometric shapes, hard diagonals, circles and bars. Use a strict limited palette of red, black and off-white (with occasional grey), flat poster-like areas of color, and a high-contrast photomontage feel. Add bold Constructivist sans-serif and Cyrillic-style block lettering set on aggressive diagonals, plus simple geometric design elements. The result must read as a striking revolutionary graphic poster. You MAY crop, rotate and recompose dramatically for maximum graphic impact. Output only the image." },
  { id: "artnouveau", label: "アール・ヌーヴォー風",
    prompt: "Completely repaint this image as an Art Nouveau illustration in the decorative manner of Alphonse Mucha. You MUST restyle BOTH the subject AND its surroundings — nothing may remain photographic. Re-render the machine with flowing, elegant 'whiplash' organic outlines and flat decorative color, and surround it with an ornate Art Nouveau composition: a large circular halo or arched decorative frame behind it, swirling botanical motifs, vines, flowers and stylised flowing lines, intricate ornamental borders, and luminous gold-leaf accents. Use a soft, muted, harmonious palette of pastels, golds and jewel tones with delicate linework. The hard mechanical subject should be wrapped in graceful decorative Art Nouveau ornament like a poster icon, kept recognizable at the centre of the design. Output only the image." },
  { id: "popart", label: "ポップアート風",
    prompt: "Completely redraw this image as a 1960s Pop Art comic panel in the style of Roy Lichtenstein and Andy Warhol. You MUST fully restyle BOTH the subject AND the background — nothing photographic may remain. Re-render everything with thick bold black outlines, flat blocks of bright primary color (red, yellow, blue) and visible Ben-Day halftone dot shading. Add a comic-book feel: a dramatic flat-color or dot-pattern background, optional bold sound-effect or speech-balloon graphics, and crisp screen-print quality. Embrace the high-contrast, mass-printed look of vintage pop comics — limited punchy colors, hard edges, no soft gradients. The whole image must read as a graphic Pop Art print. Output only the image." },
  { id: "fauvism", label: "フォーヴィスム風",
    prompt: "Completely repaint this image as a Fauvist painting in the manner of Henri Matisse and André Derain. You MUST repaint BOTH the subject AND the background — nothing may remain photographic. Discard naturalistic color entirely and use wild, arbitrary, intensely saturated non-realistic hues — the machine painted in clashing reds, oranges, electric blues, greens and purples — with bold expressive brushstrokes and thick visible paint. Simplify forms into flat, vigorous patches of pure color with strong outlines, vibrant contrasting backgrounds and energetic, almost crude brushwork. Color and feeling lead over realism. CONSTRAINTS: keep the original pose, composition and framing — only the medium and color become Fauvist. Output only the image." },
  { id: "sumie", label: "水墨画風",
    prompt: "Completely repaint this image as a traditional East Asian sumi-e ink-wash painting (水墨画) on rice paper. You MUST fully restyle BOTH the subject AND the background — nothing may remain photographic. Re-render the machine entirely in monochrome black ink: fluid expressive brushstrokes, graded ink washes from deep black to pale grey, dry-brush texture and confident calligraphic lines, with much of the composition left as empty negative space (留白). Capture the subject economically with minimal, gestural brushwork rather than fine detail; suggest atmosphere with soft ink mist and bleeding wet edges on absorbent paper. Optionally add a small red seal stamp and faint paper texture. The whole image must read as an elegant, restrained ink painting. Output only the image." },
  { id: "stainedglass", label: "ステンドグラス風",
    prompt: "Completely transform this image into a Gothic cathedral stained-glass window. You MUST rebuild BOTH the subject AND the background — nothing may remain photographic. Reconstruct the entire scene out of flat, glowing panes of translucent colored glass separated by thick black lead came lines outlining every shape. Render the machine as a radiant icon assembled from jewel-toned glass — deep blues, rich reds, golds, emerald greens and amber — backlit so the colors glow with luminous light as if sunlight streams through. Add an ornate stained-glass frame or rose-window motifs, decorative geometric borders, and the subtle texture and slight irregularity of real antique glass. The machine should sit enshrined like a saint in a sacred window, kept recognizable. Output only the image." },
  { id: "moebius", label: "メビウス風",
    prompt: "Completely redraw this image as a Franco-Belgian bande dessinée science-fiction illustration in the iconic style of Mœbius (Jean Giraud). You MUST restyle BOTH the subject AND the background — nothing may remain photographic. Use clean, precise, even-weight 'ligne claire' ink outlines with fine cross-hatching, and fill with flat, subtly graded color in Mœbius's distinctive palette of warm sand, terracotta, turquoise, lilac and soft pastel skies. Place the machine within a vast, surreal sci-fi dreamscape — endless desert horizons, strange organic-mechanical structures, distant alien vistas and luminous gradient skies. Crisp, meditative, otherworldly and richly detailed in the European comics tradition. Keep the machine clearly recognizable. Output only the image." },
  { id: "amcomic", label: "アメコミ風",
    prompt: "Completely redraw this image as a modern American superhero comic-book illustration in the bold inked style of Marvel/DC comics. You MUST restyle BOTH the subject AND the background — nothing photographic may remain. Use dynamic heavy ink outlines with dramatic spotted blacks, muscular rendering, foreshortened action posing and energetic motion. Color it with bold saturated hues and modern digital comic cel-shading with hard highlights and gradient rendering. Add an explosive dynamic background with action lines, energy bursts and dramatic perspective. The whole image must read as a punchy, high-impact American comic panel. You MAY heighten the pose and camera angle for drama. Output only the image." },
  { id: "woodcut", label: "木版画風",
    prompt: "Completely transform this image into a bold black-and-white woodcut / woodblock relief print in the stark tradition of European and German Expressionist printmaking. You MUST restyle BOTH the subject AND the background — nothing may remain photographic. Reconstruct the entire image from hand-carved black ink marks on white paper: strong angular gouged lines, rough chiseled strokes, high-contrast solid black masses against bare white, dense parallel hatching for shadow, and the raw, slightly uneven texture of relief printing where the carving tool is visible. No grey gradients — only carved black and white. The result must look like a hand-printed woodcut. Output only the image." },
  { id: "graffiti", label: "グラフィティ風",
    prompt: "Completely transform this image into urban graffiti / street art spray-painted on a concrete wall. You MUST restyle BOTH the subject AND the background — nothing photographic may remain. Re-render the machine as a bold spray-paint mural: thick black outlines, vivid clashing fluorescent colors, drips and aerosol overspray, stencil-art elements, wildstyle lettering and tags, paint splatter, and a weathered concrete or brick wall background with cracks, torn posters and grime. Add spray texture, gradient fades and a rebellious street-art energy. The whole image must look like a real graffiti piece sprayed on a city wall. Output only the image." },
  { id: "artdeco", label: "アール・デコ風",
    prompt: "Completely redesign this image as a 1920s–30s Art Deco illustration / travel poster. You MUST restyle BOTH the subject AND the background — nothing may remain photographic. Rebuild the machine with sleek, streamlined geometric forms, bold symmetry, strong vertical lines and stylised elegance. Use a luxurious Art Deco palette of black, gold and metallics with rich jewel tones, flat poster-like areas of color, sunburst and zigzag motifs, stepped geometric ornament and elegant geometric borders. Add refined Deco geometric lettering if fitting. The result must read as a glamorous, symmetric, retro-futuristic Art Deco poster. Output only the image." },
  { id: "pointillism", label: "点描派風",
    prompt: "Completely repaint this image as a Pointillist / Divisionist painting in the manner of Georges Seurat and Paul Signac. You MUST repaint BOTH the subject AND the background — nothing may remain photographic. Render the ENTIRE image out of countless tiny distinct dots of pure, unmixed color placed side by side, letting the eye blend them optically into form and light. Use luminous complementary color contrasts and a bright, vibrating, sunlit atmosphere; every surface must be built from visible separate color points, not smooth paint. CONSTRAINTS: keep the original composition, pose and framing — only the technique becomes pointillist dots. Output only the image." },
  { id: "expressionism", label: "表現主義風",
    prompt: "Completely repaint this image as a German Expressionist painting in the anguished spirit of Edvard Munch and Die Brücke. You MUST repaint BOTH the subject AND the background — nothing may remain photographic. Distort and exaggerate the forms with nervous, jagged, swirling brushstrokes and warped perspective; use harsh, emotional, non-naturalistic color — acid greens, bruised purples, feverish reds and sickly yellows — clashing for psychological tension. The sky and background should writhe with turbulent painted energy. The image must feel raw, anxious and emotionally intense rather than realistic. Output only the image." },
  { id: "klimt", label: "クリムト風",
    prompt: "Completely repaint this image as a Symbolist 'Golden Phase' painting in the ornate style of Gustav Klimt. You MUST restyle BOTH the subject AND the background — nothing may remain photographic. Drench the image in shimmering gold leaf and bronze, and cover every surface with dense decorative pattern — spirals, eyes, triangles, rectangles, mosaic tessellation and intricate ornament. Combine flat, mosaic-like gilded areas with selectively detailed focal points, set against a glittering gold background. Use a jewel-toned, byzantine, luxuriously patterned palette. The machine should become a richly ornamented golden icon embedded in pattern. Output only the image." },
  { id: "mosaic", label: "ビザンティン・モザイク風",
    prompt: "Completely transform this image into a Byzantine gold-ground mosaic, like those in an ancient Orthodox cathedral. You MUST rebuild BOTH the subject AND the background — nothing may remain photographic. Reconstruct the ENTIRE image from thousands of small, irregular glass and stone tesserae (mosaic tiles) set with visible grout lines between them, catching light at slight angles. Render the machine as a solemn, frontal, iconic figure against a shimmering flat GOLD tessellated background, with a glowing halo, stylised flattened forms, and rich deep blues, reds, greens and gold tiles. The result must clearly read as an antique tile mosaic. Output only the image." },
  { id: "papercraft", label: "ペーパークラフト風",
    prompt: "Completely transform this image into a papercraft / low-poly paper-model scene — the machine built entirely out of folded and glued paper. You MUST restyle BOTH the subject AND the background — nothing may remain photographic. Reconstruct the machine as flat polygonal paper facets folded along visible crease lines, with slightly imperfect cut edges, small glue tabs, soft matte paper texture, and gentle real shadows cast between the folded planes as if photographed under soft studio light. Place it in a simple papercraft diorama where the background and ground are also made of colored construction paper / cardstock. The whole scene must look like a handmade paper model. Output only the image." },
  { id: "kirie", label: "切り絵風",
    prompt: "Completely transform this image into a layered kirie (切り絵) paper-cut artwork. You MUST restyle BOTH the subject AND the background — nothing may remain photographic. Re-render the entire scene as cleanly knife-cut silhouettes and shapes from several layers of colored paper, stacked with subtle drop shadows between layers to give gentle depth. Reduce the machine to bold, simplified flat cut-out shapes connected by delicate paper bridges, with crisp edges and no gradients — flat planes of color only. Keep the silhouette clean and instantly readable. The result must look like a handcrafted multi-layer paper-cut. Output only the image." },
  { id: "blueprint", label: "ブループリント風",
    prompt: "Completely transform this image into a technical blueprint / cyanotype engineering drawing of the machine. You MUST restyle BOTH the subject AND the background — nothing may remain photographic. Re-render everything as precise thin WHITE and pale-cyan technical line-work on a solid deep blueprint-blue background: clean orthographic-style outline drawing, construction lines, hidden dashed lines, dimension arrows and measurement callouts, a ruled grid and border, a title block in the corner, and handwritten-style technical annotations and part numbers. No photographic shading or color — only blueprint line-art. The result must look like a real engineering blueprint of the mobile suit. Output only the image." },
  { id: "pixelart", label: "ドット絵風",
    prompt: "Completely transform this image into retro 16-bit PIXEL ART (ドット絵), like a 1990s video-game sprite. You MUST restyle BOTH the subject AND the background — nothing may remain photographic. Rebuild the ENTIRE image from a low-resolution grid of clearly visible square pixels with a deliberately limited indexed color palette, hard-edged dithering for gradients and shading, crisp pixel outlines and chunky aliased edges — absolutely no smooth anti-aliasing or blur. Render the background as a simple tiled game scene. The whole image must look like an authentic pixel-art game sprite. Output only the image." },
  { id: "glitch", label: "グリッチアート風",
    prompt: "Completely transform this image into digital GLITCH ART / databending corruption. You MUST distort BOTH the subject AND the background — nothing may remain clean or photographic. Tear the image apart with digital artifacts: horizontal datamosh displacement, RGB chromatic-aberration channel splitting into red/green/blue ghosts, blocky JPEG compression smears, pixel-sorting streaks, scanline tearing, signal noise, corrupted color bands and broken-screen distortion. Fragment and shift slices of the machine sideways as if the video signal is malfunctioning. The result must look like a corrupted, broken digital image. You MAY aggressively displace and duplicate parts. Output only the image." },
];
function initStyleOpts(s) {
  const o = {};
  (s.fields || []).forEach((f) => { o[f.key] = f.type === "select" ? ((f.options[0] && f.options[0].value) || "") : ""; });
  return o;
}

/* AI画像モデル定義(画像生成/編集系)。providerは model 名から判定 */
/* 機体情報の修正提案。検索→選択→編集→差分を送信(アプリのデータは変更しない)。
   送信先: REPORT_API(Cloudflare Worker 等)を設定すれば POST、未設定/失敗時はメールにフォールバック。 */
const REPORT_API = "";    // 例: "https://gunpla-report.xxxx.workers.dev"(建てたら設定)
const REPORT_SECRET = ""; // Worker の REPORT_SECRET と同じ値(※フロントに露出・簡易的なbot避けのみ)
function KitFixModal({ allKits, onClose }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(null);
  const [form, setForm] = useState(null);

  const results = useMemo(() => {
    const s = normJa(q.trim());
    if (!s) return [];
    return allKits
      .filter((k) => normJa([k.name, k.code, k.series, k.no].filter(Boolean).join(" ")).includes(s))
      .slice(0, 25);
  }, [q, allKits]);

  const pick = (k) => {
    setPicked(k);
    setForm({
      name: k.name || "", code: k.code || "", series: k.series || "",
      ym: k.ym || "", price: k.price != null ? String(k.price) : "",
      grade: k.grade || "", line: k.line || "", premium: !!k.premium,
    });
  };
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    const FIELDS = [
      ["name", picked.name || ""],
      ["code", picked.code || ""],
      ["series", picked.series || ""],
      ["ym", picked.ym || ""],
      ["price", picked.price != null ? String(picked.price) : ""],
      ["grade", picked.grade || ""],
      ["line", picked.line || ""],
      ["premium", picked.premium ? "true" : "false"],
    ];
    const changes = {};
    FIELDS.forEach(([key, oldVal]) => {
      let nv = key === "premium" ? (form.premium ? "true" : "false") : form[key];
      nv = String(nv == null ? "" : nv).trim();
      const ov = String(oldVal).trim();
      if (nv !== ov) changes[key] = { old: ov, new: nv };
    });
    if (Object.keys(changes).length === 0) { notify("変更がありません。修正してから送信してください", { kind: "warn" }); return; }
    const payload = { type: "kit_correction", id: picked.id, no: picked.no, name: picked.name, changes };

    // メール送信(フォールバック)
    const mailFallback = () => {
      const body =
        "ガンプラ大図鑑 — 機体情報の修正提案\n\n" +
        "対象: " + (picked.name || "") + " (" + (picked.code || "") + ") / id=" + picked.id + "\n\n" +
        "▼ 機械処理用(変更フィールドのみ・old→new):\n" +
        "```json\n" + JSON.stringify(payload, null, 2) + "\n```\n\n" +
        "▼ 補足・出典(任意):\n";
      const subject = "【機体情報修正】" + (picked.name || "") + " (" + (picked.code || "") + ")";
      window.location.href =
        "mailto:kishoujpjp@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    };

    // REPORT_API が設定済みなら POST、失敗時はメールへ
    if (REPORT_API) {
      try {
        const res = await fetch(REPORT_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(REPORT_SECRET ? { "X-Report-Secret": REPORT_SECRET } : {}),
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        notify("修正提案を送信しました。ありがとうございます", { kind: "ok" });
        onClose();
        return;
      } catch (e) {
        mailFallback();
        return;
      }
    }
    mailFallback();
  };

  return (
    <div className="modal-bg search-modal-bg" onClick={onClose}>
      <div className="modal search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sm-head">
          <span className="sm-title">機体情報<em>修正</em> <span className="sm-eyebrow">{picked ? "EDIT" : "SEARCH"}</span></span>
          <button className="modal-x static" onClick={onClose}>✕</button>
        </div>
        {!picked ? (
          <>
            <div className="toolbar">
              <input className="search" placeholder="名称・型式・原作で検索" value={q} autoFocus
                onChange={(e) => setQ(e.target.value)} />
              {q && <button className="search-x" onClick={() => setQ("")}>✕</button>}
            </div>
            <div className="fix-results">
              {q.trim() && results.length === 0 && <p className="fix-empty">該当する機体がありません。</p>}
              {results.map((k) => (
                <button key={k.id} className="fix-row" onClick={() => pick(k)}>
                  <span className="fix-row-name">{k.name}</span>
                  <span className="fix-row-sub">{[k.grade, k.code, k.series].filter(Boolean).join(" · ")}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="fix-form">
            <div className="fix-target">対象 <b>{picked.name}</b>（{picked.code || "—"}）
              <button className="fix-back" onClick={() => { setPicked(null); setForm(null); }}>別の機体</button>
            </div>
            <label className="fld pad"><span>名称</span><input value={form.name} onChange={set("name")} /></label>
            <label className="fld pad"><span>型式番号</span><input value={form.code} onChange={set("code")} placeholder="RX-78-2" /></label>
            <label className="fld pad"><span>原作</span><input value={form.series} onChange={set("series")} /></label>
            <label className="fld pad"><span>発売年月</span><input type="month" value={form.ym} onChange={set("ym")} /></label>
            <label className="fld pad"><span>定価(円)</span><input type="number" inputMode="numeric" value={form.price} onChange={set("price")} /></label>
            <label className="fld pad"><span>グレード</span><input value={form.grade} onChange={set("grade")} placeholder="HG / MG / RG ..." /></label>
            <label className="fld pad"><span>ブランド</span><input value={form.line} onChange={set("line")} /></label>
            <div className="fld pad"><span>P-Bandai限定</span>
              <button type="button" className={"fix-toggle" + (form.premium ? " on" : "")}
                onClick={() => setForm((f) => ({ ...f, premium: !f.premium }))}>{form.premium ? "はい" : "いいえ"}</button>
            </div>
            <button className="btn primary fix-send" onClick={submit}>修正をメールで送信</button>
            <p className="footnote">変更したフィールドのみ、AIが読み取りやすいJSON形式でメール本文に入ります。送信でメールアプリが開きます。</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── AI機体判別(Phase A):画像→候補→確認して図鑑に追加 ───────── */
const IDENT_PROMPT = `あなたはガンダムシリーズのプラモデル(ガンプラ)に精通した機体識別の専門家です。
画像に写る機体(モビルスーツ)が何かを推定してください。
手順: 箱・説明書・品番ラベルなどの印刷文字が読めれば、それを最優先の根拠にする。読めない場合は外見(シルエット・配色・特徴部位)から推定する。
回答方針(重要):
- 各候補は「正式名称(日本語)」と「登場作品」を必ず答える。
- 「型式番号」は確信があるときだけ書く。不確実なら空文字にすること(推測で型番をでっち上げない)。
- 確信が低くても、形状・配色から近いと思う機体を遠慮なく複数挙げること。1台に絞らなくてよい。「分からないので答えない」より「自信はないが近そうな候補を複数挙げる」方が望ましい。
- グレード(HG/MG/RG/PG等)やスケールは画像から判別できないため答えないこと。
確信度の高い順に最大5件。出力は次のJSONのみ。前後の文やマークダウンは一切付けないこと:
{"candidates":[{"name":"正式名称(日本語)","series":"作品名","code":"型式番号(確信があれば。なければ空文字)","confidence":0,"reason":"根拠"}]}
全く見当がつかない場合のみ candidates を空配列にする。`;
function _identStripJson(t) { return t ? String(t).replace(/```json/gi, "").replace(/```/g, "").trim() : ""; }
function _identParse(raw) {
  const s = _identStripJson(raw);
  try { return JSON.parse(s); } catch (e) {}
  const m = s && s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (e) {} }
  return null;
}
const IDF_BIG5 = ["UC", "SEED", "W", "G", "BF"];
const IDF_UNI_LABEL = { UC: "宇宙世紀(U.C.)", SEED: "コズミック・イラ(SEED系)", W: "アフターコロニー(Wガンダム系)", G: "フューチャーセンチュリー(Gガンダム系)", BF: "ビルドファイターズ系" };
const IDF_MODELS = [
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", note: "高精度・高速 推奨", p: "gemini" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", note: "最高精度・低速", p: "gemini" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", note: "高精度", p: "gemini" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", note: "標準・速い", p: "gemini" },
  { id: "gpt-4o", label: "GPT-4o", note: "高精度", p: "openai" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", note: "標準・速い", p: "openai" },
];

function KitIdentifyModal({ allKits, geminiKey, openaiKey, cameraMode, onAttach, onClose }) {
  const [phase, setPhase] = useState("pick"); // pick | loading | result | error
  const [storeImg, setStoreImg] = useState("");
  const [cands, setCands] = useState([]);
  const [matches, setMatches] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [model, setModel] = useState("");
  const [grounding, setGrounding] = useState(false);
  const [selUni, setSelUni] = useState("");
  const [selGrade, setSelGrade] = useState("");
  const [hint, setHint] = useState("");
  const fileRef = useRef(null);
  const manualRef = useRef(null);
  const hasKey = !!(geminiKey || openaiKey);
  const models = useMemo(() => IDF_MODELS.filter((m) => (m.p === "gemini" ? geminiKey : openaiKey)), [geminiKey, openaiKey]);
  useEffect(() => { if (!model && models.length) setModel(models[0].id); }, [models, model]);
  const modelLabel = (IDF_MODELS.find((x) => x.id === model) || {}).label || model;

  const callAI = async (b64, mime, dataUrl, prompt) => {
    const m = IDF_MODELS.find((x) => x.id === model) || models[0] || { id: "gemini-2.5-flash", p: "gemini" };
    if (m.p === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + openaiKey },
        body: JSON.stringify({ model: m.id, temperature: 0.2, response_format: { type: "json_object" },
          messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: dataUrl } }] }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "OpenAI error");
      return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    }
    const gbody = { contents: [{ parts: [{ inline_data: { mime_type: mime, data: b64 } }, { text: prompt }] }] };
    if (grounding) { gbody.tools = [{ google_search: {} }]; gbody.generationConfig = { temperature: 0.2 }; }
    else { gbody.generationConfig = { responseMimeType: "application/json", temperature: 0.2 }; }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m.id}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(gbody),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "Gemini error");
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    return parts.map((p) => p.text || "").join("");
  };

  const normCode = (s) => normJa(s || "").replace(/[\s\-_./()]/g, "");
  const scoreKit = (k, cand) => {
    let sc = 0;
    const cCode = normCode(cand.code), kCode = normCode(k.code);
    if (cCode && cCode.length >= 3 && kCode) {
      if (kCode === cCode) sc += 100;
      else if (kCode.indexOf(cCode) === 0 || cCode.indexOf(kCode) === 0) sc += 75;
      else if (kCode.includes(cCode) || cCode.includes(kCode)) sc += 55;
    }
    const cName = normJa(cand.name || ""), kName = normJa(k.name || "");
    if (cName && kName) {
      if (kName === cName) sc += 60;
      else if (kName.includes(cName) || cName.includes(kName)) sc += 42;
      else {
        const ct = (cName.match(/[\u3040-\u30ff\u4e00-\u9fffa-z0-9]+/g) || []);
        const shared = ct.filter((t) => t.length >= 2 && kName.includes(t)).length;
        if (shared) sc += Math.min(40, shared * 18);
      }
    }
    const cSer = normJa(cand.series || ""), kSer = normJa(k.series || "");
    if (cSer && kSer && (kSer.includes(cSer) || cSer.includes(kSer))) sc += 15;
    const u = universeOfKit(k);
    if (selUni) { if (u === selUni) sc += 30; else sc -= 40; }
    else if (IDF_BIG5.includes(u)) sc -= 40;
    return sc;
  };

  const runIdentify = async (file) => {
    setErr(""); setPhase("loading");
    try {
      const storeData = await fileToCompressedDataURL(file, 1080, 0.8);
      const aiData = await fileToCompressedDataURL(file, 1024, 0.82);
      setStoreImg(storeData);
      const m = /^data:([^;]+);base64,(.*)$/.exec(aiData);
      const mime = m ? m[1] : "image/jpeg";
      const b64 = m ? m[2] : (aiData.split(",")[1] || "");
      let prompt = IDENT_PROMPT;
      if (selUni) prompt += "\nユーザー情報: この機体は『" + (IDF_UNI_LABEL[selUni] || selUni) + "』の作品系の機体である。この作品系を優先的に検討すること。";
      else prompt += "\nユーザー情報: この機体は U.C.(宇宙世紀)・SEED・Wガンダム・Gガンダム・ビルド系 のいずれにも属さない作品の機体である可能性が高い。";
      if (hint.trim()) prompt += "\nユーザーからのヒント: " + hint.trim();
      const raw = await callAI(b64, mime, aiData, prompt);
      const parsed = _identParse(raw);
      const list = (parsed && Array.isArray(parsed.candidates)) ? parsed.candidates : [];
      setCands(list);
      const best = new Map(); // kitId -> {kit, conf, reason, total}
      for (const cd of list) {
        const conf = Number(cd.confidence) || 0;
        for (const k of allKits) {
          const s = scoreKit(k, cd);
          if (s < 32) continue;
          const total = s + conf * 0.3;
          const prev = best.get(k.id);
          if (!prev || total > prev.total) best.set(k.id, { kit: k, conf, reason: cd.reason || "", total });
        }
      }
      const out = [...best.values()].sort((a, b) => b.total - a.total).slice(0, 30);
      setMatches(out);
      setPhase("result");
    } catch (e) { setErr((e && e.message) || String(e)); setPhase("error"); }
  };

  const searchResults = useMemo(() => {
    const s = normJa(q.trim());
    if (!s) return [];
    return allKits.filter((k) => normJa([k.name, k.code, k.series].filter(Boolean).join(" ")).includes(s)).slice(0, 20);
  }, [q, allKits]);
  const gradeOpts = useMemo(() => [...new Set((allKits || []).map((k) => k.grade).filter(Boolean))], [allKits]);
  const uniOk = (k) => (selUni ? universeOfKit(k) === selUni : !IDF_BIG5.includes(universeOfKit(k)));
  const shownMatches = matches.filter((mm) => (!selGrade || mm.kit.grade === selGrade) && uniOk(mm.kit)).slice(0, 16);
  const shownSearch = searchResults.filter((k) => (!selGrade || k.grade === selGrade) && uniOk(k));

  const attach = (kit) => {
    onAttach(kit.id, storeImg);
    notify("「" + kit.name + "（" + (kit.grade || "") + "）」に画像を追加しました", { kind: "ok" });
    onClose();
  };

  return (
    <div className="modal-bg search-modal-bg" onClick={onClose}>
      <div className="modal search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sm-head">
          <span className="sm-title">機体<em>判別</em> <span className="sm-eyebrow">AI IDENTIFY</span></span>
          <button className="modal-x static" onClick={onClose}>✕</button>
        </div>
        {!hasKey && <p className="idf-note">設定タブで Gemini か OpenAI の APIキーを入力してください(画像はそのAIに送信されます)。</p>}
        {phase === "pick" && hasKey && (
          <div className="idf-pick">
            <p className="idf-lead">写真を選ぶと、AIが機体(MS)を推定し、図鑑の候補を提示します。グレードは写真で判別できないため、候補からあなたが選びます。</p>
            <div className="idf-modelfield">
              <ModelPicker value={model} options={models.map((mm) => ({ value: mm.id, label: mm.label, note: mm.note }))} onChange={setModel} label="辨識モデル（精度テスト用）" />
            </div>
            <div className="idf-ground">
              <label className="idf-switch">
                <input type="checkbox" checked={grounding && !isOpenAImodel(model)} disabled={isOpenAImodel(model)} onChange={(e) => setGrounding(e.target.checked)} />
                <span>Google検索でグラウンディング（Gemini限定・精度↑/低速。無料枠超過で課金注意）</span>
              </label>
            </div>
            <div className="idf-hints">
              <div className="idf-field">
                <span>世界観で絞る（任意・1つ。未選択＝上記以外の世界として絞り込み）</span>
                <div className="idf-unis">
                  {[["UC", "UC"], ["SEED", "SEED"], ["W", "W"], ["G", "G"], ["BF", "BF"]].map(([v, l]) => (
                    <button key={v} type="button" className={"idf-ubtn" + (selUni === v ? " on" : "")}
                      onClick={() => setSelUni(selUni === v ? "" : v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="idf-field">
                <span>グレードで絞る（任意・1つ。該当しないグレードを除外して候補を縮小）</span>
                <div className="idf-grades">
                  {gradeOpts.map((g) => <button key={g} type="button" className={"idf-gbtn" + (selGrade === g ? " on" : "")} onClick={() => setSelGrade(selGrade === g ? "" : g)}>{g}</button>)}
                </div>
              </div>
              <label className="idf-field">
                <span>ヒント(任意・AIへ送信)</span>
                <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="例: ○○の主役機 / 特徴的な配色" />
              </label>
            </div>
            <button className="btn primary idf-choose" onClick={() => fileRef.current && fileRef.current.click()}>{cameraMode ? "カメラを起動して撮影" : "画像を選ぶ / 撮影"}</button>
            <input ref={fileRef} type="file" accept="image/*" capture={cameraMode ? "environment" : undefined} style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) runIdentify(f); }} />
          </div>
        )}
        {phase === "loading" && <div className="idf-loading">AIが判別中…</div>}
        {phase === "error" && (
          <div className="idf-pick">
            <p className="idf-note">判別に失敗しました: {err}</p>
            <button className="btn primary idf-choose" onClick={() => setPhase("pick")}>やり直す</button>
          </div>
        )}
        {phase === "result" && (
          <div className="idf-result">
            {storeImg && <div className="idf-preview"><img src={storeImg} alt="" /></div>}
            <div className="idf-modelnote">判別モデル: {modelLabel}</div>
            {cands.length > 0 ? (
              <div className="idf-ai">
                <div className="idf-sub">AIの推定（タップで検索）</div>
                <div className="idf-chips">
                  {cands.slice(0, 5).map((cd, i) => {
                    const lab = (cd.name || cd.code || "?") + (cd.code && cd.name ? " " + cd.code : "");
                    return <button key={i} className="idf-chip" onClick={() => { setQ(cd.name || cd.code || ""); setTimeout(() => { if (manualRef.current) manualRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60); }}>{lab}{cd.confidence ? " (" + cd.confidence + "%)" : ""}</button>;
                  })}
                </div>
              </div>
            ) : <p className="idf-note">AIは機体を特定できませんでした。箱・説明書が写るように撮ると精度が大きく上がります。下で検索しても選べます。</p>}
            {gradeOpts.length > 0 && (
              <div className="idf-gfilter">
                <span>グレードで絞る</span>
                <div className="idf-grades">
                  {gradeOpts.map((g) => <button key={g} type="button" className={"idf-gbtn" + (selGrade === g ? " on" : "")} onClick={() => setSelGrade(selGrade === g ? "" : g)}>{g}</button>)}
                </div>
              </div>
            )}
            {shownMatches.length > 0 ? (
              <div className="idf-cands">
                <div className="idf-sub">候補（グレードを含め選択）</div>
                {shownMatches.map(({ kit, conf, reason }) => (
                  <button key={kit.id} className="fix-row" onClick={() => attach(kit)}>
                    <span className="fix-row-name">{kit.name}{conf ? <em className="idf-conf"> {conf}%</em> : null}</span>
                    <span className="fix-row-sub">{[kit.grade, kit.code, kit.series].filter(Boolean).join(" · ")}{reason ? " ／ " + reason : ""}</span>
                  </button>
                ))}
              </div>
            ) : (matches.length > 0 && selGrade
              ? <p className="idf-note">選択したグレード({selGrade})の候補が見つかりません。グレード選択を解除するか、下で検索してください。</p>
              : null)}
            <div className="idf-manual" ref={manualRef}>
              <div className="idf-sub">手動で検索</div>
              <div className="toolbar">
                <input className="search" placeholder="名称・型式・原作で検索" value={q} onChange={(e) => setQ(e.target.value)} />
                {q && <button className="search-x" onClick={() => setQ("")}>✕</button>}
              </div>
              <div className="fix-results">
                {shownSearch.map((k) => (
                  <button key={k.id} className="fix-row" onClick={() => attach(k)}>
                    <span className="fix-row-name">{k.name}</span>
                    <span className="fix-row-sub">{[k.grade, k.code, k.series].filter(Boolean).join(" · ")}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const AI_MODELS = [
  { group: "Google · Gemini(Nano Banana)", items: [
    { id: "gemini-3-pro-image", label: "Nano Banana Pro(最高品質)" },
    { id: "gemini-3.1-flash-image", label: "Nano Banana 2(高速)" },
    { id: "gemini-2.5-flash-image", label: "Nano Banana(従来)" },
  ] },
  { group: "OpenAI · GPT Image", items: [
    { id: "gpt-image-2", label: "GPT Image 2(最新)" },
    { id: "gpt-image-1.5", label: "GPT Image 1.5" },
    { id: "gpt-image-1-mini", label: "GPT Image 1 mini(軽量)" },
  ] },
];
const isOpenAImodel = (m) => /^gpt-image/.test(m || "");
const aiProviderLabel = (m) => (isOpenAImodel(m) ? "OpenAI" : "Google Gemini");
/* 選択モデルに対応する端末ローカルのAPIキーを返す */
const aiActiveKey = (ai) => (ai ? (isOpenAImodel(ai.model) ? ai.openaiKey || "" : ai.geminiKey || "") : "");
/* 自前のドロップダウン(ネイティブselectの代替)。開くと下にリストを展開(クリップ回避のためインフロー) */
function ModelPicker({ value, options, onChange, label }) {
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  useEffect(() => { if (open && listRef.current && listRef.current.scrollIntoView) listRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [open]);
  const cur = options.find((o) => o.value === value) || options[0] || {};
  return (
    <div className={"mpk" + (open ? " open" : "")}>
      {label ? <div className="mpk-label">{label}</div> : null}
      <button type="button" className="mpk-btn" onClick={() => setOpen((v) => !v)}>
        <span className="mpk-cur">{cur.label || "—"}{cur.note ? <i> · {cur.note}</i> : null}</span>
        <span className="mpk-caret">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div className="mpk-list" ref={listRef}>
          {options.map((o) => (
            <button key={o.value} type="button" className={"mpk-item" + (o.value === value ? " on" : "")}
              onClick={() => { onChange(o.value); setOpen(false); }}>
              <span className="mpk-il">{o.label}</span>
              {o.note ? <span className="mpk-in">{o.note}</span> : null}
              {o.value === value ? <span className="mpk-ck">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
const AI_MODEL_OPTS = AI_MODELS.flatMap((g) => g.items.map((it) => ({ value: it.id, label: it.label, note: isOpenAImodel(it.id) ? "OpenAI" : "Gemini" })));

function AIRestyleModal({ src, geminiKey, openaiKey, model, prompts, lastStyle, onModel, onStyle, onAdopt, onClose }) {
  const [style, setStyle] = useState(lastStyle || AI_STYLES[0].id);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [chosenModel, setChosenModel] = useState(model);
  const [styleOpts, setStyleOpts] = useState(() => initStyleOpts(AI_STYLES.find((s) => s.id === (lastStyle || AI_STYLES[0].id)) || AI_STYLES[0]));
  const curStyle = AI_STYLES.find((s) => s.id === style) || AI_STYLES[0];
  const ctrlRef = useRef(null);
  const aliveRef = useRef(true);
  // モーダルが閉じた/再生成で差し替わった時に進行中のリクエストを確実に中止する。
  // aliveRef でアンマウント後の setState(警告/無駄な更新)も防ぐ。
  useEffect(() => () => { aliveRef.current = false; if (ctrlRef.current) ctrlRef.current.abort(); }, []);
  const cancel = () => { if (ctrlRef.current) ctrlRef.current.abort(); };

  const generate = async () => {
    setBusy(true); setError("");
    if (ctrlRef.current) ctrlRef.current.abort();      // 二重実行の保護
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    const timer = setTimeout(() => ctrl.abort(), 90000); // 90秒で打ち切り(無限 busy 防止)
    try {
      const apiKey = isOpenAImodel(chosenModel) ? openaiKey : geminiKey;
      const b64 = src.split(",")[1];
      const mime = (src.match(/^data:([^;]+);/) || [])[1] || "image/jpeg";
      const styleDef = AI_STYLES.find((s) => s.id === style) || AI_STYLES[0];
      let prompt = (prompts && prompts[style]) || styleDef.prompt;
      if (styleDef.extra) prompt = prompt + " " + styleDef.extra(styleOpts);
      if (isOpenAImodel(chosenModel)) {
        /* OpenAI 画像編集: /v1/images/edits(multipart, b64_json を返す) */
        const blob = await (await fetch(src)).blob();
        const ext = ((blob.type.split("/")[1] || "png").replace("jpeg", "jpg"));
        const form = new FormData();
        form.append("model", chosenModel);
        form.append("image", blob, `kit.${ext}`);
        form.append("prompt", prompt);
        form.append("size", "auto");
        const res = await fetch("https://api.openai.com/v1/images/edits", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error((data.error && data.error.message) || "HTTP " + res.status);
        const out = data.data && data.data[0] && data.data[0].b64_json;
        if (!out) throw new Error("画像が返されませんでした(モデレーションの可能性があります)");
        if (aliveRef.current) setResult(`data:image/png;base64,${out}`);
      } else {
        /* Google Gemini: generateContent(inline_data で画像返却) */
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: mime, data: b64 } }, { text: prompt }] }] }),
            signal: ctrl.signal,
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error((data.error && data.error.message) || "HTTP " + res.status);
        const parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
        const imgPart = parts.find((pt) => pt.inline_data || pt.inlineData);
        if (!imgPart) throw new Error("画像が返されませんでした(セーフティブロックの可能性があります)");
        const pd = imgPart.inline_data || imgPart.inlineData;
        if (aliveRef.current) setResult(`data:${pd.mime_type || pd.mimeType || "image/png"};base64,${pd.data}`);
      }
    } catch (e) {
      if (!aliveRef.current) { /* アンマウント済み:状態更新しない */ }
      else if (e && e.name === "AbortError") setError("中止しました(90秒で時間切れ、または手動キャンセル)");
      else setError(String((e && e.message) || e));
    }
    clearTimeout(timer);
    ctrlRef.current = null;
    if (aliveRef.current) setBusy(false);
  };

  const adopt = async () => {
    const out = await new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        const sc = Math.min(1, 1280 / im.width);
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      im.onerror = () => res(result);
      im.src = result;
    });
    onAdopt(out, { src: "ai", model: chosenModel, style });
  };

  return (
    <div className="crop-bg">
      <div className="crop-panel">
        <div className="crop-head">AIスタイル変換<span>{chosenModel}</span></div>
        <div className="ai-modelpick"><ModelPicker value={chosenModel} options={AI_MODEL_OPTS} onChange={(v) => { setChosenModel(v); setResult(null); if (onModel) onModel(v); }} label="変換モデル" /></div>
        <div className="ai-modelpick"><ModelPicker value={style} label="スタイル" options={AI_STYLES.map((s) => ({ value: s.id, label: s.label }))}
          onChange={(v) => { setStyle(v); setResult(null); setStyleOpts(initStyleOpts(AI_STYLES.find((s) => s.id === v) || AI_STYLES[0])); if (onStyle) onStyle(v); }} /></div>
        {curStyle.fields ? (
          <div className="ai-fields">
            {curStyle.fields.map((f) => f.type === "select" ? (
              <ModelPicker key={f.key} label={f.label} value={styleOpts[f.key] || ((f.options[0] && f.options[0].value) || "")}
                options={f.options} onChange={(v) => { setStyleOpts((o) => ({ ...o, [f.key]: v })); setResult(null); }} />
            ) : (
              <div key={f.key} className="ai-field">
                <div className="ai-field-lab">{f.label}</div>
                <input className="ai-field-in" value={styleOpts[f.key] || ""} placeholder={f.placeholder || ""}
                  onChange={(e) => setStyleOpts((o) => ({ ...o, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        ) : null}
        <div className="ai-preview">
          {busy ? (
            <div className="ai-progress">
              <div className="ai-bar"><i /></div>
              <span>生成中…(10〜30秒ほどかかります)</span>
            </div>
          ) : (
            <img src={result || src} alt="" />
          )}
        </div>
        {error && <p className="ai-error">{error}</p>}
        <div className="crop-actions">
          {result && !busy && <button className="btn primary" onClick={adopt}>この画像を採用</button>}
          <button className="btn" disabled={busy} onClick={generate}>{busy ? "生成中…" : result ? "もう一度生成" : "生成する"}</button>
          <button className="btn" onClick={busy ? cancel : onClose}>{busy ? "中止" : "やめる"}</button>
        </div>
        <p className="ai-note">画像はお使いの端末から{aiProviderLabel(model)} APIへ直接送信されます。</p>
      </div>
    </div>
  );
}

/* ── 圖像裁切器(觸控/滑鼠通用) ── */
function CropModal({ src, onDone, onCancel }) {
  const imgRef = useRef(null);
  const [rect, setRect] = useState(null);
  const [disp, setDisp] = useState(null);
  const dragRef = useRef(null);

  const onImgLoad = () => {
    const im = imgRef.current;
    if (!im) return;
    const w = im.clientWidth, h = im.clientHeight;
    setDisp({ w, h });
    const s = Math.min(w, h) * 0.86;
    setRect({ x: (w - s) / 2, y: (h - s) / 2, w: s, h: s });
  };

  const clamp = (r, d) => {
    const w = Math.max(40, Math.min(r.w, d.w));
    const h = Math.max(40, Math.min(r.h, d.h));
    return { x: Math.max(0, Math.min(r.x, d.w - w)), y: Math.max(0, Math.min(r.y, d.h - h)), w, h };
  };

  const startDrag = (mode) => (e) => {
    e.stopPropagation();
    const p = e.touches ? e.touches[0] : e;
    dragRef.current = { mode, sx: p.clientX, sy: p.clientY, r: { ...rect } };
  };
  const onMove = (e) => {
    if (!dragRef.current || !disp) return;
    const p = e.touches ? e.touches[0] : e;
    const { mode, sx, sy, r } = dragRef.current;
    const dx = p.clientX - sx, dy = p.clientY - sy;
    if (mode === "move") setRect(clamp({ ...r, x: r.x + dx, y: r.y + dy }, disp));
    else setRect(clamp({ ...r, w: r.w + dx, h: r.h + dy }, disp));
  };
  const endDrag = () => { dragRef.current = null; };

  const confirm = () => {
    const im = imgRef.current;
    if (!im || !rect || !disp) return;
    try {
      const sx = im.naturalWidth / disp.w, sy = im.naturalHeight / disp.h;
      const cw = rect.w * sx, ch = rect.h * sy;
      const outW = Math.min(480, Math.round(cw));
      const c = document.createElement("canvas");
      c.width = outW; c.height = Math.round(outW * (ch / cw));
      c.getContext("2d").drawImage(im, rect.x * sx, rect.y * sy, cw, ch, 0, 0, c.width, c.height);
      onDone(c.toDataURL("image/jpeg", 0.75));
    } catch (err) {
      console.error(err);
      notify("この画像は切り抜きできません(外部URL画像はCORS制限のため不可)", { kind: "warn", dur: 3200 });
    }
  };

  return (
    <div className="crop-bg" onMouseMove={onMove} onMouseUp={endDrag} onTouchMove={onMove} onTouchEnd={endDrag}>
      <div className="crop-panel">
        <div className="crop-head">画像の切り抜き<span>枠をドラッグで移動・右下の○で拡縮</span></div>
        <div className="crop-box">
          <img ref={imgRef} src={src} alt="" crossOrigin="anonymous" onLoad={onImgLoad} draggable={false}
            onError={() => { notify("画像を読み込めませんでした(外部画像はCORS制限の場合があります)", { kind: "err", dur: 3200 }); onCancel(); }} />
          {rect && (
            <div className="crop-rect" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
              onMouseDown={startDrag("move")} onTouchStart={startDrag("move")}>
              <i className="crop-handle" onMouseDown={startDrag("resize")} onTouchStart={startDrag("resize")} />
            </div>
          )}
        </div>
        <div className="crop-actions">
          <button className="btn primary" onClick={confirm}>この範囲で決定</button>
          <button className="btn" onClick={() => disp && setRect({ x: 0, y: 0, w: disp.w, h: disp.h })}>全体</button>
          <button className="btn" onClick={onCancel}>やめる</button>
        </div>
      </div>
    </div>
  );
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

function TagField({ tags, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
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
        placeholder="タグを半角「;」区切りで入力" />
    );
  }
  return (
    <span className="kt-field" role="button" tabIndex={0} onClick={start}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); } }}>
      {tags.length
        ? tags.map((t) => <span key={t} className="dc-tag">{t}</span>)
        : <span className="kt-empty">タグを追加…</span>}
      <i className="kt-pen" aria-hidden="true">✎</i>
    </span>
  );
}

function NoteField({ note, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const start = (e) => { if (e) e.stopPropagation(); setDraft(note || ""); setEditing(true); };
  const commit = () => { onCommit(draft.trim()); setEditing(false); };
  if (editing) {
    return (
      <textarea className="dc-memo-edit" autoFocus rows={2} value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setEditing(false); } }}
        placeholder="改修予定、塗装レシピ、保管場所など" />
    );
  }
  return (
    <span className="dc-memo" role="button" tabIndex={0} onClick={start}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); } }}>
      {note ? note : <span className="kt-empty">メモを追加…</span>}
    </span>
  );
}

/* ── アプリ内 通知/確認(native alert/confirm の置き換え。APP風) ── */
let _toastSeq = 0;
function notify(msg, opt) {
  try { window.dispatchEvent(new CustomEvent("app-toast", { detail: { id: ++_toastSeq, msg, kind: (opt && opt.kind) || "ok", dur: (opt && opt.dur) || 2400 } })); }
  catch (e) {}
}
function appConfirm(message, opt) {
  return new Promise((resolve) => {
    try { window.dispatchEvent(new CustomEvent("app-confirm", { detail: { message, opt: opt || {}, resolve } })); }
    catch (e) { resolve(typeof window !== "undefined" && window.confirm ? window.confirm(message) : false); }
  });
}
function AppDialogHost() {
  const [toasts, setToasts] = useState([]);
  const [cf, setCf] = useState(null);
  useEffect(() => {
    const onT = (e) => { const t = e.detail; setToasts((a) => [...a, t]); setTimeout(() => setToasts((a) => a.filter((x) => x.id !== t.id)), t.dur); };
    const onC = (e) => setCf(e.detail);
    window.addEventListener("app-toast", onT);
    window.addEventListener("app-confirm", onC);
    return () => { window.removeEventListener("app-toast", onT); window.removeEventListener("app-confirm", onC); };
  }, []);
  const done = (v) => { if (cf && cf.resolve) cf.resolve(v); setCf(null); };
  const ic = { ok: "✓", err: "✕", warn: "!", info: "◈" };
  return (
    <>
      <div className="toast-host">
        {toasts.map((t) => (
          <div key={t.id} className={"toast " + t.kind}><span className="ti">{ic[t.kind] || "◈"}</span><span className="tm">{t.msg}</span></div>
        ))}
      </div>
      {cf ? (
        <div className="cf-bg" onClick={() => done(false)}>
          <div className="cf-card" onClick={(e) => e.stopPropagation()}>
            <div className="cf-line" />
            {cf.opt.title ? <div className="cf-h">{cf.opt.title}</div> : null}
            <div className="cf-m">{cf.message}</div>
            <div className="cf-acts">
              <button className="cf-btn" onClick={() => done(false)}>{cf.opt.cancelText || "キャンセル"}</button>
              <button className={"cf-btn ok" + (cf.opt.danger ? " danger" : "")} onClick={() => done(true)}>{cf.opt.okText || "OK"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ImageEditorModal({ kit, images, extras, albumMeta, builderName, ai, initialCols, onCols, onAddImage, onRemoveImage, onSetRole, onFrame, onReorder, onSetLoc, onClose, onBack }) {
  const kitId = kit.id;
  const baseRefs = albumRefs(kitId, images, extras, albumMeta);
  const baseKey = baseRefs.join("|");
  const [order, setOrder] = useState(baseRefs);
  const [cols, setColsState] = useState(initialCols === 3 ? 3 : 2); // 工房グリッドの列数(2 / 3)
  const setCols = (n) => { setColsState(n); if (onCols) onCols(n); }; // 設定に保存し次回も維持
  const [srcFilter, setSrcFilter] = useState("all"); // 由来フィルタ: all / photo / ai
  const orderRef = useRef(order);
  const dragRef = useRef(null);
  useEffect(() => { orderRef.current = order; }, [order]);
  // 追加/削除でrefs集合が変わったら、現順序を保ちつつ同期
  useEffect(() => {
    if (dragRef.current) return;
    setOrder((cur) => {
      if (cur.join("|") === baseKey) return cur;
      const present = new Set(baseRefs);
      const merged = cur.filter((r) => present.has(r));
      baseRefs.forEach((r) => { if (merged.indexOf(r) < 0) merged.push(r); });
      return merged;
    });
    // eslint-disable-next-line
  }, [baseKey]);

  const [sel, setSel] = useState(null);     // 操作シート対象 ref
  const [addOpen, setAddOpen] = useState(false);
  const [urlVal, setUrlVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSrc, setAiSrc] = useState(null);
  const [locEditing, setLocEditing] = useState(false);
  const [locText, setLocText] = useState("");
  // ── 同機体限定の鑑賞ビューア(長押しで起動。繪測卷と違い他機体へは飛ばない)──
  const [viewRef, setViewRef] = useState(null);   // 表示中の ref(null=閉)
  const [viewFrom, setViewFrom] = useState(null); // "sheet"=画像情報経由 / "grid"=編集グリッド経由
  const lpRef = useRef({ timer: 0, fired: false });
  const lpStart = (onLong, ms = 460) => { lpRef.current.fired = false; clearTimeout(lpRef.current.timer); lpRef.current.timer = setTimeout(() => { lpRef.current.fired = true; onLong(); }, ms); };
  const lpCancel = () => clearTimeout(lpRef.current.timer);
  const consumeLP = () => { if (lpRef.current.fired) { lpRef.current.fired = false; return true; } return false; };
  const makeLP = (onLong) => ({ onTouchStart: () => lpStart(onLong), onTouchEnd: lpCancel, onTouchMove: lpCancel, onMouseDown: () => lpStart(onLong), onMouseUp: lpCancel, onMouseLeave: lpCancel, onContextMenu: (e) => e.preventDefault() });
  const openView = (ref, from) => { if (!ref) return; setViewFrom(from); setViewRef(ref); };
  useEffect(() => () => clearTimeout(lpRef.current.timer), []);
  const camRef = useRef(null);
  const albRef = useRef(null);

  // ── ドラッグ並べ替え:浮遊ゴースト追従(指に吸着) + FLIP リフロー ──
  const [drag, setDrag] = useState(null);   // {ref, src, w, h}
  const dragId = drag && drag.ref;
  const ghostRef = useRef(null);
  const grab = useRef({ dx: 0, dy: 0 });
  const tileEls = useRef({});               // ref -> element
  const prevRects = useRef(null);
  const cellsRef = useRef([]);              // 固定格位(ドラッグ開始時に確定。動画と無関係)
  const dragBaseRef = useRef([]);           // ドラッグ開始時の順序
  const lastIdxRef = useRef(-1);            // 直近の挿入位置

  const moveGhost = (x, y) => {
    const g = ghostRef.current; if (!g) return;
    g.style.transform = "translate3d(" + (x - grab.current.dx) + "px," + (y - grab.current.dy) + "px,0) scale(1.045)";
  };
  const captureRects = () => {
    const m = {};
    Object.keys(tileEls.current).forEach((r) => { const el = tileEls.current[r]; if (el) m[r] = el.getBoundingClientRect(); });
    prevRects.current = m;
  };
  // 順序が変わったら、前位置→新位置を反転して滑らかに送る(FLIP)
  useLayoutEffect(() => {
    const prev = prevRects.current; if (!prev) return; prevRects.current = null;
    Object.keys(tileEls.current).forEach((r) => {
      const el = tileEls.current[r], p = prev[r]; if (!el || !p) return;
      const now = el.getBoundingClientRect();
      const dx = p.left - now.left, dy = p.top - now.top;
      if (!dx && !dy) return;
      el.style.transition = "none";
      el.style.transform = "translate(" + dx + "px," + dy + "px)";
      el.getBoundingClientRect(); // reflow
      requestAnimationFrame(() => { el.style.transition = "transform .24s cubic-bezier(.34,1.4,.5,1)"; el.style.transform = ""; });
    });
  }, [order]);

  const onHandleDown = (ref) => (e) => {
    if (e.button != null && e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    const base = orderRef.current.slice();
    dragBaseRef.current = base;
    lastIdxRef.current = base.indexOf(ref);
    // 開始時点でn個の格位(画面位置)を固定取得。以後この座標だけで挿入位置を決める
    cellsRef.current = base.map((r) => {
      const el = tileEls.current[r]; const b = el ? el.getBoundingClientRect() : null;
      if (!b) return null;
      const ix = b.width * 0.14, iy = b.height * 0.14; // 内縁にデッドゾーン(遲滯)
      return { l: b.left + ix, r: b.right - ix, t: b.top + iy, bo: b.bottom - iy };
    });
    const el = tileEls.current[ref];
    const r = el ? el.getBoundingClientRect() : null;
    grab.current = r ? { dx: e.clientX - r.left, dy: e.clientY - r.top } : { dx: 24, dy: 24 };
    dragRef.current = ref;
    setDrag({ ref, src: refSrc(ref, kitId, images, extras), w: r ? r.width : 120, h: r ? r.height : 120 });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {}
    requestAnimationFrame(() => moveGhost(e.clientX, e.clientY));
    hapticStrong();
  };
  const onGridMove = (e) => {
    if (!dragRef.current) return;
    e.preventDefault();
    moveGhost(e.clientX, e.clientY);
    const cells = cellsRef.current;
    // 指が「明確に」入った格位だけを採用。隙間/デッドゾーンでは現状維持→震えない
    let idx = -1;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i]; if (!c) continue;
      if (e.clientX >= c.l && e.clientX <= c.r && e.clientY >= c.t && e.clientY <= c.bo) { idx = i; break; }
    }
    if (idx < 0 || idx === lastIdxRef.current) return;
    lastIdxRef.current = idx;
    captureRects();
    const rest = dragBaseRef.current.filter((r) => r !== dragRef.current);
    rest.splice(idx, 0, dragRef.current);  // 固定格位idxへ挿入(他は相対順を保って詰まる)
    setOrder(rest);
  };
  const onGridUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null; setDrag(null); onReorder(orderRef.current);
  };

  const thumbR = pickRef("thumb", kitId, images, extras, albumMeta);
  const selMeta = sel ? imgMetaFrom(albumMeta, kitId, sel) : null;
  const selIdx = sel ? order.indexOf(sel) : -1;
  const selSrc = sel ? refSrc(sel, kitId, images, extras) : null;
  const selFr = sel ? framingStyle((albumMeta[kitId] && albumMeta[kitId].framing && albumMeta[kitId].framing[sel]) || null) : null;

  const metaLine = (ref) => {
    const m = imgMetaFrom(albumMeta, kitId, ref);
    const d = m && m.at ? new Date(m.at) : null;
    const ds = d ? (("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2)) : "";
    if (m && m.src === "ai") { const o = AI_MODEL_OPTS.find((x) => x.value === m.model); return { cls: "ai", text: "✦ " + ((o && o.label) || m.model || "AI"), date: ds }; }
    const by = (m && m.by) || builderName || "";
    return { cls: "pho", text: "◉ " + (by ? "photoed by " + by : "写真"), date: ds };
  };
  const fmtDT = (at) => { if (!at) return "—"; const d = new Date(at); const p = (n) => ("0" + n).slice(-2); return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()); };

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]; if (e.target) e.target.value = "";
    if (!f) return;
    setBusy(true);
    try { const url = await fileToCompressedDataURL(f, 1280, 0.82); onAddImage(url, { src: "photo" }); }
    catch (err) { notify("画像の読み込みに失敗しました", { kind: "err" }); }
    setBusy(false); setAddOpen(false);
  };
  const addUrl = () => { const u = urlVal.trim(); if (!u) return; onAddImage(u, { src: "photo" }); setUrlVal(""); setAddOpen(false); };
  const openAI = () => { if (!aiActiveKey(ai)) { notify(aiProviderLabel(ai && ai.model) + " のAPIキーを設定タブで入力してください", { kind: "warn", dur: 3200 }); return; } setAiSrc(selSrc); setAiOpen(true); setSel(null); setLocEditing(false); };
  const closeSheet = () => { setSel(null); setLocEditing(false); };
  // 画像情報シート:前後の画像へ(矢印 / 左右スワイプ)
  const gotoRel = (d) => { const i = order.indexOf(sel); const j = i + d; if (j >= 0 && j < order.length) { setSel(order[j]); setLocEditing(false); } };
  const pvSwipe = useRef(null);
  const onPvTouchStart = (e) => { const t = e.touches[0]; pvSwipe.current = { x: t.clientX, y: t.clientY }; };
  const onPvTouchEnd = (e) => {
    const s = pvSwipe.current; if (!s) return; pvSwipe.current = null;
    const t = e.changedTouches[0]; const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) gotoRel(dx < 0 ? 1 : -1);
  };

  // 鑑賞ビューア:この機体のアルバム順だけをスライドにする(他機体へは飛ばない)
  const viewSlides = order.filter((r) => refSrc(r, kitId, images, extras)).map((r) => ({ kitId, ref: r, name: kit.name, series: kit.series, code: kit.code, no: kit.no }));
  const viewIdx = Math.max(0, viewSlides.findIndex((s) => s.ref === viewRef));
  // ビューアを閉じる際の突き抜けタップ防止は module の swallowNextClick を使用。
  // 閉じる:from=sheet は sel を維持して画像情報シートへ復帰 / from=grid は sel=null のままグリッドへ
  const closeView = () => setViewRef(null);

  // ── 内部レイヤーを App の戻るキースタックへ橋渡し(内側→外側の順) ──
  const internalCloses = [];
  if (viewRef) internalCloses.push(closeView);
  if (aiOpen) internalCloses.push(() => setAiOpen(false));
  if (addOpen) internalCloses.push(() => setAddOpen(false));
  if (sel) internalCloses.push(closeSheet);
  const internalClosesRef = useRef(internalCloses);
  internalClosesRef.current = internalCloses;
  const closeTopRef = useRef(null);
  if (!closeTopRef.current) closeTopRef.current = () => { const f = internalClosesRef.current[0]; if (f) f(); };
  useEffect(() => { if (onBack) onBack(internalCloses.length, closeTopRef.current); }, [internalCloses.length]);
  useEffect(() => () => { if (onBack) onBack(0, null); }, []);

  return (
    <>
    <div className="ie-bg" onClick={() => { if (sel) closeSheet(); else if (addOpen) setAddOpen(false); else onClose(); }}>
      <div className="ie-panel" onClick={(e) => e.stopPropagation()}>
        <div className="ie-head">
          <div className="sm-head">
            <span className="sm-title">画像<em>編集</em> <span className="sm-eyebrow">atelier</span></span>
            <button className="modal-x static" onClick={onClose}>✕</button>
          </div>
          {[kit.code || kit.name, kit.grade].filter(Boolean).length ? <div className="ie-subcode">{[kit.code || kit.name, kit.grade].filter(Boolean).join(" · ")}</div> : null}
        </div>
        <div className="ie-bar">
          <span className="ie-cnt">{order.length}<i>枚</i></span>
          <span className="ie-srcfilter">
            {[["all", "全"], ["photo", "写真"], ["ai", "AI"]].map(([v, l]) => (
              <button key={v} type="button" className={"ie-sfbtn" + (srcFilter === v ? " on" : "")} onClick={() => setSrcFilter(v)}>{l}</button>
            ))}
          </span>
          <span className="ie-cols">
            <button type="button" className={"ie-colbtn" + (cols === 2 ? " on" : "")} onClick={() => setCols(2)} aria-label="2列">▥</button>
            <button type="button" className={"ie-colbtn" + (cols === 3 ? " on" : "")} onClick={() => setCols(3)} aria-label="3列">▦</button>
          </span>
        </div>
        <div className="ie-scroll" onPointerMove={onGridMove} onPointerUp={onGridUp} onPointerCancel={onGridUp} onPointerLeave={onGridUp}>
          <div className={"ie-grid" + (cols === 3 ? " c3" : "")}>
            {(srcFilter === "all" ? order : order.filter((ref) => {
              const m = imgMetaFrom(albumMeta, kitId, ref);
              const s = m && m.src === "ai" ? "ai" : "photo";
              return s === srcFilter;
            })).map((ref) => {
              const src = refSrc(ref, kitId, images, extras);
              const fr = framingStyle((albumMeta[kitId] && albumMeta[kitId].framing && albumMeta[kitId].framing[ref]) || null);
              return (
                <div key={ref} ref={(el) => { if (el) tileEls.current[ref] = el; else delete tileEls.current[ref]; }} data-ref={ref} className={"ie-tile" + (dragId === ref ? " drag" : "")} {...makeLP(() => openView(ref, "grid"))} onClick={() => { if (consumeLP()) return; if (!dragId) setSel(ref); }}>
                  {src ? <img src={src} alt="" className="ie-img" style={fr} draggable={false} /> : <div className="ie-img blank" />}
                  {srcFilter === "all" && <button type="button" className="ie-drag" onPointerDown={onHandleDown(ref)} onTouchStart={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>⠿</button>}
                  {ref === thumbR ? <span className="ie-cover">封面</span> : null}
                </div>
              );
            })}
            {srcFilter === "all" && (
            <button data-ref="add" className="ie-tile add" onClick={() => setAddOpen(true)} disabled={busy}>
              <span className="ie-plus">{busy ? "…" : "＋"}</span><span className="ie-addl">画像を追加</span><span className="ie-addo">カメラ / アルバム / URL</span>
            </button>
            )}
          </div>
        </div>

        {/* 追加メニュー */}
        {addOpen ? (
          <div className="ie-dim" onClick={() => setAddOpen(false)}>
            <div className="ie-sheet add" onClick={(e) => e.stopPropagation()}>
              <div className="ie-sh-title">画像を追加</div>
              <div className="ie-addbtns">
                <button className="ie-abtn" onClick={() => camRef.current && camRef.current.click()}>
                  <svg className="ie-abi" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h2.6l1.3-2.1a1 1 0 0 1 .85-.47h6.5a1 1 0 0 1 .85.47L17.4 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.3" /></svg>
                  <span>カメラ</span>
                </button>
                <button className="ie-abtn" onClick={() => albRef.current && albRef.current.click()}>
                  <svg className="ie-abi" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="13.5" height="13.5" rx="2" /><circle cx="7.6" cy="8.6" r="1.5" /><path d="M3.4 14.5l3.6-3.1 2.8 2.3 3.2-2.9 3.5 3" /><path d="M20.5 8v9.5a3 3 0 0 1-3 3H8" /></svg>
                  <span>アルバム</span>
                </button>
              </div>
              <div className="ie-urlrow"><input value={urlVal} placeholder="画像URL" onChange={(e) => setUrlVal(e.target.value)} /><button onClick={addUrl}>追加</button></div>
            </div>
          </div>
        ) : null}

        {/* 操作シート(上部に大プレビュー / 下部に動作) */}
        {sel ? (
          <div className="ie-dim" onClick={closeSheet}>
            <div className="ie-sheet sel" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="ie-sheet-x" onClick={closeSheet} aria-label="閉じる">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
              <div className="ie-sh-title">画像情報</div>
              <div className="ie-pv full"
                onTouchStart={(e) => { onPvTouchStart(e); lpStart(() => openView(sel, "sheet")); }}
                onTouchEnd={(e) => { lpCancel(); onPvTouchEnd(e); }}
                onTouchMove={lpCancel}
                onContextMenu={(e) => e.preventDefault()}>
                {selSrc ? <img src={selSrc} alt="" className="ie-pv-img" draggable={false} /> : <div className="ie-pv-blank" />}
                <span className="ie-pv-idx">{selIdx >= 0 ? selIdx + 1 : "—"}<i> / {order.length}</i></span>
                {sel === thumbR ? <span className="ie-pv-cover">封面</span> : null}
                {selIdx > 0 ? <button type="button" className="ie-pv-nav prev" onClick={() => gotoRel(-1)} aria-label="前の画像">‹</button> : null}
                {selIdx >= 0 && selIdx < order.length - 1 ? <button type="button" className="ie-pv-nav next" onClick={() => gotoRel(1)} aria-label="次の画像">›</button> : null}
              </div>
              <dl className="ie-sh-meta">
                <dt>由来</dt><dd>{selMeta && selMeta.src === "ai" ? <span className="ai">AI生成</span> : <span className="pho">写真</span>}</dd>
                {selMeta && selMeta.src === "ai"
                  ? <>
                      <dt>モデル</dt><dd>{(AI_MODEL_OPTS.find((x) => x.value === selMeta.model) || {}).label || (selMeta && selMeta.model) || "—"}</dd>
                      <dt>スタイル</dt><dd>{(AI_STYLES.find((x) => x.id === selMeta.style) || {}).label || "—"}</dd>
                    </>
                  : <><dt>撮影者</dt><dd>{(selMeta && selMeta.by) || builderName || "—"}</dd></>}
                {selMeta && selMeta.src === "ai" ? null : (<>
                <dt>場所</dt><dd>{locEditing
                  ? <span className="ie-locedit"><input autoFocus value={locText} placeholder="例:自宅 / イベント名" onChange={(e) => setLocText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { onSetLoc(sel, locText); setLocEditing(false); } }} /><button onClick={() => { onSetLoc(sel, locText); setLocEditing(false); }}>保存</button></span>
                  : (selMeta && selMeta.loc ? <span>{selMeta.loc} <button className="ie-locbtn" onClick={() => { setLocText(selMeta.loc || ""); setLocEditing(true); }}>編集</button></span> : <span className="ie-dim2">未設定 <button className="ie-locbtn" onClick={() => { setLocText(""); setLocEditing(true); }}>＋ 入力</button></span>)}</dd>
                </>)}
                <dt>追加</dt><dd>{fmtDT(selMeta && selMeta.at)}</dd>
              </dl>
              <div className="ie-acts2">
                <button className="ie-act2" onClick={() => { const r = sel; closeSheet(); onFrame(r); }}><span className="ic">⛶</span><span>構図を整える</span></button>
                <button className="ie-act2 g" onClick={openAI}><span className="ic">✨</span><span>AIで変換</span></button>
              </div>
              <button className="ie-del" onClick={async () => { if (await appConfirm("この画像を削除します。元に戻せません。", { title: "画像を削除", okText: "削除", danger: true })) { onRemoveImage(sel); closeSheet(); } }}><svg className="ie-delic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7" /><path d="M6.4 7l.9 12.3a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5L17.6 7" /><path d="M10 11v6M14 11v6" /></svg>この画像を削除</button>
            </div>
          </div>
        ) : null}

        <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onFile} />
        <input ref={albRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
      </div>
      {drag ? (
        <div className="ie-ghost" ref={ghostRef} style={{ width: drag.w, height: drag.h }}>
          {drag.src ? <img src={drag.src} alt="" /> : <div className="ie-img blank" />}
        </div>
      ) : null}
    </div>

      {viewRef ? (
        <div className="viewer-bg" onClick={closeView}>
          <SwipeViewer slides={viewSlides} index={viewIdx} resetKey={String(viewRef)}
            resolveSrc={(sl) => (sl.ref ? refSrc(sl.ref, kitId, images, extras) : null)}
            onIndex={(i) => { const r = viewSlides[i] && viewSlides[i].ref; if (!r) return; setViewRef(r); if (viewFrom === "sheet") setSel(r); }}
            onClose={() => { swallowNextClick(); closeView(); }} />
        </div>
      ) : null}

      {aiOpen && aiSrc ? (
        <AIRestyleModal src={aiSrc} geminiKey={ai && ai.geminiKey} openaiKey={ai && ai.openaiKey} model={(ai && ai.model) || "gemini-3-pro-image"} prompts={ai && ai.prompts} lastStyle={ai && ai.style} onModel={ai && ai.onModel} onStyle={ai && ai.onStyle}
          onAdopt={(out, meta) => { onAddImage(out, meta); setAiOpen(false); closeSheet(); }}
          onClose={() => setAiOpen(false)} />
      ) : null}
    </>
  );
}

function KitForm({ initial, currentImg, onSave, onCancel, onDelete, isCustom, seriesOptions = [], ai, recInitial = null, onSaveRec,
  album, onAddImage, onRemoveImage, onSetRole, onFrame, onEditImages, thumbRef, acqRef, maxImgs = 6 }) {
  const albumMode = typeof onAddImage === "function";
  const [f, setF] = useState({
    name: initial.name || "", code: initial.code || "", ym: initial.ym || "",
    price: initial.price || "", series: initial.series || "", note: initial.note || "", premium: !!initial.premium, grade: initial.grade || "MG",
  });
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
    } catch (err) { console.error(err); notify("画像の読み込みに失敗しました", { kind: "err" }); }
    setBusy(false);
    e.target.value = "";
  };

  return (
    <div className="form">
      {!albumMode && (
        <>
          <div className="f-sec">画像<span>IMAGES</span></div>
          <div className="form-img-row">
            <div className="form-img-box">
              {previewImg
                ? <img src={previewImg} alt="" className="kit-img big" />
                : <MechSketch seedKey={initial.id || f.name || "new"} owned built={false} size={72} />}
            </div>
            <div className="form-img-btns">
              <button className="mini-btn" onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}>
                {busy ? "読込中…" : "画像をアップロード"}
              </button>
              <div className="url-row">
                <input placeholder="または画像URLを貼り付け" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                <button className="mini-btn" onClick={() => { if (urlInput.trim()) { setImgVal(urlInput.trim()); setUrlInput(""); } }}>適用</button>
              </div>
              <button className="mini-btn ai" onClick={() => {
                if (!previewImg) { notify("先に画像を設定してください", { kind: "warn" }); return; }
                if (!aiActiveKey(ai)) { notify(aiProviderLabel(ai && ai.model) + " のAPIキーを設定タブで入力してください", { kind: "warn", dur: 3200 }); return; }
                setAiOpen(true);
              }}>✨ AIスタイル変換</button>
              {previewImg && <button className="mini-btn" onClick={() => setCropSrc(previewImg)}>✂ 切り抜き</button>}
              {previewImg && <button className="mini-btn ghost" onClick={() => setImgVal(null)}>画像を削除(スケッチに戻す)</button>}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pickFile} />
            </div>
          </div>
        </>
      )}

      <div className="f-sec">基本情報<span>BASIC</span></div>
      <div className="fld-row name-row">
        <label className="fld grow2"><span>機体名 *</span><input value={f.name} onChange={set("name")} placeholder="例: νガンダム Ver.Ka" /></label>
        <label className="fld"><span>Grade</span>
          <select value={f.grade} onChange={set("grade")}>
            <option value="MG">MG</option>
            <option value="HG">HG</option>
            <option value="RG">RG</option>
            <option value="MGSD">MGSD</option>
            <option value="EXTRA">EXTRA</option>
          </select>
        </label>
      </div>
      <label className="fld"><span>原作</span>
        <input list="series-options" value={f.series} onChange={set("series")} placeholder="入力または一覧から選択" />
        <datalist id="series-options">{seriesOptions.map((s) => <option key={s} value={s} />)}</datalist>
      </label>
      <div className="fld-row">
        <label className="fld"><span>型式番号</span><input value={f.code} onChange={set("code")} placeholder="RX-93" /></label>
        <label className="fld"><span>発売年月</span><input type="month" value={f.ym} onChange={set("ym")} /></label>
      </div>
      <div className="fld-row">
        <label className="fld"><span>定価(円・税込)</span><input type="number" value={f.price} onChange={set("price")} placeholder="7700" /></label>
        <div className="fld"><span>限定</span>
          <button type="button" className={`prem-toggle ${f.premium ? "on" : ""}`}
            onClick={() => setF((s) => ({ ...s, premium: !s.premium }))}>
            <i>{f.premium ? "✓" : ""}</i> プレバン限定
          </button>
        </div>
      </div>
      <label className="fld"><span>メモ</span><textarea rows={2} value={f.note} onChange={set("note")} placeholder="改修予定、塗装レシピ、保管場所など" /></label>

      <div className="f-sec">記録<span>RECORD</span></div>
      <div className="form-dates">
        <label className="fld"><span>購入日</span>
          <span className="date-wrap">
            <input type="date" value={dates.purchaseDate} onChange={(e) => setDates((d) => ({ ...d, purchaseDate: e.target.value }))} />
            {dates.purchaseDate && <button type="button" className="date-clear" onClick={() => setDates((d) => ({ ...d, purchaseDate: "" }))}>✕</button>}
          </span>
        </label>
        <label className="fld"><span>制作完了日</span>
          <span className="date-wrap">
            <input type="date" value={dates.buildDate} onChange={(e) => setDates((d) => ({ ...d, buildDate: e.target.value }))} />
            {dates.buildDate && <button type="button" className="date-clear" onClick={() => setDates((d) => ({ ...d, buildDate: "" }))}>✕</button>}
          </span>
        </label>
      </div>

      <div className="form-actions">
        <button className="btn primary" disabled={!f.name.trim()}
          onClick={() => { if (onSaveRec) onSaveRec(dates); onSave({ ...f, price: f.price ? Number(f.price) : "" }, imgVal, pendingMeta); }}>保存</button>
        <button className="btn" onClick={onCancel}>やめる</button>
        {isCustom && onDelete && <button className="btn danger" onClick={onDelete}>この機体を削除</button>}
      </div>
      {cropSrc && <CropModal src={cropSrc} onCancel={() => setCropSrc(null)}
        onDone={(out) => { applyNewImage(out); setCropSrc(null); }} />}
      {aiOpen && (albumMode ? aiSrc : previewImg) && (
        <AIRestyleModal src={albumMode ? aiSrc : previewImg} geminiKey={ai && ai.geminiKey} openaiKey={ai && ai.openaiKey} model={(ai && ai.model) || "gemini-3-pro-image"}
          prompts={ai && ai.prompts} lastStyle={ai && ai.style} onModel={ai && ai.onModel} onStyle={ai && ai.onStyle}
          onAdopt={(out, meta) => { applyNewImage(out, meta); setAiOpen(false); }}
          onClose={() => setAiOpen(false)} />
      )}
    </div>
  );
}

const PALETTE = ["#e8553d", "#d9b36a", "#6fd3c7", "#8fcf8a", "#b9a0e8", "#7f9bd1", "#d97fa3", "#c2b280", "#9aa0ae"];

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
function SeriesPicker({ open, value, options, onPick, onClose }) {
  const [q, setQ] = useState("");
  useEffect(() => { if (open) setQ(""); }, [open]);
  if (!open) return null;
  const ql = q.trim().toLowerCase();
  const filtered = ql ? options.filter((s) => s.toLowerCase().includes(ql)) : options;
  return (
    <div className="modal-bg sp-bg" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-head">
          <input className="sp-search" autoFocus placeholder="作品名で絞り込み" value={q}
            onChange={(e) => setQ(e.target.value)} />
          <button className="sp-close" onClick={onClose}>✕</button>
        </div>
        <div className="sp-list">
          <button className={"sp-item" + (value === "" ? " on" : "")} onClick={() => onPick("")}>すべての作品</button>
          {filtered.map((s) => (
            <button key={s} className={"sp-item" + (value === s ? " on" : "")} onClick={() => onPick(s)}>{s}</button>
          ))}
          {filtered.length === 0 && <div className="sp-empty">該当する作品がありません</div>}
        </div>
      </div>
    </div>
  );
}

/* 世界観ピッカー(作品ピッカーと同じ独立リスト式)。options は [value,label] の配列。 */
function UniPicker({ open, value, options, onPick, onClose }) {
  const [q, setQ] = useState("");
  useEffect(() => { if (open) setQ(""); }, [open]);
  if (!open) return null;
  const ql = q.trim().toLowerCase();
  const filtered = ql ? options.filter(([u, l]) => l.toLowerCase().includes(ql) || u.toLowerCase().includes(ql)) : options;
  return (
    <div className="modal-bg sp-bg" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-head">
          <input className="sp-search" autoFocus placeholder="世界観で絞り込み" value={q}
            onChange={(e) => setQ(e.target.value)} />
          <button className="sp-close" onClick={onClose}>✕</button>
        </div>
        <div className="sp-list">
          <button className={"sp-item" + (value === "" ? " on" : "")} onClick={() => onPick("")}>すべての世界観</button>
          {filtered.map(([u, l]) => (
            <button key={u} className={"sp-item" + (value === u ? " on" : "")} onClick={() => onPick(u)}>{l}</button>
          ))}
          {filtered.length === 0 && <div className="sp-empty">該当する世界観がありません</div>}
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

export default function App() {
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
  const [settings, setSettings] = useState({ view: "list", compact: false, dimUnowned: true, showCode: true, showSeries: false, showPrice: true, showNo: false, showGrade: true, showYm: true, salonCols: 2, salonFit: "cover", listGrade: true, listSeries: true, listNo: false, listCode: true, listPrice: true, listPurchase: true, listBuild: true, theme: "dark", tabPad: "min", haptic: true, crtScan: true, vfFilter: true, builderName: "", builderSince: "", supaUrl: "", supaKey: "", geminiKey: "", openaiKey: "", geminiModel: "gemini-3-pro-image", aiStyle: "ukiyoe" });
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
  const [sortKey, setSortKey] = useState("year");
  const [sortDir, setSortDir] = useState("asc");
  const [queries, setQueries] = useState({ z: "", c: "" });
  const query = tab === "collection" ? queries.c : queries.z;
  const gf = ((tab === "collection" ? settings.gfShuzo : settings.gfZukan) || "").toUpperCase();
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [collMode, setCollMode] = useState("owned"); // owned=収蔵 / plan=予定
  const [anaMode, setAnaMode] = useState("record");  // record=記録(記錄) / analysis=分析
  const [zukanMode, setZukanMode] = useState("all");  // all=図鑑 / salon=沙龍(画像ありのみ)
  const [advOpen, setAdvOpen] = useState(false);
  const [seriesPickerOpen, setSeriesPickerOpen] = useState(false);
  const [adv, setAdv] = useState({ series: "", uni: "", prem: "", stat: "", yFrom: "", yTo: "" }); // 進階篩選
  const [viewer, setViewer] = useState(null); // 画像鑑賞: {kitId, idx} | null
  const [viewerDel, setViewerDel] = useState(false); // 鑑賞内の削除確認
  const [frameEdit, setFrameEdit] = useState(null); // 構図調整: {kitId, ref} | null
  const [imgEdit, setImgEdit] = useState(null); // 画像編集ウィンドウ対象 kitId | null
  const [quickKit, setQuickKit] = useState(null); // リスト文字長押しの予定/入手クイックメニュー対象
  const [ownConfirm, setOwnConfirm] = useState(null); // 入手取消確認 kit
  const [loaded, setLoaded] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [dispTarget, setDispTarget] = useState("list");
  const [promptEdit, setPromptEdit] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(""); // 検索の下書き(候補表示用)。確定で query(リスト反映)へ。
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
  const [syncMsg, setSyncMsg] = useState("");
  const [storageErr, setStorageErr] = useState(""); // 端末保存失敗(容量不足等)の可視化
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [setupMsg, setSetupMsg] = useState("");
  const bodyRef = useRef(null);
  const pullStartRef = useRef({ y: 0, armed: false });
  const syncTsRef = useRef({});
  const pushTimers = useRef({});
  const supaRef = useRef({ url: "", key: "" });
  const dirtyRef = useRef(new Set()); // 雲端へ未確定の変更キー(オフライン再送用)
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
  const scrollPosRef = useRef({});
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
  };
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
  /* 画像領域の長押し=工房(編集室)へ直行。stopPropagation でカード本体の長押し(予定切替)を抑止。
     短タップは伝播させてカードの onClick(詳細表示)に委ねる。 */
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
          if (d.sortKey) setSortKey(d.sortKey);
          if (d.sortDir) setSortDir(d.sortDir);
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
      try {
        const tsr = await window.storage.get("mg_sync_ts");
        syncTsRef.current = JSON.parse(tsr.value) || {};
      } catch (e) { syncTsRef.current = {}; }
      try {
        const dr = await window.storage.get("mg_dirty");
        const arr = JSON.parse(dr.value);
        if (Array.isArray(arr)) dirtyRef.current = new Set(arr);
      } catch (e) { /* 未送信なし */ }
      setLoaded(true); // UI 立即顯示,圖像分片於背景逐片載入
      for (let i = 0; i < IMG_SHARDS; i++) {
        window.storage.get("mg_imgs_" + i)
          .then((r) => {
            if (r && r.value) {
              const m = JSON.parse(r.value);
              setImages((prev) => ({ ...m, ...prev }));
            }
          })
          .catch(() => {});
      }
      for (let i = 0; i < XTRA_SHARDS; i++) {
        window.storage.get("mg_xtra_" + i)
          .then((r) => {
            if (r && r.value) {
              const m = JSON.parse(r.value);
              setExtras((prev) => ({ ...m, ...prev }));
            }
          })
          .catch(() => {});
      }
      const su = ((metaSettings && metaSettings.supaUrl) || "").trim().replace(/\/+$/, "");
      const sk = ((metaSettings && metaSettings.supaKey) || "").trim();
      if (su && sk) {
        pullCloud({ url: su, key: sk })
          .then((nn) => {
            if (nn) setSyncMsg("起動時同期:受信 " + nn + " 件 " + new Date().toLocaleTimeString());
            else if (metaEmpty) setSetupOpen(true);
          })
          .catch(() => { if (metaEmpty) setSetupOpen(true); });
      } else if (metaEmpty) {
        setSetupOpen(true);
      }
    })();
  }, []);

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
      setStorageErr("⚠ 端末への保存に失敗しました(空き容量不足の可能性)。クラウド同期またはバックアップ書き出しで保全してください。");
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
        setSyncMsg("画像が大きすぎてクラウド同期できません(" + Math.round(bytes / 1048576) +
          "MB)。設定→「画像を最適化(容量削減)」で圧縮してください(本地には保存済み)。");
        return true; // 取りこぼし扱いで queue を進める
      }
    }
    const updated_at = syncTsRef.current[k] || new Date().toISOString();
    try {
      const res = await fetch(`${url}/rest/v1/kv?on_conflict=key`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify([{ key: k, value: pushVal, updated_at }]),
      });
      if (res.ok) { unmarkDirty(k); setSyncMsg("クラウド同期済み " + new Date().toLocaleTimeString()); return true; }
      let detail = "";
      try { const j = await res.json(); detail = j.message || ""; } catch (e2) {}
      setSyncMsg("同期エラー HTTP " + res.status + (detail ? " — " + detail : "") + "(後で再送します)");
      return false;
    } catch (e) {
      setSyncMsg("オフライン — 接続回復後に再送します");
      return false;
    }
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
            setStorageErr("⚠ 端末の保存容量が残りわずかです(使用 " + Math.round(usage / 1048576) +
              "MB / " + Math.round(quota / 1048576) + "MB)。設定→画像を最適化、またはバックアップ書き出しをおすすめします。");
          }
        }
      } catch (e) { /* 非対応環境は黙ってスキップ */ }
    })();
  }, [loaded]);

  /* ── 保存中繼資料 ── */
  const latestMetaRef = useRef("");
  const latestSettingsRef = useRef("");
  const latestAlbumRef = useRef("");
  const latestSerifsRef = useRef("");
  // META 本体(settings / albumMeta / serifs は独立鍵へ分離したので含めない)
  useEffect(() => {
    if (!loaded) return;
    const payload = JSON.stringify({ schemaVersion: SCHEMA_VERSION, records, overrides, customKits, sortKey, sortDir, achvSeen, kitTags });
    latestMetaRef.current = payload; // 背景化/終了時に debounce を待たず即落とすための最新版
    const t = setTimeout(() => { saveKey(META_KEY, payload); }, 350);
    return () => clearTimeout(t);
  }, [records, overrides, customKits, sortKey, sortDir, achvSeen, kitTags, loaded, saveKey]);
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

  useEffect(() => { setLimit(60); }, [gf, sortKey, sortDir, settings.view]);
  // 切替直後は gridReady=false(少数描画)。2フレーム後に満載へ。クリーンアップで取り消し。
  useEffect(() => {
    setGridReady(false);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setGridReady(true)); });
    return () => { cancelAnimationFrame(r1); if (r2) cancelAnimationFrame(r2); };
  }, [tab]);
  const paintLimit = gridReady ? limit : Math.min(limit, FIRST_BATCH);

  useEffect(() => {
    supaRef.current = { url: (settings.supaUrl || "").trim().replace(/\/+$/, ""), key: (settings.supaKey || "").trim() };
  }, [settings.supaUrl, settings.supaKey]);

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
  const persistShard = useCallback(async (allImages, id) => {
    const key = shardKey(id);
    const map = {};
    for (const [k, v] of Object.entries(allImages)) if (shardKey(k) === key) map[k] = v;
    await saveKey(key, JSON.stringify(map));
  }, [saveKey]);

  /* 追加画像(extras)の保存。変更のあった xid が属するシャードのみ書き戻す。 */
  const persistXtraShard = useCallback(async (allExtras, xid) => {
    const key = xtraKey(xid);
    const map = {};
    for (const [k, v] of Object.entries(allExtras)) if (xtraKey(k) === key) map[k] = v;
    await saveKey(key, JSON.stringify(map));
  }, [saveKey]);

  const applyMeta = useCallback((raw) => {
    const d = migrateMeta(raw);
    if (!d || typeof d !== "object") return;
    if (d.records) setRecords((prev) => mergeRecMap(prev, d.records));
    if (d.overrides) setOverrides((prev) => mergeRecMap(prev, d.overrides));
    if (d.customKits) setCustomKits((prev) => mergeArrStamped(prev, d.customKits));
    if (d.kitTags) setKitTags((prev) => mergeRecMap(prev, d.kitTags));
    if (d.settings) setSettings((s) => mergeSettings(s, d.settings));
    if (d.sortKey) setSortKey(d.sortKey);
    if (d.sortDir) setSortDir(d.sortDir);
    if (d.achvSeen) setAchvSeen(d.achvSeen);
    // albumMeta は {kitId: record} 構造 → kit ごとにフィールド級 LWW(構図/縮圖/順序/imeta を各々時戳比較)。
    // 以前の {...prev,...incoming} は kit 単位の丸ごと上書きで、別端末の新しい編集を消し、削除済みの画像を復活させていた。
    if (d.albumMeta) setAlbumMeta((prev) => mergeRecMap(prev, d.albumMeta));
    // serifs は {ref: 台詞} のフラット map → 全体を1つの record とみなし、台詞ごとに時戳比較。
    if (d.serifs) setSerifs((prev) => mergeRec(prev, d.serifs));
  }, []);

  const pullCloud = useCallback(async (cfg, force) => {
    const url = cfg.url, key = cfg.key;
    if (!url || !key) return 0;
    const res = await fetch(`${url}/rest/v1/kv?select=key,value,updated_at`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      let detail = "";
      try { const j = await res.json(); detail = j.message || j.hint || ""; } catch (e) {}
      throw new Error("HTTP " + res.status + (detail ? " — " + detail : "") +
        (res.status === 404 ? "(kvテーブル未作成、またはURLがプロジェクトAPI URLでない可能性)" : ""));
    }
    const rows = await res.json();
    let applied = 0;
    for (const row of rows) {
      const lts = syncTsRef.current[row.key];
      if (!force && lts && lts >= row.updated_at) continue;
      if (row.key === META_KEY) {
        try { applyMeta(JSON.parse(row.value)); } catch (e) { continue; }
      } else if (row.key.indexOf("mg_imgs_") === 0) {
        try {
          const m = JSON.parse(row.value);
          setImages((prev) => {
            const next = {};
            for (const [ik, iv] of Object.entries(prev)) if (shardKey(ik) !== row.key) next[ik] = iv;
            return { ...next, ...m };
          });
        } catch (e) { continue; }
      } else if (row.key.indexOf("mg_xtra_") === 0) {
        try {
          const m = JSON.parse(row.value);
          setExtras((prev) => {
            const next = {};
            for (const [ik, iv] of Object.entries(prev)) if (xtraKey(ik) !== row.key) next[ik] = iv;
            return { ...next, ...m };
          });
        } catch (e) { continue; }
      } else if (row.key === SETTINGS_KEY) {
        try { setSettings((s) => mergeSettings(s, JSON.parse(row.value))); } catch (e) { continue; }
      } else if (row.key === ALBUM_KEY) {
        try { setAlbumMeta((prev) => mergeRecMap(prev, JSON.parse(row.value))); } catch (e) { continue; }
      } else if (row.key === SERIFS_KEY) {
        try { setSerifs((prev) => mergeRec(prev, JSON.parse(row.value))); } catch (e) { continue; }
      } else continue;
      // 次回 pull で再適用させる(古い本地値に新時戳が付くのを防ぐ)。
      const okSet = await persist(row.key, row.value);
      if (!okSet) continue;
      syncTsRef.current[row.key] = row.updated_at;
      applied++;
    }
    await persist("mg_sync_ts", JSON.stringify(syncTsRef.current));
    return applied;
  }, [applyMeta, persist, mergeSettings]);

  const syncNow = async () => {
    const cfg = supaRef.current;
    if (!cfg.url || !cfg.key) { notify("Supabase URL と anon キーを入力してください", { kind: "warn" }); return; }
    setSyncMsg("同期中…");
    try {
      // 1) 雲端を取り込む(LWW で state へマージ)
      const nn = await pullCloud(cfg);
      // 2) 未送信のローカル変更だけを、変更時の時戳付きで再送する。
      //    以前はここで pull 直後の「古い閉包の state」を新しい時戳で全件 push しており、
      //    取り込んだばかりの雲端データ(特に時戳保護の無い settings/albumMeta/serifs)を
      //    上書きして消す競合があった。dirty キューは正しい時戳を保持するため安全。
      await flushDirty();
      setSyncMsg(`同期完了(受信 ${nn} 件)` + new Date().toLocaleTimeString());
    } catch (e) { setSyncMsg("同期エラー:" + ((e && e.message) || e)); }
  };

  /* ── 初期復元:憑證輸入後僅拉取(不推送) ── */
  const setupSync = async () => {
    const url = (settings.supaUrl || "").trim().replace(/\/+$/, "");
    const key = (settings.supaKey || "").trim();
    if (!url || !key) { setSetupMsg("URL と anon キーを入力してください"); return; }
    setSetupBusy(true);
    setSetupMsg("同期中…");
    try {
      const nn = await pullCloud({ url, key }, true);
      if (nn) {
        setSetupMsg(`受信 ${nn} 件 — 復元完了`);
        setTimeout(() => setSetupOpen(false), 900);
      } else {
        setSetupMsg("クラウドにデータが見つかりませんでした(新規の場合はこのまま閉じてOK)");
      }
    } catch (e) { setSetupMsg("エラー:" + ((e && e.message) || e)); }
    setSetupBusy(false);
  };

  /* ── 下拉顯示搜尋列 ── */
  const onBodyTouchStart = (e) => {
    const el = bodyRef.current;
    pullStartRef.current = {
      y: e.touches[0].clientY,
      armed: !!el && el.scrollTop <= 0 && (tab === "zukan" || tab === "collection") && !searchOpen && !filterOpen,
    };
  };
  const onBodyTouchMove = (e) => {
    if (!pullStartRef.current.armed) return;
    if (e.touches[0].clientY - pullStartRef.current.y > 55) {
      haptic();
      setFilterOpen(true);
      pullStartRef.current.armed = false;
    }
  };

  /* ── 下滾自動收回搜尋列:完全滑過後才瞬間收合 + 補償捲動位置,內容零跳動 ── */
  const drawerClosingRef = useRef(false);
  const onBodyScroll = (e) => {
    const el = e.currentTarget;
    if (!searchOpen || drawerClosingRef.current) return;
    const drawer = el.querySelector(".search-drawer.open");
    const h = drawer ? drawer.offsetHeight : 0;
    if (h === 0 || el.scrollTop <= h - 4) return; // 尚未完全滑過搜尋列就保留
    drawerClosingRef.current = true;
    drawer.style.transition = "none"; // 本次收合不走動畫
    setSearchOpen(false);
    setAdvOpen(false);
    requestAnimationFrame(() => {
      el.scrollTop = Math.max(0, el.scrollTop - h); // 扣掉收合高度,畫面內容不動
      requestAnimationFrame(() => {
        if (drawer) drawer.style.transition = ""; // 還原動畫供下次下拉開啟
        drawerClosingRef.current = false;
      });
    });
  };

  const setImage = (id, val) => {
    setImages((prev) => {
      const next = { ...prev };
      if (val == null) delete next[id]; else next[id] = val;
      persistShard(next, id);
      return next;
    });
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
    setExtras((prev) => { const next = { ...prev, [xid]: src }; persistXtraShard(next, xid); return next; });
    setAlbumMeta((prev) => {
      const m = prev[kitId] || {};
      const base = (m.order && m.order.length) ? m.order.slice() : albumRefs(kitId, images, extras, prev);
      return stampAlbum(prev, kitId, { order: base.filter((r) => r !== xid).concat([xid]) });
    });
    recordImgMeta(kitId, xid, meta || { src: "photo" });
    return true;
  }, [images, extras, albumMeta, persistXtraShard, recordImgMeta]);

  // アルバムから1枚削除(primary か extra)。役割/順序/構図も掃除。
  const removeAlbumImage = useCallback((kitId, ref) => {
    if (ref === "primary") {
      setImages((prev) => { const next = { ...prev }; delete next[kitId]; persistShard(next, kitId); return next; });
    } else {
      setExtras((prev) => { const next = { ...prev }; delete next[ref]; persistXtraShard(next, ref); return next; });
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
  }, [persistShard, persistXtraShard]);

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

  /* ── 画像最適化:既存の大きな画像を480pxへ再圧縮 ── */
  const optimizeImages = async () => {
    if (optimizing) return;
    setOptimizing(true);
    try {
      const next = { ...images };
      let changed = 0;
      for (const [id, url] of Object.entries(images)) {
        if (typeof url !== "string" || !url.startsWith("data:")) continue;
        const out = await new Promise((res) => {
          const im = new Image();
          im.onload = () => {
            if (im.width <= 480) return res(null);
            const c = document.createElement("canvas");
            c.width = 480;
            c.height = Math.round(im.height * (480 / im.width));
            c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
            res(c.toDataURL("image/jpeg", 0.74));
          };
          im.onerror = () => res(null);
          im.src = url;
        });
        if (out && out.length < url.length) { next[id] = out; changed++; }
      }
      if (changed) {
        setImages(next);
        for (let i = 0; i < IMG_SHARDS; i++) {
          const map = {};
          for (const [k, v] of Object.entries(next)) if (hashId(k) % IMG_SHARDS === i) map[k] = v;
          await saveKey("mg_imgs_" + i, JSON.stringify(map));
        }
      }
      // 追加画像(extras)も同様に再圧縮
      const nextX = { ...extras };
      let changedX = 0;
      for (const [id, url] of Object.entries(extras)) {
        if (typeof url !== "string" || !url.startsWith("data:")) continue;
        const out = await new Promise((res) => {
          const im = new Image();
          im.onload = () => {
            if (im.width <= 480) return res(null);
            const c = document.createElement("canvas");
            c.width = 480; c.height = Math.round(im.height * (480 / im.width));
            c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
            res(c.toDataURL("image/jpeg", 0.74));
          };
          im.onerror = () => res(null);
          im.src = url;
        });
        if (out && out.length < url.length) { nextX[id] = out; changedX++; }
      }
      if (changedX) {
        setExtras(nextX);
        for (let i = 0; i < XTRA_SHARDS; i++) {
          const map = {};
          for (const [k, v] of Object.entries(nextX)) if (hashId(k) % XTRA_SHARDS === i) map[k] = v;
          await saveKey("mg_xtra_" + i, JSON.stringify(map));
        }
      }
      const total = changed + changedX;
      notify(total ? `${total} 枚の画像を再圧縮しました` : "再圧縮が必要な画像はありませんでした", { kind: total ? "ok" : "info" });
    } finally { setOptimizing(false); }
  };

  /* ── 箱絵 manifest の一括インポート(路徑B: URL 参照) ──
     manifest = { kit_id: 公開URL }。既存機体に該当する URL だけを取り込み、
     8 シャードを各1回だけ保存+推送(値は短いURLなので同期は軽量)。 */
  const importManifest = async () => {
    const u = (manifestUrl || "").trim();
    if (!u) { setImgMsg("manifest の URL を入力してください"); return; }
    setImgBusy(true); setImgMsg("取得中…");
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
      if (!n) { setImgMsg(`差分なし(取り込み 0 / 対象外 ${skip})`); setImgBusy(false); return; }
      setImages(next);
      for (let i = 0; i < IMG_SHARDS; i++) {
        const m = {};
        for (const [k, v] of Object.entries(next)) if (hashId(k) % IMG_SHARDS === i) m[k] = v;
        await saveKey("mg_imgs_" + i, JSON.stringify(m));
      }
      setImgMsg(`取り込み完了: ${n} 件更新` + (skip ? ` / 対象外 ${skip}` : ""));
    } catch (e) {
      setImgMsg("失敗: " + ((e && e.message) || e));
    }
    setImgBusy(false);
  };

  /* ── URL 画像をオフライン用にプリキャッシュ ──
     SW が制御中なら postMessage で一括(並列制御つき)。未制御なら Cache API へ直接(分割実行)。 */
  const precacheImages = async () => {
    const urls = Object.values(images).filter((v) => typeof v === "string" && /^https?:\/\//.test(v));
    if (!urls.length) { setImgMsg("オフライン保存できる URL 画像がありません"); return; }
    const ctrl = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (ctrl) {
      setImgMsg(`オフライン保存中… (${urls.length} 件)`);
      ctrl.postMessage({ type: "precache-images", urls });
      return; // 完了は message リスナーで受信
    }
    if (!("caches" in window)) { setImgMsg("この端末は Cache API 非対応です"); return; }
    setImgBusy(true); setImgMsg(`オフライン保存中… (${urls.length} 件)`);
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
      setImgMsg(`オフライン保存完了: ${done} 件` + (fail ? ` / 失敗 ${fail}` : ""));
    } catch (e) { setImgMsg("失敗: " + ((e && e.message) || e)); }
    setImgBusy(false);
  };

  /* AI判別 等から画像を1台に追加(主画像が空なら主に、あれば追加画像に)。既存の分片保存を再利用。 */
  const attachPhoto = useCallback(async (kitId, dataURL) => {
    if (!dataURL) return;
    if (!images[kitId]) {
      const next = { ...images, [kitId]: dataURL };
      setImages(next);
      const idx = hashId(kitId) % IMG_SHARDS;
      const m = {};
      for (const [k, v] of Object.entries(next)) if (hashId(k) % IMG_SHARDS === idx) m[k] = v;
      await saveKey("mg_imgs_" + idx, JSON.stringify(m));
      recordImgMeta(kitId, "primary", { src: "photo" });
    } else {
      const xid = newXid(kitId);
      const nextX = { ...extras, [xid]: dataURL };
      setExtras(nextX);
      const idx = hashId(xid) % XTRA_SHARDS;
      const m = {};
      for (const [k, v] of Object.entries(nextX)) if (hashId(k) % XTRA_SHARDS === idx) m[k] = v;
      await saveKey("mg_xtra_" + idx, JSON.stringify(m));
      recordImgMeta(kitId, xid, { src: "photo" });
    }
  }, [images, extras, saveKey, recordImgMeta]);

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
      for (let i = 0; i < IMG_SHARDS; i++) {
        const m = {};
        for (const [k, v] of Object.entries(next)) if (hashId(k) % IMG_SHARDS === i) m[k] = v;
        await saveKey("mg_imgs_" + i, JSON.stringify(m));
      }
    }
    setImgBusy(false);
    setImgMsg(`取り込み完了: ${ok} 件` +
      (bad.length ? ` / 未対応 ${bad.length}件: ${bad.slice(0, 3).join(", ")}${bad.length > 3 ? " …" : ""}` : ""));
  };

  /* Service Worker 登録(オフライン画像キャッシュ用)。/sw.js を配信ルートに置くこと。 */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onMsg = (e) => {
      const d = (e && e.data) || {};
      if (d.type === "precache-done") {
        setImgBusy(false);
        setImgMsg(`オフライン保存完了: ${d.done} 件` + (d.fail ? ` / 失敗 ${d.fail}` : ""));
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  /* ── 備份匯出 / 匯入 ── */
  const importRef = useRef(null);
  const exportData = async () => {
    // バックアップにも機密キーは含めない(端末ローカルにのみ残す)
    const data = { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), records, overrides, customKits, settings: stripSecrets(settings), sortKey, sortDir, images, extras, albumMeta, kitTags, serifs };
    const json = JSON.stringify(data);
    const name = `mg_zukan_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], name, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "MG図鑑バックアップ" }); return; }
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
      if (verr) { notify("読み込みに失敗しました:" + verr, { kind: "err", dur: 3200 }); e.target.value = ""; return; }
      const d = migrateMeta(raw);
      const now = new Date().toISOString();
      // 復元は全フィールドを now で時戳付けして確実に勝たせる(フィールド級マージ)
      const stampMap = (m) => { const o = {}; for (const k of Object.keys(m || {})) o[k] = stampRecAll(m[k], now); return o; };
      if (d.records) setRecords((prev) => mergeRecMap(prev, stampMap(d.records)));
      if (d.overrides) setOverrides((prev) => mergeRecMap(prev, stampMap(d.overrides)));
      if (d.customKits) setCustomKits((prev) => mergeArrStamped(prev, d.customKits.map((c) => ({ ...c, t: now }))));
      if (d.kitTags) setKitTags((prev) => mergeRecMap(prev, stampMap(d.kitTags)));
      if (d.settings) setSettings((s) => mergeRec(s, stampRecAll(d.settings, now)));
      if (d.sortKey && SORT_KEYS.includes(d.sortKey)) setSortKey(d.sortKey);
      if (d.sortDir === "asc" || d.sortDir === "desc") setSortDir(d.sortDir);
      if (d.images) {
        setImages(d.images);
        for (let i = 0; i < IMG_SHARDS; i++) {
          const map = {};
          for (const [k, v] of Object.entries(d.images)) if (hashId(k) % IMG_SHARDS === i) map[k] = v;
          await saveKey("mg_imgs_" + i, JSON.stringify(map));
        }
      }
      if (d.extras && isPlainObj(d.extras)) {
        setExtras(d.extras);
        for (let i = 0; i < XTRA_SHARDS; i++) {
          const map = {};
          for (const [k, v] of Object.entries(d.extras)) if (hashId(k) % XTRA_SHARDS === i) map[k] = v;
          await saveKey("mg_xtra_" + i, JSON.stringify(map));
        }
      }
      if (d.albumMeta && isPlainObj(d.albumMeta)) setAlbumMeta(d.albumMeta);
      if (d.serifs && isPlainObj(d.serifs)) setSerifs(d.serifs);
      notify("バックアップの読み込みが完了しました", { kind: "ok" });
    } catch (err) { console.error(err); notify("読み込みに失敗しました(ファイル形式を確認してください)", { kind: "err", dur: 3200 }); }
    e.target.value = "";
  };

  /* ── 合成機體清單(基礎 + 覆寫 + 自訂) ── */
  const allKits = useMemo(() => {
    const merged = ALL_BASE.map((k) => (overrides[k.id] ? { ...k, ...overrides[k.id] } : k));
    return merged.concat(customKits.filter((c) => !c.deleted).map((c) => ({ line: "CUSTOM", no: "—", code: "", series: "", note: "", ...c })));
  }, [overrides, customKits]);

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
    if (gf) pool = pool.filter((k) => {
      const kg = (k.grade || "MG").toUpperCase();
      return gf === "MG" ? (kg === "MG" || kg === "MGSD") : kg === gf;
    });
    if (adv.series) pool = pool.filter((k) => (k.series || "") === adv.series);
    if (adv.uni) pool = pool.filter((k) => universeOfKit(k) === adv.uni);
    // 確定済み検索語をリストへ反映(✓/Enter で commit された query)。候補ジャンプ時は query 未確定なので不動。
    const term = (query || "").trim();
    if (term) {
      const q = normJa(term); const rq = toRomaji(q);
      pool = pool.filter((k) => { const idx = searchIndex[k.id] || ""; return idx.includes(q) || (rq && rq !== q && idx.includes(rq)); });
    }
    if (tab === "zukan" && zukanMode === "salon") pool = pool.filter((k) => !!thumbSrc(k.id));
    if (adv.prem === "pb") pool = pool.filter((k) => !!k.premium);
    else if (adv.prem === "base") pool = pool.filter((k) => !!k.base);
    else if (adv.prem === "normal") pool = pool.filter((k) => !k.premium && !k.base);
    if (adv.stat) pool = pool.filter((k) => {
      const r = getRec(k.id);
      return adv.stat === "owned" ? r.owned : adv.stat === "plan" ? r.plan : adv.stat === "none" ? (!r.owned && !r.plan) : true;
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
  }, [allKits, gf, searchIndex, adv, getRec, tab, zukanMode, thumbSrc, query]);

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
    if (!(tab === "zukan" && zukanMode === "salon")) return [];
    const list = [];
    for (const k of sorted) for (const ref of albumRefs(k.id, images, extras, albumMeta)) {
      if (refSrc(ref, k.id, images, extras)) list.push({ kitId: k.id, ref, name: k.name, code: k.code, no: k.no, series: k.series });
    }
    return list;
  }, [tab, zukanMode, sorted, images, extras, albumMeta]);
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
  const moreVisible = (tab === "zukan" ? sorted.length
    : tab === "collection" ? (collMode === "plan" ? planKits.length : ownedKits.length)
    : 0) > limit;
  useEffect(() => {
    const el = moreRef.current;
    if (!el || !moreVisible || typeof IntersectionObserver === "undefined") return;
    const ob = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setLimit((n) => n + 80); }),
      { rootMargin: "200px" }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [moreVisible, tab, collMode, limit]);

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

  const sortLabel = { year: "発売年月", name: "名称(五十音)", purchase: "購入日", build: "制作完了日", price: "定価" };

  const GF_OPTS = [["", "全部"], ["MG", "MG"], ["HG", "HG"], ["RG", "RG"], ["PG", "PG"], ["HIRM", "HIRM"], ["RE", "RE"], ["FM", "FM"], ["EXTRA", "EXTRA"]];
  const GfRow = ({ skey }) => (
    <div className="gf-row">
      {GF_OPTS.map(([v, l]) => (
        <button key={v || "all"} className={"gf-btn" + (gf === v ? " on" : "")}
          onClick={() => patchSettings({ [skey]: v })}>{l}</button>
      ))}
    </div>
  );

  const SortBar = () => (
    <div className="sort-bar">
      <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
        {Object.entries(sortLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <button onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>{sortDir === "asc" ? "↑" : "↓"}</button>
    </div>
  );

  const ViewToggle = () => (
    <div className="view-toggle">
      <button className={settings.view === "grid" ? "on" : ""} onClick={() => patchSettings({ view: "grid" })}>▦ カード</button>
      <button className={settings.view === "list" ? "on" : ""} onClick={() => patchSettings({ view: "list" })}>☰ リスト</button>
    </div>
  );

  const SalonControls = () => (
    <div className="salon-ctrl">
      <div className="view-toggle salon-seg">
        <button className={(settings.salonCols || 2) === 2 ? "on" : ""} onClick={() => { haptic(); patchSettings({ salonCols: 2 }); }}>２列</button>
        <button className={(settings.salonCols || 2) === 3 ? "on" : ""} onClick={() => { haptic(); patchSettings({ salonCols: 3 }); }}>３列</button>
      </div>
      <div className="view-toggle salon-seg">
        <button className={(settings.salonFit || "cover") === "cover" ? "on" : ""} onClick={() => { haptic(); patchSettings({ salonFit: "cover" }); }}>切抜</button>
        <button className={(settings.salonFit || "cover") === "contain" ? "on" : ""} onClick={() => { haptic(); patchSettings({ salonFit: "contain" }); }}>全体</button>
      </div>
    </div>
  );

  const advActive = adv.series || adv.uni || adv.prem || adv.stat || adv.yFrom || adv.yTo;
  const openSearch = useCallback(() => { haptic(); setSearchDraft(tab === "collection" ? queries.c : queries.z); setSearchOpen(true); }, [tab, queries]);
  const closeSearch = useCallback(() => { setSearchOpen(false); }, []);
  // 確定(✓ボタン / Enter):下書きを query へ反映 → リストが絞り込まれる。
  const commitSearch = useCallback(() => {
    setQueries((s) => ({ ...s, [tab === "collection" ? "c" : "z"]: searchDraft.trim() }));
    setSearchOpen(false);
  }, [tab, searchDraft]);
  const openFilter = useCallback(() => { haptic(); setFilterOpen(true); }, []);
  const closeFilter = useCallback(() => { setFilterOpen(false); }, []);
  /* タップ=onTap / 長押し=onLong。既存の makeLongPress/consumeLP を再利用 */
  const longPress = (onTap, onLong) => ({
    ...makeLongPress(() => { hapticStrong(); onLong && onLong(); }),
    onClick: (e) => { if (e) e.stopPropagation(); if (consumeLP()) return; onTap && onTap(); },
  });
  /* 全条件クリア:絞り込み(adv)+検索語+グレード を一括解除 */
  const clearAllConds = useCallback(() => {
    haptic();
    setAdv({ series: "", uni: "", prem: "", stat: "", yFrom: "", yTo: "" });
    setQueries({ z: "", c: "" });
    patchSettings({ gfZukan: "", gfShuzo: "" });
  }, []);
  /* 検索ヒット(下書きに対する即時候補。タップ=該当機体へジャンプ、リストは不動) */
  const searchHits = useMemo(() => {
    const term = searchDraft.trim();
    if (!term) return [];
    const base = tab === "collection"
      ? allKits.filter((k) => (collMode === "plan" ? getRec(k.id).plan : getRec(k.id).owned))
      : allKits;
    const q = normJa(term); const rq = toRomaji(q);
    return base.filter((k) => { const idx = searchIndex[k.id] || ""; return idx.includes(q) || (rq && rq !== q && idx.includes(rq)); }).slice(0, 14);
  }, [tab, collMode, searchDraft, allKits, getRec, searchIndex]);
  const renderSearchModal = ({ placeholder, title }) => (
    <div className="modal-bg search-modal-bg" onClick={closeSearch}>
      <div className="modal search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sm-head">
          <span className="sm-title">{title} <span className="sm-eyebrow">SEARCH</span></span>
          <button className="modal-x static" onClick={closeSearch}>✕</button>
        </div>
        <div className="toolbar">
          <input className="search" placeholder={placeholder} value={searchDraft} autoFocus
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); commitSearch(); } }} />
          <button className="search-go" aria-label="確認" onClick={commitSearch}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4 4L19 6.5" /></svg>
          </button>
        </div>
        {searchDraft.trim() ? (
          <div className="sm-hits">
            {searchHits.length ? searchHits.map((k) => (
              <button key={k.id} className="sm-hit" onClick={() => { closeSearch(); setDetail(k.id); }}>
                <span className="sm-hit-name"><KitName name={k.name} /></span>
                <span className="sm-hit-sub">{[k.code, k.grade, k.series].filter(Boolean).join(" · ")}</span>
              </button>
            )) : <div className="sm-empty">該当する機体がありません</div>}
          </div>
        ) : null}
      </div>
    </div>
  );
  /* ── 簿冊表頭(博物誌/繪測巻/蔵品帳/発注簿):仿叙勲録の表頭。タップで検索窓 ── */
  /* LedgerTitle は module scope へ移動済み(remount による表頭アニメ再生を防ぐため)。 */

  const LedgerHead = ({ eyebrow, title, alt, countNode, active, variant, onSwitch, scheme = "slide", akey, dir = 1, searchActive, onClearSearch }) => (
    <div key={variant} className={"sb-band sb-v-" + variant}>
      <div className={"sb-head" + (active ? " on" : "")}>
        <button type="button" className="sb-switch" onClick={() => { hapticStrong(); onSwitch && onSwitch(); }}
          aria-label={alt ? "「" + alt + "」へ切り替え" : "切り替え"}>
          <span className="sb-eyebrow">{eyebrow}</span>
          <span className="sb-titlewrap">
            <LedgerTitle scheme={scheme} title={title} alt={alt} akey={akey} dir={dir} />
          </span>
        </button>
        <span className="sb-head-r">
          <span className="sb-count">{countNode}</span>
          <button type="button" className={"sb-icon" + (advActive ? " on" : "")} aria-label="絞り込み(長押しで解除)"
            {...longPress(openFilter, () => { setAdv({ series: "", uni: "", prem: "", stat: "", yFrom: "", yTo: "" }); notify("絞り込みを解除しました", { kind: "ok" }); })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5h18M6 12h12M10 19h4" />
            </svg>
          </button>
          <button type="button" className={"sb-icon sb-find" + (searchActive ? " on" : "")} aria-label="検索(長押しで解除)"
            {...longPress(openSearch, () => { onClearSearch && onClearSearch(); notify("検索を解除しました", { kind: "ok" }); })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" /><line x1="15.4" y1="15.4" x2="21" y2="21" />
            </svg>
          </button>
        </span>
      </div>
      <div className="sb-rule" />
    </div>
  );

  const AdvPanel = () => (
    <div className="adv-panel">
      <div className="adv-row">
        <span className="adv-lbl">作品</span>
        <button className="adv-sel adv-series-btn" onClick={() => setSeriesPickerOpen(true)}>
          <span className={adv.series ? "" : "ph"}>{adv.series || "すべての作品"}</span>
          <span className="adv-series-caret">▾</span>
        </button>
      </div>
      <div className="adv-row">
        <span className="adv-lbl">世界</span>
        <button className="adv-sel adv-series-btn" onClick={() => setUniPickerOpen(true)}>
          <span className={adv.uni ? "" : "ph"}>{adv.uni ? ((UNI_PICK.find(([u]) => u === adv.uni) || [null, "すべての世界観"])[1]) : "すべての世界観"}</span>
          <span className="adv-series-caret">▾</span>
        </button>
      </div>
      <div className="adv-row">
        <span className="adv-lbl">区分</span>
        <div className="adv-seg">
          {[["", "全"], ["pb", "プレバン"], ["base", "ベース"], ["normal", "一般"]].map(([v, l]) => (
            <button key={v || "all"} className={"adv-seg-btn" + (adv.prem === v ? " on" : "")}
              onClick={() => setAdv((a) => ({ ...a, prem: v }))}>{l}</button>
          ))}
        </div>
      </div>
      <div className="adv-row">
        <span className="adv-lbl">状態</span>
        <div className="adv-seg">
          {[["", "全"], ["owned", "入手"], ["plan", "予定"], ["none", "未"]].map(([v, l]) => (
            <button key={v || "all"} className={"adv-seg-btn" + (adv.stat === v ? " on" : "")}
              onClick={() => setAdv((a) => ({ ...a, stat: v }))}>{l}</button>
          ))}
        </div>
      </div>
      <div className="adv-row">
        <span className="adv-lbl">年代</span>
        <div className="adv-years">
          <select className="adv-sel adv-year-sel" value={adv.yFrom} onChange={(e) => setAdv((a) => ({ ...a, yFrom: e.target.value }))}>
            <option value="">最古</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="adv-tilde">〜</span>
          <select className="adv-sel adv-year-sel" value={adv.yTo} onChange={(e) => setAdv((a) => ({ ...a, yTo: e.target.value }))}>
            <option value="">最新</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="adv-foot">
        {(advActive || query || gf) ? <button className="adv-clear" onClick={clearAllConds}>全条件をクリア</button> : <span className="adv-hint">作品・区分・状態・年代で絞り込み</span>}
        <button className="adv-close" onClick={closeFilter}>閉じる</button>
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

  const saveNew = (values, imgVal, imgMeta) => {
    const now = new Date().toISOString();
    const id = "c" + Date.now().toString(36);
    setCustomKits((cs) => [...cs, { id, no: "—", line: "CUSTOM", ...values, t: now }]);
    if (adding === "owned") setRecords((r) => ({ ...r, [id]: stampRecAll({ owned: true, plan: false, purchaseDate: "", buildDate: "" }, now) }));
    if (adding === "plan") setRecords((r) => ({ ...r, [id]: stampRecAll({ owned: false, plan: true, purchaseDate: "", buildDate: "" }, now) }));
    if (imgVal !== undefined && imgVal !== null) { setImage(id, imgVal); recordImgMeta(id, "primary", imgMeta || { src: "photo" }); }
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

  /* ── 卡片 ── */
  const lineBadge = (k, showPb = true) => (
    <>
      {k.line === "Ver.Ka" && <span className="line-chip ka">Ver.Ka</span>}
      {k.line === "MGEX" && <span className="line-chip ex">MGEX</span>}
      {k.line === "CUSTOM" && <span className="line-chip cu">追加</span>}
      {showPb && k.premium && <span className="line-chip pb">プレバン</span>}
    </>
  );

  const salonView = tab === "zukan" && zukanMode === "salon";
  const slPad = typeof window !== "undefined" && !!(window.matchMedia && window.matchMedia("(min-width:768px)").matches);
  const Card = ({ kit }) => {
    const rec = getRec(kit.id);
    const dim = settings.dimUnowned && !rec.owned && !rec.plan;
    const img = thumbSrc(kit.id);
    const onCardClick = () => { if (consumeLP()) return; setDetail(kit.id); setEditing(false); };
    const sketchCrt = !rec.owned && !img; // 未入手かつ画像なし=ベクター→CRT風に
    if (salonView) {
      return (
        <button key={kit.id} className={`sl-card ${dim ? "dim" : ""} ${rec.owned ? "owned" : ""} ${rec.plan ? "planned" : ""} ${rec.buildDate ? "built" : ""}`} onClick={onCardClick}>
          <div className="sl-frame" {...imgPress(kit.id, () => openViewer(kit.id, "salon"))}>
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
      const textLP = makeLongPress(() => { hapticStrong(); setQuickKit(kit); }); // 文字長押し→クイックメニュー
      return (
        <div key={kit.id} className="kz-rowscroll">
          <button className={`kz-row ${dim ? "dim" : ""} ${rec.owned ? "owned" : ""} ${rec.plan ? "planned" : ""} ${rec.buildDate ? "built" : ""}`} onClick={onCardClick}>
            <div className="kz-rframe" {...imgPress(kit.id)}>
              {img
                ? <KitImage kit={kit} img={img} owned={rec.owned} built={!!rec.buildDate} size={88} cls="sm" frame={thumbFrameStyle(kit.id)} />
                : <SeriesWatermark kit={kit} variant="list" />}
            </div>
            <div className="kz-rmain" {...textLP}>
              <div className="kz-rno">{[
                settings.listGrade !== false ? kit.grade : null,
                settings.listNo && kit.no && kit.no !== "—" ? `No.${kit.no}` : null,
                settings.listCode && kit.code ? kit.code : null,
              ].filter(Boolean).join(" · ")}</div>
              {settings.listSeries && kit.series && <div className="kz-rseries">{kit.series}</div>}
              <div className="kz-rname"><KitName name={kit.name} /></div>
              <div className="kz-rmeta">
                <span className="kz-year">{kit.ym ? kit.ym.replace("-", ".") : "—"}</span>
                {settings.listPrice && kit.price ? <span className="kz-price">{fmtYen(kit.price)}</span> : null}
                {settings.listPurchase && rec.purchaseDate && <span className="kz-date">購入 {fmtDate(rec.purchaseDate)}</span>}
                {settings.listBuild && rec.buildDate && <span className="kz-date done">完成 {fmtDate(rec.buildDate)}</span>}
                {kit.premium && <span className="line-chip pb">プレバン</span>}
                {kit.base && <span className="line-chip base">ベース</span>}
                {lineBadge(kit, false)}
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
          {kit.premium && <span className="line-chip pb corner-pb">プレバン</span>}
          {kit.base && <span className="line-chip base corner-base">ベース</span>}
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
    { open: quickKit != null, close: () => setQuickKit(null) },
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
    { open: titleDetail != null, close: () => setTitleDetail(null) },
    { open: !!adding, close: () => setAdding(false) },
    { open: !!detailKit && editing, close: () => setEditing(false) },
    { open: searchOpen, close: () => setSearchOpen(false) },
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
    <div className={"app " + (settings.theme === "light" ? "light" : "")}><style>{CSS}</style>
      <div className="empty" style={{ paddingTop: 120 }}><MechSketch seedKey="loading" owned={false} built={false} size={70} /><p>図鑑を準備中…</p></div>
    </div>
  );

  return (
    <div className={"app " + (settings.theme === "light" ? "light" : "") + (detailKit || adding || promptEdit || profileOpen || setupOpen || titleDetail || searchOpen || filterOpen || fixOpen || quizOpen || identifyOpen || imgEdit ? " lock" : "")}>
      <style>{CSS}</style>
      <AppDialogHost />

      {storageErr && (
        <div
          role="alert"
          onClick={() => setStorageErr("")}
          style={{
            position: "fixed", left: 8, right: 8, top: "calc(env(safe-area-inset-top) + 8px)",
            zIndex: 99998, background: "#5a1410", color: "#ffd9d2",
            padding: "10px 14px", borderRadius: 10, fontSize: 12.5, lineHeight: 1.5,
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
          <span className="av-toast-medal"><svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="avGoldT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2dca0" /><stop offset="1" stopColor="#9c7838" /></linearGradient></defs><polygon points="32,7 49,16 49,40 32,57 15,40 15,16" fill="none" stroke="url(#avGoldT)" strokeWidth="2" /><polygon points="32,12 44,19 44,38 32,50 20,38 20,19" fill="rgba(217,179,106,.12)" stroke="url(#avGoldT)" strokeWidth="2.4" /><text x="32" y="39" textAnchor="middle" fontFamily="Shippori Mincho,serif" fontWeight="800" fontSize="20" fill="url(#avGoldT)">章</text></svg></span>
          <div className="av-toast-body">
            <div className="av-toast-kick">DECORATED · 叙勲</div>
            <div className="av-toast-name">{toast.name}</div>
          </div>
          {toastQueue.length > 0 && <span className="av-toast-more">+{toastQueue.length}</span>}
        </button>
      )}

      <header className="head">
        {(() => {
          const arc = tab === "zukan" ? (zukanMode === "salon" ? { jp: "絵測档案", en: "GALLERY" } : { jp: "機体档案", en: "REGISTRY" })
            : tab === "collection" ? (collMode === "plan" ? { jp: "発注档案", en: "REQUISITION" } : { jp: "収蔵档案", en: "HOLDINGS" })
            : tab === "analysis" ? (anaMode === "analysis" ? { jp: "観測档案", en: "ANALYSIS" } : { jp: "叙勲档案", en: "DECORATIONS" })
            : { jp: "管理档案", en: "ADMINISTRATION" };
          const isPlan = tab === "collection" && collMode === "plan";
          const isDecor = tab === "analysis" && anaMode === "record";
          const isSalon = tab === "zukan" && zukanMode === "salon";
          const titlesGot = titles.filter((t) => t.unlocked).length;
          const titlesPct = Math.round((titlesGot / Math.max(1, titles.length)) * 100);
          const pct = isDecor ? titlesPct
            : isPlan ? futurePct
            : isSalon ? imgStats.pct
            : tab === "collection" ? builtPct
            : collectPct;
          return (
            <div className="hf" role="button" tabIndex={0}
              onClick={() => { haptic(); if (bodyRef.current) bodyRef.current.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <span className="hf-tag">Ⓐ ARCHIVE</span>
              <span className="hf-part" key={arc.en}><i className="hf-rl">Ⓡ</i>{arc.en}</span>
              <span className="hf-gate gt" style={{ left: "32%" }} /><span className="hf-gate gt" style={{ left: "58%" }} /><span className="hf-gate gl" style={{ top: "50%" }} />
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
                    <button className="hf-seal" aria-label="カメラで機体を判別" onClick={(e) => { e.stopPropagation(); haptic(); setIdentifyCam(true); setIdentifyOpen(true); }}>鑑</button>
                    {isDecor ? (
                      <>
                        <div className="s"><b><Roll value={titles.length} resetKey={arc.jp} /></b><span>称号</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={titlesGot} resetKey={arc.jp} /></b><span>叙勲</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={titlesPct} resetKey={arc.jp} />%</b><span>完成率</span></div>
                      </>
                    ) : isPlan ? (
                      <>
                        <div className="s"><b><Roll value={allKits.length} resetKey={arc.jp} /></b><span>収録</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={planAll} resetKey={arc.jp} /></b><span>予定</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={futurePct} resetKey={arc.jp} />%</b><span>収集率</span></div>
                      </>
                    ) : isSalon ? (
                      <>
                        <div className="s"><b><Roll value={allKits.length} resetKey={arc.jp} /></b><span>収録</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={imgStats.total} resetKey={arc.jp} /></b><span>撮影数</span></div>
                        <div className="hf-div" />
                        <div className="s"><b className="kin"><Roll value={imgStats.pct} resetKey={arc.jp} />%</b><span>撮影率</span></div>
                      </>
                    ) : (
                      <>
                        <div className="s"><b><Roll value={tab === "collection" ? ownedAll : allKits.length} resetKey={arc.jp} /></b><span>{tab === "collection" ? "収蔵" : "収録"}</span></div>
                        <div className="hf-div" />
                        <div className="s"><b><Roll value={tab === "collection" ? builtAll : ownedAll} resetKey={arc.jp} /></b><span>{tab === "collection" ? "完成" : "入手"}</span></div>
                        <div className="hf-div" />
                        <div className="s"><b><Roll value={tab === "collection" ? builtPct : collectPct} resetKey={arc.jp} />%</b><span>{tab === "collection" ? "完成率" : "収集率"}</span></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="hf-prog"><i className={isPlan || isDecor ? "kin" : ""} style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })()}
      </header>

      <main className="body" ref={bodyRef} onTouchStart={onBodyTouchStart} onTouchMove={onBodyTouchMove}
        onScroll={onBodyScroll}>
        <div key={tab} className="tab-page">
        {tab === "zukan" && (
          <>
            {LedgerHead({
              variant: salonView ? "salon" : "registry",
              eyebrow: salonView ? "GALLERY · 画廊" : "REGISTRY · 図鑑",
              title: salonView
                ? <>絵<em>測</em>巻</>
                : <><span>博</span><em>物</em><span>誌</span></>,
              alt: salonView ? "博物誌" : "絵測巻",
              onSwitch: () => setZukanMode((m) => (m === "salon" ? "all" : "salon")),
              scheme: "slide",
              akey: salonView ? "salon" : "registry",
              dir: salonView ? 1 : -1,
              searchActive: !!queries.z,
              onClearSearch: () => setQueries((s) => ({ ...s, z: "" })),
              active: !!queries.z || advActive,
              countNode: salonView
                ? <><b>{sorted.length}</b> 点</>
                : <><b>{sorted.length}</b> / {allKits.length} 収録</>,
            })}
            {searchOpen && renderSearchModal({
              placeholder: "機体名・型式・原作で検索",
              title: salonView ? <>絵<em>測</em>巻</> : <>博<em>物</em>誌</>,
            })}
            {filterOpen && (
              <div className="modal-bg search-modal-bg" onClick={closeFilter}>
                <div className="modal search-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="sm-head">
                    <span className="sm-title">{salonView ? <>絵<em>測</em>巻</> : <>博<em>物</em>誌</>} <span className="sm-eyebrow">FILTER</span></span>
                    <button className="modal-x static" onClick={closeFilter}>✕</button>
                  </div>
                  <AdvPanel />
                  <div className="drawer-sub">
                    <GfRow skey="gfZukan" />
                  </div>
                  <div className="drawer-tools">
                    <SortBar />
                    {salonView ? <SalonControls /> : <ViewToggle />}
                    {!salonView && <button className="add-btn" onClick={() => { closeFilter(); setAdding("zukan"); }}>＋ 追加</button>}
                  </div>
                </div>
              </div>
            )}
            {(advActive || query || gf) && <div className="section-note"><button className="cond-clear" onClick={clearAllConds}>全条件をクリア</button></div>}
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
                さらに表示(残り {sorted.length - limit} 件)
              </button>
            )}
            <p className="footnote">※ 収録データはGUNPLA ROOM等の公開型録情報を整理(一般販売:MG No.001–223+プレバン207 / Ver.Ka 01–30+プレバン20 / MGEX、HG 統一ナンバリング 全収録 No.001–268+プレバン205、HG SEED系 全86(01–59/R01–17/MSV-01–07+プレバン3)、HG 00系 全収録 No.01–72+プレバン12、HG ビルドファイターズ系 全収録 No.1–69(支援機含む。23/30/32/41欠番)+プレバン25、HG 鉄血のオルフェンズ系 全収録 No.1–47+O-1~9+プレバン23、HG ガンダムブレイカー バトローグ系 全10(うちプレバン4)、HG ククルス・ドアンの島 全11、HG THE ORIGIN系 全収録 No.001–026+プレバン001–026、HG Gのレコンギスタ系 全収録 No.001–017+プレバン4、HG AGE系 全収録 No.001–034+プレバン7、HG サンダーボルト系 全収録 No.001–013+プレバン1、HG ビルドダイバーズ系 全収録 No.001–083+プレバン6、HG ビルドメタバース系 全8、HG GQuuuuuuX系 No.1–15+プレバン4(続刊)、HG 水星の魔女系 全収録 No.01–26+プレバン12、RG 全43+プレバン74、PG 全26+プレバン5(早期プレバン数点は確認中)、HIRM 01–05(06以降確認中)、RE/100 01–06+プレバン4(他確認中)、ベース限定MG 全39・RG 01–29(以降確認中)・HG 主線分(系列網羅は順次)、MGSD 全5。ホビーオンライン/プレバン限定は「プレバン」表記で収録、イベント限定は未収録、ガンダムベース限定は「ベース限定」タグで順次収録中(現在MG分))。各欄位は詳細画面の「編集」で随時修正可能。</p>
          </>
        )}

        {tab === "collection" && (() => {
          const isPlan = collMode === "plan";
          const listKits = isPlan ? planKits : ownedKits;
          const listVisible = isPlan ? planVisible : ownedVisible;
          const baseCount = isPlan ? planAll : ownedAll;
          if (baseCount === 0) {
            return (
              <div className="empty">
                <MechSketch seedKey="empty" owned={false} built={false} size={70} />
                <p>{isPlan ? "購入予定がありません。" : "まだ収蔵がありません。"}</p>
                <p className="empty-sub">{isPlan ? "図鑑やリストで機体を長押しすると「購入予定」に追加できます。" : "図鑑から機体を選び、「入手済み」を記録しましょう。"}</p>
              </div>
            );
          }
          return (
            <>
              {LedgerHead({
                variant: isPlan ? "requisition" : "holdings",
                eyebrow: isPlan ? "REQUISITION · 予定" : "HOLDINGS · 所持",
                title: isPlan ? <>発<em>注</em>簿</> : <>蔵<em>品</em>帳</>,
                alt: isPlan ? "蔵品帳" : "発注簿",
                onSwitch: () => setCollMode((m) => (m === "plan" ? "owned" : "plan")),
                scheme: "slide",
                akey: isPlan ? "requisition" : "holdings",
                dir: isPlan ? 1 : -1,
                searchActive: !!queries.c,
                onClearSearch: () => setQueries((s) => ({ ...s, c: "" })),
                active: !!queries.c || advActive,
                countNode: isPlan
                  ? <><b>{listKits.length}</b> / {planAll} 発注</>
                  : <><b>{listKits.length}</b> / {ownedAll} 収蔵</>,
              })}
              {searchOpen && renderSearchModal({
                placeholder: isPlan ? "予定内を検索" : "収蔵内を機体名・型式で検索",
                title: isPlan ? <>発<em>注</em>簿</> : <>蔵<em>品</em>帳</>,
              })}
              {filterOpen && (
                <div className="modal-bg search-modal-bg" onClick={closeFilter}>
                  <div className="modal search-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="sm-head">
                      <span className="sm-title">{isPlan ? <>発<em>注</em>簿</> : <>蔵<em>品</em>帳</>} <span className="sm-eyebrow">FILTER</span></span>
                      <button className="modal-x static" onClick={closeFilter}>✕</button>
                    </div>
                    <AdvPanel />
                    <div className="drawer-sub">
                      <GfRow skey="gfShuzo" />
                    </div>
                    <div className="drawer-tools">
                      <SortBar />
                      <ViewToggle />
                      <button className="add-btn" onClick={() => { closeFilter(); setAdding(isPlan ? "plan" : "owned"); }}>＋ 追加</button>
                    </div>
                  </div>
                </div>
              )}
              {(advActive || query || gf) && <div className="section-note"><button className="cond-clear" onClick={clearAllConds}>全条件をクリア</button></div>}
              {listKits.length === 0
                ? <p className="ana-note">検索条件に一致する{isPlan ? "予定" : "収蔵"}がありません。</p>
                : Grid({ kits: listVisible })}
              {listKits.length > limit && (
                <button ref={moreRef} className="more-btn" onClick={() => setLimit((n) => n + 80)}>
                  さらに表示(残り {listKits.length - limit} 件)
                </button>
              )}
            </>
          );
        })()}

        {tab === "analysis" && (() => {
          const owned = allKits.filter((k) => getRec(k.id).owned);
          if (owned.length === 0) return (
            <>
              <div className="empty">
                <MechSketch seedKey="ana" owned={false} built={false} size={70} />
                <p>分析できる収蔵がまだありません。</p>
                <p className="empty-sub">図鑑で「入手済み」を記録すると、ここに収蔵分析が表示されます。</p>
              </div>
            </>
          );

          const bySeries = {};
          owned.forEach((k) => { const s = k.series || "原作不明"; bySeries[s] = (bySeries[s] || 0) + 1; });
          const sArr = Object.entries(bySeries).sort((x, y) => y[1] - x[1]);
          const topS = sArr.slice(0, 8);
          if (sArr.length > 8) topS.push(["その他", sArr.slice(8).reduce((s, [, v]) => s + v, 0)]);
          const seriesData = topS.map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }));

          const gradeColors = { MG: "#e8553d", HG: "#8fcf8a", RG: "#d9b36a", PG: "#b08ad6", HIRM: "#cf8a6a", RE: "#8ab0a0", FM: "#a0a8c0", MGSD: "#6fd3c7", EXTRA: "#cfc9bb" };
          const byGrade = {};
          owned.forEach((k) => { const g = k.grade || "MG"; byGrade[g] = (byGrade[g] || 0) + 1; });
          const gradeData = Object.entries(byGrade).sort((x, y) => y[1] - x[1])
            .map(([label, value]) => ({ label, value, color: gradeColors[label] || "#9aa0ae" }));

          const byYear = {};
          owned.forEach((k) => { const d = getRec(k.id).purchaseDate; if (d) { const y = d.slice(0, 4); byYear[y] = (byYear[y] || 0) + 1; } });
          const yearData = Object.keys(byYear).sort().map((y) => ({ label: y, value: byYear[y] }));
          const maxYear = Math.max(1, ...yearData.map((d) => d.value));

          const byBuildYear = {};
          owned.forEach((k) => { const d = getRec(k.id).buildDate; if (d) { const y = d.slice(0, 4); byBuildYear[y] = (byBuildYear[y] || 0) + 1; } });
          const buildYearData = Object.keys(byBuildYear).sort().map((y) => ({ label: y, value: byBuildYear[y] }));
          const maxBuildYear = Math.max(1, ...buildYearData.map((d) => d.value));

          const gradeLineColors2 = { MG: "#e8553d", HG: "#8fcf8a", RG: "#d9b36a", PG: "#b08ad6", HIRM: "#cf8a6a", RE: "#8ab0a0", FM: "#a0a8c0", MGSD: "#6fd3c7", EXTRA: "#cfc9bb" };
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
            .map((g) => ({ label: g, color: gradeLineColors2[g], points: lineYears.map((yy) => (gradeYearCounts[g][yy] || 0)) }));

          return (
            <>
              {anaMode === "record" ? (
              <>
              {(() => {
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
                      <linearGradient id="avGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2dca0" /><stop offset="1" stopColor="#9c7838" /></linearGradient>
                    </defs></svg>
                    <div className="av-head">
                      <button type="button" className="sb-switch" onClick={() => { hapticStrong(); setAnaMode("analysis"); }}
                        aria-label="「解題書」へ切り替え">
                        <span className="av-eyebrow">{(curUni && curUni[0] !== "all" ? (UNI_PREFIX[curUni[0]] || curUni[1]) + " " : "") + "DECORATIONS · 称号"}</span>
                        <span className="sb-titlewrap">
                          <LedgerTitle scheme="slide" akey="record" dir={-1} title={<>叙<em>勲</em>録</>} alt="解題書" />
                        </span>
                      </button>
                      <span className="av-head-r">
                        <span className="av-count"><b>{got}</b> / {pool.length} 叙勲{newN > 0 ? ` · NEW ${newN}` : ""}</span>
                        <button type="button" className={"sb-icon" + (segOpen || titleUniverse !== "all" ? " on" : "")} aria-label="世界観で絞り込み(長押しで解除)"
                          {...longPress(() => { haptic(); setSegOpen((o) => !o); }, () => { setTitleUniverse("all"); setSegOpen(false); notify("世界観の絞り込みを解除しました", { kind: "ok" }); })}>
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
                      {list.map((t) => {
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
                              <span className="av-ename">{hiddenLocked ? "？？？" : t.name}</span>
                              {t.tier >= 1 && <span className="av-ehair" />}
                              {t.tier >= 1 && <span className="av-eflavor">{t.sub}</span>}
                              {t.tier === 1 && <span className="av-etag silver">あと {Math.max(0, (t.builtNeed || 1) - (t.builtCur || 0))} 体完成で金章</span>}
                              {t.tier === 0 && t.need > 1 && (
                                <span className="av-eprog"><span className="av-ebar"><i style={{ width: `${Math.round(t.cur / t.need * 100)}%` }} /></span><span className="av-erem">あと {remain}</span></span>
                              )}
                              {t.tier === 0 && t.need === 1 && <span className="av-etag locked">未叙勲</span>}
                            </span>
                            {isNew && <i className="av-dot" />}
                          </button>
                        );
                      })}
                      {list.length === 0 && <div className="av-empty">この世界の称号は準備中…</div>}
                    </div>
                  </section>
                );
              })()}
              </>
              ) : (
              <>
              <div className="sb-band">
                <div className="sb-head">
                  <button type="button" className="sb-switch" onClick={() => { hapticStrong(); setAnaMode("record"); }}
                    aria-label="「叙勲録」へ切り替え">
                    <span className="sb-eyebrow">ANALYSIS · 紀録</span>
                    <span className="sb-titlewrap">
                      <LedgerTitle scheme="slide" akey="analysis" dir={1} title={<>解<em>題</em>書</>} alt="叙勲録" />
                    </span>
                  </button>
                  <span className="sb-head-r">
                    <button type="button" className="quiz-entry" onClick={(e) => { e.stopPropagation(); setQuizOpen(true); }}>知識試験<i>◇</i></button>
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
              <section className="ana-sec">
                <div className="year-head"><span className="year-num">構成比</span><span className="year-rule" /><span className="year-count">作品別・Grade別</span></div>
                <div className="pie-wrap">
                  <Pie data={seriesData} center="作品別" />
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
                  <Pie data={gradeData} center="Grade別" />
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
                <div className="year-head"><span className="year-num">購入年別</span><span className="year-rule" /><span className="year-count">購入数推移</span></div>
                {yearData.length === 0
                  ? <p className="ana-note">購入日が記録された機体がまだありません。</p>
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
                <div className="year-head"><span className="year-num">完成年別</span><span className="year-rule" /><span className="year-count">完成数推移</span></div>
                {buildYearData.length === 0
                  ? <p className="ana-note">完成日が記録された機体がまだありません。</p>
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
                <div className="year-head"><span className="year-num">発売数推移</span><span className="year-rule" /><span className="year-count">Grade別・年間発売数</span></div>
                <LineChart years={lineYears} series={lineSeries} />
                <div className="legend horizontal">
                  {lineSeries.map((s) => (
                    <div className="legend-item" key={s.label}><i style={{ background: s.color }} /><span>{s.label}</span></div>
                  ))}
                </div>
              </section>
              <p className="footnote">※ 金額は税込定価ベースの集計です(実購入額ではありません)。発売数推移のみ図鑑収録データ全体、その他は「入手済み」記録のみから算出。</p>
              </>
              )}
            </>
          );
        })()}

        {tab === "settings" && (
          <div className="panel-wrap">
            <div className="panel-head-row">
              <h2 className="panel-title">プロフィール<span>BUILDER</span></h2>
              <button className="panel-edit-btn" onClick={() => setProfileOpen(true)}>編集 ✎</button>
            </div>
            <button className="builder-line builder-tap" onClick={() => setProfileOpen(true)}>
              <span>BUILDER<b>{settings.builderName || "—"}</b></span>
              <span>ガンプラ歴<b>{careerStr(settings.builderSince)}</b></span>
            </button>
            <h2 className="panel-title">テーマ<span>THEME</span></h2>
            <div className="opt-group horizontal">
              <button className={`opt ${settings.theme !== "light" ? "on" : ""}`} onClick={() => patchSettings({ theme: "dark" })}>ダーク(漆黒)</button>
              <button className={`opt ${settings.theme === "light" ? "on" : ""}`} onClick={() => patchSettings({ theme: "light" })}>ライト(生成り)</button>
            </div>
            <h2 className="panel-title">触覚フィードバック<span>HAPTICS</span></h2>
            <div className="opt-group horizontal">
              <button className={`opt ${settings.haptic !== false ? "on" : ""}`} onClick={() => { patchSettings({ haptic: true }); setHapticEnabled(true); haptic(); }}>オン</button>
              <button className={`opt ${settings.haptic === false ? "on" : ""}`} onClick={() => patchSettings({ haptic: false })}>オフ</button>
            </div>
            <h2 className="panel-title">表示<span>DISPLAY</span></h2>
            <div className="opt-group horizontal">
              <button className={`opt ${dispTarget === "card" ? "on" : ""}`} onClick={() => setDispTarget("card")}>カード表示</button>
              <button className={`opt ${dispTarget === "list" ? "on" : ""}`} onClick={() => setDispTarget("list")}>リスト表示</button>
            </div>
            <div className="opt-group" style={{ marginTop: 8 }}>
              {(dispTarget === "card"
                ? [
                    ["compact", "コンパクト表示"],
                    ["showGrade", "グレードを表示"],
                    ["showYm", "発売年月を表示"],
                    ["showNo", "No.番号を表示"],
                    ["showCode", "型式番号を表示"],
                    ["showPrice", "定価を表示"],
                    ["showSeries", "作品名を表示"],
                  ]
                : [
                    ["listGrade", "グレードを表示"],
                    ["listSeries", "作品名を表示"],
                    ["listNo", "No.番号を表示"],
                    ["listCode", "型式番号を表示"],
                    ["listPrice", "定価を表示"],
                    ["listPurchase", "購入日を表示"],
                    ["listBuild", "完成日を表示"],
                  ]
              ).map(([key, label]) => (
                <button key={key} className="opt toggle" onClick={() => patchSettings((s) => ({ [key]: !s[key] }))}>
                  <span>{label}</span>
                  <i className={`switch ${settings[key] ? "on" : ""}`}><b /></i>
                </button>
              ))}
            </div>
            <div className="opt-group" style={{ marginTop: 8 }}>
              <button className="opt toggle" onClick={() => patchSettings((s) => ({ dimUnowned: !s.dimUnowned }))}>
                <span>未入手を淡色表示(共通)</span>
                <i className={`switch ${settings.dimUnowned ? "on" : ""}`}><b /></i>
              </button>
            </div>

            <h2 className="panel-title">AI画像生成<span>IMAGE AI</span></h2>
            <div className="opt-group">
              <label className="fld pad"><span>Gemini APIキー(この端末にのみ保存)</span>
                <input type="password" value={settings.geminiKey || ""} placeholder="AIza..."
                  onChange={(e) => patchSettings({ geminiKey: e.target.value })} />
              </label>
              <label className="fld pad"><span>OpenAI APIキー(この端末にのみ保存)</span>
                <input type="password" value={settings.openaiKey || ""} placeholder="sk-..."
                  onChange={(e) => patchSettings({ openaiKey: e.target.value })} />
              </label>
              <label className="fld pad"><span>画像生成モデル(選択した提供元のキーを使用)</span>
                <select value={settings.geminiModel || "gemini-3-pro-image"}
                  onChange={(e) => patchSettings({ geminiModel: e.target.value })}>
                  {AI_MODELS.map((g) => (
                    <optgroup key={g.group} label={g.group}>
                      {g.items.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <div className="fld pad"><span>スタイル別プロンプト(タップで編集・点灯=カスタム済み)</span>
                <div className="prompt-chips">
                  {AI_STYLES.map((s) => (
                    <button key={s.id} className={`opt ${settings.aiPrompts && settings.aiPrompts[s.id] ? "on" : ""}`}
                      onClick={() => setPromptEdit(s.id)}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="panel-title">クラウド同期<span>SUPABASE</span></h2>
            <div className="opt-group">
              <label className="fld pad"><span>Supabase URL</span>
                <input value={settings.supaUrl || ""} placeholder="https://xxxx.supabase.co"
                  onChange={(e) => patchSettings({ supaUrl: e.target.value })} />
              </label>
              <label className="fld pad"><span>anon キー(この端末にのみ保存)</span>
                <input type="password" value={settings.supaKey || ""} placeholder="eyJhbGciOi..."
                  onChange={(e) => patchSettings({ supaKey: e.target.value })} />
              </label>
              <button className="opt" onClick={syncNow}><span>今すぐ同期</span><i>⇅</i></button>
              <button className="opt" onClick={async () => {
                const cfg = supaRef.current;
                if (!cfg.url || !cfg.key) { notify("Supabase URL と anon キーを入力してください", { kind: "warn" }); return; }
                if (!(await appConfirm("クラウドのデータでこの端末を上書き復元します。この端末だけの未同期の変更は失われます。", { title: "クラウドから復元", okText: "上書き復元", danger: true }))) return;
                setSyncMsg("復元中…");
                try {
                  const nn = await pullCloud(cfg, true);
                  setSyncMsg(`復元完了(受信 ${nn} 件)`);
                } catch (e) { setSyncMsg("復元エラー:" + ((e && e.message) || e)); }
              }}><span>クラウドから復元(上書き)</span><i>⬇</i></button>
              {syncMsg && <p className="ana-note">{syncMsg}</p>}
            </div>

            <h2 className="panel-title">データ<span>DATA</span></h2>
            <div className="opt-group">
              <button className="opt" onClick={optimizeImages}>
                <span>{optimizing ? "画像を再圧縮中…" : "画像を最適化(容量削減)"}</span><i>▣</i>
              </button>
              {!confirmReset ? (
                <button className="opt danger" onClick={() => setConfirmReset(true)}>収蔵記録をすべて消去…</button>
              ) : (
                <div className="confirm-box">
                  <span>収蔵記録(入手・購入日・完成日)を消去します。編集内容・追加機体・画像は残ります。よろしいですか?</span>
                  <div>
                    <button className="opt danger solid" onClick={async () => { if (await appConfirm("収蔵記録(入手・購入日・完成日)を完全に消去します。元に戻せません。", { title: "収蔵記録を消去", okText: "消去する", danger: true })) setRecords({}); setConfirmReset(false); }}>消去する</button>
                    <button className="opt" onClick={() => setConfirmReset(false)}>やめる</button>
                  </div>
                </div>
              )}
            </div>
            <h2 className="panel-title">箱絵の一括取り込み<span>IMAGES</span></h2>
            <div className="opt-group">
              <label className="fld" style={{ padding: "0 2px 4px" }}>
                <span>manifest URL(kit_id → 画像URL の JSON)</span>
                <input value={manifestUrl} placeholder="https://xxxx.supabase.co/storage/v1/object/public/kit-images/mg_images_manifest.json"
                  onChange={(e) => setManifestUrl(e.target.value)} />
              </label>
              <button className="opt" disabled={imgBusy} onClick={importManifest}>
                <span>{imgBusy ? "処理中…" : "画像を一括インポート(URL参照)"}</span><i>⬇</i>
              </button>
              <button className="opt" disabled={imgBusy} onClick={() => localImgRef.current && localImgRef.current.click()}>
                <span>ローカル画像を一括取り込み(ファイル名=kit_id)</span><i>⊞</i>
              </button>
              <input ref={localImgRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                onChange={(e) => { importLocalImages(e.target.files); e.target.value = ""; }} />
              <button className="opt" disabled={imgBusy} onClick={precacheImages}>
                <span>オフライン用に画像を保存(プリキャッシュ)</span><i>⤓</i>
              </button>
              {imgMsg && <p className="setup-note" style={{ padding: "2px 2px 0" }}>{imgMsg}</p>}
            </div>
            <h2 className="panel-title">バックアップ<span>BACKUP</span></h2>
            <div className="opt-group">
              <button className="opt" onClick={exportData}><span>データを書き出す(JSON)</span><i>↓</i></button>
              <button className="opt" onClick={() => importRef.current && importRef.current.click()}><span>バックアップを読み込む</span><i>↑</i></button>
              <input ref={importRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={importData} />
            </div>
            <p className="footnote">記録・編集・追加機体・画像はすべて自動保存され、次回起動時に復元されます。アップロード画像は自動圧縮(横440px・JPEG)で保存。</p>

            <h2 className="panel-title">問題報告・ご要望<span>FEEDBACK</span></h2>
            <div className="opt-group">
              {[
                ["バグ報告", "⚠", "不具合・バグを報告する"],
                ["改善提案", "✎", "改善のご提案を送る"],
              ].map(([label, icon, desc]) => (
                <button key={label} className="opt" onClick={() => {
                  const subject = encodeURIComponent("【" + label + "】ガンプラ大図鑑");
                  window.location.href = "mailto:kishoujpjp@gmail.com?subject=" + subject;
                }}>
                  <span>{desc}</span><i>{icon}</i>
                </button>
              ))}
              <button className="opt" onClick={() => setFixOpen(true)}>
                <span>機体情報の修正を提案する</span><i>✑</i>
              </button>
            </div>
            <p className="footnote">タップするとメールアプリが開きます。件名のタグはそのままで、本文にご記入のうえ送信してください。</p>
          </div>
        )}
        </div>
      </main>

      {fixOpen && <KitFixModal allKits={allKits} onClose={() => setFixOpen(false)} />}
      {quizOpen && <QuizModal allKits={allKits} getRec={getRec} images={images} extras={extras} albumMeta={albumMeta} builderName={settings.builderName} onClose={() => setQuizOpen(false)} />}
      {identifyOpen && <KitIdentifyModal allKits={allKits} geminiKey={settings.geminiKey} openaiKey={settings.openaiKey} cameraMode={identifyCam} onAttach={attachPhoto} onClose={() => setIdentifyOpen(false)} />}

      {/* ── 詳細 / 編輯彈窗 ── */}
      {quickKit && (() => {
        const qr = getRec(quickKit.id);
        return (
          <div className="modal-bg qm-bg" onClick={() => setQuickKit(null)} style={{ zIndex: 92 }}>
            <div className="qm-card" onClick={(e) => e.stopPropagation()}>
              <div className="qm-name"><KitName name={quickKit.name} /></div>
              <div className="qm-btns">
                <button className={"qm-btn own" + (qr.owned ? " on" : "")}
                  onClick={() => { haptic(); toggleOwned(quickKit.id); setQuickKit(null); }}>
                  <span className="qm-ico">{qr.owned ? "✓" : "◎"}</span>{qr.owned ? "入手済" : "入手"}</button>
                <button className={"qm-btn plan" + (qr.plan ? " on" : "")}
                  onClick={() => { haptic(); togglePlan(quickKit.id); setQuickKit(null); }}>
                  <span className="qm-ico">{qr.plan ? "✓" : "◆"}</span>{qr.plan ? "予定中" : "予定"}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {ownConfirm && (
        <div className="modal-bg confirm-bg" onClick={() => setOwnConfirm(null)} style={{ zIndex: 90 }}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon" style={{ color: "var(--shu)" }}>✦</div>
            <div className="confirm-title">入手記録を解除しますか?</div>
            <div className="confirm-name">{ownConfirm.name}</div>
            <div className="confirm-btns">
              <button className="btn" onClick={() => setOwnConfirm(null)}>やめる</button>
              <button className="btn primary" onClick={() => { toggleOwned(ownConfirm.id); setOwnConfirm(null); }}>解除する</button>
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
              resolveSrc={(sl) => (sl.ref ? refSrc(sl.ref, sl.kitId, images, extras) : null)}
              serifOf={(sl) => (sl.ref ? (serifs[sl.ref] || "") : "")}
              onSerif={(sl) => { if (sl.ref) setSerifEdit({ ref: sl.ref, text: serifs[sl.ref] || "" }); }}
              onIndex={(i) => { setViewerDel(false); setSerifEdit(null); setViewer({ kitId: flat[i].kitId, ref: flat[i].ref, from: vfrom }); }}
              onClose={() => { swallowNextClick(); close(); }} />

            {serifEdit && (
              <div className="serif-edit-bg" onClick={(e) => { e.stopPropagation(); setSerifEdit(null); }}>
                <div className="serif-edit" onClick={(e) => e.stopPropagation()}>
                  <textarea className="se-input" autoFocus value={serifEdit.text} maxLength={120} rows={3}
                    onChange={(e) => setSerifEdit((s) => ({ ...s, text: e.target.value }))}
                    placeholder="台詞を入力(改行・空白・記号もそのまま反映)" />
                  <div className="se-btns">
                    <button className="btn" onClick={() => setSerifEdit(null)}>取消</button>
                    <button className="btn solid" onClick={saveSerif}>保存</button>
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
            initialCols={settings.ieCols === 3 ? 3 : 2} onCols={(n) => patchSettings({ ieCols: n })}
            ai={{ geminiKey: settings.geminiKey, openaiKey: settings.openaiKey, model: settings.geminiModel, prompts: settings.aiPrompts, style: settings.aiStyle, onModel: (m) => patchSettings({ geminiModel: m }), onStyle: (st) => patchSettings({ aiStyle: st }) }}
            onAddImage={(src, meta) => addAlbumImage(imgEdit, src, meta)}
            onRemoveImage={(ref) => removeAlbumImage(imgEdit, ref)}
            onSetRole={(ref, role) => setAlbumRole(imgEdit, ref, role)}
            onFrame={(ref) => setFrameEdit({ kitId: imgEdit, ref })}
            onReorder={(order) => setAlbumOrder(imgEdit, order)}
            onSetLoc={(ref, loc) => setImgLoc(imgEdit, ref, loc)}
            onBack={(depth, closeTop) => { atelierCloseRef.current = closeTop; setAtelierDepth(depth); }}
            onClose={() => setImgEdit(null)} />
        );
      })()}

      {frameEdit && (() => {
        const src = refSrc(frameEdit.ref, frameEdit.kitId, images, extras);
        if (!src) { setTimeout(() => setFrameEdit(null), 0); return null; }
        return (
          <FramingEditor src={src} initial={framingOf(frameEdit.kitId, frameEdit.ref)}
            onCancel={() => setFrameEdit(null)}
            onSave={(fr) => { setFraming(frameEdit.kitId, frameEdit.ref, fr); setFrameEdit(null); }} />
        );
      })()}

      <SeriesPicker open={seriesPickerOpen} value={adv.series} options={seriesList}
        onPick={(v) => { setAdv((a) => ({ ...a, series: v })); setSeriesPickerOpen(false); }}
        onClose={() => setSeriesPickerOpen(false)} />

      <UniPicker open={uniPickerOpen} value={adv.uni} options={UNI_PICK}
        onPick={(v) => { setAdv((a) => ({ ...a, uni: v })); setUniPickerOpen(false); }}
        onClose={() => setUniPickerOpen(false)} />

      {detailKit && (
        <div className="modal-bg" onClick={closeDetail}>
          <div className="modal dc-modal" onClick={(e) => e.stopPropagation()}>
            {!editing && <button className="dc-x" onClick={(e) => { e.stopPropagation(); closeDetail(); }} aria-label="閉じる">✕</button>}
            {!editing ? (
              <>
                <div className="dc-head">
                  <div className="dc-eye">{detailKit.grade}{detailKit.no !== "—" ? ` · No.${detailKit.no}` : ""}{detailKit.code ? ` · ${detailKit.code}` : ""}</div>
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
                        <span className="dc-unsub">NO VISUAL ON FILE · 機密</span>
                        <span className="dc-unref">REF · {detailKit.code || (detailKit.no !== "—" ? "No." + detailKit.no : "—")}</span>
                      </div>}
                  <button className="dc-frame-btn" onClick={(e) => { e.stopPropagation(); setImgEdit(detailKit.id); }}>
                    <svg className="bico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l5 5-9 9-5-5z" /><path d="M7 12l-2.5 2.5a2.1 2.1 0 0 0 3 3L10 15" /></svg>
                    編集
                  </button>
                </div>
                <div className="dc-spec" onClick={closeDetail}>
                  <div className="dc-srow"><span className="dc-k">原作</span><span className="dc-v">{detailKit.series || "—"}</span></div>
                  <div className="dc-srow"><span className="dc-k">分類</span><span className="dc-v dc-tags">
                    <GradeChip grade={detailKit.grade} />
                    {detailKit.base && <span className="line-chip base">ベース</span>}
                    {lineBadge(detailKit)}
                  </span></div>
                  <div className="dc-srow"><span className="dc-k">発売·定価</span><span className="dc-v"><span className="dc-gold">{detailKit.ym ? detailKit.ym.replace("-", ".") : "—"}</span>{detailKit.price ? <> · <span className="dc-mono">{fmtYen(detailKit.price)}</span></> : ""}</span></div>
                  {detailRec.owned && (detailRec.purchaseDate || detailRec.buildDate) && (
                    <div className="dc-srow"><span className="dc-k">記録</span><span className="dc-v">
                      {detailRec.purchaseDate && <span className="dc-mono">購入 {fmtDate(detailRec.purchaseDate)}</span>}
                      {detailRec.purchaseDate && detailRec.buildDate ? " · " : ""}
                      {detailRec.buildDate && <span className="dc-mono done">完成 {fmtDate(detailRec.buildDate)}</span>}
                    </span></div>
                  )}
                  <div className="dc-srow dc-srow-memo" onClick={(e) => e.stopPropagation()}><span className="dc-k">メモ</span><span className="dc-v"><NoteField note={detailKit.note} onCommit={(v) => setNote(detailKit, v)} /></span></div>
                  <div className="dc-srow dc-srow-tag" onClick={(e) => e.stopPropagation()}><span className="dc-k">タグ</span><span className="dc-v"><TagField tags={getTags(detailKit.id)} onCommit={(next) => setTags(detailKit.id, next)} /></span></div>
                </div>

                <button className="edit-link" onClick={() => setEditing(true)}>✎ 機体情報・画像を編集</button>
              </>
            ) : (
              <>
                <div className="modal-form-head">
                  <span>機体情報の編集</span>
                  <button className="modal-x static" onClick={() => setEditing(false)}>✕</button>
                </div>
                <KitForm
                  seriesOptions={seriesOptions}
                  ai={{ geminiKey: settings.geminiKey, openaiKey: settings.openaiKey, model: settings.geminiModel, prompts: settings.aiPrompts, style: settings.aiStyle, onModel: (m) => patchSettings({ geminiModel: m }), onStyle: (st) => patchSettings({ aiStyle: st }) }}
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
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 新增機體彈窗 ── */}
      {adding && (
        <div className="modal-bg" onClick={() => setAdding(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-head">
              <span>機体を追加</span>
              <button className="modal-x static" onClick={() => setAdding(false)}>✕</button>
            </div>
            <KitForm seriesOptions={seriesOptions} ai={{ geminiKey: settings.geminiKey, openaiKey: settings.openaiKey, model: settings.geminiModel, prompts: settings.aiPrompts, style: settings.aiStyle, onModel: (m) => patchSettings({ geminiModel: m }), onStyle: (st) => patchSettings({ aiStyle: st }) }} initial={{}} currentImg={null} isCustom={false}
              onSave={saveNew} onCancel={() => setAdding(false)} />
          </div>
        </div>
      )}

      {/* ── 初期復元彈窗 ── */}
      {setupOpen && (
        <div className="modal-bg">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-head">
              <span>クラウドから復元</span>
              <button className="modal-x static" onClick={() => setSetupOpen(false)}>✕</button>
            </div>
            <p className="setup-note">この端末の図鑑データは空です。Supabase の接続情報を入力すると、クラウドに保存済みのコレクション(記録・編集・画像)を復元できます。初めて使う場合は「新規ではじめる」を選んでください。</p>
            <label className="fld pad"><span>Supabase URL</span>
              <input value={settings.supaUrl || ""} placeholder="https://xxxx.supabase.co"
                onChange={(e) => patchSettings({ supaUrl: e.target.value })} />
            </label>
            <div style={{ height: 8 }} />
            <label className="fld pad"><span>anon キー</span>
              <input type="password" value={settings.supaKey || ""} placeholder="eyJhbGciOi..."
                onChange={(e) => patchSettings({ supaKey: e.target.value })} />
            </label>
            {setupMsg && <p className="ana-note">{setupMsg}</p>}
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={setupBusy} onClick={setupSync}>{setupBusy ? "同期中…" : "同期して復元"}</button>
              <button className="btn" disabled={setupBusy} onClick={() => setSetupOpen(false)}>新規ではじめる</button>
            </div>
          </div>
        </div>
      )}

      {/* ── プロフィール編集彈窗 ── */}
      {profileOpen && (
        <div className="modal-bg" onClick={() => setProfileOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-head">
              <span>プロフィール編集</span>
              <button className="modal-x static" onClick={() => setProfileOpen(false)}>✕</button>
            </div>
            <label className="fld pad"><span>Builder名</span>
              <input value={settings.builderName || ""} placeholder="あなたの名前 / ID"
                onChange={(e) => patchSettings({ builderName: e.target.value })} />
            </label>
            <div style={{ height: 8 }} />
            <label className="fld pad"><span>ガンプラ歴 開始日</span>
              <input type="date" value={settings.builderSince || ""}
                onChange={(e) => patchSettings({ builderSince: e.target.value })} />
            </label>
            <div className="form-actions" style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={() => setProfileOpen(false)}>保存して閉じる</button>
            </div>
            <p className="ai-note">変更は自動保存されます。</p>
          </div>
        </div>
      )}

      {/* ── 提示詞編輯彈窗 ── */}
      {promptEdit && (
        <div className="modal-bg" onClick={() => setPromptEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-head">
              <span>プロンプト編集:{AI_STYLES.find((s) => s.id === promptEdit).label}</span>
              <button className="modal-x static" onClick={() => setPromptEdit(null)}>✕</button>
            </div>
            <textarea className="prompt-ta" rows={9}
              value={(settings.aiPrompts && settings.aiPrompts[promptEdit]) != null
                ? settings.aiPrompts[promptEdit]
                : AI_STYLES.find((s) => s.id === promptEdit).prompt}
              onChange={(e) => patchSettings((s) => ({ aiPrompts: { ...(s.aiPrompts || {}), [promptEdit]: e.target.value } }))} />
            <div className="form-actions">
              <button className="btn primary" onClick={() => setPromptEdit(null)}>保存して閉じる</button>
              <button className="btn" onClick={() => patchSettings((s) => {
                const ap = { ...(s.aiPrompts || {}) };
                delete ap[promptEdit];
                return { aiPrompts: ap };
              })}>初期値に戻す</button>
            </div>
            <p className="ai-note">変更は自動保存されます。「初期値に戻す」で標準プロンプトに復帰。</p>
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
                <span>{t.tier === 2 ? "金章 — 全入手・全完成" : t.tier === 1 ? "銀章 — 全入手" : "称号の条件"}</span>
                <button className="modal-x static" onClick={() => setTitleDetail(null)}>✕</button>
              </div>
              <div className="tm-head">
                <span className={"av-medal big " + (t.tier === 2 ? "gold" : t.tier === 1 ? "silver" : "locked")}><Emblem universe={t.universe || "UC"} tier={t.tier} /></span>
                <div className="tm-headbody">
                  <div className="tm-name">{t.name}</div>
                  <div className="tm-sub">{t.sub}</div>
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
                        ? <button className="tm-pname own-link" onClick={() => jump(p.owned.id)}><span className="tm-cn">{p.owned.name}</span><b className="tm-tag own">所持</b></button>
                        : <div className="tm-cands">
                            {p.candidates.slice(0, 4).map((c) => (
                              <button key={c.id} className="tm-cand" onClick={() => jump(c.id)}>
                                <span className="tm-cn">{c.name}</span>
                                {c.owned ? <b className="tm-tag own">所持</b> : <b className="tm-tag">未所持</b>}
                              </button>
                            ))}
                            {p.candidates.length > 4 && <span className="tm-more2">ほか{p.candidates.length - 4}機が該当</span>}
                          </div>}
                    </div>
                  ))}
                  {ex.countPieces.map((cp, i) => (
                    <div key={"cp" + i} className={"tm-piece" + (cp.have.length >= cp.need ? " ok" : "")}>
                      <i className="tm-mark">{cp.have.length >= cp.need ? "✓" : "✗"}</i>
                      <span className="tm-pname">ミッションパック等 <b className="tm-cnt">{cp.have.length}/{cp.need}</b></span>
                    </div>
                  ))}
                </div>
              )}

              {ex && ex.kind === "count" && (() => {
                const remain = Math.max(0, ex.need - ex.have.length);
                const more = ex.candidates.filter((c) => !c.owned).slice(0, 8);
                return (
                  <div className="tm-cond">
                    <div className="tm-countbar"><b>{ex.have.length}</b> / {ex.need}{remain > 0 ? `\u3000あと${remain}` : "\u3000達成"}</div>
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
          ["zukan", zukanMode === "salon" ? "画廊" : "図鑑", zukanMode === "salon"
            ? (<svg className="tab-line-ico salon-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path className="pal-body" d="M12 4.6C16.8 4.6 20.4 7.5 20.4 11.3C20.4 13.7 18.7 14.5 17.3 14.5C16.4 14.5 15.6 14.3 15.6 13.5C15.6 12.8 16 12.5 16 11.9C16 11.2 15.4 10.7 14.5 10.7C12.9 10.7 12 12.4 12 14.1C12 16 12.9 17.2 12.2 18.1C11.8 18.5 11.3 18.7 10.7 18.7C6.7 18.7 4 15.1 4 11.3C4 7.5 7.4 4.6 12 4.6Z" strokeWidth="1.6" strokeLinejoin="round" /><circle className="pd1" cx="7.1" cy="10.4" r="1.25" /><circle className="pd2" cx="8.7" cy="7.6" r="1.25" /><circle className="pd3" cx="11.8" cy="6.7" r="1.25" /><circle className="pd4" cx="15" cy="7.6" r="1.25" /></svg>)
            : "▦"],
          ["collection", collMode === "plan" ? "予定" : "所持", collMode === "plan" ? "◆" : "✦"],
          ["analysis", anaMode === "analysis" ? "紀録" : "称号", anaMode === "analysis"
            ? (<svg className="tab-line-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 4 V19 H20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="6.5 14.5 10.5 10.5 13.5 12.5 18.5 6.5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>)
            : (<svg className="tab-line-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 4h10v7a5 5 0 0 1-10 0V4z" /><path d="M7 6H4v2a3 3 0 0 0 3 3" /><path d="M17 6h3v2a3 3 0 0 1-3 3" /><path d="M12 16v3" /><path d="M8.5 21h7l-1-2h-5z" /></svg>)],
          ["settings", "設定", "⚙"],
        ].map(([k, label, icon]) => {
          // 収蔵タブ:長押しで 収蔵↔予定 / 紀錄タブ:長押しで 敘勲↔紀錄(どちらも該当タブへ移動)
          const lp = k === "collection"
            ? makeLongPress(() => { hapticStrong(); setCollMode((m) => (m === "plan" ? "owned" : "plan")); changeTab("collection"); })
            : k === "analysis"
            ? makeLongPress(() => { hapticStrong(); setAnaMode((m) => (m === "analysis" ? "record" : "analysis")); changeTab("analysis"); })
            : k === "zukan"
            ? makeLongPress(() => { hapticStrong(); setZukanMode((m) => (m === "salon" ? "all" : "salon")); changeTab("zukan"); })
            : {};
          return (
            <button key={k}
              className={`tab ${tab === k ? "on" : ""} `
                + (k === "collection" && collMode === "plan" ? "plan-tab " : "")
                + (k === "analysis" && anaMode === "analysis" ? "ana-tab " : "")
                + (k === "zukan" && zukanMode === "salon" ? "salon-tab " : "")
                + (k === "settings" ? "set-tab " : "")}
              onClick={() => {
                if ((k === "collection" || k === "analysis" || k === "zukan") && consumeLP()) return;
                if (k === "collection" && tab === "collection") { hapticStrong(); setCollMode((m) => (m === "plan" ? "owned" : "plan")); return; }
                if (k === "analysis" && tab === "analysis") { hapticStrong(); setAnaMode((m) => (m === "analysis" ? "record" : "analysis")); return; }
                if (k === "zukan" && tab === "zukan") { hapticStrong(); setZukanMode((m) => (m === "salon" ? "all" : "salon")); return; }
                changeTab(k); setConfirmReset(false);
              }}
              {...lp}>
              <span className="tab-icon">{icon}</span>
              <span className="tab-label">{label}</span>
            </button>
          );
        })}
        {(() => {
          const order = ["zukan", "collection", "analysis", "settings"];
          const idx = Math.max(0, order.indexOf(tab));
          const col = tab === "analysis" && anaMode === "analysis" ? "var(--gold)"
            : tab === "zukan" && zukanMode === "salon" ? "var(--gold)"
            : tab === "collection" && collMode === "plan" ? "var(--kin)"
            : tab === "settings" ? "var(--ink-strong)"
            : "var(--gold)";
          return <i className="tab-slider" style={{ transform: `translateX(${idx * 100}%)` }}><b style={{ background: col }} /></i>;
        })()}
      </nav>
    </div>
  );
}

/* ───────────── 樣式 ───────────── */
const CSS = `
/* Web フォントは JS で非ブロッキングに <link> 注入(下部の __mgFonts 参照)。
   オフライン(offline-first)や CDN 失敗時は下記フォールバック書体に委ねる。 */
:root{
  --bg:#0d1018; --bg2:#12161f; --panel:#171c28; --panel2:#1c2230;
  --line:#2a3042; --line-soft:#222837;
  --ink:#e7e2d6; --ink-strong:#f2ede1; --ink-mid:#9aa0ae; --ink-dim:#565d6e;
  --shu:#e8553d; --shu-deep:#b13a28; --gold:#d9b36a; --teal:#6fd3c7;
  --kin:#d9b36a; --kin-deep:#b8924a; --blue:#6f9fe0;
  --crt-line:#5f9c92;
  --serif:'Shippori Mincho','Hiragino Mincho ProN','Yu Mincho','Noto Serif JP','Noto Serif CJK JP',serif; --sans:'Zen Kaku Gothic New','Hiragino Sans','Hiragino Kaku Gothic ProN',-apple-system,'Yu Gothic','Noto Sans JP','Noto Sans CJK JP',sans-serif;
  --kaiti:"LXGW WenKai TC","LXGW WenKai","Kaiti TC","Kaiti SC","BiauKai","STKaiti","KaiTi","DFKai-SB",serif;
}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
/* ボタン・カードの文字を長押し選択不可に(手触り改善) */
button,.tab,.card,.row,.gf-btn,.adv-seg-btn,.tab-label,.tab-icon{
  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
/* 全域:押下フィードバック(実体ボタンの沈み込み) */
@media (hover:none){
  button:active,.card:active,.row:active{transition:transform .09s ease, filter .09s ease}
}
.card,.row,.tab,.gf-btn,.btn,.add-btn,.more-btn,.own-btn,.own-btn.half,.search-x,.adv-seg-btn,.view-toggle button,.sort-bar button,.edit-link{
  transition:transform .16s cubic-bezier(.34,1.56,.64,1), filter .12s ease, box-shadow .16s ease}
.card:active,.row:active{transform:scale(.97);filter:brightness(.94)}
.tab:active{transform:scale(.95);background:radial-gradient(112% 80% at 50% 100%,rgba(227,191,125,.20),rgba(227,191,125,.06) 56%,transparent 78%);border-radius:12px}
.app.light .tab:active{background:radial-gradient(112% 80% at 50% 100%,rgba(156,120,56,.16),rgba(156,120,56,.04) 56%,transparent 78%)}
.btn:active,.add-btn:active,.more-btn:active,.own-btn:active,.gf-btn:active,.adv-seg-btn:active,.view-toggle button:active,.sort-bar button:active,.search-x:active,.edit-link:active{
  transform:scale(.95);filter:brightness(.92)}
.app{min-height:0;background:
  radial-gradient(1100px 500px at 80% -10%, rgba(232,85,61,.07), transparent 60%),
  radial-gradient(800px 400px at -10% 30%, rgba(111,211,199,.05), transparent 60%),
  var(--bg);
  color:var(--ink);font-family:var(--sans);padding-bottom:calc(84px + env(safe-area-inset-bottom))}
button{font-family:inherit;color:inherit;background:none;border:none;cursor:pointer}
input,textarea{font-family:var(--sans)}

.head{padding:18px 18px 12px;position:relative}
/* スマホ横向き(高さが低い)では標題框を自動的に隠して縦スペースを確保。iPad は高さが大きいため影響なし */
@media (orientation:landscape) and (max-height:500px){.head{display:none}}
.head-line{position:absolute;top:0;left:18px;right:18px;height:2px;
  background:linear-gradient(90deg,var(--shu) 0 56px,var(--line) 56px)}
.head-row{display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
.head-eyebrow{font-size:9px;letter-spacing:.28em;color:var(--ink-mid);margin-bottom:4px}
.head-title{font-family:var(--serif);font-weight:800;font-size:25px;letter-spacing:.04em;color:var(--ink-strong)}
.head-kana{font-size:14px;color:var(--gold);font-weight:700;margin-left:6px;letter-spacing:.18em}
.head-stats{display:flex;align-items:center;gap:10px;font-family:var(--serif)}
.head-stats div{display:flex;flex-direction:column;align-items:center;line-height:1.1}
.head-stats b{font-size:18px;color:var(--ink-strong)}
.head-stats span{font-size:9.5px;color:var(--ink-mid);letter-spacing:.2em}
.stat-div{width:1px;height:24px;background:var(--line)}
.head-progress{margin-top:12px;height:3px;background:var(--line-soft);border-radius:2px;overflow:hidden}
.head-progress i{display:block;height:100%;background:linear-gradient(90deg,#9c7838,var(--gold));transition:width .5s}

.body{padding:8px 14px 16px;max-width:920px;margin:0 auto}
.section-note{font-size:11px;color:var(--ink-mid);letter-spacing:.1em;padding:6px 4px 10px}
.cond-clear{margin-left:0;font-size:11.5px;color:var(--shu);border-bottom:1px dashed var(--shu);padding-bottom:1px}
.footnote{font-size:10.5px;color:var(--ink-dim);line-height:1.7;padding:18px 4px 6px}

.toolbar{display:flex;gap:8px;padding:4px 0 6px}
.search{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:8px;
  color:var(--ink);padding:10px 12px;font-size:13px}
.search::placeholder{color:var(--ink-dim)}
.search:focus,.adv-sel:focus,.adv-year-sel:focus,.adv-series-btn:focus,.sp-search:focus{
  outline:none;border-color:var(--gold);box-shadow:0 0 0 3px rgba(217,179,106,.14)}
.search:focus-visible,.adv-sel:focus-visible{outline:none}
.add-btn{flex:none;background:linear-gradient(160deg,rgba(217,179,106,.16),var(--panel));
  border:1px solid var(--gold);color:var(--gold);border-radius:8px;padding:0 14px;
  font-weight:700;font-size:12.5px;letter-spacing:.08em}

.year-sec{margin-bottom:18px}
.year-head{display:flex;align-items:center;gap:10px;padding:6px 2px 10px}
.year-num{font-family:var(--serif);font-size:17px;font-weight:700;color:var(--gold);letter-spacing:.08em}
.year-rule{flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)}
.year-count{font-size:10px;color:var(--ink-dim);letter-spacing:.15em}

.grid-wrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.grid-wrap.compact{grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px}
.card{position:relative;background:linear-gradient(160deg,var(--panel2),var(--panel));
  border:1px solid var(--line);border-radius:10px;padding:12px 10px 10px;text-align:left;
  transition:transform .12s,border-color .12s;overflow:hidden;
  clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,0 100%)}
.card:active{transform:scale(.97)}
.card:hover{border-color:var(--shu-deep)}
.card-corner{position:absolute;top:0;right:0;width:12px;height:12px;
  background:linear-gradient(135deg,transparent 49%,var(--shu) 50%)}
.card.dim{opacity:.45}
.card-sketch{display:flex;justify-content:center;position:relative;padding:2px 0 6px;min-height:70px}
.card-seals{position:absolute;right:0;top:0;display:flex;flex-direction:column;gap:4px}
.card-name{font-size:12.5px;font-weight:700;line-height:1.45;min-height:2.6em;color:var(--ink-strong)}
.card.compact .card-name{font-size:11px;min-height:2.4em}
.card-meta{display:flex;gap:6px;align-items:center;margin-top:5px;flex-wrap:wrap}
.card-series{font-size:9.5px;color:var(--ink-dim);margin-top:4px;letter-spacing:.05em}

.kit-img{width:96px;height:96px;object-fit:cover;border-radius:7px;border:1px solid var(--line)}
.kit-img.sm{width:44px;height:44px;border-radius:6px}
.kit-img.big{width:96px;height:96px}
.card.compact .kit-img{width:64px;height:64px}

.mono{font-size:9px;color:var(--ink-mid);letter-spacing:.08em;border:1px solid var(--line);
  padding:1px 5px;border-radius:3px;white-space:nowrap}
.year-chip{font-family:var(--serif);font-size:10.5px;color:var(--gold);letter-spacing:.06em}
.price{font-size:10px;color:var(--ink-mid);letter-spacing:.04em}
.series{font-size:9.5px;color:var(--ink-dim)}
.line-chip{font-size:8.5px;font-weight:700;letter-spacing:.1em;border-radius:3px;padding:1.5px 5px;vertical-align:1px}
.line-chip.ka{color:var(--gold);border:1px solid var(--gold)}
.line-chip.ex{color:var(--teal);border:1px solid var(--teal)}
.line-chip.cu{color:var(--shu);border:1px solid var(--shu)}

.list-wrap{display:flex;flex-direction:column;gap:7px}
.row{display:flex;align-items:center;gap:12px;background:var(--panel);
  border:1px solid var(--line-soft);border-left:3px solid var(--line);
  border-radius:8px;padding:8px 12px;text-align:left;transition:border-color .12s}
.row:hover{border-left-color:var(--shu)}
.row.dim{opacity:.45}
.row-sketch{flex:none;width:44px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;position:relative}
.row-sketch svg{width:100%;height:100%;display:block}
/* 6. 未入手のベクター(リスト)を静的CRT画面風に:走査線+ノイズ+ビネット(アニメ無し) */
.row-sketch.crt-mini{border-radius:6px;overflow:hidden;
  background:radial-gradient(ellipse at 50% 45%,rgba(111,211,199,.08),transparent 70%),#0b1014;
  box-shadow:inset 0 0 14px 3px rgba(0,0,0,.55)}
.row-sketch.crt-mini svg{position:relative;z-index:1;filter:drop-shadow(0 0 1.4px rgba(111,211,199,.3))}
.row-sketch.crt-mini svg [stroke]{stroke:var(--crt-line)}
.row-sketch.crt-mini svg [fill]:not([fill="none"]){fill:var(--crt-line)}
.row-sketch.crt-mini::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;
  background:repeating-linear-gradient(0deg,rgba(0,0,0,.30) 0 1px,transparent 1px 3px)}
.row-sketch.crt-mini::after{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;opacity:.13;background-size:70px 70px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70'%3E%3Cfilter id='r'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23r)'/%3E%3C/svg%3E")}
.row-main{flex:1;min-width:0}
.row-name{font-size:13px;font-weight:700;color:var(--ink-strong);word-break:normal;line-break:strict;overflow-wrap:break-word}
.row-sub{display:flex;gap:8px;align-items:center;margin-top:3px;flex-wrap:wrap}
.row-seals{display:flex;gap:5px;flex:none}
.date-tag{font-size:10px;color:var(--ink-mid);letter-spacing:.05em}
.date-tag.teal{color:var(--teal)}

.seal{font-family:var(--serif);font-size:10px;font-weight:700;line-height:1;
  padding:4px 4px;border:1.5px solid var(--shu);color:var(--shu);border-radius:3px;
  writing-mode:vertical-rl;letter-spacing:.15em;background:rgba(232,85,61,.08);
  transform:rotate(4deg)}
.seal-teal{border-color:var(--teal);color:var(--teal);background:rgba(111,211,199,.07)}
.seal-gold{border-color:var(--gold);color:var(--gold);background:rgba(217,179,106,.07)}

.panel-wrap{max-width:480px;margin:0 auto;padding-top:6px}
.panel-title{font-family:var(--serif);font-size:15px;font-weight:700;color:var(--ink-strong);
  margin:18px 2px 10px;display:flex;align-items:baseline;gap:8px}
.panel-title span{font-size:9px;letter-spacing:.3em;color:var(--ink-dim);font-family:var(--sans)}
.opt-group{display:flex;flex-direction:column;gap:7px}
.opt-group.horizontal{flex-direction:row}
.opt{flex:1;display:flex;justify-content:space-between;align-items:center;
  background:var(--panel);border:1px solid var(--line-soft);border-radius:8px;
  padding:12px 14px;font-size:13px;font-weight:500;transition:border-color .12s}
.opt.on{border-color:var(--gold);background:linear-gradient(160deg,rgba(217,179,106,.12),var(--panel));color:var(--gold)}
.opt.on i{color:var(--gold);font-size:8px}
.opt.danger{color:var(--shu);border-color:rgba(232,85,61,.4)}
.opt.danger.solid{background:var(--shu-deep);color:#fff;justify-content:center}
.confirm-box{background:var(--panel);border:1px solid var(--shu-deep);border-radius:8px;
  padding:14px;font-size:12.5px;display:flex;flex-direction:column;gap:10px;line-height:1.6}
.confirm-box>div{display:flex;gap:8px}
.switch{width:38px;height:21px;border-radius:11px;background:var(--line);position:relative;transition:background .15s;flex:none}
.switch.on{background:var(--gold)}
.switch b{position:absolute;top:2.5px;left:3px;width:16px;height:16px;border-radius:50%;
  background:var(--ink-strong);transition:transform .15s}
.switch.on b{transform:translateX(16px)}

.empty{text-align:center;padding:60px 20px;color:var(--ink-mid)}
.empty p{margin-top:14px;font-family:var(--serif);font-size:15px}
.empty-sub{font-family:var(--sans)!important;font-size:11.5px!important;color:var(--ink-dim);margin-top:6px!important}

.modal-bg{position:fixed;inset:0;background:rgba(5,7,12,.72);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);
  display:flex;align-items:flex-end;justify-content:center;z-index:50;animation:bgfade .2s ease-out}
@keyframes bgfade{from{opacity:0}to{opacity:1}}
.modal{width:100%;max-width:520px;background:var(--bg2);border:1px solid var(--line);
  border-radius:16px;padding:20px 18px 28px;margin-bottom:calc(14px + env(safe-area-inset-bottom));
  animation:up .26s cubic-bezier(.2,.9,.3,1.1);max-height:88vh;overflow-y:auto}
@keyframes up{from{transform:translateY(34px) scale(.97);opacity:0}to{transform:none;opacity:1}}
/* ── 交換カード式詳細レイアウト ── */
.tc-head{position:relative;margin-bottom:14px;padding:12px 14px 11px;border-radius:10px;
  background:radial-gradient(125% 130% at 50% 30%,var(--panel) 0%,var(--panel) 42%,rgba(38,38,36,.35) 78%,transparent 100%)}
.tc-head-top{display:flex;align-items:flex-start;gap:10px}
.tc-head .tc-name{font-family:var(--serif);font-weight:800;font-size:24px;line-height:1.22;
  color:var(--ink-strong);flex:1;min-width:0;letter-spacing:.01em;
  word-break:normal;line-break:strict;overflow-wrap:break-word;
  text-shadow:0 1px 2px rgba(0,0,0,.3)}
.kn{display:inline;word-break:normal;line-break:strict;overflow-wrap:break-word}
.tc-head-rule{display:block;height:1px;margin:9px 0 7px;
  background:linear-gradient(90deg,rgba(184,146,74,.45),rgba(184,146,74,.1) 60%,transparent)}
.tc-head-sub{display:flex;align-items:center;gap:6px;min-width:0}
.tc-head-sub .grade-chip{font-size:13.5px;font-weight:900;letter-spacing:.04em;
  margin-right:0;vertical-align:0;padding:1px 7px;border-width:1.8px;border-radius:4px;line-height:1.4;flex:none}
.tc-head .tc-no{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:15px;font-weight:800;color:var(--gold);
  letter-spacing:.05em;flex:none;line-height:1;margin-left:1px}
.tc-head-series{font-size:11.5px;color:var(--ink-mid);letter-spacing:.04em;margin-left:4px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.tc-art{position:relative;overflow:hidden;height:230px;border:1px solid var(--line);border-radius:8px;
  margin:0 4px 12px;padding:0;display:flex;align-items:center;justify-content:center;
  background:
    radial-gradient(ellipse at 50% 42%,rgba(255,255,255,.045),transparent 60%),
    linear-gradient(180deg,rgba(255,255,255,.02),rgba(0,0,0,.10)),
    var(--bg2)}
.tc-art.square{height:auto;aspect-ratio:4/3}
.tc-art.zoomable{cursor:zoom-in}
.tc-art.zoomable:active{filter:brightness(.93);transform:scale(.99)}
/* 8. tc-art 内のピンチズーム容器(画像にのみ適用)。
   ※ .tc-art>* {position:relative;z-index:1} に負けないよう子結合子で特異度を上げる */
.tc-art>.tc-pz{position:absolute;inset:0;z-index:1;overflow:hidden}
.tc-pz img{width:100%;height:100%;object-fit:cover}
/* 7. 観景窗(ビューファインダー)風オーバーレイ:四隅フレーム+中央フォーカス円+ビネット */
.tc-art>.vf-overlay{position:absolute;inset:0;z-index:4;pointer-events:none;
  background:radial-gradient(ellipse 80% 80% at 50% 50%,transparent 55%,rgba(0,0,0,.44) 100%)}
.vf-corner{position:absolute;width:19px;height:19px;border:1.5px solid rgba(111,211,199,.5);
  filter:drop-shadow(0 0 2.5px rgba(111,211,199,.5)) drop-shadow(0 0 1px rgba(0,0,0,.45))}
.vf-corner.tl{top:11px;left:11px;border-right:none;border-bottom:none}
.vf-corner.tr{top:11px;right:11px;border-left:none;border-bottom:none}
.vf-corner.bl{bottom:11px;left:11px;border-right:none;border-top:none}
.vf-corner.br{bottom:11px;right:11px;border-left:none;border-top:none}
.vf-focus{position:absolute;top:50%;left:50%;width:48px;height:48px;transform:translate(-50%,-50%);
  border:1.5px solid rgba(111,211,199,.42);border-radius:50%;
  filter:drop-shadow(0 0 2.5px rgba(111,211,199,.42)) drop-shadow(0 0 1px rgba(0,0,0,.45))}
.vf-focus::before,.vf-focus::after{content:"";position:absolute;background:rgba(111,211,199,.5)}
.vf-focus::before{left:50%;top:-6px;bottom:-6px;width:1px;transform:translateX(-50%)}
.vf-focus::after{top:50%;left:-6px;right:-6px;height:1px;transform:translateY(-50%)}
/* 8. ビューア(全画面)のピンチズーム容器。移動なしのタップで閉じ、ピンチ/パンは維持 */
.viewer-pz{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  padding:20px;box-sizing:border-box;cursor:zoom-out}
/* 画像鑑賞スワイプ・カルーセル */
.sv-wrap{position:absolute;inset:0;overflow:hidden;cursor:zoom-out}
.sv-track{display:flex;width:100%;height:100%;will-change:transform}
.sv-slide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;will-change:transform}
.sv-stage{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%}
/* 台詞(浮動・画像の真上に追従。タップで編集。画像とは別ゾーンなので重ならない) */
.sv-serif{flex:none;width:100%;max-width:560px;display:flex;align-items:flex-end;justify-content:flex-start;min-height:30px;padding:2px 16px 8px;cursor:text}
.vs-text{font-family:var(--kaiti);font-weight:600;font-size:25px;line-height:1.32;color:var(--ink-strong);
  max-width:100%;white-space:pre-wrap;text-align:left;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
  text-shadow:0 2px 12px rgba(0,0,0,.85),0 0 3px rgba(0,0,0,.7)}
.vs-hint{font-family:var(--sans);font-size:12px;letter-spacing:.12em;color:rgba(255,255,255,.30)}
/* 画像エリア(台詞と銘牌のあいだを埋める。両者と重ならない) */
.sv-imgwrap{flex:0 1 auto;min-height:0;max-height:calc(100% - 150px);width:100%;display:flex;align-items:center;justify-content:center;position:relative}
.sv-wm{position:absolute;right:11px;bottom:9px;z-index:2;font-family:var(--mono);font-size:10px;letter-spacing:.04em;
  color:rgba(255,255,255,.3);text-shadow:0 1px 2px rgba(0,0,0,.55);pointer-events:none;
  max-width:72%;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sv-img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px;transform-origin:center center;will-change:transform;user-select:none;-webkit-user-drag:none;-webkit-touch-callout:default}
/* 銘牌(様式4:枠なし・最小)— 画像直下に追従。作品名(明朝・小)/機体名(楷体・台詞欄基準) */
.sv-plate{flex:none;margin-top:12px;text-align:center;max-width:90%;padding:0 8px;pointer-events:none}
.svp-work{font-family:var(--serif);font-size:10.5px;font-weight:600;letter-spacing:.30em;color:var(--ink-dim);
  margin-bottom:9px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.svp-div{width:30px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);margin:0 auto 10px}
.svp-kit{font-family:var(--kaiti);
  font-size:25px;font-weight:600;color:var(--ink-strong);line-height:1.22;letter-spacing:.03em;text-shadow:0 2px 14px rgba(0,0,0,.6)}
.dc-classified.sv-classified{width:min(80vw,560px);height:100%;max-width:calc(100% - 4px);max-height:100%;border-radius:6px;
  box-shadow:inset 0 0 34px 10px rgba(0,0,0,.6),0 8px 30px rgba(0,0,0,.5)}
.serif-edit-bg{position:fixed;inset:0;z-index:130;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;padding-top:16vh}
.serif-edit{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;width:min(440px,90vw);box-shadow:0 18px 54px rgba(0,0,0,.6)}
.se-input{width:100%;box-sizing:border-box;font-family:var(--kaiti);font-size:18px;line-height:1.5;color:var(--ink-strong);
  background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:11px 13px;outline:none;min-height:96px;resize:vertical;display:block}
.se-input:focus{border-color:var(--gold)}
.se-btns{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
/* 方向C:極淡灰階噪點質感(標題列與圖片框統一),內容置於其上 */
.tc-art::after{content:"";position:absolute;inset:0;border-radius:inherit;
  pointer-events:none;z-index:0;opacity:.05;background-size:120px 120px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.tc-head>*,.tc-art>*{position:relative;z-index:1}
.zoom-hint{position:absolute;right:8px;bottom:7px;width:26px;height:26px;display:flex;z-index:5;
  align-items:center;justify-content:center;border-radius:6px;font-size:14px;
  background:rgba(13,16,24,.78);border:1px solid rgba(184,146,74,.4);color:var(--gold)}
.kit-img.tc{width:100%;height:100%;object-fit:cover;border:none;background:transparent;border-radius:0;box-shadow:none}
/* 未識別プレート(無圖時の CRT 画面) */
.crt-ph{position:relative;z-index:1;width:100%;height:100%;min-height:230px;display:flex;align-items:center;justify-content:center;
  color:var(--teal);overflow:hidden;border-radius:9px;
  background:radial-gradient(ellipse at 50% 42%,rgba(111,211,199,.12),transparent 66%),#0a1014;
  box-shadow:inset 0 0 50px 12px rgba(0,0,0,.62)}
/* スキャンライン+ビーム:アップロード画像/CRT 両方の上に重ねる。ビームはトグルのみで制御(OSの省電/reduce-motionより優先) */
.tc-scan{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;border-radius:inherit;
  background:repeating-linear-gradient(0deg,rgba(111,211,199,.05) 0 1px,transparent 1px 3px)}
.tc-art>.tc-scan{z-index:2}
.tc-scan .crt-beam{position:absolute;left:0;right:0;top:-22px;height:22px;
  background:linear-gradient(180deg,transparent,rgba(111,211,199,.3),transparent);
  animation-name:crtbeam;animation-duration:8.6s;animation-timing-function:linear;animation-iteration-count:infinite}
.tc-scan .crt-beam.beam2{height:14px;background:linear-gradient(180deg,transparent,rgba(111,211,199,.18),transparent);
  animation-duration:7s}
@keyframes crtbeam{0%{top:-22px}100%{top:100%}}
.crt-art{position:relative;z-index:1;width:84%;height:80%;filter:drop-shadow(0 0 5px rgba(111,211,199,.45))}
.crt-clabel{letter-spacing:.4px}
/* CRT 線稿に軽いノイズ質感 */
.crt-ph::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;opacity:.2;background-size:90px 90px;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23m)'/%3E%3C/svg%3E")}
.crt-data{position:absolute;top:9px;left:12px;z-index:4;font-family:ui-monospace,"SF Mono",Menlo,monospace;
  font-size:8.5px;line-height:1.7;letter-spacing:.1em;color:rgba(111,211,199,.62)}
.crt-label{position:absolute;left:0;right:0;top:71%;z-index:4;text-align:center;
  font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:23px;font-weight:700;letter-spacing:.1em;
  color:var(--teal);text-shadow:0 0 10px rgba(111,211,199,.6)}
.tc-info{margin:0 4px 12px;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:rgba(255,255,255,.015)}
.tc-info.tappable:active{background:rgba(255,255,255,.04)}
.tc-row{display:flex;align-items:baseline;gap:0;padding:8px 12px;font-size:12px}
.tc-row+.tc-row{border-top:1px dashed rgba(255,255,255,.07)}
.tc-row>span{flex:none;width:48px;color:var(--ink-dim);font-size:12px;letter-spacing:.04em}
.tc-row>b{font-weight:600;color:var(--ink);min-width:0}
.tc-row>b.price{color:var(--gold)}
/* 発売年月／定価 同列左右各半;欄名靠左、數字接在欄名右(發賣日左緣＝原作/Tag 內容左緣) */
.tc-row-split{gap:0;padding:0}
.tc-half{flex:1;min-width:0;display:flex;align-items:baseline;gap:0;padding:8px 12px}
.tc-half+.tc-half{border-left:1px dashed rgba(255,255,255,.07)}
.tc-half>span{flex:none;width:48px;color:var(--ink-dim);font-size:12px;letter-spacing:.04em}
.tc-half>.tc-num{flex:1;text-align:left}
.tc-num{font-weight:700;font-size:14.5px;color:var(--ink);letter-spacing:.01em}
.tc-num.price{color:var(--gold)}
/* Tag 列:Grade 排頭,其餘標籤同列,統一 GradeChip 規格、各自保留代表色 */
.tc-row-tag{align-items:center}
.tc-tags{display:flex;align-items:center;flex-wrap:wrap;gap:6px;min-width:0}
.tc-tags .grade-chip,.tc-tags .line-chip{display:inline-flex;align-items:center;height:19px;box-sizing:border-box;
  font-size:10px;font-weight:800;letter-spacing:.06em;border-width:1.5px;border-radius:3px;padding:0 6px;
  line-height:1;margin:0;vertical-align:0}
.modal-top{display:flex;gap:14px;align-items:flex-start;position:relative;margin-bottom:14px}
.modal-img{flex:none}
.modal-info{flex:1;min-width:0;padding-right:20px}
.modal-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}
.modal-name{font-family:var(--serif);font-size:17px;font-weight:700;color:var(--ink-strong);line-height:1.4}
.modal-sub{display:flex;gap:10px;align-items:center;margin-top:6px}
.modal-series{font-size:10.5px;color:var(--ink-dim);margin-top:5px}
.modal-x{position:absolute;top:-4px;right:-4px;color:var(--ink-dim);font-size:14px;padding:6px}
.modal-x.static{position:static}
.modal-form-head{display:flex;justify-content:space-between;align-items:center;
  font-family:var(--serif);font-size:15px;font-weight:700;color:var(--ink-strong);margin-bottom:14px}
/* メモ:機体情報欄(tc-info)の最下段に1行として統合。空なら値は空欄のまま */
.tc-row-memo{align-items:flex-start}
.tc-row-memo>span{padding-top:1px}
.tc-memo{font-weight:500;color:var(--ink-mid);font-size:11.5px;line-height:1.65;
  white-space:pre-wrap;word-break:normal;line-break:strict;overflow-wrap:break-word;min-height:1.65em}
.own-btn{width:100%;padding:13px;border-radius:9px;font-size:14px;font-weight:700;
  border:1.5px dashed var(--line);color:var(--ink-mid);transition:transform .16s cubic-bezier(.34,1.56,.64,1),filter .12s;letter-spacing:.08em}
.own-btn.owned{border:1.5px solid var(--shu);color:var(--shu);
  background:rgba(232,85,61,.1);border-style:solid}
.own-btn.planned{border:1.5px solid var(--kin);color:var(--kin);
  background:rgba(217,179,106,.1);border-style:solid}
.own-btn-row{display:flex;gap:9px}
.own-btn.half{flex:1;padding:13px 8px;font-size:13px}
.own-btn.half.plan{border:1.5px dashed var(--line);color:var(--ink-mid)}
.own-btn.half.plan:active{background:rgba(255,255,255,.04)}
.form-dates{display:flex;gap:10px}
.form-dates .fld{flex:1}
.form-dates .date-wrap{position:relative;display:flex}
.form-dates input{width:100%;background:var(--panel);border:1px solid var(--line);border-radius:7px;
  color:var(--ink);padding:9px 10px;font-size:13px;color-scheme:dark}

/* ── 進階檢索面板 ── */
.adv-panel{margin:4px 0 2px;padding:11px 12px;border:1px solid var(--line);border-radius:10px;
  background:var(--panel);display:flex;flex-direction:column;gap:9px;
  animation:advIn .22s ease-out}
@keyframes advIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.adv-row{display:flex;align-items:center;gap:10px}
.adv-lbl{flex:none;width:34px;font-size:10.5px;letter-spacing:.12em;color:var(--ink-dim)}
.adv-sel{flex:1;min-width:0;background:var(--bg2);border:1px solid var(--line);border-radius:7px;
  color:var(--ink);padding:8px 9px;font-size:12.5px;color-scheme:dark}
.adv-seg{flex:1;display:flex;gap:5px}
.adv-seg-btn{flex:1;padding:7px 4px;font-size:11.5px;font-weight:700;border:1px solid var(--line);
  border-radius:7px;color:var(--ink-mid);background:var(--bg2);white-space:nowrap}
.adv-seg-btn.on{border-color:rgba(217,179,106,.5);color:var(--gold);background:rgba(217,179,106,.1);box-shadow:inset 0 -2px 0 -1px var(--gold)}
.adv-foot{display:flex;align-items:center;justify-content:space-between;margin-top:1px}
.adv-years{flex:1;min-width:0;display:flex;align-items:center;gap:8px}
.adv-year{flex:1;min-width:0;background:var(--bg2);border:1px solid var(--line);border-radius:7px;
  color:var(--ink);padding:8px 9px;font-size:12.5px;text-align:center;color-scheme:dark;
  -moz-appearance:textfield}
.adv-year::-webkit-outer-spin-button,.adv-year::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.adv-tilde{flex:none;color:var(--ink-dim);font-size:12px}

.confirm-bg{align-items:center}
.confirm-card{width:calc(100% - 48px);max-width:340px;margin:auto;background:var(--bg2);
  border:1px solid var(--line);border-radius:16px;padding:24px 22px;text-align:center;
  animation:up .26s cubic-bezier(.2,.9,.3,1.1);align-self:center}
.confirm-icon{font-size:30px;color:var(--kin);margin-bottom:10px}
.confirm-title{font-family:var(--serif);font-size:15.5px;font-weight:700;color:var(--ink-strong);margin-bottom:8px}
.confirm-name{font-size:12.5px;color:var(--ink-mid);margin-bottom:20px;line-height:1.6}
.confirm-btns{display:flex;gap:10px}
.confirm-btns .btn{flex:1}
.qm-card{width:calc(100% - 56px);max-width:320px;margin:auto;background:var(--bg2);border:1px solid var(--line);border-radius:16px;padding:20px 18px;text-align:center;animation:up .24s cubic-bezier(.2,.9,.3,1.1);align-self:center}
.qm-name{font-size:13px;color:var(--ink-mid);margin-bottom:16px;line-height:1.55}
.qm-btns{display:flex;gap:10px}
.qm-btn{flex:1;appearance:none;-webkit-appearance:none;border:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;height:64px;font-family:var(--sans);font-size:13px;font-weight:700;letter-spacing:.04em;color:#fff;border-radius:10px;cursor:pointer}
.qm-ico{font-size:18px;line-height:1}
.qm-btn.own{background:linear-gradient(150deg,#2f7d63,#235a47)}
.qm-btn.plan{background:linear-gradient(150deg,#b58a32,#8a661f)}
.qm-btn.on{filter:brightness(1.16) saturate(1.1)}
.qm-btn:active{transform:scale(.96)}
.adv-hint{font-size:10.5px;color:var(--ink-dim);letter-spacing:.05em}
.adv-clear{font-size:11.5px;color:var(--shu);border-bottom:1px dashed var(--shu);padding-bottom:1px}
.adv-close{font-size:11.5px;color:var(--ink-mid);padding:4px 10px;border:1px solid var(--line);border-radius:6px}

/* ── 予定マーク(カード・リスト) ── */
/* 4. 予定の金色フチ(全周)は廃止 → 状態は左フチ色のみで表現 */
/* 5. 入手=朱橙の左フチ(タップ時と同じ効果)/予定=金の左フチ */
.row.owned{border-left-color:var(--shu)}
.row.planned{border-left-color:var(--kin)}
.card.owned{border-left:3px solid var(--shu)}
.card.planned{border-left:3px solid var(--kin)}
/* 3. 予定ピン:リスト/カード共通、画像の左上角。リスト予定タグ風(アウトライン金) */
.plan-pin{position:absolute;top:3px;left:3px;z-index:5;font-size:8.5px;font-weight:700;letter-spacing:.06em;
  padding:1px 5px;border-radius:4px;line-height:1.35;
  background:rgba(217,179,106,.18);color:var(--kin);border:1px solid rgba(217,179,106,.55);
  backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
.plan-pin.card-pin{top:5px;left:5px;font-size:9px;padding:2px 6px}

/* ── 予定タブ(金色) ── */
.tab.plan-tab .tab-icon,.tab.plan-tab .tab-label{color:var(--kin)}
.tab.plan-tab.on .tab-icon,.tab.plan-tab.on .tab-label{color:var(--kin);filter:brightness(1.1)}
.tab.plan-tab .tab-bar{background:var(--kin)}
.tab.ana-tab .tab-icon,.tab.ana-tab .tab-label{color:var(--gold)}
.tab.ana-tab.on .tab-icon,.tab.ana-tab.on .tab-label{color:var(--gold);filter:brightness(1.12)}
.tab.ana-tab .tab-bar{background:var(--gold)}
.tab-line-ico{width:1em;height:1em;display:block}
/* 設定タブ:アクセント色を使わず、文字も図標と同じ灰白系で統一 */
.tab.set-tab .tab-icon,.tab.set-tab .tab-label{color:var(--ink)}
.tab.set-tab.on .tab-icon,.tab.set-tab.on .tab-label{color:var(--ink-strong)}
.tab.set-tab.on{color:var(--ink-strong)}
/* 沙龍タブ:金黃色系で統一(本体 currentColor=金 / 絵具ドットは金の濃淡) */
.tab.salon-tab .tab-icon,.tab.salon-tab .tab-label{color:var(--gold)}
.tab.salon-tab.on .tab-icon,.tab.salon-tab.on .tab-label{color:var(--gold);filter:brightness(1.12)}
.salon-ico .pal-body{stroke-width:1.6}
.salon-ico circle{stroke:none}
.salon-ico .pd1{fill:#f0dcab}
.salon-ico .pd2{fill:var(--gold)}
.salon-ico .pd3{fill:var(--kin-deep)}
.salon-ico .pd4{fill:#e3bf7d}
.tab.set-tab .tab-bar{background:var(--ink-strong)}
.head-stats b.kin{color:var(--kin)}

/* ── 画像鑑賞モード ── */
.viewer-bg{position:fixed;inset:0;background:rgba(2,3,6,.94);z-index:120;
  display:flex;align-items:center;justify-content:center;padding:20px;animation:bgfade .2s ease-out;cursor:zoom-out}
.viewer-img{max-width:100%;max-height:100%;object-fit:contain;border-radius:6px;
  box-shadow:0 0 40px rgba(0,0,0,.6);animation:up .26s cubic-bezier(.2,.9,.3,1.1)}
.viewer-x{position:fixed;top:calc(14px + env(safe-area-inset-top));right:16px;
  width:38px;height:38px;border-radius:50%;background:rgba(20,24,32,.85);
  border:1px solid var(--line);color:var(--ink);font-size:16px}
.viewer-nav{position:fixed;top:50%;transform:translateY(-50%);z-index:122;width:44px;height:64px;
  display:flex;align-items:center;justify-content:center;font-size:30px;line-height:1;
  background:rgba(20,24,32,.5);border:1px solid var(--line);color:var(--ink);border-radius:10px}
.viewer-nav.prev{left:10px}
.viewer-nav.next{right:10px}
.viewer-dots{position:fixed;left:0;right:0;bottom:calc(86px + env(safe-area-inset-bottom));z-index:122;
  display:flex;gap:7px;justify-content:center}
.viewer-dots .vd{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.32);transition:all .15s}
.viewer-dots .vd.on{background:var(--teal);transform:scale(1.25)}
.viewer-bar{position:fixed;left:50%;transform:translateX(-50%);z-index:122;
  bottom:calc(26px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:8px;
  background:rgba(20,24,32,.92);border:1px solid var(--line);border-radius:12px;padding:7px 10px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.vb-count{font-variant-numeric:tabular-nums;font-size:12px;color:var(--ink-mid);padding:0 4px;letter-spacing:.05em}
.vb-btn{font-size:12px;font-weight:700;color:var(--ink);background:var(--panel);
  border:1px solid var(--line);border-radius:8px;padding:7px 11px}
.vb-btn.on{border-color:var(--teal);color:var(--teal);background:rgba(111,211,199,.12)}
.vb-btn.del{color:var(--shu);border-color:rgba(232,85,61,.4)}
.viewer-confirm{position:fixed;left:50%;transform:translateX(-50%);z-index:123;
  bottom:calc(86px + env(safe-area-inset-bottom));background:var(--panel);border:1px solid var(--line);
  border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;align-items:center;
  font-size:13px;color:var(--ink);box-shadow:0 12px 40px rgba(0,0,0,.5)}
.viewer-confirm .vc-btns{display:flex;gap:8px}

.date-fields{display:flex;gap:10px;margin-top:14px}
.date-fields label{flex:1;display:flex;flex-direction:column;gap:6px;font-size:11px;
  color:var(--ink-mid);letter-spacing:.1em}
.date-fields input{background:var(--panel);border:1px solid var(--line);border-radius:7px;
  color:var(--ink);padding:9px 10px;font-size:13px;color-scheme:dark}
.edit-link{display:block;margin:16px auto 0;color:var(--gold);font-size:12.5px;
  letter-spacing:.08em;border-bottom:1px dashed var(--gold);padding-bottom:2px}
.detail-close{display:flex;align-items:center;justify-content:center;width:34px;height:34px;
  margin:18px 0 0;border:1px solid var(--line);border-radius:50%;
  color:var(--ink-dim);background:var(--panel);font-size:14px}
.detail-close:active{background:var(--panel2)}

/* 作品ピッカー */
.adv-series-btn{flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:8px;
  background:var(--bg2);border:1px solid var(--line);border-radius:7px;color:var(--ink);
  padding:8px 10px;font-size:12.5px;text-align:left}
.adv-series-btn .ph{color:var(--ink-dim)}
.adv-series-btn>span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.adv-series-caret{flex:none;color:var(--gold);font-size:11px}
.sp-bg{align-items:center;z-index:72}
.sp-modal{width:calc(100% - 36px);max-width:440px;max-height:74vh;margin:auto;display:flex;flex-direction:column;
  background:var(--bg2);border:1px solid var(--line);border-radius:14px;overflow:hidden;
  animation:up .26s cubic-bezier(.2,.9,.3,1.1)}
.sp-head{display:flex;gap:8px;padding:12px 12px 10px;border-bottom:1px solid var(--line-soft)}
.sp-search{flex:1;min-width:0;background:var(--panel);border:1px solid var(--line);border-radius:8px;
  color:var(--ink);padding:10px 12px;font-size:14px}
.sp-search::placeholder{color:var(--ink-dim)}
.sp-close{flex:none;width:40px;border:1px solid var(--line);border-radius:8px;color:var(--ink-mid);background:var(--panel);font-size:13px}
.sp-list{overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px}
.sp-item{display:block;width:100%;text-align:left;padding:11px 12px;border-radius:8px;
  font-size:13.5px;color:var(--ink);letter-spacing:.02em}
.sp-item:active{background:var(--panel)}
.sp-item.on{color:var(--gold);background:rgba(217,179,106,.1);font-weight:700}
.sp-empty{padding:24px 12px;text-align:center;color:var(--ink-dim);font-size:12.5px}

.form{display:flex;flex-direction:column;gap:12px}
.form-img-row{display:flex;gap:14px;align-items:flex-start}
.form-album{display:flex;flex-direction:column;gap:9px}
.ie-open-btn{width:100%;display:flex;align-items:center;justify-content:center;border:1px solid var(--gold);color:var(--gold);background:rgba(217,179,106,.06);border-radius:9px;padding:13px 0;font-size:13px;letter-spacing:.04em;cursor:pointer;font-family:inherit}
.ie-open-btn:active{background:rgba(217,179,106,.13)}
.ie-bg{position:fixed;inset:0;height:100vh;height:var(--app-vh,100vh);height:100dvh;background:rgba(5,7,12,.92);z-index:70;display:flex;align-items:center;justify-content:center;padding:max(env(safe-area-inset-top),2.4vh) 12px max(env(safe-area-inset-bottom),2.4vh)}
.ie-panel{position:relative;width:100%;max-width:520px;min-height:min(640px,100%);max-height:100%;background:var(--bg);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
/* ── 編集室 ATELIER ── */
.ie-head{flex:none;position:relative;padding:15px 16px 11px;background:linear-gradient(180deg,var(--bg2),var(--bg));border-bottom:1px solid var(--line)}
.ie-head .sm-head{margin-bottom:0}
.ie-subcode{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;color:var(--ink-mid);letter-spacing:.08em;margin-top:6px}
.ie-headline{position:absolute;top:0;left:18px;right:18px;height:2px;background:linear-gradient(90deg,var(--shu) 0 52px,var(--line) 52px)}
.ie-headrow{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.ie-eyebrow{font-size:9px;letter-spacing:.32em;color:var(--ink-mid);margin-bottom:5px}
.ie-title{font-family:var(--serif);font-weight:800;font-size:23px;letter-spacing:.08em;color:var(--ink-strong);line-height:1}
.ie-title small{display:block;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;color:var(--ink-mid);letter-spacing:.08em;margin-top:6px;font-weight:400}
.ie-x{flex:none;color:var(--ink-mid);font-size:24px;width:36px;height:36px;line-height:1;border-radius:9px}
.ie-x:active{background:rgba(255,255,255,.05);transform:scale(.92)}
.ie-bar{flex:none;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 18px;font-size:11px;color:var(--ink-mid);border-bottom:1px solid var(--line-soft);background:var(--panel)}
.ie-cnt{flex:none;font-family:var(--serif);font-size:15px;color:var(--ink-strong);font-weight:700}
.ie-cnt i{font-size:10px;color:var(--ink-mid);margin-left:2px;font-style:normal;font-weight:400}
.ie-hint{flex:1;min-width:0;letter-spacing:.03em;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ie-cols{flex:none;display:inline-flex;gap:4px}
.ie-colbtn{width:30px;height:26px;border:1px solid var(--line);border-radius:7px;background:var(--bg2);color:var(--ink-mid);font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;transition:color .14s,border-color .14s,background .14s}
.ie-srcfilter{flex:none;display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--bg2)}
.ie-sfbtn{padding:5px 11px;font-size:11px;letter-spacing:.04em;color:var(--ink-mid);background:transparent;border:0;border-right:1px solid var(--line);line-height:1.4;transition:color .14s,background .14s}
.ie-sfbtn:last-child{border-right:0}
.ie-sfbtn.on{color:var(--gold);background:rgba(217,179,106,.12)}
.ie-colbtn.on{color:var(--gold);border-color:var(--gold);background:rgba(217,179,106,.1)}
.ie-bar .g{color:var(--gold)}
.ie-scroll{flex:1;min-height:0;overflow-y:auto;padding:14px 14px 28px;touch-action:pan-y}
.ie-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ie-grid.c3{grid-template-columns:1fr 1fr 1fr;gap:9px}
.bico{width:13px;height:13px;display:inline-block;vertical-align:-2px;margin-right:5px;flex:none}
.ie-tile{position:relative;border-radius:13px;overflow:hidden;border:1px solid var(--line);aspect-ratio:1;background:linear-gradient(150deg,var(--panel2),#10141a);padding:0;cursor:pointer;user-select:none;-webkit-user-select:none;transition:transform .14s ease,border-color .16s ease,box-shadow .16s ease}
.ie-tile:not(.drag):active{transform:scale(.975);filter:brightness(.96)}
.ie-tile.drag{border-color:var(--gold);background:rgba(217,179,106,.05)}
.ie-tile.drag .ie-img,.ie-tile.drag .ie-tfoot,.ie-tile.drag .ie-cover,.ie-tile.drag .ie-drag{opacity:0}
.ie-tile.drag::after{content:"";position:absolute;inset:6px;border:1.5px dashed rgba(217,179,106,.55);border-radius:9px;pointer-events:none}
.ie-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;-webkit-user-drag:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
.ie-img.blank{background:linear-gradient(140deg,#20262f,#14181f)}
.ie-drag{position:absolute;top:8px;left:8px;width:30px;height:30px;border-radius:8px;background:rgba(8,10,14,.62);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;color:var(--ink);font-size:14px;z-index:4;pointer-events:auto;touch-action:none;cursor:grab;border:1px solid rgba(255,255,255,.14)}
.ie-drag:active{cursor:grabbing;background:rgba(217,179,106,.3);border-color:var(--gold);color:var(--ink-strong)}
.ie-cover{position:absolute;top:8px;right:8px;z-index:3;font-family:var(--serif);font-size:10px;font-weight:700;color:var(--gold);letter-spacing:.08em;padding:3px 7px;border-radius:7px;background:rgba(8,10,14,.62);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid rgba(217,179,106,.55);pointer-events:none}
.ie-tfoot{position:absolute;left:0;right:0;bottom:0;padding:16px 9px 7px;background:linear-gradient(transparent,rgba(7,9,13,.94));z-index:2;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;letter-spacing:.02em;color:rgba(233,227,214,.72);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
.ie-tfoot .ai{color:var(--gold)} .ie-tfoot .pho{color:var(--teal)} .ie-dt{color:var(--ink-dim)}
.ie-tile.add{border:1px dashed var(--line);background:var(--panel);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--ink-mid);transition:border-color .16s,background .16s,transform .12s}
.ie-tile.add:active{background:var(--panel2);border-color:var(--gold);transform:scale(.975)}
.ie-plus{font-size:30px;color:var(--gold);font-weight:300} .ie-addl{font-size:12px} .ie-addo{font-size:9px;color:var(--ink-dim);text-align:center}
/* 浮遊ゴースト(指に吸着) */
.ie-ghost{position:fixed;top:0;left:0;z-index:90;pointer-events:none;border-radius:13px;overflow:hidden;will-change:transform;transform:translate3d(-9999px,-9999px,0);box-shadow:0 22px 48px rgba(0,0,0,.6);outline:2px solid var(--gold);outline-offset:-1px}
.ie-ghost img{width:100%;height:100%;object-fit:cover;display:block}
.ie-ghost .ie-img.blank{position:static;width:100%;height:100%}
/* シート共通 */
.ie-dim{position:absolute;inset:0;background:rgba(6,8,12,.62);z-index:8;display:flex;align-items:flex-end;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);animation:ie-fade .18s ease}
@keyframes ie-fade{from{opacity:0}to{opacity:1}}
.ie-sheet{position:relative;width:100%;max-height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;background:linear-gradient(180deg,var(--panel2),var(--panel));border-radius:20px 20px 0 0;padding:8px 18px calc(10px + env(safe-area-inset-bottom));box-shadow:0 -16px 44px rgba(0,0,0,.55);animation:ie-rise .26s cubic-bezier(.2,.9,.3,1)}
@keyframes ie-rise{from{transform:translateY(16px);opacity:.5}to{transform:translateY(0);opacity:1}}
.ie-grip{width:40px;height:4px;border-radius:2px;background:var(--line-soft);margin:4px auto 14px}
.ie-sh-h{font-family:var(--serif);font-weight:600;font-size:14px;margin-bottom:12px;text-align:center}
.ie-addbtns{display:flex;gap:10px;margin-bottom:12px}
.ie-abtn{flex:1;border:1px solid var(--line);background:var(--panel);border-radius:11px;padding:15px 0;color:var(--ink-strong);font-size:13px;display:flex;flex-direction:column;align-items:center;gap:7px;cursor:pointer;transition:transform .12s,border-color .14s,background .14s}
.ie-abtn:active{transform:scale(.96);border-color:var(--gold);background:var(--panel2)}
.ie-abtn .ic{font-size:21px}
.ie-abi{width:30px;height:30px;color:var(--gold)}
.ie-sheet.add .ie-sh-title{text-align:center}
.ie-urlrow{display:flex;gap:8px}
.ie-urlrow input{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:12px;color:var(--ink-strong);font-size:13px}
.ie-urlrow input:focus{outline:none;border-color:var(--gold);box-shadow:0 0 0 3px rgba(217,179,106,.14)}
.ie-urlrow button{flex:none;border:1px solid var(--gold);color:var(--gold);background:rgba(217,179,106,.06);border-radius:9px;padding:0 18px;font-size:13px;cursor:pointer}
.ie-urlrow button:active{background:rgba(217,179,106,.14)}
/* 大プレビュー */
.ie-pv{position:relative;width:100%;height:min(46vh,380px);border-radius:14px;overflow:hidden;background:#0c1016;border:1px solid var(--line);margin-bottom:12px;display:flex;align-items:center;justify-content:center}
.ie-pv img{width:100%;height:100%;object-fit:cover}
.ie-pv.full img.ie-pv-img{width:100%;height:100%;object-fit:contain;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-user-drag:none}
/* 画像情報シート:メッセージ(タイトル/メタ/操作)を常時全表示し、余白の上下スクロールを出さない。
   高さが足りない時はプレビューだけが縮む(flex-shrink)。極端に低い画面のみ overflow で退避。 */
.ie-sheet.sel{display:flex;flex-direction:column}
.ie-sheet.sel > .ie-sh-title,.ie-sheet.sel > .ie-sh-meta,.ie-sheet.sel > .ie-acts2,.ie-sheet.sel > .ie-del{flex:none}
.ie-sheet.sel > .ie-pv.full{flex:0 1 auto;min-height:120px}
.ie-sh-title{font-family:var(--serif);font-weight:800;font-size:15px;letter-spacing:.06em;color:var(--ink-strong);margin:2px 2px 11px}
.ie-pv-blank{width:100%;height:100%;background:linear-gradient(140deg,#20262f,#14181f)}
.ie-pv-idx{position:absolute;left:11px;bottom:11px;font-family:var(--serif);font-weight:700;font-size:16px;color:var(--ink-strong);padding:4px 11px;border-radius:9px;background:rgba(8,10,14,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12)}
.ie-pv-idx i{font-size:11px;color:var(--ink-mid);font-weight:400;font-style:normal}
.ie-pv-cover{position:absolute;right:11px;top:11px;font-family:var(--serif);font-size:11px;font-weight:700;color:var(--gold);letter-spacing:.1em;padding:4px 9px;border-radius:8px;background:rgba(8,10,14,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(217,179,106,.6)}
.ie-sh-meta{display:grid;grid-template-columns:auto 1fr;gap:9px 14px;padding:11px 4px;margin:0 0 12px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);font-size:12.5px}
.ie-sh-meta dt{color:var(--ink-mid);font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9.5px;letter-spacing:.08em;align-self:center;text-transform:uppercase}
.ie-sh-meta dd{margin:0;color:var(--ink-strong)}
.ie-sh-meta dd .pho{color:var(--teal)} .ie-sh-meta dd .ai{color:var(--gold)}
.ie-dim2{color:var(--ink-dim)}
.ie-locbtn{color:var(--teal);font-size:11px;margin-left:6px;background:none;border:none;cursor:pointer;font-family:inherit}
.ie-locedit{display:inline-flex;gap:6px;align-items:center}
.ie-locedit input{background:var(--panel);border:1px solid var(--line);border-radius:7px;padding:6px 9px;color:var(--ink-strong);font-size:12px;width:140px}
.ie-locedit input:focus{outline:none;border-color:var(--gold)}
.ie-locedit button{color:var(--gold);background:none;border:none;font-size:12px;cursor:pointer;font-family:inherit}
/* 動作:主要2ボタン + 削除 */
.ie-acts2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.ie-act2{display:flex;align-items:center;justify-content:center;gap:8px;padding:15px 8px;font-size:13.5px;font-weight:600;color:var(--ink-strong);background:var(--panel);border:1px solid var(--line);border-radius:12px;cursor:pointer;font-family:inherit;transition:transform .12s,border-color .14s,background .14s}
.ie-act2:active{transform:scale(.96)}
.ie-act2 .ic{font-size:18px;line-height:1}
.ie-act2.g{border-color:rgba(217,179,106,.55);background:linear-gradient(160deg,rgba(217,179,106,.14),var(--panel));color:var(--gold)}
.ie-act2.g:active{background:linear-gradient(160deg,rgba(217,179,106,.22),var(--panel))}
.ie-del{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:12px;font-size:12.5px;color:var(--shu);background:none;border:1px solid transparent;border-radius:11px;cursor:pointer;font-family:inherit;transition:background .14s}
.ie-del .ic{font-size:15px}
.ie-del:active{background:rgba(232,85,61,.1)}
.ie-del .ie-delic{width:16px;height:16px;flex:none}
/* 画像情報シート:閉じる(X) */
.ie-sheet-x{position:absolute;top:10px;right:12px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:9px;background:var(--bg2);border:1px solid var(--line);color:var(--ink-mid);z-index:3;transition:transform .12s,color .14s,border-color .14s}
.ie-sheet-x svg{width:16px;height:16px}
.ie-sheet-x:active{transform:scale(.9);color:var(--ink-strong);border-color:var(--gold)}
/* 画像情報シート:前後ナビ矢印(左右スワイプにも対応) */
.ie-pv-nav{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:54px;display:flex;align-items:center;justify-content:center;font-size:30px;line-height:1;color:var(--ink-strong);background:rgba(8,10,14,.46);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.12);border-radius:11px;z-index:3;font-family:var(--serif)}
.ie-pv-nav.prev{left:10px}
.ie-pv-nav.next{right:10px}
.ie-pv-nav:active{transform:translateY(-50%) scale(.9);background:rgba(217,179,106,.28);border-color:var(--gold)}
.form-album-strip{display:flex;gap:8px;flex-wrap:wrap}
.fa-thumb{position:relative;width:72px;height:72px;border-radius:8px;overflow:hidden;
  border:1px solid var(--line);background:var(--panel);padding:0}
.fa-thumb.sel{border-color:var(--gold);box-shadow:0 0 0 2px rgba(217,179,106,.35)}
.fa-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.fa-badge{position:absolute;top:2px;font-size:10px;font-weight:700;line-height:1;padding:2px 4px;border-radius:5px;
  background:rgba(13,16,24,.82)}
.fa-badge.t{left:2px;color:var(--gold)}
.fa-badge.a{right:2px;color:var(--gold)}
.fa-add{width:72px;height:72px;border-radius:8px;border:1px dashed var(--line);background:var(--panel);
  color:var(--ink-mid);font-size:22px;display:flex;align-items:center;justify-content:center}
.fa-actions{display:flex;flex-wrap:wrap;gap:6px}
.fa-actions .mini-btn{flex:none;padding:7px 9px}
.fa-add-row{display:flex;gap:6px}
.fa-add-row input{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:7px;
  padding:8px 10px;font-size:12px;color:var(--ink)}
.fa-count{font-size:11px;color:var(--ink-dim);letter-spacing:.04em}
.form-img-box{flex:none;width:96px;height:96px;display:flex;align-items:center;justify-content:center;
  background:var(--panel);border:1px dashed var(--line);border-radius:8px;overflow:hidden}
.form-img-btns{flex:1;display:flex;flex-direction:column;gap:7px}
.mini-btn{background:var(--panel);border:1px solid var(--line);border-radius:7px;
  padding:8px 10px;font-size:12px;color:var(--ink);text-align:center}
.mini-btn.ghost{border-style:dashed;color:var(--ink-mid)}
.url-row{display:flex;gap:6px}
.url-row input{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:7px;
  color:var(--ink);padding:8px 10px;font-size:11.5px;min-width:0}
.fld{display:flex;flex-direction:column;gap:5px;font-size:11px;color:var(--ink-mid);letter-spacing:.08em;flex:1}
.fld input,.fld textarea{background:var(--panel);border:1px solid var(--line);border-radius:7px;
  color:var(--ink);padding:9px 10px;font-size:13px;color-scheme:dark;resize:vertical}
.fld input:focus,.fld textarea:focus,.fld select:focus,.url-row input:focus{
  outline:none;border-color:var(--gold);box-shadow:0 0 0 3px rgba(217,179,106,.14)}
.fld input:focus-visible,.fld textarea:focus-visible,.fld select:focus-visible,.url-row input:focus-visible{outline:none}
.fld-row{display:flex;gap:10px}
.form-actions{display:flex;gap:8px;margin-top:4px}
.btn{flex:1;padding:12px;border-radius:8px;border:1px solid var(--line);font-size:13px;font-weight:700;
  background:var(--panel)}
.btn.primary{background:linear-gradient(160deg,#f2dca0,#d9b36a);border-color:var(--gold);color:#1a160d}
.btn.primary:disabled{opacity:.4}
.btn.danger{flex:none;color:var(--shu);border-color:rgba(232,85,61,.4);padding:12px 14px}

.tabbar{position:fixed;left:0;right:0;bottom:0;display:flex;z-index:40;
  background:rgba(13,16,24,.92);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
  border-top:1px solid var(--line);padding-bottom:env(safe-area-inset-bottom)}
.tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:9px 0 12px;color:var(--ink-dim);position:relative;transition:color .15s}
.tab.on{color:var(--gold)}
.tab-icon{font-size:16px;line-height:1}
.tab-label{font-size:10px;font-weight:700;letter-spacing:.2em;font-family:var(--serif)}
.tab-bar{position:absolute;top:0;left:25%;right:25%;height:2px;background:var(--gold);
  transform:scaleX(0);transition:transform .18s}
.tab.on .tab-bar{transform:scaleX(1)}
/* ═══ v2.1 UI 強化 ═══ */
.card{padding:0 0 10px}
.card-sketch{width:100%;aspect-ratio:1/1;min-height:0;margin-bottom:8px;padding:0;
  background:linear-gradient(180deg,rgba(0,0,0,.28),rgba(0,0,0,.06));
  align-items:center;border-bottom:1px solid var(--line-soft)}
.card .kit-img{width:100%;height:100%;border:none;border-radius:0}
.card-seals{right:6px;top:6px}
.card-name{font-size:14px;padding:0 10px;min-height:2.5em}
.card-meta{padding:0 10px}
.card-series{padding:0 10px}
.card.compact .card-name{font-size:12px}

.row{padding:11px 15px;gap:14px;border-radius:10px}
.row-sketch{width:72px}
.kit-img.sm{width:72px;height:72px;border-radius:8px}
.row-name{font-size:15px;line-height:1.4}
.row-sub{margin-top:4px;gap:10px}
.row-sub .mono{font-size:10px}
.row-sub .year-chip{font-size:12px}
.row-sub .price{font-size:11.5px}
.row-sub .series{font-size:11px}
.date-tag{font-size:11px}
.seal{font-size:11px;padding:5px 5px}

.line-chip.pb{color:#b9a0e8;border:1px solid #b9a0e8}
.line-chip.base{color:#c8d0dc;border:1px solid #aab4c4;
  background:linear-gradient(135deg,rgba(200,208,220,.16),rgba(200,208,220,.04))}
.corner-base{position:absolute;bottom:7px;left:7px;margin:0;font-size:8.5px;
  background:rgba(13,16,24,.82);padding:2px 6px}
.app.light .corner-base{background:rgba(253,250,243,.85)}
.prem-toggle{display:flex;align-items:center;gap:9px;background:var(--panel);
  border:1px solid var(--line);border-radius:7px;padding:11px 12px;font-size:12.5px;text-align:left}
.prem-toggle i{width:18px;height:18px;border:1.5px solid var(--ink-dim);border-radius:4px;
  display:flex;align-items:center;justify-content:center;font-size:11px;flex:none;color:#b9a0e8}
.prem-toggle.on{border-color:var(--gold);color:var(--ink-strong)}
.prem-toggle.on i{border-color:var(--gold);background:rgba(217,179,106,.14)}

.crop-bg{position:fixed;inset:0;background:rgba(5,7,12,.85);z-index:80;
  display:flex;align-items:center;justify-content:center;padding:16px}
.crop-panel{width:100%;max-width:520px;background:var(--bg2);border:1px solid var(--line);
  border-radius:14px;padding:16px;max-height:calc(100dvh - 32px);overflow-y:auto}
.crop-head{font-family:var(--serif);font-weight:700;font-size:14px;color:var(--ink-strong);
  margin-bottom:10px;display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.crop-head span{font-size:10px;color:var(--ink-dim);font-family:var(--sans)}
.crop-box{position:relative;display:flex;justify-content:center;background:#000;
  border-radius:8px;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.crop-box img{max-width:100%;max-height:56vh;display:block;pointer-events:none}
.crop-rect{position:absolute;border:2px solid var(--shu);box-shadow:0 0 0 9999px rgba(0,0,0,.55);
  cursor:move;touch-action:none}
.crop-handle{position:absolute;right:-13px;bottom:-13px;width:30px;height:30px;border-radius:50%;
  background:var(--shu);border:2px solid var(--ink-strong);cursor:nwse-resize;touch-action:none}
.crop-actions{display:flex;gap:8px;margin-top:14px}

/* ── 構図(framing) ── */
.kit-img.framed{overflow:hidden;display:inline-block;padding:0}
.kit-img-inner{width:100%;height:100%;object-fit:cover;display:block;will-change:transform}
.card .kit-img.framed{width:100%;height:100%}
.tc-art>.tc-frame{position:absolute;inset:0;z-index:1;overflow:hidden;cursor:zoom-in}
.tc-art>.tc-frame img.kit-img.tc{width:100%;height:100%;object-fit:cover;will-change:transform}
.tc-frame-btn{position:absolute;right:8px;bottom:8px;z-index:5;font-size:11px;font-weight:700;
  color:var(--ink);background:rgba(20,24,32,.82);border:1px solid var(--line);border-radius:8px;
  padding:5px 9px;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.frm-stage{position:relative;width:min(100%,56vh);aspect-ratio:1;margin:0 auto;background:repeating-conic-gradient(#15191f 0% 25%,#0e1217 0% 50%) 50%/18px 18px;border-radius:8px;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.frm-fullimg{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}
.frm-cropbox{position:absolute;box-sizing:border-box;border:1.5px solid var(--gold);box-shadow:0 0 0 9999px rgba(6,8,12,.62);cursor:move;touch-action:none}
.frm-cg{position:absolute;inset:0;pointer-events:none;display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr 1fr}
.frm-cg i{border:.5px solid rgba(255,255,255,.22)}
.frm-handle{position:absolute;right:-13px;bottom:-13px;width:30px;height:30px;border-radius:50%;background:var(--gold);border:2px solid var(--bg2);box-shadow:0 2px 8px rgba(0,0,0,.5);touch-action:none;cursor:nwse-resize}
.frm-handle::after{content:"";position:absolute;inset:9px;border-right:2px solid var(--bg2);border-bottom:2px solid var(--bg2)}
.frm-tools{display:flex;align-items:center;gap:12px;margin-top:14px}
.frm-mini{flex:none;width:64px;height:64px;border-radius:10px;overflow:hidden;border:1px solid var(--line);background:#0c1016}
.frm-mini img{width:100%;height:100%;object-fit:cover;display:block;transform-origin:center center}
.frm-qbtns{flex:1;display:flex;gap:8px}
.frm-qbtns .btn{flex:1}
.crop-panel.frm .crop-actions{margin-top:14px}

/* ═══ iPad / 大画面 ═══ */
@media (min-width:768px){
  .head-title{font-size:32px}
  .head-kana{font-size:17px}
  .head-eyebrow{font-size:11px}
  .head-stats b{font-size:24px}
  .head-stats span{font-size:11px}
  .body{max-width:1100px;padding:10px 24px 20px}
  .section-note{font-size:13px}
  .footnote{font-size:12px}
  .search{font-size:15px;padding:13px 16px}
  .add-btn{font-size:14px;padding:0 20px}
  .year-num{font-size:21px}
  .year-count{font-size:12px}
  .grid-wrap{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px}
  .grid-wrap.compact{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
  .card-name{font-size:16px}
  .card-meta .mono{font-size:11px}
  .year-chip{font-size:13px}
  .price{font-size:12.5px}
  .series{font-size:12px}
  .line-chip{font-size:10px}
  .row{padding:14px 18px}
  .row-sketch{width:88px}
  .kit-img.sm{width:88px;height:88px}
  .row-name{font-size:17px}
  .row-sub .series{font-size:12.5px}
  .modal-bg{align-items:center}
  .modal{max-width:660px;border-radius:16px;border-bottom:1px solid var(--line)}
  .modal-name{font-size:21px}
  .tc-head .tc-no{font-size:16px}
  .tc-head .tc-name{font-size:23px}
  .tc-art{height:300px}
  .tc-row{font-size:13.5px;padding:8px 14px}
  .tc-row>span,.tc-half>span{width:54px;font-size:13px}
  .kit-img.big{width:120px;height:120px}
  .form-img-box{width:120px;height:120px}
  .opt{font-size:15px;padding:14px 16px}
  .panel-title{font-size:17px}
  .panel-wrap{max-width:560px}
  .tab-label{font-size:12px}
  .tab-icon{font-size:18px}
  .date-fields input,.fld input,.fld textarea{font-size:15px}
  .fld{font-size:12px}
}
@media (min-width:1100px){
  .grid-wrap{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
}
/* ═══ v2.2 ═══ */
.head{padding-top:calc(16px + env(safe-area-inset-top))}
.head-line{top:env(safe-area-inset-top, 0px)}

.grade-chip{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.06em;
  border:1.5px solid;border-radius:3px;padding:1px 6px;margin-right:8px;
  vertical-align:3px;font-family:var(--sans);line-height:1.5}
.g-mg{color:var(--shu);border-color:var(--shu);background:rgba(232,85,61,.08)}
.g-hg{color:#8fcf8a;border-color:#8fcf8a;background:rgba(143,207,138,.08)}
.g-rg{color:var(--gold);border-color:var(--gold);background:rgba(217,179,106,.08)}
.g-sd{color:#6fd3c7;border-color:#6fd3c7;background:rgba(111,211,199,.08)}
.g-pg{color:#b08ad6;border-color:#b08ad6;background:rgba(176,138,214,.08)}
.g-hirm{color:#cf8a6a;border-color:#cf8a6a;background:rgba(207,138,106,.08)}
.g-re{color:#8ab0a0;border-color:#8ab0a0;background:rgba(138,176,160,.08)}
.g-fm{color:#a0a8c0;border-color:#a0a8c0;background:rgba(160,168,192,.08)}
.g-ex{color:var(--ink-strong);border-color:var(--ink-mid);background:rgba(231,226,214,.06)}

.stamp-set{position:relative;width:40px;height:40px;display:inline-block;flex:none}
.stamp{position:absolute;left:0;top:0;width:32px;height:32px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  border:2px solid;font-family:var(--serif);font-weight:800;font-size:16px;line-height:1;
  transform:rotate(-10deg);background:rgba(13,16,24,.62)}
.stamp.shu{color:var(--shu);border-color:var(--shu)}
.stamp.teal{color:var(--teal);border-color:var(--teal)}
.stamp.teal.back{transform:translate(9px,10px) rotate(7deg);opacity:.85}

.section-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:8px}
.section-row .section-note{padding:0 0 0 4px}
.view-toggle{display:flex;border:1px solid var(--line);border-radius:7px;overflow:hidden;flex:none}
.view-toggle button{padding:7px 13px;font-size:11px;font-weight:700;letter-spacing:.06em;
  color:var(--ink-dim);background:var(--panel)}
.view-toggle button.on{color:var(--shu);background:linear-gradient(160deg,rgba(232,85,61,.16),var(--panel))}
.view-toggle button + button{border-left:1px solid var(--line)}

.row-sketch{width:96px}
.kit-img.sm{width:96px;height:96px;border:none;border-radius:8px;
  -webkit-mask-image:linear-gradient(to right,#000 70%,transparent 100%);
  mask-image:linear-gradient(to right,#000 70%,transparent 100%)}
.card .kit-img{-webkit-mask-image:linear-gradient(to bottom,#000 72%,transparent 100%);
  mask-image:linear-gradient(to bottom,#000 72%,transparent 100%)}
.card-sketch{border-bottom:none;margin-bottom:4px}

.card-name{font-size:18px;line-height:1.34;min-height:0;padding:0 11px}
.row-name{font-size:19px;line-height:1.35}
.grid-wrap{grid-template-columns:repeat(auto-fill,minmax(172px,1fr))}

.fld select{background:var(--panel);border:1px solid var(--line);border-radius:7px;
  color:var(--ink);padding:9px 10px;font-size:13px;color-scheme:dark;font-family:var(--sans)}
.fld.grow2{flex:2}
.fld .prem-toggle{padding:9px 10px;font-size:12px}

@media (min-width:768px){
  .card-name{font-size:21px}
  .row-name{font-size:23px}
  .grid-wrap{grid-template-columns:repeat(auto-fill,minmax(235px,1fr))}
  .row-sketch{width:112px}
  .kit-img.sm{width:112px;height:112px}
  .grade-chip{font-size:11.5px}
  .stamp{width:38px;height:38px;font-size:19px}
  .stamp-set{width:48px;height:48px}
  .view-toggle button{font-size:13px;padding:9px 17px}
}
/* ═══ v2.3 ═══ */
.toggle-row{display:flex;justify-content:flex-end;padding:8px 0 10px}
.section-row{padding-bottom:10px}
.sort-bar{display:flex;align-items:center;gap:7px;flex:none}
.sort-lbl{font-size:10px;color:var(--ink-dim);letter-spacing:.12em}
.sort-bar select{background:var(--panel);border:1px solid var(--line);border-radius:6px;
  color:var(--ink);font-size:11.5px;padding:6px 8px;font-family:var(--sans)}
.sort-bar button{border:1px solid var(--line);border-radius:6px;width:29px;height:29px;
  color:var(--shu);background:var(--panel);font-size:14px;font-weight:700}

.grade-chip{font-size:12.5px;font-weight:900;padding:1px 7px;letter-spacing:.04em;vertical-align:2px}

.stamp{width:48px;height:48px;font-size:26px;border-width:2.5px;
  background:radial-gradient(circle at 36% 30%, rgba(13,16,24,.45), rgba(13,16,24,.78));
  box-shadow:inset 0 0 0 1.5px, inset 0 0 7px rgba(0,0,0,.5)}
.stamp-set{width:58px;height:58px}
.stamp.teal.back{transform:translate(8px,9px) rotate(7deg);opacity:.9}

.tab-page{animation:pageIn .22s ease-out}
@keyframes pageIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.tab.on .tab-icon{animation:tabPop .3s ease}
@keyframes tabPop{0%{transform:scale(1)}45%{transform:scale(1.4) translateY(-2px)}100%{transform:scale(1)}}

.ana-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
.ana-card{background:linear-gradient(160deg,var(--panel2),var(--panel));border:1px solid var(--line);
  border-radius:10px;padding:13px 13px 11px;clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%)}
.ana-card span{font-size:9.5px;color:var(--ink-mid);letter-spacing:.16em;display:block;margin-bottom:4px}
.ana-card b{font-family:var(--serif);font-size:21px;color:var(--ink-strong);line-height:1.15}
.ana-card em{font-style:normal;font-size:12px;color:var(--ink-mid);margin-left:3px;font-family:var(--sans)}
.ana-card small{font-size:10px;color:var(--ink-dim);display:block;margin-top:3px}
.ana-note{font-size:11px;color:var(--ink-mid);padding:10px 4px 0;letter-spacing:.04em}
.ana-sec{margin-top:24px}
.pie-wrap{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.legend{flex:1;min-width:175px;display:flex;flex-direction:column;gap:7px}
.legend-item{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--ink-mid)}
.legend-item i{width:10px;height:10px;border-radius:3px;flex:none}
.legend-item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.legend-item b{color:var(--ink);font-weight:700;margin-left:auto;font-family:var(--serif);flex:none}
.bars{display:flex;align-items:flex-end;gap:9px;padding-top:6px;overflow-x:auto}
.bar{flex:1;min-width:34px;display:flex;flex-direction:column;align-items:center;gap:4px}
.bar i{display:block;width:100%;max-width:48px;background:linear-gradient(180deg,var(--shu),var(--shu-deep));
  border-radius:4px 4px 0 0}
.bar em{font-style:normal;font-size:11.5px;color:var(--ink-strong);font-family:var(--serif)}
.bar span{font-size:10px;color:var(--ink-dim)}

/* ── ライトテーマ(浮世絵・和の色)生成り和紙 × 藍・紅・黄土・緑青 ── */
.app.light{
  /* 和紙(生成り)ベース:紙の白を温かく、面の階調を明確に */
  --bg:#ece3d0; --bg2:#f3ebd9; --panel:#fbf6ea; --panel2:#efe6d1;
  --line:#cdc0a2; --line-soft:#ddd2b9;
  /* 墨(すみ)階調 — 可読性のため深めに */
  --ink:#322c21; --ink-strong:#1c160f; --ink-mid:#6a6051; --ink-dim:#968b75;
  /* 浮世絵の顔料:紅(べに)/黄土(おうど)/緑青(ろくしょう)/藍(あい) */
  --shu:#c23a26; --shu-deep:#982c1b; --gold:#a87c2c; --teal:#2c8a6f; --blue:#235d92;
  --kin:#a87c2c; --kin-deep:#7d5a1e; --crt-line:#3f7d72;
  background:
    radial-gradient(1150px 520px at 82% -12%, rgba(35,93,146,.08), transparent 60%),
    radial-gradient(880px 460px at -12% 26%, rgba(194,58,38,.055), transparent 60%),
    radial-gradient(760px 520px at 50% 118%, rgba(168,124,44,.06), transparent 62%),
    var(--bg);
}
/* 金箔(タイトル装飾)を黄土〜濃金茶のグラデに */
.app.light .hf-vbar-t,.app.light .hf-kana,.app.light .nf-big{background:linear-gradient(180deg,#b88a38,#6c4d18);-webkit-background-clip:text;background-clip:text}
.app.light .hf-vbar::before{background:linear-gradient(180deg,transparent,rgba(168,124,44,.6) 16%,rgba(168,124,44,.6) 84%,transparent)}
.app.light .hf-title,.app.light .nf-gunpla{text-shadow:0 1px 0 rgba(255,255,255,.55)}
.app.light .stamp{background:radial-gradient(circle at 36% 30%, rgba(251,246,234,.6), rgba(251,246,234,.9))}
.app.light .tabbar{background:rgba(243,235,217,.94)}
.app.light .card-sketch{background:linear-gradient(180deg,rgba(28,22,15,.08),rgba(28,22,15,.02))}
.app.light .modal-bg{background:rgba(44,37,27,.46)}
.app.light .crop-bg{background:rgba(44,37,27,.74)}
.app.light input,.app.light select,.app.light textarea{color-scheme:light}
/* 黄土トーンへ調和(ハードコードの dark gold tint を上書きし可読性を確保) */
.app.light .opt.on{border-color:var(--gold);background:linear-gradient(160deg,rgba(168,124,44,.14),var(--panel));color:var(--kin-deep)}
.app.light .opt.on i{color:var(--gold)}
.app.light .search:focus,.app.light .fld input:focus,.app.light .fld textarea:focus,.app.light .fld select:focus,.app.light .url-row input:focus,.app.light .kt-edit:focus{box-shadow:0 0 0 3px rgba(168,124,44,.16)}
.app.light .add-btn{background:linear-gradient(160deg,rgba(168,124,44,.16),var(--panel))}
.app.light .gf-btn.on{box-shadow:0 0 10px rgba(168,124,44,.3)}
.app.light .seal-gold{background:rgba(168,124,44,.09)}
.app.light .adv-seg-btn.on{border-color:rgba(168,124,44,.5);background:rgba(168,124,44,.12)}
.app.light .tab:active{background:radial-gradient(112% 80% at 50% 100%,rgba(168,124,44,.16),rgba(168,124,44,.04) 56%,transparent 78%)}
.app.light .plan-pin{background:rgba(168,124,44,.16);border-color:rgba(168,124,44,.5)}
.app.light .kz-seal,.app.light .kz-rseal{box-shadow:0 1px 2px rgba(0,0,0,.12)}

@media (min-width:768px){
  .grade-chip{font-size:14px}
  .stamp{width:54px;height:54px;font-size:30px}
  .stamp-set{width:66px;height:66px}
  .ana-cards{grid-template-columns:repeat(3,1fr)}
  .ana-card b{font-size:25px}
  .bars{gap:14px}
}
/* ═══ v2.4 性能 ═══ */
.more-btn{display:block;margin:16px auto 0;padding:11px 24px;border:1px dashed var(--line);
  border-radius:8px;color:var(--ink-mid);font-size:12.5px;letter-spacing:.08em;background:var(--panel)}
.more-btn:active{transform:scale(.97)}
/* ═══ v2.5 ═══ */
/* 8+9. 滾動架構:html/body は不滾動。.app の高さ/スクロールは後段 v2.6 の flex 三明治
   (.app=flex 縦 / .body=スクロール / .tabbar=常駐)が最終定義。旧「.app＝スクロール容器」
   定義は overflow:hidden に上書き済みで無効のため撤去。 */
html,body{height:100%;overflow:hidden;overscroll-behavior:none}
.app.lock{overflow:hidden}
.modal{overscroll-behavior:contain}
.crop-panel{overscroll-behavior:contain}

/* 1. 控制列:排序靠左、視圖切換靠右 */
.control-row{display:flex;justify-content:space-between;align-items:center;gap:10px;
  padding:9px 0 4px;flex-wrap:wrap}

/* 2+3. 彈窗置中(略偏下),日期清除鈕 */
.modal-bg{align-items:center;padding:0 14px}
.modal{margin-top:9vh;border-radius:16px;border-bottom:1px solid var(--line)}
.date-wrap{position:relative;display:flex}
.date-wrap input{flex:1;width:100%;padding-right:32px}
.date-clear{position:absolute;right:5px;top:50%;transform:translateY(-50%);
  width:22px;height:22px;border-radius:50%;background:var(--line);color:var(--ink);
  font-size:10px;display:flex;align-items:center;justify-content:center;line-height:1}

/* 3. 表單列改 grid:左右欄寬同步,プレバン不換行 */
.fld-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.fld-row.name-row{grid-template-columns:2fr 1fr}
.prem-toggle{white-space:nowrap}
.fld .prem-toggle{padding:9px 8px;font-size:12px}

/* 4. 列表圖再放大 */
.row-sketch{width:112px}
.kit-img.sm{width:112px;height:112px}

/* 8. 分頁列圖標與字體放大 */
.tab{padding:10px 0 12px;gap:3px}
.tab-icon{font-size:20px}
.tab-label{font-size:11.5px;letter-spacing:.18em}

@media (min-width:768px){
  .row-sketch{width:132px}
  .kit-img.sm{width:132px;height:132px}
  .tab-icon{font-size:22px}
  .tab-label{font-size:13px}
  .modal{margin-top:0}
}
/* ═══ v2.6 ═══ */
/* 2. flex 三明治結構:head 固定 / body 捲動 / tabbar 常駐 */
.app{display:flex;flex-direction:column;height:100vh;height:var(--app-vh,100vh);height:100dvh;overflow:hidden;padding-bottom:0}
.head{flex:none}
.body{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;
  max-width:none;margin:0;padding:8px 14px calc(28px + env(safe-area-inset-bottom))}
.tab-page{max-width:920px;margin:0 auto}
.app.lock .body{overflow:hidden}
.tabbar{position:relative;flex:none}
.tab-bar{transform:none;transition:none;animation:barIn .18s ease-out}
@keyframes barIn{from{transform:scaleX(0)}to{transform:none}}

/* 1. 収集進度條 */
.head-progress{display:flex;align-items:center;gap:8px;background:none;height:auto;
  margin-top:12px;overflow:visible}
.hp-pct{font-family:var(--serif);font-size:11px;font-weight:700;color:var(--gold);
  letter-spacing:.06em;flex:none;min-width:32px;text-align:right}
.hp-track{flex:1;height:4px;background:var(--line-soft);border-radius:2px;overflow:hidden}
.hp-track i{display:block;height:100%;border-radius:2px;
  background:linear-gradient(90deg,var(--shu),var(--gold));
  box-shadow:0 0 7px rgba(232,85,61,.55);transition:width .5s}

/* 3. 列表行距統一 */
.row-series{font-size:10.5px;color:var(--ink-dim);letter-spacing:.04em}
.row-main > * {margin:0}
.row-main > * + * {margin-top:3.5px}
.row-sub{margin-top:0}

@media (min-width:768px){
  .body{padding:10px 24px calc(28px + env(safe-area-inset-bottom))}
  .tab-page{max-width:1100px}
  .row-series{font-size:12px}
  .hp-pct{font-size:13px}
  .hp-track{height:5px}
}
/* ═══ v2.7 ═══ */
/* 1. 収集率はタイトル直後、進度條は左端から滿幅 */
.hp-pct{font-size:12.5px;min-width:0;margin-left:10px;font-weight:700;letter-spacing:.1em;
  color:var(--gold);vertical-align:2px}
.head-progress{gap:0}

/* 2. 列表右側資訊欄 */
.row-rail{flex:none;align-self:stretch;display:flex;flex-direction:column;
  align-items:flex-end;justify-content:space-between;padding:3px 0;gap:8px}
.rail-no{font-size:9.5px;color:var(--ink-mid);border:1px solid var(--line);border-radius:3px;
  padding:1.5px 6px;letter-spacing:.1em;white-space:nowrap}
.rail-ym{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--gold);
  letter-spacing:.04em;white-space:nowrap}

/* 3. カードのプレバン章は写真右上 */
.corner-pb{position:absolute;top:7px;right:7px;margin:0;
  background:rgba(13,16,24,.74);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
.app.light .corner-pb{background:rgba(253,250,243,.85)}

@media (min-width:768px){
  .hp-pct{font-size:15px}
  .rail-no{font-size:11px}
  .rail-ym{font-size:19px}
}
/* ═══ v2.8 ═══ */
/* 3. 編輯視窗不超出畫面:上邊距縮小+高度上限 */
.modal{margin-top:calc(env(safe-area-inset-top) + 4vh);max-height:calc(100dvh - env(safe-area-inset-top) - 4vh - env(safe-area-inset-bottom) - 18px)}

/* 4. rail頂行:プレバン+No. 下緣與原作行對齊 */
.row-rail{padding:0 0 3px}
.rail-top{display:flex;align-items:flex-end;gap:5px}
.rail-top .line-chip{margin:0;vertical-align:0;font-size:8.5px;line-height:1.4}
.rail-no{line-height:1.3;padding:1px 6px}
.row-series{line-height:1.45}

@media (min-width:768px){
  .modal{margin-top:0;max-height:86vh}
  .rail-top .line-chip{font-size:10px}
}
/* ═══ v2.9 ═══ */
/* 1. 機体名は一行固定(溢れは…で省略)、徽章類は第三行へ */
.row-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.row-sub{gap:7px;align-items:center;flex-wrap:wrap}
.row-sub .grade-chip{margin-right:0;vertical-align:0;font-size:11px}
.row-sub .line-chip{margin:0;vertical-align:0}

/* 3. 編輯視窗內部件不溢出:grid 子項與輸入元件強制收斂 */
.form{min-width:0;max-width:100%}
.fld{min-width:0}
.fld input,.fld select,.fld textarea{width:100%;min-width:0}
.date-fields label{min-width:0}
.date-wrap input{min-width:0}

@media (min-width:768px){
  .row-sub .grade-chip{font-size:12.5px}
}
/* ═══ v3.0 ═══ */
/* 1. 上緊下鬆:原作上移、機体名下方の余白を拡大 */
.row{padding:8px 15px 11px}
.row-series + .row-name{margin-top:2.5px}
.row-name + *{margin-top:7px}

/* 3. 機体名一号大きく、折返し許可 */
.row-name{font-size:22px;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.3}

/* 2. 枠付き要素の寸法統一(Grade基準) */
.line-chip{font-size:10px;font-weight:800;padding:1px 6px;line-height:1.55}
.line-chip.ka,.line-chip.ex,.line-chip.cu,.line-chip.pb{border-width:1.5px}
.row-sub .line-chip{font-size:11px;padding:1px 6px}
.row-sub .grade-chip{font-size:11px;padding:1px 6px}
.corner-pb{font-size:9.5px}

/* 5. 編輯視窗內溢出根治:grid 欄位下限歸零 */
.fld-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.fld-row.name-row{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}
.form-img-row{min-width:0}
.form-img-btns{min-width:0}
.form .mini-btn{max-width:100%}
.modal{overflow-x:hidden}

/* 7. 分頁鈕下拉貼近畫面下緣(保留少量Home Indicator餘裕) */
.tabbar{padding-bottom:max(2px, calc(env(safe-area-inset-bottom) / 2 - 6px))}

@media (min-width:768px){
  .row-name{font-size:25px}
  .row-sub .line-chip{font-size:12.5px}
}
/* ═══ v3.1 ═══ */
/* 1. 分頁被切根治:殘留的 min-height:100vh 撐高容器導致溢出 */
.app{min-height:0}
/* 位置貼底:安全區內距減 12px(截斷 bug 已根治,可安全縮減) */
.tabbar{padding-bottom:max(2px, calc(env(safe-area-inset-bottom) / 2 - 6px))}

/* 2. iOS month/date 輸入框固有寬度根治 */
.fld{overflow:hidden}
.fld input[type="month"],.date-fields input[type="date"]{
  -webkit-appearance:none;appearance:none;display:block;
  width:100%;min-width:0;max-width:100%;text-align:left}

/* 4. 折線圖 */
.line-chart{width:100%;height:180px;display:block}
.lc-lbl{font-size:11px;fill:var(--ink-dim);font-family:var(--sans)}
.legend.horizontal{flex-direction:row;gap:16px;margin-top:8px;min-width:0;flex-wrap:wrap}

/* 6. AI 變換 */
.ai-styles{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}
.ai-fields{margin:0 0 12px;display:flex;flex-direction:column;gap:11px}
.ai-field-lab{font-size:11.5px;color:var(--ink-mid);margin-bottom:6px}
.ai-field-in{width:100%;padding:11px 13px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink-strong);font-size:14px;box-sizing:border-box}
.ai-field-in:focus{outline:none;border-color:var(--gold)}
.ai-styles .opt{padding:10px 4px;font-size:11px;justify-content:center;text-align:center}
.ai-preview{background:#000;border-radius:8px;min-height:140px;display:flex;
  align-items:center;justify-content:center;overflow:hidden}
.ai-preview img{max-width:100%;max-height:34vh;display:block}
.ai-progress{display:flex;flex-direction:column;align-items:center;gap:12px;
  color:var(--ink-mid);font-size:12px;padding:46px 16px}
.ai-bar{width:210px;height:4px;background:var(--line-soft);border-radius:2px;overflow:hidden}
.ai-bar i{display:block;height:100%;width:40%;border-radius:2px;
  background:linear-gradient(90deg,var(--shu),var(--gold));
  animation:aiSlide 1.2s ease-in-out infinite}
@keyframes aiSlide{0%{transform:translateX(-110%)}100%{transform:translateX(290%)}}
.ai-error{color:var(--shu);font-size:11.5px;margin-top:8px;line-height:1.6;word-break:break-all}
.ai-note{font-size:10px;color:var(--ink-dim);margin-top:10px}
.mini-btn.ai{border-color:var(--gold);color:var(--gold)}
.fld.pad{background:var(--panel);border:1px solid var(--line-soft);border-radius:8px;padding:10px 12px}

/* ═══ v3.3 ═══ */
/* 2. 列表圖片四周留白統一(上下左=10px) */
.row{padding:10px 12px 10px 10px;gap:13px;align-items:center}

/* 1. プロンプト編集(多スタイル対応:自動折返しグリッド) */
.prompt-chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:6px;margin-top:8px}
.prompt-chips .opt{flex:none;padding:8px 5px;font-size:10.5px;line-height:1.25;min-height:38px;
  justify-content:center;text-align:center;background:var(--panel2);word-break:break-word;hyphens:auto}
.prompt-ta{width:100%;background:var(--panel);border:1px solid var(--line);border-radius:8px;
  color:var(--ink);padding:11px 12px;font-size:13px;line-height:1.7;font-family:var(--sans);
  resize:vertical;margin-bottom:12px;min-height:170px}

@media (min-width:768px){
  .row{padding:12px 14px 12px 12px}
}
/* ═══ v3.5:「最小」模式按鈕內距同步收緊,標籤貼至螢幕下緣 ═══ */
.tabbar.pad-min .tab{padding:7px 0 2px;gap:2px}
/* ═══ v3.6 ═══ */
/* 1. 検索ドロワー */
.search-drawer{overflow:hidden;max-height:0;opacity:0;transition:max-height .3s ease,opacity .25s ease}
.search-drawer.open{max-height:520px;opacity:1}
.drawer-sub{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 2px 2px}
.drawer-tools{display:flex;gap:8px;align-items:center;padding:6px 2px 4px}
.drawer-tools .sort-bar{flex:1;min-width:0}
.drawer-tools .sort-bar select{flex:1;min-width:0;width:100%}
.drawer-tools .view-toggle{flex:none}
.drawer-tools .add-btn{flex:none;padding:0 14px}
.drawer-tools .salon-ctrl{flex:none}
.gf-row{display:flex;gap:6px;flex-wrap:wrap}
.gf-btn{padding:4px 12px;font-size:11.5px;font-weight:700;letter-spacing:.05em;
  border:1px solid var(--line);border-radius:999px;color:var(--ink-mid);background:var(--panel)}
.gf-btn.on{color:#1a160d;border-color:var(--gold);background:var(--gold);box-shadow:0 0 10px rgba(217,179,106,.3)}
.search-x{flex:none;width:44px;border:1px solid var(--line);border-radius:8px;
  color:var(--ink-mid);background:var(--panel);font-size:13px}
.cr-right{display:flex;gap:8px;align-items:stretch}
.cr-right .add-btn{padding:0 13px;display:flex;align-items:center}

/* 3. タイトル1.5倍+押下回饋 */
.head-eyebrow{font-size:10.5px;margin-bottom:7px}
.head-title{font-size:37px}
.head-kana{font-size:21px}
.head-row{flex-wrap:wrap;row-gap:8px}
.head-title.tappable{cursor:pointer;transition:transform .12s ease;user-select:none;-webkit-user-select:none}
.head-title.tappable:active{transform:scale(.95);transform-origin:left center}

/* 4. Builder行 */
.builder-line{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;
  border:1px solid var(--line);border-radius:8px;
  background:var(--panel);padding:10px 14px;margin-bottom:12px}
.builder-line span{font-size:9.5px;color:var(--ink-mid);letter-spacing:.16em;
  display:flex;align-items:baseline;gap:9px}
.builder-line b{font-family:var(--serif);font-size:16px;color:var(--ink-strong);letter-spacing:.04em}
.builder-tap{width:100%;text-align:left;align-items:center;cursor:pointer;
  transition:border-color .12s,transform .1s ease}
.builder-tap:active{transform:scale(.985)}
.panel-head-row{display:flex;align-items:baseline;justify-content:space-between;
  gap:10px;margin:18px 2px 10px}
.panel-head-row:first-child{margin-top:6px}
.panel-head-row .panel-title{margin:0}
.panel-edit-btn{flex:none;font-size:11px;letter-spacing:.1em;color:var(--ink-mid);
  border:1px solid var(--line-soft);border-radius:7px;padding:5px 11px;
  background:var(--panel);transition:border-color .12s,transform .1s ease}
.panel-edit-btn:active{transform:scale(.95)}

/* 5. 記録(成就)カード */
.achv-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
.achv{position:relative;text-align:left;background:linear-gradient(160deg,var(--panel2),var(--panel));
  border:1px solid var(--line);border-radius:10px;padding:12px 12px 10px;overflow:hidden;
  clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%)}
.achv-label{font-size:9.5px;color:var(--gold);letter-spacing:.16em;display:block;margin-bottom:4px}
.achv-value{font-family:var(--serif);font-size:19px;color:var(--ink-strong);line-height:1.2;display:block}
.achv-sub{font-size:10px;color:var(--ink-mid);display:block;margin-top:4px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.achv-dot{position:absolute;top:8px;right:8px;width:8px;height:8px;border-radius:50%;
  background:var(--shu);box-shadow:0 0 8px var(--shu);animation:dotPulse 1.6s ease-in-out infinite}
@keyframes dotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.55}}
.achv.new{border-color:var(--gold)}
.achv.new::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(115deg,transparent 30%,rgba(217,179,106,.22) 50%,transparent 70%);
  transform:translateX(-100%);animation:shine 2.4s ease-in-out infinite}
@keyframes shine{0%{transform:translateX(-100%)}55%,100%{transform:translateX(100%)}}
.achv.pop{animation:achvPop .45s ease}
@keyframes achvPop{0%{transform:scale(1)}35%{transform:scale(1.07)}70%{transform:scale(.97)}100%{transform:scale(1)}}

@media (min-width:768px){
  .head-title{font-size:48px}
  .head-kana{font-size:25px}
  .head-eyebrow{font-size:12.5px}
  .achv-grid{grid-template-columns:repeat(3,1fr)}
  .achv-value{font-size:22px}
}
/* ═══ v3.7 ═══ */
/* 2. タイトル緊湊化:統計列保持單行 */
.head-row{flex-wrap:nowrap}
.head-title{font-size:35px;letter-spacing:.01em;white-space:nowrap}
.head-kana{font-size:20px;margin-left:5px;letter-spacing:.12em}
.head-stats{gap:7px}
.head-stats b{font-size:17px}

/* 3. 控制列三分:排序左・視圖中・追加右 */
.control-row .view-toggle{margin:0 auto}

/* 4. 成就值允許換行(機體名/作品名);甜甜圈中央標籤 */
.achv-value{word-break:break-word}
.pie-center{font-size:15px;font-weight:700;fill:var(--ink-strong);
  font-family:var(--sans);letter-spacing:.1em}

@media (min-width:768px){
  .head-title{font-size:46px}
  .head-kana{font-size:24px}
  .pie-center{font-size:16px}
}
/* ═══ v3.8:初期復元 ═══ */
.setup-note{font-size:12px;color:var(--ink-mid);line-height:1.8;margin-bottom:12px}
/* ═══ 称号(成就)システム ═══ */
.title-prog{margin:2px 2px 10px}
.title-seg{margin-bottom:12px}
.title-grid{display:flex;flex-direction:column;gap:9px}
.title-card{position:relative;display:flex;gap:12px;align-items:center;
  background:linear-gradient(160deg,var(--panel2),var(--panel));
  border:1px solid var(--line);border-radius:10px;padding:11px 12px;text-align:left;overflow:hidden;
  clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,0 100%);
  transition:transform .16s cubic-bezier(.34,1.56,.64,1),border-color .12s}
.title-card:active{transform:scale(.985);filter:brightness(.95)}
.title-card.unlocked{border-color:rgba(111,211,199,.34);background:linear-gradient(160deg,rgba(111,211,199,.06),var(--panel))}
.title-chip{flex:none;width:72px;height:72px;border-radius:9px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.title-chip.crt{color:var(--teal);background:radial-gradient(ellipse at 50% 42%,rgba(111,211,199,.13),transparent 66%),#0a1014;box-shadow:inset 0 0 18px 4px rgba(0,0,0,.62)}
.title-chip.crt::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(111,211,199,.06) 0 1px,transparent 1px 3px)}
.title-chip .qm{position:relative;z-index:1;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:40px;font-weight:700;color:var(--teal);text-shadow:0 0 9px rgba(111,211,199,.6)}
.title-seal{flex:none;width:52px;height:52px;border-radius:8px;display:flex;align-items:center;justify-content:center;
  border:1.5px solid var(--shu);color:var(--shu);background:rgba(232,85,61,.09);
  font-family:var(--serif);font-weight:800;font-size:13px;letter-spacing:.14em;writing-mode:vertical-rl;
  transform:rotate(-3deg);box-shadow:0 0 0 3px rgba(232,85,61,.06)}
.title-body{flex:1;min-width:0}
.title-name{font-family:var(--serif);font-size:19.5px;font-weight:700;color:var(--ink-strong);line-height:1.3}
.title-card.locked .title-name{color:var(--ink)}
.title-card.todo .title-name{color:var(--ink)}
.title-sub{font-size:10.5px;color:var(--ink-dim);line-height:1.55;margin-top:3px}
.title-foot{display:flex;align-items:center;gap:9px;margin-top:8px}
.title-card.locked .hp-track i{background:linear-gradient(90deg,var(--teal),var(--gold));box-shadow:0 0 6px rgba(111,211,199,.4)}
.title-need{flex:none;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9.5px;letter-spacing:.08em;color:var(--teal)}
.title-need.locked-tag{color:var(--ink-dim)}
.title-card.new{border-color:rgba(111,211,199,.55);box-shadow:0 0 0 1px rgba(111,211,199,.15)}
.title-card.new::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(111,211,199,.18) 50%,transparent 70%);transform:translateX(-100%);animation:shine 2.4s ease-in-out infinite}
.title-dot{top:8px;right:8px}
.title-card.pop{animation:achvPop .45s ease}
@media (min-width:768px){.title-grid{display:grid;grid-template-columns:repeat(2,1fr)}}
/* ═══ 称号 解錠トースト ═══ */
.title-toast{position:fixed;left:10px;right:10px;top:calc(env(safe-area-inset-top) + 10px);z-index:99997;
  max-width:520px;margin:0 auto;display:flex;gap:12px;align-items:center;text-align:left;
  background:linear-gradient(160deg,#1f2433,#171c28);border:1px solid var(--gold);border-radius:12px;padding:12px 14px;overflow:hidden;
  box-shadow:0 10px 34px rgba(0,0,0,.55),0 0 0 1px rgba(217,179,106,.15);animation:ttIn .42s cubic-bezier(.2,.9,.3,1.15)}
.title-toast::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(115deg,transparent 30%,rgba(217,179,106,.22) 50%,transparent 70%);transform:translateX(-100%);animation:shine 2.2s ease-in-out .25s infinite}
@keyframes ttIn{from{transform:translateY(-130%);opacity:0}to{transform:none;opacity:1}}
.av-toast.out{animation:ttOut .34s cubic-bezier(.4,0,.7,1) forwards}
@keyframes ttOut{from{transform:none;opacity:1}to{transform:translateY(-130%);opacity:0}}
.tt-seal{flex:none;width:46px;height:46px;border-radius:8px;display:flex;align-items:center;justify-content:center;
  border:1.5px solid var(--shu);color:var(--shu);background:rgba(232,85,61,.1);
  font-family:var(--serif);font-weight:800;font-size:12px;letter-spacing:.12em;writing-mode:vertical-rl;transform:rotate(-3deg)}
.tt-body{flex:1;min-width:0;position:relative;z-index:1}
.tt-kicker{font-size:9px;letter-spacing:.34em;color:var(--gold);font-family:ui-monospace,"SF Mono",Menlo,monospace}
.tt-name{font-family:var(--serif);font-weight:800;font-size:16px;color:var(--ink-strong);line-height:1.25;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tt-sub{font-size:10px;color:var(--ink-dim);line-height:1.4;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tt-more{flex:none;align-self:flex-start;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;font-weight:700;color:var(--gold);border:1px solid var(--gold);border-radius:10px;padding:1px 7px}
/* ═══ 称号 詳細モーダル ═══ */
.title-modal .tm-head{display:flex;gap:14px;align-items:center;padding:4px 2px 15px;border-bottom:1px solid var(--line-soft);margin-bottom:13px}
.title-seal.big,.title-chip.big{width:60px;height:60px;flex:none}
.title-seal.big{font-size:15px}
.title-chip.big .qm{font-size:25px}
.tm-headbody{flex:1;min-width:0}
.tm-name{font-family:var(--serif);font-size:25px;font-weight:800;color:var(--ink-strong);line-height:1.22}
.tm-sub{font-size:13.5px;color:var(--ink-mid);line-height:1.6;margin-top:6px}
.tm-cond{display:flex;flex-direction:column;gap:8px}
.tm-piece{display:flex;gap:9px;align-items:flex-start;background:var(--panel);border:1px solid var(--line-soft);border-radius:8px;padding:9px 11px}
.tm-piece.ok{border-color:rgba(111,211,199,.35);background:rgba(111,211,199,.05)}
.tm-mark{flex:none;font-style:normal;font-size:13px;font-weight:800;color:var(--ink-dim);line-height:1.5;width:14px;text-align:center}
.tm-piece.ok .tm-mark{color:var(--teal)}
.tm-pname{font-size:12.5px;color:var(--ink-strong);line-height:1.5}
.tm-pname.own-link{padding:0;display:inline-flex;align-items:center;cursor:pointer}
.tm-pname.own-link .tm-cn{border-bottom:1px solid transparent;transition:border-color .15s}
.tm-pname.own-link:hover .tm-cn{border-bottom-color:var(--teal)}
.tm-pname.own-link:active{opacity:.55}
.tm-cnt{color:var(--gold);font-family:ui-monospace,"SF Mono",Menlo,monospace}
.tm-cands{display:flex;flex-direction:column;gap:5px;flex:1;min-width:0}
.tm-cand{display:flex;align-items:center;gap:7px;text-align:left;width:100%;background:none;border:none;padding:1px 0;font-size:12px;color:var(--ink-mid);cursor:pointer}
.tm-cand:active{opacity:.6}
.tm-cn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-bottom:1px dashed transparent}
.tm-cand:hover .tm-cn{border-bottom-color:var(--line)}
.tm-cand.row{padding:6px 10px;background:var(--panel);border:1px solid var(--line-soft);border-radius:7px}
.tm-cand.row.ok{border-color:rgba(111,211,199,.3)}
.tm-cand.row.ok .tm-cn{color:var(--ink-strong)}
.tm-mark.dim{color:var(--ink-dim)}
.tm-tag{flex:none;font-size:8.5px;font-weight:700;letter-spacing:.08em;border:1px solid var(--ink-dim);color:var(--ink-dim);border-radius:3px;padding:0 5px;margin-left:7px}
.tm-tag.own{border-color:var(--teal);color:var(--teal)}
.tm-more2{font-size:10px;color:var(--ink-dim);padding-left:1px}
.tm-countbar{font-family:var(--serif);font-size:14px;color:var(--ink-mid);margin-bottom:4px}
.tm-countbar b{font-size:22px;color:var(--gold);font-family:ui-monospace,"SF Mono",Menlo,monospace}
.tm-hint{font-size:10px;color:var(--ink-dim);letter-spacing:.06em;margin:6px 0 2px}
.tm-grades{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px}
.tm-grd{font-size:11px;font-weight:700;border:1px solid var(--line);color:var(--ink-dim);border-radius:5px;padding:3px 9px}
.tm-grd.on{border-color:var(--teal);color:var(--teal);background:rgba(111,211,199,.08)}
/* ═══ 称号 リデザイン(青磷光・C賞盃・2x) ═══ */
.title-chip.on{background:radial-gradient(ellipse at 50% 40%,rgba(111,211,199,.18),transparent 70%),#0a1417;box-shadow:inset 0 0 16px 3px rgba(0,0,0,.55),0 0 0 1px rgba(111,211,199,.18)}
.title-chip .emb{position:relative;z-index:1;width:46px;height:46px;animation:pulseGlow 2.6s ease-in-out infinite}
.title-chip.big{width:76px;height:76px}
.title-chip.big .qm{font-size:42px}
.title-chip.big .emb{width:50px;height:50px}
@keyframes pulseGlow{0%,100%{filter:drop-shadow(0 0 4px rgba(111,211,199,.55))}50%{filter:drop-shadow(0 0 9px rgba(111,211,199,.95))}}
.title-card.todo{border-color:rgba(111,211,199,.22)}
.title-foot .ttag.todo{flex:none;font-size:10px;font-weight:700;letter-spacing:.06em;border:1px dashed var(--teal);color:var(--teal);background:rgba(111,211,199,.05);border-radius:5px;padding:5px 11px}
.tm-gate{margin-top:14px}
.tm-piece.miss{border-color:rgba(232,85,61,.28)}
.tm-piece.miss .tm-mark{color:var(--shu)}
/* ═══ 称号 世界別ドロップダウン ═══ */
.title-head{display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;padding:6px 2px 4px;cursor:pointer;text-align:left}
.title-head:active{opacity:.7}
.th-uni{flex:none;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;color:var(--teal);letter-spacing:.1em;border:1px solid rgba(111,211,199,.3);border-radius:4px;padding:1px 7px}
.th-chev{flex:none;font-style:normal;font-size:15px;line-height:1;color:var(--ink-dim);transition:transform .3s ease,color .2s;margin-left:2px}
.th-chev.open{transform:rotate(180deg);color:var(--teal)}
.seg-drop{display:grid;grid-template-rows:0fr;opacity:0;margin-top:0;transition:grid-template-rows .32s cubic-bezier(.4,0,.2,1),opacity .24s ease,margin-top .32s}
.seg-drop.open{grid-template-rows:1fr;opacity:1;margin-top:10px;margin-bottom:12px}
.seg-drop-inner{overflow:hidden;min-height:0}
.uni-seg{display:grid;grid-template-columns:repeat(auto-fit,minmax(70px,1fr));gap:6px}
.uni-seg .adv-seg-btn{position:relative;display:flex;align-items:center;justify-content:center;gap:5px}
.uni-seg .adv-seg-btn.empty{opacity:.4}
.us-n{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;font-weight:700;color:var(--ink-dim)}
.adv-seg-btn.on .us-n{color:var(--teal)}
.title-uni{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9.5px;letter-spacing:.12em;color:var(--ink-dim);margin-bottom:3px}
.title-card.unlocked .title-uni{color:var(--teal)}
.title-empty{grid-column:1/-1;text-align:center;color:var(--ink-dim);font-size:12px;font-family:var(--serif);padding:30px 0;letter-spacing:.08em}
/* ═══ 機体カスタムタグ ═══ */
.kt-tags{margin-top:14px;padding-top:13px;border-top:1px solid var(--line-soft)}
.kt-tags-head{font-size:10px;letter-spacing:.2em;color:var(--ink-dim);margin-bottom:9px}
.kt-chiprow{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}
.kt-chip{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;color:var(--ink-strong);background:rgba(111,211,199,.08);border:1px solid rgba(111,211,199,.35);border-radius:13px;padding:4px 7px 4px 12px}
.kt-x{border:none;background:none;color:var(--teal);font-size:11px;cursor:pointer;padding:0 2px;line-height:1}
.kt-x:active{opacity:.5}
.kt-empty{font-size:11px;color:var(--ink-dim);font-style:italic}
.kt-add{display:flex;gap:7px}
.kt-input{flex:1;min-width:0;background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:9px 12px;color:var(--ink);font-family:inherit;font-size:13px}
.kt-input:focus{outline:none;border-color:rgba(111,211,199,.5)}
.kt-addbtn{flex:none;background:rgba(111,211,199,.1);border:1px solid rgba(111,211,199,.4);color:var(--teal);border-radius:8px;padding:0 15px;font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit}
.kt-addbtn:active{opacity:.7}
.kt-quick{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}
.kt-qchip{font-size:11.5px;color:var(--ink-mid);background:var(--panel);border:1px dashed var(--line);border-radius:11px;padding:3px 11px;cursor:pointer;font-family:inherit}
.kt-qchip:active{color:var(--teal);border-color:var(--teal)}
.dc-srow-tag{align-items:center}
.kt-field{display:flex;flex-wrap:wrap;gap:6px;align-items:center;cursor:text;width:100%}
.dc-tag{display:inline-flex;align-items:center;font-size:12px;color:var(--ink-strong);background:rgba(217,179,106,.07);border:1px solid rgba(217,179,106,.3);border-radius:3px;padding:3px 9px;letter-spacing:.02em}
.kt-pen{font-style:normal;color:var(--ink-dim);font-size:11px;opacity:.65;margin-left:auto}
.kt-edit{width:100%;background:var(--bg2);border:1px solid rgba(217,179,106,.4);border-radius:4px;padding:7px 10px;color:var(--ink);font-family:inherit;font-size:13px;letter-spacing:.02em}
.kt-edit:focus{outline:none;border-color:rgba(217,179,106,.65)}
/* ═══ 叙勲録(称号 金箔リデザイン) ═══ */
.av-sec{padding-top:0;margin-top:2px}
.av-defs{position:absolute;width:0;height:0}
.av-head{display:flex;align-items:flex-end;justify-content:space-between;width:100%;padding:4px 2px 0;gap:10px}
.av-head:active{opacity:.75}
.av-head-l{display:flex;flex-direction:column;min-width:0}
.av-eyebrow{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;letter-spacing:.30em;color:var(--ink-mid);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.av-title{font-family:var(--serif);font-weight:800;font-size:23px;letter-spacing:.05em;color:var(--ink-strong);margin-top:6px}
.av-title em{font-style:normal;color:var(--gold)}
.av-head-r{display:flex;align-items:center;gap:9px;flex:none}
.av-count{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10.5px;letter-spacing:.12em;color:var(--ink-mid);white-space:nowrap}
.av-count b{color:var(--gold);font-size:13px}
.av-chev{font-style:normal;font-size:14px;color:var(--ink-dim);transition:transform .3s ease,color .2s}
.av-chev.open{transform:rotate(180deg);color:var(--gold)}
.av-rule{height:1px;margin:11px 0 0;background:linear-gradient(90deg,var(--gold),rgba(217,179,106,.05) 70%,transparent)}
/* ── 簿冊表頭(博物誌/繪測巻/蔵品帳/発注簿):叙勲録の表頭に倣う ── */
.sb-band{margin:2px 0 14px}
.sb-head{display:flex;align-items:flex-end;justify-content:space-between;width:100%;padding:4px 2px 0;gap:10px}
.sb-switch{display:flex;flex-direction:column;align-items:flex-start;min-width:0;flex:1;background:none;border:none;padding:0;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}
.sb-switch:active{opacity:.78}
.sb-head-l{display:flex;flex-direction:column;min-width:0}
.sb-eyebrow{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;letter-spacing:.30em;color:var(--ink-mid);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-titlewrap{display:flex;align-items:baseline;gap:9px;margin-top:6px;min-width:0;max-width:100%}
.sb-title{font-family:var(--serif);font-weight:800;font-size:23px;letter-spacing:.05em;color:var(--ink-strong)}
.sb-title em{font-style:normal;color:var(--gold)}
.sb-alt{display:inline-flex;align-items:baseline;font-family:var(--serif);font-weight:600;font-size:12.5px;letter-spacing:.04em;color:var(--ink-dim);white-space:nowrap;flex:none;opacity:.9}
.sb-alt-x{color:var(--gold);font-size:10px;margin-right:3px;opacity:.85}
.sb-head-r{display:flex;align-items:center;gap:9px;flex:none}
.sb-count{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10.5px;letter-spacing:.12em;color:var(--ink-mid);white-space:nowrap}
.sb-count b{color:var(--gold);font-size:13px}
.sb-icon{flex:none;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border:1px solid var(--line);border-radius:9px;color:var(--ink-mid);background:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .2s,border-color .2s,background .2s}
.sb-icon:active{transform:scale(.92);border-color:var(--gold);color:var(--gold)}
.sb-icon svg{width:15px;height:15px;display:block}
.sb-icon.on{color:var(--gold);border-color:var(--gold);background:rgba(217,179,106,.09)}
/* ── 表頭 表裏切換タイトル(A翻面/B捲軸/C滑移) ── */
.lt{display:inline-flex;align-items:baseline;gap:9px;min-width:0;position:relative}
.lt-win{display:inline-block}
.lt-cur{display:inline-block}
.lt-alt{display:inline-flex;align-items:baseline;font-family:var(--serif);font-weight:600;font-size:12.5px;letter-spacing:.04em;color:var(--ink-dim);white-space:nowrap;flex:none}
.lt-x{color:var(--gold);font-size:10px;margin-right:3px;opacity:.85}
/* A 翻面:正面が下端を軸に立ち上がる。配対名は裏側として下に薄く控える */
.lt-flip{perspective:600px}
.lt-flip .lt-win{transform-style:preserve-3d}
.lt-flip .lt-cur{transform-origin:50% 100%;backface-visibility:hidden;animation:ltFlip .54s cubic-bezier(.45,.05,.2,1) both}
@keyframes ltFlip{0%{transform:rotateX(-92deg);opacity:0}52%{opacity:1}100%{transform:rotateX(0);opacity:1}}
.lt-flip .lt-alt{position:absolute;left:1px;top:100%;margin-top:-6px;transform:scaleY(.62);transform-origin:top;opacity:.4}
.lt-flip .lt-x{display:none}
/* B 捲軸:窗で裁ち、新題が下/上から巻き入る。配対名は窓下に半行覗く */
.lt-roll{flex-direction:column;align-items:flex-start;gap:0}
.lt-roll .lt-win{overflow:hidden;font-size:23px;height:1.2em;line-height:1.2em}
.lt-roll .lt-cur{display:block;line-height:1.2em;animation:ltRoll .44s cubic-bezier(.3,0,.18,1) both}
@keyframes ltRoll{from{transform:translateY(var(--fromY,100%));opacity:.15}to{transform:translateY(0);opacity:1}}
.lt-roll .lt-alt{height:.6em;line-height:1.06em;overflow:hidden;opacity:.5;margin-top:1px}
.lt-roll .lt-x{display:none}
/* C 滑移:新題が横から滑り込み溶け込む。配対名は⇄付きで並ぶ */
.lt-slide .lt-cur{animation:ltSlide .36s cubic-bezier(.2,.8,.3,1) both}
@keyframes ltSlide{from{transform:translateX(var(--fromX,14px));opacity:0}to{transform:translateX(0);opacity:1}}
.lt-slide .lt-alt{opacity:.9}
.sb-rule{height:1px;margin:11px 0 0;background:linear-gradient(90deg,var(--gold),rgba(217,179,106,.05) 70%,transparent)}
/* ── 表頭 転場アニメ:全頁共通の土台(掛載時のみ再生)。
   ・減少動態の設定下でも表示する(本人の明示的な希望) ── */
@keyframes sbRuleIn{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes sbEyebrowIn{from{opacity:0;letter-spacing:.52em}to{opacity:1;letter-spacing:.30em}}
@keyframes sbTitleIn{from{opacity:0;letter-spacing:.30em}to{opacity:1;letter-spacing:.05em}}
@keyframes sbCountIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes sbFindIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}
/* 共通土台:罫線・eyebrow は据え置き。標題と計数は列表(tab-page)と同期=pageIn */
.sb-rule,.av-rule{transform-origin:left center;animation:sbRuleIn .50s cubic-bezier(.4,0,.2,1) .03s both}
.sb-eyebrow,.av-eyebrow{animation:sbEyebrowIn .36s ease-out .10s both}
.sb-title,.av-title{animation:pageIn .22s ease-out both}
.sb-find,.sb-icon{animation:sbFindIn .36s cubic-bezier(.2,.8,.3,1.2) .30s both}
.sb-count,.av-count{animation:pageIn .22s ease-out both}
/* ── 検索浮動窓 ── */
.search-modal{padding:18px 16px 22px}
/* 機体情報修正フロー */
.fix-results{margin-top:10px;max-height:46vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px;-webkit-overflow-scrolling:touch}
.fix-row{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;
  background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:10px 12px;cursor:pointer;
  transition:border-color .15s,background .15s}
.fix-row:active{transform:scale(.99)}
.fix-row-name{font-family:var(--serif);font-size:14px;color:var(--ink-strong)}
.fix-row-sub{font-size:11px;color:var(--ink-mid);letter-spacing:.02em}
.fix-empty{margin:14px 2px;font-size:12.5px;color:var(--ink-mid)}
.fix-form{margin-top:8px;max-height:70vh;overflow-y:auto;-webkit-overflow-scrolling:touch}
.fix-target{font-size:12.5px;color:var(--ink-mid);margin:2px 2px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fix-target b{color:var(--ink-strong);font-family:var(--serif)}
.fix-back{margin-left:auto;font-size:11.5px;color:var(--gold);border-bottom:1px dashed var(--gold);padding-bottom:1px;cursor:pointer}
.fix-toggle{min-width:64px;padding:7px 14px;border:1px solid var(--line);border-radius:7px;background:var(--panel);
  color:var(--ink-mid);font-size:13px;cursor:pointer;transition:all .15s}
.fix-toggle.on{border-color:var(--gold);color:var(--gold);background:rgba(217,179,106,.1)}
.fix-send{width:100%;margin-top:14px}
/* AI機体判別 */
.idf-note{font-size:12.5px;color:var(--ink-mid);line-height:1.7;margin:10px 2px}
.idf-pick{padding:8px 2px 4px}
.idf-lead{font-size:13px;color:var(--ink-mid);line-height:1.8;margin-bottom:18px}
.idf-choose{width:100%}
.idf-loading{padding:40px 0;text-align:center;font-family:var(--serif);font-size:15px;color:var(--ink-mid)}
.idf-result{max-height:74vh;overflow-y:auto;-webkit-overflow-scrolling:touch}
.idf-preview{width:140px;height:140px;margin:6px auto 12px;border:1px solid var(--line);border-radius:11px;overflow:hidden;background:#0c0c0c}
.idf-preview img{width:100%;height:100%;object-fit:cover;display:block}
.idf-ailine{font-size:12.5px;color:var(--ink-strong);line-height:1.6;margin:0 2px 12px;text-align:center}
.idf-modelfield{margin-bottom:14px}
.mpk{position:relative}
.mpk-label{font-size:11.5px;color:var(--ink-mid);letter-spacing:.02em;margin-bottom:6px}
.mpk-btn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 13px;
  border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink-strong);font-size:14px;cursor:pointer;transition:border-color .14s}
.mpk.open .mpk-btn,.mpk-btn:active{border-color:var(--gold)}
.mpk-cur{display:flex;align-items:baseline;gap:6px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mpk-cur i{font-style:normal;color:var(--ink-mid);font-size:12px}
.mpk-caret{color:var(--gold);font-size:11px;flex:none}
.mpk-list{margin-top:6px;background:var(--panel);border:1px solid var(--gold);border-radius:9px;overflow:hidden}
.mpk-item{width:100%;display:flex;align-items:center;gap:8px;padding:12px 13px;background:transparent;border:none;
  border-bottom:1px solid var(--line);color:var(--ink-strong);font-size:14px;cursor:pointer;text-align:left;transition:background .12s}
.mpk-item:last-child{border-bottom:none}
.mpk-item:active,.mpk-item.on{background:rgba(217,179,106,.1)}
.mpk-il{flex:1;min-width:0}
.mpk-in{font-size:11px;color:var(--ink-mid);flex:none}
.mpk-ck{color:var(--gold);font-size:13px;flex:none}
.ai-modelpick{margin:0 0 12px}
.idf-ground{margin-bottom:18px}
.idf-switch{display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-size:12.5px;color:var(--ink-strong);line-height:1.5}
.idf-switch input{margin-top:2px;width:16px;height:16px;accent-color:var(--gold);flex:none}
.idf-switch input:disabled{opacity:.4;cursor:not-allowed}
.idf-modelnote{text-align:center;font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;color:var(--ink-mid);margin:0 0 12px}
.idf-ai{margin:2px 2px 14px}
.idf-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}
.idf-chip{padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);
  color:var(--ink-strong);font-size:12.5px;cursor:pointer;transition:all .15s;text-align:left}
.idf-chip:active{transform:scale(.98)}
.idf-chip:hover{border-color:var(--gold);color:var(--gold)}
.idf-sub{font-size:11px;letter-spacing:.1em;color:var(--ink-mid);margin:8px 2px 8px}
.idf-cands{display:flex;flex-direction:column;gap:6px;margin-bottom:8px}
.idf-conf{font-style:normal;color:var(--gold);font-size:12px;margin-left:4px}
.idf-manual{margin-top:14px;border-top:1px solid var(--line);padding-top:8px}
.idf-hints{margin-bottom:18px;display:flex;flex-direction:column;gap:12px}
.idf-field{display:flex;flex-direction:column;gap:5px}
.idf-field>span{font-size:11.5px;color:var(--ink-mid);letter-spacing:.02em}
.idf-field select,.idf-field input{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink-strong);font-size:14px}
.idf-unis{display:flex;flex-wrap:wrap;gap:8px}
.idf-ubtn{flex:1 1 0;min-width:52px;padding:11px 0;border:1px solid var(--line);border-radius:8px;background:var(--panel);
  color:var(--ink-mid);font-size:14px;font-family:var(--serif);cursor:pointer;transition:all .15s}
.idf-ubtn.on{border-color:var(--gold);color:var(--gold);background:rgba(217,179,106,.12)}
.idf-gfilter{display:flex;align-items:center;gap:10px;margin:2px 2px 12px;flex-wrap:wrap}
.idf-gfilter>span{font-size:11.5px;color:var(--ink-mid)}
.idf-grades{display:flex;flex-wrap:wrap;gap:6px}
.idf-gbtn{padding:6px 12px;border:1px solid var(--line);border-radius:7px;background:var(--panel);color:var(--ink-mid);font-size:12.5px;cursor:pointer;transition:all .15s}
.idf-gbtn.on{border-color:var(--gold);color:var(--gold);background:rgba(217,179,106,.1)}

/* ── クイズ ── */
.quiz-bg{position:fixed;inset:0;z-index:120;background:var(--bg2);display:flex;flex-direction:column;
  padding:calc(env(safe-area-inset-top) + 20px) 16px calc(env(safe-area-inset-bottom) + 20px);
  animation:quizIn .2s ease-out both}
@keyframes quizIn{from{opacity:0}to{opacity:1}}
.quiz-wrap{width:100%;max-width:520px;margin:0 auto;flex:1;display:flex;flex-direction:column;min-height:0}
.quiz-eyebrow{font-size:11px;letter-spacing:.18em;color:var(--ink-mid)}
.quiz-config,.quiz-result{margin:auto 0}
.quiz-h{font-family:var(--serif);font-size:30px;color:var(--ink-strong);margin:6px 0 10px;font-weight:600}
.quiz-h em{font-style:normal;color:var(--gold)}
.quiz-lead{font-size:13px;color:var(--ink-mid);line-height:1.7;margin-bottom:26px}
.quiz-count{font-size:12px;color:var(--ink-mid);letter-spacing:.1em;margin-bottom:10px}
.quiz-count-row{display:flex;gap:10px}
.quiz-cbtn{flex:1;padding:16px 0;border:1px solid var(--line);border-radius:11px;background:var(--panel);
  color:var(--ink-strong);font-family:var(--serif);font-size:17px;cursor:pointer;transition:all .15s}
.quiz-cbtn:active{transform:scale(.98)}
.quiz-cbtn:hover{border-color:var(--gold);color:var(--gold)}
.quiz-best{margin-top:22px;font-size:12px;color:var(--ink-mid);letter-spacing:.04em}
.quiz-close{margin-top:26px;align-self:flex-start;font-size:13px;color:var(--ink-mid);
  border-bottom:1px dashed var(--line);padding-bottom:1px;cursor:pointer}
.quiz-play{flex:1;display:flex;flex-direction:column;min-height:0}
.quiz-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.quiz-prog{font-family:var(--serif);font-size:15px;color:var(--ink-strong)}
.quiz-sc{font-size:11.5px;color:var(--ink-mid);letter-spacing:.04em}
.quiz-abort{margin-left:auto;font-size:12px;color:var(--ink-mid);border:1px solid var(--line);
  border-radius:7px;padding:6px 12px;cursor:pointer}
.quiz-abort:active{transform:scale(.97)}
.quiz-timer{height:5px;border-radius:3px;background:var(--line);overflow:hidden;margin-bottom:26px}
.quiz-timer-fill{display:block;height:100%;background:var(--gold);transition:width .12s linear}
.quiz-timer-fill.low{background:#d96b5e}
.quiz-q{font-family:var(--serif);font-size:21px;line-height:1.6;color:var(--ink-strong);margin-bottom:22px}
.quiz-opts{display:flex;flex-direction:column;gap:11px}
.quiz-opt{width:100%;text-align:left;padding:16px 18px;border:1px solid var(--line);border-radius:11px;
  background:var(--panel);color:var(--ink-strong);font-size:17.5px;cursor:pointer;transition:all .15s}
.quiz-opt:not(:disabled):active{transform:scale(.99)}
.quiz-opt:not(:disabled):hover{border-color:var(--gold)}
.quiz-opt.correct{border-color:#6fb98f;background:rgba(111,185,143,.16)}
.quiz-opt.wrong{border-color:#d96b5e;background:rgba(217,107,94,.13)}
.quiz-opt.dim{opacity:.42}
.quiz-fb{margin-top:auto;padding-top:18px}
.quiz-fb-mark{font-family:var(--serif);font-size:18px;margin-bottom:6px}
.quiz-fb.ok .quiz-fb-mark{color:#6fb98f}
.quiz-fb.ng .quiz-fb-mark{color:#d96b5e}
.quiz-fb-ex{font-size:12.5px;color:var(--ink-mid);line-height:1.6;margin-bottom:14px}
.quiz-next{width:100%;padding:15px 0;border-radius:11px;border:none;background:var(--gold);
  color:#1b1b1b;font-family:var(--serif);font-size:16px;cursor:pointer}
.quiz-next:active{transform:scale(.99)}
.quiz-result{text-align:center}
.quiz-score{font-family:var(--serif);font-size:64px;color:var(--gold);line-height:1}
.quiz-score span{font-size:26px;color:var(--ink-mid)}
.quiz-rate{margin-top:12px;font-size:14px;color:var(--ink-strong)}
.quiz-res-btns{display:flex;gap:10px;margin-top:30px;justify-content:center;align-items:center}
.quiz-res-btns .quiz-cbtn{flex:0 1 160px}
.quiz-res-btns .quiz-close{margin-top:0;align-self:center}
.quiz-entry{margin-left:auto;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);
  border-radius:8px;padding:7px 13px;background:var(--panel);color:var(--gold);font-family:var(--serif);
  font-size:13px;cursor:pointer;transition:all .15s}
.quiz-entry:active{transform:scale(.97)}
.quiz-entry:hover{border-color:var(--gold)}
.quiz-entry i{font-style:normal;font-size:11px;opacity:.85}
.quiz-chip{flex:1;padding:12px 0;border:1px solid var(--line);border-radius:9px;background:var(--panel);
  color:var(--ink-mid);font-size:14px;cursor:pointer;transition:all .15s}
.quiz-chip.on{border-color:var(--gold);color:var(--gold);background:rgba(217,179,106,.1)}
.quiz-chip.off{opacity:.4;cursor:not-allowed}
.quiz-note{margin-top:10px;font-size:11.5px;color:var(--ink-mid);line-height:1.6}
.quiz-config .quiz-count-row + .quiz-count{margin-top:22px}
.quiz-opt.on{border-color:var(--gold);background:rgba(217,179,106,.12)}
.quiz-decide{width:100%;margin-top:14px;padding:13px 0;border-radius:11px;border:1px solid var(--gold);
  background:transparent;color:var(--gold);font-family:var(--serif);font-size:15px;cursor:pointer}
.quiz-decide:active{transform:scale(.99)}
.quiz-cats{display:flex;flex-wrap:wrap;gap:8px}
.quiz-cats .quiz-chip{flex:1 1 28%;min-width:0}
.quiz-media{width:100%;max-width:300px;aspect-ratio:1;margin:0 auto 18px;border:1px solid var(--line);
  border-radius:12px;overflow:hidden;background:#0c0c0c}
.quiz-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s ease}
/* 無限モード入口 */
.quiz-inf{width:100%;margin:4px 0 24px;padding:18px 20px;border-radius:13px;border:1px solid var(--gold);
  background:linear-gradient(135deg,rgba(217,179,106,.16),rgba(217,179,106,.04));color:var(--gold);
  font-family:var(--serif);font-size:20px;cursor:pointer;display:flex;flex-direction:column;gap:4px;align-items:flex-start;transition:all .15s}
.quiz-inf:active{transform:scale(.99)}
.quiz-inf span{font-size:11.5px;color:var(--ink-mid);letter-spacing:.04em;font-family:inherit}
/* 番付(排行榜) */
.quiz-board{margin-top:24px;border-top:1px solid var(--line);padding-top:16px}
.quiz-board-h{font-family:var(--serif);font-size:15px;color:var(--ink-strong);margin-bottom:12px;display:flex;align-items:baseline;gap:8px}
.quiz-board-h span{font-size:10px;letter-spacing:.18em;color:var(--ink-mid)}
.qb-row{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:8px;margin-bottom:5px;background:var(--panel);border:1px solid transparent}
.qb-rank{font-family:var(--serif);font-size:14px;color:var(--ink-mid);min-width:22px;text-align:center}
.qb-name{flex:1;font-size:13.5px;color:var(--ink-strong);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qb-count{font-family:var(--serif);font-size:16px;color:var(--ink-strong)}
.qb-count i{font-style:normal;font-size:11px;color:var(--ink-mid);margin-left:2px}
.qb-row.top{border-color:var(--line)}
.qb-row.top1{background:linear-gradient(100deg,rgba(217,179,106,.22),rgba(217,179,106,.05));border-color:var(--gold)}
.qb-row.top1 .qb-rank,.qb-row.top1 .qb-count{color:var(--gold)}
.qb-row.top1 .qb-name{color:var(--gold)}
.qb-row.top2{background:rgba(190,196,204,.12);border-color:rgba(190,196,204,.5)}
.qb-row.top2 .qb-rank,.qb-row.top2 .qb-count{color:#c2c8d0}
.qb-row.top3{background:rgba(198,140,92,.12);border-color:rgba(198,140,92,.5)}
.qb-row.top3 .qb-rank,.qb-row.top3 .qb-count{color:#c88c5c}
/* 結果リデザイン */
.quiz-result{text-align:center}
.qr-badge{display:inline-block;margin:0 auto 18px;padding:6px 22px;border-radius:999px;border:1px solid var(--line);
  font-family:var(--serif);font-size:18px;color:var(--ink-mid);letter-spacing:.1em}
.qr-badge.gold{border-color:var(--gold);color:var(--gold);background:rgba(217,179,106,.1)}
.qr-badge.silver{border-color:rgba(190,196,204,.6);color:#c2c8d0;background:rgba(190,196,204,.08)}
.qr-badge.bronze{border-color:rgba(198,140,92,.6);color:#c88c5c;background:rgba(198,140,92,.08)}
.qr-ring{width:188px;height:188px;margin:0 auto 16px;border-radius:50%;border:2px solid var(--gold);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:radial-gradient(circle,rgba(217,179,106,.08),transparent 70%);box-shadow:0 0 0 6px rgba(217,179,106,.06)}
.qr-big{font-family:var(--serif);font-size:74px;line-height:1;color:var(--gold)}
.qr-unit{font-size:14px;color:var(--ink-mid);margin-top:4px}
.qr-rank{font-family:var(--serif);font-size:17px;color:var(--ink-strong);margin-bottom:6px}
.qr-rank.top{color:var(--gold)}
.qr-new{font-family:var(--serif);font-size:16px;color:var(--gold);letter-spacing:.12em;margin-bottom:10px;animation:qrNew 1.6s ease-in-out infinite}
@keyframes qrNew{0%,100%{opacity:1}50%{opacity:.45}}
.search-modal-bg{z-index:60;align-items:flex-start;justify-content:center;padding:12vh 14px 0}
.search-modal-bg .modal{margin:0;max-height:74vh}
.search-go{flex:none;width:46px;display:flex;align-items:center;justify-content:center;border:1px solid var(--gold);border-radius:8px;background:rgba(217,179,106,.08);color:var(--gold);cursor:pointer;transition:transform .12s,background .15s}
.search-go:active{transform:scale(.92);background:rgba(217,179,106,.2)}
.search-go svg{width:18px;height:18px;display:block}
.sm-hits{margin-top:10px;max-height:46vh;overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:6px}
.sm-hit{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:10px 12px;cursor:pointer;transition:border-color .14s,background .14s,transform .1s}
.sm-hit:active{transform:scale(.99);border-color:var(--gold);background:var(--panel2)}
.sm-hit-name{font-family:var(--serif);font-size:14px;color:var(--ink-strong);line-height:1.3}
.sm-hit-sub{font-size:11px;color:var(--ink-mid);letter-spacing:.02em;font-family:ui-monospace,"SF Mono",Menlo,monospace}
.sm-empty{padding:18px 4px;text-align:center;font-size:12.5px;color:var(--ink-mid)}
.sm-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:12px}
.sm-title{font-family:var(--serif);font-weight:800;font-size:19px;color:var(--ink-strong);letter-spacing:.04em}
.sm-title em{font-style:normal;color:var(--gold)}
.sm-eyebrow{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;letter-spacing:.26em;color:var(--ink-dim);text-transform:uppercase;margin-left:4px}
.search-modal .toolbar{padding:0 0 10px}
.search-modal .adv-panel{margin-top:2px}
.search-modal .drawer-sub{padding:10px 0 0}
.av-drop{display:grid;grid-template-rows:0fr;opacity:0;margin-top:0;transition:grid-template-rows .32s cubic-bezier(.4,0,.2,1),opacity .24s,margin-top .32s}
.av-drop.open{grid-template-rows:1fr;opacity:1;margin-top:12px;margin-bottom:2px}
.av-drop-inner{overflow:hidden;min-height:0}
.av-unitabs{display:flex;flex-wrap:wrap;gap:9px 20px;padding-bottom:10px;border-bottom:1px solid var(--line)}
.av-unitab{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:11px;letter-spacing:.16em;color:var(--ink-dim);background:none;border:none;padding:2px 0 7px;position:relative;cursor:pointer}
.av-unitab.on{color:var(--gold)}
.av-unitab.on::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1.5px;background:var(--gold)}
.av-unitab.empty{opacity:.4}
.av-reg{display:flex;flex-direction:column;margin-top:6px}
.av-entry{position:relative;display:flex;gap:15px;align-items:flex-start;width:100%;background:none;border:none;border-bottom:1px solid var(--line);padding:16px 2px;text-align:left;cursor:pointer}
.av-entry:last-child{border-bottom:none}
.av-entry:active{background:rgba(217,179,106,.03)}
.av-entry.pop{animation:achvPop .45s ease}
.av-medal{flex:none;width:60px;height:60px;display:flex;align-items:center;justify-content:center}
.av-medal svg{width:100%;height:100%;display:block}
.av-medal.gold svg,.av-medal.silver svg{filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
.av-emblem{width:100%;height:100%;display:block}
.av-emblem .m{fill:currentColor}
.av-emblem .s{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.av-emblem .s2{fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.av-emblem .gl{fill:none;stroke:currentColor;stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
.av-emblem.fin-gold{color:#e6c478}
.av-emblem.fin-silver{color:#cfd6df}
.av-emblem.fin-ghost{color:#6f6d67}
.av-emblem .cal{font-family:'Lugrasimo','Lucida Calligraphy','Monotype Corsiva','Apple Chancery','Snell Roundhand','URW Chancery L',cursive}
.av-emblem .cmath{font-family:'STIX Two Math','Cambria Math','Cambria','Latin Modern Math','Times New Roman',serif}
.av-emblem .qm{font-family:var(--serif);font-weight:700}
/* 画像なしプレースホルダーの世界観エンブレム透かし */
.series-wm-box{display:flex;align-items:center;justify-content:center;background:var(--panel2);overflow:hidden}
.series-wm-box.wm-list{width:100%;height:100%}
.series-wm{opacity:.5;display:block}
.series-wm-box.wm-grid .series-wm{width:73%;height:73%}
.series-wm-box.wm-list .series-wm{width:78%;height:78%}
.av-medal.locked{opacity:.42}
.av-ebody{flex:1;min-width:0;display:flex;flex-direction:column;padding-top:2px}
.av-eno{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9.5px;letter-spacing:.20em;color:var(--ink-dim);text-transform:uppercase}
.av-ename{font-family:var(--serif);font-weight:700;font-size:20px;line-height:1.3;color:var(--ink-strong);margin-top:3px}
.av-entry.locked .av-ename,.av-entry.todo .av-ename{color:var(--ink-mid)}
.av-ehair{height:1px;width:40px;background:rgba(217,179,106,.24);margin:9px 0 8px}
.av-eflavor{font-size:11.5px;color:var(--ink-mid);line-height:1.65}
.av-eprog{display:flex;align-items:center;gap:10px;margin-top:9px}
.av-ebar{flex:1;max-width:180px;height:2px;background:var(--line);border-radius:2px;overflow:hidden}
.av-ebar i{display:block;height:100%;background:linear-gradient(90deg,#9c7838,var(--gold))}
.av-erem{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;letter-spacing:.1em;color:var(--ink-mid)}
.av-etag{font-family:var(--serif);font-style:italic;font-size:12px;color:var(--gold);margin-top:9px;letter-spacing:.03em}
.av-etag.locked{font-style:normal;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.14em;color:var(--ink-dim)}
.av-dot{position:absolute;top:14px;right:2px;width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 7px rgba(217,179,106,.7);animation:dotPulse 1.6s ease-in-out infinite}
.av-empty{text-align:center;color:var(--ink-dim);font-size:12px;font-family:var(--serif);padding:34px 0;letter-spacing:.08em}
/* 叙勲トースト */
.av-toast{position:fixed;left:10px;right:10px;top:calc(env(safe-area-inset-top) + 10px);z-index:99997;max-width:520px;margin:0 auto;display:flex;gap:14px;align-items:center;text-align:left;
  background:linear-gradient(120deg,rgba(34,29,18,.93),rgba(15,18,26,.95));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(217,179,106,.32);border-radius:4px;padding:13px 15px;overflow:hidden;
  box-shadow:0 10px 34px rgba(0,0,0,.55);animation:ttIn .42s cubic-bezier(.2,.9,.3,1.15)}
.av-toast::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(#f2dca0,#9c7838)}
.av-toast-medal{flex:none;width:46px;height:46px}.av-toast-medal svg{width:100%;height:100%;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}
.av-toast-body{flex:1;min-width:0}
.av-toast-kick{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;letter-spacing:.30em;color:var(--gold);text-transform:uppercase}
.av-toast-name{font-family:var(--serif);font-weight:800;font-size:17px;color:var(--ink-strong);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.av-toast-more{flex:none;align-self:flex-start;font-family:ui-monospace,monospace;font-size:10px;font-weight:700;color:var(--gold);border:1px solid rgba(217,179,106,.24);border-radius:2px;padding:1px 7px}
/* 条件モーダルを金箔編目へ(tm-* 上書き) */
.title-modal .tm-head{align-items:center}
.av-medal.big{width:84px;height:84px}
.tm-name{font-size:25px}
.tm-piece{background:none;border:none;border-bottom:1px solid var(--line);border-radius:0;padding:13px 2px}
.tm-piece.ok{background:none}
.tm-piece.ok .tm-mark{color:var(--gold)}
.tm-piece.miss .tm-mark{color:var(--ink-dim)}
.tm-mark{color:var(--ink-dim)}
.tm-cnt{color:var(--gold)}
.tm-tag.own{border-color:rgba(217,179,106,.30);color:var(--gold)}
.tm-cand.row{background:none;border:none;border-bottom:1px solid var(--line);border-radius:0;padding:11px 2px}
.tm-cand.row.ok .tm-cn{color:var(--ink-strong)}
.tm-countbar b{color:var(--gold)}
.tm-grd.on{border-color:rgba(217,179,106,.30);color:var(--gold);background:rgba(217,179,106,.08)}
.title-need{color:var(--gold)}
/* ═══ 図鑑 編目カード/リスト(金箔) ═══ */
.kz-card{position:relative;display:flex;flex-direction:column;background:var(--panel);border:1px solid var(--line);border-radius:3px;padding:11px 11px 10px;text-align:left;overflow:hidden;content-visibility:auto;contain-intrinsic-size:172px 190px;transition:border-color .12s,transform .12s}
.kz-card:active{transform:scale(.985)}
.kz-card.owned{border-color:rgba(217,179,106,.26)}
.kz-card.owned::before{content:"";position:absolute;left:0;top:0;width:100%;height:2px;background:linear-gradient(90deg,#9c7838,#d9b36a,transparent);z-index:1}
.kz-card.dim{opacity:.5}
.kz-no{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:9px;letter-spacing:.18em;color:var(--ink-dim);text-transform:uppercase;margin-bottom:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kz-frame{position:relative;display:flex;align-items:center;justify-content:center;min-height:90px;padding:4px 0}
.kz-card.compact .kz-frame{min-height:64px}
.kz-name{font-family:var(--serif);font-weight:700;font-size:14px;line-height:1.4;color:var(--ink-strong);margin-top:10px;min-height:2.5em}
.kz-card.compact .kz-name{font-size:12px;min-height:2.4em;margin-top:7px}
.kz-card.dim .kz-name{color:var(--ink-mid)}
.kz-hair{height:1px;width:32px;background:rgba(217,179,106,.24);margin:8px 0}
.kz-card.dim .kz-hair{background:var(--line)}
.kz-meta{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.kz-year{font-family:var(--serif);font-size:11px;color:var(--gold);letter-spacing:.04em}
.kz-price{font-family:ui-monospace,monospace;font-size:9.5px;color:var(--ink-mid)}
.kz-series{font-size:9.5px;color:var(--ink-dim);margin-top:6px;letter-spacing:.04em}

/* ── 繪測(SALON)ギャラリー:画像主役・2列/3列で動的拡縮 ── */
.salon-grid{display:grid;gap:14px;transition:gap .28s ease}
.salon-grid.cols-2{grid-template-columns:repeat(2,1fr)}
.salon-grid.cols-3{grid-template-columns:repeat(3,1fr);column-gap:9px}
.sl-card{position:relative;border:1px solid var(--line-soft);border-radius:12px;overflow:hidden;text-align:left;
  background:linear-gradient(180deg,var(--panel) 0%,var(--bg2) 100%);display:flex;flex-direction:column;
  transition:transform .18s cubic-bezier(.34,1.56,.64,1),border-color .2s,box-shadow .2s}
.sl-card:active{transform:scale(.975)}
.sl-card.dim{opacity:.5}
.sl-card.owned{border-color:rgba(232,85,61,.32)}
.sl-card.built{border-color:rgba(217,179,106,.4);box-shadow:0 0 0 1px rgba(217,179,106,.12),0 6px 20px -8px rgba(217,179,106,.25)}
.sl-frame{position:relative;width:100%;overflow:hidden;background:#0a0d13;transition:aspect-ratio .3s ease}
.salon-grid.cols-2 .sl-frame{aspect-ratio:4/5}
.salon-grid.cols-3 .sl-frame{aspect-ratio:3/4}
.sl-img{width:100%;height:100%;display:block;transform-origin:center center}
.salon-grid.fit-cover .sl-img{object-fit:cover}
.salon-grid.fit-contain .sl-img{object-fit:contain}
.sl-frame::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(0,0,0,.16) 0%,transparent 22%,transparent 66%,rgba(0,0,0,.3) 100%)}
.sl-frame .series-wm-box{position:absolute;inset:0}
.sl-grade{position:absolute;top:0;left:0;z-index:2;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-weight:700;
  letter-spacing:.12em;color:var(--ink-strong);background:rgba(13,16,24,.72);
  border:1px solid var(--line);border-top:none;border-left:none;border-bottom-right-radius:8px}
.salon-grid.cols-2 .sl-grade{font-size:10px;padding:5px 9px}
.salon-grid.cols-3 .sl-grade{font-size:8.5px;padding:3.5px 7px}
.sl-seal{position:absolute;top:8px;right:8px;z-index:2;display:flex;align-items:center;justify-content:center;
  border-radius:50%;font-family:var(--serif);font-weight:700}
.sl-seal.built{background:var(--gold);color:#1a160d}
.sl-seal.plan{border:1.4px solid var(--kin-deep);color:var(--gold)}
.salon-grid.cols-2 .sl-seal{width:26px;height:26px;font-size:13px}
.salon-grid.cols-3 .sl-seal{width:20px;height:20px;font-size:10px}
.sl-chip{position:absolute;z-index:2;left:8px;bottom:8px;top:auto}
.sl-body{padding:11px 12px 12px;transition:padding .26s ease}
.salon-grid.cols-3 .sl-body{padding:8px 9px 10px}
.sl-name{display:flex;align-items:flex-start;justify-content:center;overflow:hidden;text-align:center}
.salon-grid.cols-2 .sl-name{height:50px}
.salon-grid.cols-3 .sl-name{height:42px}
.sl-name-fit{display:block;width:100%;font-family:var(--serif);font-weight:700;color:var(--ink-strong);line-height:1.18;word-break:break-word}
.sl-meta{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:7px}
.sl-meta .kz-year,.sl-meta .kz-price{transition:font-size .26s ease}
.salon-grid.cols-3 .sl-meta .kz-year{font-size:10px}
.salon-grid.cols-3 .sl-meta .kz-price{font-size:8.5px}
.sl-uni{margin-left:auto;font-family:ui-monospace,monospace;font-weight:700;letter-spacing:.08em;
  color:var(--ink-dim);border:1px solid var(--line);border-radius:5px;padding:1.5px 6px}
.salon-grid.cols-2 .sl-uni{font-size:9px}
.salon-grid.cols-3 .sl-uni{font-size:7.5px;padding:1px 4px}
.salon-ctrl{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.salon-seg button{padding:7px 11px}
@media (min-width:768px){
  .salon-grid.cols-2 .sl-name{height:64px}
  .salon-grid.cols-3 .sl-name{height:54px}
}
.kz-seal{position:absolute;top:9px;right:9px;z-index:3;font-family:var(--serif);font-weight:800;font-size:12px;line-height:1;color:var(--gold);border:1.4px solid rgba(217,179,106,.55);background:rgba(217,179,106,.1);border-radius:2px;padding:5px 4px;writing-mode:vertical-rl;letter-spacing:.1em;box-shadow:0 1px 2px rgba(0,0,0,.4)}
.kz-plan{position:absolute;top:9px;right:9px;z-index:3;font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:var(--gold);border:1px dashed var(--gold);background:rgba(217,179,106,.05);border-radius:2px;padding:4px 5px;writing-mode:vertical-rl;letter-spacing:.06em}
/* リスト */
/* 左スワイプで「入手」「予定」アクションを表示(CSSスクロールスナップ) */
.kz-rowscroll{display:block}
.kz-row{position:relative;display:flex;gap:15px;align-items:center;width:100%;background:none;border:none;border-bottom:1px solid var(--line);padding:15px 2px;text-align:left;transition:background .12s}
.kz-row:active{background:rgba(217,179,106,.03)}
.kz-row.dim{opacity:.5}
.kz-rframe{flex:none;width:88px;height:88px;border:1px solid var(--line);border-radius:3px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#1b212e,#13171f)}
.kz-rframe img,.kz-rframe .kit-img,.kz-rframe svg{width:100%;height:100%;object-fit:cover}
.kz-uni{width:100%;height:100%;background:#0a0d13;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 16px 4px rgba(0,0,0,.5)}
.kz-uni span{font-family:var(--mono);font-size:8px;letter-spacing:.16em;color:#4a5263;text-align:center}
.kz-row.owned .kz-rframe{border-color:rgba(217,179,106,.24)}
.kz-rmain{flex:1;min-width:0}
.kz-rno{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;letter-spacing:.18em;color:var(--ink-dim);text-transform:uppercase}
.kz-rseries{font-size:9.5px;color:var(--ink-dim);letter-spacing:.04em;margin-top:2px}
.kz-rname{font-family:var(--serif);font-weight:700;font-size:23px;color:var(--ink-strong);margin-top:3px;line-height:1.28}
.kz-row.dim .kz-rname{color:var(--ink-mid)}
.kz-rmeta{display:flex;gap:11px;align-items:center;margin-top:7px;flex-wrap:wrap}
.kz-rmeta .kz-year{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-weight:600;font-size:12.5px;letter-spacing:.02em}
.kz-rmeta .kz-price{font-size:12.5px;letter-spacing:.01em}
.kz-date{font-size:10.5px}
.kz-rseal,.kz-rplan{font-size:13px;padding:6px 4px}
.kz-date{font-family:ui-monospace,monospace;font-size:9.5px;letter-spacing:.05em;color:var(--ink-mid)}
.kz-date.done{color:var(--gold)}
.kz-rseal{flex:none;font-family:var(--serif);font-weight:800;font-size:12px;line-height:1;color:var(--gold);border:1.4px solid rgba(217,179,106,.55);background:rgba(217,179,106,.1);border-radius:2px;padding:5px 4px;writing-mode:vertical-rl;letter-spacing:.1em}
.kz-rplan{flex:none;font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:var(--gold);border:1px dashed var(--gold);background:rgba(217,179,106,.05);border-radius:2px;padding:4px 5px;writing-mode:vertical-rl;letter-spacing:.06em}
/* ═══ 入手頁(機密档案) ═══ */
.dc-head{padding:2px 0 0}
.dc-modal{position:relative;scrollbar-gutter:stable}
.dc-x{position:absolute;top:11px;right:11px;z-index:8;width:30px;height:30px;display:flex;align-items:center;justify-content:center;color:var(--ink-dim);font-size:15px;line-height:1;border-radius:8px;background:rgba(8,10,14,.5);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid var(--hair)}
.dc-x:active{background:rgba(255,255,255,.07);color:var(--ink-strong);transform:scale(.92)}
.dc-eye{font-family:var(--mono);font-size:9.5px;letter-spacing:.22em;color:var(--ink-mid);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dc-name{font-family:var(--serif);font-weight:800;font-size:25px;line-height:1.25;color:var(--ink-strong);margin-top:6px}
.dc-rule{height:1px;margin:13px 0 0;background:linear-gradient(90deg,var(--gold),rgba(217,179,106,.05) 75%,transparent)}
.dc-art{position:relative;margin-top:15px;aspect-ratio:1;border:1px solid var(--line);border-radius:3px;overflow:hidden;padding:2px;background:linear-gradient(160deg,#1b212e,#13171f);display:flex;align-items:center;justify-content:center}
.dc-art.owned{border-color:var(--hair)}
.dc-frame{width:100%;height:100%;display:flex;align-items:center;justify-content:center;cursor:zoom-in;position:relative}
.dc-frame .kit-img.tc{width:100%;height:100%;object-fit:cover}
.dc-frame-btn{position:absolute;bottom:9px;right:9px;z-index:4;display:inline-flex;align-items:center;font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;color:var(--gold);background:rgba(13,16,24,.72);border:1px solid var(--hair);border-radius:2px;padding:5px 10px;cursor:pointer}
.dc-seal{position:absolute;top:11px;right:11px;z-index:4;transform:rotate(-5deg);font-family:var(--serif);font-weight:800;writing-mode:vertical-rl;font-size:13px;letter-spacing:.12em;color:#c8503a;border:2px solid #c8503a;border-radius:2px;padding:8px 5px;background:rgba(200,80,58,.08);box-shadow:0 0 0 1px rgba(200,80,58,.12)}
.dc-plan{position:absolute;top:11px;right:11px;z-index:4;font-family:var(--mono);font-size:12px;font-weight:700;color:var(--gold);border:1px dashed var(--gold);background:rgba(217,179,106,.05);border-radius:2px;padding:5px 6px;writing-mode:vertical-rl;letter-spacing:.06em}
.dc-classified{position:relative;width:100%;height:100%;background:#0a0d13;box-shadow:inset 0 0 34px 10px rgba(0,0,0,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px}
.dc-classified::before{content:"";position:absolute;left:14%;right:14%;top:24%;height:8px;background:repeating-linear-gradient(90deg,#2a3042 0 9px,transparent 9px 14px)}
.dc-tick{position:absolute;width:11px;height:11px;border:1px solid #39414f}
.dc-tick.tl{top:9px;left:9px;border-right:none;border-bottom:none}.dc-tick.tr{top:9px;right:9px;border-left:none;border-bottom:none}
.dc-tick.bl{bottom:9px;left:9px;border-right:none;border-top:none}.dc-tick.br{bottom:9px;right:9px;border-left:none;border-top:none}
.dc-unid{font-family:var(--mono);font-weight:700;letter-spacing:.36em;color:#5b6273;font-size:16px;text-indent:.36em}
.dc-unsub{font-family:var(--mono);font-size:9px;letter-spacing:.22em;color:#3c4452}
.dc-unref{position:absolute;bottom:11px;font-family:var(--mono);font-size:8px;letter-spacing:.18em;color:#3c4452}
.dc-spec{margin-top:15px}
.dc-srow{display:flex;align-items:baseline;gap:14px;padding:11px 0;border-bottom:1px solid var(--line)}
.dc-k{flex:none;width:64px;font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;color:var(--ink-dim);text-transform:uppercase}
.dc-v{flex:1;font-size:13.5px;color:var(--ink-strong);min-width:0}
.dc-v.dc-tags{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.dc-gold{color:var(--gold);font-family:ui-monospace,"SF Mono",Menlo,monospace;font-weight:600;font-size:12.5px;letter-spacing:.02em}
.dc-mono{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:12.5px;letter-spacing:.01em;color:var(--ink-mid)}.dc-mono.done{color:var(--gold)}
.dc-memo{font-size:12.5px;color:var(--ink-mid);line-height:1.7;cursor:text;display:block;width:100%}
.dc-srow-memo{align-items:flex-start}
.dc-srow-memo .dc-k{padding-top:3px}
.dc-memo-edit{width:100%;background:var(--bg2);border:1px solid rgba(217,179,106,.4);border-radius:4px;padding:8px 10px;color:var(--ink);font-family:inherit;font-size:12.5px;line-height:1.6;resize:vertical}
.dc-memo-edit:focus{outline:none;border-color:rgba(217,179,106,.65)}
.dc-locked{display:flex;flex-direction:column;align-items:center;gap:5px;width:100%;margin-top:15px;padding:22px;background:linear-gradient(160deg,rgba(11,14,20,.6),var(--panel));border:1px dashed var(--line);border-radius:3px;cursor:pointer}
.dc-locked-t{font-family:var(--mono);font-size:11px;letter-spacing:.24em;color:var(--ink-mid)}
.dc-locked-s{font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--ink-dim)}
/* 入手頁 既存classの金上書き */
.own-btn.owned{border:1.5px solid var(--gold);color:#1a160d;background:linear-gradient(160deg,#f2dca0,#d9b36a)}
.own-btn.planned{border:1.5px solid var(--gold);color:var(--gold);background:rgba(217,179,106,.06)}
.edit-link{font-family:var(--mono);letter-spacing:.1em}
.kt-chip{background:rgba(217,179,106,.05);border:1px solid var(--hair);border-radius:3px;color:var(--ink-strong)}
.kt-chip .kt-x{color:var(--gold)}
.kt-addbtn{background:rgba(217,179,106,.1);border:1px solid rgba(217,179,106,.4);color:var(--gold);border-radius:3px}
.kt-qchip{border-radius:3px}
.kt-tags-head{font-family:var(--mono);letter-spacing:.18em}
/* ═══ 編輯頁(KitForm) 金箔 ═══ */
.form .f-sec{font-family:var(--serif);font-weight:700;font-size:14px;color:var(--ink-strong);margin:21px 0 12px;display:flex;align-items:baseline;gap:9px;padding-bottom:7px;border-bottom:1px solid var(--hair)}
.form .f-sec:first-child{margin-top:2px}
.form .f-sec span{font-family:var(--mono);font-size:8.5px;letter-spacing:.28em;color:var(--ink-dim);text-transform:uppercase}
.form .fld>span{font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--ink-mid);text-transform:uppercase}
/* ═══ ランナー枠ヘッダー ═══ */
.head .hf{position:relative;border:1.6px solid var(--gold);border-radius:8px;padding:14px 18px 0;background:linear-gradient(160deg,rgba(217,179,106,.05),transparent 58%);cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;transition:transform .14s ease,box-shadow .14s ease}
.head .hf:active{transform:scale(.99);box-shadow:inset 0 3px 11px rgba(0,0,0,.55)}
.head .hf::after{content:"";position:absolute;inset:4px;border:1px solid rgba(217,179,106,.16);border-radius:5px;pointer-events:none;transition:inset .14s ease,border-color .14s ease}
.head .hf:active::after{inset:6px;border-color:rgba(217,179,106,.28)}
.hf-tag{position:absolute;top:-9px;left:15px;background:var(--bg);padding:0 8px;font-family:var(--mono);font-size:9px;letter-spacing:.2em;color:var(--gold);z-index:3}
.hf-part{position:absolute;bottom:-9px;right:15px;background:var(--bg);padding:0 8px;display:flex;align-items:center;gap:5px;font-family:var(--mono);font-size:8.5px;letter-spacing:.16em;color:var(--ink-mid);z-index:3}
.hf-rl{font-style:normal;color:var(--gold);font-size:10px}
.hf-gate{position:absolute;background:var(--gold);opacity:.5;z-index:1}
.hf-gate.gt{top:-1px;width:8px;height:5px;border-radius:0 0 2px 2px}
.hf-gate.gl{left:-1px;width:5px;height:8px;border-radius:0 2px 2px 0}
.hf-top{position:relative;display:flex;align-items:stretch;gap:8px}
.hf-vbar{flex:none;position:relative;margin-left:5px;display:flex;align-items:center;justify-content:center;top:-2px}
.hf-vbar-t{writing-mode:vertical-rl;font-family:var(--serif);font-weight:800;font-size:28px;letter-spacing:.1em;line-height:1.05;background:linear-gradient(180deg,#f2dca0,#b8924a);-webkit-background-clip:text;background-clip:text;color:transparent}
.hf-vbar::before{content:"";position:absolute;left:-7px;top:0;bottom:0;width:1.5px;border-radius:1px;background:linear-gradient(180deg,transparent,rgba(217,179,106,.55) 16%,rgba(217,179,106,.55) 84%,transparent)}
.hf-main{display:flex;align-items:flex-end;gap:14px;min-width:0;flex:1}
.hf-rcol{flex:1;min-width:0}
.hf-eye{font-family:var(--mono);font-size:9px;letter-spacing:.26em;color:var(--ink-mid);text-transform:uppercase}
.hf-title{position:relative;font-family:var(--serif);font-weight:800;font-size:37px;letter-spacing:.02em;color:var(--ink-strong);line-height:.98;margin-top:6px;white-space:nowrap;text-shadow:0 1px 1px rgba(0,0,0,.35)}
.hf-kana{background:linear-gradient(180deg,#f7e6b2,#d4ab5e);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none}
.hf-gateline{position:absolute;left:6%;right:30%;bottom:-9px;height:7px;background:repeating-linear-gradient(90deg,var(--gold) 0 2px,transparent 2px 9px);opacity:.42}
/* ── 提案V2 二欄タイトル(左:CLASSIFIED＋ガンプラ / 右:大図鑑) ── */
.nf-left{flex:none;display:flex;flex-direction:column}
.nf-gunpla{font-family:var(--serif);font-weight:800;font-size:44px;line-height:1;letter-spacing:-1px;color:var(--ink-strong);margin:9px 0 0;white-space:nowrap;text-shadow:0 1px 1px rgba(0,0,0,.35);transform:translateX(-2px)}
.nf-right{position:relative;transform:translateX(-14px)}
.nf-big{font-family:var(--serif);font-weight:800;font-size:56px;line-height:1;letter-spacing:.04em;white-space:nowrap;background:linear-gradient(180deg,#f7e6b2,#d4ab5e);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none}
/* 大図鑑まわりの湯口/ランナー */
.nf-run-top{position:absolute;left:-55px;right:10px;top:-9px;height:5px;background:repeating-linear-gradient(90deg,var(--gold) 0 2px,transparent 2px 9px);opacity:.4}
.nf-run-bot{position:absolute;left:-130px;right:10px;bottom:-9px;height:5px;background:repeating-linear-gradient(90deg,var(--gold) 0 2px,transparent 2px 9px);opacity:.4;transform:translateX(-6px)}
.nf-gate-r{position:absolute;right:-7px;top:50%;width:7px;height:13px;transform:translateY(-50%);background:linear-gradient(90deg,#f7e6b2,#b8924a);opacity:.55;clip-path:polygon(0 24%,100% 0,100% 100%,0 76%)}
.hf-rule{position:relative;height:1px;margin:18px 0 0;background:linear-gradient(90deg,rgba(217,179,106,.3),rgba(217,179,106,.05) 75%,transparent)}
.hf-stats{position:relative;display:flex;align-items:stretch;padding:11px 0 12px}
.hf-stats .s{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;line-height:1}
.hf-stats .s:first-child{align-items:center}
.hf-stats .s:last-child{align-items:center}
.hf-stats b{font-family:var(--serif);font-weight:800;font-size:20px;color:var(--ink-strong);letter-spacing:.02em;font-variant-numeric:tabular-nums}
.hf-stats b.kin{color:var(--kin)}
.hf-stats span{font-family:var(--mono);font-size:8.5px;letter-spacing:.16em;color:var(--ink-dim);margin-top:6px;text-transform:uppercase}
.hf-div{flex:none;width:1px;background:var(--line);align-self:stretch}
.hf-seal{flex:none;align-self:center;position:relative;width:44px;height:44px;margin-right:13px;
  display:flex;align-items:center;justify-content:center;border:1.7px solid #c8503a;border-radius:3px;
  background:rgba(200,80,58,.1);color:#d65a44;font-family:var(--serif);font-weight:800;font-size:25px;
  line-height:1;cursor:pointer;transform:rotate(-3deg);box-shadow:0 0 0 1px rgba(200,80,58,.12);
  transition:transform .14s ease,background .14s ease}
.hf-seal::after{content:"";position:absolute;inset:3px;border:1px solid rgba(200,80,58,.4);border-radius:2px;pointer-events:none}
.hf-seal:active{transform:rotate(-3deg) scale(.92);background:rgba(200,80,58,.22)}
.hf-prog{position:relative;height:3px;margin:0 -18px;border-radius:0 0 7px 7px;overflow:hidden;background:rgba(217,179,106,.1)}
.hf-prog i{display:block;height:100%;background:linear-gradient(90deg,#9c7838,var(--gold));transition:width .5s}
.hf-prog i.kin{background:linear-gradient(90deg,#b88f3e,var(--kin))}
@media (min-width:430px){.hf-title{font-size:46px}.hf-stats b{font-size:20px}}
/* 章徽 常駐微光(金箔glint) */
.av-medal.gold{position:relative;overflow:hidden}
.av-medal.gold::after{content:"";position:absolute;top:-10%;bottom:-10%;left:0;width:60%;background:linear-gradient(115deg,transparent 42%,rgba(242,220,160,.55) 50%,transparent 58%);transform:translateX(-150%);pointer-events:none;animation:medalGlint 6s ease-in-out infinite}
@keyframes medalGlint{0%,84%{transform:translateX(-150%)}93%{transform:translateX(230%)}100%{transform:translateX(230%)}}
.av-entry:nth-child(3n) .av-medal.gold::after{animation-delay:2s}
.av-entry:nth-child(3n+1) .av-medal.gold::after{animation-delay:4s}
/* ═══ モーションA(CSS) ═══ */
@keyframes fxIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
/* 初表示カスケード(先頭12のみ) */
.grid-wrap .kz-card:nth-child(-n+12),.list-wrap .kz-rowscroll:nth-child(-n+12){animation:fxIn .42s ease-out backwards}
.grid-wrap .kz-card:nth-child(1),.list-wrap .kz-rowscroll:nth-child(1){animation-delay:.02s}
.grid-wrap .kz-card:nth-child(2),.list-wrap .kz-rowscroll:nth-child(2){animation-delay:.05s}
.grid-wrap .kz-card:nth-child(3),.list-wrap .kz-rowscroll:nth-child(3){animation-delay:.08s}
.grid-wrap .kz-card:nth-child(4),.list-wrap .kz-rowscroll:nth-child(4){animation-delay:.11s}
.grid-wrap .kz-card:nth-child(5),.list-wrap .kz-rowscroll:nth-child(5){animation-delay:.14s}
.grid-wrap .kz-card:nth-child(6),.list-wrap .kz-rowscroll:nth-child(6){animation-delay:.17s}
.grid-wrap .kz-card:nth-child(7),.list-wrap .kz-rowscroll:nth-child(7){animation-delay:.20s}
.grid-wrap .kz-card:nth-child(8),.list-wrap .kz-rowscroll:nth-child(8){animation-delay:.23s}
.grid-wrap .kz-card:nth-child(9),.list-wrap .kz-rowscroll:nth-child(9){animation-delay:.26s}
.grid-wrap .kz-card:nth-child(10),.list-wrap .kz-rowscroll:nth-child(10){animation-delay:.29s}
.grid-wrap .kz-card:nth-child(11),.list-wrap .kz-rowscroll:nth-child(11){animation-delay:.32s}
.grid-wrap .kz-card:nth-child(12),.list-wrap .kz-rowscroll:nth-child(12){animation-delay:.35s}
/* toggle 実感(overshoot) */
.switch{transition:background .25s ease}
.switch b{transition:transform .3s cubic-bezier(.34,1.56,.64,1)}
/* 予定 描き出し */
@keyframes planDraw{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
.kz-plan,.kz-rplan,.dc-plan{animation:planDraw .34s ease-out backwards}
/* 入手頁:鑑定済 朱印が落ちる */
@keyframes stampDrop{0%{opacity:0;transform:rotate(-5deg) scale(1.55)}58%{opacity:1;transform:rotate(-5deg) scale(.9)}80%{transform:rotate(-5deg) scale(1.05)}100%{transform:rotate(-5deg) scale(1)}}
.dc-seal{animation:stampDrop .52s cubic-bezier(.3,1.3,.5,1) backwards}
/* 入手頁:開示スタッガ + UNIDENTIFIED 点滅 */
.dc-spec .dc-srow{animation:fxIn .32s ease-out backwards}
.dc-spec .dc-srow:nth-child(2){animation-delay:.05s}
.dc-spec .dc-srow:nth-child(3){animation-delay:.10s}
.dc-spec .dc-srow:nth-child(4){animation-delay:.15s}
.dc-spec .dc-srow:nth-child(5){animation-delay:.20s}
@keyframes unidIn{0%{opacity:0}28%{opacity:.45}42%{opacity:.12}70%{opacity:.6}100%{opacity:1}}
.dc-classified .dc-unid{animation:unidIn .6s ease-out}
/* 解錠トースト:金箔glint一閃 */
.av-toast-medal{position:relative;overflow:hidden}
.av-toast-medal::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 40%,rgba(242,220,160,.6) 50%,transparent 60%);transform:translateX(-140%);pointer-events:none;animation:medalGlint1 .9s ease-out .25s}
@keyframes medalGlint1{from{transform:translateX(-140%)}to{transform:translateX(170%)}}
/* タブ:共用スライド下線 */
.tab-slider{position:absolute;top:0;left:0;width:25%;height:2px;display:flex;justify-content:center;pointer-events:none;z-index:2;transition:transform .34s cubic-bezier(.4,0,.2,1)}
.tab-slider b{width:46%;height:100%;border-radius:0 0 2px 2px;background:var(--gold);transition:background .25s;box-shadow:0 0 8px rgba(217,179,106,.4)}
/* タブ切替:档案名/部品コードの差し替え */
.hf-vbar{animation:hfVbarIn .7s ease}
@keyframes hfVbarIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
.hf-part{animation:hfPartIn .36s cubic-bezier(.3,1.3,.5,1) both}
@keyframes hfPartIn{0%{opacity:0;transform:scale(1.25)}60%{opacity:1}100%{opacity:1;transform:scale(1)}}
/* OSの減少動態(reduce-motion)では動畫を止めない:アプリ側のトグルで制御(スキャンラインと同方針) */

/* ── アプリ内 通知(toast) ── */
.toast-host{position:fixed;top:calc(10px + env(safe-area-inset-top));left:0;right:0;z-index:200;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none}
.toast{position:relative;display:flex;align-items:center;gap:11px;min-width:172px;max-width:88vw;padding:13px 18px 12px 16px;border-radius:6px;background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);box-shadow:0 16px 38px rgba(0,0,0,.52);font-size:13px;color:var(--ink-strong);font-family:var(--serif);letter-spacing:.045em;animation:toast-in .28s cubic-bezier(.2,.9,.3,1);overflow:hidden}
/* 档案調の表頭罫(cf-line と同系):色の短セグメント＋細罫 */
.toast::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--teal) 0 40px,var(--line) 40px)}
.toast.ok::before{background:linear-gradient(90deg,var(--teal) 0 40px,var(--line) 40px)}
.toast.err::before{background:linear-gradient(90deg,var(--shu) 0 40px,var(--line) 40px)}
.toast.warn::before{background:linear-gradient(90deg,var(--gold) 0 40px,var(--line) 40px)}
.toast.info::before{background:linear-gradient(90deg,var(--blue) 0 40px,var(--line) 40px)}
/* 朱印風の角型アイコン */
.toast .ti{flex:none;width:22px;height:22px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;line-height:1;font-family:var(--sans);border:1px solid currentColor;background:rgba(255,255,255,.02)}
.toast.ok .ti{color:var(--teal)} .toast.err .ti{color:var(--shu)} .toast.warn .ti{color:var(--gold)} .toast.info .ti{color:var(--blue)}
.toast .tm{line-height:1.55;font-family:var(--serif);letter-spacing:.045em;color:var(--ink-strong)}
@keyframes toast-in{from{transform:translateY(-12px);opacity:0}to{transform:translateY(0);opacity:1}}
/* ── アプリ内 確認ダイアログ ── */
.cf-bg{position:fixed;inset:0;z-index:210;background:rgba(5,7,12,.66);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:24px;animation:ie-fade .16s ease}
.cf-card{position:relative;width:100%;max-width:340px;background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:16px;padding:22px 20px 16px;box-shadow:0 24px 60px rgba(0,0,0,.6);overflow:hidden;animation:ie-rise .24s cubic-bezier(.2,.9,.3,1)}
.cf-line{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--shu) 0 44px,var(--line) 44px)}
.cf-h{font-family:var(--serif);font-weight:700;font-size:16px;letter-spacing:.04em;color:var(--ink-strong);margin-bottom:8px}
.cf-m{font-size:13px;line-height:1.6;color:var(--ink-mid);margin-bottom:18px}
.cf-acts{display:flex;gap:10px}
.cf-btn{flex:1;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--panel);color:var(--ink);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:transform .12s,background .14s,border-color .14s}
.cf-btn:active{transform:scale(.96)}
.cf-btn.ok{border-color:var(--gold);background:linear-gradient(160deg,rgba(217,179,106,.16),var(--panel));color:var(--gold)}
.cf-btn.ok.danger{border-color:var(--shu-deep);background:linear-gradient(160deg,rgba(232,85,61,.16),var(--panel));color:var(--shu)}
`;
