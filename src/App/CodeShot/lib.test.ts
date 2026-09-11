import {
  COMMON_LANGS, EDITORS, THEME_MAP, USED_THEME_IDS, langLabel,
  getDefaultLang, setDefaultLang, getDefaultEditor, setDefaultEditor,
  getDefaultAppearance, setDefaultAppearance, getDefaultPadding, setDefaultPadding,
  getDefaultMinWidth, setDefaultMinWidth, MIN_WIDTH_MAX, DEFAULT_PADDING,
  getDefaultShowLines, setDefaultShowLines, decorateHtml,
} from './lib';

describe('代码截图 - 编辑器与主题映射', () => {
  test('6 个编辑器选项', () => {
    expect(EDITORS.map((e) => e.value)).toEqual(['mac', 'vscode', 'idea', 'sublime', 'vim', 'emacs']);
  });
  test('每编辑器明暗均有主题映射', () => {
    for (const e of EDITORS) {
      expect(THEME_MAP[e.value].dark).toBeTruthy();
      expect(THEME_MAP[e.value].light).toBeTruthy();
      expect(THEME_MAP[e.value].dark).not.toBe(THEME_MAP[e.value].light);
    }
  });
  test('用到的主题 id 无重复', () => {
    expect(USED_THEME_IDS.length).toBe(new Set(USED_THEME_IDS).size);
  });
  test('默认编辑器 vim 映射 gruvbox', () => {
    expect(THEME_MAP.vim.dark).toBe('gruvbox-dark-hard');
  });
});

describe('代码截图 - 常用语言', () => {
  test('常用语言 id 无重复', () => {
    const ids = COMMON_LANGS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  test('JavaScript 置顶且展示名正确', () => {
    expect(COMMON_LANGS[0]).toEqual({ id: 'javascript', label: 'JavaScript' });
  });
  test('langLabel: 常见与兜底', () => {
    expect(langLabel('typescript')).toBe('TypeScript');
    expect(langLabel('brainfuck')).toBe('brainfuck');
  });
});

describe('代码截图 - 设置默认值与持久化', () => {
  test('需求默认: vim / 深色 / padding 8 / 最小宽度 0 / javascript / 显示行号', () => {
    localStorage.clear();
    expect(getDefaultEditor()).toBe('vim');
    expect(getDefaultAppearance()).toBe('dark');
    expect(DEFAULT_PADDING).toBe(8);
    expect(getDefaultPadding()).toBe(8);
    expect(getDefaultMinWidth()).toBe(0);
    expect(getDefaultLang()).toBe('javascript');
    expect(getDefaultShowLines()).toBe(true);
  });
  test('设置后可读回', () => {
    localStorage.clear();
    setDefaultEditor('vscode');
    setDefaultAppearance('light');
    setDefaultPadding(48);
    setDefaultMinWidth(640);
    setDefaultLang('python');
    expect(getDefaultEditor()).toBe('vscode');
    expect(getDefaultAppearance()).toBe('light');
    expect(getDefaultPadding()).toBe(48);
    expect(getDefaultMinWidth()).toBe(640);
    expect(getDefaultLang()).toBe('python');
  });
  test('padding 越界被钳制', () => {
    localStorage.clear();
    setDefaultPadding(999);
    expect(getDefaultPadding()).toBe(96);
    setDefaultPadding(-5);
    expect(getDefaultPadding()).toBe(0);
  });
  test('最小宽度越界被钳制 (0 = 自适应)', () => {
    localStorage.clear();
    setDefaultMinWidth(99999);
    expect(getDefaultMinWidth()).toBe(MIN_WIDTH_MAX);
    setDefaultMinWidth(-20);
    expect(getDefaultMinWidth()).toBe(0);
    setDefaultMinWidth(0);
    expect(getDefaultMinWidth()).toBe(0);
  });
  test('非法持久化值回落默认', () => {
    localStorage.clear();
    localStorage.setItem('code-shot.default-padding', 'abc');
    expect(getDefaultPadding()).toBe(8);
    localStorage.setItem('code-shot.default-min-width', 'abc');
    expect(getDefaultMinWidth()).toBe(0);
    localStorage.setItem('code-shot.default-editor', 'nope');
    expect(getDefaultEditor()).toBe('vim');
  });
  test('行号默认开, 可关闭再打开', () => {
    localStorage.clear();
    expect(getDefaultShowLines()).toBe(true);
    setDefaultShowLines(false);
    expect(getDefaultShowLines()).toBe(false);
    setDefaultShowLines(true);
    expect(getDefaultShowLines()).toBe(true);
  });
});

describe('代码截图 - 高亮 HTML 装饰 decorateHtml', () => {
  const SAMPLE = '<pre class="shiki github-dark" style="background-color:#24292e;color:#e1e4e8" tabindex="0"><code>'
    + '<span class="line"><span style="color:#F97583">const</span><span style="color:#79B8FF"> a</span></span>\n'
    + '<span class="line"><span style="color:#79B8FF">b</span></span>\n'
    + '<span class="line"><span style="color:#6A737D">// hi</span></span>'
    + '</code></pre>';

  test('默认清除 pre 的 UA margin, 保留主题背景', () => {
    const out = decorateHtml(SAMPLE);
    expect(out).toContain('style="margin:0;background-color:#24292e;color:#e1e4e8"');
    expect(out).not.toContain('line-no');
  });

  test('开启行号: 每行插入行号且计数正确', () => {
    const out = decorateHtml(SAMPLE, { lineNumbers: true, lineNoColor: 'red' });
    const lines = out.match(/<span class="line-no"/g) ?? [];
    expect(lines).toHaveLength(3);
    expect(out).toContain('>1</span>');
    expect(out).toContain('>3</span>');
    expect(out).toContain('color:red');
  });

  test('空/不含 line 的 html 安全返回', () => {
    expect(decorateHtml('')).toBe('');
    expect(decorateHtml('<pre style="color:#fff">x</pre>', { lineNumbers: true })).toContain('style="margin:0;color:#fff"');
  });
});
