import '@testing-library/jest-dom';
import type { BeadBrand } from './palette';
import type { PatternStats } from './lib';
import {
  CODE_MIN_CELL, LEGEND_COL, MAX_CELL, MIN_CELL, PREVIEW_MAX,
  autoCell, cellAt, clampCell, computeLayout, drawLegend, drawPattern, legendHeight,
  type DrawLayout, type PatternCtx,
} from './draw';

interface Op {
  op: 'fillRect' | 'stroke' | 'fillText';
  args: (string | number)[];
  style: string;
  font: string;
  align: string;
}

/** 记录调用的 canvas 2D 桩 */
const makeCtx = (): { ctx: PatternCtx; ops: Op[] } => {
  const ops: Op[] = [];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    fillRect(this: any, ...args: number[]) {
      ops.push({ op: 'fillRect', args, style: String(this.fillStyle), font: this.font, align: this.textAlign });
    },
    beginPath() { /* noop */ },
    moveTo() { /* noop */ },
    lineTo() { /* noop */ },
    stroke(this: any) {
      ops.push({ op: 'stroke', args: [], style: String(this.strokeStyle), font: this.font, align: this.textAlign });
    },
    fillText(this: any, text: string, x: number, y: number) {
      ops.push({ op: 'fillText', args: [ text, x, y ], style: String(this.fillStyle), font: this.font, align: this.textAlign });
    },
    measureText: (text: string) => ({ width: text.length * 6 }),
  };
  return { ctx: ctx as unknown as PatternCtx, ops };
};

const brandOf = (colors: Array<[string, string]>): BeadBrand => ({
  key: 'draw-test', name: 'T', mm: 5, size: 'big',
  colors: colors.map(([ code, hex ]) => ({ code, hex, name: code })),
});

const brand = brandOf([ [ 'T1', '#000000' ], [ 'T2', '#FFFFFF' ] ]);

const statsOf = (used: Array<{ index: number; count: number }>): PatternStats => ({
  w: 58,
  h: 58,
  mm: 5,
  total: used.reduce((n, u) => n + u.count, 0),
  empties: 0,
  colors: used.length,
  used: used.map((u) => {
    const color = brand.colors[u.index];
    return { index: u.index, code: color.code, name: color.name, hex: color.hex, count: u.count, ratio: 0.5 };
  }),
  sizeCm: { w: 29, h: 29 },
  boards: { x: 2, y: 2, total: 4 },
});

describe('格边长与布局', () => {
  test('clampCell / autoCell', () => {
    expect(clampCell(1)).toBe(2);
    expect(clampCell(100)).toBe(64);
    expect(clampCell(12.6)).toBe(13);
    expect(autoCell(58, 58)).toBe(Math.floor(PREVIEW_MAX / 58));
    expect(autoCell(200, 200)).toBe(MIN_CELL);
    expect(autoCell(4, 4)).toBe(MAX_CELL);
    expect(autoCell(0, 0)).toBe(MAX_CELL);
    // 以最长边为准
    expect(autoCell(10, 60)).toBe(Math.floor(PREVIEW_MAX / 60));
  });

  test('computeLayout: 默认参数 (58x58)', () => {
    const layout = computeLayout(58, 58);
    expect(layout).toMatchObject({
      cell: 12, pad: 8, padTop: 13, padLeft: 20, axisStep: 5, axisFont: 7, codeFont: 6,
      showGrid: true, showCode: true, showAxis: true,
    });
    expect(layout.width).toBe(16 + 20 + 58 * 12);
    expect(layout.height).toBe(16 + 13 + 58 * 12);
  });

  test('computeLayout: 格子够大时每格都标编号, 色号仍显示', () => {
    const layout = computeLayout(10, 100, { cell: 20 });
    expect(layout.cell).toBe(20);
    expect(layout.axisStep).toBe(1);
    expect(layout.showCode).toBe(true);
    expect(layout.codeFont).toBe(8);
    expect(layout.axisFont).toBe(10);
    // 行号最多三位数, 左侧留出足够宽度
    expect(layout.padLeft).toBe(36);
  });

  test('computeLayout: 小格子不画色号; 开关可关掉编号/网格', () => {
    const small = computeLayout(20, 20, { cell: CODE_MIN_CELL - 1 });
    expect(small.showCode).toBe(false);
    const off = computeLayout(20, 20, { showAxis: false, showGrid: false, showCode: false });
    expect(off.padTop).toBe(0);
    expect(off.padLeft).toBe(0);
    expect(off.showGrid).toBe(false);
    expect(off.showCode).toBe(false);
  });

  test('computeLayout: 编号间隔可覆盖, 非法值回退默认', () => {
    expect(computeLayout(10, 10, { cell: 20, axisStep: 10 }).axisStep).toBe(10);
    expect(computeLayout(10, 10, { cell: 20, axisStep: 0 }).axisStep).toBe(1);
    expect(computeLayout(10, 10, { cell: 10, axisStep: 0 }).axisStep).toBe(5);
  });
});

