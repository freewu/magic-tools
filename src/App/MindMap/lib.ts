// 思维导图 纯逻辑层
// 职责: Markdown 统计与大纲解析、markmap 动态加载与视图参数拼装、导出尺寸计算、默认项持久化。
// 注意: 纯函数部分不碰 DOM (便于单测); 涉及 markmap 的入口全部走动态 import, 便于按需分包与单测 mock。

import {
  COLOR_DEFAULT,
  COLOR_SCHEMES,
  COLOR_SCHEME_KEYS,
  DEFAULT_FILE_BASE,
  DEPTH_DEFAULT,
  DEPTH_OPTIONS,
  DURATION,
  EXPORT_PADDING,
  LINE_HEIGHT_RATIO,
  NODE_MIN_HEIGHT,
  PADDING_X,
  SAMPLES,
  SPACING_HORIZONTAL,
  SPACING_VERTICAL,
  type ColorSchemeKey,
} from './data';
import type { SvgBox } from '../../lib/svg';

/** 节点字号区间 (px): 越小越紧凑 */
export const FONT_MIN = 10;
export const FONT_MAX = 32;

const FONT_FAMILY = 'ui-sans-serif, -apple-system, "Segoe UI", "Noto Sans SC", "Microsoft YaHei", sans-serif';

// ---------------- Markdown 文本处理 (纯函数) ----------------

export interface MarkdownStats {
  /** 行数 (空文档为 0) */
  lines: number;
  /** 字符数 */
  chars: number;
  /** 标题行数 (# ~ ######) */
  headings: number;
}

/** Markdown 是否为空 (仅空白算空) */
export const isBlankMarkdown = (md: string): boolean => md.trim().length === 0;

