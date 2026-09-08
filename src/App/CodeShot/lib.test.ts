import {
  COMMON_LANGS, EDITORS, THEME_MAP, USED_THEME_IDS, langLabel,
  getDefaultLang, setDefaultLang, getDefaultEditor, setDefaultEditor,
  getDefaultAppearance, setDefaultAppearance, getDefaultPadding, setDefaultPadding,
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
  test('需求默认: vim / 深色 / padding 24 / javascript', () => {
    localStorage.clear();
    expect(getDefaultEditor()).toBe('vim');
    expect(getDefaultAppearance()).toBe('dark');
    expect(getDefaultPadding()).toBe(24);
    expect(getDefaultLang()).toBe('javascript');
  });
  test('设置后可读回', () => {
    localStorage.clear();
    setDefaultEditor('vscode');
    setDefaultAppearance('light');
    setDefaultPadding(48);
    setDefaultLang('python');
    expect(getDefaultEditor()).toBe('vscode');
    expect(getDefaultAppearance()).toBe('light');
    expect(getDefaultPadding()).toBe(48);
    expect(getDefaultLang()).toBe('python');
  });
  test('padding 越界被钳制', () => {
    localStorage.clear();
    setDefaultPadding(999);
    expect(getDefaultPadding()).toBe(72);
    setDefaultPadding(-5);
    expect(getDefaultPadding()).toBe(8);
  });
  test('非法持久化值回落默认', () => {
    localStorage.clear();
    localStorage.setItem('code-shot.default-padding', 'abc');
    expect(getDefaultPadding()).toBe(24);
    localStorage.setItem('code-shot.default-editor', 'nope');
    expect(getDefaultEditor()).toBe('vim');
  });
});
