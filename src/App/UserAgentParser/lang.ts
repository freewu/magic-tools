// UserAgentParser 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "User-Agent Parser" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const webmasterlangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制失败, 请手动选择复制': ['複製失敗, 請手動選擇複製', 'Copy failed — please select and copy manually'],
  '复制': ['複製', 'Copy'],
  '清空': ['清空', 'Clear'],
  '输入': ['輸入', 'Input'],
  '{c} 字符': ['{c} 字元', '{c} characters'],
  '解析结果': ['解析結果', 'Parse results'],
  '名称': ['名稱', 'Name'],
  '字符串': ['字串', 'String'],
  '是': ['是', 'Yes'],
  '手机': ['手機', 'Mobile'],
  '平板': ['平板', 'Tablet'],
  '桌面设备': ['桌上型裝置', 'Desktop'],
  '电视 / 大屏': ['電視 / 大螢幕', 'TV / big screen'],
  '爬虫 / 程序': ['爬蟲 / 程式', 'Bot / program'],
  '未知': ['未知', 'Unknown'],
  '解析': ['解析', 'Parse'],
  'UA 解析': ['UA 解析', 'UA Parser'],
  '从 User-Agent 字符串中提取浏览器名称与版本、渲染引擎、操作系统、CPU 架构与设备信息。页面加载时已自动载入当前浏览器的 UA，也可粘贴任意 UA 字符串手动分析。': ['從 User-Agent 字串中擷取瀏覽器名稱與版本、渲染引擎、作業系統、CPU 架構與裝置資訊。頁面載入時會自動帶入目前瀏覽器的 UA, 也可貼上任意 UA 字串手動分析。', 'Extracts the browser name and version, rendering engine, operating system, CPU architecture and device type from a User-Agent string. The current browser UA is loaded automatically; you can also paste any UA string to analyze it.'],
  'User-Agent 字符串': ['User-Agent 字串', 'User-Agent string'],
  '粘贴 User-Agent 字符串…': ['貼上 User-Agent 字串…', 'Paste a User-Agent string…'],
  '浏览器 / 程序': ['瀏覽器 / 程式', 'Browser / program'],
  '爬虫 / 非浏览器': ['爬蟲 / 非瀏覽器', 'Bot / non-browser'],
  '渲染引擎': ['渲染引擎', 'Rendering engine'],
  '操作系统': ['作業系統', 'Operating system'],
  'CPU 架构': ['CPU 架構', 'CPU architecture'],
  '设备类型': ['裝置類型', 'Device type'],
  '设备型号': ['裝置型號', 'Device model'],
  '检测到非浏览器程序: {name}': ['偵測到非瀏覽器程式: {name}', 'Non-browser program detected: {name}'],
  '该 UA 通常来自搜索引擎爬虫或命令行/脚本请求，不是真实用户的浏览器。': ['該 UA 通常來自搜尋引擎爬蟲或命令列/腳本請求, 不是真實使用者的瀏覽器。', 'Such UAs usually come from search-engine crawlers or CLI/script requests, not from a real user browser.'],
  '请输入 User-Agent 字符串进行分析': ['請輸入 User-Agent 字串進行分析', 'Enter a User-Agent string to analyze'],
  '常见 UA 速查': ['常見 UA 速查', 'Common UA cheatsheet'],
  '已载入 {label} UA': ['已載入 {label} UA', '{label} UA loaded'],
  '生成': ['產生', 'Generate'],
  'UA 生成': ['UA 產生', 'UA Generator'],
  '勾选需要的「平台」与「浏览器」（可多选），点': ['勾選需要的「平台」與「瀏覽器」（可多選），點', 'Tick the platforms and browsers you need (multi-select), then click '],
  '生成 UA 列表': ['產生 UA 清單', 'Generate UA list'],
  ' 即可得到全部组合的 UA 字符串，每条可单独复制或载入「解析」tab 验证。': [' 即可得到全部組合的 UA 字串, 每條可單獨複製或載入「解析」tab 驗證。', ' to build UA strings for every combination — each one can be copied individually or loaded into the Parse tab to verify.'],
  'Safari 仅有 macOS / iOS 版本，不支持的组合会自动跳过并标注。': ['Safari 僅有 macOS / iOS 版本, 不支援的組合會自動跳過並標註。', 'Safari only ships macOS / iOS builds; unsupported combinations are skipped and flagged automatically.'],
  '组合条件': ['組合條件', 'Combination options'],
  '平台': ['平台', 'Platform'],
  '浏览器': ['瀏覽器', 'Browser'],
  '浏览器版本': ['瀏覽器版本', 'Browser version'],
  '留空 = 各浏览器默认较新版本': ['留空 = 各瀏覽器預設較新版本', 'Leave blank to use a recent default version for each browser'],
  '（可选，例如 130）': ['（選用, 例如 130）', '(optional, e.g. 130)'],
  '生成结果 ({n} 条可用)': ['產生結果 ({n} 條可用)', 'Generated results ({n} usable)'],
  '复制全部': ['複製全部', 'Copy all'],
  '载入解析': ['載入解析', 'Load into parser'],
  '已载入「{label}」到解析': ['已載入「{label}」到解析', '「{label}」loaded into the parser'],
  '该浏览器无此平台版本': ['該瀏覽器無此平台版本', 'This browser has no version for this platform'],
  '尚未生成 — 勾选上方平台与浏览器组合后点击「生成 UA 列表」。': ['尚未產生 — 勾選上方平台與瀏覽器組合後點擊「產生 UA 清單」。', 'Not generated yet — tick platform/browser combinations above, then click Generate UA list.'],
  'Android 手机': ['Android 手機', 'Android phone'],
  '检测': ['檢測', 'Check'],
};

// 取词: 无命中回退 zh 原文 (与共享 webmaster-lang 行为一致)
export const wm = (locale: string, zh: string): string => {
  const e = webmasterlangRows[zh];
  if (!e) return zh;
  return locale === 'zh-TW' ? e[0] : locale === 'en' ? e[1] : zh;
};
export const wmT = (locale: string, zh: string, v?: Record<string, string | number>): string => {
  let s = wm(locale, zh);
  if (v) for (const [k, val] of Object.entries(v)) s = s.split('{'+k+'}').join(String(val));
  return s;
};

