// ASCII 文字: figlet 引擎 (支持 289 款 figlet 字体切换)
// - 逻辑层: 字体数据懒加载 + parseFont 注册 + 渲染 + 默认字体设置存取
// - 渲染引擎: figlet (MIT, https://github.com/patorjk/figlet.js)
// - 字体数据: fonts-data.ts (生成文件, 来自 patorjk/figlet.js fonts 目录)

import figlet from 'figlet';
import { FONT_NAMES } from './fontNames';

export { FONT_NAMES } from './fontNames';

/** 字体清单缺失时的兜底字体 (必须存在于 FONT_NAMES) */
export const DEFAULT_FONT = 'Standard';

// ---- 设置存取 (设置 → 其它 → ASCII 文字) ----
const KEY_FONT = 'ascii-text-art.default-font';

const rawGet = (k: string): string | null => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const rawSet = (k: string, v: string): void => {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
};

/** 默认字体 (若本地保存值不在字体清单中则回退 Standard) */
export function getDefaultFont(): string {
  const v = rawGet(KEY_FONT);
  return v && FONT_NAMES.includes(v) ? v : DEFAULT_FONT;
}
export function setDefaultFont(v: string): void {
  rawSet(KEY_FONT, FONT_NAMES.includes(v) ? v : DEFAULT_FONT);
}

// ---- 渲染 ----
/** 字体数据 (懒加载, 独立 chunk); 解析过的字体记录于 parsedFonts */
let fontData: Record<string, string> | null = null;
let dataPromise: Promise<Record<string, string>> | null = null;
const parsedFonts = new Set<string>();

const loadFontData = async (): Promise<void> => {
  if (fontData) return;
  if (!dataPromise) {
    dataPromise = import('./fonts-data').then((m) => m.FONT_DATA).catch((err) => {
      dataPromise = null;
      throw err;
    });
  }
  fontData = await dataPromise;
};

const ensureParsed = (name: string): void => {
  if (parsedFonts.has(name) || !fontData) return;
  figlet.parseFont(name, fontData[name]);
  parsedFonts.add(name);
};

/**
 * 文本 -> figlet 大字
 * - 字体名不合法时回退默认字体; 空文本返回空串
 * - 多行文本逐行独立排版; 未收录字符按字体回退 (通常为 ? 或空格)
 * - 首次调用会动态加载字体数据模块
 */
export async function renderText(text: string, font = DEFAULT_FONT): Promise<string> {
  const name = FONT_NAMES.includes(font) ? font : DEFAULT_FONT;
  if (!text) return '';
  try {
    await loadFontData();
    ensureParsed(name);
    return figlet.textSync(text, { font: name }) ?? '';
  } catch {
    return '';
  }
}
