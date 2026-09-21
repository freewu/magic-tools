// 即时渲染 Markdown (Vditor) 的纯逻辑层
//
// 拆成独立模块的原因: Vditor 是重量级 DOM 编辑器 (lute 引擎 + contenteditable),
// 单测里必须整体打桩, 真正可测的是这里的扫描 / 统计 / 导出模板逻辑。
//
// 统一约定: 所有"按行扫描"的函数都会跳过围栏代码块内的行,
// 避免把代码里的 `# 注释` 当成标题、把 `- [x]` 当成任务项。

// ---------------- 编辑器模式 / 语言 / 资源路径 ----------------

/** 编辑模式: ir = 即时渲染 (本工具主打的模式), sv = 分屏预览, wysiwyg = 所见即所得 */
export type EditorMode = 'ir' | 'sv' | 'wysiwyg';

/** Vditor 界面语言 (跟随应用语言) */
export type VditorLang = 'zh_CN' | 'zh_TW' | 'en_US';

/** 应用语言 -> Vditor 界面语言 */
export function vditorLang(locale: string): VditorLang {
  if (locale === 'zh-TW') return 'zh_TW';
  if (locale === 'en') return 'en_US';
  return 'zh_CN';
}

/** 浅色 / 深色对应的内容主题名 (dist/css/content-theme/<name>.css) */
export function contentTheme(isDark: boolean): string {
  return isDark ? 'dark' : 'light';
}

/** 浅色 / 深色对应的代码高亮主题名 (dist/js/highlight.js/styles/<name>.min.css) */
export function hljsStyle(isDark: boolean): string {
  return isDark ? 'github-dark' : 'github';
}

/**
 * 把文档 URL (或 Vite base) 归一化成目录 URL (恒以 / 结尾)。
 * 例: 'http://localhost/index.html' -> 'http://localhost/', '/a/b/' -> '/a/b/'
 */
export function assetBase(ref: string): string {
  const clean = ref.split(/[?#]/)[0];
  return clean.endsWith('/') ? clean : clean.replace(/[^/]*$/, '');
}

/**
 * Vditor 的 cdn 选项前缀: 运行时资源 (lute 引擎 / 图标 / 语言包 / 高亮主题 / katex / 表情图)
 * 由 vite.config.mts 的插件按需拷到 <base>/vditor, 因此这里恒拼成 <base>/vditor。
 */
export function vditorCdn(base: string): string {
  return `${assetBase(base).replace(/\/+$/, '')}/vditor`;
}

/** 编辑器与 md2html 共用的 lute 解析配置 */
export const MARKDOWN_OPTIONS = {
  autoSpace: true,
  toc: true,
  mark: true,
  sup: true,
  sub: true,
  footnotes: true,
  codeBlockPreview: true,
  mathBlockPreview: true,
} as const;

/** 工具栏 (去掉上传 / 录音 / 导出等需要后端或与页面按钮重复的项) */
export const TOOLBAR = [
  'headings', 'bold', 'italic', 'strike', 'link', '|',
  'list', 'ordered-list', 'check', 'outdent', 'indent', '|',
  'quote', 'line', 'code', 'inline-code', 'insert-before', 'insert-after', '|',
  'table', 'math', 'emoji', '|',
  'undo', 'redo', '|',
  'edit-mode', 'both', 'preview', 'fullscreen', 'outline',
];

/** 截图里最常被问到的编辑器最小高度 */
export const EDITOR_HEIGHT = 460;

// ---------------- 围栏代码块扫描 ----------------

const FENCE_RE = /^\s{0,3}(`{3,}|~{3,})(.*)$/;

/**
 * 逐行标记是否位于围栏代码块内 (含围栏行自身)。
 * 未闭合的围栏视为一直延伸到文末 (与 CommonMark 一致)。
 */
export function fenceMask(md: string): boolean[] {
  const mask: boolean[] = [];
  let open: { char: string; len: number } | null = null;
  for (const line of md.split('\n')) {
    const m = FENCE_RE.exec(line);
    if (open === null) {
      if (m) {
        open = { char: m[1][0], len: m[1].length };
        mask.push(true);
      } else {
        mask.push(false);
      }
      continue;
    }
    mask.push(true);
    // 闭合围栏: 同种字符、长度不短于开启围栏, 且其后只有空白
    if (m && m[1][0] === open.char && m[1].length >= open.len && m[2].trim() === '') open = null;
  }
  return mask;
}

/** 围栏代码块数量 (按开启围栏计数, 未闭合也算一块) */
export function countFences(md: string): number {
  let count = 0;
  let open: { char: string; len: number } | null = null;
  for (const line of md.split('\n')) {
    const m = FENCE_RE.exec(line);
    if (!m) continue;
    if (open === null) {
      open = { char: m[1][0], len: m[1].length };
      count += 1;
    } else if (m[1][0] === open.char && m[1].length >= open.len && m[2].trim() === '') {
      open = null;
    }
  }
  return count;
}

/** 去掉围栏代码块与行内代码后的文本 (用于统计与目录扫描) */
export function stripCode(md: string): string {
  const mask = fenceMask(md);
  return md
    .split('\n')
    .map((line, i) => (mask[i] ? '' : line.replace(/`[^`\n]*`/g, ' ')))
    .join('\n');
}

