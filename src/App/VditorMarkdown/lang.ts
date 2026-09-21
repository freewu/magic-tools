// 即时渲染 Markdown 的语言包 (跟随应用语言: zh-CN / zh-TW / en)
export interface VditorLangPack {
  default: string;
  'zh-TW': { appName: string };
  en: { appName: string };
}

const lang: VditorLangPack = {
  default: 'zh-CN',
  'zh-TW': { appName: '即時渲染 Markdown' },
  en: { appName: 'Instant Markdown' },
};

export default lang;

/** 界面文案表: key 为简体中文原文, value 为 [繁体, 英文] */
export const vditorlangRows: Record<string, [string, string]> = {
  '即时渲染 Markdown': ['即時渲染 Markdown', 'Instant Markdown'],
  '即时渲染': ['即時渲染', 'Instant'],
  '分屏预览': ['分割預覽', 'Split view'],
  '所见即所得': ['所見即所得', 'WYSIWYG'],
  '示例': ['範例', 'Sample'],
  '复制 Markdown': ['複製 Markdown', 'Copy Markdown'],
  '复制 HTML': ['複製 HTML', 'Copy HTML'],
  '导出 .md': ['匯出 .md', 'Export .md'],
  '导出 .html': ['匯出 .html', 'Export .html'],
  '插入目录': ['插入目錄', 'Insert TOC'],
  '清空': ['清空', 'Clear'],
  '编辑器加载中…': ['編輯器載入中…', 'Loading editor…'],
  '编辑器加载失败, 请刷新页面重试': ['編輯器載入失敗, 請重新整理頁面再試', 'Failed to load the editor, please refresh the page and retry'],
  '未找到可插入的标题 (需要 h2 及以下标题)': ['找不到可插入的標題 (需要 h2 及以下標題)', 'No heading to insert (need h2 or lower)'],
  '已复制到粘贴板': ['已複製到貼上板', 'Copied to clipboard'],
  '已复制 Markdown': ['已複製 Markdown', 'Markdown copied'],
  '已复制 HTML': ['已複製 HTML', 'HTML copied'],
  '保存成功': ['儲存成功', 'Saved'],
  'HTML 渲染失败': ['HTML 渲染失敗', 'Failed to render HTML'],
  '复制失败, 请手动选择复制': ['複製失敗, 請手動選取複製', 'Copy failed, please select and copy manually'],
  '基础语法': ['基礎語法', 'Basic syntax'],
  '表格 / 任务 / 脚注': ['表格 / 任務 / 註腳', 'Tables / tasks / footnotes'],
  '代码块与高亮': ['程式碼區塊與高亮', 'Code blocks & highlight'],
  '数学公式': ['數學公式', 'Math formulas'],
  '技术文档模板': ['技術文件範本', 'API doc template'],
  '周报模板': ['週報範本', 'Weekly report'],
  '在此输入 Markdown, 光标所在块会即时渲染': [
    '在此輸入 Markdown, 游標所在區塊會即時渲染',
    'Type Markdown here, the block under the cursor renders instantly',
  ],
  '即时渲染: 光标所在块实时渲染, 其余块保持源码': [
    '即時渲染: 游標所在區塊即時渲染, 其餘區塊保持原始碼',
    'Instant: the block under the cursor renders live, others keep the source',
  ],
  '分屏预览: 左侧源码, 右侧实时预览': ['分割預覽: 左側原始碼, 右側即時預覽', 'Split view: source on the left, live preview on the right'],
  '所见即所得: 全部内容都是渲染结果': ['所見即所得: 全部內容都是渲染結果', 'WYSIWYG: everything is already rendered'],
  '支持表格 / 任务列表 / 代码高亮 / KaTeX 公式 / 脚注 / 提示块; 粘贴或拖入的图片以 base64 内联 (2MB 以内)': [
    '支援表格 / 任務清單 / 程式碼高亮 / KaTeX 公式 / 註腳 / 提示區塊; 貼上或拖入的圖片以 base64 內嵌 (2MB 以內)',
    'Supports tables, task lists, code highlight, KaTeX math, footnotes and callouts; pasted or dropped images are inlined as base64 (up to 2MB)',
  ],
  '仅支持插入图片文件': ['僅支援插入圖片檔案', 'Only image files can be inserted'],
  '图片过大 (超过 2MB), 请先压缩再插入': ['圖片過大 (超過 2MB), 請先壓縮再插入', 'Image too large (over 2MB), please compress it first'],
  '编辑器尚未就绪': ['編輯器尚未就緒', 'The editor is not ready yet'],
  '{c} 字符 · {w} 词 · {l} 行 · {h} 标题 · {cb} 代码块 · {lk} 链接 · {im} 图片': [
    '{c} 字元 · {w} 詞 · {l} 行 · {h} 標題 · {cb} 程式碼區塊 · {lk} 連結 · {im} 圖片',
    '{c} chars · {w} words · {l} lines · {h} headings · {cb} code blocks · {lk} links · {im} images',
  ],
};

/** 按语言取文案 (zh-CN 直接返回原文) */
export function vm(locale: string, zh: string): string {
  if (locale === 'zh-TW') return vditorlangRows[zh]?.[0] ?? zh;
  if (locale === 'en') return vditorlangRows[zh]?.[1] ?? zh;
  return zh;
}

/** 按语言取文案并替换 {name} 变量 */
export function vmT(locale: string, zh: string, vars?: Record<string, string | number>): string {
  const text = vm(locale, zh);
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (raw, key: string) => (key in vars ? String(vars[key]) : raw));
}
