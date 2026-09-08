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

export const PADDING_MIN = 8;
export const PADDING_MAX = 72;

export function getDefaultPadding(): number {
  const v = Number(get(KEYS.padding, '24'));
  if (Number.isNaN(v)) return 24;
  return Math.max(PADDING_MIN, Math.min(PADDING_MAX, Math.round(v)));
}
export function setDefaultPadding(v: number): void {
  set(KEYS.padding, String(Math.max(PADDING_MIN, Math.min(PADDING_MAX, Math.round(v)))));
}
