// Help 页数据: 使用组件 / 开发者 / 开发时间线
// 开发时间线 (eventList) 三语: zh-CN 与 update.md 各版本节同步 (发布说明原文), zh-TW / en 为译文
export const compomentList = [
  { name: "Tauri 2", url: "https://tauri.app/" },
  { name: "React 18", url: "https://react.dev/" },
  { name: "Ant Design 5", url: "https://ant.design/" },
  { name: "CryptoJS", url: "https://github.com/brix/crypto-js" },
  { name: "js-base64", url: "https://github.com/dankogai/js-base64" },
  { name: "color-convert", url: "https://github.com/Qix-/color-convert" },
  { name: "SQL Formatter", url: "https://github.com/sql-formatter-org/sql-formatter" },
  { name: "highlight.js", url: "https://highlightjs.org/" },
  { name: "base-x", url: "https://github.com/cryptocoinjs/base-x" },
  { name: "pinyin-pro", url: "https://pinyin-pro.cn/" },
  { name: "js-ini", url: "https://github.com/Sdju/js-ini" },
  { name: "yaml", url: "https://github.com/eemeli/yaml" },
  { name: "toml-patch", url: "https://github.com/timhall/toml-patch" },
  { name: "deepmerge", url: "https://github.com/TehShrike/deepmerge" },
];

// 开发者列表
export const developerList = [
  { name: "bluefrog",url: "https://github.com/freewu",avater: "https://www.gravatar.com/avatar/c2bd3e109318983039778c259cc78db890c1b1f93b574a95c76807759c386db9" },
];

export type LKey = 'zh-CN' | 'zh-TW' | 'en';
export interface HelpEvent { color: string; title: Record<LKey, string>; items: Record<LKey, string[]>; }

const tri = (zh: string, tw: string, en: string) => ({ 'zh-CN': zh, 'zh-TW': tw, en });
const trio = (zh: string[], tw: string[], en: string[]) => ({ 'zh-CN': zh, 'zh-TW': tw, en });

