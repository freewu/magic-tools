// 拼豆图纸: 图纸绘制 (豆格 + 网格线 + 格内色号 + 行列编号 + 用量图例)
//
// 只依赖 canvas 2D 的最小接口 (PatternCtx), 便于单测传桩对象;
// 文案 (标题行) 由调用方传入, 本文件不做 i18n, 便于三语言共用。
import { calcReadableTextColor } from '../Color/lib';
import type { BeadBrand } from './palette';
import type { PatternStats } from './lib';

/** 绘图上下文 (canvas 2D 的最小子集) */
export interface PatternCtx {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fillText(text: string, x: number, y: number): void;
  measureText(text: string): { width: number };
}

/** 预览画布的目标像素宽度 (超出部分用 CSS 缩放) */
export const PREVIEW_MAX = 720;
export const MIN_CELL = 10;
export const MAX_CELL = 26;
/** 图例单列宽度 (px) */
export const LEGEND_COL = 168;
/** 格内色号小于该尺寸就不画 (看不清反而糊) */
export const CODE_MIN_CELL = 12;

export const clampCell = (v: number): number => Math.max(2, Math.min(64, Math.round(v)));

/** 自适应格边长: 让整张图纸宽度接近 target */
export const autoCell = (w: number, h: number, target = PREVIEW_MAX): number =>
  clampCell(Math.min(MAX_CELL, Math.max(MIN_CELL, Math.floor(target / Math.max(1, Math.max(w, h))))));

export interface DrawOpts {
  /** 每格边长 px (默认自适应) */
  cell?: number;
  /** 网格线 */
  showGrid?: boolean;
  /** 格内色号 */
  showCode?: boolean;
  /** 行列编号 */
  showAxis?: boolean;
  /** 编号间隔 (默认: 格够大时每格都标, 否则每 5 格) */
  axisStep?: number;
}

export interface DrawLayout {
  cell: number;
  /** 四周留白 */
  pad: number;
  /** 顶部列编号区高度 */
  padTop: number;
  /** 左侧行编号区宽度 */
  padLeft: number;
  /** 画布宽 (含编号区与留白) */
  width: number;
  /** 图案区总高 (含编号区与留白, 不含图例) */
  height: number;
  codeFont: number;
  axisFont: number;
  axisStep: number;
  showGrid: boolean;
  showCode: boolean;
  showAxis: boolean;
}

export const computeLayout = (w: number, h: number, opts: DrawOpts = {}): DrawLayout => {
  const cell = clampCell(opts.cell ?? autoCell(w, h));
  const showAxis = opts.showAxis !== false;
  const showCode = opts.showCode !== false && cell >= CODE_MIN_CELL;
  const codeFont = Math.max(6, Math.round(cell * 0.42));
  const axisFont = Math.max(7, Math.min(12, Math.round(cell * 0.5)));
  const pad = 8;
  const padTop = showAxis ? axisFont + 6 : 0;
  const padLeft = showAxis ? Math.max(axisFont * String(h).length, axisFont + 4) + 6 : 0;
  const axisStep = opts.axisStep && opts.axisStep > 0 ? Math.floor(opts.axisStep) : (cell >= 18 ? 1 : 5);
  return {
    cell, pad, padTop, padLeft,
    width: pad * 2 + padLeft + w * cell,
    height: pad * 2 + padTop + h * cell,
    codeFont, axisFont, axisStep, showGrid: opts.showGrid !== false, showCode, showAxis,
  };
};

/** 网格线颜色: 每 5 根加粗, 方便数豆 */
const gridColor = (i: number): string => (i % 5 === 0 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.14)');

/**
 * 画图案区 (豆格 / 网格 / 色号 / 行列编号)
 * cells 中 -1 表示留空, 其余为 brand.colors 下标
 */
