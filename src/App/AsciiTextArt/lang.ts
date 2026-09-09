// AsciiTextArt 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  en: { appName: "ASCII Text Art" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '复制': ['複製', 'Copy'],
  '{n} 字符': ['{n} 字元', '{n} characters'],
  '读': ['讀', 'Read'],
  '数字': ['數字', 'Numeric'],
  '宽': ['寬', 'Width'],
  '生成': ['產生', 'Generate'],
  '次': ['次', 'times'],
  'N:': ['N:', 'N:'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '字符': ['字元', 'Characters'],
  '文字': ['文字', 'Text'],
  '输入要生成大字的内容 (支持多行, 每行独立排版)': ['輸入要產生大字內容 (支援多行, 每行獨立排版)', 'Enter the text to render as ASCII art (multi-line supported, each line typeset independently)'],
  '字体': ['字體', 'Font'],
  '选择 figlet 字体': ['選擇 figlet 字體', 'Select a figlet font'],
  '共 {n} 款 figlet 字体': ['共 {n} 款 figlet 字體', '{n} figlet fonts'],
  '预览字号': ['預覽字號', 'Preview size'],
  '仅缩放预览显示, 复制的文本不受影响': ['僅縮放預覽顯示, 複製的文字不受影響', 'Only scales the preview — copied text is unaffected'],
  '字体来自 figlet 经典字体集; 支持英文字母 / 数字 / 常用标点, 中文等未收录字符按字体回退显示 · 默认字体可在「设置 → 其它」中调整': ['字體來自 figlet 經典字體集; 支援英文字母 / 數字 / 常用標點, 中文等未收錄字元依字體回退顯示 · 預設字體可在「設定 → 其他」中調整', 'Fonts come from the classic figlet collection; letters / digits / common punctuation are supported, while unlisted characters (e.g. CJK) fall back per font · the default font can be changed under Settings → Others'],
  '结果 ({r} 行 · {c} 字符):': ['結果 ({r} 行 · {c} 字元):', 'Result ({r} lines · {c} chars):'],
  '复制文本': ['複製文字', 'Copy text'],
  '下载 .txt': ['下載 .txt', 'Download .txt'],
  '提示: 预览按等宽字体近似比例示意, 复制到 Markdown 代码块或等宽字体编辑器效果最佳': ['提示: 預覽以等寬字型近似比例示意, 複製到 Markdown 程式碼區塊或等寬字型編輯器效果最佳', 'Tip: the preview approximates monospace proportions; pasting into a Markdown code block or a monospace editor gives the best result'],
  '已复制 {n} 字符到剪贴板': ['已複製 {n} 字元到剪貼簿', 'Copied {n} characters to the clipboard'],
  '复制失败, 请手动选中文本复制': ['複製失敗, 請手動選取文字複製', 'Copy failed — select the text and copy manually'],
  '保存 {n}': ['儲存 {n}', 'Save {n}'],
  '已保存 {n}': ['已儲存 {n}', 'Saved {n}'],
  '文本文件': ['文字檔', 'Text file'],
  '代码块': ['程式碼區塊', 'Code block'],
  '预览': ['預覽', 'Preview'],
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

