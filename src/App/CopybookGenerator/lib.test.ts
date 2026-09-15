import {
  buildGridHtml, buildGuideSvg, buildPageHtml, buildSheetCss, buildSheetHtml, buildSheetPages, cellSizeMm,
  cellStyle, cellsPerPage, defaultGridOf, fill, fillChars, fillCharsByRow, fontFamilyOf, fontStack,
  getDefaultByRow, getDefaultCols, getDefaultGap, getDefaultLoop, getDefaultPages, getDefaultRows, getDefaultText,
  gridSizeMm, inkNudge, measureInkOffsets, normalizeCols, normalizeFont, normalizeGap, normalizeLine,
  normalizeLoop, normalizeMode, normalizePages, normalizeRows, normalizeStyle, pageChunks,
  setDefaultByRow, setDefaultCols, setDefaultGap, setDefaultLoop, setDefaultPages, setDefaultRows, splitChars,
  totalCells,
  type InkOffset,
} from './lib';
import {
  CELL_LINE_MM, CONTENT_MODE_LABEL, COLS_DEFAULT, DEFAULT_GRID, FONTS, FONT_DEFAULT, GAP_DEFAULT, GAP_MAX,
  GRID_STYLE_LABEL, KEY_BY_ROW, LINE_COLORS, LINE_COLOR_VALUE, LINE_COLOR_LABEL, PAGES_DEFAULT, ROWS_DEFAULT,
  TEXT_DEFAULT, TEXT_COLOR_GRAY, TEXT_COLOR_INK,
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

describe('copybook lib / 按行填充 (一行练一个字)', () => {
  test('同一行重复同一个字, 第 N 行用第 N 个字', () => {
    const out = fillCharsByRow([ '永', '和', '九' ], 3, 3, 1, false);
    expect(out).toEqual([
      '永', '永', '永',
      '和', '和', '和',
      '九', '九', '九',
    ]);
  });

  test('行数超过字数: loop 决定循环还是留空', () => {
    expect(fillCharsByRow([ '永', '和' ], 2, 4, 1, true)).toEqual([
      '永', '永', '和', '和', '永', '永', '和', '和',
    ]);
    expect(fillCharsByRow([ '永', '和' ], 2, 4, 1, false)).toEqual([
      '永', '永', '和', '和', null, null, null, null,
    ]);
  });

  test('多页时行号连续 (第二页不从头开始)', () => {
    const out = fillCharsByRow([ '甲', '乙', '丙' ], 2, 2, 2, false);
    expect(out).toEqual([ '甲', '甲', '乙', '乙', '丙', '丙', null, null ]);
    expect(out).toHaveLength(totalCells(2, 2, 2));
  });

  test('空文本 / 零列: 不报错也不产生脏数据', () => {
    expect(fillCharsByRow([], 2, 2, 1, true)).toEqual([ null, null, null, null ]);
    expect(fillCharsByRow([ '永' ], 0, 3, 1, true)).toEqual([]);
  });

  test('按行填充能直接喂给 buildGridHtml (每行首格与末格相同)', () => {
    const chars = fillCharsByRow(splitChars('永和'), 4, 2, 1, false);
    const html = buildGridHtml({
      style: 'mi', line: 'red', mode: 'ink', cols: 4, rows: 2, chars,
      fontFamily: fontFamilyOf('楷体'),
    });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const rows = Array.from(doc.querySelectorAll('.cb-row'));
    expect(rows).toHaveLength(2);
    const texts = rows.map((r) => Array.from(r.querySelectorAll('.cb-ch')).map((s) => s.textContent));
    expect(texts[0]).toEqual([ '永', '永', '永', '永' ]);
    expect(texts[1]).toEqual([ '和', '和', '和', '和' ]);
  });
});

describe('copybook lib / 墨迹视觉居中', () => {
  test('inkNudge: 偏移换算为反向 transform (单位 mm, 保留两位小数)', () => {
    expect(inkNudge({ dx: 0, dy: 0 }, 13.4)).toBe('');
    expect(inkNudge(undefined, 13.4)).toBe('');
    // 墨迹偏右 5% em → 向左平移 5% 字号
    expect(inkNudge({ dx: 0.05, dy: 0 }, 20)).toBe(';transform:translate(-1.00mm,0.00mm)');
    expect(inkNudge({ dx: -0.05, dy: 0.025 }, 20)).toBe(';transform:translate(1.00mm,-0.50mm)');
  });

  test('buildGridHtml: 有偏移表时每个字都带 transform, 无表时不带', () => {
    const ink = new Map<string, InkOffset>([
      [ '落', { dx: 0.06, dy: 0.01 } ],
      [ '霞', { dx: 0.02, dy: 0.01 } ],
    ]);
    const base = {
      style: 'mi' as GridStyle, line: 'red' as LineColor, mode: 'ink' as ContentMode,
      cols: 2, rows: 1, chars: [ '落', '霞' ], fontFamily: fontFamilyOf('楷体'),
    };
    const plain = buildGridHtml(base);
    expect(plain).not.toContain('transform');

    const nudged = buildGridHtml({ ...base, ink });
    const doc = new DOMParser().parseFromString(nudged, 'text/html');
    const spans = Array.from(doc.querySelectorAll('.cb-ch'));
    expect(spans.map((s) => s.getAttribute('style'))).toEqual([
      expect.stringContaining('transform:translate('),
      expect.stringContaining('transform:translate('),
    ]);
    // 字形偏右 → 必须向左平移 (负值)
    const fontSize = cellSizeMm(2, 1, 0) * 0.72;
    expect(spans[0].getAttribute('style')).toContain(`translate(${(-0.06 * fontSize).toFixed(2)}mm`);
    expect(spans[1].getAttribute('style')).toContain(`translate(${(-0.02 * fontSize).toFixed(2)}mm`);
  });

  test('buildGridHtml: 偏移表里没有的字不受影响', () => {
    const ink = new Map<string, InkOffset>([ [ '落', { dx: 0.05, dy: 0 } ] ]);
    const html = buildGridHtml({
      style: 'mi', line: 'red', mode: 'ink', cols: 2, rows: 1, chars: [ '落', '一' ],
      fontFamily: fontFamilyOf('楷体'), ink,
    });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const spans = Array.from(doc.querySelectorAll('.cb-ch'));
    expect(spans[0].getAttribute('style')).toContain('transform:translate(');
    expect(spans[1].getAttribute('style')).not.toContain('transform');
  });

  test('measureInkOffsets: 无 canvas 环境返回空表而不抛错 (jsdom)', () => {
    const out = measureInkOffsets(fontFamilyOf('楷体'), [ '永', '永', '和' ]);
    expect(out).toBeInstanceOf(Map);
    expect(out.size).toBe(0);
  });

  test('measureInkOffsets: 接受缓存版本号 (换字体后可作废缓存)', () => {
    // jsdom 下始终返回空表, 这里只验证签名与不抛错 (版本号参与缓存 key)
    expect(() => measureInkOffsets(fontFamilyOf('楷体'), [ '永' ], 1)).not.toThrow();
    expect(measureInkOffsets(fontFamilyOf('楷体'), [ '永' ], 2).size).toBe(0);
  });

  test('墨迹偏移会随 buildSheetHtml 一起进入打印页', () => {
    const ink = new Map<string, InkOffset>([ [ '永', { dx: 0.05, dy: 0.02 } ] ]);
    const html = buildSheetHtml({
      style: 'mi', line: 'red', mode: 'ink', cols: 2, rows: 1, pages: 1,
      chars: [ '永', '永' ], title: '字帖练习', showMeta: true, date: '2026-09-15',
      fontFamily: fontFamilyOf('楷体'), text, ink,
    });
    expect((html.match(/transform:translate\(/g) ?? [])).toHaveLength(2);
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

describe('copybook lib / 格间距', () => {
  const color = LINE_COLOR_VALUE.red;

  test('间隔为 0 时相邻格共用一条线 (不带完整 border)', () => {
    const s = cellStyle(10, 12, 0, 0, 18.6, color, 0);
    expect(s).not.toContain('border-right');
    expect(s).not.toContain('border-bottom');
    expect(s).not.toContain(`border:${CELL_LINE_MM}mm`);
  });

  test('间隔大于 0 时每格四边都画线', () => {
    const s = cellStyle(10, 12, 0, 0, 16.8, color, 2);
    expect(s).toContain(`border:${CELL_LINE_MM}mm solid ${color}`);
  });

  test('单格尺寸给间隔让出空间, 整格宽度仍不超出可用区域', () => {
    expect(cellSizeMm(10, 12, 0)).toBe(18.6);
    expect(cellSizeMm(10, 12, 2)).toBe(16.8); // (186 - 2 × 9) / 10
    expect(gridSizeMm(10, 12, 2).width).toBeLessThanOrEqual(186.01);
    expect(gridSizeMm(10, 12, 2).height).toBeLessThanOrEqual(253.01);
  });

  test('gridSizeMm 计入间隔: 单格 × 格数 + 间隔 × 间隙数', () => {
    const cell = cellSizeMm(10, 12, 2);
    const size = gridSizeMm(10, 12, 2);
    expect(size.width).toBeCloseTo(cell * 10 + 2 * 9, 2);
    expect(size.height).toBeCloseTo(cell * 12 + 2 * 11, 2);
  });

  test('buildGridHtml 把间隔写进行 / 网格的内联样式', () => {
    const html = buildGridHtml({
      style: 'mi', line: 'red', mode: 'trace', cols: 10, rows: 12,
      chars: fillChars([ '永' ], 120, true), fontFamily: fontFamilyOf('楷体'), gap: 2,
    });
    expect(html).toContain('gap:2mm');
    expect((html.match(/gap:2mm/g) ?? []).length).toBe(1 + 12); // 网格 1 处 + 每行 1 处
    expect(html).toContain(`border:${CELL_LINE_MM}mm solid ${color}`);
    expect(html).toContain('width:186mm');
  });

  test('buildGridHtml 默认无间隔 (与旧版输出一致)', () => {
    const html = buildGridHtml({
      style: 'tian', line: 'gray', mode: 'blank', cols: 4, rows: 3,
      chars: fillChars([], 12, true), fontFamily: fontFamilyOf('宋体'),
    });
    expect(html).not.toContain('gap:');
  });

  test('页面 HTML 透传间隔', () => {
    const html = buildSheetHtml(options({ cols: 4, rows: 3, pages: 1, gap: 3 }));
    expect(html).toContain('gap:3mm');
  });
});

describe('copybook lib / 默认值 (回归: 未保存设置时必须回退到常量默认值)', () => {
  beforeEach(() => { localStorage.clear(); });

  test('未保存设置时 getDefault* 取常量默认值, 而不是范围下限', () => {
    expect(getDefaultCols()).toBe(COLS_DEFAULT);
    expect(getDefaultCols()).toBe(10);
    expect(getDefaultRows()).toBe(ROWS_DEFAULT);
    expect(getDefaultRows()).toBe(12);
    expect(getDefaultPages()).toBe(PAGES_DEFAULT);
    expect(getDefaultGap()).toBe(GAP_DEFAULT);
    expect(getDefaultText()).toBe('');
    expect(getDefaultText() || TEXT_DEFAULT).toBe(TEXT_DEFAULT);
  });

  test('normalize* 对 null / undefined 回退到常量默认值 (Number(null) 是 0)', () => {
    expect(normalizeCols(null)).toBe(COLS_DEFAULT);
    expect(normalizeCols(undefined)).toBe(COLS_DEFAULT);
    expect(normalizeRows(null)).toBe(ROWS_DEFAULT);
    expect(normalizeRows(undefined)).toBe(ROWS_DEFAULT);
    expect(normalizePages(null)).toBe(PAGES_DEFAULT);
    expect(normalizePages(undefined)).toBe(PAGES_DEFAULT);
    expect(normalizeGap(null)).toBe(GAP_DEFAULT);
    expect(normalizeGap(undefined)).toBe(GAP_DEFAULT);
  });

  test('保存后能读回保存值, 越界值仍被归一化', () => {
    setDefaultCols(12);
    setDefaultRows(8);
    setDefaultPages(3);
    setDefaultGap(2.5);
    expect(getDefaultCols()).toBe(12);
    expect(getDefaultRows()).toBe(8);
    expect(getDefaultPages()).toBe(3);
    expect(getDefaultGap()).toBe(2.5);
    setDefaultGap(99);
    expect(getDefaultGap()).toBe(GAP_MAX);
    setDefaultGap(-1);
    expect(getDefaultGap()).toBe(GAP_DEFAULT);
  });

  test('默认文本为「落霞与孤鹜齐飞秋水共长天一色」', () => {
    expect(TEXT_DEFAULT).toBe('落霞与孤鹜齐飞秋水共长天一色');
    expect(splitChars(TEXT_DEFAULT)).toHaveLength(14);
    expect(splitChars(TEXT_DEFAULT)[0]).toBe('落');
  });

  test('循环填充默认开 / 按行填充默认关, 保存后能读回', () => {
    expect(getDefaultLoop()).toBe(true);
    expect(getDefaultByRow()).toBe(false);
    setDefaultLoop(false);
    setDefaultByRow(true);
    expect(getDefaultLoop()).toBe(false);
    expect(getDefaultByRow()).toBe(true);
    setDefaultLoop(true);
    setDefaultByRow(false);
    expect(getDefaultLoop()).toBe(true);
    expect(getDefaultByRow()).toBe(false);
  });

  test('保存的按行填充为脏值时归一化为布尔', () => {
    localStorage.setItem(KEY_BY_ROW, '0');
    expect(getDefaultByRow()).toBe(false);
    localStorage.setItem(KEY_BY_ROW, 'false');
    expect(getDefaultByRow()).toBe(false);
    localStorage.setItem(KEY_BY_ROW, '1');
    expect(getDefaultByRow()).toBe(true);
    localStorage.setItem(KEY_BY_ROW, 'yes');
    expect(getDefaultByRow()).toBe(true);
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

  test('字体栈写入 style 属性时必须转义双引号 (否则属性被截断, 上传的字体不生效)', () => {
    const html = buildGridHtml({
      style: 'mi', line: 'red', mode: 'ink', cols: 4, rows: 3,
      chars: fillChars([ '永' ], 12, true), fontFamily: fontStack('楷体', true),
    });
    // 原始 HTML 里不能出现未转义的双引号 (会把 style 属性提前截断)
    expect(html).toContain('font-family:&quot;CopybookCustom&quot;');
    expect(html).not.toContain('font-family:"CopybookCustom"');

    // 用 DOM 解析回来验证: style 属性完整且没有多出垃圾属性
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    const spans = Array.from(doc.querySelectorAll('.cb-ch'));
    expect(spans).toHaveLength(12);
    for (const sp of spans) {
      expect(sp.getAttributeNames().sort()).toEqual([ 'class', 'style' ]);
      expect(sp.getAttribute('style')).toContain('font-family:"CopybookCustom", KaiTi');
    }
  });

  test('内置字体同样要转义 (fontStack 里的 "Kaiti SC" / "Songti SC" 也带引号)', () => {
    const html = buildGridHtml({
      style: 'tian', line: 'red', mode: 'ink', cols: 4, rows: 3,
      chars: fillChars([ '永' ], 12, true), fontFamily: fontStack('楷体', false),
    });
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    const sp = doc.querySelector('.cb-ch')!;
    expect(sp.getAttributeNames().sort()).toEqual([ 'class', 'style' ]);
    expect(sp.getAttribute('style')).toContain('font-family:KaiTi, STKaiti, "Kaiti SC"');
  });

  test('标题 / 自定义字体名 / 页脚中的 HTML 特殊字符会被转义', () => {
    const html = buildPageHtml(options({ title: '字帖 <b>x</b> & "y"' }), 1, 1);
    expect(html).not.toContain('<b>x</b>');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
    expect(html).toContain('&amp;');

    const named = options({ text: { ...text, fontName: 'My<Font>&.ttf' } });
    const page = buildPageHtml(named, 1, 1);
    expect(page).toContain('My&lt;Font&gt;&amp;.ttf');
    expect(page).not.toContain('My<Font>&.ttf');
  });

  test('fill 模板替换', () => {
    expect(fill('第 {a} / {b} 页 · {d}', { a: 1, b: 2, d: 'x' })).toBe('第 1 / 2 页 · x');
  });
});

describe('copybook lib / 常量与归一化', () => {
  test('淡绿格线可以实际用于渲染', () => {
    const html = buildGridHtml({
      style: 'tian', line: 'green', mode: 'trace', cols: 4, rows: 3,
      chars: fillChars([ '永' ], 12, true), fontFamily: fontFamilyOf('楷体'),
    });
    expect(html).toContain(LINE_COLOR_VALUE.green);
    expect(html).not.toContain(LINE_COLOR_VALUE.red);
  });

  test('格型 / 颜色 / 模式标签齐全', () => {
    for (const s of Object.keys(GRID_STYLE_LABEL) as GridStyle[]) {
      expect(GRID_STYLE_LABEL[s].length).toBeGreaterThan(0);
      expect(DEFAULT_GRID[s].cols).toBeGreaterThan(0);
      expect(DEFAULT_GRID[s].rows).toBeGreaterThan(0);
    }
    for (const c of Object.keys(LINE_COLOR_VALUE) as LineColor[]) {
      expect(LINE_COLOR_VALUE[c]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(LINE_COLOR_LABEL[c].length).toBeGreaterThan(0);
      // 格线必须够浅 (每通道 >= 0x80), 否则打印后压过学生的笔画
      for (const ch of LINE_COLOR_VALUE[c].slice(1).match(/../g) ?? []) {
        expect(parseInt(ch, 16)).toBeGreaterThanOrEqual(0x80);
      }
    }
    expect(LINE_COLORS).toContain('green');
    expect(LINE_COLOR_LABEL.green).toBe('淡绿');
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
    expect(normalizeLine('green')).toBe('green');
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
