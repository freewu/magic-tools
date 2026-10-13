import '@testing-library/jest-dom';
import { BEAD_BRANDS, getBrand } from './palette';
import {
  beadsOf, hexToRgb, rgbToLab, deltaE76, deltaE2000,
  toCellGrid, adjustRgb, backgroundMask, quantizeToBeads, patternStats,
  beadSizeCm, pegboards, codeRows, patternCsv, usageCsv, usageText,
  setCell, replaceColor, fillRegion, mirrorCells, heightForWidth,
  type CellGrid,
} from './lib';
import type { BeadBrand } from './palette';

/** 色块矩阵 -> 豆格网格 ('' = 透明) */
const gridOf = (rows: string[][]): CellGrid => {
  const h = rows.length;
  const w = rows[0].length;
  const data = new Uint8ClampedArray(w * h * 4);
  rows.forEach((row, y) => row.forEach((c, x) => {
    const i = (y * w + x) * 4;
    if (!c) { data[i + 3] = 0; return; }
    const { r, g, b } = hexToRgb(c);
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
  }));
  return toCellGrid(data, w, h);
};

/** 测试用品牌色卡 (key 必须唯一: beadsOf 按 key 缓存) */
const brandOf = (colors: string[]): BeadBrand => ({
  key: `test-${colors.join('-')}`,
  name: 'T', mm: 5, size: 'big',
  colors: colors.map((hex, i) => ({ code: `T${i + 1}`, name: `c${i + 1}`, hex })),
});

const maskAll = (w: number, h: number, keep = true): Uint8Array => new Uint8Array(w * h).fill(keep ? 1 : 0);

