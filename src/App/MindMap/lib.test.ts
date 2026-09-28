// markmap-view 只发布 ESM 产物, jest (CJS) 无法加载, 因此这里 mock 掉两个 markmap 包;
// 注意: mock 里必须用 mock 前缀的变量保存构造参数, 否则 jest 会拒绝提升 jest.mock。
const mockCtorArgs: unknown[][] = [];
const mockTransform = jest.fn((md: string) => ({ root: { content: md, children: [] } }));

jest.mock('markmap-lib', () => ({
  __esModule: true,
  builtInPlugins: [ { name: 'frontmatter' }, { name: 'katex' }, { name: 'hljs' }, { name: 'checkbox' } ],
  Transformer: function MockTransformer(this: Record<string, unknown>, plugins: unknown[]) {
    mockCtorArgs.push(plugins);
    this.transform = mockTransform;
  },
}));

const mockCreate = jest.fn(() => ({
  state: { rect: { x1: 0, y1: 0, x2: 100, y2: 50 } },
  setData: jest.fn(),
  fit: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('markmap-view', () => ({
  __esModule: true,
  Markmap: { create: mockCreate },
  deriveOptions: jest.fn((json: Record<string, unknown>) => ({ ...json, __derived: true })),
}));

import { COLOR_DEFAULT, COLOR_SCHEMES, DEFAULT_FILE_BASE, DEPTH_DEFAULT, DEPTH_OPTIONS, EXPORT_PADDING } from './data';
import {
  __resetMarkmapCache,
  clampFontSize,
  exportBaseName,
  exportBoxOf,
  firstHeading,
  getDefaultColorScheme,
  getDefaultDepth,
  getDefaultSample,
  isBlankMarkdown,
  loadMarkmap,
  markdownStats,
  markmapStyle,
  normalizeColorScheme,
  normalizeDepth,
  outlineInfo,
  setDefaultColorScheme,
  setDefaultDepth,
  setDefaultSample,
  viewOptions,
  FONT_MAX,
  FONT_MIN,
} from './lib';

const derive = (json: Record<string, unknown>) => ({ ...json, __derived: true });

beforeEach(() => {
  localStorage.clear();
  mockCtorArgs.length = 0;
  mockTransform.mockClear();
  __resetMarkmapCache();
});

describe('MindMap markdown 统计', () => {
  it('isBlankMarkdown 只把空白视为空', () => {
    expect(isBlankMarkdown('')).toBe(true);
    expect(isBlankMarkdown('   \n\t\n')).toBe(true);
    expect(isBlankMarkdown('# 标题')).toBe(false);
  });

  it('markdownStats 统计行数 / 字符数 / 标题数', () => {
    expect(markdownStats('')).toEqual({ lines: 0, chars: 0, headings: 0 });
    expect(markdownStats('# A\n## B\n- x')).toEqual({ lines: 3, chars: 12, headings: 2 });
    // 末尾换行不算一行
    expect(markdownStats('# A\n').lines).toBe(1);
  });

  it('firstHeading 优先一级标题, 并去掉折叠注释', () => {
    expect(firstHeading('# 主标题\n## 次标题')).toBe('主标题');
    expect(firstHeading('## 只有二级标题')).toBe('只有二级标题');
    expect(firstHeading('- 只有列表')).toBeNull();
    expect(firstHeading('#')).toBeNull();
    expect(firstHeading('#   ')).toBeNull();
    expect(firstHeading('# 默认收起 <!-- markmap: fold -->')).toBe('默认收起');
    // 一级标题为空时回退到更深标题
    expect(firstHeading('#\n### 深标题')).toBe('深标题');
  });

  it('outlineInfo 统计节点数与层级', () => {
    expect(outlineInfo(null)).toEqual({ total: 0, depth: 0 });
    expect(outlineInfo({})).toEqual({ total: 1, depth: 1 });
    expect(outlineInfo({ children: [ { children: [ {} ] }, {} ] })).toEqual({ total: 4, depth: 3 });
  });
});

describe('MindMap 导出尺寸与文件名', () => {
  it('exportBoxOf 把内容包围盒加上留白并取整', () => {
    expect(exportBoxOf({ x1: -100, y1: -50, x2: 100, y2: 50 })).toEqual({
      x: -100 - EXPORT_PADDING,
      y: -50 - EXPORT_PADDING,
      width: 200 + EXPORT_PADDING * 2,
      height: 100 + EXPORT_PADDING * 2,
    });
    expect(exportBoxOf({ x1: 0, y1: 0, x2: 10.4, y2: 5.2 }, 0)).toEqual({ x: 0, y: 0, width: 11, height: 6 });
  });

  it('exportBoxOf 对空内容 / 非法值返回 null', () => {
    expect(exportBoxOf(null)).toBeNull();
    expect(exportBoxOf(undefined)).toBeNull();
    expect(exportBoxOf({ x1: 0, y1: 0, x2: 0, y2: 0 })).toBeNull();
    expect(exportBoxOf({ x1: 10, y1: 0, x2: 0, y2: 0 })).toBeNull();
    expect(exportBoxOf({ x1: 0, y1: NaN, x2: 10, y2: 10 })).toBeNull();
    // 负留白按 0 处理
    expect(exportBoxOf({ x1: 0, y1: 0, x2: 10, y2: 10 }, -5)).toEqual({ x: 0, y: 0, width: 10, height: 10 });
  });

  it('exportBaseName 依次取 示例 id / 首个标题 / 默认名', () => {
    expect(exportBaseName('# 我的图', 'project')).toBe('mindmap-project');
    expect(exportBaseName('# 我的图', 'not-exist')).toBe('我的图');
    expect(exportBaseName('', 'project')).toBe('mindmap-project');
    expect(exportBaseName('- 无标题')).toBe(DEFAULT_FILE_BASE);
  });
});

describe('MindMap 参数收敛', () => {
  it('normalizeDepth 只接受预设层级', () => {
    expect(normalizeDepth(2)).toBe(2);
    expect(normalizeDepth(-1)).toBe(-1);
    expect(normalizeDepth(9)).toBe(DEPTH_DEFAULT);
    expect(normalizeDepth(NaN)).toBe(DEPTH_DEFAULT);
    expect(normalizeDepth(null)).toBe(DEPTH_DEFAULT);
    expect(DEPTH_OPTIONS).toContain(DEPTH_DEFAULT);
  });

  it('normalizeColorScheme 回退默认配色', () => {
    expect(normalizeColorScheme('warm')).toBe('warm');
    expect(normalizeColorScheme('nope')).toBe(COLOR_DEFAULT);
    expect(normalizeColorScheme(undefined)).toBe(COLOR_DEFAULT);
  });

  it('clampFontSize 收敛到区间并取整', () => {
    expect(clampFontSize(18)).toBe(18);
    expect(clampFontSize(3)).toBe(FONT_MIN);
    expect(clampFontSize(999)).toBe(FONT_MAX);
    expect(clampFontSize(17.6)).toBe(18);
    expect(clampFontSize(NaN)).toBe(16);
  });
});

describe('MindMap 样式与视图参数', () => {
  it('markmapStyle 注入字号 / 行高与底色对应的文字变量', () => {
    const light = markmapStyle(20, false);
    expect(light).toContain('--markmap-font:20px/25px');
    expect(light).toContain('--markmap-text-color:#333');
    expect(light).toContain('.markmap .hljs-keyword');
    const dark = markmapStyle(14, true);
    expect(dark).toContain('--markmap-text-color:#e8e8e8');
    expect(dark).toContain('--markmap-code-bg:#1a1b26');
    // 字号越界时按区间收敛
    expect(markmapStyle(1, false)).toContain(`--markmap-font:${FONT_MIN}px/`);
  });

  it('viewOptions 合并 frontmatter, 界面参数优先, 并挂上 style / autoFit', () => {
    const opts = viewOptions(derive, { scheme: 'warm', depth: 2, fontSize: 18, darkBg: true });
    expect(opts.__derived).toBe(true);
    expect(opts.color).toEqual(COLOR_SCHEMES.warm.colors);
    expect(opts.initialExpandLevel).toBe(2);
    expect(opts.autoFit).toBe(true);
    expect(opts.embedGlobalCSS).toBe(true);
    expect(opts.duration).toBe(0);
    expect((opts.style as () => string)()).toContain('--markmap-font:18px/');

    // frontmatter 里的 markmap 字段先铺底, 间距等界面未暴露的参数保留
    const fm = viewOptions(
      derive,
      { scheme: 'blue', depth: -1, fontSize: 16, darkBg: false },
      { markmap: { colorFreezeLevel: 3, spacingHorizontal: 120, maxWidth: 300 } },
    );
    expect(fm.colorFreezeLevel).toBe(3);
    expect(fm.spacingHorizontal).toBe(80); // 界面固定值覆盖 frontmatter
    expect(fm.maxWidth).toBe(0);
    expect(fm.initialExpandLevel).toBe(-1);
  });

  it('viewOptions: 默认配色 (空数组) 交给 markmap 自带调色板', () => {
    const opts = viewOptions(derive, { scheme: 'default', depth: DEPTH_DEFAULT, fontSize: 16, darkBg: false });
    expect(opts.color).toBeUndefined();
    expect(opts.initialExpandLevel).toBe(DEPTH_DEFAULT);
    // 非法配色回退默认 (同样不带 color)
    const bad = viewOptions(derive, { scheme: 'nope' as never, depth: 1, fontSize: 16, darkBg: false });
    expect(bad.color).toBeUndefined();
    expect(bad.initialExpandLevel).toBe(1);
  });
});

describe('MindMap loadMarkmap', () => {
  it('使用剔除 katex 的插件集, 并缓存实例', async () => {
    const bundle = await loadMarkmap();
    expect(mockCtorArgs).toHaveLength(1);
    expect((mockCtorArgs[0] as { name: string }[]).map((p) => p.name)).toEqual([ 'frontmatter', 'hljs', 'checkbox' ]);

    // 转换函数返回 root 与 frontmatter
    expect(bundle.transform('# A')).toEqual({ root: { content: '# A', children: [] }, frontmatter: undefined });

    // 复用缓存: 不再新建 Transformer
    const again = await loadMarkmap();
    expect(again).toBe(bundle);
    expect(mockCtorArgs).toHaveLength(1);

    // 暴露 create / deriveOptions
    expect(bundle.Markmap.create).toBe(mockCreate);
    expect(typeof bundle.deriveOptions).toBe('function');
  });

  it('转换器返回空 root 时兜底为 null', async () => {
    mockTransform.mockReturnValueOnce({ root: null } as never);
    const bundle = await loadMarkmap();
    expect(bundle.transform('')).toEqual({ root: null, frontmatter: undefined });
  });
});

describe('MindMap 默认项持久化', () => {
  it('配色方案读写与回退', () => {
    expect(getDefaultColorScheme()).toBe(COLOR_DEFAULT);
    setDefaultColorScheme('cool');
    expect(getDefaultColorScheme()).toBe('cool');
    localStorage.setItem('mindmap:default-color', 'garbage');
    expect(getDefaultColorScheme()).toBe(COLOR_DEFAULT);
  });

  it('展开层级读写与回退', () => {
    expect(getDefaultDepth()).toBe(DEPTH_DEFAULT);
    setDefaultDepth(2);
    expect(getDefaultDepth()).toBe(2);
    localStorage.setItem('mindmap:default-depth', '99');
    expect(getDefaultDepth()).toBe(DEPTH_DEFAULT);
  });

  it('默认示例: 未设置取第一个, 空串表示空白大纲, 非法值回退', () => {
    expect(getDefaultSample()).toBe('project');
    setDefaultSample('');
    expect(getDefaultSample()).toBe('');
    setDefaultSample('meeting');
    expect(getDefaultSample()).toBe('meeting');
    setDefaultSample('not-exist');
    expect(getDefaultSample()).toBe('');
  });
});
