/* ───────────────────────────────────────────────────────────
   universe.jsx — 世界観(宇宙世紀ほか)関連の定数・判定・エンブレム
   App.jsx から抽出(Phase 1)。挙動不変。
   ─────────────────────────────────────────────────────────── */
import React from "react";

export const UNI_EMBLEM = {
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
export const UNI_TAG = { UC: "U.C.", SEED: "C.E.", W: "A.C.", X: "A.W.", G: "F.C.", "00": "A.D.", AGE: "A.G.", IBO: "P.D.", AS: "A.S.", RC: "R.C.", CC: "C.C.", GQX: "GQX", BF: "BF", extra: "extra" };

/* 世界観フィルター用の表示順＋ラベル(コード, 表示名) */
export const UNI_PICK = [["UC", "U.C. 宇宙世紀"], ["SEED", "C.E. コズミック・イラ"], ["W", "A.C. アフターコロニー"], ["X", "A.W. アフターウォー"], ["G", "F.C. フューチャーセンチュリー"], ["00", "A.D. 西暦"], ["AGE", "A.G. アドバンスド・ジェネレイション"], ["IBO", "P.D. ポスト・ディザスター"], ["AS", "A.S. アド・ステラ"], ["RC", "R.C. リギルド・センチュリー"], ["CC", "C.C. 正暦"], ["GQX", "GQX ジークアクス"], ["BF", "BF ビルド系"], ["extra", "extra その他"]];

/* 系列名 → 世界観コード(順序厳守: Build/メタ→BF → クロスオーバー/SD・戦国→extra → 各世界観 → U.C. 総取り → 残り extra) */
export function universeOfSeries(series) {
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
export const UNI_OVERRIDE = {
  // → U.C.
  rgp19: "UC", pg017: "UC", bmg012: "UC", bmg022: "UC", bp128: "UC", bp143: "UC", bp159: "UC", bp174: "UC",
  hghp001: "UC", hghp027: "UC", hghp048: "UC", hghp052: "UC", hghp148: "UC", bp039: "UC", bp042: "UC", hghp160: "UC",
  // → C.E.
  rgp02: "SEED", pg013: "SEED", bp036: "SEED",
  // → A.D.
  rgp03: "00",
};
export const universeOfKit = (k) => (k && UNI_OVERRIDE[k.id]) || universeOfSeries(k && k.series);

/* 世界別エンブレム(単色 currentColor / 金=tier2・銀=tier1・灰=tier0) */
export function Emblem({ universe, tier }) {
  const fin = tier === 2 ? "gold" : tier === 1 ? "silver" : "ghost";
  return <svg viewBox="0 0 64 64" className={"av-emblem fin-" + fin} aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: UNI_EMBLEM[universe] || UNI_EMBLEM.UC }} />;
}

/* 画像なしプレースホルダー: 系列の世界観エンブレムを灰色の透かしで表示(grid 73% / list 78%) */
export function SeriesWatermark({ kit, variant, size = 84 }) {
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