describe('颜色空间', () => {
  test('rgbToLab: 黑白与红的标准值', () => {
    expect(rgbToLab(0, 0, 0).L).toBeCloseTo(0, 6);
    const white = rgbToLab(255, 255, 255);
    expect(white.L).toBeCloseTo(100, 4);
    expect(Math.hypot(white.a, white.b)).toBeLessThan(1e-3);
    const red = rgbToLab(255, 0, 0);
    expect(red.L).toBeCloseTo(53.2408, 3);
    expect(red.a).toBeCloseTo(80.0925, 3);
    expect(red.b).toBeCloseTo(67.2032, 3);
  });

  test('hexToRgb: 带/不带 # 均可解析, 非法输入回退黑色', () => {
    expect(hexToRgb('#FF8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('  #000000 ')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('red')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#FFF')).toEqual({ r: 0, g: 0, b: 0 });
  });

  test('deltaE2000: 与 Sharma 标准测试数据一致', () => {
    const cases: Array<[number, number, number, number, number, number, number]> = [
      [ 50, 2.6772, -79.7751, 50, 0, -82.7485, 2.0425 ],
      [ 50, 3.1571, -77.2803, 50, 0, -82.7485, 2.8615 ],
      [ 50, 2.8361, -74.0200, 50, 0, -82.7485, 3.4412 ],
      [ 50, -1.3802, -84.2814, 50, 0, -82.7485, 1.0000 ],
      [ 50, 0, 0, 50, -1, 2, 2.3669 ],
      [ 60.2574, -34.0099, 36.2677, 60.4626, -34.1751, 39.4387, 1.2644 ],
      [ 63.0109, -31.0961, -5.8663, 62.8187, -29.7946, -4.0864, 1.2630 ],
      [ 61.2901, 3.7196, -5.3901, 61.4292, 2.2480, -4.9620, 1.8731 ],
      [ 35.0831, -44.1164, 3.7933, 35.0232, -40.0716, 1.5901, 1.8645 ],
      [ 22.7233, 20.0904, -46.6940, 23.0331, 14.9730, -42.5619, 2.0373 ],
      [ 36.4612, 47.8580, 18.3852, 36.2715, 50.5065, 21.2231, 1.4146 ],
      [ 90.8027, -2.0831, 1.4410, 91.1528, -1.6435, 0.0447, 1.4441 ],
      [ 90.9257, -0.5406, -0.9208, 88.6381, -0.8985, -0.7239, 1.5381 ],
      [ 6.7747, -0.2908, -2.4247, 5.8714, -0.0985, -2.2286, 0.6377 ],
      [ 2.0776, 0.0795, -1.1350, 0.9033, -0.0636, -0.5514, 0.9082 ],
    ];
    for (const [ l1, a1, b1, l2, a2, b2, expected ] of cases) {
      expect(deltaE2000({ L: l1, a: a1, b: b1 }, { L: l2, a: a2, b: b2 })).toBeCloseTo(expected, 3);
    }
  });

  test('deltaE2000: 对称且同色为 0; ΔE76 与之单调性一致', () => {
    const a = { L: 50, a: 20, b: -30 };
    const b = { L: 62, a: -8, b: 14 };
    expect(deltaE2000(a, a)).toBeCloseTo(0, 10);
    expect(deltaE2000(a, b)).toBeCloseTo(deltaE2000(b, a), 10);
    expect(deltaE76(a, b)).toBeGreaterThan(0);
  });
});

describe('图片 -> 豆格网格', () => {
  test('toCellGrid: 逐格取色, 保留 α', () => {
    const data = new Uint8ClampedArray([ 10, 20, 30, 255, 40, 50, 60, 0, 70, 80, 90, 128, 1, 2, 3, 255 ]);
    const grid = toCellGrid(data, 2, 2);
    expect(grid.w).toBe(2);
    expect(grid.h).toBe(2);
    expect(Array.from(grid.alpha)).toEqual([ 255, 0, 128, 255 ]);
    expect(Array.from(grid.rgb.slice(0, 3))).toEqual([ 10, 20, 30 ]);
    expect(Array.from(grid.rgb.slice(9, 12))).toEqual([ 1, 2, 3 ]);
  });

  test('toCellGrid: 尺寸至少 1', () => {
    const grid = toCellGrid(new Uint8ClampedArray(4), 0, 0);
    expect(grid.w).toBe(1);
    expect(grid.h).toBe(1);
  });

  test('adjustRgb: 亮度 / 对比度 / 饱和度', () => {
    const mid = adjustRgb(128, 128, 128);
    expect(mid).toEqual({ r: 128, g: 128, b: 128 });
    expect(adjustRgb(128, 128, 128, { brightness: 100 })).toEqual({ r: 255, g: 255, b: 255 });
    expect(adjustRgb(200, 200, 200, { brightness: -100 })).toEqual({ r: 0, g: 0, b: 0 });
    // 饱和度 -100 -> 纯灰 (三通道一致)
    const gray = adjustRgb(200, 60, 20, { saturation: -100 });
    expect(gray.r).toBe(gray.g);
    expect(gray.g).toBe(gray.b);
    // 饱和度增强 -> 与灰度差异变大
    const before = adjustRgb(200, 60, 20);
    const after = adjustRgb(200, 60, 20, { saturation: 100 });
    expect(after.r - after.b).toBeGreaterThan(before.r - before.b);
    // 对比度增强: 亮的更亮, 暗的更暗
    expect(adjustRgb(200, 200, 200, { contrast: 50 }).r).toBeGreaterThan(200);
    expect(adjustRgb(60, 60, 60, { contrast: 50 }).r).toBeLessThan(60);
  });

  test('toCellGrid: 应用调节参数', () => {
    const grid = gridOf([ [ '#808080' ] ]);
    const bright = toCellGrid(new Uint8ClampedArray([ 128, 128, 128, 255 ]), 1, 1, { brightness: 100 });
    expect(bright.rgb[0]).toBe(255);
    expect(grid.rgb[0]).toBe(128);
  });
});

describe('背景留空', () => {
  test('透明像素不留豆', () => {
    const grid = gridOf([ [ '#FF0000', '' ], [ '', '#00FF00' ] ]);
    const { mask } = backgroundMask(grid, false);
    expect(Array.from(mask)).toEqual([ 1, 0, 0, 1 ]);
  });

  test('纯色背景: 识别出边缘主色并整片留空', () => {
    const grid = gridOf([
      [ '#FFFFFF', '#FFFFFF', '#FFFFFF' ],
      [ '#FFFFFF', '#FF0000', '#FFFFFF' ],
      [ '#FFFFFF', '#FFFFFF', '#FFFFFF' ],
    ]);
    const { mask, bg, bgHex } = backgroundMask(grid, true);
    expect(bgHex).toBe('#FFFFFF');
    expect(bg).toEqual({ r: 255, g: 255, b: 255 });
    expect(Array.from(mask)).toEqual([ 0, 0, 0, 0, 1, 0, 0, 0, 0 ]);
  });

  test('背景色在阈值内也算背景 (JPEG 噪声)', () => {
    const grid = gridOf([
      [ '#FCFCFC', '#FDFDFD', '#FBFBFB' ],
      [ '#FEFEFE', '#FF0000', '#FDFDFD' ],
      [ '#FBFBFB', '#FDFDFD', '#FEFEFE' ],
    ]);
    const { mask, bgHex } = backgroundMask(grid, true, 8);
    expect(bgHex).not.toBeNull();
    expect(mask[4]).toBe(1);
    expect(mask[0]).toBe(0);
    // 阈值 0 时只要与背景不完全相同就保留
    const strict = backgroundMask(grid, true, 0);
    expect(Array.from(strict.mask).filter((v) => v === 1).length).toBeGreaterThan(1);
  });

  test('边缘颜色杂乱时不误判背景; 关掉去背景则全部保留', () => {
    const grid = gridOf([
      [ '#FF0000', '#00FF00', '#0000FF' ],
      [ '#FFFF00', '#FF00FF', '#00FFFF' ],
      [ '#123456', '#654321', '#ABCDEF' ],
    ]);
    const { mask, bg, bgHex } = backgroundMask(grid, true);
    expect(bg).toBeNull();
    expect(bgHex).toBeNull();
    expect(Array.from(mask)).toEqual(Array.from(new Uint8Array(9).fill(1)));
    const off = backgroundMask(grid, false);
    expect(Array.from(off.mask).every((v) => v === 1)).toBe(true);
  });
});

describe('色号匹配 (用色数限制)', () => {
  test('两色图: 与色卡完全一致时逐格精确匹配', () => {
    const brand = brandOf([ '#FF0000', '#0000FF', '#00FF00' ]);
    const grid = gridOf([ [ '#FF0000', '#0000FF' ], [ '#0000FF', '#FF0000' ] ]);
    const { cells, used } = quantizeToBeads(grid, maskAll(2, 2), brand, { maxColors: 8 });
    expect(Array.from(cells)).toEqual([ 0, 1, 1, 0 ]);
    expect(used).toEqual([ 0, 1 ]);
  });

  test('用色数 = 1 时只保留用量最多的颜色', () => {
    const brand = brandOf([ '#FF0000', '#0000FF', '#00FF00' ]);
    const grid = gridOf([ [ '#FF0000', '#0000FF' ], [ '#FF0000', '#FF0000' ] ]);
    const { cells, used } = quantizeToBeads(grid, maskAll(2, 2), brand, { maxColors: 1 });
    expect(used).toEqual([ 0 ]);
    expect(Array.from(cells)).toEqual([ 0, 0, 0, 0 ]);
  });

  test('无掩码 (全透明 / 留空) 时没有用色', () => {
    const brand = brandOf([ '#FF0000', '#0000FF' ]);
    const grid = gridOf([ [ '#FF0000', '#0000FF' ] ]);
    const { cells, used } = quantizeToBeads(grid, maskAll(2, 1, false), brand, { maxColors: 8 });
    expect(used).toEqual([]);
    expect(Array.from(cells)).toEqual([ -1, -1 ]);
  });

  test('留空的格子输出 -1, 其余格子都落在选中的用色里', () => {
    const brand = brandOf([ '#FF0000', '#0000FF' ]);
    const mask = new Uint8Array([ 1, 0, 1, 1 ]);
    const grid = gridOf([ [ '#FF0000', '#FF0000' ], [ '#0000FF', '#FF0000' ] ]);
    const { cells, used } = quantizeToBeads(grid, mask, brand, { maxColors: 8 });
    expect(cells[1]).toBe(-1);
    for (let i = 0; i < cells.length; i++) {
      if (mask[i]) expect(used).toContain(cells[i]);
    }
  });

  test('匹配用的是 CIEDE2000 最近色 (MARD 真实色卡)', () => {
    const mard = getBrand('mard');
    const beads = beadsOf(mard);
    const probes = [ '#7B68EE', '#C8A165', '#0F5C3C', '#F5D7E3', '#463A2F', '#A8D8EA', '#D9A5B3', '#2E4053', '#E8E0C9', '#B03A2E' ];
    let mismatch = 0;
    for (const hex of probes) {
      const { r, g, b } = hexToRgb(hex);
      const lab = rgbToLab(r, g, b);
      const byE00 = beads.reduce((a, c) => (deltaE2000(lab, c.lab) < deltaE2000(lab, a.lab) ? c : a));
      const byE76 = beads.reduce((a, c) => (deltaE76(lab, c.lab) < deltaE76(lab, a.lab) ? c : a));
      if (byE00.index !== byE76.index) mismatch++;
      const grid = gridOf([ [ hex ] ]);
      const { cells, used } = quantizeToBeads(grid, maskAll(1, 1), mard, { maxColors: 1 });
      expect(used).toEqual([ byE00.index ]);
      expect(cells[0]).toBe(byE00.index);
    }
    // 至少有一个色值能体现 ΔE00 与 ΔE76 的差异, 否则该断言无意义
    expect(mismatch).toBeGreaterThan(0);
  });

  test('抖动不影响用色集合, 但会打散过渡色', () => {
    const brand = brandOf([ '#000000', '#FFFFFF' ]);
    const rows = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => '#6E6E6E'));
    const grid = gridOf(rows);
    const plain = quantizeToBeads(grid, maskAll(8, 8), brand, { maxColors: 2 });
    expect(new Set(Array.from(plain.cells)).size).toBe(1);
    const dithered = quantizeToBeads(grid, maskAll(8, 8), brand, { maxColors: 2, dither: true });
    expect(new Set(Array.from(dithered.cells))).toEqual(new Set([ 0, 1 ]));
    expect(dithered.used.length).toBe(2);
  });

  test('结果稳定: 同输入两次调用一致', () => {
    const brand = getBrand('perler');
    const rows = Array.from({ length: 12 }, (_, y) => Array.from({ length: 12 }, (_, x) => ((x + y) % 3 === 0 ? '#3355AA' : (x % 2 ? '#DDAA33' : '#22AA55'))));
    const grid = gridOf(rows);
    const a = quantizeToBeads(grid, maskAll(12, 12), brand, { maxColors: 4 });
    const b = quantizeToBeads(grid, maskAll(12, 12), brand, { maxColors: 4 });
    expect(Array.from(a.cells)).toEqual(Array.from(b.cells));
    expect(a.used).toEqual(b.used);
    expect(a.used.length).toBeLessThanOrEqual(4);
  });
});

