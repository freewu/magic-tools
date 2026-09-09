// XmlFormatter 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "XML Formatter" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  '复制': ['複製', 'Copy'],
  '格式化结果': ['格式化結果', 'Formatted result'],
  '2 空格': ['2 空格', '2 spaces'],
  '4 空格': ['4 空格', '4 spaces'],
  '已复制格式化结果': ['已複製格式化結果', 'Formatted result copied'],
  '已下载 formatted.xml': ['已下載 formatted.xml', 'formatted.xml downloaded'],
  '已载入示例 XML': ['已載入範例 XML', 'Sample XML loaded'],
  '复制失败, 请手动全选复制': ['複製失敗, 請手動全選複製', 'Copy failed — select and copy manually'],
  'XML 格式化': ['XML 格式化', 'XML formatter'],
  'XML / XAML / SVG / plist / 配置文件美化缩进，支持 XML 声明、注释、CDATA 与处理指令的保留。标签未闭合、交叉嵌套或多余闭合会给出带行号的错误提示。': ['XML / XAML / SVG / plist / 設定檔美化縮排，支援 XML 宣告、註解、CDATA 與處理指令的保留。標籤未閉合、交叉巢狀或多餘閉合會給出帶行號的錯誤提示。', 'Prettifies XML / XAML / SVG / plist / config files; XML declarations, comments, CDATA and processing instructions are preserved. Unclosed tags, interleaved nesting or stray closing tags produce an error message with a line number.'],
  '原始 XML': ['原始 XML', 'Raw XML'],
  '在此粘贴 XML 源码…': ['在此貼上 XML 原始碼…', 'Paste XML source here…'],
  '例如: <config><server host="127.0.0.1"/></config>': ['例如: <config><server host="127.0.0.1"/></config>', 'e.g. <config><server host="127.0.0.1"/></config>'],
  '下载 .xml': ['下載 .xml', 'Download .xml'],
  'XML 语法错误': ['XML 語法錯誤', 'XML syntax error'],
  '原始 {c} 字符 / {n} 行': ['原始 {c} 字元 / {n} 行', 'Raw: {c} characters / {n} lines'],
  '格式化后 {c} 字符': ['格式化後 {c} 字元', 'After formatting: {c} characters'],
  '{n} 行': ['{n} 行', '{n} lines'],
  '暂无结果 — 在上方粘贴 XML 后自动格式化。': ['尚無結果 — 在上方貼上 XML 後自動格式化。', 'No result yet — pasting XML above formats it automatically.'],
  '行号': ['行號', 'Line numbers'],
  '格式化': ['格式化', 'Format'],
  '读': ['讀', 'Read'],
  '写': ['寫', 'Write'],
  '位': ['位', 'bits'],
  'r:': ['r:', 'r:'],
  '字符': ['字元', 'Characters'],
  '位置': ['位置', 'Location'],
  '已载入示例': ['已載入範例', 'Sample loaded'],
  '解析': ['解析', 'Parse'],
  '每': ['每', 'Every'],
  '分': ['分', 'm'],
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

