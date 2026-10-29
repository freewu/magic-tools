// 格子纸: 版式计算 / SVG 绘制 / 打印文档 / 参数归一化 单测
import {
  CELL_DEFAULT, CELL_MAX, CELL_MIN, INK_DEFAULT, INK_VALUE, LINE_DEFAULT, LINE_MAX, LINE_MIN, MAJOR_MAX,
  MARGIN_DEFAULT, MARGIN_MAX, PAGES_DEFAULT, PAGES_MAX, PAPER_DEFAULT,
  type GridOptions,
} from './data';
import {
  buildDocumentCss, buildDocumentHtml, buildPageSvg, buildPageSvgs, clampNum, documentName, getDefaultOptions,
  gridSegments, layoutOf, normalizeCell, normalizeInk, normalizeLineWidth, normalizeMajor, normalizeMargin,
  normalizeOptions, normalizeOrientation, normalizePages, normalizePaper, normalizePattern, paperSpec,
  setDefaultOptions,
} from './lib';

/** 基准参数: A4 纵向 5mm 方格, 边距 10mm → 38 × 55 格 */
const BASE: GridOptions = {
  paper: 'A4', orientation: 'portrait', pattern: 'grid', ink: 'gray',
  cell: 5, margin: 10, lineWidth: 0.2, pages: 1, major: 0,
};

const opts = (p: Partial<GridOptions> = {}): GridOptions => ({ ...BASE, ...p });

describe('GridPaper 纸张尺寸', () => {
  test('A3 / A4 / B5 / B6 纵向尺寸符合 ISO 216', () => {
    expect(paperSpec('A3', 'portrait')).toEqual({ w: 297, h: 420 });
    expect(paperSpec('A4', 'portrait')).toEqual({ w: 210, h: 297 });
    expect(paperSpec('B5', 'portrait')).toEqual({ w: 176, h: 250 });
    expect(paperSpec('B6', 'portrait')).toEqual({ w: 125, h: 176 });
  });

  test('横向时宽高互换', () => {
    expect(paperSpec('A4', 'landscape')).toEqual({ w: 297, h: 210 });
    expect(paperSpec('B6', 'landscape')).toEqual({ w: 176, h: 125 });
  });

  test('未知纸张回退 A4', () => {
    expect(paperSpec('A5' as never, 'portrait')).toEqual({ w: 210, h: 297 });
  });
});

describe('GridPaper 版式计算', () => {
  test('A4 纵向 + 5mm 格 + 10mm 边距 → 38 × 55 格, 网格居中', () => {
    const L = layoutOf(opts());
    expect(L.cols).toBe(38); // 190 / 5
    expect(L.rows).toBe(55); // 277 / 5 = 55.4 → 55
    expect(L.count).toBe(38 * 55);
    expect(L.gridW).toBe(190);
    expect(L.gridH).toBe(275);
    expect(L.x).toBe(10);
    expect(L.y).toBe(11); // (297 - 275) / 2, 多出的 2mm 两侧各 1mm
  });

  test('10mm 格: 列数变少, 边距居中后左右各留 10mm', () => {
    const L = layoutOf(opts({ cell: 10 }));
    expect(L.cols).toBe(19); // 190 / 10
    expect(L.rows).toBe(27); // 277 / 10 = 27.7 → 27
    expect(L.x).toBe(10);
    expect(L.y).toBe(13.5); // (297 - 270) / 2
  });

  test('横向 A4 列/行数互换', () => {
    const L = layoutOf(opts({ orientation: 'landscape' }));
    expect(L.w).toBe(297);
    expect(L.h).toBe(210);
    expect(L.cols).toBe(55);
    expect(L.rows).toBe(38);
  });

  test('B5 比 A4 少格, B6 更少', () => {
    const b5 = layoutOf(opts({ paper: 'B5' }));
    expect(b5.cols).toBe(31); // 156 / 5
    expect(b5.rows).toBe(46); // 230 / 5
    const b6 = layoutOf(opts({ paper: 'B6' }));
    expect(b6.cols).toBe(21); // (125 - 20) / 5
    expect(b6.rows).toBe(31); // (176 - 20) / 5 = 31.2 → 31
  });

  test('格子大小会被夹到合法区间', () => {
    expect(layoutOf(opts({ cell: 1 })).cell).toBe(CELL_MIN);
    expect(layoutOf(opts({ cell: 999 })).cell).toBe(CELL_MAX);
  });

  test('边距过大时最多吃掉短边的 1/4, 仍能排出至少一格', () => {
    const L = layoutOf(opts({ margin: 999 }));
    expect(L.cols).toBe(21); // 可用宽 210 - 105 = 105 → 21
    expect(L.rows).toBeGreaterThan(0);
  });
});