describe('统计 (豆数 / 尺寸 / 拼豆板)', () => {
  const brand = brandOf([ '#FF0000', '#0000FF' ]);

  test('数量 / 占比 / 用色数 / 留空数', () => {
    const cells = new Int32Array([ 0, 1, 0, -1 ]);
    const stats = patternStats(cells, 2, 2, brand);
    expect(stats.total).toBe(3);
    expect(stats.empties).toBe(1);
    expect(stats.colors).toBe(2);
    expect(stats.used.map((u) => u.code)).toEqual([ 'T1', 'T2' ]);
    expect(stats.used.map((u) => u.count)).toEqual([ 2, 1 ]);
    expect(stats.used[0].ratio).toBeCloseTo(2 / 3, 10);
    expect(stats.used[0].hex).toBe('#FF0000');
  });

  test('空图统计为 0', () => {
    const stats = patternStats(new Int32Array(4).fill(-1), 2, 2, brand);
    expect(stats.total).toBe(0);
    expect(stats.used).toEqual([]);
    expect(stats.colors).toBe(0);
  });

  test('beadSizeCm / pegboards', () => {
    expect(beadSizeCm(58, 58, 5)).toEqual({ w: 29, h: 29 });
    expect(beadSizeCm(58, 58, 2.6)).toEqual({ w: 15.1, h: 15.1 });
    expect(beadSizeCm(10, 4, 2.6)).toEqual({ w: 2.6, h: 1 });
    expect(pegboards(29, 29)).toEqual({ x: 1, y: 1, total: 1 });
    expect(pegboards(30, 29)).toEqual({ x: 2, y: 1, total: 2 });
    expect(pegboards(58, 58)).toEqual({ x: 2, y: 2, total: 4 });
    expect(pegboards(59, 88)).toEqual({ x: 3, y: 4, total: 12 });
    // 自定义板规格
    expect(pegboards(29, 29, 10)).toEqual({ x: 3, y: 3, total: 9 });
  });
});