export const drawPattern = (
  ctx: PatternCtx,
  cells: Int32Array,
  w: number,
  h: number,
  brand: BeadBrand,
  layout: DrawLayout,
): void => {
  const { cell, pad, padTop, padLeft } = layout;
  const ox = pad + padLeft;
  const oy = pad + padTop;

  // 底色 (留空格子保持白底)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, layout.width, layout.height);

  // 豆格
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = cells[y * w + x];
      if (v < 0) continue;
      const color = brand.colors[v];
      if (!color) continue;
      ctx.fillStyle = color.hex;
      ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }

  // 网格线
  if (layout.showGrid) {
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x++) {
      ctx.strokeStyle = gridColor(x);
      ctx.beginPath();
      ctx.moveTo(ox + x * cell + 0.5, oy);
      ctx.lineTo(ox + x * cell + 0.5, oy + h * cell);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y++) {
      ctx.strokeStyle = gridColor(y);
      ctx.beginPath();
      ctx.moveTo(ox, oy + y * cell + 0.5);
      ctx.lineTo(ox + w * cell, oy + y * cell + 0.5);
      ctx.stroke();
    }
  }

  // 格内色号 (深色底用白字, 浅色底用黑字)
  if (layout.showCode) {
    ctx.font = `600 ${layout.codeFont}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = cells[y * w + x];
        if (v < 0) continue;
        const color = brand.colors[v];
        if (!color) continue;
        ctx.fillStyle = calcReadableTextColor(color.hex);
        ctx.fillText(color.code, ox + x * cell + cell / 2, oy + y * cell + cell / 2 + 0.5);
      }
    }
  }

  // 行列编号
  if (layout.showAxis) {
    ctx.font = `${layout.axisFont}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let x = 0; x < w; x++) {
      if ((x + 1) % layout.axisStep !== 0) continue;
      ctx.fillText(String(x + 1), ox + x * cell + cell / 2, pad + padTop / 2);
    }
    ctx.textAlign = 'right';
    for (let y = 0; y < h; y++) {
      if ((y + 1) % layout.axisStep !== 0) continue;
      ctx.fillText(String(y + 1), pad + padLeft - 6, oy + y * cell + cell / 2);
    }
  }
};

/** 画布坐标 -> 格子坐标 (编辑用), 不在图案区内返回 null */
export const cellAt = (
  layout: DrawLayout, w: number, h: number, px: number, py: number,
): { x: number; y: number } | null => {
  const x = Math.floor((px - layout.pad - layout.padLeft) / layout.cell);
  const y = Math.floor((py - layout.pad - layout.padTop) / layout.cell);
  if (x < 0 || y < 0 || x >= w || y >= h) return null;
  return { x, y };
};

/** 图例区高度 (标题行 + 用量色块) */
export const legendHeight = (count: number, width: number, lineCount = 1): number => {
  const cols = Math.max(1, Math.floor(width / LEGEND_COL));
  const rows = count > 0 ? Math.ceil(count / cols) : 0;
  return 10 + lineCount * 20 + rows * 20 + 6;
};

/**
 * 画用量图例 (标题行 + 每个色号一个色块 + 数量)
 * lines 由调用方本地化后传入, 例如 ['MARD 221 · 58 x 58 豆', '成品 15.1 x 15.1 cm · 共 1280 颗']
 */
export const drawLegend = (
  ctx: PatternCtx,
  stats: PatternStats,
  lines: string[],
  layout: DrawLayout,
  startY: number,
): number => {
  const x0 = layout.pad;
  const width = layout.width - layout.pad * 2;
  const cols = Math.max(1, Math.floor(width / LEGEND_COL));
  const height = legendHeight(stats.used.length, layout.width, lines.length);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, startY, layout.width, height);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.font = '600 13px system-ui, -apple-system, "Segoe UI", sans-serif';
  let y = startY + 8;
  for (const line of lines) {
    ctx.fillText(line, x0, y + 8);
    y += 20;
  }
  ctx.font = '11px ui-monospace, Menlo, Consolas, monospace';
  stats.used.forEach((u, i) => {
    const col = i % cols;
    const rowIdx = Math.floor(i / cols);
    const cx = x0 + col * LEGEND_COL;
    const cy = y + rowIdx * 20;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx, cy, 12, 12);
    ctx.fillStyle = u.hex;
    ctx.fillRect(cx + 0.5, cy + 0.5, 11, 11);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 0.5, cy + 0.5);
    ctx.lineTo(cx + 11.5, cy + 0.5);
    ctx.lineTo(cx + 11.5, cy + 11.5);
    ctx.lineTo(cx + 0.5, cy + 11.5);
    ctx.lineTo(cx + 0.5, cy + 0.5);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillText(`${u.code} x${u.count}`, cx + 18, cy + 6);
  });
  return height;
};
