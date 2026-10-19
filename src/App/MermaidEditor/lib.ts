// Mermaid 编辑器 纯逻辑层
// 职责: 渲染引擎 (pele) 的渲染选项 / 配色变量、渲染错误整理、导出文件名。
// SVG 尺寸解析 / 导出前处理 / data URL / 光栅化等通用能力已抽到 src/lib/svg.ts, 此处原样再导出,
// 既保证本工具既有导入路径不变, 也让其它绘图类工具 (如 思维导图) 直接复用同一实现。

import { DEFAULT_FILE_BASE } from './data';
import { fileNameOf as fileNameWithExt } from '../../lib/file';
// 仅类型导入 (编译后不产生 import 语句): pele 体积较大且由 index.tsx 动态加载, 此处不能静态引用运行时
import type { PeleErrorCode, RenderOptions } from 'pele';

export type MermaidFormat = 'svg' | 'png' | 'webp';

export const MIME_OF: Record<MermaidFormat, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  webp: 'image/webp',
};

export const EXT_OF: Record<MermaidFormat, string> = {
  svg: 'svg',
  png: 'png',
  webp: 'webp',
};

/** 导出文件名: 前缀 + 扩展名 (前缀含非法字符时兜底) */
export const fileNameOf = (base: string, format: MermaidFormat): string =>
  fileNameWithExt(base, EXT_OF[format], DEFAULT_FILE_BASE);

/** 保存为 .md 时的文件名 (与其它导出共用前缀, 非法字符同样清洗) */
export const markdownFileNameOf = (base: string): string => fileNameWithExt(base, 'md', DEFAULT_FILE_BASE);

/** 打开本地文件时允许的类型 (.mmd 源码 / .md 文档 / 纯文本) */
export const CODE_ACCEPT = '.mmd,.mermaid,.md,.markdown,.txt,text/plain';

/** ```mermaid 代码块在文件中的位置 (start/end 为代码本身, 不含围栏) */
export interface FencedBlock {
  code: string;
  start: number;
  end: number;
}

/** 在文本里定位 ```mermaid 代码块 (围栏反引号数量与语言标记都兼容, 找不到返回 null) */
export const findFencedCode = (raw: string, lang = 'mermaid'): FencedBlock | null => {
  const re = new RegExp(`^([\`]{3,})[ \\t]*${lang}[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n?^\\1[ \\t]*$`, 'im');
  const m = re.exec(raw);
  if (!m) return null;
  const start = raw.indexOf(m[2], m.index);
  return { code: m[2], start, end: start + m[2].length };
};

/** 打开文件: 有 ```mermaid 代码块 (.md 文档) 就取块内代码, 否则整体当作 Mermaid 代码 (.mmd / .txt) */
export const extractCode = (raw: string, lang = 'mermaid'): string => findFencedCode(raw, lang)?.code ?? raw;

/**
 * 生成 .md 文件内容:
 * - 打开的就是带 ```mermaid 的 Markdown → 只把代码块内部的代码换成最新的, 周边文字原样保留
 * - 否则 (例如 .mmd 源码) → 整体包一层 ```mermaid, 便于 GitHub / 编辑器直接渲染
 */
export const toMarkdown = (code: string, source: string, lang = 'mermaid'): string => {
  const block = source ? findFencedCode(source, lang) : null;
  if (!block) return `\`\`\`${lang}\n${code.replace(/\s*$/, '')}\n\`\`\`\n`;
  return source.slice(0, block.start) + code + source.slice(block.end);
};

/** 源码是否为空 (仅空白 / 注释也算空) */
export const isBlankCode = (code: string): boolean => code.trim().length === 0;

// ---------------- 渲染引擎 (pele) 选项 ----------------

/**
 * 标签字体: pele 靠测量文本宽度决定节点尺寸, 必须与实际显示字体一致,
 * 否则中文标签可能被裁切 (与页面 body 字体保持同一条字体栈)
 */
export const PELE_FONT_FAMILY = 'ui-sans-serif, -apple-system, "Segoe UI", "Noto Sans SC", sans-serif';

/** 默认字号 (px) */
export const PELE_FONT_SIZE = 14;

/**
 * 深色配色 (pele 的 CSS 变量; 浅色即引擎内置默认值, 无需覆盖)
 * 对应官网暗色推荐值, 底色与「背景」选深色时的 #1f1f1f 保持一致
 */
export const PELE_DARK_VARS: Record<string, string> = {
  bg: '#1f1f1f',
  fg: '#e6e6e6',
  muted: '#a3a3a3',
  line: '#d4d4d4',
  surface: '#2b2b2b',
  'surface-alt': '#3a3a3a',
  border: '#5f5f5f',
  accent: '#7aa2f7',
  critical: '#e45756',
};

