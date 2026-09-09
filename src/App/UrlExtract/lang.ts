// UrlExtract 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "URL Extractor" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const webmasterlangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制': ['複製', 'Copy'],
  '不可用': ['不可用', 'Unavailable'],
  '已复制 {n} 个 URL': ['已複製 {n} 個 URL', 'Copied {n} URLs'],
  '复制失败, 请手动全选复制': ['複製失敗, 請手動全選複製', 'Copy failed — please select all and copy manually'],
  '已下载 urls.txt': ['已下載 urls.txt', 'Downloaded urls.txt'],
  '已载入示例文本': ['已載入範例文字', 'Sample text loaded'],
  'URL 提取': ['URL 提取', 'Extract URLs'],
  '从任意文本（日志、邮件、页面源码…）中批量提取链接。自动清理行尾句读标点与不成对括号；「去重」默认开启，可在 设置 → 站长工具 中调整默认值。': ['從任意文字（日誌、郵件、頁面原始碼…）中批次提取連結。自動清理行尾句讀標點與不成對括號；「去重」預設開啟，可在 設定 → 站長工具 中調整預設值。', 'Bulk-extract links from any text (logs, e-mails, page source…). Trailing punctuation and unbalanced brackets are cleaned automatically; “Deduplicate” is on by default and can be changed in Settings → Webmaster Tools.'],
  '原始文本': ['原始文字', 'Source text'],
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  '去重': ['去重', 'Deduplicate'],
  '仅 http/https': ['僅 http/https', 'http/https only'],
  '原文 {c} 字符, 检出 {n} 条 (去重前)': ['原文 {c} 字元, 偵測到 {n} 條 (去重前)', '{c} chars in source, {n} found (before dedupe)'],
  '提取结果': ['提取結果', 'Extracted URLs'],
  '下载 .txt': ['下載 .txt', 'Download .txt'],
  '提取 {n} 个 URL': ['提取 {n} 個 URL', 'Extracted {n} URLs'],
  '已去重 {n} 条': ['已去重 {n} 條', '{n} duplicate(s) removed'],
  '暂无结果 — 在上方粘贴包含链接的文本后自动提取。': ['暫無結果 — 在上方貼上包含連結的文字後會自動提取。', 'No results yet — paste text containing links above to extract automatically.'],
  '{c} 字符': ['{c} 字元', '{c} characters'],
  '值': ['值', 'Value'],
  '是': ['是', 'Yes'],
  '未设置': ['未設定', 'Not set'],
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

