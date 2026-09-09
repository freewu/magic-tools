// SQLFormatter 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "SQL Formatter" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '复制': ['複製', 'Copy'],
  '复制到粘贴板成功！！！': ['複製到剪貼簿成功！！！', 'Copied to clipboard!!!'],
  '格式化结果': ['格式化結果', 'Formatted result'],
  '保存失败: {m}': ['儲存失敗: {m}', 'Save failed: {m}'],
  '点击复制内容到粘贴板': ['點擊複製內容到剪貼簿', 'Click to copy'],
  '格式化': ['格式化', 'Format'],
  '请先输入 SQL 语句进行格式化': ['請先輸入 SQL 語句進行格式化', 'Enter a SQL statement to format first'],
  '语言类型:': ['語言類型:', 'Dialect:'],
  '关键字格式:': ['關鍵字格式:', 'Keyword case:'],
  '对齐方式:': ['對齊方式:', 'Indent style:'],
  '保存为 .sql': ['儲存為 .sql', 'Save as .sql'],
  '打开 SQL 文件': ['開啟 SQL 檔案', 'Open SQL file'],
  '输入需要格式化的 SQL 语句 或 拖拽 .sql 文件到框内': ['輸入需要格式化的 SQL 語句 或 拖曳 .sql 檔案到框內', 'Enter the SQL to format, or drop a .sql file into the box'],
  '保存 SQL 文件': ['儲存 SQL 檔案', 'Save SQL file'],
  'SQL 文件': ['SQL 檔案', 'SQL file'],
  '已保存 SQL 文件': ['已儲存 SQL 檔案', 'SQL file saved'],
  '写': ['寫', 'Write'],
  '宽': ['寬', 'Width'],
  '高': ['高', 'Height'],
  'px': ['px', 'px'],
  '生成': ['產生', 'Generate'],
  'r:': ['r:', 'r:'],
  '双击复制内容到粘贴板': ['雙擊複製內容到剪貼簿', 'Double-click to copy the content'],
  '清除': ['清除', 'Clear'],
  '全部': ['全部', 'All'],
  '标准': ['標準', 'Standard'],
  '个': ['個', ''],
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

