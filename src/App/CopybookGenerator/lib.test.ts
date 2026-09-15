import {
  buildGridHtml, buildGuideSvg, buildPageHtml, buildSheetCss, buildSheetHtml, buildSheetPages, cellSizeMm,
  cellStyle, cellsPerPage, defaultGridOf, fill, fillChars, fontFamilyOf, fontStack, gridSizeMm, normalizeCols,
  normalizeFont, normalizeLine, normalizeLoop, normalizeMode, normalizePages, normalizeRows, normalizeStyle,
  pageChunks, splitChars, totalCells,
} from './lib';
import {
  CELL_LINE_MM, CONTENT_MODE_LABEL, DEFAULT_GRID, FONTS, FONT_DEFAULT, GRID_STYLE_LABEL, LINE_COLOR_VALUE,
  LINE_COLOR_LABEL, TEXT_DEFAULT, TEXT_COLOR_GRAY, TEXT_COLOR_INK,
  type ContentMode, type GridStyle, type LineColor,
} from './data';

const text = {
  styleName: '米字格',
  fontName: '楷体',
  meta: '姓名: ________ 日期: ________',
  footer: '第 {a} / {b} 页 · {d}',
};

const options = (over: Partial<Parameters<typeof buildSheetPages>[0]> = {}) => ({
  style: 'mi' as GridStyle,
  line: 'red' as LineColor,
  mode: 'trace' as ContentMode,
  cols: 10,
  rows: 12,
  pages: 2,
  chars: fillChars(splitChars(TEXT_DEFAULT), 10 * 12 * 2, true),
  title: '字帖练习',
  showMeta: true,
  date: '2026-09-15',
  fontFamily: fontFamilyOf('楷体'),
  text,
  ...over,
});

describe('copybook lib / 文字拆分与填充', () => {
  test('splitChars 去掉空白与全角空格, 保留标点', () => {
    expect(splitChars('永和九年，岁在癸丑')).toEqual([ '永', '和', '九', '年', '，', '岁', '在', '癸', '丑' ]);
    expect(splitChars('a b\tc\u3000d')).toEqual([ 'a', 'b', 'c', 'd' ]);
    expect(splitChars('')).toEqual([]);
    expect(splitChars('   ')).toEqual([]);
  });

  test('splitChars 保留代理对 (emoji 不被拆开)', () => {
    expect(splitChars('汉字😀')).toEqual([ '汉', '字', '😀' ]);
  });

  test('fillChars: 循环 / 不循环 / 空文本', () => {
    expect(fillChars([ '甲', '乙' ], 5, true)).toEqual([ '甲', '乙', '甲', '乙', '甲' ]);
    expect(fillChars([ '甲', '乙' ], 5, false)).toEqual([ '甲', '乙', null, null, null ]);
    expect(fillChars([], 3, true)).toEqual([ null, null, null ]);
  });

  test('cellsPerPage / totalCells / pageChunks', () => {
    expect(cellsPerPage(10, 12)).toBe(120);
    expect(totalCells(10, 12, 2)).toBe(240);
    const filled = fillChars([ '甲', '乙' ], 240, true);
    const chunks = pageChunks(filled, 120, 2);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(120);
    expect(chunks[1]).toHaveLength(120);
    expect(chunks[0][0]).toBe('甲');
    expect(chunks[1][0]).toBe(chunks[0][0]); // 120 是 2 的整数倍, 第二页从同一个字开始
  });
});

describe('copybook lib / A4 版式', () => {
  test('格子尺寸不超出可用区域', () => {
    const cell = cellSizeMm(10, 12);
    expect(cell).toBeGreaterThan(10);
    expect(cell * 10).toBeLessThanOrEqual(186.01);
    expect(cell * 12).toBeLessThanOrEqual(253.01);
    expect(cellSizeMm(10, 12)).toBe(18.6);
  });

  test('行列越多格子越小, 且取宽高较小者', () => {
    expect(cellSizeMm(10, 12)).toBeGreaterThan(cellSizeMm(20, 12));
    expect(cellSizeMm(10, 20)).toBeLessThan(cellSizeMm(10, 12));
    // 20 列时由宽度限制: 186 / 20 = 9.3
    expect(cellSizeMm(20, 5)).toBe(9.3);
    // 行数很多时由高度限制: 253 / 25 = 10.12 -> 10.1
    expect(cellSizeMm(5, 25)).toBe(10.1);
  });

  test('gridSizeMm = 单格 × 行列数', () => {
    const cell = cellSizeMm(10, 12);
    const size = gridSizeMm(10, 12);
    expect(size.width).toBeCloseTo(cell * 10, 2);
    expect(size.height).toBeCloseTo(cell * 12, 2);
  });

  test('cellStyle: 末列 / 末行补右边线与下边线', () => {
    const color = LINE_COLOR_VALUE.red;
    const inner = cellStyle(10, 12, 0, 0, 18.6, color);
    expect(inner).toContain(`border-top:${CELL_LINE_MM}mm solid ${color}`);
    expect(inner).toContain('border-left:');
    expect(inner).not.toContain('border-right:');
    expect(inner).not.toContain('border-bottom:');
    const corner = cellStyle(10, 12, 11, 9, 18.6, color);
    expect(corner).toContain('border-right:');
    expect(corner).toContain('border-bottom:');
  });
});

