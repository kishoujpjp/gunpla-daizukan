/* ─────────────────────────────────────────────────────────
   フィールド級 LWW マージ(records / overrides 用)
   ─────────────────────────────────────────────────────────
   背景:従来は record 1件に時戳 t を1つだけ持ち、マージは
   whole-object(t の大きい方で record 丸ごと置換)だった。
   そのため「端末Aで購入日、端末Bで完成日」を各々オフライン編集
   →同期すると、t が新しい側が古い側を丸ごと潰し、片方の欄位が
   静かに消える(多端末オフライン分岐でのデータ損失)。

   本モジュールは record の各フィールドごとに時戳(_ts)を持たせ、
   フィールド単位で新しい方を採る。旧データ(_ts 無し)は頂層 t を
   全フィールドの時戳とみなして自動移行するため、明示的なマイグレー
   ション不要・新旧混在でも正しくマージできる。
   ───────────────────────────────────────────────────────── */

const SKIP = new Set(["_ts", "t"]);

/* record のフィールド時戳マップを得る。
   _ts があればそれを、無ければ頂層 t を全フィールドの時戳として合成。 */
export function tsOf(rec) {
  if (rec && rec._ts && typeof rec._ts === "object") return rec._ts;
  const t = (rec && rec.t) || "";
  const m = {};
  if (rec) for (const f of Object.keys(rec)) if (!SKIP.has(f)) m[f] = t;
  return m;
}

/* 単一 record のフィールド級マージ。各フィールドで時戳の新しい値を採用。
   同点は b 側(安定)。値とその時戳は常に一緒に動く(クリア操作も尊重)。 */
export function mergeRec(a, b) {
  if (!a) return b;
  if (!b) return a;
  const ta = tsOf(a), tb = tsOf(b);
  const fields = new Set();
  for (const f of Object.keys(a)) if (!SKIP.has(f)) fields.add(f);
  for (const f of Object.keys(b)) if (!SKIP.has(f)) fields.add(f);
  const out = {}, outTs = {};
  for (const f of fields) {
    const fa = ta[f], fb = tb[f]; // undefined = その側に時戳なし
    let useB;
    if (fa == null && fb == null) useB = f in b;     // 時戳なし同士:存在する方/ b 優先
    else if (fa == null) useB = true;
    else if (fb == null) useB = false;
    else useB = fb >= fa;                            // 同点 → b
    const src = useB ? b : a;
    const st = useB ? fb : fa;
    out[f] = src[f];
    if (st != null) outTs[f] = st;
  }
  out._ts = outTs;
  let mx = "";
  for (const v of Object.values(outTs)) if (v > mx) mx = v;
  if (mx) out.t = mx; // 頂層 t は最大時戳(粗い比較・後方互換用)
  return out;
}

/* id→record マップ全体のマージ。incoming のキーのみ走査し、削除はしない
   (従来 whole-object 版と同じく、片側に無い id は温存)。 */
export function mergeRecMap(prev, incoming) {
  if (!incoming) return prev;
  const out = { ...prev };
  for (const id of Object.keys(incoming)) out[id] = mergeRec(out[id], incoming[id]);
  return out;
}

/* 配列(customKits)用の whole-object LWW。従来動作を維持。 */
export function mergeArrStamped(prevArr, incomingArr) {
  if (!incomingArr) return prevArr;
  const map = {};
  for (const c of prevArr || []) map[c.id] = c;
  for (const c of incomingArr) {
    const a = map[c.id];
    const ta = (a && a.t) || "", tb = (c && c.t) || "";
    if (!a || tb >= ta) map[c.id] = c;
  }
  return Object.values(map);
}

/* 書き込み用:patch されたフィールドのみ now で時戳付け。
   既存 record の他フィールドの時戳は温存(旧データは tsOf で合成移行)。 */
export function stampRec(prevRec, patch, now) {
  const curTs = prevRec ? tsOf(prevRec) : {};
  const ts = { ...curTs };
  for (const f of Object.keys(patch)) ts[f] = now;
  const base = prevRec ? { ...prevRec } : {};
  delete base.t; delete base._ts;
  return { ...base, ...patch, _ts: ts, t: now };
}

/* import/復元・墓碑用:全フィールドを now で時戳付けし、確実に勝たせる。 */
export function stampRecAll(rec, now) {
  const ts = {};
  for (const f of Object.keys(rec)) if (!SKIP.has(f)) ts[f] = now;
  return { ...rec, _ts: ts, t: now };
}
