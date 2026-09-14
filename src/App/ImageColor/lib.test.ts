import {
  ALPHA_DEFAULT, COLORS_DEFAULT, LEVEL_DEFAULT, LEVEL_MAX, LEVEL_MIN, MAX_EDGE,
  clamp, colorDistance, contrastColor, countColors, coverage, extractPalette, fitSize, formatRatio,
  formatRgb, hexToRgb, levelToBucket, levelToTolerance, mergeEntries, paletteToCsv, paletteToText,
  quantizeRgb, rgbToHex, type ColorEntry,
} from './lib';

/** 构造 RGBA 扁平数据 */
const px = (list: Array<[ number, number, number, number? ]>): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(list.length * 4);
  list.forEach(([ r, g, b, a ], i) => {
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = a ?? 255;
  });
  return out;
};

/** 重复 n 次同一像素 */
const repeat = (rgb: [ number, number, number ], n: number): Array<[ number, number, number ]> =>
  Array.from({ length: n }, () => rgb);

describe('ImageColor 基础工具函数', () => {
  test('clamp 取整并夹取范围, 非法值回退 min', () => {
    expect(clamp(5.6, 1, 10)).toBe(6);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
    expect(clamp(Number.NaN, 2, 10)).toBe(2);
  });

  test('fitSize 不放大, 超限时等比缩小', () => {
    expect(fitSize(800, 600, 1024)).toEqual({ width: 800, height: 600, scale: 1 });
    const r = fitSize(4096, 2048, 1024);
    expect(r.width).toBe(1024);
    expect(r.height).toBe(512);
    expect(r.scale).toBeCloseTo(0.25, 5);
    // 竖图同样按最长边缩放
    const p = fitSize(1000, 4000, 1000);
    expect(p.height).toBe(1000);
    expect(p.width).toBe(250);
    // 非法尺寸兜底
    expect(fitSize(0, 0, MAX_EDGE)).toEqual({ width: 1, height: 1, scale: 1 });
  });

  test('rgbToHex / hexToRgb 互转', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
    expect(rgbToHex({ r: 170, g: 187, b: 204 })).toBe('#aabbcc');
    expect(rgbToHex({ r: 300, g: -5, b: 12.4 })).toBe('#ff000c');
    expect(hexToRgb('#aabbcc')).toEqual({ r: 170, g: 187, b: 204 });
    expect(hexToRgb('abc')).toEqual({ r: 170, g: 187, b: 204 });
    expect(hexToRgb('  #AABBCC ')).toEqual({ r: 170, g: 187, b: 204 });
    expect(hexToRgb('#xyz')).toBeNull();
    expect(hexToRgb('')).toBeNull();
  });

  test('formatRgb / formatRatio', () => {
    expect(formatRgb({ r: 1, g: 22, b: 255 })).toBe('rgb(1, 22, 255)');
    expect(formatRatio(0.123456)).toBe('12.35%');
    expect(formatRatio(0.5, 0)).toBe('50%');
    expect(formatRatio(Number.NaN)).toBe('0.00%');
  });

  test('contrastColor 依据亮度选黑/白前景', () => {
    expect(contrastColor({ r: 255, g: 255, b: 255 })).toBe('#000000');
    expect(contrastColor({ r: 0, g: 0, b: 0 })).toBe('#ffffff');
    expect(contrastColor({ r: 240, g: 240, b: 240 })).toBe('#000000');
  });

  test('相似度级别映射色阶桶与阈值', () => {
    expect(levelToBucket(LEVEL_MIN)).toBe(1);
    expect(levelToBucket(3)).toBe(2);
    expect(levelToBucket(LEVEL_MAX)).toBe(16);
    expect(levelToBucket(0)).toBe(1); // 越界夹取
    expect(levelToBucket(999)).toBe(16);
    expect(levelToTolerance(LEVEL_MIN)).toBe(8);
    expect(levelToTolerance(LEVEL_DEFAULT)).toBe(32);
    expect(levelToTolerance(999)).toBe(80);
  });

  test('quantizeRgb 取桶中心值', () => {
    expect(quantizeRgb({ r: 10, g: 20, b: 30 }, 1)).toEqual({ r: 10, g: 20, b: 30 });
    expect(quantizeRgb({ r: 10, g: 20, b: 30 }, 8)).toEqual({ r: 12, g: 20, b: 28 });
    // 亮部不越界
    expect(quantizeRgb({ r: 255, g: 250, b: 249 }, 16).r).toBeLessThanOrEqual(255);
  });

  test('colorDistance 为各通道差值的最大值', () => {
    expect(colorDistance({ r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 })).toBe(0);
    expect(colorDistance({ r: 10, g: 0, b: 0 }, { r: 0, g: 30, b: 0 })).toBe(30);
    expect(colorDistance({ r: 255, g: 255, b: 255 }, { r: 0, g: 0, b: 0 })).toBe(255);
  });
});

