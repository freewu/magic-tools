// HtmlFormat 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "HTML Formatter" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  '复制': ['複製', 'Copy'],
  'HTML 格式化': ['HTML 格式化', 'HTML formatter'],
  '美化格式化 HTML 代码: 块级元素缩进换行、行内元素保留在一行、文本空白自动折叠。script / style / pre / textarea 内容原样保留。缩进空格数可在右侧或「设置 → 格式化」中切换 2 / 4 空格。': ['美化格式化 HTML 程式碼: 區塊元素縮排換行、行內元素保留在同一行、文字空白自動摺疊。script / style / pre / textarea 內容原樣保留。縮排空格數可在右側或「設定 → 格式化」中切換 2 / 4 空格。', 'Prettifies HTML: block-level elements are indented on new lines, inline elements stay on one line, and text whitespace collapses. Content inside script / style / pre / textarea is preserved as-is. The indentation can be switched between 2 / 4 spaces on the right or under Settings → Formatting.'],
  'HTML 源码': ['HTML 原始碼', 'HTML source'],
  '格式化结果': ['格式化結果', 'Formatted result'],
  '2 空格': ['2 空格', '2 spaces'],
  '4 空格': ['4 空格', '4 spaces'],
  '粘贴 HTML 代码…': ['貼上 HTML 程式碼…', 'Paste HTML code…'],
  '如: <div><p>你好</p></div>': ['如: <div><p>你好</p></div>', 'e.g. <div><p>hello</p></div>'],
  '{n} 字符': ['{n} 字元', '{n} characters'],
  '暂无结果 — 输入 HTML 后自动格式化。': ['尚無結果 — 輸入 HTML 後自動格式化。', 'No result yet — pasting HTML formats it automatically.'],
  '格式化': ['格式化', 'Format'],
  '右': ['右', 'Right'],
  '写': ['寫', 'Write'],
  '宽': ['寬', 'Width'],
  '次': ['次', 'times'],
  'r:': ['r:', 'r:'],
  '字符': ['字元', 'Characters'],
  '文字': ['文字', 'Text'],
  '加粗': ['粗體', 'Bold'],
  '斜体': ['斜體', 'Italic'],
  '解析': ['解析', 'Parse'],
  '至': ['至', 'to'],
  '每': ['每', 'Every'],
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

