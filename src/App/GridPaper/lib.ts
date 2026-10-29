// 格子纸: 纸张尺寸 / 版面计算 / SVG 网格绘制 / 打印文档构建
import {
  CELL_DEFAULT, CELL_MAX, CELL_MIN, DOT_MIN_R, DOT_R_SCALE, INK_DEFAULT, INK_VALUE, KEY_CELL, KEY_INK, KEY_LINE,
  KEY_MAJOR, KEY_MARGIN, KEY_ORIENTATION, KEY_PAGES, KEY_PAPER, KEY_PATTERN, LINE_DEFAULT, LINE_MAX, LINE_MIN,
  MAJOR_DEFAULT, MAJOR_MAX, MAJOR_MIN, MARGIN_DEFAULT, MARGIN_MAX, MARGIN_MIN, MAJOR_SCALE, PAGES_DEFAULT,
  PAGES_MAX, PAGES_MIN, PAPERS, PAPER_DEFAULT,
  type GridOptions, type InkColor, type Orientation, type PaperId, type Pattern,
} from './data';

// ==================== 归一化 ====================

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '') return Number(v);
  return NaN;
};

/** 数值归一化: 非法值回退 fallback, 合法值夹到 [min, max] 并保留两位小数 */
export const clampNum = (v: unknown, min: number, max: number, fallback: number): number => {
  const x = toNum(v);
  if (!Number.isFinite(x)) return fallback;
  return Math.round(Math.min(max, Math.max(min, x)) * 100) / 100;
};

export const normalizePaper = (v: unknown): PaperId =>
  (PAPERS.some((p) => p.id === v) ? v as PaperId : PAPER_DEFAULT);
export const normalizeOrientation = (v: unknown): Orientation => (v === 'landscape' ? 'landscape' : 'portrait');
export const normalizePattern = (v: unknown): Pattern =>
  (v === 'grid' || v === 'dots' || v === 'lines' ? v : 'grid');
export const normalizeInk = (v: unknown): InkColor =>
  (v === 'gray' || v === 'blue' || v === 'green' || v === 'red' ? v : INK_DEFAULT);
export const normalizeCell = (v: unknown): number => clampNum(v, CELL_MIN, CELL_MAX, CELL_DEFAULT);
export const normalizeMargin = (v: unknown): number => clampNum(v, MARGIN_MIN, MARGIN_MAX, MARGIN_DEFAULT);
export const normalizeLineWidth = (v: unknown): number => clampNum(v, LINE_MIN, LINE_MAX, LINE_DEFAULT);
export const normalizePages = (v: unknown): number =>
  Math.round(clampNum(v, PAGES_MIN, PAGES_MAX, PAGES_DEFAULT));
export const normalizeMajor = (v: unknown): number => Math.round(clampNum(v, MAJOR_MIN, MAJOR_MAX, MAJOR_DEFAULT));

/** 把任意输入(含半成品 state)整理成合法的版面参数 */
export function normalizeOptions(o: Partial<GridOptions> | null | undefined): GridOptions {
  const src = o ?? {};
  return {
    paper: normalizePaper(src.paper),
    orientation: normalizeOrientation(src.orientation),
    pattern: normalizePattern(src.pattern),
    ink: normalizeInk(src.ink),
    cell: normalizeCell(src.cell),
    margin: normalizeMargin(src.margin),
    lineWidth: normalizeLineWidth(src.lineWidth),
    pages: normalizePages(src.pages),
    major: normalizeMajor(src.major),
  };
}

// ==================== 版式计算 ====================

/** 纸张实际尺寸 (mm): 横向时宽高互换 */
export function paperSpec(paper: PaperId, orientation: Orientation): { w: number; h: number } {
  const def = PAPERS.find((p) => p.id === normalizePaper(paper)) ?? PAPERS[1];
  return orientation === 'landscape' ? { w: def.h, h: def.w } : { w: def.w, h: def.h };
}

export interface PageLayout {
  /** 纸张宽 / 高 (mm) */
  w: number;
  h: number;
  /** 实际使用的格子边长 (mm, 已归一化) */
  cell: number;
  /** 每页列数 / 行数 */
  cols: number;
  rows: number;
  /** 网格左上角 (mm) */
  x: number;
  y: number;
  /** 网格总宽 / 高 (mm) */
  gridW: number;
  gridH: number;
  /** 每页格子数 */
  count: number;
}

