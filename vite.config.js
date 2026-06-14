import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

/* ビルド後、dist/sw.js の __SW_VERSION__ を「dist 内のハッシュ化資産名から
   生成した識別子」へ置換する。Vite が資産を content-hash でリネームするため、
   内容が変われば識別子も変わる(=デプロイのたびに自動で新しいキャッシュ版)。
   → 手動の cache 版 bump が不要になり、bump 忘れによる旧資産の累積も防ぐ。
   dist/sw.js が無い場合は何もしない(プレースホルダのまま=安定動作)。 */
function swVersion() {
  return {
    name: "sw-version",
    apply: "build",
    closeBundle() {
      const swPath = resolve("dist/sw.js");
      let sw;
      try { sw = readFileSync(swPath, "utf8"); } catch (e) { return; }
      let token;
      try {
        const names = readdirSync(resolve("dist/assets")).sort().join("|");
        token = createHash("sha256").update(names).digest("hex").slice(0, 8);
      } catch (e) {
        token = String(Date.now()); // 資産一覧が取れない場合の保険
      }
      writeFileSync(swPath, sw.replaceAll("__SW_VERSION__", token));
      // eslint-disable-next-line no-console
      console.log("[sw-version] cache = mgz-" + token);
    },
  };
}

export default defineConfig({
  plugins: [react(), swVersion()],
});