describe('drawPattern', () => {
  const cells = new Int32Array([ 0, 1, -1, 0 ]);

  test('先铺白底, 再画豆格 (留空跳过)', () => {
    const { ctx, ops } = makeCtx();
    const layout = computeLayout(2, 2, { cell: 20, showAxis: false });
    drawPattern(ctx, cells, 2, 2, brand, layout);
    const bg = ops[0];
    expect(bg).toMatchObject({ op: 'fillRect', args: [ 0, 0, layout.width, layout.height ], style: '#ffffff' });
    const beads = ops.filter((o) => o.op === 'fillRect' && o.style !== '#ffffff');
    expect(beads.map((o) => o.style)).toEqual([ '#000000', '#FFFFFF', '#000000' ]);
    expect(beads[0].args).toEqual([ 8, 8, 20, 20 ]);
    expect(beads[1].args).toEqual([ 28, 8, 20, 20 ]);
    expect(beads[2].args).toEqual([ 28, 28, 20, 20 ]);
  });

  test('网格线: 每边 n+1 根, 每 5 根加粗', () => {
    const { ctx, ops } = makeCtx();
    const w = 5;
    const layout = computeLayout(w, w, { cell: 10, showCode: false, showAxis: false });
    drawPattern(ctx, new Int32Array(w * w).fill(0), w, w, brand, layout);
    const strokes = ops.filter((o) => o.op === 'stroke');
    expect(strokes.length).toBe((w + 1) * 2);
    expect(strokes.filter((o) => o.style === 'rgba(0, 0, 0, 0.5)').length).toBe(4);
    expect(strokes.filter((o) => o.style === 'rgba(0, 0, 0, 0.14)').length).toBe((w + 1) * 2 - 4);
    // 关掉网格 -> 一根线都不画
    const off = makeCtx();
    drawPattern(off.ctx, new Int32Array(w * w).fill(0), w, w, brand, computeLayout(w, w, { cell: 10, showGrid: false }));
    expect(off.ops.filter((o) => o.op === 'stroke').length).toBe(0);
  });

  test('格内色号: 深色底白字, 浅色底黑字, 居中', () => {
    const { ctx, ops } = makeCtx();
    const layout = computeLayout(2, 1, { cell: 20, showGrid: false, showAxis: false });
    drawPattern(ctx, new Int32Array([ 0, 1 ]), 2, 1, brand, layout);
    const texts = ops.filter((o) => o.op === 'fillText');
    expect(texts.map((o) => o.args[0])).toEqual([ 'T1', 'T2' ]);
    expect(texts.map((o) => o.style)).toEqual([ '#FFFFFF', '#000000' ]);
    expect(texts[0].args.slice(1)).toEqual([ 18, 18.5 ]);
    expect(texts[0].align).toBe('center');
    expect(texts[0].font).toContain('monospace');
  });

  test('行列编号: 按 axisStep 标, 列在上方居中, 行在左侧右对齐', () => {
    const { ctx, ops } = makeCtx();
    const layout = computeLayout(3, 2, { cell: 20, showGrid: false, showCode: false });
    drawPattern(ctx, new Int32Array(6).fill(0), 3, 2, brand, layout);
    const texts = ops.filter((o) => o.op === 'fillText');
    expect(texts.map((o) => o.args[0])).toEqual([ '1', '2', '3', '1', '2' ]);
    expect(texts.slice(0, 3).every((o) => o.align === 'center')).toBe(true);
    expect(texts.slice(3).every((o) => o.align === 'right')).toBe(true);
    // 行号画在编号区右侧
    expect(texts[3].args[1]).toBe(layout.pad + layout.padLeft - 6);
  });

  test('留空 (-1) 与越界色号都不画', () => {
    const { ctx, ops } = makeCtx();
    const layout = computeLayout(2, 1, { cell: 20, showGrid: false, showAxis: false, showCode: false });
    drawPattern(ctx, new Int32Array([ -1, 9 ]), 2, 1, brand, layout);
    expect(ops.filter((o) => o.op === 'fillRect' && o.style !== '#ffffff').length).toBe(0);
  });
});