// ---------------- 标题与目录 ----------------

export interface Heading {
  /** 标题层级 1-6 */
  level: number;
  /** 去掉行内标记后的标题文本 */
  text: string;
  /** 行号 (从 1 开始) */
  line: number;
}

/** 去掉行内标记 (粗体 / 链接 / 行内代码等), 保留可读文本 */
export function inlineText(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 提取所有 ATX 标题 (`# x`), 跳过围栏代码块内的内容 */
export function headings(md: string): Heading[] {
  const mask = fenceMask(md);
  const out: Heading[] = [];
  md.split('\n').forEach((line, i) => {
    if (mask[i]) return;
    const m = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) return;
    const text = inlineText(m[2]);
    if (text === '') return;
    out.push({ level: m[1].length, text, line: i + 1 });
  });
  return out;
}

/** 生成 Markdown 目录 (跳过 h1 文档标题与代码块), 无内容时返回空串 */
export function buildToc(md: string): string {
  const items = headings(md).filter((h) => h.level > 1);
  if (items.length === 0) return '';
  const lines = items.map((h) => `${'  '.repeat(h.level - 2)}- ${h.text}`);
  return [ '## 目录', '', ...lines, '' ].join('\n');
}

// ---------------- 统计 ----------------

export interface MarkdownStats {
  /** 字符数 (含空白) */
  chars: number;
  /** 字符数 (去空白) */
  charsNoSpace: number;
  /** 词数: 中日韩字符按字计, 拉丁字母 / 数字按连续串计 */
  words: number;
  /** 行数 */
  lines: number;
  /** 标题数 */
  headings: number;
  /** 围栏代码块数 */
  codeBlocks: number;
  /** 行内链接数 */
  links: number;
  /** 图片数 */
  images: number;
  /** 表格数 (按分隔行计数) */
  tables: number;
  /** 任务项数 */
  tasks: number;
  /** 已完成任务项数 */
  tasksDone: number;
  /** 引用行数 */
  quotes: number;
}

const CJK = '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\u3040-\\u30ff\\uac00-\\ud7af';
const CJK_RE = new RegExp(`[${CJK}]`, 'g');
const CJK_SPLIT_RE = new RegExp(`[${CJK}]`, 'g');
const WORD_RE = /[A-Za-z0-9_'-]+/g;
const LINK_RE = /\[[^\]]*\]\([^)]*\)/g;
const IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g;
const TABLE_RE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const TASK_RE = /^\s*[-*+]\s+\[[ xX]\]/;
const TASK_DONE_RE = /^\s*[-*+]\s+\[[xX]\]/;
const QUOTE_RE = /^\s{0,3}>/;

/** 词数统计: 中日韩字符逐字计, 其余按空白/标点切分 */
export function countWords(text: string): number {
  const cjk = text.match(CJK_RE)?.length ?? 0;
  const latin = text.replace(CJK_SPLIT_RE, ' ').match(WORD_RE)?.length ?? 0;
  return cjk + latin;
}