/** 编辑器状态栏统计 */
export const markdownStats = (md: string): MarkdownStats => {
  if (isBlankMarkdown(md)) return { lines: 0, chars: md.length, headings: 0 };
  return {
    lines: md.replace(/\s+$/, '').split('\n').length,
    chars: md.length,
    headings: (md.match(/^\s*#{1,6}\s/gm) ?? []).length,
  };
};

/** 首个一级标题 (无一级标题时取第一个任意级标题; 纯函数, 不做 HTML 反转义) */
export const firstHeading = (md: string): string | null => {
  const lines = md.split('\n');
  const pick = (re: RegExp): string | null => {
    for (const line of lines) {
      const m = re.exec(line);
      if (m) {
        const text = m[1].replace(/\s*<!--.*?-->\s*$/g, '').trim();
        if (text) return text;
      }
    }
    return null;
  };
  return pick(/^\s{0,3}#\s+(.*)$/) ?? pick(/^\s{0,3}#{2,6}\s+(.*)$/);
};

// ---------------- 大纲结构 (纯函数) ----------------

/** 只依赖 children 的最小节点形状 (markmap 的 IPureNode 的子集) */
export interface OutlineNode {
  children?: OutlineNode[];
}

export interface OutlineInfo {
  /** 节点总数 (含根) */
  total: number;
  /** 最大层级: 只有根时为 1 */
  depth: number;
}

/** 统计节点数与层级 (用于状态栏与「展开层级」提示) */
export const outlineInfo = (root: OutlineNode | null | undefined): OutlineInfo => {
  if (!root) return { total: 0, depth: 0 };
  let total = 0;
  let depth = 0;
  const walk = (node: OutlineNode, level: number) => {
    total += 1;
    if (level > depth) depth = level;
    for (const child of node.children ?? []) walk(child, level + 1);
  };
  walk(root, 1);
  return { total, depth };
};

// ---------------- 导出尺寸 ----------------

export interface Rect { x1: number; y1: number; x2: number; y2: number }

/**
 * 把 markmap 的内容包围盒 (state.rect, 内容坐标; 纵向常为负值) 换算成导出用 viewBox
 * 内容为空 (宽高只剩留白) 时返回 null, 调用方据此提示「没有可导出的内容」。
 */
export const exportBoxOf = (rect: Rect | null | undefined, pad = EXPORT_PADDING): SvgBox | null => {
  if (!rect) return null;
  const { x1, y1, x2, y2 } = rect;
  if (![ x1, y1, x2, y2 ].every((n) => Number.isFinite(n))) return null;
  const width = x2 - x1;
  const height = y2 - y1;
  if (width <= 0 || height <= 0) return null;
  const p = Math.max(0, pad);
  return {
    x: Math.round(x1 - p),
    y: Math.round(y1 - p),
    width: Math.max(1, Math.ceil(width + p * 2)),
    height: Math.max(1, Math.ceil(height + p * 2)),
  };
};

/** 导出文件名前缀: 示例 id 优先 (mindmap-project), 否则用首个标题, 最后回退默认名 */
export const exportBaseName = (md: string, sampleId?: string): string => {
  if (sampleId && SAMPLES.some((s) => s.id === sampleId)) return `mindmap-${sampleId}`;
  return firstHeading(md) ?? DEFAULT_FILE_BASE;
};

// ---------------- 指定层级 / 配色 ----------------

/** 非法值统一收敛 (localStorage 里可能残留旧值) */
export const normalizeDepth = (value: number | null | undefined): number =>
  DEPTH_OPTIONS.includes(Number(value)) ? Number(value) : DEPTH_DEFAULT;

export const normalizeColorScheme = (value: string | null | undefined): ColorSchemeKey =>
  COLOR_SCHEME_KEYS.includes(value as ColorSchemeKey) ? (value as ColorSchemeKey) : COLOR_DEFAULT;

export const clampFontSize = (value: number): number =>
  Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(value) || 16));

/** 字号 / 背景深浅 -> markmap 需要的 CSS 文本 (作为 options.style 注入, 落进 SVG 内 <style>, 导出后仍生效) */
export const markmapStyle = (fontSize: number, darkBg: boolean): string => {
  const size = clampFontSize(fontSize);
  const line = Math.round(size * LINE_HEIGHT_RATIO);
  const vars = darkBg
    ? '--markmap-text-color:#e8e8e8;--markmap-circle-open-bg:#3a3a3a;--markmap-code-bg:#1a1b26;--markmap-code-color:#dedede;--markmap-highlight-node-bg:#ffffff22;--markmap-table-border:1px solid #ffffff33;'
    : '--markmap-text-color:#333;--markmap-circle-open-bg:#fff;--markmap-code-bg:#f5f5f5;--markmap-code-color:#555;--markmap-highlight-node-bg:#0000000d;--markmap-table-border:1px solid #00000022;';
  // 代码高亮: markmap 默认不加载 highlight.js 主题, 这里内置一套极小配色, 保证离线也有颜色
  const hljs = darkBg
    ? '.markmap .hljs-comment{color:#7f848e}.markmap .hljs-keyword{color:#c678dd}.markmap .hljs-string{color:#98c379}.markmap .hljs-number{color:#d19a66}.markmap .hljs-title{color:#61afef}.markmap .hljs-built_in{color:#e5c07b}'
    : '.markmap .hljs-comment{color:#8a8a8a}.markmap .hljs-keyword{color:#a626a4}.markmap .hljs-string{color:#50a14f}.markmap .hljs-number{color:#986801}.markmap .hljs-title{color:#4078f2}.markmap .hljs-built_in{color:#c18401}';
  return [
    `.markmap{--markmap-font:${size}px/${line}px ${FONT_FAMILY};${vars}}`,
    '.markmap .markmap-foreign pre{margin:0}',
    hljs,
  ].join('\n');
};

// ---------------- markmap 动态加载 ----------------

export interface MarkmapLibBundle {
  /** markdown-it 转换器 (已剔除 katex 插件: 不加载 katex CSS/JS 时它会渲染成重复文本) */
  transform: (md: string) => { root: OutlineNode | null; frontmatter?: Record<string, unknown> };
  Markmap: {
    create: (svg: SVGSVGElement | null, options: Record<string, unknown>, data: unknown) => MindMapInstance;
  };
  deriveOptions: (json: Record<string, unknown>) => Record<string, unknown>;
}

/** markmap 视图实例 (只用到的部分) */
export interface MindMapInstance {
  state: { rect: Rect };
  svg?: { node: () => SVGSVGElement | null };
  setData: (data: unknown, options?: Record<string, unknown>) => Promise<void>;
  setOptions?: (options: Record<string, unknown>) => void;
  fit: () => Promise<void>;
  destroy: () => void;
}

// markmap + d3 体积不小, 动态加载并缓存 (失败时清空以便重试)
let markmapPromise: Promise<MarkmapLibBundle> | null = null;

export const loadMarkmap = (): Promise<MarkmapLibBundle> => {
  if (!markmapPromise) {
    markmapPromise = Promise.all([ import('markmap-lib'), import('markmap-view') ])
      .then(([ lib, view ]) => {
        const { Transformer, builtInPlugins } = lib;
        const transformer = new Transformer(builtInPlugins.filter((p) => p.name !== 'katex'));
        return {
          transform: (md: string) => {
            const res = transformer.transform(md);
            return {
              root: (res.root ?? null) as OutlineNode | null,
              frontmatter: res.frontmatter as Record<string, unknown> | undefined,
            };
          },
          Markmap: view.Markmap as unknown as MarkmapLibBundle['Markmap'],
          deriveOptions: view.deriveOptions as MarkmapLibBundle['deriveOptions'],
        };
      })
      .catch((err) => {
        markmapPromise = null; // 加载失败允许重试
        throw err;
      });
  }
  return markmapPromise;
};

/** 单测用: 清掉缓存的 bundle */
export const __resetMarkmapCache = (): void => { markmapPromise = null; };

// ---------------- 视图参数拼装 ----------------

export interface ViewInput {
  /** 配色方案 */
  scheme: ColorSchemeKey;
  /** 展开层级 (-1 = 全部展开) */
  depth: number;
  /** 节点字号 (px) */
  fontSize: number;
  /** 是否深色底 (深色底用浅色文字, 否则白底浅字会看不清) */
  darkBg: boolean;
}

/**
 * 组装 Markmap.create / setData 的 options
 * - 用 deriveOptions 把可序列化参数 (配色 / 层级 / 间距) 转成 markmap 内部参数;
 *   文档 frontmatter 里的 markmap 字段先铺底, 界面上的选择优先;
 * - style 注入字号与底色对应的文字变量 (markmap 默认把 CSS 写进 SVG 内的 <style>, 导出后同样生效);
 * - duration = 0: 不做逐帧动画, 保证任何时刻导出都是最终画面;
 * - autoFit = true: 内容变化后自动适应容器。
 */
export const viewOptions = (
  deriveOptions: MarkmapLibBundle['deriveOptions'],
  input: ViewInput,
  frontmatter?: Record<string, unknown>,
): Record<string, unknown> => {
  const scheme = COLOR_SCHEMES[input.scheme] ?? COLOR_SCHEMES[COLOR_DEFAULT];
  const fmOpts = (frontmatter?.markmap ?? {}) as Record<string, unknown>;
  const json: Record<string, unknown> = {
    ...fmOpts,
    duration: DURATION,
    initialExpandLevel: normalizeDepth(input.depth),
    maxWidth: 0,
    nodeMinHeight: NODE_MIN_HEIGHT,
    paddingX: PADDING_X,
    spacingHorizontal: SPACING_HORIZONTAL,
    spacingVertical: SPACING_VERTICAL,
  };
  // 空数组在 deriveOptions 里会变成 scaleOrdinal([]) -> 取不到颜色, 此时删掉该项用 markmap 默认配色
  if (scheme.colors.length) json.color = scheme.colors;
  else delete json.color;
  return {
    ...deriveOptions(json),
    autoFit: true,
    embedGlobalCSS: true,
    style: () => markmapStyle(input.fontSize, input.darkBg),
  };
};

// ---------------- 默认项持久化 (设置中心) ----------------

const COLOR_KEY = 'mindmap:default-color';
const DEPTH_KEY = 'mindmap:default-depth';
const SAMPLE_KEY = 'mindmap:default-sample';

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* localStorage 不可用时忽略 */
  }
};

export const getDefaultColorScheme = (): ColorSchemeKey => normalizeColorScheme(read(COLOR_KEY));

export const setDefaultColorScheme = (v: ColorSchemeKey): void => write(COLOR_KEY, normalizeColorScheme(v));

export const getDefaultDepth = (): number => normalizeDepth(Number(read(DEPTH_KEY)));

export const setDefaultDepth = (v: number): void => write(DEPTH_KEY, String(normalizeDepth(v)));

/** 默认示例 id; '' = 打开时载入空白 */
export const getDefaultSample = (): string => {
  const id = read(SAMPLE_KEY);
  if (id === null) return SAMPLES[0].id;
  if (id === '') return '';
  return SAMPLES.some((s) => s.id === id) ? id : SAMPLES[0].id;
};

export const setDefaultSample = (id: string): void => write(SAMPLE_KEY, SAMPLES.some((s) => s.id === id) ? id : '');