describe('cellAt (点击取格)', () => {
  const layout: DrawLayout = computeLayout(10, 10, { cell: 20 });

  test('图案区内按整除取格', () => {
    const ox = layout.pad + layout.padLeft;
    const oy = layout.pad + layout.padTop;
    expect(cellAt(layout, 10, 10, ox, oy)).toEqual({ x: 0, y: 0 });
    expect(cellAt(layout, 10, 10, ox + 19.9, oy + 19.9)).toEqual({ x: 0, y: 0 });
    expect(cellAt(layout, 10, 10, ox + 20, oy + 20)).toEqual({ x: 1, y: 1 });
    expect(cellAt(layout, 10, 10, ox + 9 * 20 + 5, oy + 9 * 20 + 5)).toEqual({ x: 9, y: 9 });
  });

  test('编号区 / 留白 / 越界返回 null', () => {
    expect(cellAt(layout, 10, 10, 0, 0)).toBeNull();
    expect(cellAt(layout, 10, 10, layout.pad + layout.padLeft - 1, 5)).toBeNull();
    expect(cellAt(layout, 10, 10, layout.pad + layout.padLeft, layout.pad + layout.padTop - 1)).toBeNull();
    expect(cellAt(layout, 10, 10, layout.width, layout.height)).toBeNull();
    expect(cellAt(layout, 10, 10, -5, -5)).toBeNull();
  });
});

describe('用量图例', () => {
  test('legendHeight: 按单列宽度分列', () => {
    expect(LEGEND_COL).toBe(168);
    expect(legendHeight(0, 732, 1)).toBe(36);
    expect(legendHeight(10, 732, 2)).toBe(10 + 40 + 3 * 20 + 6);
    expect(legendHeight(1, 100, 0)).toBe(10 + 20 + 6);
    expect(legendHeight(4, 168, 1)).toBe(10 + 20 + 4 * 20 + 6);
  });

  test('drawLegend: 标题行 + 色块 + 色号数量, 返回高度', () => {
    const { ctx, ops } = makeCtx();
    const layout = computeLayout(2, 2, { cell: 20, showAxis: false });
    const stats = statsOf([ { index: 0, count: 3 }, { index: 1, count: 1 } ]);
    const startY = layout.height;
    const lines = [ 'Bead · 58 x 58', '共 4 颗' ];
    const height = drawLegend(ctx, stats, lines, layout, startY);
    expect(height).toBe(legendHeight(2, layout.width, 2));
    // 先铺白底再画内容
    expect(ops[0]).toMatchObject({ op: 'fillRect', args: [ 0, startY, layout.width, height ], style: '#ffffff' });
    const texts = ops.filter((o) => o.op === 'fillText');
    expect(texts.slice(0, 2).map((o) => o.args[0])).toEqual(lines);
    expect(texts[2].args[0]).toBe('T1 x3');
    expect(texts[3].args[0]).toBe('T2 x1');
    const swatches = ops.filter((o) => o.op === 'fillRect' && o.style === '#FFFFFF');
    expect(swatches.length).toBe(1);
    expect(ops.filter((o) => o.op === 'stroke').length).toBe(2);
  });

  test('drawLegend: 没有用色时不画色块', () => {
    const { ctx, ops } = makeCtx();
    const layout = computeLayout(2, 2, { cell: 20, showAxis: false });
    const stats = statsOf([]);
    expect(drawLegend(ctx, stats, [ 'a' ], layout, 0)).toBe(legendHeight(0, layout.width, 1));
    expect(ops.filter((o) => o.op === 'fillText').length).toBe(1);
    expect(ops.filter((o) => o.op === 'stroke').length).toBe(0);
  });
});