/** Markdown 统计 (跳过代码块, 行内代码不计入词数) */
export function markdownStats(md: string): MarkdownStats {
  const mask = fenceMask(md);
  const lines = md.split('\n');
  const text = stripCode(md);
  const inText = (re: RegExp, line: string, i: number) => !mask[i] && re.test(line);
  const count = (re: RegExp, src: string) => src.match(re)?.length ?? 0;
  const imageCount = count(IMAGE_RE, text);
  return {
    chars: md.length,
    charsNoSpace: md.replace(/\s/g, '').length,
    words: countWords(text),
    lines: md === '' ? 0 : lines.length,
    headings: headings(md).length,
    codeBlocks: countFences(md),
    // 图片语法同时命中链接正则, 需要减掉
    links: Math.max(0, count(LINK_RE, text) - imageCount),
    images: imageCount,
    tables: lines.filter((line, i) => inText(TABLE_RE, line, i)).length,
    tasks: lines.filter((line, i) => inText(TASK_RE, line, i)).length,
    tasksDone: lines.filter((line, i) => inText(TASK_DONE_RE, line, i)).length,
    quotes: lines.filter((line, i) => inText(QUOTE_RE, line, i)).length,
  };
}

// ---------------- 导出 HTML ----------------

/** HTML 转义 (标题 / 语言等由用户内容决定的片段) */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 导出 HTML 的基础样式 (Vditor 的内容主题 / 代码主题 CSS 会追加在后面) */
export const EXPORT_BASE_CSS = `:root { color-scheme: light dark; }
html, body { margin: 0; padding: 0; }
body { background: #fff; color: #1f2328; }
body.markdown-export-dark { background: #1e1e1e; color: #d4d4d4; }
.markdown-export { padding: 32px 20px 64px; }
.markdown-export .vditor-reset { max-width: 860px; margin: 0 auto; }
.markdown-export .vditor-reset img { max-width: 100%; }
.markdown-export .vditor-reset table { border-collapse: collapse; }
.markdown-export .vditor-reset th, .markdown-export .vditor-reset td { border: 1px solid #d0d7de; padding: 6px 10px; }
.markdown-export-dark .vditor-reset th, .markdown-export-dark .vditor-reset td { border-color: #3c3c3c; }
`;

export interface ExportHtmlOptions {
  /** 文档标题 (取自首个一级标题) */
  title: string;
  /** 是否深色主题 */
  isDark: boolean;
  /** html lang 属性 */
  lang?: string;
  /** Vditor 内容主题 CSS 文本 (可选, 缺失时用基础样式兜底) */
  themeCss?: string;
  /** 代码高亮主题 CSS 文本 (可选) */
  codeCss?: string;
}

/** 把 Vditor(md2html) 渲染出的正文包装成可直接双击打开的完整 HTML 文档 */
export function wrapExportHtml(body: string, options: ExportHtmlOptions): string {
  return [
    '<!DOCTYPE html>',
    `<html lang="${escapeHtml(options.lang ?? 'zh-CN')}">`,
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(options.title)}</title>`,
    `<style>${EXPORT_BASE_CSS}${options.themeCss ?? ''}${options.codeCss ?? ''}</style>`,
    '</head>',
    `<body class="markdown-export${options.isDark ? ' markdown-export-dark' : ''}">`,
    `<article class="vditor-reset">${body}</article>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/** 导出文件名 (去掉非法字符, 空标题回退 markdown) */
export function exportFileName(title: string, ext: string): string {
  const safe = title
    .replace(/[\\/:*?"<>|\s]+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 60);
  return `${safe === '' ? 'markdown' : safe}.${ext}`;
}

/** 文档标题: 首个一级标题, 没有则回退第一个标题 / 'Markdown' */
export function docTitle(md: string): string {
  const items = headings(md);
  const h1 = items.find((h) => h.level === 1);
  return (h1 ?? items[0])?.text ?? 'Markdown';
}
