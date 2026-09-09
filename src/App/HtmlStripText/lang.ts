// HtmlStripText 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "HTML 標籤去除" },
  en: { appName: "HTML Tag Stripper" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const webmasterlangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制': ['複製', 'Copy'],
  '复制失败, 请手动全选复制': ['複製失敗, 請手動全選複製', 'Copy failed — please select all and copy manually'],
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  '提取结果': ['提取結果', 'Extracted URLs'],
  '下载 .txt': ['下載 .txt', 'Download .txt'],
  '已载入文件 {name} ({c} 字符)': ['已載入檔案 {name} ({c} 字元)', 'Loaded file {name} ({c} characters)'],
  '文件读取失败': ['檔案讀取失敗', 'Failed to read the file'],
  '已复制提取结果': ['已複製提取結果', 'Extracted text copied'],
  '已下载 extracted-text.txt': ['已下載 extracted-text.txt', 'Downloaded extracted-text.txt'],
  'HTML 标签去除': ['HTML 標籤去除', 'Strip HTML Tags'],
  '去掉 HTML 标签只保留文本内容, 并按段落 / 列表 / 表格结构保留换行。': ['去掉 HTML 標籤只保留文字內容, 並依段落 / 列表 / 表格結構保留換行。', 'Removes HTML tags, keeping only the text while preserving line breaks for paragraphs / lists / tables.'],
  'select 下拉框': ['select 下拉框', 'select dropdown'],
  ': 默认把每个 ': [': 預設會把每個 ', 'Each '],
  ' 提取为': [' 提取為', ' is extracted as'],
  'value: 文本': ['value: 文字', 'value: text'],
  ' 一行(如 ': [' 一行(如 ', ' on one line (e.g. '],
  '), 避免下拉选项文本粘连丢失。': ['), 避免下拉選項文字黏連遺失。', '), so option labels never stick together.'],
  'script / style / 注释等内容自动剔除。': ['script / style / 註解等內容會自動剔除。', 'script / style / comment contents are removed automatically.'],
  '原始 HTML': ['原始 HTML', 'Source HTML'],
  '读取文件': ['讀取檔案', 'Open file'],
  '已载入示例 HTML': ['已載入範例 HTML', 'Sample HTML loaded'],
  'select 下拉框选项提取为': ['select 下拉框選項提取為', 'Extract <select> options as'],
  ' 行': [' 行', ' line'],
  '原始 {c} 字符 / {n} 行': ['原始 {c} 字元 / {n} 行', '{c} chars / {n} lines in source'],
  '提取结果 (纯文本)': ['提取結果 (純文字)', 'Extracted text (plain)'],
  '提取后 {c} 字符': ['提取後 {c} 字元', '{c} characters after extraction'],
  '{n} 行': ['{n} 行', '{n} lines'],
  '暂无结果 — 在上方粘贴 HTML 后会自动提取。': ['暫無結果 — 在上方貼上 HTML 後會自動提取。', 'No results yet — paste HTML above to extract automatically.'],
  '输入': ['輸入', 'Input'],
  '{c} 字符': ['{c} 字元', '{c} characters'],
  '值': ['值', 'Value'],
  '是': ['是', 'Yes'],
  '未知': ['未知', 'Unknown'],
  '解析': ['解析', 'Parse'],
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