describe('copybook lib / 格线 SVG', () => {
  test('米字格含横竖中线与两条对角线', () => {
    const svg = buildGuideSvg('mi', '#d98a8a', 18.6);
    expect(svg).toContain('M50 0V100');
    expect(svg).toContain('M0 50H100');
    expect(svg).toContain('M0 0L100 100');
    expect(svg).toContain('M100 0L0 100');
  });

  test('田字格只有横竖中线', () => {
    const svg = buildGuideSvg('tian', '#d98a8a', 18.6);
    expect(svg).toContain('M50 0V100');
    expect(svg).toContain('M0 50H100');
    expect(svg).not.toContain('L100 100');
  });

  test('回宫格含虚线内框与四段连接线', () => {
    const svg = buildGuideSvg('hui', '#d98a8a', 18.6);
    expect(svg).toContain('M25 25H75V75H25Z');
    expect(svg).toContain('stroke-dasharray="4 3"');
    expect(svg).toContain('M50 0V25');
    expect(svg).toContain('M50 75V100');
    expect(svg).toContain('M0 50H25');
    expect(svg).toContain('M75 50H100');
  });

  test('作文格无辅助线', () => {
    expect(buildGuideSvg('zuowen', '#d98a8a', 18.6)).toBe('');
  });
});

describe('copybook lib / 页面 HTML', () => {
  test('trace 模式: 每格都有浅灰字', () => {
    const html = buildGridHtml({
      style: 'mi', line: 'red', mode: 'trace', cols: 10, rows: 12,
      chars: fillChars([ '永' ], 120, true), fontFamily: fontFamilyOf('楷体'),
    });
    expect((html.match(/class="cb-ch"/g) ?? []).length).toBe(120);
    expect(html).toContain(`color:${TEXT_COLOR_GRAY}`);
    expect(html).toContain('class="cb-cell"');
    expect(html).toContain('13.39mm'); // 18.6 * 0.72
  });

  test('ink 模式用近黑色', () => {
    const html = buildGridHtml({
      style: 'tian', line: 'gray', mode: 'ink', cols: 4, rows: 3,
      chars: fillChars([ '永', '和' ], 12, true), fontFamily: fontFamilyOf('宋体'),
    });
    expect(html).toContain(`color:${TEXT_COLOR_INK}`);
    expect(html).toContain('SimSun');
  });

  test('demo 模式只在每行首格显示范字', () => {
    const html = buildGridHtml({
      style: 'mi', line: 'red', mode: 'demo', cols: 5, rows: 3,
      chars: fillChars([ '永', '和', '九' ], 15, true), fontFamily: fontFamilyOf('楷体'),
    });
    expect((html.match(/class="cb-ch"/g) ?? []).length).toBe(3); // 3 行各一个
  });

  test('blank 模式没有文字', () => {
    const html = buildGridHtml({
      style: 'zuowen', line: 'gray', mode: 'blank', cols: 5, rows: 3,
      chars: fillChars([ '永' ], 15, true), fontFamily: fontFamilyOf('楷体'),
    });
    expect(html).not.toContain('cb-ch');
    expect((html.match(/class="cb-row"/g) ?? []).length).toBe(3);
  });

  test('空格 (null) 不产生文字', () => {
    const html = buildGridHtml({
      style: 'mi', line: 'red', mode: 'trace', cols: 4, rows: 2,
      chars: [ '甲', null, '乙', null, null, null, null, null ], fontFamily: fontFamilyOf('楷体'),
    });
    expect((html.match(/class="cb-ch"/g) ?? []).length).toBe(2);
  });

  test('页面含标题 / 页眉 / 页脚, 页数正确', () => {
    const pages = buildSheetPages(options());
    expect(pages).toHaveLength(2);
    expect(pages[0]).toContain('class="pg cb-pg"');
    expect(pages[0]).toContain('字帖练习');
    expect(pages[0]).toContain('米字格 · 楷体');
    expect(pages[0]).toContain('第 1 / 2 页 · 2026-09-15');
    expect(pages[1]).toContain('第 2 / 2 页 · 2026-09-15');

    const one = buildSheetPages(options({ pages: 1, showMeta: false }));
    expect(one).toHaveLength(1);
    expect(one[0]).not.toContain(text.meta);
    expect(buildPageHtml(options(), 1, 1)).toContain('第 1 / 1 页');
  });

  test('buildSheetHtml 拼接所有页; 每页格数 = 行列乘积', () => {
    const html = buildSheetHtml(options({ pages: 3, cols: 4, rows: 3 }));
    expect((html.match(/class="pg cb-pg"/g) ?? []).length).toBe(3);
    expect((html.match(/class="cb-cell"/g) ?? []).length).toBe(36);
  });

  test('每页字符不同 (按页切片)', () => {
    const chars = fillChars(splitChars('甲乙丙丁'), 4 * 3 * 2, false);
    const pages = buildSheetPages(options({ cols: 4, rows: 3, pages: 2, chars, mode: 'ink' }));
    expect((pages[0].match(/class="cb-ch"/g) ?? []).length).toBe(4);   // 第一页 4 个字
    expect((pages[1].match(/class="cb-ch"/g) ?? []).length).toBe(0);   // 第二页没有字
  });

  test('buildSheetCss: 自定义字体时内嵌 @font-face', () => {
    const base = buildSheetCss(null);
    expect(base).toContain('@page { size: A4 portrait; margin: 0; }');
    expect(base).toContain('.cb-cell');
    expect(base).not.toContain('@font-face');
    const custom = buildSheetCss({ data: 'data:font/ttf;base64,AAAA' });
    expect(custom).toContain('@font-face');
    expect(custom).toContain('CopybookCustom');
    expect(custom).toContain('data:font/ttf;base64,AAAA');
  });

  test('fontStack / fontFamilyOf', () => {
    expect(fontFamilyOf('楷体')).toContain('KaiTi');
    expect(fontFamilyOf('不存在')).toBe(fontFamilyOf(FONT_DEFAULT));
    expect(fontFamilyOf('微软雅黑')).toContain('Microsoft YaHei');
    expect(fontStack('楷体', true)).toContain('CopybookCustom');
    expect(fontStack('楷体', false)).not.toContain('CopybookCustom');
  });

  test('fill 模板替换', () => {
    expect(fill('第 {a} / {b} 页 · {d}', { a: 1, b: 2, d: 'x' })).toBe('第 1 / 2 页 · x');
  });
});

