// Mermaid 编辑器 纯逻辑层
// 职责: mermaid 初始化配置、导出文件名。
// SVG 尺寸解析 / 导出前处理 / data URL / 光栅化等通用能力已抽到 src/lib/svg.ts, 此处原样再导出,
// 既保证本工具既有导入路径不变, 也让其它绘图类工具 (如 思维导图) 直接复用同一实现。

import { DEFAULT_FILE_BASE } from './data';
import { fileNameOf as fileNameWithExt } from '../../lib/file';

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

// ---------------- mermaid 配置 ----------------

export interface MermaidOptions {
  /** 主题字号 (px), 默认 14 */
  fontSize?: number;
  /** 图形是否自适应容器宽度 (导出需要固定尺寸, 故默认 false) */
  useMaxWidth?: boolean;
}

/**
 * mermaid 初始化配置
 * - 深色模式下用 dark 主题, 与界面配色保持一致
 * - htmlLabels 关闭 + securityLevel strict: 预览区用 dangerouslySetInnerHTML 注入,
 *   不允许图表里携带 HTML / 脚本, 避免 XSS
 * - useMaxWidth 关闭: 让导出的 SVG 带固定宽高, 便于转成位图
 */
export const mermaidConfig = (isDark: boolean, opts: MermaidOptions = {}) => ({
  startOnLoad: false,
  theme: isDark ? 'dark' : 'default',
  securityLevel: 'strict',
  suppressErrorRendering: true,
  fontFamily: 'ui-sans-serif, -apple-system, "Segoe UI", "Noto Sans SC", sans-serif',
  themeVariables: { fontSize: `${opts.fontSize ?? 14}px` },
  flowchart: { useMaxWidth: opts.useMaxWidth ?? false, htmlLabels: false, curve: 'basis' },
  sequence: { useMaxWidth: opts.useMaxWidth ?? false },
  class: { useMaxWidth: opts.useMaxWidth ?? false },
  state: { useMaxWidth: opts.useMaxWidth ?? false },
  er: { useMaxWidth: opts.useMaxWidth ?? false },
  gantt: { useMaxWidth: opts.useMaxWidth ?? false },
  pie: { useMaxWidth: opts.useMaxWidth ?? false },
  journey: { useMaxWidth: opts.useMaxWidth ?? false },
});

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