describe('GridPaper 网格线段', () => {
  test('方格: 竖线 cols+1 条 + 横线 rows+1 条', () => {
    const L = layoutOf(opts());
    const seg = gridSegments(L, 'grid', 0);
    expect(seg.minor).toHaveLength(39 + 56);
    expect(seg.major).toHaveLength(0);
    expect(seg.minor[0]).toBe('M10 11V286'); // 第一条竖线: x=10, y 从 11 到 286
    expect(seg.minor[39]).toBe('M10 11H200'); // 第一条横线: x 从 10 到 200
  });

  test('横线格型只画横线', () => {
    const L = layoutOf(opts());
    const seg = gridSegments(L, 'lines', 0);
    expect(seg.minor).toHaveLength(56);
    expect(seg.minor.every((d) => d.includes('H'))).toBe(true);
  });

  test('加粗间隔: 每 N 格分出一条加粗线 (边界线也算)', () => {
    const L = layoutOf(opts({ major: 5 }));
    const seg = gridSegments(L, 'grid', 5);
    // 竖线 0,5,…,35 → 8 条; 横线 0,5,…,55 → 12 条
    expect(seg.major).toHaveLength(8 + 12);
    expect(seg.minor).toHaveLength(95 - 20);
  });

  test('加粗间隔 0 / 负数 = 关闭', () => {
    const L = layoutOf(opts());
    expect(gridSegments(L, 'grid', 0).major).toHaveLength(0);
    expect(gridSegments(L, 'grid', -3).major).toHaveLength(0);
  });
});

describe('GridPaper SVG 绘制', () => {
  test('尺寸用 mm, viewBox 与 mm 1:1, 并带数据属性', () => {
    const svg = buildPageSvg(opts());
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg).toContain('width="210mm" height="297mm"');
    expect(svg).toContain('viewBox="0 0 210 297"');
    expect(svg).toContain('data-paper="A4"');
    expect(svg).toContain('data-orientation="portrait"');
    expect(svg).toContain('data-pattern="grid"');
    expect(svg).toContain('data-cols="38" data-rows="55"');
    expect(svg).toContain('data-page="1"');
  });

  test('线色 / 线宽进入描边属性', () => {
    const svg = buildPageSvg(opts({ ink: 'blue', lineWidth: 0.3 }));
    expect(svg).toContain(`stroke="${INK_VALUE.blue}"`);
    expect(svg).toContain('stroke-width="0.3"');
  });

  test('加粗线用更粗的描边单独输出', () => {
    const svg = buildPageSvg(opts({ ink: 'red', lineWidth: 0.2, major: 5 }));
    expect(svg).toContain(`stroke="${INK_VALUE.red}" stroke-width="0.2"`);
    expect(svg).toContain('stroke-width="0.38"'); // 0.2 × 1.9
    expect((svg.match(/<path /g) || [])).toHaveLength(2);
  });

  test('点阵用 pattern 铺圆点, 不画 path', () => {
    const svg = buildPageSvg(opts({ pattern: 'dots' }), 2);
    expect(svg).toContain('<pattern id="gp-dots-2"');
    expect(svg).toContain('patternTransform="translate(10 11)"');
    expect((svg.match(/<circle /g) || [])).toHaveLength(4); // 每格 4 个 1/4 圆
    expect(svg).toContain('fill="url(#gp-dots-2)"');
    expect(svg).not.toContain('<path');
  });

  test('横线格型不产生竖线 path 命令', () => {
    const svg = buildPageSvg(opts({ pattern: 'lines' }));
    const d = /d="([^"]+)"/.exec(svg)?.[1] ?? '';
    expect(d.includes('V')).toBe(false);
    expect(d.includes('H')).toBe(true);
  });

  test('多页: 页数决定 SVG 个数, 页码从 1 开始', () => {
    const svgs = buildPageSvgs(opts({ pages: 3 }));
    expect(svgs).toHaveLength(3);
    expect(svgs[2]).toContain('data-page="3"');
    expect(buildPageSvgs(opts({ pages: 0 }))).toHaveLength(1);
    expect(buildPageSvgs(opts({ pages: 99 }))).toHaveLength(PAGES_MAX);
  });
});

