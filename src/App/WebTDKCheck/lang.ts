// WebTDKCheck 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "網頁TDK 資訊檢測" },
  en: { appName: "Web TDK Inspector" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const webmasterlangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '关键词': ['關鍵詞', 'Keywords'],
  '正常': ['正常', 'Normal'],
  '复制到粘贴板成功!!!': ['複製到剪貼簿成功!!!', 'Copied to clipboard!!!'],
  '允许': ['允許', 'Allow'],
  '输入': ['輸入', 'Input'],
  '抓取': ['抓取', 'Fetch'],
  '网址必须以 http:// 或 https:// 开头': ['網址必須以 http:// 或 https:// 開頭', 'The URL must start with http:// or https://'],
  '值': ['值', 'Value'],
  '是': ['是', 'Yes'],
  '未知': ['未知', 'Unknown'],
  '解析': ['解析', 'Parse'],
  '浏览器': ['瀏覽器', 'Browser'],
  '标题 Title': ['標題 Title', 'Title'],
  '关键词 KeyWords': ['關鍵詞 KeyWords', 'Keywords'],
  '描述 Description': ['描述 Description', 'Description'],
  '缺少 <title> 标签, 建议补充, 有助于搜索引擎确定页面主题': ['缺少 <title> 標籤, 建議補充, 有助於搜尋引擎確定頁面主題', 'Missing a <title> tag — add one so search engines can determine the page topic'],
  '缺少 <meta name="keywords">, 部分搜索引擎仍会参考': ['缺少 <meta name="keywords">, 部分搜尋引擎仍會參考', 'Missing <meta name="keywords"> — some search engines still consider it'],
  '缺少 <meta name="description">, 建议补充以提升搜索结果摘要展示': ['缺少 <meta name="description">, 建議補充以提升搜尋結果摘要展示', 'Missing <meta name="description"> — add one to improve how the snippet appears in search results'],
  '未设置': ['未設定', 'Not set'],
  '长度正常': ['長度正常', 'Length OK'],
  '超过建议': ['超過建議', 'Over suggested'],
  '当前 {a} / 建议不超过 {b} 字符': ['目前 {a} / 建議不超過 {b} 字元', '{a} now / suggested max {b} chars'],
  '输入网址, 如 https://example.com': ['輸入網址, 如 https://example.com', 'Enter a URL, e.g. https://example.com'],
  '检测': ['檢測', 'Check'],
  '浏览器演示版受 CORS 限制, 多数外部站点无法抓取; 桌面版 (Tauri) 无此限制': ['瀏覽器示範版受 CORS 限制, 多數外部網站無法抓取; 桌面版 (Tauri) 無此限制', 'The browser demo is limited by CORS, so most external sites cannot be fetched; the desktop (Tauri) build has no such restriction'],
  '检测完成: {url}': ['檢測完成: {url}', 'Checked: {url}'],
  '双击复制内容': ['雙擊複製內容', 'Double-click to copy'],
  '请先输入要检测的网址': ['請先輸入要檢測的網址', 'Enter a URL to check first'],
  '检测失败: {msg}': ['檢測失敗: {msg}', 'Check failed: {msg}'],
  '网页 TDK 信息检测说明': ['網頁 TDK 資訊檢測說明', 'About TDK checking'],
  'keywords / description 两个 meta 标签并给出长度建议': ['keywords / description 兩個 meta 標籤並給出長度建議', 'the keywords / description meta tags and gives length suggestions'],
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