describe('ImageColor 像素统计', () => {
  test('统计颜色分布与像素总数', () => {
    const data = px([ ...repeat([ 255, 0, 0 ], 3), ...repeat([ 0, 255, 0 ], 1) ]);
    const r = countColors(data);
    expect(r.total).toBe(4);
    expect(r.unique).toBe(2);
    expect(r.entries).toEqual([
      { rgb: { r: 255, g: 0, b: 0 }, count: 3 },
      { rgb: { r: 0, g: 255, b: 0 }, count: 1 },
    ]);
  });

  test('默认忽略透明像素, 且不计入总数', () => {
    const data = px([ [ 1, 2, 3, 255 ], [ 4, 5, 6, 0 ], [ 7, 8, 9, ALPHA_DEFAULT ] ]);
    const r = countColors(data);
    expect(r.total).toBe(1);
    expect(r.unique).toBe(1);
    expect(r.entries).toEqual([ { rgb: { r: 1, g: 2, b: 3 }, count: 1 } ]);
  });

  test('关闭忽略透明 / 自定义阈值', () => {
    const data = px([ [ 1, 2, 3, 255 ], [ 4, 5, 6, 0 ] ]);
    expect(countColors(data, { ignoreTransparent: false }).total).toBe(2);
    const t = countColors(data, { ignoreTransparent: true, alphaThreshold: 200 });
    expect(t.total).toBe(1);
    expect(t.entries).toEqual([ { rgb: { r: 1, g: 2, b: 3 }, count: 1 } ]);
  });

  test('按色阶桶归组, 代表色取桶内真实平均色', () => {
    const data = px([ [ 8, 8, 8 ], [ 12, 12, 12 ], [ 200, 0, 0 ] ]);
    const r = countColors(data, { bucket: 8 });
    expect(r.unique).toBe(2);
    expect(r.total).toBe(3);
    // 8 与 12 落在同一个桶, 平均色为 10
    expect(r.entries[0]).toEqual({ rgb: { r: 10, g: 10, b: 10 }, count: 2 });
  });

  test('空数据返回空结果', () => {
    const r = countColors(new Uint8ClampedArray(0));
    expect(r.total).toBe(0);
    expect(r.unique).toBe(0);
    expect(r.entries).toEqual([]);
  });
});

describe('ImageColor 相似色合并', () => {
  const entries: ColorEntry[] = [
    { rgb: { r: 100, g: 100, b: 100 }, count: 100 },
    { rgb: { r: 104, g: 102, b: 98 }, count: 50 },
    { rgb: { r: 200, g: 10, b: 10 }, count: 30 },
  ];

  test('阈值内的颜色被合并, 代表色取加权平均', () => {
    const merged = mergeEntries(entries, 8, 8);
    expect(merged).toHaveLength(2);
    expect(merged[0].count).toBe(150);
    // (100*100 + 104*50) / 150 = 101.33 -> 101
    expect(merged[0].rgb).toEqual({ r: 101, g: 101, b: 99 });
    expect(merged[1].count).toBe(30);
  });

  test('阈值为 0 时不合并 (颜色不同)', () => {
    const merged = mergeEntries(entries, 0, 8);
    expect(merged).toHaveLength(3);
    expect(merged.map((e) => e.count)).toEqual([ 100, 50, 30 ]);
  });

  test('色簇达到上限后并入最接近的簇, 像素不丢失', () => {
    // 上限 1: 全部并入第一个簇
    const merged = mergeEntries(entries, 0, 1);
    expect(merged).toHaveLength(1);
    expect(merged[0].count).toBe(180);
    // 上限 2: 第三个颜色并入更接近的深灰簇
    const two = mergeEntries(entries, 0, 2);
    expect(two).toHaveLength(2);
    expect(two.reduce((s, e) => s + e.count, 0)).toBe(180);
  });

  test('空输入返回空数组, 结果按像素数降序', () => {
    expect(mergeEntries([], 8, 4)).toEqual([]);
    const merged = mergeEntries(
      [ { rgb: { r: 0, g: 0, b: 0 }, count: 1 }, { rgb: { r: 255, g: 255, b: 255 }, count: 9 } ],
      0,
      8
    );
    expect(merged[0].count).toBe(9);
  });
});