describe('导出文本', () => {
  const brand = brandOf([ '#FF0000', '#0000FF' ]);
  const cells = new Int32Array([ 0, 1, -1, 0 ]);

  test('codeRows: 留空为空白字符串', () => {
    expect(codeRows(cells, 2, 2, brand)).toEqual([ [ 'T1', 'T2' ], [ '', 'T1' ] ]);
  });

  test('patternCsv: 带行列编号, CRLF 换行', () => {
    const csv = patternCsv(cells, 2, 2, brand);
    expect(csv).toBe(',1,2\r\n1,T1,T2\r\n2,,T1\r\n');
  });

  test('usageCsv: 含表头与合计行', () => {
    const stats = patternStats(cells, 2, 2, brand);
    const csv = usageCsv(stats);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toContain('色号 Code');
    expect(lines[1]).toContain('T1');
    expect(lines[1]).toContain('66.7%');
    expect(lines[lines.length - 1]).toContain('合计 Total');
    expect(lines[lines.length - 1]).toContain('3');
  });

  test('usageText: 由调用方传入单位与文案', () => {
    const stats = patternStats(cells, 2, 2, brand);
    const text = usageText(stats, '颗', '合计', '色号\t颜色名');
    const lines = text.split('\n');
    expect(lines[0]).toBe('色号\t颜色名');
    expect(lines[1]).toContain('T1');
    expect(lines[1]).toContain('2颗');
    expect(lines[1]).toContain('66.7%');
    expect(lines[2]).toContain('1颗');
    expect(lines[3]).toBe('合计\t3颗\t2x2');
  });
});