describe('GridPaper 打印文档', () => {
  test('@page 尺寸跟随所选纸张', () => {
    expect(buildDocumentCss(opts())).toContain('@page { size: 210mm 297mm; margin: 0; }');
    expect(buildDocumentCss(opts({ paper: 'A3' }))).toContain('@page { size: 297mm 420mm; margin: 0; }');
    expect(buildDocumentCss(opts({ paper: 'B5', orientation: 'landscape' })))
      .toContain('@page { size: 250mm 176mm; margin: 0; }');
    expect(buildDocumentCss(opts({ paper: 'B6' }))).toContain('width: 125mm;');
  });

  test('CSS 里每页一个 .pg 容器且分页', () => {
    const css = buildDocumentCss(opts());
    expect(css).toContain('.pg {');
    expect(css).toContain('break-after: page;');
    expect(css).toContain('.pg svg { display: block; width: 100%; height: 100%; }');
  });

  test('HTML 每个 .pg 装一页 SVG', () => {
    const html = buildDocumentHtml(opts({ pages: 2 }));
    expect((html.match(/<div class="pg">/g) || [])).toHaveLength(2);
    expect((html.match(/<svg /g) || [])).toHaveLength(2);
  });

  test('打印任务名带上纸张与格子大小', () => {
    expect(documentName(opts(), '格子纸')).toBe('格子纸 A4 5mm');
    expect(documentName(opts({ paper: 'B6', cell: 2.5 }), '格子纸')).toBe('格子纸 B6 2.5mm');
  });
});

describe('GridPaper 参数归一化', () => {
  test('枚举值非法时回退默认', () => {
    expect(normalizePaper('A5')).toBe(PAPER_DEFAULT);
    expect(normalizePaper(null)).toBe(PAPER_DEFAULT);
    expect(normalizeOrientation('x')).toBe('portrait');
    expect(normalizePattern('zigzag')).toBe('grid');
    expect(normalizeInk(null)).toBe(INK_DEFAULT);
    expect(normalizeInk('purple')).toBe(INK_DEFAULT);
  });

  test('数值夹紧 + 保留两位小数', () => {
    expect(normalizeCell('8')).toBe(8);
    expect(normalizeCell(1)).toBe(CELL_MIN);
    expect(normalizeCell(999)).toBe(CELL_MAX);
    expect(normalizeCell('abc')).toBe(CELL_DEFAULT);
    expect(normalizeCell(null)).toBe(CELL_DEFAULT);
    expect(normalizeCell(5.123)).toBe(5.12);
    expect(normalizeMargin(999)).toBe(MARGIN_MAX);
    expect(normalizeLineWidth(999)).toBe(LINE_MAX);
    expect(normalizeLineWidth(0)).toBe(LINE_MIN);
    expect(normalizeLineWidth(null)).toBe(LINE_DEFAULT);
    expect(normalizePages(2.4)).toBe(2);
    expect(normalizePages(999)).toBe(PAGES_MAX);
    expect(normalizePages(null)).toBe(PAGES_DEFAULT);
    expect(normalizeMajor(999)).toBe(MAJOR_MAX);
    expect(normalizeMajor('3')).toBe(3);
    expect(clampNum('', 0, 10, 7)).toBe(7);
  });

  test('normalizeOptions 补齐缺失字段', () => {
    expect(normalizeOptions(null)).toEqual({
      paper: PAPER_DEFAULT, orientation: 'portrait', pattern: 'grid', ink: INK_DEFAULT,
      cell: CELL_DEFAULT, margin: MARGIN_DEFAULT, lineWidth: LINE_DEFAULT,
      pages: PAGES_DEFAULT, major: 0,
    });
    expect(normalizeOptions({ paper: 'B5', cell: 8 } as GridOptions)).toMatchObject({ paper: 'B5', cell: 8 });
  });
});

describe('GridPaper 设置项持久化', () => {
  beforeEach(() => localStorage.clear());

  test('未存过时用默认值 (A4 / 纵向 / 方格 / 5mm)', () => {
    expect(getDefaultOptions()).toEqual({
      paper: 'A4', orientation: 'portrait', pattern: 'grid', ink: 'gray',
      cell: 5, margin: 10, lineWidth: 0.2, pages: 1, major: 0,
    });
  });

  test('保存后再次读取沿用上次参数', () => {
    setDefaultOptions({
      paper: 'B5', orientation: 'landscape', pattern: 'dots', ink: 'green',
      cell: 8, margin: 15, lineWidth: 0.35, pages: 3, major: 4,
    });
    expect(getDefaultOptions()).toEqual({
      paper: 'B5', orientation: 'landscape', pattern: 'dots', ink: 'green',
      cell: 8, margin: 15, lineWidth: 0.35, pages: 3, major: 4,
    });
  });

  test('本地存了非法值也回退到默认', () => {
    localStorage.setItem('grid-paper.paper', 'A9');
    localStorage.setItem('grid-paper.cell', 'oops');
    localStorage.setItem('grid-paper.pages', '0');
    const o = getDefaultOptions();
    expect(o.paper).toBe(PAPER_DEFAULT);
    expect(o.cell).toBe(CELL_DEFAULT);
    expect(o.pages).toBe(1);
  });
});