export const eventList: HelpEvent[] = [
  {
    color: "green",
    title: tri("2026-09-08 V2.7.0 Release", "2026-09-08 V2.7.0 Release", "2026-09-08 V2.7.0 Release"),
    items: trio(
      [
        "二维码 / 条形码生成新增「批量」tab: 多行内容一次生成并预览, 桌面版选择文件夹一次导出全部 PNG (不再逐个弹保存框)",
        "格式化分类新增 Markdown 编辑器 (自研渲染, 支持常用语法与行内/块级 LaTeX 公式子集, 可导出 .md 与自带样式 .html); 预览面板可一键隐藏专注编辑",
        "其它分类新增密码生成: 安全随机生成 + 启发式强度检测 (熵估算 / 常见弱口令库含 leet 变体 / 破解时间估算); 站长工具新增 Sitemap 检测、关键词密度",
        "Shield Badge 生成新增图片尺寸 (1-10 倍率) 设置与放大 PNG 导出; 新增路径转树工具",
        "菜单分类调整: 占位图片 / Shield Badge / AppIcon / ICO 生成迁入「图片」分类, CIDR 计算器迁入「其它」, 设置页分组同步迁移",
        "修复 RC2 / RC6 / Blowfish 与 Markdown 编辑器不在侧边菜单显示的问题; 字幕格式转换桌面版下载不弹保存框; 深色模式下固定灰字提示不可见; 左下角版本号移除多余悬停提示",
      ],
      [
        "二維碼 / 條碼產生器新增「批次」頁籤: 多行內容一次產生並預覽, 桌面版可選擇資料夾一次匯出全部 PNG (不再逐個跳出儲存視窗)",
        "格式化分類新增 Markdown 編輯器 (自研渲染, 支援常用語法與行內/區塊 LaTeX 公式子集, 可匯出 .md 與帶樣式的 .html); 預覽面板可一鍵隱藏專注編輯",
        "其他分類新增密碼產生器: 安全隨機產生 + 啟發式強度偵測 (熵估算 / 常見弱密碼庫含 leet 變體 / 破解時間估算); 站長工具新增 Sitemap 檢測、關鍵字密度",
        "Shield Badge 產生器新增圖片尺寸 (1-10 倍率) 設定與放大 PNG 匯出; 新增路徑轉樹狀工具",
        "選單分類調整: 占位圖片 / Shield Badge / AppIcon / ICO 產生器移入「圖片」分類, CIDR 計算器移入「其他」, 設定頁分組同步調整",
        "修復 RC2 / RC6 / Blowfish 與 Markdown 編輯器未顯示於側邊選單的問題; 字幕格式轉換桌面版下載不再彈儲存視窗; 修復深色模式下固定灰字提示不可見; 左下角版本號移除多餘的懸停提示",
      ],
      [
        "QR / barcode generator adds a “Batch” tab: generate and preview many lines at once; the desktop build exports all PNGs into a chosen folder in one go (no more per-file save dialogs)",
        "The Formatting category gains a Markdown editor (self-built renderer: common syntax plus inline/block LaTeX formula subsets, exports .md and self-styled .html); the preview panel can be hidden for focused editing",
        "The Others category gains a password generator (secure random + heuristic strength checks: entropy estimate / common weak-password list incl. leet variants / crack-time estimate); webmaster tools add Sitemap check and keyword density",
        "Shield Badge generator adds an image size (1–10×) setting and scaled-up PNG export; new “Path to Tree” tool",
        "Menu category reshuffle: Placeholder Image / Shield Badge / AppIcon / ICO moved to “Image”, CIDR Calculator to “Others”, settings-page groups moved to match",
        "Fixed RC2 / RC6 / Blowfish and the Markdown editor not showing in the sidebar menu; Subtitle converter downloads no longer pop a save dialog on desktop; fixed dim-gray hints being invisible in dark mode; removed the redundant hover tooltip on the bottom-left version number",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-08 V2.6.0 Release", "2026-09-08 V2.6.0 Release", "2026-09-08 V2.6.0 Release"),
    items: trio(
      [
        "新增「格式化」分类: JSON / JSON5 / SQL 格式化移入独立分类 (侧边菜单/应用中心/设置页同步分组)",
        "字幕格式转换: SRT/VTT/SBV/SUB/SSA/ASS/SMI/LRC/JSON 九格式互转 (本地解析, 样式指令剥除, 自动检测 + MicroDVD fps)",
        "加解密新增 RC5 / RC2 / Blowfish / RC6 (参考 AES 的五模式 UI) 与 ChaCha20 (RFC 7539, 官方向量验证)",
        "值计算新增 CMAC / HKDF / KMAC、原码/反码/补码; 颜色格式转换新增 7 组配色方案 (主色居中, 点击复制 HEX)",
        "编解码新增 HTTP Basic Auth 与 Chmod 权限; 其它新增 IP 转换 (IPv4 ↔ 整数/HEX/BIN) 与 OTP 密码生成器 (TOTP/HOTP, otpauth URI 扫码导入)",
        "其它新增键盘按键信息、点阵字生成器、文件比较; 配置转换支持 XML 互转 + 拖入自动识别",
        "时间工具新增 GPS/北斗/伽利略/格洛纳斯/儒略日输出",
        "启动后自动检测 GitHub 新版本 (右下角弹窗提示, 点击打开下载页)",
        "修复应用中心分类布局与分割线显示问题",
      ],
      [
        "新增「格式化」分類: JSON / JSON5 / SQL 格式化移入獨立分類 (側邊選單/應用中心/設定頁同步分組)",
        "字幕格式轉換: SRT/VTT/SBV/SUB/SSA/ASS/SMI/LRC/JSON 九格式互轉 (本機解析, 剝除樣式指令, 自動偵測 + MicroDVD fps)",
        "加解密新增 RC5 / RC2 / Blowfish / RC6 (參考 AES 的五模式 UI) 與 ChaCha20 (RFC 7539, 以官方測試向量驗證)",
        "值計算新增 CMAC / HKDF / KMAC、原碼/反碼/補碼; 顏色格式轉換新增 7 組配色方案 (主色置中, 點擊複製 HEX)",
        "編解碼新增 HTTP Basic Auth 與 Chmod 權限; 其他新增 IP 轉換 (IPv4 ↔ 整數/HEX/BIN) 與 OTP 密碼產生器 (TOTP/HOTP, 可掃 otpauth URI 匯入)",
        "其他新增鍵盤按鍵資訊、點陣字產生器、檔案比較; 設定檔轉換支援 XML 互轉 + 拖入自動辨識",
        "時間工具新增 GPS/北斗/伽利略/格洛納斯/儒略日輸出",
        "啟動後自動偵測 GitHub 新版本 (右下角彈窗提示, 點擊開啟下載頁)",
        "修復應用中心分類版面與分隔線顯示問題",
      ],
      [
        "New “Formatting” category: JSON / JSON5 / SQL formatters moved into a category of their own (sidebar menu / app center / settings groups kept in sync)",
        "Subtitle format conversion: SRT/VTT/SBV/SUB/SSA/ASS/SMI/LRC/JSON — nine formats interconverted (parsed locally, style directives stripped, auto-detection + MicroDVD fps)",
        "Crypto adds RC5 / RC2 / Blowfish / RC6 (five-mode AES-style UI) and ChaCha20 (RFC 7539, verified with official vectors)",
        "Value calculators add CMAC / HKDF / KMAC and sign-magnitude / ones' complement / two's complement; the color converter adds 7 palette schemes (primary color centered, click to copy HEX)",
        "Codecs add HTTP Basic Auth and Chmod permissions; Others add IP conversion (IPv4 ↔ integer/HEX/BIN) and an OTP password generator (TOTP/HOTP, scan-to-import via otpauth URI)",
        "Others add keyboard key info, a dot-matrix font generator and file comparison; Config converter supports XML interchange plus drop-in auto-detection",
        "Time tools add GPS / BeiDou / Galileo / GLONASS and Julian-day output",
        "Checks for new GitHub releases on startup (toast in the bottom-right corner; clicking opens the download page)",
        "Fixed the app-center category layout and divider display issues",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-07 V2.5.0 Release", "2026-09-07 V2.5.0 Release", "2026-09-07 V2.5.0 Release"),
    items: trio(
      [
        "值计算新增 BCrypt 生成/校验、Scrypt (RFC 7914 零依赖实现)、PPI 计算 (标准 RGB / Pentile 等效 PPI, 含 13 种常用屏幕预设)",
        "加解密新增 Cisco Type 7; 编解码新增 Gzip (压缩率统计/双格式展示); Hash 值计算页移除 bcrypt 算法区",
        "站长工具新增占位图片与 Shield Badge 生成, 设置页新增站长工具分类 tab, App Icon 三平台可勾选",
        "其它分类新增 ASCII 图片与 ASCII 文字 (figlet 风格大字)",
        "侧边菜单展开时分类标题显示所属应用数量徽标",
        "修复 just release 产物复制 (路径层级/安装包过滤) 与面包屑误带徽标问题",
      ],
      [
        "值計算新增 BCrypt 產生/驗證、Scrypt (RFC 7914 零依賴實作)、PPI 計算 (標準 RGB / Pentile 等效 PPI, 含 13 種常用螢幕預設)",
        "加解密新增 Cisco Type 7; 編解碼新增 Gzip (壓縮率統計/雙格式顯示); Hash 值計算頁移除 bcrypt 演算法區",
        "站長工具新增占位圖片與 Shield Badge 產生器, 設定頁新增站長工具分類頁籤, App Icon 三平台可勾選",
        "其他分類新增 ASCII 圖片與 ASCII 文字 (figlet 風格大字)",
        "側邊選單展開時分類標題顯示所含應用數量徽章",
        "修復 just release 產物複製 (路徑層級/安裝包過濾) 與麵包屑誤帶徽章的問題",
      ],
      [
        "Value calculators add BCrypt generation/verification, Scrypt (RFC 7914, zero-dependency implementation) and a PPI calculator (standard RGB / Pentile effective PPI, 13 common screen presets)",
        "Crypto adds Cisco Type 7; codecs add Gzip (compression-ratio stats / dual-format display); the bcrypt algorithm section is removed from the Hash page",
        "Webmaster tools add Placeholder Image and Shield Badge generators; the settings page gains a webmaster-tools category tab; App Icon platforms are checkable",
        "The Others category adds ASCII images and ASCII text (figlet-style banner letters)",
        "Category titles in the sidebar show a count badge of their apps when expanded",
        "Fixed just release artifact copying (path depth / installer filtering) and the breadcrumb wrongly carrying badges",
      ],
    ),
  },
  {
    color: "green",
    title: tri(
      "2026-09-05 V2.4.1 Release（修复 v2.4.0 黑屏后的重新发布版）",
      "2026-09-05 V2.4.1 Release（修復 v2.4.0 黑畫面後的重新發布版）",
      "2026-09-05 V2.4.1 Release (re-release fixing the v2.4.0 black screen)",
    ),
    items: trio(
      [
        "【本版发布原因】修复 v2.4.0 安装包启动黑屏: 残留 CJS require 改 ESM import + CSP 调整兼容 antd 运行时样式 (webpack→Vite 产物兼容问题)",
        "新增站长工具分类: 网页 TDK 信息检测与 robots.txt 生成",
        "编解码新增摩斯码编解码 (播放高亮/多音效/常用编码/一键保存 WAV 弹窗选择位置)、UUencode/XXencode、JWT 解码器",
        "加解密新增 RSA / SM2 国密、SM4、AES GCM 认证加密、Caesar/Rail Fence/Vigenere/Hill 古典密码",
        "值计算新增 SHA3 Hash / Keccak Hash; 其它分类新增 htpasswd 生成、正则表达式工具、Cron 规则生成",
        "正则表达式: 预设增至 17 条 (常用 5 条新增) + 一键复制规则",
        "Cron 规则生成新增「解析」页签 (逐字段中文解读 + 未来 10 次触发时间)",
        "设置页改为 VSCode 式布局 (分类导航移至左侧栏, 记住上次分类)",
        "修复 App 列表加载竞态与网页 TDK 深色模式显示问题",
        "渲染进程构建由 webpack 迁移至 Vite",
      ],
      [
        "【本版發布原因】修復 v2.4.0 安裝包啟動黑畫面: 殘留 CJS require 改為 ESM import + 調整 CSP 以相容 antd 執行期樣式 (webpack→Vite 產物相容問題)",
        "新增站長工具分類: 網頁 TDK 資訊偵測與 robots.txt 產生",
        "編解碼新增摩斯電碼編解碼 (播放高亮/多種音效/常用編碼/一鍵儲存 WAV 彈窗選擇位置)、UUencode/XXencode、JWT 解碼器",
        "加解密新增 RSA / SM2 國密、SM4、AES GCM 認證加密、Caesar/Rail Fence/Vigenere/Hill 古典密碼",
        "值計算新增 SHA3 Hash / Keccak Hash; 其他分類新增 htpasswd 產生、正則表達式工具、Cron 規則產生",
        "正則表達式: 預設增至 17 條 (常用新增 5 條) + 一鍵複製規則",
        "Cron 規則產生新增「解析」頁籤 (逐欄位解讀 + 未來 10 次觸發時間)",
        "設定頁改為 VSCode 式版面 (分類導覽移至左側欄, 記住上次分類)",
        "修復 App 清單載入競態與網頁 TDK 深色模式顯示問題",
        "渲染程序建置由 webpack 遷移至 Vite",
      ],
      [
        "[Reason for this release] Fixes the v2.4.0 installer black screen on startup: leftover CJS requires converted to ESM imports + CSP adjusted to accommodate antd runtime styles (webpack→Vite artifact compatibility)",
        "New webmaster-tools category: webpage TDK info detection and robots.txt generation",
        "Codecs add Morse encoding/decoding (playback highlight / multiple tones / common codes / one-click WAV save with a location picker), UUencode/XXencode and a JWT decoder",
        "Crypto adds RSA / SM2 (Chinese national standard), SM4, AES-GCM authenticated encryption and the Caesar / Rail Fence / Vigenère / Hill classical ciphers",
        "Value calculators add SHA3 Hash / Keccak Hash; the Others category adds htpasswd generation, a regex tester and a Cron rule generator",
        "Regex tester: presets raised to 17 (5 new common ones) + one-click rule copying",
        "Cron rule generator adds a “Parse” tab (field-by-field breakdown + next 10 firing times)",
        "Settings page switched to a VSCode-style layout (category nav moved to the left rail, last category remembered)",
        "Fixed the app-list loading race and the webpage-TDK display issue in dark mode",
        "Renderer build migrated from webpack to Vite",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-03 V2.2.0 Release", "2026-09-03 V2.2.0 Release", "2026-09-03 V2.2.0 Release"),
    items: trio(
      [
        "编解码新增 Punycode 编解码",
        "值计算新增 BCC 校验 (XOR) / LRC 校验 (累加和·Modbus 补码) / CRC 校验 (44 种标准 CRC-3~64 参数化计算, 含多项式公式展示)",
        "校验结果输出行点击即复制, 展示样式与 Hash 计算对齐",
        "设置新增 BCC/LRC/CRC 默认输入格式 (默认 ASCII/文本) 与 CRC 默认校验算法 (默认 CRC-16/MODBUS)",
        "CRC 算法下拉可搜索并展示多项式公式, 深色模式适配",
      ],
      [
        "編解碼新增 Punycode 編解碼",
        "值計算新增 BCC 校驗 (XOR) / LRC 校驗 (累加和·Modbus 補碼) / CRC 校驗 (44 種標準 CRC-3~64 參數化計算, 含多項式公式展示)",
        "校驗結果輸出列點擊即複製, 顯示樣式與 Hash 計算對齊",
        "設定新增 BCC/LRC/CRC 預設輸入格式 (預設 ASCII/文字) 與 CRC 預設校驗演算法 (預設 CRC-16/MODBUS)",
        "CRC 演算法下拉可搜尋並顯示多項式公式, 已適配深色模式",
      ],
      [
        "Codecs add Punycode encoding/decoding",
        "Value calculators add BCC check (XOR) / LRC check (running sum, Modbus complement) / CRC check (44 standard CRC-3~64 parametrized computations incl. polynomial-formula display)",
        "Checksum result rows copy on click; the display style is aligned with the Hash page",
        "Settings add a default input format for BCC/LRC/CRC (default ASCII/text) and a default CRC algorithm (default CRC-16/MODBUS)",
        "The CRC algorithm dropdown is searchable and shows polynomial formulas; dark mode adapted",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-03 V2.1.1 Release", "2026-09-03 V2.1.1 Release", "2026-09-03 V2.1.1 Release"),
    items: trio(
      [
        "目录重构: src/renderer 代码上移到 src 根目录",
        "Tab 切换保活: 切换标签页不丢失已填写数据",
        "条形码生成: 下载 PNG 弹出系统保存对话框选位置",
        "二维码生成: 新增「保存图片」按钮, 点击二维码预览也可保存 PNG",
      ],
      [
        "目錄重構: src/renderer 程式碼上移到 src 根目錄",
        "Tab 切換保活: 切換分頁不遺失已填寫的資料",
        "條碼產生: 下載 PNG 時彈出系統儲存對話框選擇位置",
        "二維碼產生: 新增「儲存圖片」按鈕, 點擊二維碼預覽也可儲存 PNG",
      ],
      [
        "Directory restructure: src/renderer code moved up to the src root",
        "Tab keep-alive: switching tabs no longer loses entered data",
        "Barcode generator: downloading a PNG opens the system save dialog to pick a location",
        "QR generator: new “Save image” button; clicking the QR preview also saves a PNG",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-03 V2.1.0 Release", "2026-09-03 V2.1.0 Release", "2026-09-03 V2.1.0 Release"),
    items: trio(
      [
        "新增 TEA / XTEA / XXTEA 加解密工具",
        "Hash 值计算新增 SM3 / BCrypt",
        "新增条形码生成 (CODE128 / EAN-13 / UPC-A / CODE39 / ITF / MSI / Pharmacode 等 16 种格式)",
        "应用只运行单实例; 托盘菜单支持直达设置/帮助/应用中心; 内容区顶部应用标签页与面包屑、标签右键菜单",
      ],
      [
        "新增 TEA / XTEA / XXTEA 加解密工具",
        "Hash 值計算新增 SM3 / BCrypt",
        "新增條碼產生 (CODE128 / EAN-13 / UPC-A / CODE39 / ITF / MSI / Pharmacode 等 16 種格式)",
        "應用僅執行單一實例; 托盤選單可直接開啟設定/說明/應用中心; 內容區頂部應用分頁與麵包屑、分頁右鍵選單",
      ],
      [
        "New TEA / XTEA / XXTEA crypto tools",
        "Hash calculator adds SM3 / BCrypt",
        "New barcode generator (CODE128 / EAN-13 / UPC-A / CODE39 / ITF / MSI / Pharmacode — 16 formats in all)",
        "Single-instance app; tray menu links straight to Settings / Help / App Center; app tabs with breadcrumbs and a tab right-click menu atop the content area",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-02-28 V2.0.0 Release", "2026-02-28 V2.0.0 Release", "2026-02-28 V2.0.0 Release"),
    items: trio(
      [
        "核心重构: 从 Electron 迁移到 Tauri 2 (体积更小、内存占用更低)",
        "构建发布: just 命令 + GitHub Actions 三平台自动打包 (win / macos / linux)",
        "Windows 提供单体免安装 exe, Linux 提供免安装 AppImage",
      ],
      [
        "核心重構: 從 Electron 遷移至 Tauri 2 (體積更小、記憶體占用更低)",
        "建置發布: just 指令 + GitHub Actions 三平台自動打包 (win / macos / linux)",
        "Windows 提供單體免安裝 exe, Linux 提供免安裝 AppImage",
      ],
      [
        "Core rewrite: migrated from Electron to Tauri 2 (smaller size, lower memory usage)",
        "Build & release: just commands + GitHub Actions auto-packaging for three platforms (win / macos / linux)",
        "Portable single-file exe for Windows; install-free AppImage for Linux",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2023-07-11 V1.3.0 Release", "2023-07-11 V1.3.0 Release", "2023-07-11 V1.3.0 Release"),
    items: trio(
      [
        "温度转换", "距离转换", "速度转换",
        "配置文件转换 (ini / json / yaml / toml / properties)",
        "面积转换", "容积转换", "质量转换",
      ],
      [
        "溫度轉換", "距離轉換", "速度轉換",
        "設定檔轉換 (ini / json / yaml / toml / properties)",
        "面積轉換", "容積轉換", "質量轉換",
      ],
      [
        "Temperature conversion", "Distance conversion", "Speed conversion",
        "Config file conversion (ini / json / yaml / toml / properties)",
        "Area conversion", "Volume conversion", "Mass conversion",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2023-06-30 V1.2.0 Release", "2023-06-30 V1.2.0 Release", "2023-06-30 V1.2.0 Release"),
    items: trio(
      [
        "Base64 图片", "中文拼音", "GPS坐标转换", "人民币大写", "字节转换",
      ],
      [
        "Base64 圖片", "中文拼音", "GPS 座標轉換", "人民幣大寫", "位元組轉換",
      ],
      [
        "Base64 image", "Chinese Pinyin", "GPS coordinate conversion", "RMB uppercase amount", "Byte conversion",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2023-06-15 V1.1.0 Release", "2023-06-15 V1.1.0 Release", "2023-06-15 V1.1.0 Release"),
    items: trio(
      [
        "DES 加密 / 解密", "AES 加密 / 解密", "Rabbit 加密 / 解密",
        "RC4 加密 / 解密", "3DES 加密 / 解密", "Base58 编码 / 解码", "PBKDF2 值计算",
      ],
      [
        "DES 加密 / 解密", "AES 加密 / 解密", "Rabbit 加密 / 解密",
        "RC4 加密 / 解密", "3DES 加密 / 解密", "Base58 編碼 / 解碼", "PBKDF2 值計算",
      ],
      [
        "DES encryption / decryption", "AES encryption / decryption", "Rabbit encryption / decryption",
        "RC4 encryption / decryption", "3DES encryption / decryption", "Base58 encoding / decoding", "PBKDF2 calculator",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2023-06-07 V1.0.0 Release", "2023-06-07 V1.0.0 Release", "2023-06-07 V1.0.0 Release"),
    items: trio(
      [
        "Hash 值计算", "Base64 编码 / 解码", "URL 编码 / 解码", "时间戳转换", "CSS 配色",
        "颜色格式转换", "进制转换 ( BIN / OCT / DEC / HEX )", "二维码生成", "HmacHash 值计算",
        "SQL 格式化", "行数统计", "Unicode 编码 / 解码",
      ],
      [
        "Hash 值計算", "Base64 編碼 / 解碼", "URL 編碼 / 解碼", "時間戳轉換", "CSS 配色",
        "顏色格式轉換", "進位轉換 ( BIN / OCT / DEC / HEX )", "二維碼產生", "HmacHash 值計算",
        "SQL 格式化", "行數統計", "Unicode 編碼 / 解碼",
      ],
      [
        "Hash calculator", "Base64 encoding / decoding", "URL encoding / decoding", "Timestamp converter", "CSS Colors",
        "Color format conversion", "Base conversion (BIN / OCT / DEC / HEX)", "QR code generator", "HmacHash calculator",
        "SQL formatter", "Line counter", "Unicode encoding / decoding",
      ],
    ),
  },
];
