/* ───────────────────────────────────────────────────────────
   kit-fix-modal.jsx — 機体情報の修正提案モーダル
   App.jsx から抽出(Phase 1)。REPORT_API は Phase 2 で正式化予定。
   ─────────────────────────────────────────────────────────── */
import React, { useState, useMemo, useRef } from "react";
import { notify } from "./dialogs.jsx";
import { normJa } from "./ja-text.js";
import { DateSetField } from "./form-controls.jsx";

/* AI画像モデル定義(画像生成/編集系)。providerは model 名から判定 */
/* 機体情報の修正提案。検索→選択→編集→差分を送信(アプリのデータは変更しない)。
   送信先: REPORT_API(Cloudflare Worker 等)を設定すれば POST、未設定/失敗時はメールにフォールバック。 */
const REPORT_API = "";    // 例: "https://gunpla-report.xxxx.workers.dev"(建てたら設定)
const REPORT_SECRET = ""; // Worker の REPORT_SECRET と同じ値(※フロントに露出・簡易的なbot避けのみ)
export function KitFixModal({ allKits, onClose, L = (ja) => ja }) {
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
    if (Object.keys(changes).length === 0) { notify(L("変更がありません。修正してから送信してください","No changes — edit something before sending","沒有變更，請修改後再送出"), { kind: "warn" }); return; }
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
        notify(L("修正提案を送信しました。ありがとうございます","Suggestion sent — thank you","已送出修正建議，謝謝"), { kind: "ok" });
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
          <span className="sm-title">{L(<>機体情報<em>修正</em></>,<>Fix Info</>,<>機體資訊<em>修正</em></>)} <span className="sm-eyebrow">{picked ? "EDIT" : "SEARCH"}</span></span>
          <button className="modal-x static" onClick={onClose}>✕</button>
        </div>
        {!picked ? (
          <>
            <div className="toolbar">
              <input className="search" placeholder={L("名称・型式・原作で検索","Search name, code, series","搜尋名稱・型式・原作")} value={q} autoFocus
                onChange={(e) => setQ(e.target.value)} />
              {q && <button className="search-x" onClick={() => setQ("")}>✕</button>}
            </div>
            <div className="fix-results">
              {q.trim() && results.length === 0 && <p className="fix-empty">{L("該当する機体がありません。","No matching kit.","沒有符合的機體。")}</p>}
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
            <div className="fix-target">{L("対象","Target","對象")} <b>{picked.name}</b>（{picked.code || "—"}）
              <button className="fix-back" onClick={() => { setPicked(null); setForm(null); }}>{L("別の機体","Other kit","其他機體")}</button>
            </div>
            <label className="fld pad"><span>{L("名称","Name","名稱")}</span><input value={form.name} onChange={set("name")} /></label>
            <label className="fld pad"><span>{L("型式番号","Model code","型式番號")}</span><input value={form.code} onChange={set("code")} placeholder="RX-78-2" /></label>
            <label className="fld pad"><span>{L("原作","Series","原作")}</span><input value={form.series} onChange={set("series")} /></label>
            <label className="fld pad"><span>{L("発売年月","Release","發售年月")}</span><DateSetField mode="month" value={form.ym} ph={L("タップで選択", "Tap to set", "點擊選擇")} clearLabel={L("クリア", "Clear", "清除")} onPick={(v) => set("ym")({ target: { value: v } })} /></label>
            <label className="fld pad"><span>{L("定価(円)","Price (JPY)","定價(日圓)")}</span><input type="number" inputMode="numeric" value={form.price} onChange={set("price")} /></label>
            <label className="fld pad"><span>{L("グレード","Grade","等級")}</span><input value={form.grade} onChange={set("grade")} placeholder="HG / MG / RG ..." /></label>
            <label className="fld pad"><span>{L("ブランド","Brand","品牌")}</span><input value={form.line} onChange={set("line")} /></label>
            <div className="fld pad"><span>{L("P-Bandai限定","P-Bandai limited","魂商店限定")}</span>
              <button type="button" className={"fix-toggle" + (form.premium ? " on" : "")}
                onClick={() => setForm((f) => ({ ...f, premium: !f.premium }))}>{form.premium ? L("はい","Yes","是") : L("いいえ","No","否")}</button>
            </div>
            <button className="btn primary fix-send" onClick={submit}>{L("修正をメールで送信","Send fix by email","以郵件送出修正")}</button>
            <p className="footnote">{L("変更したフィールドのみ、AIが読み取りやすいJSON形式でメール本文に入ります。送信でメールアプリが開きます。","Only changed fields go into the email body as AI-readable JSON. Sending opens your mail app.","僅變更的欄位會以 AI 易讀的 JSON 放入郵件內文。送出會開啟郵件 app。")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
