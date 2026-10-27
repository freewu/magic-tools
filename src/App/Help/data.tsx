// Help 页数据: 使用组件 / 开发者 / 开发时间线
// 开发时间线 (eventList) 三语: zh-CN 与 update.md 各版本节同步 (发布说明原文), zh-TW / en 为译文
import { buildBadgeSvg, svgToDataUrl } from '../ShieldBadgeGenerator/lib';
// 开发者头像: 本地图片 (原 Gravatar 头像已下载进仓库), 运行期不联网
import developerAvatar from '../../../assets/bluefrog.png';

/** 使用组件: 本地生成 shields.io 风格 badge 展示 (名称 + 版本号), 不请求网络 */
export interface HelpComponent {
  /** 组件名 (badge 左侧文案) */
  name: string;
  /** 当前实际使用的版本号 (badge 右侧文案): node_modules 安装版本 / Rust crate 版本 */
  version: string;
  url: string;
  /** 版本号底色 (十六进制, 不带 #), 缺省用 DEFAULT_BADGE_COLOR */
  color?: string;
}

/** badge 缺省底色 (indigo) */
export const DEFAULT_BADGE_COLOR = "4F46E5";

/** badge 标签段底色 (深灰, 与 shields.io 的 labelColor 一致) */
export const DEFAULT_BADGE_LABEL_COLOR = "24292F";

// 版本号 = 当前实际使用的版本, 升级依赖时请同步更新
// (可执行 node -p "require('./node_modules/<pkg>/package.json').version" 查看安装版本)
export const compomentList: HelpComponent[] = [
  { name: "Tauri", version: "2.12.0", url: "https://tauri.app/", color: "0E7490" },
  { name: "React", version: "18.3.1", url: "https://react.dev/", color: "087EA4" },
  { name: "React Router", version: "6.30.6", url: "https://reactrouter.com/", color: "CA4245" },
  { name: "Ant Design", version: "5.29.3", url: "https://ant.design/", color: "0170FE" },
  { name: "CryptoJS", version: "4.1.1", url: "https://github.com/brix/crypto-js" },
  { name: "bcryptjs", version: "3.0.2", url: "https://github.com/dcodeIO/bcrypt.js" },
  { name: "js-base64", version: "3.9.3", url: "https://github.com/dankogai/js-base64" },
  { name: "base-x", version: "4.0.1", url: "https://github.com/cryptocoinjs/base-x" },
  { name: "color-convert", version: "2.0.1", url: "https://github.com/Qix-/color-convert" },
  { name: "SQL Formatter", version: "12.2.4", url: "https://github.com/sql-formatter-org/sql-formatter" },
  { name: "highlight.js", version: "11.12.0", url: "https://highlightjs.org/" },
  { name: "Shiki", version: "4.4.3", url: "https://shiki.style/" },
  { name: "Pele", version: "1.6.0", url: "https://pele.run/", color: "EC8B49" },
  { name: "Excalidraw", version: "0.18.1", url: "https://excalidraw.com/", color: "6965DB" },
  { name: "bignumber.js", version: "9.3.1", url: "https://github.com/MikeMcl/bignumber.js", color: "3A5BA0" },
  { name: "markmap", version: "0.18.12", url: "https://markmap.js.org/", color: "1F6FEB" },
  { name: "Vditor", version: "4.0.0", url: "https://github.com/Vanessa219/vditor" },
  { name: "SVGO", version: "4.1.0", url: "https://github.com/svg/svgo" },
  { name: "VTracer", version: "0.1.0", url: "https://github.com/visioncortex/vtracer", color: "B7410E" },
  { name: "JsBarcode", version: "3.12.3", url: "https://github.com/lindell/JsBarcode" },
  { name: "jsQR", version: "1.4.0", url: "https://github.com/cozmo/jsQR" },
  { name: "figlet.js", version: "1.11.4", url: "https://github.com/patorjk/figlet.js" },
  { name: "html-to-image", version: "1.11.13", url: "https://github.com/bubkoo/html-to-image" },
  { name: "JSON5", version: "2.2.3", url: "https://json5.org/", color: "000000" },
  { name: "fast-xml-parser", version: "4.5.7", url: "https://github.com/NaturalIntelligence/fast-xml-parser", color: "005FAD" },
  { name: "pinyin-pro", version: "3.29.3", url: "https://pinyin-pro.cn/" },
  { name: "js-ini", version: "1.6.0", url: "https://github.com/Sdju/js-ini" },
  { name: "yaml", version: "2.9.0", url: "https://github.com/eemeli/yaml", color: "CB171E" },
  { name: "toml-patch", version: "0.2.3", url: "https://github.com/timhall/toml-patch", color: "9C4121" },
  { name: "deepmerge", version: "4.3.1", url: "https://github.com/TehShrike/deepmerge" },
  { name: "JSZip", version: "3.10.2", url: "https://stuk.github.io/jszip/", color: "F7DF1E" },
  { name: "gifuct-js", version: "2.1.2", url: "https://github.com/matt-way/gifuct-js", color: "F7DF1E" },
  { name: "modern-gif", version: "2.1.0", url: "https://github.com/qq15725/modern-gif", color: "F7DF1E" },
  { name: "jsnes", version: "2.1.0", url: "https://github.com/bfirsh/jsnes", color: "6B4EA0" },
  { name: "boytacean", version: "0.13.2", url: "https://github.com/joamag/boytacean", color: "2E7D32" },
  // EmulatorJS 未走 npm: 整包内置在 src/public/emulatorjs 下 (版本见该目录 README)
  { name: "EmulatorJS", version: "4.2.3", url: "https://emulatorjs.org/", color: "4B5563" },
];

/**
 * 本地生成 badge (shields.io 风格 SVG -> data URL)
 * 复用「Shield Badge 生成」同一套 SVG 渲染, 显示时不再请求 img.shields.io:
 * 桌面端 / 内网 / 离线环境同样能正常显示组件卡片
 */
export const componentBadgeSrc = (item: HelpComponent) =>
  svgToDataUrl(
    buildBadgeSvg({
      label: item.name,
      value: item.version,
      fg: "#fff",
      status: `#${item.color || DEFAULT_BADGE_COLOR}`,
      labelBg: `#${DEFAULT_BADGE_LABEL_COLOR}`,
    })
  );

// 开发者列表
// 头像: 本地文件 assets/bluefrog.png (随构建打包, 图标缺失/离线也不影响)
export const developerList = [
  { name: "bluefrog", url: "https://github.com/freewu", avatar: developerAvatar },
];

export type LKey = 'zh-CN' | 'zh-TW' | 'en';
export interface HelpEvent { color: string; title: Record<LKey, string>; items: Record<LKey, string[]>; }

const tri = (zh: string, tw: string, en: string) => ({ 'zh-CN': zh, 'zh-TW': tw, en });
const trio = (zh: string[], tw: string[], en: string[]) => ({ 'zh-CN': zh, 'zh-TW': tw, en });

