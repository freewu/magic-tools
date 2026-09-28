import {
  BAYER, buildGrid, clampByte, colorDistance2, ditherAmplitude, ditherOffset, expandGrid, getDefaultPreset,
  grayscaleGrid, gridColorAt, gridSize, hexToRgb, initialSettings, medianCut, nearestColor, normalizeBlock,
  normalizePalette, normalizePreset, parsePalette, pixelArt, presetSettings, quantizeGrid, quantizeGridBits,
  resolvePalette, rgbToHex, setDefaultPreset,
} from './lib';
import {
  AUTO_COUNTS, BLOCK_MAX, BLOCK_MIN, PALETTE_DEFS, PALETTE_KEYS, PRESET_DEFAULT, PRESET_DEFS, paletteColorCount,
  type PaletteKey,
} from './data';

/** 造一张 w×h 的图片数据, fill 返回 [r,g,b,a] */
const make = (w: number, h: number, fill: (x: number, y: number) => [ number, number, number, number ]) => {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [ r, g, b, a ] = fill(x, y);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  return data;
};

/** 取第 (x,y) 个像素 */
const at = (data: Uint8ClampedArray, w: number, x: number, y: number) => {
  const i = (y * w + x) * 4;
  return [ data[i], data[i + 1], data[i + 2], data[i + 3] ];
};

beforeEach(() => {
  localStorage.clear();
});

