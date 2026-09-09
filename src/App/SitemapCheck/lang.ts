// SitemapCheck 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "Sitemap 檢查" },
  en: { appName: "Sitemap Checker" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const webmasterlangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制失败, 请手动选择复制': ['複製失敗, 請手動選擇複製', 'Copy failed — please select and copy manually'],
  '复制': ['複製', 'Copy'],
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  ' 行': [' 行', ' line'],
  '复制 CSV': ['複製 CSV', 'Copy CSV'],
  '校验 ': ['檢核 ', 'Validate '],
  'XML, 检查 URL 格式、': ['XML, 檢查 URL 格式、', 'XML, check URL formats, '],
  ' 日期、': [' 日期、', ' date, '],
  ' 枚举、': [' 枚舉、', ' enum values, '],
  ' 范围与重复 URL。': [' 範圍與重複 URL。', ' range and duplicated URLs.'],
  '支持粘贴或直接抓取在线 sitemap (Tauri 桌面端无跨域限制)。': ['支援貼上或直接抓取線上 sitemap (Tauri 桌面端無跨域限制)。', 'Paste XML or fetch an online sitemap directly (the Tauri desktop build has no CORS restrictions).'],
  'Sitemap 检查': ['Sitemap 檢查', 'Sitemap Check'],
  '输入': ['輸入', 'Input'],
  '粘贴 XML': ['貼上 XML', 'Paste XML'],
  '抓取网址': ['抓取網址', 'Fetch by URL'],
  '在此粘贴 sitemap.xml / sitemap index 的 XML 内容…': ['在此貼上 sitemap.xml / sitemap index 的 XML 內容…', 'Paste the XML of a sitemap.xml / sitemap index here…'],
  '抓取': ['抓取', 'Fetch'],
  '检查结果': ['檢查結果', 'Check results'],
  '无法识别': ['無法識別', 'Unrecognized'],
  '条目 {n}': ['條目 {n}', '{n} entries'],
  '重复 {n}': ['重複 {n}', '{n} duplicates'],
  '错误 {n}': ['錯誤 {n}', '{n} errors'],
  '告警 {n}': ['告警 {n}', '{n} warnings'],
  '已复制 CSV': ['已複製 CSV', 'CSV copied'],
  '下载 CSV': ['下載 CSV', 'Download CSV'],
  '已复制 JSON': ['已複製 JSON', 'JSON copied'],
  '复制 JSON': ['複製 JSON', 'Copy JSON'],
  '… 其余 {n} 条告警已省略': ['… 其餘 {n} 條告警已省略', '… {n} more warnings omitted'],
  '条目列表 ({n})': ['條目列表 ({n})', 'Entry list ({n})'],
  '共 {n} 条': ['共 {n} 條', '{n} in total'],
  '(空)': ['(空)', '(empty)'],
  '请输入 sitemap 网址': ['請輸入 sitemap 網址', 'Enter a sitemap URL'],
  '网址必须以 http:// 或 https:// 开头': ['網址必須以 http:// 或 https:// 開頭', 'The URL must start with http:// or https://'],
  '已抓取 {c} 字符': ['已抓取 {c} 字元', 'Fetched {c} characters'],
  '已下载 {file}': ['已下載 {file}', 'Downloaded {file}'],
  '检测到 .gz 压缩包: 请先本地解压后粘贴内容': ['偵測到 .gz 壓縮檔: 請先在本機解壓後再貼上內容', 'Detected a .gz archive: please decompress it locally and paste the content'],
  '服务器返回 HTTP {code}': ['伺服器回傳 HTTP {code}', 'The server returned HTTP {code}'],
  '{c} 字符': ['{c} 字元', '{c} characters'],
  '值': ['值', 'Value'],
  '是': ['是', 'Yes'],
  '解析': ['解析', 'Parse'],
  '生成': ['產生', 'Generate'],
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

