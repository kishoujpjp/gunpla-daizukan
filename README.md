# MG 図鑑・蒐集帖 — iPhone/iPad 部署手冊

## 0. 前置(只需做一次)
安裝 Node.js LTS 版:https://nodejs.org (或 Mac 上 `brew install node`)
驗證:終端機輸入 `node -v` 顯示版本號即可。

## 1. 本機啟動
```bash
cd mg-zukan
npm install        # 第一次需要,約 1 分鐘
npm run dev        # 啟動開發伺服器
```
終端機會顯示兩個網址:
- Local:    http://localhost:5173       ← Mac 瀏覽器開這個
- Network:  http://192.168.x.x:5173     ← iPhone(同一 Wi-Fi)開這個,可直接試用

## 2. 建置正式版
```bash
npm run build      # 產出 dist/ 資料夾
```

## 3. 部署(擇一)
### 方法 A:Netlify Drop(最簡單,免指令)
1. 開 https://app.netlify.com/drop (需註冊免費帳號)
2. 把 `dist` 資料夾直接拖進網頁
3. 取得 https://xxxx.netlify.app 網址

### 方法 B:Vercel CLI
```bash
npx vercel         # 依提示登入,一路 Enter
npx vercel --prod
```

## 4. 安裝到 iPhone / iPad
1. 用 Safari 開啟部署後的 https 網址
2. 點「分享」按鈕 → 「加入主畫面」
3. 主畫面會出現「MG図鑑」圖示,點開即為全螢幕 App,離線可用

## 5. 資料說明
- 收藏記錄與圖片存在裝置的 IndexedDB,自動保存
- 設定分頁有「データを書き出す(JSON)」可備份;換機或重灌用「読み込む」還原
- iPhone 與 iPad 資料各自獨立,用備份檔互傳即可同步

## 6. 更新 App
修改程式後重新 `npm run build`,把新的 dist 再部署一次。
手機端重新開啟 App 兩次即會載入新版(Service Worker 快取更新)。
