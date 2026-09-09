// MarkdownEditor 语言包: 名称 (zh-CN = define.tsx AppName 默认; 缺省回退 zh-CN)
export default {
  default: 'zh-CN',
  'zh-TW': { appName: "Markdown 編輯器" },
  en: { appName: "Markdown Editor" },
} as const;

// 界面文案词条 (zh 短语即 key; 缺 zh-CN 时回退原文)
const uilangRows: Record<string, [string, string]> = {
  '已复制': ['已複製', 'Copied'],
  '载入示例': ['載入範例', 'Load sample'],
  '清空': ['清空', 'Clear'],
  '复制': ['複製', 'Copy'],
  'HTML 源码': ['HTML 原始碼', 'HTML source'],
  '格式化': ['格式化', 'Format'],
  '左': ['左', 'Left'],
  '右': ['右', 'Right'],
  '写': ['寫', 'Write'],
  '符号': ['符號', 'Symbols'],
  '名称': ['名稱', 'Issuer'],
  'px': ['px', 'px'],
  '生成': ['產生', 'Generate'],
  '位': ['位', 'bits'],
  'r:': ['r:', 'r:'],
  'p:': ['p:', 'p:'],
  '计算': ['計算', 'Compute'],
  '字符': ['字元', 'Characters'],
  '删除': ['刪除', 'Delete'],
  '全部': ['全部', 'All'],
  '文字': ['文字', 'Text'],
  '一级标题': ['一級標題', 'Heading 1'],
  '二级标题': ['二級標題', 'Heading 2'],
  '三级标题': ['三級標題', 'Heading 3'],
  '加粗': ['粗體', 'Bold'],
  '斜体': ['斜體', 'Italic'],
  '删除线': ['刪除線', 'Strikethrough'],
  '行内代码': ['行內程式碼', 'Inline code'],
  '链接 [文字](url)': ['連結 [文字](url)', 'Link [text](url)'],
  '图片 ![alt](url)': ['圖片 ![alt](url)', 'Image ![alt](url)'],
  '无序列表': ['無序清單', 'Unordered list'],
  '有序列表': ['有序清單', 'Ordered list'],
  '插入表格': ['插入表格', 'Insert table'],
  '引用块': ['引用區塊', 'Blockquote'],
  '代码块': ['程式碼區塊', 'Code block'],
  '分隔线': ['分隔線', 'Horizontal rule'],
  '行内公式': ['行內公式', 'Inline formula'],
  '块级公式': ['區塊公式', 'Block formula'],
  'Markdown 编辑器': ['Markdown 編輯器', 'Markdown Editor'],
  '左侧编写': ['左側編寫', 'Write on the left'],
  ', 右侧实时预览(支持常用语法与行内 / 块级 LaTeX 公式子集); 可导出': [', 右側即時預覽(支援常用語法與行內 / 區塊級 LaTeX 公式子集); 可匯出', ', live preview on the right (common syntax plus inline / block-level LaTeX subset); you can export a'],
  ' 源文件或自带样式的独立 ': [' 源檔或自帶樣式的獨立 ', ' source file, or a self-styled standalone '],
  ' 文档。': [' 文件。', ' document.'],
  '工具栏 (光标处插入)': ['工具列 (在游標處插入)', 'Toolbar (insert at cursor)'],
  '已载入示例': ['已載入範例', 'Sample loaded'],
  'Markdown 源码': ['Markdown 源碼', 'Markdown source'],
  '收起右侧预览, 专注编辑': ['收起右側預覽, 專注編輯', 'Collapse the right preview to focus on writing'],
  '恢复右侧预览面板': ['恢復右側預覽面板', 'Restore the right preview panel'],
  '隐藏预览': ['隱藏預覽', 'Hide preview'],
  '显示预览': ['顯示預覽', 'Show preview'],
  '{l} 行 / {c} 字符': ['{l} 行 / {c} 字元', '{l} lines / {c} chars'],
  '在此输入 Markdown…': ['在此輸入 Markdown…', 'Type Markdown here…'],
  '预览': ['預覽', 'Preview'],
  '源文件': ['源檔', 'source file'],
  '已复制预览 HTML': ['已複製預覽 HTML', 'Copied preview HTML'],
  '导出 HTML': ['匯出 HTML', 'Export HTML'],
  '已下载 {file}': ['已下載 {file}', 'Downloaded {file}'],
  '复制失败, 请手动选择复制': ['複製失敗, 請手動選擇複製', 'Copy failed, please copy manually'],
  '解析': ['解析', 'Parse'],
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

