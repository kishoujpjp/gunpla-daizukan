import React from "react";
import { createRoot } from "react-dom/client";
import "./storage";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);

if ("serviceWorker" in navigator) {
  let reloaded = false;
  // 新版 SW 接管 → 自動重整一次(避免卡舊版)
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // 啟動時與每次回到前景時主動檢查更新
      reg.update().catch(() => {});
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update().catch(() => {});
      });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    }).catch(() => {});
  });
}
