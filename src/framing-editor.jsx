/* ───────────────────────────────────────────────────────────
   framing-editor.jsx — 構図調整モーダル(App.jsx から抽出・Phase 1)
   ─────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useMemo, useRef } from "react";
import { clampFraming, framingStyle } from "./storage-lib.js";

/* ── 構図調整モーダル: ドラッグ平移 + ピンチ/ホイール拡大 + 中央リセット ──
   方形ビューポート内で object-fit:cover の画像を pan/zoom。保存値は {scale,x,y}。原画像は無加工。 */
export function FramingEditor({ src, initial, onSave, onCancel, L = (ja) => ja }) {
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
        <div className="crop-head">{L("構図を選ぶ","Choose framing","選擇構圖")}<span>{L("枠をドラッグ・角でサイズ変更 / 枠外は切り取り","Drag the frame · resize from corners / outside is cropped","拖曳框・角落縮放 / 框外裁去")}</span></div>
        <div className="frm-stage" ref={stageRef} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ touchAction: "none" }}>
          <img src={src} alt="" className="frm-fullimg" draggable={false}
            onLoad={(e) => setNat({ w: e.target.naturalWidth || 1, h: e.target.naturalHeight || 1 })} />
          {box && (
            <div className="frm-cropbox" onPointerDown={onDown("move")}
              style={{ left: box.x * 100 + "%", top: box.y * 100 + "%", width: box.s * 100 + "%", height: box.s * 100 + "%" }}>
              <span className="frm-cg" aria-hidden="true"><i /><i /><i /><i /></span>
              <button type="button" className="frm-handle" onPointerDown={onDown("resize")} onClick={(e) => e.stopPropagation()} aria-label={L("サイズ変更","Resize","縮放")} />
            </div>
          )}
        </div>
        <div className="frm-tools">
          <div className="frm-mini" aria-hidden="true">
            <img src={src} alt="" draggable={false} style={frLive ? (framingStyle(frLive) || undefined) : undefined} />
          </div>
          <div className="frm-qbtns">
            <button type="button" className="btn" onClick={setSquare}>{L("中央正方","Center square","置中正方")}</button>
            <button type="button" className="btn" onClick={setFull}>{L("全体表示","Show full","完整顯示")}</button>
          </div>
        </div>
        <div className="crop-actions">
          <button className="btn primary" onClick={() => onSave(frLive && !isDefaultFraming(frLive) ? clampFraming({ ...frLive, a: nat ? nat.w / nat.h : undefined }) : null)}>{L("保存","Save","儲存")}</button>
          <button className="btn" onClick={onCancel}>{L("やめる", "Cancel", "取消")}</button>
        </div>
      </div>
    </div>
  );
}
