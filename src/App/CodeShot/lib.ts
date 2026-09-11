// 代码截图 纯逻辑层 (数据表 + 设置存取; Shiki 引擎在 engine.ts, 与 jest/设置分离)

export type EditorId = 'mac' | 'vscode' | 'idea' | 'sublime' | 'vim' | 'emacs';
export type Appearance = 'dark' | 'light';

export interface LangItem { id: string; label: string }

/** 编辑器外观选项 (展示顺序即需求顺序) */
export const EDITORS: Array<{ value: EditorId; label: string }> = [
  { value: 'mac', label: 'Mac' },
  { value: 'vscode', label: 'VSCode' },
  { value: 'idea', label: 'IntelliJ' },
  { value: 'sublime', label: 'Sublime' },
  { value: 'vim', label: 'Vim' },
  { value: 'emacs', label: 'Emacs' },
];

export const APPEARANCES: Array<{ value: Appearance; label: string }> = [
  { value: 'dark', label: '深色' },
  { value: 'light', label: '浅色' },
];

/** 编辑器 × 明暗 → Shiki 内置主题 id (均存在于 @shikijs/themes) */
export const THEME_MAP: Record<EditorId, Record<Appearance, string>> = {
  mac: { dark: 'github-dark', light: 'github-light' },
  vscode: { dark: 'dark-plus', light: 'light-plus' },
  idea: { dark: 'material-theme-darker', light: 'material-theme-lighter' },
  sublime: { dark: 'monokai', light: 'solarized-light' },
  vim: { dark: 'gruvbox-dark-hard', light: 'gruvbox-light-hard' },
  emacs: { dark: 'everforest-dark', light: 'everforest-light' },
};

/** 主题表涉及的 Shiki 主题 id (engine 预加载) */
export const USED_THEME_IDS: string[] = Array.from(
  new Set(Object.values(THEME_MAP).flatMap((m) => [m.dark, m.light])),
);

/** 常用语言 (置顶显示, label 为展示名); 其余 359 个 canonical 语言按 id 展示 */
export const COMMON_LANGS: LangItem[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'tsx', label: 'TypeScript (TSX)' },
  { id: 'jsx', label: 'JavaScript (JSX)' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'less', label: 'Less' },
  { id: 'json', label: 'JSON' },
  { id: 'jsonc', label: 'JSONC' },
  { id: 'xml', label: 'XML' },
  { id: 'yaml', label: 'YAML' },
  { id: 'toml', label: 'TOML' },
  { id: 'ini', label: 'INI' },
  { id: 'markdown', label: 'Markdown' },
  { id: 'sql', label: 'SQL' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'swift', label: 'Swift' },
  { id: 'dart', label: 'Dart' },
  { id: 'bash', label: 'Bash' },
  { id: 'shell', label: 'Shell' },
  { id: 'powershell', label: 'PowerShell' },
  { id: 'batch', label: 'Batch' },
  { id: 'vue', label: 'Vue' },
  { id: 'svelte', label: 'Svelte' },
  { id: 'astro', label: 'Astro' },
  { id: 'diff', label: 'Diff' },
  { id: 'graphql', label: 'GraphQL' },
  { id: 'regexp', label: 'Regex' },
  { id: 'nginx', label: 'Nginx' },
  { id: 'dockerfile', label: 'Dockerfile' },
  { id: 'makefile', label: 'Makefile' },
  { id: 'cmake', label: 'CMake' },
  { id: 'properties', label: 'Properties' },
  { id: 'http', label: 'HTTP' },
  { id: 'tex', label: 'LaTeX' },
  { id: 'lua', label: 'Lua' },
  { id: 'perl', label: 'Perl' },
  { id: 'r', label: 'R' },
  { id: 'haskell', label: 'Haskell' },
  { id: 'elixir', label: 'Elixir' },
  { id: 'clojure', label: 'Clojure' },
  { id: 'scala', label: 'Scala' },
  { id: 'objective-c', label: 'Objective-C' },
  { id: 'coffee', label: 'CoffeeScript' },
];

/** 语言 id → 常用展示名 (未在常用表则直接用 id) */
export function langLabel(id: string): string {
  const hit = COMMON_LANGS.find((l) => l.id === id);
  return hit ? hit.label : id;
}

