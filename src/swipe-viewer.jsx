/* ───────────────────────────────────────────────────────────
   swipe-viewer.jsx — 画像鑑賞ビューア(App.jsx から抽出・Phase 1)
   ─────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useRef } from "react";

/* ── 画像鑑賞: 指追従の横スワイプでページング(離すと次へ自然遷移)＋ピンチズーム。
   ボタン/X 無し、タップで閉じる。ズーム中(>1倍)は1本指でパン、等倍時のみページング ── */
export function SwipeViewer({ slides, index, onIndex, onClose, onLongPress, resolveSrc, resetKey, serifOf, onSerif, watermarkOf, L = (ja) => ja }) {
  const n = slides.length;
  const wrapRef = useRef(null);
  const lpTimer = useRef(0);        // 長押しタイマー。押下480msで onLongPress を発火(他の長押しと同じく保持中に自動遷移)
  useEffect(() => () => clearTimeout(lpTimer.current), []);
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
      if (onLongPress) { clearTimeout(lpTimer.current); lpTimer.current = setTimeout(() => { lpTimer.current = 0; onLongPress(); }, 480); }
    }
  };
  const move = (e) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const arr = [...pts.current.values()];
    const s = st.current; if (!s) return;
    if (lpTimer.current) {
      const moved1 = arr.length === 1 && s.sx != null && (Math.abs(arr[0].x - s.sx) > 8 || Math.abs(arr[0].y - s.sy) > 8);
      if (arr.length >= 2 || moved1) { clearTimeout(lpTimer.current); lpTimer.current = 0; }
    }
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
    clearTimeout(lpTimer.current); lpTimer.current = 0;
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
      onContextMenu={(e) => e.preventDefault()}
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
                    {sf ? <span className="vs-text">{sf}</span> : (isCur && onSerif ? <span className="vs-hint">{L("＋ セリフを追加","＋ Add caption","＋ 新增台詞")}</span> : null)}
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
                      <span className="dc-unsub">NO VISUAL ON FILE</span>
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
