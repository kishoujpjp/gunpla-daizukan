/* ───────────────────────────────────────────────────────────
   crop-modal.jsx — 圖像裁切器(觸控/滑鼠通用)
   App.jsx から抽出(Phase 1)。
   ─────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useRef } from "react";
import { notify } from "./dialogs.jsx";

/* ── 圖像裁切器(觸控/滑鼠通用) ── */
export function CropModal({ src, onDone, onCancel, L = (ja) => ja }) {
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
      notify(L("この画像は切り抜きできません(外部URL画像はCORS制限のため不可)", "This image can't be cropped (external URLs are blocked by CORS)", "此圖無法裁切(外部網址圖片受 CORS 限制)"), { kind: "warn", dur: 3200 });
    }
  };

  return (
    <div className="crop-bg" onMouseMove={onMove} onMouseUp={endDrag} onTouchMove={onMove} onTouchEnd={endDrag}>
      <div className="crop-panel">
        <div className="crop-head">{L("画像の切り抜き", "Crop image", "裁切圖片")}<span>{L("枠をドラッグで移動・右下の○で拡縮", "Drag to move · resize with the bottom-right handle", "拖曳移動・右下圓點縮放")}</span></div>
        <div className="crop-box">
          <img ref={imgRef} src={src} alt="" crossOrigin="anonymous" onLoad={onImgLoad} draggable={false}
            onError={() => { notify(L("画像を読み込めませんでした(外部画像はCORS制限の場合があります)", "Couldn't load the image (external images may be blocked by CORS)", "無法載入圖片(外部圖片可能受 CORS 限制)"), { kind: "err", dur: 3200 }); onCancel(); }} />
          {rect && (
            <div className="crop-rect" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
              onMouseDown={startDrag("move")} onTouchStart={startDrag("move")}>
              <i className="crop-handle" onMouseDown={startDrag("resize")} onTouchStart={startDrag("resize")} />
            </div>
          )}
        </div>
        <div className="crop-actions">
          <button className="btn primary" onClick={confirm}>{L("この範囲で決定", "Apply crop", "套用此範圍")}</button>
          <button className="btn" onClick={() => disp && setRect({ x: 0, y: 0, w: disp.w, h: disp.h })}>{L("全体", "Full", "全部")}</button>
          <button className="btn" onClick={onCancel}>{L("やめる", "Cancel", "取消")}</button>
        </div>
      </div>
    </div>
  );
}
