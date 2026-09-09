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

### 🧩 其他 *(14)*
CSS 配色 · 行數統計 · htpasswd 生成 · 正則表達式 · 檔案比較 · 點陣字生成器 · 鍵盤按鍵資訊 · Chmod 權限 · OTP 密碼生成器 · ASCII 文字 · Cron 規則生成 · CIDR 計算器 · 密碼生成 · 圖片主題色

> 另有內建頁面：**應用中心**、**說明與更新日誌**、**設定**。

## 💻 下載

| 平台 | 安裝檔 | 說明 |
| --- | --- | --- |
| Windows | `MagicTools_x64.exe` | 單一免安裝 exe（需 WebView2，Win10/11 系統內建） |
| macOS | `MagicTools_macOS-universal.zip` | 通用包（Apple Silicon + Intel） |
| Linux | `MagicTools_amd64.AppImage` | AppImage |

👉 **[前往 Releases 下載最新版](https://github.com/freewu/magic-tools/releases/latest)**

**Web 版**：免安裝，直接前往 [freewu.github.io/magic-tools/tools](https://freewu.github.io/magic-tools/tools/)。支援在 URL 加上 `?lang=` 參數指定語言供外部深層連結跳轉（如簡體文件跳轉 `?lang=zh-CN`、English 文件跳轉 `?lang=en`，也支援 `cn` / `tw` / `en` 簡寫）。

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
│   ├── App/              # 工具集合 + 應用殼: 每工具一個目錄, 新增目錄即自動註冊
│   │   ├── index.tsx         # 應用殼: 側邊欄選單生成 (genMenuList) + 內容區
│   │   ├── app-modules.ts    # 建置期用 import.meta.glob 靜態收集 (取代 webpack context 動態匯入)
│   │   ├── app-i18n.ts       # 應用註冊表: appNameOf() 等取各工具/固定頁三語名稱
│   │   ├── lang-packs.ts     # 彙總各工具 lang.ts 的預設語言包 (default 匯出)
│   │   └── <工具>/           # 每工具一個目錄 = 自動註冊 (目前 110 個, 清單見下)
│   │       ├── define.tsx    # 註冊中繼資料: AppName(zh-CN 預設名) / Icon / Type(分組)
│   │       ├── index.tsx     # 工具頁面元件 (預設匯出, 懶載入)
│   │       ├── lang.ts       # 預設語言包 + 三語詞條 (zh 短語即 key, 值=[zh-TW, en]) + 本地取詞函式
│   │       ├── lib.ts        # 純函式邏輯, 頁面與單測共用 (絕大多數工具)
│   │       ├── lib.test.ts   # jest 單測 (78 個工具)
│   │       ├── data.ts       # 選項/常數表與型別 (45 個工具)
│   │       ├── setting.tsx   # 設定中心內本工具的設定面板 (56 個工具)
│   │       └── intro.tsx     # About/說明 三語內容 (29 個工具)
│   ├── layout/           # 主框架: 側邊欄/內容區
│   ├── hook/             # 全域狀態: 主題/應用上下文
│   └── lib/              # 共用工具庫
├── docs/                 # 官網 (EN / zh-CN / zh-TW) + 截圖
├── dist/                 # Web 建置產物 (部署到 GitHub Pages)
└── justfile              # 建置/打包/發布腳本
```

### `src/App/` 現有工具清單

[`src/App/`](src/App/) 下現有 **110** 個工具目錄, 新增目錄即自動註冊 (一個目錄 = 一個工具, 由其中 `define.tsx` 宣告)。按下表 `Type` 分組列出 (與側邊欄/上方功能總覽一致), 括號內為目錄數。除下列公共檔案外, 個別工具另有私有檔案 (如 `AESCrypto/gcm.ts`、`Hash/sm3.ts`+`keccak.ts`、`CronRules/parse.tsx`、`Setting/setting-*.tsx` 等):

**🔐 加解密 *(21)*** — `AESCrypto` · `BlowfishCrypto` · `CaesarCrypto` · `ChaCha20Crypto` · `CiscoType7` · `DESCrypto` · `HillCrypto` · `RC2Crypto` · `RC4Crypto` · `RC5Crypto` · `RC6Crypto` · `RSACrypto` · `RabbitCrypto` · `RailFenceCrypto` · `SM2Crypto` · `SM4Crypto` · `TEACrypto` · `TripleDESCrypto` · `VigenereCrypto` · `XTEACrypto` · `XXTEACrypto`

**🧮 值計算 *(16)*** — `BCCCheck` · `BcryptCalc` · `CMACCalc` · `CRCCheck` · `ComplementCalc` · `HKDFCalc` · `Hash` · `HmacHash` · `IPConvert` · `KMACCalc` · `KeccakHash` · `LRCCheck` · `PBKDF2Calc` · `PPICalc` · `SHA3Hash` · `ScryptCalc`

**🔄 編解碼 *(13)*** — `BCDCodec` · `Base58Codec` · `Base64` · `BaseXCodec` · `BasicAuthCodec` · `GzipCodec` · `JWTDecoder` · `MorseCodec` · `Punycode` · `URL` · `UUencode` · `Unicode` · `XXencode`

**⚖️ 類型轉換 *(17)*** — `AreaConvert` · `ByteConvert` · `ColorConvert` · `ConfigConvert` · `DistanceConvert` · `DownloadLinkConvert` · `GPSConvert` · `NumberConvert` · `PinyinConvert` · `RMBConvert` · `SpeedConvert` · `SubtitleConvert` · `TemperatureConvert` · `Time` · `TreePathConvert` · `VolumeConvert` · `WeightConvert`

**🛠️ 格式化 *(8)*** — `CnEnSpacing` · `HtmlFormat` · `JSON5Formatter` · `JsonFormatter` · `MarkdownEditor` · `SQLFormatter` · `SvgFormat` · `XmlFormatter`

**🖼️ 圖片 *(9)*** — `AppIconGenerator` · `AsciiImageGenerator` · `BarcodeGenerator` · `Base64Image` · `CodeShot` · `IcoGenerator` · `PlaceholderImage` · `QRCodeGenerator` · `ShieldBadgeGenerator`

**🌐 站長工具 *(9)*** — `BrowserFingerprint` · `CookieAnalyzer` · `HtmlStripText` · `KeywordDensity` · `RobotsTxtGenerator` · `SitemapCheck` · `UrlExtract` · `UserAgentParser` · `WebTDKCheck`

**🧩 其他 *(14)*** — `AsciiTextArt` · `CIDRCalc` · `Chmod` · `Color` · `CronRules` · `DotMatrixFont` · `FileDiff` · `HtpasswdGenerator` · `ImageColor` · `KeyboardKeyInfo` · `LineCount` · `OTPGenerator` · `PasswordGenerator` · `RegexTester`

> 內建頁面 `AppStore`(應用中心) / `Help` / `Setting` 也位於 `src/App/` 下 (註冊 `Type = 'misc'`), 但屬固定頁面而非工具。

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