describe('手工修图', () => {
  test('setCell: 越界不改变内容 (返回副本)', () => {
    const cells = new Int32Array([ 0, 1, 2, 3 ]);
    const next = setCell(cells, 2, 2, 1, 1, 9);
    expect(Array.from(next)).toEqual([ 0, 1, 2, 9 ]);
    expect(Array.from(cells)).toEqual([ 0, 1, 2, 3 ]);
    expect(Array.from(setCell(cells, 2, 2, -1, 0, 9))).toEqual(Array.from(cells));
    expect(Array.from(setCell(cells, 2, 2, 2, 0, 9))).toEqual(Array.from(cells));
    expect(Array.from(setCell(cells, 2, 2, 0, 2, 9))).toEqual(Array.from(cells));
  });

  test('replaceColor: 只换指定色号', () => {
    const next = replaceColor(new Int32Array([ 0, 1, 0, 2 ]), 0, 2);
    expect(Array.from(next)).toEqual([ 2, 1, 2, 2 ]);
  });

  test('fillRegion: 只填同色连通区 (4 邻域)', () => {
    // 0 0 1
    // 0 1 1
    // 1 1 0   <- 右下角的 0 与左上角 0 不连通
    const cells = new Int32Array([ 0, 0, 1, 0, 1, 1, 1, 1, 0 ]);
    const next = fillRegion(cells, 3, 3, 0, 0, 2);
    expect(Array.from(next)).toEqual([ 2, 2, 1, 2, 1, 1, 1, 1, 0 ]);
  });

  test('fillRegion: 目标色相同时不做改动; 越界安全', () => {
    const cells = new Int32Array([ 0, 1, 1, 0 ]);
    expect(Array.from(fillRegion(cells, 2, 2, 0, 0, 0))).toEqual(Array.from(cells));
    expect(Array.from(fillRegion(cells, 2, 2, 5, 5, 3))).toEqual(Array.from(cells));
  });

  test('mirrorCells: 水平镜像', () => {
    const next = mirrorCells(new Int32Array([ 0, 1, 2, 3, 4, 5 ]), 3, 2);
    expect(Array.from(next)).toEqual([ 2, 1, 0, 5, 4, 3 ]);
  });

  test('heightForWidth: 按原图比例, 至少 1', () => {
    expect(heightForWidth(100, 50, 58)).toBe(29);
    expect(heightForWidth(50, 100, 58)).toBe(116);
    expect(heightForWidth(0, 0, 58)).toBe(58);
    expect(heightForWidth(1000, 1, 10)).toBe(1);
  });
});