/**
 * 版面计算: 可用区域 = 纸张 - 两侧边距, 列/行数 = 可用区域能放下几个整格 (向下取整),
 * 网格再整体居中 —— 因此实际边距可能比设定值略大 (不足一格的部分平分到两侧)。
 */
export function layoutOf(o: GridOptions): PageLayout {
  const { w, h } = paperSpec(o.paper, o.orientation);
  const cell = normalizeCell(o.cell);
  // 边距最多吃掉短边的 1/4, 避免可用区域被挤成负数
  const margin = clampNum(o.margin, MARGIN_MIN, Math.min(w, h) / 4, MARGIN_DEFAULT);
  const areaW = Math.max(cell, w - margin * 2);
  const areaH = Math.max(cell, h - margin * 2);
  const cols = Math.max(1, Math.floor(areaW / cell + 1e-6));
  const rows = Math.max(1, Math.floor(areaH / cell + 1e-6));
  const gridW = cols * cell;
  const gridH = rows * cell;
  return {
    w, h, cell, cols, rows,
    x: (w - gridW) / 2,
    y: (h - gridH) / 2,
    gridW, gridH,
    count: cols * rows,
  };
}

// ==================== SVG 绘制 ====================

/** SVG 数字: 保留三位小数并去掉多余的 0 (避免 0.30000000000000004 这类浮点噪声) */
const n = (v: number): string => String(Math.round(v * 1000) / 1000);

export interface GridSegments {
  /** 普通线 (path 命令序列) */
  minor: string[];
  /** 加粗线 (每 N 格一条) */
  major: string[];
}

/**
 * 网格线段: 返回 SVG path 命令列表 (竖线 "M x y V y2"、横线 "M x y H x2")。
 * 横线格型只画横线; 方格画横竖两向; 点阵不走这里 (用 pattern 铺圆点)。
 */
export function gridSegments(layout: PageLayout, pattern: Pattern, major: number): GridSegments {
  const { x, y, cell, cols, rows, gridW, gridH } = layout;
  const step = normalizeMajor(major);
  const minor: string[] = [];
  const majorLines: string[] = [];
  const push = (d: string, isMajor: boolean) => { (isMajor ? majorLines : minor).push(d); };
  const isMajor = (i: number) => step > 0 && i % step === 0;

  if (pattern !== 'lines') {
    for (let i = 0; i <= cols; i++) push(`M${n(x + i * cell)} ${n(y)}V${n(y + gridH)}`, isMajor(i));
  }
  for (let j = 0; j <= rows; j++) push(`M${n(x)} ${n(y + j * cell)}H${n(x + gridW)}`, isMajor(j));

  return { minor, major: majorLines };
}

/** 点阵背景: 用 pattern 铺圆点 (每格 4 个 1/4 圆, 拼成网格交点上的整点) */
function dotsLayer(layout: PageLayout, color: string, sw: number, pageIndex: number): string {
  const { cell, x, y, gridW, gridH } = layout;
  const r = Math.max(DOT_MIN_R, sw * DOT_R_SCALE);
  const id = `gp-dots-${pageIndex}`;
  const dot = (cx: number, cy: number) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${color}"/>`;
  return `<defs><pattern id="${id}" width="${n(cell)}" height="${n(cell)}" patternUnits="userSpaceOnUse"`
    + ` patternTransform="translate(${n(x)} ${n(y)})">`
    + dot(0, 0) + dot(cell, 0) + dot(0, cell) + dot(cell, cell)
    + '</pattern></defs>'
    + `<rect x="${n(x)}" y="${n(y)}" width="${n(gridW)}" height="${n(gridH)}" fill="url(#${id})"/>`;
}

