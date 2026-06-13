/* window.storage shim — IndexedDB 版
   介面與 Claude Artifact 的 storage API 相同,App.jsx 無需修改。 */
const DB_NAME = "mg-zukan";
const STORE = "kv";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

window.storage = {
  async get(key) {
    const v = await tx("readonly", (s) => s.get(key));
    if (v === undefined) throw new Error("key not found: " + key);
    return { key, value: v };
  },
  async set(key, value) {
    await tx("readwrite", (s) => s.put(value, key));
    return { key, value };
  },
  async delete(key) {
    await tx("readwrite", (s) => s.delete(key));
    return { key, deleted: true };
  },
  async list(prefix = "") {
    const keys = await tx("readonly", (s) => s.getAllKeys());
    return { keys: keys.filter((k) => String(k).startsWith(prefix)) };
  },
};