describe('PixelArt 基础工具函数', () => {
  test('clampByte 取整并夹取到 0~255, 非数字回退 0', () => {
    expect(clampByte(12.6)).toBe(13);
    expect(clampByte(-5)).toBe(0);
    expect(clampByte(999)).toBe(255);
    expect(clampByte(NaN)).toBe(0);
  });

  test('hexToRgb / rgbToHex 互转 (支持省略 #, 非法输入回退黑色)', () => {
    expect(hexToRgb('FF8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe('#FF8000');
    expect(hexToRgb('zzz')).toEqual({ r: 0, g: 0, b: 0 });
  });

  test('normalizeBlock 夹取到 [BLOCK_MIN, BLOCK_MAX]', () => {
    expect(normalizeBlock(8)).toBe(8);
    expect(normalizeBlock(7.6)).toBe(8);
    expect(normalizeBlock(0)).toBe(BLOCK_MIN);
    expect(normalizeBlock(999)).toBe(BLOCK_MAX);
    expect(normalizeBlock('abc')).toBe(8);
  });

  test('normalizePalette / normalizePreset 非法值回退', () => {
    expect(normalizePalette('nes')).toBe('nes');
    expect(normalizePalette('nope')).toBe('off');
    expect(normalizePreset('game')).toBe('game');
    expect(normalizePreset('nope')).toBe(PRESET_DEFAULT);
  });

  test('colorDistance2 / nearestColor', () => {
    expect(colorDistance2(0, 0, 0, 0, 0, 0)).toBe(0);
    const pal = [ hexToRgb('000000'), hexToRgb('FF0000'), hexToRgb('FFFFFF') ];
    expect(nearestColor(pal, 250, 10, 10)).toEqual({ r: 255, g: 0, b: 0 });
    expect(nearestColor(pal, 10, 10, 10)).toEqual({ r: 0, g: 0, b: 0 });
    expect(nearestColor([], 10, 20, 30)).toEqual({ r: 10, g: 20, b: 30 });
  });

  test('bayer 矩阵与抖动幅度 / 偏移', () => {
    expect(BAYER).toHaveLength(16);
    expect(Math.min(...BAYER)).toBe(0);
    expect(Math.max(...BAYER)).toBe(15);
    // 色数越少幅度越大, 且夹取在 16~96
    expect(ditherAmplitude(4)).toBeGreaterThan(ditherAmplitude(64));
    expect(ditherAmplitude(4)).toBeLessThanOrEqual(96);
    expect(ditherAmplitude(1)).toBe(96);
    expect(ditherAmplitude(0)).toBe(0);
    expect(ditherOffset(0, 0, 0)).toBeCloseTo(0);
    // 4×4 内既有正偏移也有负偏移
    const offs = Array.from({ length: 16 }, (_, i) => ditherOffset(i % 4, Math.floor(i / 4), 32));
    expect(Math.max(...offs)).toBeGreaterThan(0);
    expect(Math.min(...offs)).toBeLessThan(0);
  });
});

describe('PixelArt 像素块网格', () => {
  test('buildGrid 按块求平均 (2×2 块 -> 1 个格子)', () => {
    const data = make(2, 2, (x, y) => (x === 0 && y === 0 ? [ 255, 0, 0, 255 ] : [ 0, 0, 255, 255 ]));
    const grid = buildGrid(data, 2, 2, 2);
    expect([ grid.gw, grid.gh ]).toEqual([ 1, 1 ]);
    expect(grid.rgb[0]).toBe(Math.round((255 + 0 + 0 + 0) / 4));
    expect(grid.rgb[2]).toBe(Math.round((0 + 255 + 255 + 255) / 4));
    expect(grid.alpha[0]).toBe(255);
  });

  test('buildGrid 颜色按 α 加权: 全透明像素不影响颜色', () => {
    const data = make(2, 2, (x, y) => (x === 0 ? [ 255, 0, 0, 255 ] : [ 0, 255, 0, 0 ]));
    const grid = buildGrid(data, 2, 2, 2);
    expect([ grid.rgb[0], grid.rgb[1], grid.rgb[2] ]).toEqual([ 255, 0, 0 ]);
    expect(grid.alpha[0]).toBe(Math.round(255 * 2 / 4));
  });

  test('buildGrid 处理不能整除的边界块 (3×3 + 块 2 -> 2×2 格)', () => {
    const data = make(3, 3, () => [ 100, 100, 100, 255 ]);
    const grid = buildGrid(data, 3, 3, 2);
    expect([ grid.gw, grid.gh ]).toEqual([ 2, 2 ]);
    // 右下角只有 1 个像素, 颜色仍是 100
    expect(grid.rgb[3 * 3]).toBe(100);
  });

  test('grayscaleGrid 用 Rec.709 亮度', () => {
    const grid = buildGrid(make(1, 1, () => [ 255, 0, 0, 255 ]), 1, 1, 2);
    grayscaleGrid(grid);
    expect(grid.rgb[0]).toBe(Math.round(0.2126 * 255));
    expect(grid.rgb[0]).toBe(grid.rgb[1]);
    expect(grid.rgb[1]).toBe(grid.rgb[2]);
  });

  test('expandGrid 把每个格子填满对应色块', () => {
    const data = make(4, 2, (x) => (x < 2 ? [ 255, 0, 0, 255 ] : [ 0, 0, 255, 255 ]));
    const out = expandGrid(buildGrid(data, 4, 2, 2));
    expect(out).toHaveLength(4 * 2 * 4);
    expect(at(out, 4, 0, 0)).toEqual([ 255, 0, 0, 255 ]);
    expect(at(out, 4, 1, 1)).toEqual([ 255, 0, 0, 255 ]);
    expect(at(out, 4, 2, 0)).toEqual([ 0, 0, 255, 255 ]);
    expect(at(out, 4, 3, 1)).toEqual([ 0, 0, 255, 255 ]);
  });

  test('gridSize 换算色块数', () => {
    expect(gridSize(100, 50, 10)).toEqual({ gw: 10, gh: 5 });
    expect(gridSize(101, 50, 10)).toEqual({ gw: 11, gh: 5 });
    expect(gridSize(0, 0, 10)).toEqual({ gw: 1, gh: 1 });
  });
});

describe('PixelArt 调色板', () => {
  test('内置色表全部为合法 hex, 色数与色板定义一致', () => {
    for (const key of PALETTE_KEYS) {
      const def = PALETTE_DEFS[key];
      expect(def).toBeDefined();
      for (const hex of def.colors) expect(hex).toMatch(/^[0-9A-F]{6}$/);
      if (def.bits) expect(def.colors).toHaveLength(0);
    }
    expect(PALETTE_DEFS.nes.colors).toHaveLength(55); // 64 表项去重 10 个黑
    expect(new Set(PALETTE_DEFS.pico8.colors).size).toBe(16);
    expect(new Set(PALETTE_DEFS.gameboy.colors).size).toBe(4);
    expect(new Set(PALETTE_DEFS.c64.colors).size).toBe(16);
    expect(new Set(PALETTE_DEFS.cga.colors).size).toBe(16);
    expect(new Set(PALETTE_DEFS.zx.colors).size).toBe(15);
    expect(paletteColorCount('gameboy')).toBe(4);
    expect(paletteColorCount('sms')).toBe(64);
    expect(paletteColorCount('genesis')).toBe(512);
    expect(paletteColorCount('snes')).toBe(32768);
    expect(paletteColorCount('off')).toBe(0);
    expect(paletteColorCount('auto64')).toBe(64);
  });

  test('parsePalette 把 hex 表转成 Rgb 表', () => {
    const pal = parsePalette('gameboy');
    expect(pal).toHaveLength(4);
    expect(pal[0]).toEqual({ r: 0x0F, g: 0x38, b: 0x0F });
  });

  test('resolvePalette: off 返回 null, 固定色表原样返回, 自适应按网格取色', () => {
    const data = make(4, 4, (x) => (x < 2 ? [ 255, 0, 0, 255 ] : [ 0, 0, 255, 255 ]));
    const grid = buildGrid(data, 4, 4, 2);
    expect(resolvePalette('off', grid)).toBeNull();
    expect(resolvePalette('pico8', grid)).toHaveLength(16);
    const auto = resolvePalette('auto16', grid);
    expect(auto).not.toBeNull();
    expect((auto as { r: number }[]).length).toBe(2); // 只有两种颜色
  });

  test('medianCut 不超过目标色数, 且能区分纯色', () => {
    const data = make(4, 4, (x, y) => (x < 2 ? [ 255, 0, 0, 255 ] : (y < 2 ? [ 0, 255, 0, 255 ] : [ 0, 0, 128, 255 ])));
    const grid = buildGrid(data, 4, 4, 2);
    expect(medianCut(grid, 1)).toHaveLength(1);
    const cut2 = medianCut(grid, 2);
    expect(cut2).toHaveLength(2);
    // 色数上限大于实际颜色数时返回全部颜色 (按出现次数降序)
    const all = medianCut(grid, 8);
    expect(all).toHaveLength(3);
    expect(all[0]).toEqual({ r: 255, g: 0, b: 0 });
    expect(medianCut(grid, 0)).toEqual([]);
  });

  test('medianCut 对大量颜色也能返回指定数量 (5bit 分桶)', () => {
    const data = make(32, 32, (x, y) => [ (x * 8) % 256, (y * 8) % 256, ((x + y) * 4) % 256, 255 ]);
    const grid = buildGrid(data, 32, 32, 1);
    const pal = medianCut(grid, 32);
    expect(pal).toHaveLength(32);
    for (const c of pal) {
      expect(c.r).toBeGreaterThanOrEqual(0);
      expect(c.r).toBeLessThanOrEqual(255);
    }
  });

  test('quantizeGrid 把每个色块换成最接近的调色板颜色', () => {
    const data = make(4, 1, (x) => (x < 2 ? [ 250, 5, 5, 255 ] : [ 5, 5, 250, 255 ]));
    const grid = buildGrid(data, 4, 1, 2); // 块 2 -> 2 个格子
    expect([ grid.gw, grid.gh ]).toEqual([ 2, 1 ]);
    quantizeGrid(grid, parsePalette('pico8'), false);
    expect(rgbToHex(gridColorAt(grid, 0, 0))).toBe('#FF004D');
    expect(rgbToHex(gridColorAt(grid, 1, 0))).toBe('#29ADFF');
  });

  test('quantizeGrid 开启抖动后小色数色板能出现两种颜色 (补层次)', () => {
    // 中间灰 (128,128,128) 在 Game Boy 4 色板里介于 $8BAC0F 与 $306230 之间
    const data = make(8, 8, () => [ 128, 128, 128, 255 ]);
    const plain = buildGrid(data, 8, 8, 2); // 4×4 色块 -> 正好覆盖整个 Bayer 矩阵
    quantizeGrid(plain, parsePalette('gameboy'), false);
    const dithered = buildGrid(data, 8, 8, 2);
    quantizeGrid(dithered, parsePalette('gameboy'), true);
    const colors = (g: typeof plain) => new Set(
      Array.from({ length: g.gw * g.gh }, (_, i) => rgbToHex(gridColorAt(g, i % g.gw, Math.floor(i / g.gw))))
    );
    expect(colors(plain).size).toBe(1);
    expect(colors(dithered).size).toBeGreaterThan(1);
  });

  test('quantizeGridBits 按位深量化 (2 位 -> 4 阶, 5 位 -> 32 阶)', () => {
    const data = make(1, 1, () => [ 100, 100, 100, 255 ]);
    const g2 = buildGrid(data, 1, 1, 1);
    quantizeGridBits(g2, 2, false); // 100 -> round(100/85)=1 -> 85
    expect(g2.rgb[0]).toBe(85);
    const g5 = buildGrid(data, 1, 1, 1);
    quantizeGridBits(g5, 5, false); // 5 位步长 255/31, 100 -> 96 左右
    expect(Math.abs(g5.rgb[0] - 100)).toBeLessThanOrEqual(4);
    // 非法位深不改数据
    const g0 = buildGrid(data, 1, 1, 1);
    quantizeGridBits(g0, 0, false);
    expect(g0.rgb[0]).toBe(100);
  });
});

describe('PixelArt 主流程', () => {
  test('块大小 8: 每个 8×8 块变成同一颜色', () => {
    const data = make(16, 16, (x) => (x < 8 ? [ 255, 0, 0, 255 ] : [ 0, 0, 255, 255 ]));
    const out = pixelArt(data, 16, 16, { block: 8, grayscale: false, palette: 'off' });
    expect(out).toHaveLength(16 * 16 * 4);
    expect(at(out, 16, 0, 0)).toEqual([ 255, 0, 0, 255 ]);
    expect(at(out, 16, 7, 15)).toEqual([ 255, 0, 0, 255 ]);
    expect(at(out, 16, 8, 0)).toEqual([ 0, 0, 255, 255 ]);
    expect(at(out, 16, 15, 15)).toEqual([ 0, 0, 255, 255 ]);
  });

  test('灰度开关: RGB 三通道相等', () => {
    const data = make(4, 4, () => [ 200, 100, 50, 255 ]);
    const gray = pixelArt(data, 4, 4, { block: 2, grayscale: true, palette: 'off' });
    expect(gray[0]).toBe(gray[1]);
    expect(gray[1]).toBe(gray[2]);
    const color = pixelArt(data, 4, 4, { block: 2, grayscale: false, palette: 'off' });
    expect(color[0]).not.toBe(color[2]);
  });

  test('调色板: 结果只使用调色板内的颜色', () => {
    const data = make(8, 8, (x, y) => [ (x * 30) % 256, (y * 30) % 256, 128, 255 ]);
    const out = pixelArt(data, 8, 8, { block: 2, palette: 'gameboy', dither: false });
    const allowed = new Set(PALETTE_DEFS.gameboy.colors.map((h) => rgbToHex(hexToRgb(h))));
    for (let i = 0; i + 3 < out.length; i += 4) {
      expect(allowed.has(rgbToHex({ r: out[i], g: out[i + 1], b: out[i + 2] }))).toBe(true);
    }
  });

  test('自适应调色板: 结果颜色数不超过设定上限', () => {
    const data = make(16, 16, (x, y) => [ x * 16, y * 16, 0, 255 ]);
    const out = pixelArt(data, 16, 16, { block: 1, palette: 'auto16' });
    const colors = new Set<string>();
    for (let i = 0; i + 3 < out.length; i += 4) colors.add(`${out[i]},${out[i + 1]},${out[i + 2]}`);
    expect(colors.size).toBeLessThanOrEqual(AUTO_COUNTS.auto16);
  });

  test('透明度保留: 全透明区域输出 α = 0', () => {
    const data = make(4, 4, (x) => (x < 2 ? [ 255, 0, 0, 255 ] : [ 0, 0, 0, 0 ]));
    const out = pixelArt(data, 4, 4, { block: 2, palette: 'off' });
    expect(at(out, 4, 0, 0)[3]).toBe(255);
    expect(at(out, 4, 2, 0)[3]).toBe(0);
  });
});

describe('PixelArt 快捷配置', () => {
  test('三种预设的参数都在需求给定的范围内', () => {
    // 人像照片: 像素大小 6~8, 不开灰度, 颜色较丰富的调色板
    expect(PRESET_DEFS.portrait.block).toBeGreaterThanOrEqual(6);
    expect(PRESET_DEFS.portrait.block).toBeLessThanOrEqual(8);
    expect(PRESET_DEFS.portrait.grayscale).toBe(false);
    expect(PRESET_DEFS.portrait.palette.startsWith('auto')).toBe(true);
    expect(paletteColorCount(PRESET_DEFS.portrait.palette)).toBeGreaterThanOrEqual(64);
    expect(PRESET_DEFS.portrait.dither).toBe(true);

    // 游戏素材: 像素大小 8~12, 经典主机调色板
    expect(PRESET_DEFS.game.block).toBeGreaterThanOrEqual(8);
    expect(PRESET_DEFS.game.block).toBeLessThanOrEqual(12);
    expect(PRESET_DEFS.game.grayscale).toBe(false);
    expect(PALETTE_DEFS[PRESET_DEFS.game.palette].group).toBe('retro');
    expect(PRESET_DEFS.game.dither).toBe(false);

    // 抽象创作: 像素大小 15~25, 开灰度, 关闭调色板
    expect(PRESET_DEFS.abstract.block).toBeGreaterThanOrEqual(15);
    expect(PRESET_DEFS.abstract.block).toBeLessThanOrEqual(25);
    expect(PRESET_DEFS.abstract.grayscale).toBe(true);
    expect(PRESET_DEFS.abstract.palette).toBe('off');
  });

  test('presetSettings: 非法 / custom 回退默认预设', () => {
    expect(presetSettings('game')).toEqual(PRESET_DEFS.game);
    expect(presetSettings('custom')).toEqual(PRESET_DEFS[PRESET_DEFAULT]);
    expect(presetSettings('nope')).toEqual(PRESET_DEFS[PRESET_DEFAULT]);
  });
});

describe('PixelArt 设置中心: 默认快捷配置', () => {
  test('默认 portrait; 写入后读取一致; 非法值回退', () => {
    expect(getDefaultPreset()).toBe('portrait');
    setDefaultPreset('abstract');
    expect(getDefaultPreset()).toBe('abstract');
    localStorage.setItem('pixelart:default-preset', 'bogus');
    expect(getDefaultPreset()).toBe(PRESET_DEFAULT);
    // custom 不是有效默认值, 写入后按默认预设落库
    setDefaultPreset('custom');
    expect(getDefaultPreset()).toBe(PRESET_DEFAULT);
  });

  test('initialSettings 由默认预设展开, 页面初始参数 = 该预设', () => {
    const init = initialSettings();
    expect(init.preset).toBe('portrait');
    expect(init.settings).toEqual(PRESET_DEFS.portrait);
    setDefaultPreset('game');
    expect(initialSettings()).toEqual({ preset: 'game', settings: PRESET_DEFS.game });
  });
});