// ---- 设置存取 ----
const KEYS = {
  lang: 'code-shot.default-lang',
  editor: 'code-shot.default-editor',
  appearance: 'code-shot.default-appearance',
  padding: 'code-shot.default-padding',
  minWidth: 'code-shot.default-min-width',
  lines: 'code-shot.default-lines',
};

const get = (k: string, fallback: string): string => {
  try {
    const v = localStorage.getItem(k);
    return v ?? fallback;
  } catch { return fallback; }
};
const set = (k: string, v: string): void => {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
};

export const getDefaultLang = (): string => get(KEYS.lang, 'javascript');
export const setDefaultLang = (v: string): void => set(KEYS.lang, v);
export const getDefaultEditor = (): EditorId => {
  const v = get(KEYS.editor, 'vim') as EditorId;
  return EDITORS.some((e) => e.value === v) ? v : 'vim';
};
export const setDefaultEditor = (v: EditorId): void => set(KEYS.editor, v);
export const getDefaultAppearance = (): Appearance => get(KEYS.appearance, 'dark') === 'light' ? 'light' : 'dark';
export const setDefaultAppearance = (v: Appearance): void => set(KEYS.appearance, v);

export const PADDING_MIN = 0;
export const PADDING_MAX = 96;
/** 默认内边距 (需求: 8px) */
export const DEFAULT_PADDING = 8;

/** 最小宽度上下限 (0 = 按代码宽度自适应, 不限制最小宽度) */
export const MIN_WIDTH_MIN = 0;
export const MIN_WIDTH_MAX = 1200;

/** 默认内边距 (需求: 8px) */
export function getDefaultPadding(): number {
  const v = Number(get(KEYS.padding, String(DEFAULT_PADDING)));
  if (Number.isNaN(v)) return DEFAULT_PADDING;
  return Math.max(PADDING_MIN, Math.min(PADDING_MAX, Math.round(v)));
}
export function setDefaultPadding(v: number): void {
  set(KEYS.padding, String(Math.max(PADDING_MIN, Math.min(PADDING_MAX, Math.round(v)))));
}

/** 默认最小宽度 (0 = 不限制, 截图区域随代码宽度自适应) */
export function getDefaultMinWidth(): number {
  const v = Number(get(KEYS.minWidth, '0'));
  if (Number.isNaN(v)) return 0;
  return Math.max(MIN_WIDTH_MIN, Math.min(MIN_WIDTH_MAX, Math.round(v)));
}
export function setDefaultMinWidth(v: number): void {
  set(KEYS.minWidth, String(Math.max(MIN_WIDTH_MIN, Math.min(MIN_WIDTH_MAX, Math.round(v)))));
}

export function getDefaultShowLines(): boolean {
  return get(KEYS.lines, '1') !== '0';
}
export function setDefaultShowLines(v: boolean): void {
  set(KEYS.lines, v ? '1' : '0');
}

// ---- 高亮 HTML 装饰 (预览与导出共用) ----

export interface DecorateOptions {
  /** 是否在每行前插入行号 */
  lineNumbers?: boolean;
  /** 行号颜色 */
  lineNoColor?: string;
}

/**
 * 在 Shiki 产出的 <pre> 上做展示层装饰:
 * 1. 清除浏览器对 <pre> 的 UA 默认 margin (1em 0) —— 否则内边距为 0 时代码顶部/底部仍
 *    残留一大段空白 (看起来像圈住代码的边距, 且行号与代码错位);
 * 2. 可选在每行 <span class="line"> 开头插入行号 (Shiki 高亮以行为单位输出, 行号随行
 *    文本自然对齐, 预览与导出 PNG 完全一致)。
 */
export function decorateHtml(html: string, opts: DecorateOptions = {}): string {
  let out = html.replace(/<pre([^>]*)style="([^"]*)"/, '<pre$1style="margin:0;$2"');
  if (opts.lineNumbers) {
    const color = opts.lineNoColor ?? 'rgba(128,128,128,0.75)';
    let n = 0;
    out = out.replace(/<span class="line">/g, () => {
      n += 1;
      return `<span class="line"><span class="line-no" `
        + `style="display:inline-block;min-width:3ch;text-align:right;margin-right:1.25ch;`
        + `color:${color};user-select:none;-webkit-user-select:none">${n}</span>`;
    });
  }
  return out;
}