describe('copybook lib / 常量与归一化', () => {
  test('格型 / 颜色 / 模式标签齐全', () => {
    for (const s of Object.keys(GRID_STYLE_LABEL) as GridStyle[]) {
      expect(GRID_STYLE_LABEL[s].length).toBeGreaterThan(0);
      expect(DEFAULT_GRID[s].cols).toBeGreaterThan(0);
      expect(DEFAULT_GRID[s].rows).toBeGreaterThan(0);
    }
    for (const c of Object.keys(LINE_COLOR_VALUE) as LineColor[]) {
      expect(LINE_COLOR_VALUE[c]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(LINE_COLOR_LABEL[c].length).toBeGreaterThan(0);
    }
    for (const m of Object.keys(CONTENT_MODE_LABEL) as ContentMode[]) {
      expect(CONTENT_MODE_LABEL[m].length).toBeGreaterThan(0);
    }
    expect(FONTS.map((f) => f.label)).toContain(FONT_DEFAULT);
  });

  test('defaultGridOf 返回格型默认行列', () => {
    expect(defaultGridOf('zuowen')).toEqual({ cols: 15, rows: 20 });
    expect(defaultGridOf('mi')).toEqual({ cols: 10, rows: 12 });
  });

  test('normalize* 归一化非法输入', () => {
    expect(normalizeStyle('hui')).toBe('hui');
    expect(normalizeStyle('nope')).toBe('mi');
    expect(normalizeStyle(null)).toBe('mi');

    expect(normalizeFont('宋体')).toBe('宋体');
    expect(normalizeFont('Comic Sans')).toBe(FONT_DEFAULT);
    expect(normalizeFont(7)).toBe(FONT_DEFAULT);

    expect(normalizeLine('blue')).toBe('blue');
    expect(normalizeLine('purple')).toBe('red');

    expect(normalizeMode('blank')).toBe('blank');
    expect(normalizeMode('x')).toBe('trace');

    expect(normalizeCols(10)).toBe(10);
    expect(normalizeCols(2)).toBe(4);
    expect(normalizeCols(99)).toBe(24);
    expect(normalizeCols('')).toBe(10);
    expect(normalizeCols('abc')).toBe(10);
    expect(normalizeCols(5.6)).toBe(6);

    expect(normalizeRows(0)).toBe(3);
    expect(normalizeRows(30)).toBe(24);
    expect(normalizeRows(8.4)).toBe(8);

    expect(normalizePages(0)).toBe(1);
    expect(normalizePages(99)).toBe(10);
    expect(normalizePages(3)).toBe(3);

    expect(normalizeLoop('0')).toBe(false);
    expect(normalizeLoop('false')).toBe(false);
    expect(normalizeLoop(false)).toBe(false);
    expect(normalizeLoop('1')).toBe(true);
    expect(normalizeLoop(undefined)).toBe(true);
  });
});
