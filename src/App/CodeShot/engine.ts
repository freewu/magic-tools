// 代码截图 - Shiki 渲染引擎 (浏览器运行时按需加载; 本文件不参与 jest 测试链路)
// 语言语法: import.meta.glob 全量按需 chunk (约 360 canonical + 别名)
// 主题: 仅静态引入映射表用到的 12 个内置主题
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { Highlighter } from 'shiki/core';
import darkPlus from '@shikijs/themes/dark-plus';
import lightPlus from '@shikijs/themes/light-plus';
import githubDark from '@shikijs/themes/github-dark';
import githubLight from '@shikijs/themes/github-light';
import materialDarker from '@shikijs/themes/material-theme-darker';
import materialLighter from '@shikijs/themes/material-theme-lighter';
import monokai from '@shikijs/themes/monokai';
import solarizedLight from '@shikijs/themes/solarized-light';
import gruvboxDarkHard from '@shikijs/themes/gruvbox-dark-hard';
import gruvboxLightHard from '@shikijs/themes/gruvbox-light-hard';
import everforestDark from '@shikijs/themes/everforest-dark';
import everforestLight from '@shikijs/themes/everforest-light';
import { CANONICAL_LANG_SET } from './canonical';
import { THEME_MAP, USED_THEME_IDS } from './lib';
import type { Appearance, EditorId } from './lib';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const THEME_MODULES: Record<string, any> = {
  'dark-plus': darkPlus,
  'light-plus': lightPlus,
  'github-dark': githubDark,
  'github-light': githubLight,
  'material-theme-darker': materialDarker,
  'material-theme-lighter': materialLighter,
  monokai,
  'solarized-light': solarizedLight,
  'gruvbox-dark-hard': gruvboxDarkHard,
  'gruvbox-light-hard': gruvboxLightHard,
  'everforest-dark': everforestDark,
  'everforest-light': everforestLight,
};

/** 主题 id → 背景色 (来自主题定义) */
const THEME_BG: Record<string, string> = Object.fromEntries(
  USED_THEME_IDS.map((id) => [id, THEME_MODULES[id]?.colors?.background ?? '#0d1117']),
);

/** 全部 canonical 语言按需加载器: path → loader (vite 编译期展开) */
const LANG_LOADERS = import.meta.glob(
  // !(index) 排除 dist/index.mjs: 它已被 canonical.ts 静态引用 (languageNames),
  // 若再被 glob 动态引用会产生 vite 混合加载提示 (langs 均为 <id>.mjs, 无 index 语言)
  '../../../node_modules/@shikijs/langs/dist/!(index).mjs',
) as unknown as Record<string, () => Promise<{ default?: unknown }>>;

const CANONICAL = CANONICAL_LANG_SET;

/** 页面可用语言 id 列表 (canonical, 按字母序) */
export const ALL_LANG_IDS: string[] = Object.keys(LANG_LOADERS)
  .map((p) => p.slice(p.lastIndexOf('/') + 1).replace(/\.mjs$/, ''))
  .filter((id) => id !== 'index' && CANONICAL.has(id))
  .sort((a, b) => a.localeCompare(b));

export function resolveThemeId(editor: EditorId, appearance: Appearance): string {
  return THEME_MAP[editor][appearance];
}

export function themeBackground(editor: EditorId, appearance: Appearance): string {
  return THEME_BG[resolveThemeId(editor, appearance)] ?? '#0d1117';
}

let hlPromise: Promise<Highlighter> | null = null;
let hlError: string | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!hlPromise) {
    hlPromise = createHighlighterCore({
      themes: USED_THEME_IDS.map((id) => THEME_MODULES[id]).filter(Boolean),
      langs: [],
      engine: createJavaScriptRegexEngine(),
    }).catch((e) => {
      hlError = e instanceof Error ? e.message : String(e);
      hlPromise = null;
      throw e;
    });
  }
  return hlPromise;
}

async function ensureLanguage(hl: Highlighter, langId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loaded = (hl as any).getLoadedLanguages?.() as string[] | undefined;
  if (loaded && loaded.includes(langId)) return;
  const key = Object.keys(LANG_LOADERS).find((p) => p.endsWith(`/${langId}.mjs`));
  if (!key) throw new Error(`语言不可用: ${langId}`);
  const mod = await LANG_LOADERS[key]();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (hl as any).loadLanguage(mod?.default ?? mod);
}

/**
 * 高亮代码为 HTML (pre>code, 含行内样式)
 * @throws 引擎初始化/语言加载失败时抛出, 由 UI 捕获展示
 */
export async function highlightToHtml(
  code: string,
  langId: string,
  themeId: string,
): Promise<string> {
  const hl = await getHighlighter();
  await ensureLanguage(hl, langId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html = (hl as any).codeToHtml(code, { lang: langId, theme: themeId });
  return html as string;
}

export { hlError };
