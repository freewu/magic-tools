<div align="center">

# 🧰 Magic Tools

**全能開發工具箱 —— 8 大分類、106 個實用工具，桌面 + Web 雙端。**

[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

`v2.7.0` · Tauri 2 · React 18 · Ant Design 5 · MIT License

[下載桌面版](#-下載) · [線上體驗](https://freewu.github.io/magic-tools/) · [提交 Issue](https://github.com/freewu/magic-tools/issues/new)

</div>

---

## ✨ 亮點

- **100+ 常用開發工具**，依 8 大分類組織：編解碼、類型轉換、加解密、值計算、格式化、圖片、站長工具與實用工具。
- **完整的密碼學套件** —— 對稱加密（AES / DES / 3DES / SM4 / ChaCha20 / Blowfish / Rabbit / RC2–RC6 / TEA / XTEA / XXTEA）、非對稱（RSA / SM2 國密）、古典密碼（凱撒 / 柵欄 / 維吉尼亞 / 希爾），以及 Cisco Type 7。
- **雜湊與 MAC** —— MD5、SHA-1/2、SHA-3、Keccak、SM3、BCrypt、Scrypt、PBKDF2、HKDF、HMAC、CMAC、KMAC，以及 BCC / LRC / CRC 檢查碼。
- **批次 QR Code / 條碼** —— 一次產生多筆並預覽，桌面版可一鍵選取資料夾匯出全部 PNG。
- **本地運算、資料不上傳** —— 所有計算都在裝置本地完成，支援深色模式。
- **隨處可用** —— Windows / macOS / Linux 原生桌面應用，另有純前端 Web 版免安裝即用。

## 🧰 功能總覽

> 頂部可切換 **English** 與 **简体中文** 版本。

### 🔐 加解密 *(21)*
AES 加解密 · RSA 加解密 · SM2 加解密 · SM4 加解密 · 凱撒加解密 · 柵欄加解密 · 維吉尼亞加解密 · 希爾加解密 · Cisco Type 7 · DES 加解密 · Blowfish 加解密 · Rabbit 加解密 · RC2 加解密 · RC4 加解密 · RC5 加解密 · RC6 加解密 · ChaCha20 加解密 · 3DES 加解密 · TEA 加解密 · XTEA 加解密 · XXTEA 加解密

### 🧮 值計算 *(16)*
Hash 值計算 · HmacHash 值計算 · SHA3 Hash 值計算 · Keccak Hash 值計算 · BCrypt · Scrypt · PBKDF2 值計算 · CMAC 計算 · HKDF 計算 · KMAC 計算 · PPI 計算 · 原碼/反碼/補碼計算 · IP 轉換 · BCC 校驗 · LRC 校驗 · CRC 校驗

### 🔄 編解碼 *(13)*
Base64 編解碼 · URL 編解碼 · Unicode 編解碼 · Punycode 編解碼 · UUencode 編解碼 · XXencode 編解碼 · BCD 編解碼 · 摩斯密碼編解碼 · JWT 解碼器 · HTTP Basic Auth 編解碼 · BaseX 編解碼 · Base58 編解碼 · Gzip 編解碼

### ⚖️ 類型轉換 *(17)*
時間戳轉換 · 顏色格式轉換 · 進制轉換 · 樹形和路徑轉換 · GPS 座標轉換 · 下載連結轉換 · 人民幣大寫 · 位元組轉換 · 中文拼音 · 溫度轉換 · 距離轉換 · 配置轉換 · 字幕格式轉換 · 速度轉換 · 容量轉換 · 面積轉換 · 重量轉換

### 🛠️ 格式化 *(8)*
Markdown 編輯器 · JSON 格式化 · JSON5 格式化 · SQL 格式化 · XML 格式化 · HTML 格式化 · SVG 格式化 · 中英文自動排版

### 🖼️ 圖片 *(9)*
二維碼生成 · 條碼生成 · Base64 圖片 · ASCII 圖片 · 程式碼截圖 · ICO 生成 · App Icon 生成 · 佔位圖片 · Shield Badge 生成

### 🌐 站長工具 *(9)*
HTML 標籤去除 · 瀏覽器指紋 · URL 提取 · Cookie 分析 · UA 解析器 · Sitemap 檢查 · 關鍵詞密度 · 網頁TDK 資訊檢測 · robots.txt 生成

### 🧩 其他 *(13)*
CSS 配色 · 行數統計 · htpasswd 生成 · 正則表達式 · 檔案比較 · 點陣字生成器 · 鍵盤按鍵資訊 · Chmod 權限 · OTP 密碼生成器 · ASCII 文字 · Cron 規則生成 · CIDR 計算器 · 密碼生成

> 另有內建頁面：**應用中心**、**說明與更新日誌**、**設定**。

## 💻 下載

| 平台 | 安裝檔 | 說明 |
| --- | --- | --- |
| Windows | `MagicTools_x64.exe` | 單一免安裝 exe（需 WebView2，Win10/11 系統內建） |
| macOS | `MagicTools_macOS-universal.zip` | 通用包（Apple Silicon + Intel） |
| Linux | `MagicTools_amd64.AppImage` | AppImage |

👉 **[前往 Releases 下載最新版](https://github.com/freewu/magic-tools/releases/latest)**

**Web 版**：免安裝，直接前往 [freewu.github.io/magic-tools/tools](https://freewu.github.io/magic-tools/tools/)。

## 🛠 技術棧

| 層 | 選型 |
| --- | --- |
| 桌面框架 | [Tauri 2](https://tauri.app/)（Rust） |
| 前端 UI | [React 18](https://react.dev/) |
| 元件庫 | [Ant Design 5](https://ant.design/) |
| 建置 | Vite 5 |
| 任務執行 | [just](https://github.com/casey/just) |

其他元件：CryptoJS、js-base64、color-convert、SQL Formatter、highlight.js、base-x、pinyin-pro、js-ini、yaml、toml-patch、deepmerge。

## 📦 專案結構

```
magic-tools
├── src-tauri/            # Tauri 2 主程序 (Rust): 視窗/系統匣/外部連結/設定
├── src/                  # React 前端
│   ├── App/              # 每個工具一個目錄 (自動註冊)
│   ├── layout/           # 主框架: 側邊欄/內容區
│   ├── hook/             # 全域狀態: 主題/應用上下文
│   └── lib/              # 共用工具庫
├── docs/                 # 官網 (EN / zh-CN / zh-TW) + 截圖
├── dist/                 # Web 建置產物 (部署到 GitHub Pages)
└── justfile              # 建置/打包/發布腳本
```

## 🚀 開發與執行

前置依賴：Node.js 18+、Rust、[just](https://github.com/casey/just)。

```bash
git clone https://github.com/freewu/magic-tools.git
cd magic-tools
npm install
```

| 任務 | 指令 |
| --- | --- |
| Tauri 視窗開發模式 | `just dev` |
| 僅瀏覽器除錯 | `just dev-renderer` → http://localhost:1212 |
| 預覽正式建置產物 | `just preview` → http://localhost:4173 |
| 單元測試 | `just test` |
| 程式碼檢查 | `just lint` |
| 打包桌面應用 | `just build` |
| 打包單一免安裝 exe 並複製到 `release/` | `just release` |
| 打包指定格式 | `just bundle nsis` / `appimage` / `dmg` |
| 檢查 Tauri 環境 | `just doctor` |

> ℹ️ Vite 產物為 ES Module 分包，瀏覽器禁止 `file://` 載入 module——**請勿直接雙擊 `dist/index.html`**，請改用 `just preview`（頁面也會顯示引導提示）。

## 🌐 官網

三語官網位於 [`docs/`](docs/) 目錄：

- English：[`docs/index.html`](docs/index.html)
- 简体中文：[`docs/zh-CN.html`](docs/zh-CN.html)
- 繁體中文：[`docs/zh-TW.html`](docs/zh-TW.html)

## 📝 維護者指南

### 版本修改（發布前需修改）

每次發布新版本時，將下列位置統一改為相同版本號：

1. `package.json` —— `"version"`（應用內版本號由 `src/version.ts` 自動讀取，無需另外改）
2. `src-tauri/Cargo.toml` —— 套件 `version`（系統匣選單「MagicTools Vx.y.z」顯示）
3. `src-tauri/tauri.conf.json` —— `"version"`（打包版本號）
4. `justfile` —— `version := env_var_or_default("VERSION", "...")` 預設值
5. `src/App/Help/data.tsx` —— `eventList` 頂部新增 `Vx.y.z Release` 項目（說明頁更新日誌）
6. `update.md` —— 頂部新增 `# MagicTools vX.Y.Z` 發布說明章節（Actions 以此作為 Release 說明）

改完建議驗證：`just test && just build:renderer && cargo check`。

### 發布流程（打 tag 自動建置）

```bash
just tag 1.3.1
# 等同於: git add -A && git commit -m "chore: release v1.3.1"
#          && git tag v1.3.1 && git push && git push origin v1.3.1
```

推送 `v*` tag 會觸發 GitHub Actions（`.github/workflows/build-release.yml`）三平台建置並發布到 GitHub Releases，說明取自 `update.md` **頂部第一個版本章節**；同源觸發 `deploy-pages.yml` 自動重新部署 Web 版到 GitHub Pages。

## ❓ 常見問題

- **關閉視窗卻退不出應用？** 點擊關閉按鈕會隱藏到系統匣（與舊 Electron 版一致），在系統匣右鍵選單選擇「退出」才會真正退出。
- **外部連結如何開啟？** 桌面版經 Tauri opener 外掛呼叫系統預設瀏覽器；純瀏覽器除錯環境自動退回新分頁開啟。
- **自動更新？** Tauri 版暫未內建更新器——新版本請到 Releases 頁面手動下載。

## 📄 授權

[MIT](LICENSE) © 2023 Bluefrog
