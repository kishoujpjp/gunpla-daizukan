/* ───────────────────────────────────────────────────────────
   image-editor-modal.jsx — ATELIER/工房 画像編集モーダル
   App.jsx から抽出(Phase 1)。
   ─────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { albumRefs, refSrc, pickRef, imgMetaFrom, framingStyle } from "./storage-lib.js";
import { swallowNextClick, hapticStrong } from "./utils.js";
import { notify, appConfirm } from "./dialogs.jsx";
import { fileToCompressedDataURL, AI_STYLES, AI_MODEL_OPTS, aiProviderLabel, aiAvailable } from "./ai-config.js";
import { SwipeViewer } from "./swipe-viewer.jsx";
import { AIRestyleModal } from "./ai-restyle-modal.jsx";

export function ImageEditorModal({ kit, images, extras, albumMeta, builderName, resolveOrig, ai, initialCols, onCols, onAddImage, onRemoveImage, onSetRole, onFrame, onReorder, onSetLoc, onClose, onBack, L = (ja) => ja }) {
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
    return { cls: "pho", text: "◉ " + (by ? "photoed by " + by : L("写真","Photo","照片")), date: ds };
  };
  const fmtDT = (at) => { if (!at) return "—"; const d = new Date(at); const p = (n) => ("0" + n).slice(-2); return d.getFullYear() + "/" + p(d.getMonth() + 1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()); };

  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0]; if (e.target) e.target.value = "";
    if (!f) return;
    setBusy(true);
    try { const url = await fileToCompressedDataURL(f, 1280, 0.82); onAddImage(url, { src: "photo" }); }
    catch (err) { notify(L("画像の読み込みに失敗しました","Failed to load the image","圖片載入失敗"), { kind: "err" }); }
    setBusy(false); setAddOpen(false);
  };
  const addUrl = () => { const u = urlVal.trim(); if (!u) return; onAddImage(u, { src: "photo" }); setUrlVal(""); setAddOpen(false); };
  /* v4: AI 変換は原図(data:URL)で行う。resolveOrig 不能時は selSrc(縮図 URL 等)へ回退。 */
  const openAI = async () => { if (!aiAvailable(ai)) { notify(aiProviderLabel(ai && ai.model) + L(" のAPIキーを設定タブで入力してください"," API key is required — add it in Settings"," 的 API 金鑰請至設定填入"), { kind: "warn", dur: 3200 }); return; } const orig = resolveOrig ? await Promise.resolve(resolveOrig(sel)).catch(() => null) : null; setAiSrc(orig || selSrc); setAiOpen(true); setSel(null); setLocEditing(false); };
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
            <span className="sm-title">{L(<>画像<em>編集</em></>,<>Image Edit</>,<>圖片<em>編輯</em></>)} <span className="sm-eyebrow">atelier</span></span>
            <button className="modal-x static" onClick={onClose}>✕</button>
          </div>
          {[kit.code || kit.name, kit.grade].filter(Boolean).length ? <div className="ie-subcode">{[kit.code || kit.name, kit.grade].filter(Boolean).join(" · ")}</div> : null}
        </div>
        <div className="ie-bar">
          <span className="ie-cnt">{order.length}<i>{L("枚","","張")}</i></span>
          <span className="ie-srcfilter">
            {[["all", L("全","All","全")], ["photo", L("写真","Photo","照片")], ["ai", "AI"]].map(([v, l]) => (
              <button key={v} type="button" className={"ie-sfbtn" + (srcFilter === v ? " on" : "")} onClick={() => setSrcFilter(v)}>{l}</button>
            ))}
          </span>
          <span className="ie-cols">
            <button type="button" className={"ie-colbtn" + (cols === 2 ? " on" : "")} onClick={() => setCols(2)} aria-label={L("2列","2 columns","2 欄")}>▥</button>
            <button type="button" className={"ie-colbtn" + (cols === 3 ? " on" : "")} onClick={() => setCols(3)} aria-label={L("3列","3 columns","3 欄")}>▦</button>
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
                  {ref === thumbR ? <span className="ie-cover">{L("表紙","Cover","封面")}</span> : null}
                </div>
              );
            })}
            {srcFilter === "all" && (
            <button data-ref="add" className="ie-tile add" onClick={() => setAddOpen(true)} disabled={busy}>
              <span className="ie-plus">{busy ? "…" : "＋"}</span><span className="ie-addl">{L("画像を追加","Add image","新增圖片")}</span><span className="ie-addo">{L("カメラ / アルバム / URL","Camera / Album / URL","相機 / 相簿 / 網址")}</span>
            </button>
            )}
          </div>
        </div>

        {/* 追加メニュー */}
        {addOpen ? (
          <div className="ie-dim" onClick={() => setAddOpen(false)}>
            <div className="ie-sheet add" onClick={(e) => e.stopPropagation()}>
              <div className="ie-sh-title">{L("画像を追加","Add image","新增圖片")}</div>
              <div className="ie-addbtns">
                <button className="ie-abtn" onClick={() => camRef.current && camRef.current.click()}>
                  <svg className="ie-abi" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h2.6l1.3-2.1a1 1 0 0 1 .85-.47h6.5a1 1 0 0 1 .85.47L17.4 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.3" /></svg>
                  <span>{L("カメラ","Camera","相機")}</span>
                </button>
                <button className="ie-abtn" onClick={() => albRef.current && albRef.current.click()}>
                  <svg className="ie-abi" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="13.5" height="13.5" rx="2" /><circle cx="7.6" cy="8.6" r="1.5" /><path d="M3.4 14.5l3.6-3.1 2.8 2.3 3.2-2.9 3.5 3" /><path d="M20.5 8v9.5a3 3 0 0 1-3 3H8" /></svg>
                  <span>{L("アルバム","Album","相簿")}</span>
                </button>
              </div>
              <div className="ie-urlrow"><input value={urlVal} placeholder={L("画像URL","Image URL","圖片網址")} onChange={(e) => setUrlVal(e.target.value)} /><button onClick={addUrl}>{L("追加","Add","新增")}</button></div>
            </div>
          </div>
        ) : null}

        {/* 操作シート(上部に大プレビュー / 下部に動作) */}
        {sel ? (
          <div className="ie-dim" onClick={closeSheet}>
            <div className="ie-sheet sel" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="ie-sheet-x" onClick={closeSheet} aria-label={L("閉じる","Close","關閉")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
              <div className="ie-sh-title">{L("画像情報","Image info","圖片資訊")}</div>
              <div className="ie-pv full"
                onTouchStart={(e) => { onPvTouchStart(e); lpStart(() => openView(sel, "sheet")); }}
                onTouchEnd={(e) => { lpCancel(); onPvTouchEnd(e); }}
                onTouchMove={lpCancel}
                onContextMenu={(e) => e.preventDefault()}>
                {selSrc ? <img src={selSrc} alt="" className="ie-pv-img" draggable={false} /> : <div className="ie-pv-blank" />}
                <span className="ie-pv-idx">{selIdx >= 0 ? selIdx + 1 : "—"}<i> / {order.length}</i></span>
                {sel === thumbR ? <span className="ie-pv-cover">{L("表紙","Cover","封面")}</span> : null}
                {selIdx > 0 ? <button type="button" className="ie-pv-nav prev" onClick={() => gotoRel(-1)} aria-label={L("前の画像","Previous","上一張")}>‹</button> : null}
                {selIdx >= 0 && selIdx < order.length - 1 ? <button type="button" className="ie-pv-nav next" onClick={() => gotoRel(1)} aria-label={L("次の画像","Next","下一張")}>›</button> : null}
              </div>
              <dl className="ie-sh-meta">
                <dt>{L("由来","Source","來源")}</dt><dd>{selMeta && selMeta.src === "ai" ? <span className="ai">{L("AI生成","AI","AI 生成")}</span> : <span className="pho">{L("写真","Photo","照片")}</span>}</dd>
                {selMeta && selMeta.src === "ai"
                  ? <>
                      <dt>{L("モデル","Model","模型")}</dt><dd>{(AI_MODEL_OPTS.find((x) => x.value === selMeta.model) || {}).label || (selMeta && selMeta.model) || "—"}</dd>
                      <dt>{L("スタイル","Style","風格")}</dt><dd>{(AI_STYLES.find((x) => x.id === selMeta.style) || {}).label || "—"}</dd>
                    </>
                  : <><dt>{L("撮影者","Photographer","拍攝者")}</dt><dd>{(selMeta && selMeta.by) || builderName || "—"}</dd></>}
                {selMeta && selMeta.src === "ai" ? null : (<>
                <dt>{L("場所","Location","地點")}</dt><dd>{locEditing
                  ? <span className="ie-locedit"><input autoFocus value={locText} placeholder={L("例:自宅 / イベント名","e.g. Home / Event","例:自宅 / 活動名")} onChange={(e) => setLocText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { onSetLoc(sel, locText); setLocEditing(false); } }} /><button onClick={() => { onSetLoc(sel, locText); setLocEditing(false); }}>{L("保存","Save","儲存")}</button></span>
                  : (selMeta && selMeta.loc ? <span>{selMeta.loc} <button className="ie-locbtn" onClick={() => { setLocText(selMeta.loc || ""); setLocEditing(true); }}>{L("編集","Edit","編輯")}</button></span> : <span className="ie-dim2">{L("未設定","Not set","未設定")} <button className="ie-locbtn" onClick={() => { setLocText(""); setLocEditing(true); }}>{L("＋ 入力","＋ Add","＋ 輸入")}</button></span>)}</dd>
                </>)}
                <dt>{L("追加","Added","新增")}</dt><dd>{fmtDT(selMeta && selMeta.at)}</dd>
              </dl>
              <div className="ie-acts2">
                <button className="ie-act2" onClick={() => { const r = sel; closeSheet(); onFrame(r); }}><span className="ic">⛶</span><span>{L("構図を整える","Adjust framing","調整構圖")}</span></button>
                <button className="ie-act2 g" onClick={openAI}><span className="ic">✨</span><span>{L("AIで変換","AI restyle","AI 轉換")}</span></button>
              </div>
              <button className="ie-del" onClick={async () => { if (await appConfirm(L("この画像を削除します。元に戻せません。","Delete this image. This cannot be undone.","刪除此圖片，無法復原。"), { title: L("画像を削除","Delete image","刪除圖片"), okText: L("削除","Delete","刪除"), cancelText: L("やめる","Cancel","取消"), danger: true })) { onRemoveImage(sel); closeSheet(); } }}><svg className="ie-delic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7" /><path d="M6.4 7l.9 12.3a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5L17.6 7" /><path d="M10 11v6M14 11v6" /></svg>{L("この画像を削除","Delete this image","刪除此圖片")}</button>
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
        <AIRestyleModal src={aiSrc} geminiKey={ai && ai.geminiKey} openaiKey={ai && ai.openaiKey} proxy={ai && ai.proxy} model={(ai && ai.model) || "gemini-3-pro-image"} prompts={ai && ai.prompts} lastStyle={ai && ai.style} onModel={ai && ai.onModel} onStyle={ai && ai.onStyle} L={L}
          onAdopt={(out, meta) => { onAddImage(out, meta); setAiOpen(false); closeSheet(); }}
          onClose={() => setAiOpen(false)} />
      ) : null}
    </>
  );
}