/** 生成一页的 SVG (尺寸用 mm, viewBox 与 mm 1:1, 打印出来就是真实尺寸) */
export function buildPageSvg(o: GridOptions, pageIndex = 1): string {
  const L = layoutOf(o);
  const sw = normalizeLineWidth(o.lineWidth);
  const color = INK_VALUE[normalizeInk(o.ink)];
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${n(L.w)}mm" height="${n(L.h)}mm"`
    + ` viewBox="0 0 ${n(L.w)} ${n(L.h)}"`
    + ` data-paper="${normalizePaper(o.paper)}" data-orientation="${normalizeOrientation(o.orientation)}"`
    + ` data-pattern="${normalizePattern(o.pattern)}" data-cols="${L.cols}" data-rows="${L.rows}"`
    + ` data-page="${pageIndex}">`;

  const body: string[] = [];
  if (normalizePattern(o.pattern) === 'dots') {
    body.push(dotsLayer(L, color, sw, pageIndex));
  } else {
    const seg = gridSegments(L, normalizePattern(o.pattern), o.major);
    if (seg.minor.length > 0) {
      body.push(`<path d="${seg.minor.join('')}" fill="none" stroke="${color}" stroke-width="${n(sw)}" stroke-linecap="square"/>`);
    }
    if (seg.major.length > 0) {
      body.push(`<path d="${seg.major.join('')}" fill="none" stroke="${color}" stroke-width="${n(sw * MAJOR_SCALE)}" stroke-linecap="square"/>`);
    }
  }

  return `${head}${body.join('')}</svg>`;
}

/** 全部页面的 SVG (预览与打印共用) */
export function buildPageSvgs(o: GridOptions): string[] {
  const pages = normalizePages(o.pages);
  const out: string[] = [];
  for (let i = 1; i <= pages; i++) out.push(buildPageSvg(o, i));
  return out;
}

// ==================== 打印文档 ====================

/** 打印文档 CSS: @page 尺寸跟随所选纸张, 一页一个 .pg 容器 */
export function buildDocumentCss(o: GridOptions): string {
  const { w, h } = paperSpec(o.paper, o.orientation);
  return `@page { size: ${n(w)}mm ${n(h)}mm; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.pg {
  position: relative;
  width: ${n(w)}mm;
  height: ${n(h)}mm;
  overflow: hidden;
  background: #fff;
  page-break-after: always;
  break-after: page;
}
.pg:last-child { page-break-after: auto; break-after: auto; }
.pg svg { display: block; width: 100%; height: 100%; }
`;
}

/** 打印文档 body: 每个 .pg 容器装一页 SVG */
export function buildDocumentHtml(o: GridOptions): string {
  return buildPageSvgs(o).map((svg) => `<div class="pg">${svg}</div>`).join('');
}

/** 打印任务名, 如「格子纸 A4 5mm」 */
export function documentName(o: GridOptions, title: string): string {
  return `${title} ${normalizePaper(o.paper)} ${n(normalizeCell(o.cell))}mm`;
}

// ==================== 设置项持久化 ====================

const readSetting = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch (e) { return null; }
};
const writeSetting = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch (e) { /* 隐私模式等场景忽略 */ }
};

/** 读取上次使用的参数 (未存过 / 值非法时回退默认) */
export const getDefaultOptions = (): GridOptions => ({
  paper: normalizePaper(readSetting(KEY_PAPER)),
  orientation: normalizeOrientation(readSetting(KEY_ORIENTATION)),
  pattern: normalizePattern(readSetting(KEY_PATTERN)),
  ink: normalizeInk(readSetting(KEY_INK)),
  cell: normalizeCell(readSetting(KEY_CELL)),
  margin: normalizeMargin(readSetting(KEY_MARGIN)),
  lineWidth: normalizeLineWidth(readSetting(KEY_LINE)),
  pages: normalizePages(readSetting(KEY_PAGES)),
  major: normalizeMajor(readSetting(KEY_MAJOR)),
});

/** 记住上次使用的参数 (下次打开沿用) */
export const setDefaultOptions = (o: GridOptions): void => {
  writeSetting(KEY_PAPER, o.paper);
  writeSetting(KEY_ORIENTATION, o.orientation);
  writeSetting(KEY_PATTERN, o.pattern);
  writeSetting(KEY_INK, o.ink);
  writeSetting(KEY_CELL, String(o.cell));
  writeSetting(KEY_MARGIN, String(o.margin));
  writeSetting(KEY_LINE, String(o.lineWidth));
  writeSetting(KEY_PAGES, String(o.pages));
  writeSetting(KEY_MAJOR, String(o.major));
};
