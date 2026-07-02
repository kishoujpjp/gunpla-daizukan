/* ───────────────────────────────────────────────────────────
   form-controls.jsx — 自製フォーム部品(DateSetField / Picker / ModelPicker)
   ネイティブ select・date input の置換。App.jsx から抽出(Phase 1)。
   ─────────────────────────────────────────────────────────── */
import React, { useState, useEffect, useRef } from "react";

export function DateSetField({ value, onPick, ph, cls = "", mode = "date", clearLabel = "クリア" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [view, setView] = useState(mode === "month" ? "month" : "day");
  const ref = useRef(null);
  const today = new Date();
  const [vy, setVy] = useState(today.getFullYear());
  const [vm, setVm] = useState(today.getMonth());
  const [yBase, setYBase] = useState(today.getFullYear() - 6);
  const pad = (n) => String(n).padStart(2, "0");
  const toggle = () => {
    if (open) { setOpen(false); return; }
    const mt = value && /^(\d{4})-(\d{2})/.exec(value);
    if (mt) { setVy(+mt[1]); setVm(+mt[2] - 1); setYBase(+mt[1] - 6); }
    setView(mode === "month" ? "month" : "day");
    const r = ref.current.getBoundingClientRect();
    const up = r.bottom > window.innerHeight - 330;
    const calW = Math.min(236, window.innerWidth * 0.92);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - calW - 8);
    setPos({ left, up, top: r.bottom + 4, bottom: window.innerHeight - r.top + 4 });
    setOpen(true);
  };
  const prevM = () => { if (vm === 0) { setVy(vy - 1); setVm(11); } else setVm(vm - 1); };
  const nextM = () => { if (vm === 11) { setVy(vy + 1); setVm(0); } else setVm(vm + 1); };
  const di = new Date(vy, vm + 1, 0).getDate();
  const fd = new Date(vy, vm, 1).getDay();
  const cells = [];
  for (let i = 0; i < fd; i++) cells.push(0);
  for (let d = 1; d <= di; d++) cells.push(d);
  const years = Array.from({ length: 12 }, (_, i) => yBase + i);
  const commit = (v) => { onPick(v); setOpen(false); };
  const disp = value ? value.replace(/-/g, ".") : ph;
  return (
    <span className={`rec-dateset ${cls} ${value ? "has" : ""}`} ref={ref}>
      <button type="button" className="rec-dateset-btn" onClick={toggle} aria-expanded={open}>
        <span className="rec-dateset-ph">{disp}</span><span className="rec-dateset-chev">▾</span>
      </button>
      {open && pos ? (
        <>
          <div className="picker-back" onClick={() => setOpen(false)} />
          <div className="rec-cal" style={{ left: pos.left, ...(pos.up ? { bottom: pos.bottom } : { top: pos.top }) }}>
            {value ? <button type="button" className="rec-cal-clear" onClick={() => commit("")}>× {clearLabel}</button> : null}
            {mode === "date" && view === "day" ? (
              <>
                <div className="rec-cal-h">
                  <button type="button" className="rec-cal-nav" onClick={prevM} aria-label="prev">‹</button>
                  <button type="button" className="rec-cal-mo" onClick={() => setView("month")}>{vy}.{pad(vm + 1)}</button>
                  <button type="button" className="rec-cal-nav" onClick={nextM} aria-label="next">›</button>
                </div>
                <div className="rec-cal-grid">
                  {["日", "月", "火", "水", "木", "金", "土"].map((w) => <span key={"w" + w} className="rec-cal-wd">{w}</span>)}
                  {cells.map((d, i) => (d
                    ? <button key={i} type="button" className="rec-cal-d" onClick={() => commit(`${vy}-${pad(vm + 1)}-${pad(d)}`)}>{d}</button>
                    : <span key={i} className="rec-cal-d rec-cal-x" />))}
                </div>
              </>
            ) : null}
            {view === "month" ? (
              <>
                <div className="rec-cal-h">
                  <button type="button" className="rec-cal-nav" onClick={() => setVy(vy - 1)} aria-label="prev year">‹</button>
                  <button type="button" className="rec-cal-mo" onClick={() => { setYBase(vy - 6); setView("year"); }}>{vy}</button>
                  <button type="button" className="rec-cal-nav" onClick={() => setVy(vy + 1)} aria-label="next year">›</button>
                </div>
                <div className="rec-cal-mgrid">
                  {Array.from({ length: 12 }, (_, i) => (
                    <button key={i} type="button" className={`rec-cal-cell ${(mode === "month" ? value === `${vy}-${pad(i + 1)}` : i === vm) ? "sel" : ""}`} onClick={() => { if (mode === "month") commit(`${vy}-${pad(i + 1)}`); else { setVm(i); setView("day"); } }}>{i + 1}月</button>
                  ))}
                </div>
              </>
            ) : null}
            {view === "year" ? (
              <>
                <div className="rec-cal-h">
                  <button type="button" className="rec-cal-nav" onClick={() => setYBase(yBase - 12)} aria-label="prev years">‹</button>
                  <span className="rec-cal-mo-static">{years[0]}–{years[11]}</span>
                  <button type="button" className="rec-cal-nav" onClick={() => setYBase(yBase + 12)} aria-label="next years">›</button>
                </div>
                <div className="rec-cal-mgrid">
                  {years.map((y) => (
                    <button key={y} type="button" className={`rec-cal-cell ${y === vy ? "sel" : ""}`} onClick={() => { setVy(y); setView("month"); }}>{y}</button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </span>
  );
}

export function Picker({ value, options, groups, onChange, className = "", placeholder }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const openIt = () => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const up = r.bottom > window.innerHeight - 300;
    setPos({ left: Math.max(8, r.left), width: r.width, up, top: r.bottom + 4, bottom: window.innerHeight - r.top + 4 });
    setOpen(true);
  };
  let curLabel = placeholder != null ? placeholder : value;
  if (groups) { for (const g of groups) { const it = g.items.find((m) => m.id === value); if (it) { curLabel = it.label; break; } } }
  else if (options) { const o = options.find((x) => x[0] === value); if (o) curLabel = o[1]; }
  return (
    <span className={`picker ${className}`} ref={ref}>
      <button type="button" className="picker-btn" onClick={openIt} aria-expanded={open}>
        <span className="picker-cur">{curLabel}</span><span className="picker-chev">▾</span>
      </button>
      {open && pos && (
        <>
          <div className="picker-back" onClick={() => setOpen(false)} />
          <div className="picker-menu" style={{ left: pos.left, minWidth: pos.width, ...(pos.up ? { bottom: pos.bottom } : { top: pos.top }) }}>
            {groups
              ? groups.map((g) => (
                  <div key={g.group}>
                    <span className="picker-grp-h">{g.group}</span>
                    {g.items.map((m) => (
                      <button key={m.id} type="button" className={`picker-opt ${m.id === value ? "sel" : ""}`} onClick={() => { onChange(m.id); setOpen(false); }}><span>{m.label}</span>{m.id === value && <span className="picker-ck">✓</span>}</button>
                    ))}
                  </div>
                ))
              : options.map(([v, l]) => (
                  <button key={v} type="button" className={`picker-opt ${v === value ? "sel" : ""}`} onClick={() => { onChange(v); setOpen(false); }}><span>{l}</span>{v === value && <span className="picker-ck">✓</span>}</button>
                ))}
          </div>
        </>
      )}
    </span>
  );
}
/* 自前のドロップダウン(ネイティブselectの代替)。開くと下にリストを展開(クリップ回避のためインフロー) */
export function ModelPicker({ value, options, onChange, label }) {
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