describe('ImageColor 调色板提取', () => {
  test('按占比降序输出, 合并开启时占比合计 100%', () => {
    const data = px([ ...repeat([ 10, 10, 10 ], 10), ...repeat([ 12, 11, 9 ], 5), ...repeat([ 250, 0, 0 ], 5) ]);
    const r = extractPalette(data, { merge: true, level: 4, maxColors: 8 });
    expect(r.total).toBe(20);
    expect(r.palette[0].count).toBe(15);
    expect(r.palette[0].ratio).toBeCloseTo(0.75, 6);
    expect(coverage(r.palette)).toBeCloseTo(1, 6);
    // 降序
    const ratios = r.palette.map((c) => c.ratio);
    expect([ ...ratios ].sort((a, b) => b - a)).toEqual(ratios);
    expect(r.palette[0].hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  test('合并关闭时输出精确 TopN, 覆盖占比可小于 100%', () => {
    const data = px([ ...repeat([ 1, 1, 1 ], 4), ...repeat([ 2, 2, 2 ], 3), ...repeat([ 3, 3, 3 ], 2), [ 4, 4, 4 ] ]);
    const r = extractPalette(data, { merge: false, maxColors: 2 });
    expect(r.unique).toBe(4);
    expect(r.palette).toHaveLength(2);
    expect(r.palette.map((c) => c.hex)).toEqual([ '#010101', '#020202' ]);
    expect(coverage(r.palette)).toBeCloseTo(0.7, 6);
  });

  test('输出颜色数上限与合并上限一致', () => {
    const list: Array<[ number, number, number ]> = [];
    for (let i = 0; i < 30; i++) list.push([ i * 8, 255 - i * 8, i * 4 ]);
    const r = extractPalette(px(list), { merge: true, level: 1, maxColors: 5 });
    expect(r.palette.length).toBeLessThanOrEqual(5);
    expect(coverage(r.palette)).toBeCloseTo(1, 6);
  });

  test('忽略透明像素后占比基于有效像素', () => {
    const data = px([ [ 9, 9, 9, 255 ], [ 9, 9, 9, 255 ], [ 200, 200, 200, 0 ] ]);
    const r = extractPalette(data, { merge: true });
    expect(r.total).toBe(2);
    expect(r.palette).toHaveLength(1);
    expect(r.palette[0].ratio).toBe(1);
  });

  test('全透明或空数据时调色板为空且不抛异常', () => {
    const r = extractPalette(px([ [ 1, 2, 3, 0 ] ]), { merge: true });
    expect(r.palette).toEqual([]);
    expect(r.total).toBe(0);
    expect(coverage(r.palette)).toBe(0);
  });

  test('默认参数可用 (级别 4 / 12 色)', () => {
    const r = extractPalette(px(repeat([ 12, 34, 56 ], 3)));
    expect(COLORS_DEFAULT).toBe(12);
    expect(LEVEL_DEFAULT).toBe(4);
    expect(r.palette[0].hex).toBe(rgbToHex({ r: 12, g: 34, b: 56 }));
    expect(r.tolerance).toBe(levelToTolerance(LEVEL_DEFAULT));
  });
});

describe('ImageColor 导出文本', () => {
  const palette = extractPalette(px([ ...repeat([ 0, 0, 0 ], 3), [ 255, 255, 255 ] ]), { merge: false, maxColors: 4 }).palette;

  test('detail 模式含 hex / rgb / 占比 / 像素数', () => {
    const text = paletteToText(palette, 'detail');
    const lines = text.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('#000000  rgb(0, 0, 0)  75.00%  3px');
    expect(lines[1]).toBe('#ffffff  rgb(255, 255, 255)  25.00%  1px');
  });

  test('plain 模式只有 hex 与占比', () => {
    const lines = paletteToText(palette, 'plain').split('\n');
    expect(lines[0]).toBe('#000000  75.00%');
  });

  test('CSV 含表头与百分比列', () => {
    const csv = paletteToCsv(palette).split('\n');
    expect(csv[0]).toBe('hex,r,g,b,count,ratio');
    expect(csv[1]).toBe('#000000,0,0,0,3,75.0000%');
    expect(csv).toHaveLength(3);
  });

  test('空调色板导出为空文本 / 仅表头', () => {
    expect(paletteToText([])).toBe('');
    expect(paletteToCsv([])).toBe('hex,r,g,b,count,ratio');
  });
});