export const eventList: HelpEvent[] = [
  {
    color: "green",
    title: tri("2026-10-27 V2.25.0 Release", "2026-10-27 V2.25.0 Release", "2026-10-27 V2.25.0 Release"),
    items: trio(
      [
        "新增应用: 空档接龙、蜘蛛纸牌、Sega 模拟器、贪吃蛇 (工具总数 156 → 160, 「游戏」由 5 个增加到 9 个)",
        "新增功能: 空档接龙 / 蜘蛛纸牌支持鼠标与触屏拖拽移牌; Sega 模拟器支持键盘键位逐个重绑, 并在游戏画面上浮出半透明虚拟按键 (透明度可调, 键盘 / 手柄按下同步高亮); 贪吃蛇支持四档速度、穿墙与障碍物、限时金苹果、音效与三档棋盘尺寸",
        "体验改进: 设置中心「游戏」分区新增 Sega 模拟器与贪吃蛇的默认设置; 贪吃蛇改为「上方工具条 + 下方棋盘」布局, 普通模式与全屏模式共用同一套工具条",
        "问题修复: 蜘蛛纸牌的发牌动画、点不中牌、多张连牌拖拽、全屏工具条吸顶与落点吸附; 贪吃蛇棋盘被压缩、设置中心定位不到「默认尺寸」行",
      ],
      [
        "新增應用: 空檔接龍、蜘蛛紙牌、Sega 模擬器、貪吃蛇 (工具總數 156 → 160, 「遊戲」由 5 個增加到 9 個)",
        "新增功能: 空檔接龍 / 蜘蛛紙牌支援滑鼠與觸控拖曳移牌; Sega 模擬器支援鍵盤鍵位逐個重新綁定, 並在遊戲畫面上浮出半透明虛擬按鍵 (透明度可調, 鍵盤 / 手把按下同步高亮); 貪吃蛇支援四檔速度、穿牆與障礙物、限時金蘋果、音效與三檔棋盤尺寸",
        "體驗改進: 設定中心「遊戲」分區新增 Sega 模擬器與貪吃蛇的預設設定; 貪吃蛇改為「上方工具列 + 下方棋盤」版面, 一般模式與全螢幕模式共用同一套工具列",
        "問題修正: 蜘蛛紙牌的發牌動畫、點不中牌、多張連牌拖曳、全螢幕工具列吸頂與落點吸附; 貪吃蛇棋盤被壓縮、設定中心定位不到「預設尺寸」列",
      ],
      [
        "New apps: FreeCell, Spider Solitaire, Sega Emulator and Snake (tools 156 → 160, Games 5 → 9)",
        "New features: FreeCell and Spider Solitaire support drag-to-move with mouse and touch; the Sega Emulator lets you rebind every keyboard key and floats a translucent pad over the game (adjustable opacity, keyboard / gamepad presses light it up); Snake gained four speeds, wrap-around and obstacles, a time-limited golden apple, sound effects and three board sizes",
        "Improvements: the Games section in Settings gained default options for the Sega Emulator and Snake; Snake moved to a toolbar-above / board-below layout shared by the normal and fullscreen modes",
        "Fixes: Spider Solitaire deal animation, unclickable cards, multi-card dragging, the toolbar not sticking in fullscreen and drop snapping; the Snake board being squeezed and the board-size settings row not being found",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-10-23 V2.24.0 Release", "2026-10-23 V2.24.0 Release", "2026-10-23 V2.24.0 Release"),
    items: trio(
      [
        "新增应用: 2048、俄罗斯方块、扫雷、NES 模拟器、GameBoy 模拟器 (新增「游戏」分类, 工具总数 151 → 156)",
        "新增功能: 设置中心可勾选应用中心要展示的分类, 侧边栏与应用中心实时同步过滤 (不影响收藏); NES / GameBoy 模拟器全屏时画面浮出半透明虚拟按键 (透明度可调, 键盘 / 手柄按下同步高亮)",
        "问题修复: NES 模拟器拖入 ROM 没有反应、载入后没有声音、画面黑屏 (帧缓冲缺 alpha 通道且 R / B 颠倒)",
      ],
      [
        "新增應用: 2048、俄羅斯方塊、踩地雷、NES 模擬器、GameBoy 模擬器 (新增「遊戲」分類, 工具總數 151 → 156)",
        "新增功能: 設定中心可勾選應用中心要展示的分類, 側邊欄與應用中心即時同步過濾 (不影響收藏); NES / GameBoy 模擬器全螢幕時畫面浮出半透明虛擬按鍵 (透明度可調, 鍵盤 / 手把按下同步高亮)",
        "問題修正: NES 模擬器拖入 ROM 沒有反應、載入後沒有聲音、畫面黑屏 (影格緩衝缺 alpha 通道且 R / B 顛倒)",
      ],
      [
        "New apps: 2048, Tetris, Minesweeper, NES Emulator and GameBoy Emulator (a new Games category; tools 151 → 156)",
        "New features: Settings can choose which categories the App Center shows, filtering the sidebar and the App Center live (Favorites untouched); the NES and GameBoy emulators float a translucent pad over the picture in fullscreen (adjustable opacity, keyboard and gamepad presses light it up)",
        "Fixes: NES ROMs dropped on the page were ignored, there was no sound after loading, and the picture stayed black (framebuffer missing its alpha channel with R / B swapped)",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-10-19 V2.23.2 Release", "2026-10-19 V2.23.2 Release", "2026-10-19 V2.23.2 Release"),
    items: trio(
      [
        "体验改进: Mermaid 编辑器的渲染引擎由 mermaid 换成 pele (零依赖单文件引擎, 仍内置 32 种图形示例); 图表配色跟随「背景」设置, 切换背景不再重新渲染; 错误提示按类型分类并给出「第 N 行, 第 M 列」定位; 图表里的 HTML 只按纯文本渲染, 链接与外部图片默认不生效",
        "问题修复: 首屏白预载 3.6MB 的 mermaid 分包 (入口静态依赖了用不到的引擎), 改为纯按需加载, 首屏预载 gzip 1523KB → 585KB",
        "帮助页「使用组件」把 Mermaid 11.17.2 换为 Pele 1.6.0",
      ],
      [
        "體驗改進: Mermaid 編輯器的渲染引擎由 mermaid 換成 pele (零相依單檔引擎, 仍內建 32 種圖形範例); 圖表配色跟隨「背景」設定, 切換背景不再重新渲染; 錯誤提示依類型分類並給出「第 N 行, 第 M 列」定位; 圖表中的 HTML 只按純文字渲染, 連結與外部圖片預設不生效",
        "問題修正: 首屏白預載 3.6MB 的 mermaid 分包 (入口靜態相依了用不到的引擎), 改為純按需載入, 首屏預載 gzip 1523KB → 585KB",
        "說明頁「使用元件」把 Mermaid 11.17.2 換為 Pele 1.6.0",
      ],
      [
        "Improvements: the Mermaid Editor now renders with pele instead of mermaid (a dependency-free single-file engine, still shipping 32 diagram samples); diagram colours follow the Background setting and switching backgrounds no longer re-renders; errors are grouped by kind with line / column positions; HTML inside diagrams is rendered as plain text and links or remote images stay inert",
        "Fixes: the first screen preloaded a 3.6MB mermaid chunk it never used — it is now loaded strictly on demand, cutting preloaded gzip from 1523KB to 585KB",
        "The Help components list moved from Mermaid 11.17.2 to Pele 1.6.0",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-10-15 V2.23.1 Release", "2026-10-15 V2.23.1 Release", "2026-10-15 V2.23.1 Release"),
    items: trio(
      [
        "新增功能: 敏感词检测新增扩展词库 (17 个分类 / 约 7.4 万条, 勾选后才按需加载) 与打码预览 (高亮被打码位置, 可复制结果); XML / HTML 格式化新增结构树视图; Markdown 编辑器 / Mermaid 编辑器新增全屏模式",
        "体验改进: XML / HTML 格式化拆成「格式化结果 / 结构树」分页签并支持打开本地文件与原生保存; Markdown 系工具支持打开本地文件并沿用原文件名保存; 敏感词打码字符可选可填; CSS 配色色卡编码跟随颜色类型; 应用中心撤下上一版本新增应用的 NEW 徽标",
      ],
      [
        "新增功能: 敏感詞檢測新增擴充詞庫 (17 個分類 / 約 7.4 萬筆, 勾選後才按需載入) 與打碼預覽 (高亮被打碼位置, 可複製結果); XML / HTML 格式化新增結構樹視圖; Markdown 編輯器 / Mermaid 編輯器新增全螢幕模式",
        "體驗改進: XML / HTML 格式化拆成「格式化結果 / 結構樹」分頁籤並支援開啟本機檔案與原生儲存; Markdown 系列工具支援開啟本機檔案並沿用原檔名儲存; 敏感詞打碼字元可選可填; CSS 配色色卡編碼跟隨顏色類型; 應用中心撤下上一版本新增應用的 NEW 徽標",
      ],
      [
        "New features: Sensitive Word Detection gained an extended lexicon (17 categories, about 74k entries, loaded only when ticked) and a masking preview that highlights masked spots and can copy the result; XML and HTML Formatter gained a structure-tree view; the Markdown and Mermaid editors gained fullscreen",
        "Improvements: XML / HTML Formatter now separates formatted output and the structure tree into tabs, opens local files and saves through the native dialog; Markdown-style tools open local files and reuse the file name when saving; masking characters are selectable or free-form; CSS Colors code labels follow the chosen colour type; the App Center dropped the previous version’s NEW badges",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-10-14 V2.23.0 Release", "2026-10-14 V2.23.0 Release", "2026-10-14 V2.23.0 Release"),
    items: trio(
      [
        "新增应用: 拼豆图纸、假装开会、Zip 压缩、Zip 解压、GIF 拆解、GIF 生成 (工具总数 145 → 151)",
        "新增功能: 应用中心新增 NEW 徽标 (应用在 define.tsx 里导出 IsNew = true 即展示, 用于标记本版本新增的应用); Shield Badge 生成的 SVG 源码支持格式化查看与单行切换",
        "体验改进: Zip 压缩 / 解压窗口宽度改为铺满内容区",
      ],
      [
        "新增應用: 拼豆圖紙、假裝開會、Zip 壓縮、Zip 解壓、GIF 拆解、GIF 產生 (工具總數 145 → 151)",
        "新增功能: 應用中心新增 NEW 徽標 (應用在 define.tsx 匯出 IsNew = true 即展示, 用來標記本版本新增的應用); Shield Badge 產生的 SVG 原始碼支援格式化檢視與單行切換",
        "體驗改進: Zip 壓縮 / 解壓視窗寬度改為鋪滿內容區",
      ],
      [
        "New apps: Bead Pattern, Fake Meeting, Zip Compress, Zip Extract, GIF Splitter and GIF Maker (tools 145 → 151)",
        "New features: the App Center shows a NEW badge for apps that export IsNew = true from their define.tsx, marking the apps added in this release; Shield Badge can now pretty-print its SVG source or show it as a single line",
        "Improvements: the Zip Compress / Extract windows now fill the content area",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-10-11 V2.22.2 Release", "2026-10-11 V2.22.2 Release", "2026-10-11 V2.22.2 Release"),
    items: trio(
      [
        "新增功能: 中文拼音新增拼音注音排版 (拼音以小字显示在汉字正上方, 可切换拼音文本, 整段转换保留多音字上下文); CSS 配色新增拼豆 / 绣线色卡 (MARD / COCO / Artkal / Perler / Hama / DMC) 并支持按系列分组展示",
        "体验改进: 色卡上的色号文字改为反色显示, 深色与中间色调也看得清; 节拍器倒计时改为 3~10 秒数字倒计时 (每秒一个预备拍); 经纬度格式转换的示例改为顶部彩色标签; 四个编解码工具按钮增加间距; Gzip 编解码输入输出铺满整宽; SM9 的「密钥生成」页更名「密钥管理」",
        "问题修复: 经纬度格式转换输入为空时结果区整块消失 (现在始终显示四种格式的结果区)",
      ],
      [
        "新增功能: 中文拼音新增拼音注音排版 (拼音以小字顯示在漢字正上方, 可切換拼音文字, 整段轉換保留多音字上下文); CSS 配色新增拼豆 / 繡線色卡 (MARD / COCO / Artkal / Perler / Hama / DMC) 並支援依系列分組展示",
        "體驗改進: 色卡上的色號文字改為反色顯示, 深色與中間色調也看得清; 節拍器倒數改為 3~10 秒數字倒數 (每秒一個預備拍); 經緯度格式轉換的範例改為頂部彩色標籤; 四個編解碼工具按鈕增加間距; Gzip 編解碼輸入輸出鋪滿整寬; SM9 的「金鑰產生」頁更名「金鑰管理」",
        "問題修正: 經緯度格式轉換輸入為空時結果區整塊消失 (現在始終顯示四種格式的結果區)",
      ],
      [
        "New features: Chinese Pinyin gained ruby annotation (pinyin in small type above each character, switchable to plain pinyin text, converted as a whole so heteronyms keep their context); CSS Colors gained bead and floss palettes (MARD / COCO / Artkal / Perler / Hama / DMC) grouped by series",
        "Improvements: colour-code labels are drawn in the inverse colour so dark and mid tones stay readable; the Metronome counts down 3–10 seconds with a preparatory beat each second; Latitude / Longitude shows its examples as coloured tags at the top; the four codec tools got proper button spacing; Gzip fields fill the width; SM9 renamed Key Generation to Key Management",
        "Fixes: Latitude / Longitude hid the whole result area when the input was empty — all four formats now always show",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-10-10 V2.22.1 Release", "2026-10-10 V2.22.1 Release", "2026-10-10 V2.22.1 Release"),
    items: trio(
      [
        "新增功能: 思维导图支持整页全屏, 参数改下拉选择, 三个导出按钮合并为「导出图片」(SVG / PNG / WebP); 即时渲染 Markdown 支持全屏; 六个换算页新增常用预设彩色标签; ASCII 文字字体选择改为弹窗 (可预览 289 款字体, 带搜索与首字母筛选); SM9 加解密合并为单页 (用户 ID 只读, 设置页可按 ID 生成密钥); IP 转换的结果区常驻",
        "体验改进: 七个换算工具改用 bignumber.js 精确计算, 消除浮点误差; Cisco Type 7 更名为 Cisco Type 7 加解密并统一为上下双框布局; 15 个加解密工具按钮增加间距",
        "问题修复: 换算页预设标签与单位挤在同一行、标签文案冗余; 官网下载卡片在手机端 4 列挤压",
      ],
      [
        "新增功能: 思維導圖支援整頁全螢幕, 參數改下拉選擇, 三個匯出按鈕合併為「匯出圖片」(SVG / PNG / WebP); 即時渲染 Markdown 支援全螢幕; 六個換算頁新增常用預設彩色標籤; ASCII 文字字型選擇改為彈窗 (可預覽 289 款字型, 帶搜尋與首字母篩選); SM9 加解密合併為單頁 (使用者 ID 唯讀, 設定頁可依 ID 產生金鑰); IP 轉換的結果區常駐",
        "體驗改進: 七個換算工具改用 bignumber.js 精確計算, 消除浮點誤差; Cisco Type 7 更名為 Cisco Type 7 加解密並統一為上下雙框版面; 15 個加解密工具按鈕增加間距",
        "問題修正: 換算頁預設標籤與單位擠在同一行、標籤文案冗餘; 官網下載卡片在手機端 4 欄擠壓",
      ],
      [
        "New features: Mind Map gained a full-page fullscreen mode, dropdown parameters and a single Export Image button offering SVG / PNG / WebP; Instant Markdown gained fullscreen; the six converters got one-click preset tags; ASCII Art picks fonts from a dialog previewing all 289 figlet fonts with search and first-letter filters; SM9 merged its encrypt / decrypt tabs into one page with a read-only user ID; IP Converter keeps its result area visible",
        "Improvements: the seven unit converters use bignumber.js for exact arithmetic, removing floating-point drift; Cisco Type 7 became Cisco Type 7 Cipher with the same two-box layout as the other ciphers; 15 cipher tools got button spacing",
        "Fixes: preset tags collided with units on the converter pages, tag labels were redundant, and the website download cards squeezed into four columns on phones",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-10-09 V2.22.0 Release", "2026-10-09 V2.22.0 Release", "2026-10-09 V2.22.0 Release"),
    items: trio(
      [
        "新增应用: 祖冲之序列密码 (国密 ZUC, Rust + WebAssembly, 纯本机计算)、聊天生成器 (9 种平台风格, 文字 / 图片 / 语音 / 时间四类消息可排序, 导出 PNG)",
        "新增功能: 聊天生成器支持微信专属红包 / 转账卡片 (切到其他平台自动退化为纯文字), 免打扰开关与按平台区分的标题栏",
        "问题修复: 聊天生成器预览外框黑边过大、iOS / 安卓风格切换看不出差异、深色模式下消息行底色刺眼、电量配色规则",
      ],
      [
        "新增應用: 祖沖之序列密碼 (國密 ZUC, Rust + WebAssembly, 純本機計算)、聊天產生器 (9 種平台風格, 文字 / 圖片 / 語音 / 時間四類訊息可排序, 匯出 PNG)",
        "新增功能: 聊天產生器支援微信專屬紅包 / 轉帳卡片 (切到其他平台自動退化為純文字), 勿擾開關與依平台區分的標題列",
        "問題修正: 聊天產生器預覽外框黑邊過大、iOS / 安卓風格切換看不出差異、深色模式下訊息列底色刺眼、電量配色規則",
      ],
      [
        "New apps: ZUC Cipher (the Chinese GB/T 33133 stream cipher, Rust + WebAssembly, computed locally) and Chat Generator (nine platform styles, four message kinds that can be reordered, PNG export)",
        "New features: Chat Generator supports WeChat-only red packet and transfer cards (they degrade to plain text on other platforms), a do-not-disturb switch and per-platform title bars",
        "Fixes: oversized black borders in the Chat Generator preview, indistinguishable iOS / Android styles, glaring message rows in dark mode and the battery colour rules",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-10-09 V2.21.1 Release", "2026-10-09 V2.21.1 Release", "2026-10-09 V2.21.1 Release"),
    items: trio(
      [
        "新增功能: 设置中心新增配置导入 / 导出 (导出全部本地设置与各应用的默认配置为 JSON, 导入时校验并合并写回, 完成后自动重载生效)",
        "体验改进: 我的收藏支持按类型分组展示 (分组视图下自动停用拖动排序); 「收藏按类型展示」的默认值可在设置中心配置, 改动实时同步到已打开的收藏页",
      ],
      [
        "新增功能: 設定中心新增設定匯入 / 匯出 (匯出全部本機設定與各應用的預設設定為 JSON, 匯入時驗證並合併寫回, 完成後自動重新載入生效)",
        "體驗改進: 我的收藏支援依類型分組展示 (分組檢視下自動停用拖曳排序); 「收藏依類型展示」的預設值可在設定中心設定, 變更即時同步到已開啟的收藏頁",
      ],
      [
        "New features: Settings gained config import / export (dumps every local setting plus each app’s default options to JSON, then validates and merges on import, reloading the page when done)",
        "Improvements: Favorites can be grouped by category (drag sorting is disabled in that view), with the default configurable in Settings and synced live to an open Favorites page",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-10-08 V2.21.0 Release", "2026-10-08 V2.21.0 Release", "2026-10-08 V2.21.0 Release"),
    items: trio(
      [
        "新增功能: 新增系统级页面「我的收藏」(收藏 / 取消收藏、按名称搜索、一键清空, 应用卡片右上角一键收藏, 状态全局实时同步), 支持拖动排序与可拖动悬浮入口 (位置持久化, 右键复位, 角标显示收藏数); 提词器新增阅读基准线 (颜色可自定义, 可拖动调整位置); 番茄时钟全屏支持空格 / 回车开始与暂停",
        "体验改进: 收藏卡片用光标区分「按住拖动排序」与「点击打开应用」; 应用中心「默认展示应用」下拉新增「我的收藏」选项",
        "问题修复: 桌面版收藏拖动排序失效 (改用 Pointer Events 实现); 番茄时钟「跳过当前阶段」按钮与阶段页签挤在同一行",
      ],
      [
        "新增功能: 新增系統級頁面「我的收藏」(收藏 / 取消收藏、依名稱搜尋、一鍵清空, 應用卡片右上角一鍵收藏, 狀態全域即時同步), 支援拖曳排序與可拖曳懸浮入口 (位置持久化, 右鍵復位, 角標顯示收藏數); 提詞器新增閱讀基準線 (顏色可自訂, 可拖曳調整位置); 番茄時鐘全螢幕支援空白鍵 / Enter 開始與暫停",
        "體驗改進: 收藏卡片用游標區分「按住拖曳排序」與「點擊開啟應用」; 應用中心「預設展示應用」下拉新增「我的收藏」選項",
        "問題修正: 桌面版收藏拖曳排序失效 (改用 Pointer Events 實作); 番茄時鐘「跳過目前階段」按鈕與階段頁籤擠在同一列",
      ],
      [
        "New features: a new system page Favorites (star / unstar, search by name, clear all, a star on every App Center card, synced globally in real time) with drag sorting and a draggable floating launcher (position persisted, right-click to reset, badge showing the count); the Teleprompter gained a reading baseline (custom colour, draggable position); fullscreen Pomodoro responds to Space / Enter",
        "Improvements: cursor shapes on Favorites cards distinguish “hold to reorder” from “click to open”; the App Center’s default-page dropdown gained a Favorites entry",
        "Fixes: drag sorting did not work in the desktop build (it now uses Pointer Events) and Pomodoro’s skip button collided with the stage tabs",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-10-01 V2.20.0 Release", "2026-10-01 V2.20.0 Release", "2026-10-01 V2.20.0 Release"),
    items: trio(
      [
        "新增应用: 番茄时钟 (专注 / 短休 / 长休自动轮换, 按截止时刻推算切后台不漂移, 桌面通知, 5 种合成音色或自定义音频, 纯色 / 图片背景与阶段配色, 全屏)、白板 (Excalidraw 驱动的无限画布, 自动保存到本机, 全屏, 不联网不上传)",
        "问题修复: 桌面版启动失败 (通知插件权限配置类型写错导致初始化 panic); 白板渲染不开 (容器高度塌陷与样式未加载)",
      ],
      [
        "新增應用: 番茄時鐘 (專注 / 短休 / 長休自動輪換, 依截止時刻推算切背景不漂移, 桌面通知, 5 種合成音色或自訂音訊, 純色 / 圖片背景與階段配色, 全螢幕)、白板 (Excalidraw 驅動的無限畫布, 自動儲存到本機, 全螢幕, 不連網不上傳)",
        "問題修正: 桌面版啟動失敗 (通知外掛權限設定型別寫錯導致初始化 panic); 白板無法渲染 (容器高度塌陷與樣式未載入)",
      ],
      [
        "New apps: Pomodoro (focus / short break / long break rotate automatically, deadline-based timing that survives backgrounding, desktop notifications, five synthesised tones or your own audio, solid or picture backgrounds with per-stage colours, fullscreen) and Whiteboard (an Excalidraw-powered infinite canvas that autosaves locally, works fullscreen and never goes online)",
        "Fixes: the desktop build failed to start (a notification plugin permission typed as an object instead of null panicked during Tauri setup) and the Whiteboard would not render (collapsed container height plus missing styles)",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-29 V2.19.0 Release", "2026-09-29 V2.19.0 Release", "2026-09-29 V2.19.0 Release"),
    items: trio(
      [
        "新增应用: 敏感词检测 (Aho–Corasick 扫描, 通用 / 小红书 / 微信公众号三套词库, 给出危险等级 / 命中位置 / 替换建议, 一键打码与 TXT / HTML 报告导出, 宽松匹配能揪出「微 信」这类绕过写法)",
        "新增功能: 提词器新增开始前倒计时 (关闭 / 3~30 秒, 舞台大数字覆盖层, 期间再点开始立即开滚); 节拍器新增预排拍 (关闭 / 1 / 2 / 4 / 8 拍, 660Hz + 琥珀色与正拍区分)",
        "其它: Windows 发布新增内置完整 WebView2 离线运行时的 NSIS 安装包, 没有装 WebView2 的机器也能直接用",
      ],
      [
        "新增應用: 敏感詞檢測 (Aho–Corasick 掃描, 通用 / 小紅書 / 微信公眾號三套詞庫, 給出危險等級 / 命中位置 / 替換建議, 一鍵打碼與 TXT / HTML 報告匯出, 寬鬆比對能揪出「微 信」這類繞過寫法)",
        "新增功能: 提詞器新增開始前倒數 (關閉 / 3~30 秒, 舞台大數字覆蓋層, 期間再按開始立即開滾); 節拍器新增預排拍 (關閉 / 1 / 2 / 4 / 8 拍, 660Hz + 琥珀色與正拍區分)",
        "其它: Windows 發佈新增內建完整 WebView2 離線執行階段的 NSIS 安裝檔, 沒裝 WebView2 的機器也能直接用",
      ],
      [
        "New apps: Sensitive Word Detection (Aho–Corasick scanning with three lexicons — general, Xiaohongshu and WeChat official accounts — reporting severity, positions and replacement hints, one-click masking and TXT / HTML reports, with a loose mode that catches obfuscations like “微 信”)",
        "New features: the Teleprompter counts down before scrolling (off or 3–30 seconds, a big overlay on stage, pressing start again skips it); the Metronome gained count-in bars (off or 1 / 2 / 4 / 8 beats at 660Hz in amber, distinct from the downbeat)",
        "Also: the Windows release added an NSIS installer bundling the full offline WebView2 runtime, so machines without WebView2 can install it directly",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-28 V2.18.0 Release", "2026-09-28 V2.18.0 Release", "2026-09-28 V2.18.0 Release"),
    items: trio(
      [
        "新增应用: BOM 检查、像素图、思维导图、节拍器、屏幕录制 (仅 Web 版)、二维码解析 (工具总数 134 → 140)",
        "新增功能: 应用中心为仅 Web 版可用的工具增加「仅 Web」徽标, 与「仅桌面版」同一套样式",
        "其它: 构建工具链升级到 Vite 8 (Rolldown) 与 TypeScript 5.9, 前端构建耗时从约 26 秒降到约 2 秒",
      ],
      [
        "新增應用: BOM 檢查、像素圖、思維導圖、節拍器、螢幕錄製 (僅 Web 版)、QR Code 解析 (工具總數 134 → 140)",
        "新增功能: 應用中心為僅 Web 版可用的工具增加「僅 Web」徽標, 與「僅桌面版」同一套樣式",
        "其它: 建置工具鏈升級到 Vite 8 (Rolldown) 與 TypeScript 5.9, 前端建置耗時從約 26 秒降到約 2 秒",
      ],
      [
        "New apps: BOM Check, Pixel Art, Mind Map, Metronome, Screen Recorder (Web only) and QR Code Reader (tools 134 → 140)",
        "New features: App Center cards mark Web-only tools with a “Web only” badge matching the existing “Desktop only” style",
        "Also: the toolchain moved to Vite 8 (Rolldown) and TypeScript 5.9, cutting the renderer build from about 26 seconds to about 2",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-26 V2.17.1 Release", "2026-09-26 V2.17.1 Release", "2026-09-26 V2.17.1 Release"),
    items: trio(
      [
        "体验改进: 侧边栏宽度可拖动调整 (180~420 px, 宽度自动记忆, 双击分隔条恢复默认, 聚焦后可用 ← / → 微调), 收起时自动隐藏; 设置中心新增「侧边栏宽度」滑杆, 调整立即生效",
      ],
      [
        "體驗改進: 側邊欄寬度可拖曳調整 (180~420 px, 寬度自動記憶, 雙擊分隔列恢復預設, 聚焦後可用 ← / → 微調), 收起時自動隱藏; 設定中心新增「側邊欄寬度」滑桿, 調整立即生效",
      ],
      [
        "Improvements: the sidebar width can be dragged (180–420 px, remembered across launches, double-click the splitter to reset, arrow keys to nudge) and hides itself when collapsed; Settings gained a matching Sidebar width slider that applies immediately",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-25 V2.17.0 Release", "2026-09-25 V2.17.0 Release", "2026-09-25 V2.17.0 Release"),
    items: trio(
      [
        "新增功能: 新增 SM9 加解密 (国密标识密码, GmSSL 编译为 WebAssembly, 本机生成主密钥对、按用户 ID 提取私钥并完成加密解密 / 签名验签); JWT 编解码器新增「生成」页签 (HS256 / HS384 / HS512 与 none, 可编辑 Header / Payload 并一键写入 iat / exp)",
        "体验改进: JWT 编解码器改为「解析 / 生成」双页签; 应用中心支持搜索 (按应用名 / 目录名 / 分类名, 多关键词为「与」关系, 无匹配时给出空状态)",
      ],
      [
        "新增功能: 新增 SM9 加解密 (國密標識密碼, GmSSL 編譯為 WebAssembly, 本機產生主金鑰對、依使用者 ID 擷取私鑰並完成加解密 / 簽章驗章); JWT 編解碼器新增「產生」頁籤 (HS256 / HS384 / HS512 與 none, 可編輯 Header / Payload 並一鍵寫入 iat / exp)",
        "體驗改進: JWT 編解碼器改為「解析 / 產生」雙頁籤; 應用中心支援搜尋 (依應用名 / 目錄名 / 分類名, 多關鍵字為「且」關係, 無符合時給出空狀態)",
      ],
      [
        "New features: SM9 Cipher (the Chinese identity-based scheme, GmSSL compiled to WebAssembly: generate master key pairs, extract a user key from an ID and encrypt / decrypt or sign / verify locally) and a Generate tab in JWT Codec (HS256 / HS384 / HS512 and none, editable header and payload, one-click iat / exp)",
        "Improvements: JWT Codec now splits into Decode and Generate tabs, and the App Center gained a search box (app name, folder name or category, space-separated terms are ANDed, with an empty state when nothing matches)",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-25 V2.16.1 Release", "2026-09-25 V2.16.1 Release", "2026-09-25 V2.16.1 Release"),
    items: trio(
      [
        "体验改进: 经纬度格式转换新增 6 个示例坐标一键载入 (均取自同一地点, 方便对照四种格式的写法差异)",
      ],
      [
        "體驗改進: 經緯度格式轉換新增 6 個範例座標一鍵載入 (均取自同一地點, 方便對照四種格式的寫法差異)",
      ],
      [
        "Improvements: Latitude / Longitude added six one-click sample coordinates — all from the same place, so the four formats can be compared directly",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-25 V2.16.0 Release", "2026-09-25 V2.16.0 Release", "2026-09-25 V2.16.0 Release"),
    items: trio(
      [
        "新增应用: 经纬度格式转换 (十进制 / 度分秒 / 度分 / 国家标准四种写法互转, 自动识别输入格式, 带 N/S/E/W 方向字母时自动判定经纬度顺序, 越界给出明确提示)",
      ],
      [
        "新增應用: 經緯度格式轉換 (十進位 / 度分秒 / 度分 / 國家標準四種寫法互轉, 自動辨識輸入格式, 帶 N/S/E/W 方向字母時自動判定經緯度順序, 超出範圍給出明確提示)",
      ],
      [
        "New apps: Latitude / Longitude Converter, converting one coordinate between decimal, degrees-minutes-seconds, degrees-minutes and the national DDMM.mm notation — with format autodetection, automatic order detection when N/S/E/W letters are present, and clear out-of-range warnings",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-23 V2.15.1 Release", "2026-09-23 V2.15.1 Release", "2026-09-23 V2.15.1 Release"),
    items: trio(
      [
        "问题修复: 图片转 SVG 在桌面端无法矢量化 (CSP 的 script-src 未放行 WebAssembly, 导致 VTracer 编译 wasm 被拦截), 现补充 'wasm-unsafe-eval' 与 'unsafe-eval'",
        "体验改进: 矢量化失败若源于 CSP 拦截 WebAssembly, 改为提示「当前环境禁止运行 WebAssembly」并保留原始报错",
      ],
      [
        "問題修正: 圖片轉 SVG 在桌面端無法向量化 (CSP 的 script-src 未放行 WebAssembly, 導致 VTracer 編譯 wasm 被攔截), 現補上 'wasm-unsafe-eval' 與 'unsafe-eval'",
        "體驗改進: 向量化失敗若源於 CSP 攔截 WebAssembly, 改為提示「目前環境禁止執行 WebAssembly」並保留原始錯誤",
      ],
      [
        "Fixes: Image to SVG could not vectorise in the desktop build — the CSP script-src blocked WebAssembly, so VTracer failed to compile its wasm; the policy now allows 'wasm-unsafe-eval' and 'unsafe-eval'",
        "Improvements: when vectorising fails because the CSP blocks WebAssembly, the error now says so instead of implying the image is too large",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-23 V2.15.0 Release", "2026-09-23 V2.15.0 Release", "2026-09-23 V2.15.0 Release"),
    items: trio(
      [
        "新增应用: 图片转 SVG (基于 VTracer 将位图描线成矢量 SVG, 彩色分层 / 黑白二值两种颜色模式, 13 项参数 + 7 组预设, 参数变化自动重算, 可查看源码并保存为 SVG, 引擎按需加载)",
      ],
      [
        "新增應用: 圖片轉 SVG (基於 VTracer 將點陣圖描線成向量 SVG, 彩色分層 / 黑白二值兩種顏色模式, 13 項參數 + 7 組預設, 參數變更自動重算, 可檢視原始碼並存成 SVG, 引擎按需載入)",
      ],
      [
        "New apps: Image to SVG, tracing bitmaps into vector SVG with VTracer — colour-layered and black-and-white modes, 13 parameters plus seven presets, automatic re-tracing on change, source view and SVG download, with the engine loaded on demand",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-21 V2.14.0 Release", "2026-09-21 V2.14.0 Release", "2026-09-21 V2.14.0 Release"),
    items: trio(
      [
        "新增应用: .gitignore 生成 (64 个现成模板 + 11 个常用技术栈组合 + 自定义追加与跨模板去重, 可直接保存为 .gitignore)、即时渲染 Markdown (基于 Vditor 的所见即所得编辑器, 三种模式, 支持 KaTeX 公式与代码高亮, 可导出 .md / .html)",
        "体验改进: .gitignore 生成的模板库改为下拉多选、常用组合改为下拉套用并去掉页面级搜索框; 帮助页「使用组件」补充 Vditor / Mermaid / Shiki / SVGO / JsBarcode 等 11 个第三方组件",
      ],
      [
        "新增應用: .gitignore 產生 (64 個現成範本 + 11 個常用技術堆疊組合 + 自訂追加與跨範本去重, 可直接存成 .gitignore)、即時渲染 Markdown (基於 Vditor 的所見即所得編輯器, 三種模式, 支援 KaTeX 公式與程式碼高亮, 可匯出 .md / .html)",
        "體驗改進: .gitignore 產生的範本庫改為下拉多選、常用組合改為下拉套用並移除頁面層級搜尋框; 說明頁「使用元件」補充 Vditor / Mermaid / Shiki / SVGO / JsBarcode 等 11 個第三方元件",
      ],
      [
        "New apps: .gitignore Generator (64 ready-made templates, 11 tech-stack bundles, custom additions with cross-template de-duplication, saved straight as .gitignore) and Instant Markdown (a Vditor WYSIWYG editor with three modes, KaTeX maths, code highlighting and .md / .html export)",
        "Improvements: the .gitignore template library switched to multi-select dropdowns and a bundle picker with no page-level search; the Help components list gained Vditor, Mermaid, Shiki, SVGO, JsBarcode and seven more",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-17 V2.13.0 Release", "2026-09-17 V2.13.0 Release", "2026-09-17 V2.13.0 Release"),
    items: trio(
      [
        "新增应用: JavaScript 格式化 (美化 / 压缩 / 混淆打包 / 解密还原四合一, 美化与压缩后用 token 指纹提示「语义未变」)、iptables 规则、tc 规则、nginx 配置 (三个站长工具, 既解析已有规则也能按表单生成命令 / 配置)",
        "体验改进: nginx 配置的开关键改为复选框让面板更紧凑; 桌面端默认窗口尺寸调整为 1200×728; 去掉三个站长工具顶部的说明区",
      ],
      [
        "新增應用: JavaScript 格式化 (美化 / 壓縮 / 混淆打包 / 解密還原四合一, 美化與壓縮後用 token 指紋提示「語意未變」)、iptables 規則、tc 規則、nginx 設定 (三個站長工具, 既能解析既有規則也能依表單產生指令 / 設定)",
        "體驗改進: nginx 設定的開關鍵改為核取方塊讓面板更緊湊; 桌面端預設視窗尺寸調整為 1200×728; 移除三個站長工具頂部的說明區",
      ],
      [
        "New apps: JavaScript Formatter (beautify / minify / obfuscate / unpack in one box, with a token fingerprint confirming the semantics survived) plus three ops tools — iptables Rules, tc Rules and nginx Config — that both parse existing rules and generate commands or configs from a form",
        "Improvements: nginx options became checkboxes for a denser panel, the desktop window defaults to 1200×728, and the three ops tools lost their top intro blocks",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-17 V2.12.0 Release", "2026-09-17 V2.12.0 Release", "2026-09-17 V2.12.0 Release"),
    items: trio(
      [
        "新增应用: 提词器、Mermaid 编辑器 (实时预览, 内置 32 个示例)、CSR 申请文件、图片水印、图片负片 / 黑白化 / 锐化 / 取色、DNS / Whois / MTR 查询 (仅桌面版), 并新增「生成器」分类",
        "新增功能: 正则表达式新增「代码生成」页签 (21 种语言, 带语法高亮与一键复制); 提词器新增逐行焦点高亮与按阅读进度逐字点亮; IP 转换新增 IPv6 写法换算",
        "问题修复: 时间戳转换上月末 / 下月末取成 00:00:00 与跨月日期年份算错; Mermaid 编辑器的缩放 / 背景 / 面板开关异常; 正则输入框占位符里的 \d 未转义",
        "体验改进: 网页 TDK 信息检测改为仅桌面版; JSONL 转换的工具条上移; 时间戳转换的 GPS / 北斗 / 伽利略改为分组框展示; 去掉 7 个工具顶部的说明区",
      ],
      [
        "新增應用: 提詞器、Mermaid 編輯器 (即時預覽, 內建 32 個範例)、CSR 申請檔、圖片浮水印、圖片負片 / 黑白化 / 銳化 / 取色、DNS / Whois / MTR 查詢 (僅桌面版), 並新增「產生器」分類",
        "新增功能: 正規表示式新增「程式碼產生」頁籤 (21 種語言, 帶語法高亮與一鍵複製); 提詞器新增逐行焦點高亮與依閱讀進度逐字點亮; IP 轉換新增 IPv6 寫法換算",
        "問題修正: 時間戳轉換上月末 / 下月末取成 00:00:00 與跨月日期年份算錯; Mermaid 編輯器的縮放 / 背景 / 面板開關異常; 正規表示式輸入框佔位符裡的 \d 未轉義",
        "體驗改進: 網頁 TDK 資訊檢測改為僅桌面版; JSONL 轉換的工具列上移; 時間戳轉換的 GPS / 北斗 / 伽利略改為分組框展示; 移除 7 個工具頂部的說明區",
      ],
      [
        "New apps: Teleprompter, Mermaid Editor (live preview with 32 built-in samples), CSR Request, Image Watermark, Image Negative / Grayscale / Sharpen / Colour Picker, and DNS / Whois / MTR Lookup (desktop only) — plus a new Generators category",
        "New features: Regex gained a Code Generation tab (21 languages with syntax highlighting and one-click copy), the Teleprompter got line focus and progress-based character lighting, and IP Converter gained IPv6 notations",
        "Fixes: Timestamp Converter used 00:00:00 for end-of-month dates and mis-computed years when the target month was shorter; Mermaid Editor had broken zoom, background and panel toggles; the regex placeholder showed d instead of \d",
        "Improvements: Web TDK Check is desktop-only now, the JSONL toolbar moved to the top, Timestamp Converter groups GPS / BeiDou / Galileo blocks, and seven tools lost their top intro blocks",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-16 V2.11.0 Release", "2026-09-16 V2.11.0 Release", "2026-09-16 V2.11.0 Release"),
    items: trio(
      [
        "新增应用: JSONL 转换 (JSON 数组 ↔ JSONL 双框互转, 支持缩进 / 忽略空行 / 拖拽载入), 「数据生成」新增 .jsonl 输出, 「图片尺寸调整」更名「图片调整」并新增 90° / 180° / 270° 旋转与 WebP 输出",
        "问题修复: 桌面版所有「保存 / 导出文本」类工具选好路径后却没有生成文件 (capabilities 缺少写文件权限, 现补齐并增加兜底与明确报错); Markdown 编辑器深色模式下标题几乎看不清",
        "体验改进: JSONL 转换点错按钮时会自动按正确方向转换并提示, 下载改为系统保存对话框",
      ],
      [
        "新增應用: JSONL 轉換 (JSON 陣列 ↔ JSONL 雙框互轉, 支援縮排 / 忽略空行 / 拖曳載入), 「資料產生」新增 .jsonl 輸出, 「圖片尺寸調整」更名「圖片調整」並新增 90° / 180° / 270° 旋轉與 WebP 輸出",
        "問題修正: 桌面版所有「儲存 / 匯出文字」類工具選好路徑後卻沒有產生檔案 (capabilities 缺少寫檔權限, 現補齊並增加備援與明確錯誤); Markdown 編輯器深色模式下標題幾乎看不清",
        "體驗改進: JSONL 轉換按錯按鈕時會自動依正確方向轉換並提示, 下載改為系統儲存對話框",
      ],
      [
        "New apps: JSONL Converter (JSON array ↔ JSONL in two boxes, with indent, blank-line skipping and drag-to-load), a .jsonl output format in Data Generator, and Image Resize renamed Image Adjust with 90° / 180° / 270° rotation and WebP output",
        "Fixes: every “save / export text” tool in the desktop build picked a path but wrote no file (capabilities lacked the write permission — now granted, with a fallback and a real error); Markdown Editor headings were nearly invisible in dark mode",
        "Improvements: JSONL Converter detects a wrong-button click and converts in the right direction with a hint, and downloads go through the native save dialog",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-15 V2.10.1 Release", "2026-09-15 V2.10.1 Release", "2026-09-15 V2.10.1 Release"),
    items: trio(
      [
        "体验改进: 字帖生成器新增「按行填充」开关与淡绿格线, 设置中心新增默认格间距 / 循环填充 / 按行填充三项",
        "问题修复: 字帖生成器的字在格子里偏右偏下 (改为逐字实测墨迹包围盒反向微调, 偏差降到亚毫米); 上传的自定义字体不生效 (样式里引号未转义); 侧边栏折叠时二级菜单浮层超出窗口底部被裁掉",
      ],
      [
        "體驗改進: 字帖產生器新增「依列填充」開關與淡綠格線, 設定中心新增預設格間距 / 循環填充 / 依列填充三項",
        "問題修正: 字帖產生器的字在格子裡偏右偏下 (改為逐字實測墨跡包圍盒反向微調, 偏差降到亞毫米); 上傳的自訂字型不生效 (樣式裡引號未轉義); 側邊欄收合時次級選單浮層超出視窗底部被裁掉",
      ],
      [
        "Improvements: the Calligraphy Sheet gained a fill-by-row switch and a light-green grid line, and Settings gained default grid spacing / looping / fill-by-row options",
        "Fixes: characters sat off-centre in their boxes (each glyph is now rasterised and nudged by its measured ink bounds, cutting the offset to sub-millimetre); uploaded custom fonts were ignored (an unescaped quote broke the style attribute); a collapsed sidebar’s submenu was clipped at the bottom of the window",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-15 V2.10.0 Release", "2026-09-15 V2.10.0 Release", "2026-09-15 V2.10.0 Release"),
    items: trio(
      [
        "新增应用: 数独生成器 (保证唯一解, 4×4 / 6×6 / 9×9 三种宫格与三档难度, 按 A4 排版并一键打印 / 另存 PDF)、字帖生成器 (米字格 / 田字格 / 回宫格 / 作文格四种格型, 七种字体且可上传本地字体, 打印 A4 字帖)",
        "体验改进: 数独出题走「随机回溯生成 → 中心对称挖空 → 校验唯一解」并区分提示数与答案颜色; 字帖格子按 A4 可用区自动均分、相邻格子共用线条; 设置中心新增两个工具的默认参数面板",
        "其它: 打印走离屏 iframe 承载 A4 版式, 与深色主题样式隔离, 打印结果恒为白底",
      ],
      [
        "新增應用: 數獨產生器 (保證唯一解, 4×4 / 6×6 / 9×9 三種宮格與三檔難度, 依 A4 排版並一鍵列印 / 另存 PDF)、字帖產生器 (米字格 / 田字格 / 回宮格 / 作文格四種格型, 七種字型且可上傳本機字型, 列印 A4 字帖)",
        "體驗改進: 數獨出題走「隨機回溯產生 → 中心對稱挖空 → 驗證唯一解」並區分提示數與答案顏色; 字帖格子依 A4 可用區自動均分、相鄰格子共用線條; 設定中心新增兩個工具的預設參數面板",
        "其它: 列印走離屏 iframe 承載 A4 版面, 與深色主題樣式隔離, 列印結果恆為白底",
      ],
      [
        "New apps: Sudoku Generator (guaranteed unique solutions, 4×4 / 6×6 / 9×9 grids and three difficulties, laid out on A4 with print / save-as-PDF) and Calligraphy Sheet (Mi, Tian, Hui and essay grids, seven fonts plus your own uploads, printable on A4)",
        "Improvements: puzzles are generated by random backtracking, hollowed out symmetrically and verified unique, with clue digits and answers in different colours; calligraphy cells divide the A4 area evenly and share grid lines; Settings gained default panels for both tools",
        "Also: printing renders A4 into an offscreen iframe isolated from the dark theme, so output is always white",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-15 V2.9.0 Release", "2026-09-15 V2.9.0 Release", "2026-09-15 V2.9.0 Release"),
    items: trio(
      [
        "新增应用: 图片分割 (按 2 / 3 / 4 / 6 / 9 份切图, 8 种分割方向, 编号方式与文件名前缀可设, 一键保存全部到文件夹)、图片尺寸调整 (按比例或像素缩放, 可锁定宽高比与不放大, PNG / JPEG 输出与质量调节)",
        "体验改进: 图片分割的预览紧密拼合、叠加半透明序号并新增可调图块间隔, 移除单张保存只保留「保存全部」; 图片尺寸调整新增设置中心默认项面板",
        "问题修复: 补齐遗漏的多语言词条并修复未走翻译的硬编码文案",
      ],
      [
        "新增應用: 圖片分割 (依 2 / 3 / 4 / 6 / 9 份切圖, 8 種分割方向, 編號方式與檔名前綴可設, 一鍵儲存全部到資料夾)、圖片尺寸調整 (依比例或像素縮放, 可鎖定長寬比與不放大, PNG / JPEG 輸出與品質調節)",
        "體驗改進: 圖片分割的預覽緊密拼合、疊上半透明序號並新增可調圖塊間隔, 移除單張儲存只保留「儲存全部」; 圖片尺寸調整新增設定中心預設項面板",
        "問題修正: 補齊遺漏的多語詞條並修正未走翻譯的硬編碼文案",
      ],
      [
        "New apps: Image Splitter (cuts one image into 2 / 3 / 4 / 6 / 9 pieces across eight directions, with numbering, filename prefixes and save-all-to-folder) and Image Resize (scale by ratio or pixels, lock the aspect ratio, never enlarge, export PNG / JPEG with quality control)",
        "Improvements: the splitter preview tiles images seamlessly with translucent numbering and an adjustable gap, and the single-image save button gave way to save-all; Image Resize gained default options in Settings",
        "Fixes: missing translations and hard-coded strings were filled in",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-14 V2.8.0 Release", "2026-09-14 V2.8.0 Release", "2026-09-14 V2.8.0 Release"),
    items: trio(
      [
        "新增应用: 数据生成 (按 Mock.js 语法生成 JSON / CSV / SQL 测试数据)、WebSocket 调试 (ws / wss 连接、心跳保活、JSON 美化、日志复制与下载), 「图片主题色」新增 8 种颜色格式展示与导出并移入「图片」分类",
        "体验改进: 图片主题色重构为「统计像素 → 合并相近色 → 按占比排序」并给出色块 / 占比条与 CSV / 色卡 PNG 导出; ICO 生成新增 128×128; 代码截图新增默认填充与最小宽度设置; 二维码 / 条形码 / ASCII 文字等多个工具新增设置中心默认项; 内置页面不再显示面包屑",
      ],
      [
        "新增應用: 資料產生 (依 Mock.js 語法產生 JSON / CSV / SQL 測試資料)、WebSocket 除錯 (ws / wss 連線、心跳保活、JSON 美化、日誌複製與下載), 「圖片主題色」新增 8 種顏色格式展示與匯出並移入「圖片」分類",
        "體驗改進: 圖片主題色重構為「統計像素 → 合併相近色 → 依佔比排序」並給出色塊 / 佔比條與 CSV / 色卡 PNG 匯出; ICO 產生新增 128×128; 程式碼截圖新增預設填充與最小寬度設定; QR Code / 條碼 / ASCII 文字等多個工具新增設定中心預設項; 內建頁面不再顯示麵包屑",
      ],
      [
        "New apps: Data Generator (Mock.js-style JSON / CSV / SQL test data) and WebSocket Debugger (ws / wss connections, keep-alive, JSON pretty-printing, copyable and downloadable logs); Image Theme Colour gained eight colour formats and moved into the Images category",
        "Improvements: theme-colour extraction now counts pixels, merges similar colours and sorts by share, with swatches, share bars and CSV / palette-PNG export; ICO Maker gained 128×128; Code Screenshot gained default padding and minimum width; several tools gained default options in Settings; built-in pages dropped their breadcrumbs",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-10 V2.7.3 Release", "2026-09-10 V2.7.3 Release", "2026-09-10 V2.7.3 Release"),
    items: trio(
      [
        "新增功能: 颜色格式转换新增「自动识别」输入格式 (按前缀或元组自动判定 HEX / RGB / HSL / HSV / CMYK / LAB / LCH / XYZ), 设置中心可配置进入页面时默认选中的类型; 新增 just dev-init 一键检查并安装开发环境",
        "体验改进: 「自动识别」置于类型选项首位并设为默认, 输入框下方实时显示识别到的格式; 三个 README 补齐开发流程说明与工具分类清单",
      ],
      [
        "新增功能: 顏色格式轉換新增「自動辨識」輸入格式 (依前綴或元組自動判定 HEX / RGB / HSL / HSV / CMYK / LAB / LCH / XYZ), 設定中心可設定進入頁面時預設選取的類型; 新增 just dev-init 一鍵檢查並安裝開發環境",
        "體驗改進: 「自動辨識」置於類型選項首位並設為預設, 輸入框下方即時顯示辨識到的格式; 三個 README 補齊開發流程說明與工具分類清單",
      ],
      [
        "New features: Colour Format Converter gained an Auto-detect input format (recognising HEX / RGB / HSL / HSV / CMYK / LAB / LCH / XYZ from prefixes or tuples) with a configurable default type in Settings; a just dev-init task now checks and installs the whole dev environment",
        "Improvements: Auto-detect leads the type list and is the default, showing the detected format under the input; all three READMEs document the workflow and the tool list",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-10 V2.7.2 Release", "2026-09-10 V2.7.2 Release", "2026-09-10 V2.7.2 Release"),
    items: trio(
      [
        "新增功能: Web 版支持用 URL 的 ?lang= 参数指定界面语言 (优先级高于本地记忆), 官网的 Web 版入口按页面语言自动携带该参数",
        "问题修复: 颜色格式转换的取色器选色后填充值不是 #rrggbb 且不生成配色方案; 含负值通道的 LAB / LCH / XYZ 解析失败; HSV 误用 HSL 换算",
        "体验改进: 颜色格式转换的「格式 / 配色方案」页签移到输入框下方, 切换页签不再影响输入; 公共语言词条拆回各工具的 lang.ts 便于独立维护",
      ],
      [
        "新增功能: Web 版支援用 URL 的 ?lang= 參數指定介面語言 (優先權高於本機記憶), 官網的 Web 版入口依頁面語言自動帶上該參數",
        "問題修正: 顏色格式轉換的取色器選色後填入值不是 #rrggbb 且不產生配色方案; 含負值通道的 LAB / LCH / XYZ 解析失敗; HSV 誤用 HSL 換算",
        "體驗改進: 顏色格式轉換的「格式 / 配色方案」頁籤移到輸入框下方, 切換頁籤不再影響輸入; 共用語言詞條拆回各工具的 lang.ts 便於獨立維護",
      ],
      [
        "New features: the Web build honours a ?lang= URL parameter to pick the interface language (overriding the remembered setting), and the website’s Web demo button carries the page’s language automatically",
        "Fixes: the colour picker filled in something other than #rrggbb and produced no palette; LAB / LCH / XYZ values with negative channels failed to parse; HSV was converted through HSL by mistake",
        "Improvements: the Format / Palette tabs moved below the input so switching them no longer moves the input, and shared language tables were split back into each tool’s lang.ts",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-09 V2.7.1 Release", "2026-09-09 V2.7.1 Release", "2026-09-09 V2.7.1 Release"),
    items: trio(
      [
        "新增功能: 界面全面三语化 (简体中文 / 繁体中文 / English) —— 全部工具页面、设置中心的工具面板与下拉选项、原生托盘菜单、各工具 About / 说明区、Cron 解析输出、帮助页开发时间线全部接入语言切换",
        "体验改进: 侧边栏展开宽度 200 → 230px, 折叠时语言 / 设置按钮靠左下角, 语言菜单改用旗标图片; 侧边菜单英文分组名精简",
        "问题修复: 多处残留硬编码中文; RC2 / RC6 / Blowfish 与 Markdown 编辑器未显示在侧边菜单; 字幕格式转换桌面版下载逐个弹保存框; 深色模式下固定灰字提示不可见; 左下角版本号多余悬停提示",
      ],
      [
        "新增功能: 介面全面三語化 (簡體中文 / 繁體中文 / English) —— 全部工具頁面、設定中心的工具面板與下拉選項、原生系統匣選單、各工具 About / 說明區、Cron 解析輸出、說明頁開發時間軸全部接入語言切換",
        "體驗改進: 側邊欄展開寬度 200 → 230px, 收合時語言 / 設定按鈕靠左下角, 語言選單改用旗標圖片; 側邊選單英文分組名精簡",
        "問題修正: 多處殘留硬編碼中文; RC2 / RC6 / Blowfish 與 Markdown 編輯器未顯示在側邊選單; 字幕格式轉換桌面版下載逐個彈出儲存框; 深色模式下固定灰字提示不可見; 左下角版本號多餘懸停提示",
      ],
      [
        "New features: the whole interface is now trilingual (Simplified Chinese / Traditional Chinese / English) — every tool page, all Settings panels and dropdown options, the native tray menu, each tool’s About section, Cron parsing output and the Help timeline",
        "Improvements: the sidebar opens at 230px instead of 200px, the language and settings buttons sit at the bottom-left when collapsed, the language menu uses flag icons and the English group names were shortened",
        "Fixes: leftover hard-coded Chinese, RC2 / RC6 / Blowfish and the Markdown Editor missing from the sidebar, Subtitle Converter popping one save dialog per file, invisible grey hints in dark mode, and a stray tooltip on the sidebar version label",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-08 V2.7.0 Release", "2026-09-08 V2.7.0 Release", "2026-09-08 V2.7.0 Release"),
    items: trio(
      [
        "新增应用: Markdown 编辑器 (自研渲染、零新增依赖, 支持常用语法与 LaTeX 子集, 可导出 .md 与独立 .html)、密码生成 (安全随机 + 强度检测与破解时间估算)、Sitemap 检测、关键词密度、路径转树",
        "新增功能: 二维码 / 条形码生成新增「批量」页签 (一次生成并导出全部 PNG); Shield Badge 新增尺寸倍率与放大 PNG 导出; 占位图片 / Shield Badge / App Icon / ICO 生成迁入「图片」分类, CIDR 计算器迁入「其它」",
        "问题修复: RC2 / RC6 / Blowfish 与 Markdown 编辑器未出现在侧边菜单; 字幕格式转换桌面版下载不弹保存框; 深色模式下固定灰字提示不可见; 左下角版本号的多余悬停提示",
      ],
      [
        "新增應用: Markdown 編輯器 (自研渲染、零新增相依, 支援常用語法與 LaTeX 子集, 可匯出 .md 與獨立 .html)、密碼產生 (安全隨機 + 強度偵測與破解時間估算)、Sitemap 檢測、關鍵詞密度、路徑轉樹",
        "新增功能: QR Code / 條碼產生新增「批次」頁籤 (一次產生並匯出全部 PNG); Shield Badge 新增尺寸倍率與放大 PNG 匯出; 佔位圖片 / Shield Badge / App Icon / ICO 產生遷入「圖片」分類, CIDR 計算器遷入「其它」",
        "問題修正: RC2 / RC6 / Blowfish 與 Markdown 編輯器未出現在側邊選單; 字幕格式轉換桌面版下載不彈儲存框; 深色模式下固定灰字提示不可見; 左下角版本號的多餘懸停提示",
      ],
      [
        "New apps: Markdown Editor (hand-written renderer with no new dependency, common syntax plus a LaTeX subset, exports .md and a standalone .html), Password Generator (secure randomness with strength checks and crack-time estimates), Sitemap Check, Keyword Density and Path to Tree",
        "New features: QR / Barcode generation gained a Batch tab that renders many codes at once and exports all PNGs; Shield Badge gained a size multiplier and enlarged PNG export; Placeholder Image, Shield Badge, App Icon and ICO Maker moved into Images while the CIDR calculator moved into Others",
        "Fixes: RC2 / RC6 / Blowfish and the Markdown Editor were missing from the sidebar, Subtitle Converter skipped the save dialog on desktop, fixed grey hints were invisible in dark mode, and the version label had a stray tooltip",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-08 V2.6.0 Release", "2026-09-08 V2.6.0 Release", "2026-09-08 V2.6.0 Release"),
    items: trio(
      [
        "新增应用: 字幕格式转换 (SRT / VTT / SBV / SUB / SSA / ASS / SMI / LRC / JSON 九种格式互转, 纯本地解析并自动剥离样式指令), IP 转换、OTP 密码生成器、键盘按键信息、点阵字生成器、文件比较、HTTP Basic Auth 编解码、Chmod 权限",
        "新增功能: 新增「格式化」分类 (JSON / JSON5 / SQL 格式化迁入); 加解密新增 ChaCha20 与 RC5 / RC2 / Blowfish / RC6; 值计算新增 CMAC / HKDF / KMAC 与原码反码补码; 颜色格式转换新增 7 组配色方案; 配置转换支持 XML 互转; 时间工具新增 GPS / 北斗 / 伽利略等; 启动后自动检查新版本",
        "问题修复: 应用中心分类内卡片改为一行展示多个、分割线独占整行; tsc 全量门禁误扫构建产物",
      ],
      [
        "新增應用: 字幕格式轉換 (SRT / VTT / SBV / SUB / SSA / ASS / SMI / LRC / JSON 九種格式互轉, 純本機解析並自動剝除樣式指令), IP 轉換、OTP 密碼產生器、鍵盤按鍵資訊、點陣字產生器、檔案比較、HTTP Basic Auth 編解碼、Chmod 權限",
        "新增功能: 新增「格式化」分類 (JSON / JSON5 / SQL 格式化遷入); 加解密新增 ChaCha20 與 RC5 / RC2 / Blowfish / RC6; 值計算新增 CMAC / HKDF / KMAC 與原碼反碼補碼; 顏色格式轉換新增 7 組配色方案; 設定轉換支援 XML 互轉; 時間工具新增 GPS / 北斗 / 伽利略等; 啟動後自動檢查新版本",
        "問題修正: 應用中心分類內卡片改為一列展示多個、分隔線獨佔整列; tsc 全量檢查誤掃建置產物",
      ],
      [
        "New apps: Subtitle Converter (nine formats — SRT / VTT / SBV / SUB / SSA / ASS / SMI / LRC / JSON — parsed locally with styling stripped) plus IP Converter, OTP Generator, Key Code Info, Dot-Matrix Font, File Diff, HTTP Basic Auth and Chmod Permissions",
        "New features: a Formatters category (JSON / JSON5 / SQL moved in); ChaCha20 and RC5 / RC2 / Blowfish / RC6 ciphers; CMAC / HKDF / KMAC and sign-magnitude / ones’ / two’s complement in Value Calc; seven colour-scheme groups; XML support in Config Converter; GPS / BeiDou / Galileo timestamps; and a startup check for new releases",
        "Fixes: App Center cards now pack several per row with full-width dividers, and the tsc gate no longer scans build output",
      ],
    ),
  },
  {
    color: "green",
    title: tri("2026-09-07 V2.5.0 Release", "2026-09-07 V2.5.0 Release", "2026-09-07 V2.5.0 Release"),
    items: trio(
      [
        "新增应用: BCrypt 口令生成与校验、Scrypt、PPI 计算 (含 13 种常见屏幕预设)、Cisco Type 7 口令加解密、Gzip 编解码、占位图片生成、Shield Badge 生成、ASCII 图片生成、ASCII 文字",
        "新增功能: 侧边菜单展开时分类标题显示应用数量徽标; Hash 值计算页的 bcrypt 区迁移为独立的 BCrypt 工具",
        "体验改进: BaseX 码型切换时下方说明联动显示对应编码详解; 设置按钮移到侧栏底部靠左",
        "问题修复: App Icon 生成选中卡片在深色模式下文字不可见、面包屑分类名误带数量徽标、just release 的路径层级与残留安装包复制",
      ],
      [
        "新增應用: BCrypt 口令產生與驗證、Scrypt、PPI 計算 (含 13 種常見螢幕預設)、Cisco Type 7 口令加解密、Gzip 編解碼、佔位圖片產生、Shield Badge 產生、ASCII 圖片產生、ASCII 文字",
        "新增功能: 側邊選單展開時分類標題顯示應用數量徽標; Hash 值計算頁的 bcrypt 區遷移為獨立的 BCrypt 工具",
        "體驗改進: BaseX 碼型切換時下方說明聯動顯示對應編碼詳解; 設定按鈕移到側欄底部靠左",
        "問題修正: App Icon 產生選取卡片在深色模式下文字不可見、麵包屑分類名誤帶數量徽標、just release 的路徑層級與殘留安裝檔複製",
      ],
      [
        "New apps: BCrypt hash / verify, Scrypt, PPI Calculator (with 13 common screen presets), Cisco Type 7 Cipher, Gzip Codec, Placeholder Image, Shield Badge, ASCII Image and ASCII Art",
        "New features: expanded sidebar group headings show how many apps they hold, and the bcrypt block moved out of Hash into its own BCrypt tool",
        "Improvements: switching BaseX alphabets now shows that alphabet’s documentation, and the settings button moved to the bottom-left of the sidebar",
        "Fixes: invisible text on selected App Icon cards in dark mode, breadcrumbs showing the app-count badge, and wrong path depth plus leftover installers in just release",
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
        "新增应用: 网页 TDK 信息检测、robots.txt 生成 (新增「站长工具」分类)、摩斯码编解码、UUencode / XXencode、JWT 解码器、RSA / SM2 / SM4 加解密、AES GCM、Caesar / Rail Fence / Vigenere / Hill 古典密码、SHA3 / Keccak Hash、htpasswd 生成、正则表达式工具、Cron 规则生成",
        "问题修复: 修复 v2.4.0 安装包启动黑屏 (残留 CommonJS require 未转换 + Tauri CSP 拦截 antd 运行时样式, 本版为修复后的重新发布版); App 列表加载竞态导致个别应用打不开; 网页 TDK 结果区在深色模式下不可见",
        "体验改进: 设置页改为 VSCode 式布局并记住上次浏览的分类; 正则预设增至 17 条且支持一键复制; Cron 规则生成新增「解析」页签 (逐字段解读 + 未来 10 次触发时间)",
        "其它: 渲染进程构建由 webpack 迁移到 Vite",
      ],
      [
        "新增應用: 網頁 TDK 資訊偵測、robots.txt 產生 (新增「站長工具」分類)、摩斯電碼編解碼、UUencode / XXencode、JWT 解碼器、RSA / SM2 / SM4 加解密、AES GCM、Caesar / Rail Fence / Vigenere / Hill 古典密碼、SHA3 / Keccak Hash、htpasswd 產生、正則表達式工具、Cron 規則產生",
        "問題修正: 修復 v2.4.0 安裝檔啟動黑畫面 (殘留 CommonJS require 未轉換 + Tauri CSP 攔截 antd 執行期樣式, 本版為修復後重新發布版); App 清單載入競態導致個別應用打不開; 網頁 TDK 結果區在深色模式下不可見",
        "體驗改進: 設定頁改為 VSCode 式版面並記住上次瀏覽的分類; 正則預設增至 17 條且支援一鍵複製; Cron 規則產生新增「解析」頁籤 (逐欄位解讀 + 未來 10 次觸發時間)",
        "其它: 渲染程序建置由 webpack 遷移至 Vite",
      ],
      [
        "New apps: Web TDK Check and robots.txt Generator (a new Webmaster Tools category), Morse Code, UUencode / XXencode, a JWT decoder, RSA / SM2 / SM4 ciphers, AES-GCM, the Caesar / Rail Fence / Vigenère / Hill classical ciphers, SHA3 and Keccak hashes, htpasswd generation, a regex tool and a Cron rule generator",
        "Fixes: the v2.4.0 installer no longer shows a black screen (leftover CommonJS requires plus the Tauri CSP blocking antd runtime styles — this release re-ships the fix); an app-list loading race that left some apps unopenable; the Web TDK result area being invisible in dark mode",
        "Improvements: Settings switched to a VSCode-style layout remembering the last category; regex presets grew to 17 with one-click copying; Cron gained a Parse tab with field-by-field breakdowns and the next 10 firing times",
        "Also: the renderer build moved from webpack to Vite",
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