export interface PeleOptions {
  /** 字号 (px), 默认 14 */
  fontSize?: number;
  /** 无障碍 title / desc 的 id 前缀 (同页多图需要唯一) */
  idPrefix?: string;
}

/**
 * pele 渲染选项
 * - fontFamily / fontSize: pele 按字体排版, 必须与实际显示字体一致
 * - responsive 关闭: 让根节点只带固定宽高 (开着会写内联 max-width:100%,
 *   反而盖住预览的缩放样式, 且导出需要固定尺寸)
 * - autoDirection 关闭: 严格按源码方向 (LR 就横向), 不因容器窄自动改竖排
 * - links / images 关闭: 预览用 innerHTML 注入, 关掉可避免误触链接跳走整页,
 *   也避免图表里的外链图片发起网络请求 (本工具承诺纯本地渲染)
 * - 图表里的 HTML 标签 / 脚本: pele 本身只输出 SVG 图形与文本, 不会执行
 */
export const peleOptions = (opts: PeleOptions = {}): RenderOptions => ({
  fontFamily: PELE_FONT_FAMILY,
  fontSize: opts.fontSize ?? PELE_FONT_SIZE,
  idPrefix: opts.idPrefix,
  responsive: false,
  autoDirection: false,
  links: false,
  images: false,
});

/**
 * 把配色写进 SVG 根节点的内联样式
 * pele 的 SVG 只用 var(--pele-*, 内置浅色) 取色, 变量本身并不写入文件;
 * 深色配色必须落在 SVG 自己身上, 导出的文件才能与预览一致。
 * 浅色即引擎内置默认值, 原样返回。
 */
export const applyPeleTheme = (svg: string, isDark: boolean): string => {
  if (!isDark) return svg;
  const vars = Object.entries(PELE_DARK_VARS)
    .map(([ key, value ]) => `--pele-${key}:${value};`)
    .join('');
  // 插到根节点 style 属性的最前面 (自定义属性先声明后引用, 顺序不影响取值)
  const hit = /^<svg\b[^>]*\bstyle="/.exec(svg);
  if (!hit) return svg; // 引擎输出结构变化时原样返回: 预览退回内置浅色, 不影响渲染
  const at = hit.index + hit[0].length;
  return `${svg.slice(0, at)}${vars}${svg.slice(at)}`;
};

// ---------------- 渲染错误 ----------------

/** 渲染错误的结构化信息 (code 为 'engine' 表示渲染引擎自身没加载起来) */
export interface RenderErrorInfo {
  code: PeleErrorCode | 'engine' | null;
  line: number;
  column: number;
  message: string;
}

/** 按 pele 的错误类型给标题 (未识别 / 非 PeleError 时由调用方回退到「渲染失败」) */
export const RENDER_ERROR_TITLE: Record<string, string> = {
  syntax: '语法错误',
  semantic: '图表内容有误',
  limit: '图形过大或嵌套过深',
  'unsupported-diagram': '无法识别图形类型',
};

/** 渲染引擎 chunk 动态加载失败 (断网 / 版本更新后旧页面) */
export const ENGINE_ERROR: RenderErrorInfo = { code: 'engine', line: 0, column: 0, message: '' };

/**
 * PeleError → 可展示信息
 * pele 的 message 自带 "Parse error on line 3" 与 caret 指示行, 直接展示即可;
 * 非 PeleError 的异常也按普通错误处理, 保证任何失败都有东西可显示
 */
export const parseRenderError = (err: unknown): RenderErrorInfo => {
  if (!err || typeof err !== 'object') return { code: null, line: 0, column: 0, message: String(err) };
  const raw = err as { code?: unknown; line?: unknown; column?: unknown; message?: unknown };
  const code = typeof raw.code === 'string' && raw.code in RENDER_ERROR_TITLE ? (raw.code as PeleErrorCode) : null;
  const line = typeof raw.line === 'number' && raw.line > 0 ? raw.line : 0;
  const column = line > 0 && typeof raw.column === 'number' && raw.column > 0 ? raw.column : 0;
  return { code, line, column, message: typeof raw.message === 'string' ? raw.message : String(err) };
};

// ---------------- 通用 SVG 能力 (实现见 src/lib/svg.ts) ----------------

export {
  dataUrlToBytes,
  exportSvgFromCanvas,
  parseSvgSize,
  prepareSvgForExport,
  rasterizeSvg,
  scaleSize,
  supportsWebp,
  svgToDataUrl,
  utf8ToBase64,
  type RasterOptions,
  type SvgBox,
  type SvgSize,
} from '../../lib/svg';
