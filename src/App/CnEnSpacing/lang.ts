// CnEnSpacing 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "中英文自動排版" },
  en: { appName: "CJK & Latin Spacing" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  '复制': ['複製', 'Copy'],
  '暂无结果 — 输入文本后自动排版。': ['尚無結果 — 輸入文字後自動排版。', 'No result yet — typing text reformats it automatically.'],
  '中英文自动排版': ['中英文自動排版', 'Auto-spacing between Chinese and English'],
  '自动在中文与英文字母、数字之间插入空格（如 “使用HTML” → “使用 HTML”）。仅处理紧邻的混排边界：已存在的空格不会重复添加；标点符号、换行与段落结构不会被修改。': ['自動在中文與英文字母、數字之間插入空格（如「使用HTML」→「使用 HTML」）。僅處理緊鄰的混排邊界：已存在的空格不會重複加入；標點符號、換行與段落結構不會被修改。', 'Automatically inserts spaces between Chinese and adjacent Latin letters/digits (e.g. “使用HTML” → “使用 HTML”). Only tight mixed-script boundaries are touched: existing spaces are never duplicated, and punctuation, line breaks and paragraph structure are left intact.'],
  '待排版文本': ['待排版文字', 'Text to space'],
  '排版结果': ['排版結果', 'Result'],
  '粘贴中英混排文本…': ['貼上中英混排文字…', 'Paste mixed Chinese/English text…'],
  '已插入 ': ['已插入 ', 'Inserted '],
  ' 个空格': [' 個空格', ' space(s)'],
  '读': ['讀', 'Read'],
  '符号': ['符號', 'Symbols'],
  '数字': ['數字', 'Numeric'],
  '位': ['位', 'bits'],
  '字符': ['字元', 'Characters'],
  '文字': ['文字', 'Text'],
  '个': ['個', ''],
  '时': ['時', 'h'],
  '或': ['或', 'OR'],
};

// 取词: 无命中回退 zh 原文 (与共享 ui-lang 行为一致)
export const u = (locale: string, zh: string): string => {
  const hit = uilangRows[zh];
  if (!hit) return zh;
  return locale === 'zh-TW' ? hit[0] : locale === 'en' ? hit[1] : zh;
};
export const uT = (locale: string, zhTpl: string, vars?: Record<string, string | number>): string => {
  let out = u(locale, zhTpl);
  if (vars) out = out.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  return out;
};

