// 字帖生成器: 文字拆字 / 分页 / A4 版式计算 / 打印页面构建
import { A4_MM, PRINT_BASE_CSS, escapeHtml } from '../../lib/print';
import {
  CELL_LINE_MM, CHAR_RATIO, COLS_DEFAULT, COLS_MAX, COLS_MIN, CUSTOM_FAMILY, DEFAULT_GRID, FOOTER_MM,
  GAP_DEFAULT, GAP_MAX, GAP_MIN, GUIDE_LINE_MM, HEADER_MM, KEY_BY_ROW, KEY_COLS, KEY_FONT, KEY_GAP, KEY_LINE,
  KEY_LOOP, KEY_MODE, KEY_PAGES, KEY_ROWS, KEY_STYLE, KEY_TEXT, LINE_COLOR_VALUE, PAGES_MAX, PAGES_MIN,
  ROWS_DEFAULT,
  ROWS_MAX, ROWS_MIN, TEXT_COLOR_GRAY, TEXT_COLOR_INK, FONTS, FONT_DEFAULT, PAGES_DEFAULT,
  type ContentMode, type GridStyle, type LineColor,
} from './data';

// ==================== 文字处理 ====================

/** 按「字」拆分: 去掉空白与全角空格, 代理对 (emoji 等) 保持完整 */
export function splitChars(text: string): string[] {
  return Array.from(text.replace(/[\s\u3000]+/g, ''));
}

/**
 * 生成一页所需的字符序列: 不足时按需循环或留空。
 * 返回长度固定为 count 的数组, null 表示该格不显示文字。
 */
export function fillChars(chars: string[], count: number, loop: boolean): Array<string | null> {
  const out: Array<string | null> = [];
  if (chars.length === 0) {
    for (let i = 0; i < count; i++) out.push(null);
    return out;
  }
  for (let i = 0; i < count; i++) {
    if (loop) out.push(chars[i % chars.length]);
    else out.push(i < chars.length ? chars[i] : null);
  }
  return out;
}

/**
 * 按行填充: 同一行重复同一个字, 第 N 行用第 N 个字 (字帖常见的「一行练一个字」)。
 * 行数超过字数时, loop 决定是回到开头循环还是留空。
 */
export function fillCharsByRow(
  chars: string[], cols: number, rows: number, pages: number, loop: boolean,
): Array<string | null> {
  const out: Array<string | null> = [];
  const totalRows = Math.max(0, rows) * Math.max(1, pages);
  for (let r = 0; r < totalRows; r++) {
    let ch: string | null = null;
    if (chars.length > 0) {
      if (r < chars.length) ch = chars[r];
      else if (loop) ch = chars[r % chars.length];
    }
    for (let c = 0; c < Math.max(0, cols); c++) out.push(ch);
  }
  return out;
}

// ==================== 视觉居中 (墨迹补偿) ====================

/** 单字墨迹中心相对 em 框中心的偏移 (单位为 em 的比例, 正值 = 偏右 / 偏下) */
export interface InkOffset {
  dx: number;
  dy: number;
}

/** 测量用字号: 偏移按 em 比例缩放, 与最终字号无关 (实测该比例在不同字号下一致) */
const MEASURE_PX = 160;
/** 光栅化时 em 框四周留白 (避免超出字身框的笔画被截断) */
const MEASURE_PAD = Math.round(MEASURE_PX * 0.3);

/** 墨迹测量缓存 (key = 字体栈 + 字): 长文本不会反复光栅化, 每个字每字体只测一次 */
const inkCache = new Map<string, InkOffset>();

/**
 * 实测单个字的墨迹中心相对字身框 (em) 中心的偏移。
 *
 * 做法: 把字按 .cb-ch 的盒子在 canvas 上光栅化 (line-height:1 → 行盒高 1em,
 * 基线位置 = 半行距 + 字体 ascent), 再扫描像素取覆盖度 > 50% 的墨迹包围盒中心。
 * 用光栅化而不是 measureText 的 actualBoundingBox*: 后者是印刷学边界,
 * 会把极淡的笔画外溢也算进去, 与肉眼看到的「字的范围」不一致 (实测偏差可达 1mm)。
 */
function measureOne(fontFamily: string, ch: string): InkOffset | null {
  try {
    const size = MEASURE_PAD * 2 + MEASURE_PX;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.font = `400 ${MEASURE_PX}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(ch);
    const asc = m.fontBoundingBoxAscent;
    const desc = m.fontBoundingBoxDescent;
    if (!Number.isFinite(asc) || !Number.isFinite(desc)) return null;
    const baseline = MEASURE_PAD + (MEASURE_PX - (asc + desc)) / 2 + asc;
    ctx.fillStyle = '#000';
    ctx.fillText(ch, MEASURE_PAD, baseline);
    const data = ctx.getImageData(0, 0, size, size).data;
    let x0 = size; let y0 = size; let x1 = -1; let y1 = -1;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (data[(y * size + x) * 4 + 3] > 128) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return null;
    const center = MEASURE_PAD + MEASURE_PX / 2;
    return {
      dx: ((x0 + x1) / 2 - center) / MEASURE_PX,
      dy: ((y0 + y1) / 2 - center) / MEASURE_PX,
    };
  } catch (e) {
    return null; // jsdom 等环境没有 canvas
  }
}

/**
 * 实测每个字的墨迹中心相对 em 框中心的偏移, 供格子里做视觉居中。
 *
 * 楷体等中文字体的字形在 em 框里并非几何居中 (实测楷体「落」偏右约 7% em, 华文楷体更明显),
 * 只用 flex 居中会让字整体偏右 / 偏下, 米字格十字就不再穿过字的中心。
 * 无 canvas 环境 (jsdom / 老浏览器) 返回空表 → 退化为按 em 框居中。
 *
 * @param fontFamily CSS font-family (可含引号与多字体回退栈)
 * @param chars 需要测量的字符 (自动去重)
 * @param version 缓存版本号: 同一字体栈换了实际字体 (如异步加载完自定义字体) 时递增即可作废缓存
 */
export function measureInkOffsets(
  fontFamily: string,
  chars: readonly string[],
  version: number | string = 0,
): Map<string, InkOffset> {
  const out = new Map<string, InkOffset>();
  if (typeof document === 'undefined') return out;
  for (const ch of Array.from(new Set(chars))) {
    if (ch === '') continue;
    const key = `${version}|${fontFamily}|${ch}`;
    let off = inkCache.get(key);
    if (off === undefined) {
      const measured = measureOne(fontFamily, ch);
      if (!measured) continue;
      off = measured;
      inkCache.set(key, off);
    }
    out.set(ch, off);
  }
  return out;
}

/** 把墨迹偏移换算成 CSS transform (mm), 使墨迹中心落到格子中心 */
export function inkNudge(off: InkOffset | undefined, fontSizeMm: number): string {
  if (!off || (!off.dx && !off.dy)) return '';
  const x = (-off.dx * fontSizeMm).toFixed(2);
  const y = (-off.dy * fontSizeMm).toFixed(2);
  return `;transform:translate(${x}mm,${y}mm)`;
}

/** 每页格数 */
export const cellsPerPage = (cols: number, rows: number): number => cols * rows;

/** 全部页面所需格数 */
export const totalCells = (cols: number, rows: number, pages: number): number =>
  cellsPerPage(cols, rows) * pages;

/** 把字符序列按页切开 */
export function pageChunks(filled: Array<string | null>, per: number, pages: number): Array<Array<string | null>> {
  const out: Array<Array<string | null>> = [];
  for (let p = 0; p < pages; p++) out.push(filled.slice(p * per, (p + 1) * per));
  return out;
}

// ==================== 版式 (mm) ====================

/** 单格边长 (mm): 由可用宽高、行列数与格间距取小者, 精确到 0.1mm */
export function cellSizeMm(cols: number, rows: number, gap = 0): number {
  const g = Math.max(0, gap);
  const usableW = A4_MM.width - A4_MM.margin * 2 - g * Math.max(0, cols - 1);
  const usableH = A4_MM.height - A4_MM.margin * 2 - HEADER_MM - FOOTER_MM - g * Math.max(0, rows - 1);
  const byW = usableW / Math.max(1, cols);
  const byH = usableH / Math.max(1, rows);
  return Math.floor(Math.min(byW, byH) * 10) / 10;
}

/** 网格整体尺寸 (mm): 计入格间距 (格数 - 1 个空隙) */
export function gridSizeMm(cols: number, rows: number, gap = 0): { width: number; height: number } {
  const cell = cellSizeMm(cols, rows, gap);
  const g = Math.max(0, gap);
  return {
    width: Math.round((cell * cols + g * Math.max(0, cols - 1)) * 100) / 100,
    height: Math.round((cell * rows + g * Math.max(0, rows - 1)) * 100) / 100,
  };
}

// ==================== 格子与页面 HTML ====================

/** 格内辅助线 (米字 / 十字 / 回宫), 返回 SVG; 作文格无辅助线 */
export function buildGuideSvg(style: GridStyle, color: string, cell: number): string {
  const w = (mm: number) => (mm * 100 / Math.max(cell, 1)).toFixed(2);
  const line = (d: string, mm: number, dash = '') =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w(mm)}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  let body = '';
  if (style === 'mi') {
    body = line('M50 0V100', GUIDE_LINE_MM)
      + line('M0 50H100', GUIDE_LINE_MM)
      + line('M0 0L100 100', GUIDE_LINE_MM)
      + line('M100 0L0 100', GUIDE_LINE_MM);
  } else if (style === 'tian') {
    body = line('M50 0V100', GUIDE_LINE_MM) + line('M0 50H100', GUIDE_LINE_MM);
  } else if (style === 'hui') {
    body = line('M25 25H75V75H25Z', GUIDE_LINE_MM, '4 3')
      + line('M50 0V25', GUIDE_LINE_MM)
      + line('M50 75V100', GUIDE_LINE_MM)
      + line('M0 50H25', GUIDE_LINE_MM)
      + line('M75 50H100', GUIDE_LINE_MM);
  }
  if (body === '') return '';
  return `<svg class="cb-lines" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

/**
 * 转义将要写进 HTML 的文本 / 属性值。
 * 注意: 字体栈里带双引号 (如 "CopybookCustom", "Kaiti SC") 必须转义成 &quot;,
 * 否则 style="..." 属性会在第一个双引号处被截断, font-family 声明丢失, 字体设置全部失效。
 */
const attr = (s: string): string => escapeHtml(s);

export interface GridHtmlOptions {
  style: GridStyle;
  line: LineColor;
  mode: ContentMode;
  cols: number;
  rows: number;
  /** 本页字符序列 (长度 = cols × rows) */
  chars: Array<string | null>;
  /** CSS font-family (自定义字体已拼在栈首) */
  fontFamily: string;
  /** 格间距 (mm), 默认 0 */
  gap?: number;
  /** 墨迹偏移表 (measureInkOffsets 的结果), 用于把字的墨迹摆到格子正中 */
  ink?: Map<string, InkOffset> | null;
}

/**
 * 一个格子的内联样式。
 * 无间隔时只画上 / 左边线 (末列与末行补右边线 / 下边线), 相邻格共用一条线避免重叠加粗;
 * 有间隔时格子彼此分离, 每格都画完整的四边。
 */
export function cellStyle(cols: number, rows: number, r: number, c: number, cell: number, color: string, gap = 0): string {
  const parts = [`width:${cell}mm`, `height:${cell}mm`];
  if (gap > 0) {
    parts.push(`border:${CELL_LINE_MM}mm solid ${color}`);
    return parts.join(';');
  }
  parts.push(
    `border-top:${CELL_LINE_MM}mm solid ${color}`,
    `border-left:${CELL_LINE_MM}mm solid ${color}`,
  );
  if (c === cols - 1) parts.push(`border-right:${CELL_LINE_MM}mm solid ${color}`);
  if (r === rows - 1) parts.push(`border-bottom:${CELL_LINE_MM}mm solid ${color}`);
  return parts.join(';');
}

/** 整张格子 HTML (含辅助线与文字) */
export function buildGridHtml(o: GridHtmlOptions): string {
  const { cols, rows, mode } = o;
  const gap = normalizeGap(o.gap);
  const cell = cellSizeMm(cols, rows, gap);
  const color = LINE_COLOR_VALUE[o.line];
  const guide = buildGuideSvg(o.style, color, cell);
  const fontSizeMm = cell * CHAR_RATIO;
  const fontSize = fontSizeMm.toFixed(2);
  const textColor = mode === 'ink' ? TEXT_COLOR_INK : TEXT_COLOR_GRAY;
  const rowGap = gap > 0 ? ` style="gap:${gap}mm"` : '';
  const rowsHtml: string[] = [];
  for (let r = 0; r < rows; r++) {
    const cellsHtml: string[] = [];
    for (let c = 0; c < cols; c++) {
      const ch = o.chars[r * cols + c] ?? null;
      const show = ch !== null && (mode === 'trace' || mode === 'ink' || (mode === 'demo' && c === 0));
      const span = show
        ? `<span class="cb-ch" style="font-size:${fontSize}mm;color:${textColor};font-family:${attr(o.fontFamily)}${inkNudge(o.ink?.get(String(ch)), fontSizeMm)}">${attr(String(ch))}</span>`
        : '';
      cellsHtml.push(`<div class="cb-cell" style="${cellStyle(cols, rows, r, c, cell, color, gap)}">${guide}${span}</div>`);
    }
    rowsHtml.push(`<div class="cb-row"${rowGap}>${cellsHtml.join('')}</div>`);
  }
  const size = gridSizeMm(cols, rows, gap);
  const gridGap = gap > 0 ? `;gap:${gap}mm` : '';
  return `<div class="cb-grid" style="width:${size.width}mm;height:${size.height}mm${gridGap}">${rowsHtml.join('')}</div>`;
}

/** 打印文案 (由页面按当前语言组装) */
export interface CopybookText {
  /** 格型名, 如「米字格」 */
  styleName: string;
  /** 字体名 (自定义字体时为文件名) */
  fontName: string;
  /** 姓名 / 日期栏 */
  meta: string;
  /** 页脚模板, 如「第 {a} / {b} 页 · {d}」 */
  footer: string;
}

export interface CopybookOptions {
  style: GridStyle;
  line: LineColor;
  mode: ContentMode;
  cols: number;
  rows: number;
  pages: number;
  /** 全部页面的字符序列 (由 fillChars 生成) */
  chars: Array<string | null>;
  title: string;
  showMeta: boolean;
  date: string;
  /** CSS font-family (已含自定义字体栈首) */
  fontFamily: string;
  text: CopybookText;
  /** 格间距 (mm), 默认 0 */
  gap?: number;
  /** 墨迹偏移表 (measureInkOffsets 的结果), 用于把字的墨迹摆到格子正中 */
  ink?: Map<string, InkOffset> | null;
}

/** 模板变量填充: {a} / {b} 形式 */
export function fill(tpl: string, vars: Record<string, string | number>): string {
  let s = tpl;
  for (const [k, v] of Object.entries(vars)) s = s.split('{' + k + '}').join(String(v));
  return s;
}

/** 一页 HTML (一个 `.pg`) */
export function buildPageHtml(o: CopybookOptions, page: number, total: number): string {
  const per = cellsPerPage(o.cols, o.rows);
  const chars = o.chars.slice((page - 1) * per, page * per);
  const head = `<div class="cb-head">`
    + `<div class="cb-title">${attr(o.title)}</div>`
    + `<div class="cb-meta"><span>${attr(o.text.styleName)} · ${attr(o.text.fontName)}</span>`
    + (o.showMeta ? `<span>${attr(o.text.meta)}</span>` : '')
    + `</div></div>`;
  const body = `<div class="cb-body">${buildGridHtml({
    style: o.style, line: o.line, mode: o.mode, cols: o.cols, rows: o.rows, chars, fontFamily: o.fontFamily,
    gap: o.gap, ink: o.ink,
  })}</div>`;
  const foot = `<div class="cb-foot">${attr(fill(o.text.footer, { a: page, b: total, d: o.date }))}</div>`;
  return `<div class="pg cb-pg">${head}${body}${foot}</div>`;
}

/** 全部打印页 (每项一页 HTML) */
export function buildSheetPages(o: CopybookOptions): string[] {
  const out: string[] = [];
  for (let p = 1; p <= o.pages; p++) out.push(buildPageHtml(o, p, o.pages));
  return out;
}

/** 完整 body 片段 (打印用) */
export function buildSheetHtml(o: CopybookOptions): string {
  return buildSheetPages(o).join('');
}

/** 版式样式 (含 A4 页面基础样式); 自定义字体时附加 @font-face */
export function buildSheetCss(custom?: { data: string } | null): string {
  const face = custom
    ? `@font-face { font-family: "${CUSTOM_FAMILY}"; src: url("${custom.data}"); font-display: swap; }\n`
    : '';
  return `${PRINT_BASE_CSS}${face}
.cb-pg {
  display: flex;
  flex-direction: column;
  font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif;
}
.cb-head { border-bottom: 0.4mm solid #555; padding-bottom: 2mm; }
.cb-title { font-size: 6mm; font-weight: 700; letter-spacing: 2mm; text-align: center; }
.cb-meta { margin-top: 1.5mm; display: flex; justify-content: space-between; font-size: 3.4mm; color: #555; }
.cb-body { flex: 1; display: flex; align-items: center; justify-content: center; }
.cb-grid { display: flex; flex-direction: column; }
.cb-row { display: flex; }
.cb-cell { position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.cb-lines { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
.cb-ch { position: relative; line-height: 1; font-weight: 400; }
.cb-foot { font-size: 3.2mm; color: #888; text-align: right; }
`;
}

/** 预览 / 打印共用的字体栈 (自定义字体优先) */
export function fontStack(label: string, custom: boolean): string {
  if (custom) return `"${CUSTOM_FAMILY}", ${fontFamilyOf(label)}`;
  return fontFamilyOf(label);
}

/** 字体名 -> CSS font-family */
export function fontFamilyOf(label: string): string {
  const hit = FONTS.find((f) => f.label === label) ?? FONTS.find((f) => f.label === FONT_DEFAULT);
  return hit ? hit.family : 'serif';
}

// ==================== 归一化与设置项 ====================

const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  // 注意: Number(null) === 0, 若只判 Number.isFinite 会让「未设置」变成范围下限,
  // 因此 null / undefined / 空串必须显式回退到 fallback
  if (v === null || v === undefined || String(v).trim() === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** 与 clampInt 相同, 但保留 0.1 精度 (格间距这类可带小数的设置项) */
const clampNum = (v: unknown, min: number, max: number, fallback: number): number => {
  if (v === null || v === undefined || String(v).trim() === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n * 10) / 10));
};

export const normalizeStyle = (v: unknown): GridStyle =>
  (v === 'mi' || v === 'tian' || v === 'hui' || v === 'zuowen') ? v : 'mi';
export const normalizeFont = (v: unknown): string =>
  typeof v === 'string' && FONTS.some((f) => f.label === v) ? v : FONT_DEFAULT;
export const normalizeLine = (v: unknown): LineColor =>
  (v === 'red' || v === 'gray' || v === 'blue' || v === 'green') ? v : 'red';
export const normalizeMode = (v: unknown): ContentMode =>
  (v === 'trace' || v === 'ink' || v === 'demo' || v === 'blank') ? v : 'trace';
export const normalizeCols = (v: unknown): number => clampInt(v, COLS_MIN, COLS_MAX, COLS_DEFAULT);
export const normalizeRows = (v: unknown): number => clampInt(v, ROWS_MIN, ROWS_MAX, ROWS_DEFAULT);
export const normalizePages = (v: unknown): number => clampInt(v, PAGES_MIN, PAGES_MAX, PAGES_DEFAULT);
export const normalizeGap = (v: unknown): number => clampNum(v, GAP_MIN, GAP_MAX, GAP_DEFAULT);
export const normalizeLoop = (v: unknown): boolean => !(v === '0' || v === 'false' || v === false);

/** 某格型的默认行列数 (切换格型时用于智能套用) */
export const defaultGridOf = (style: GridStyle): { cols: number; rows: number } => DEFAULT_GRID[style];

// ==================== 设置项持久化 ====================

const readSetting = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch (e) { return null; }
};
const writeSetting = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch (e) { /* 隐私模式等场景忽略 */ }
};

export const getDefaultStyle = (): GridStyle => normalizeStyle(readSetting(KEY_STYLE));
export const getDefaultFont = (): string => normalizeFont(readSetting(KEY_FONT));
export const getDefaultLine = (): LineColor => normalizeLine(readSetting(KEY_LINE));
export const getDefaultMode = (): ContentMode => normalizeMode(readSetting(KEY_MODE));
export const getDefaultCols = (): number => normalizeCols(readSetting(KEY_COLS));
export const getDefaultRows = (): number => normalizeRows(readSetting(KEY_ROWS));
export const getDefaultPages = (): number => normalizePages(readSetting(KEY_PAGES));
export const getDefaultGap = (): number => normalizeGap(readSetting(KEY_GAP));
export const getDefaultText = (): string => readSetting(KEY_TEXT) ?? '';
export const getDefaultLoop = (): boolean => {
  const raw = readSetting(KEY_LOOP);
  return raw === null ? true : normalizeLoop(raw);
};
/** 默认按行填充 (一行练一个字): 未设置过时为关闭 */
export const getDefaultByRow = (): boolean => {
  const raw = readSetting(KEY_BY_ROW);
  return raw === null ? false : normalizeLoop(raw);
};

export const setDefaultStyle = (v: GridStyle): void => writeSetting(KEY_STYLE, v);
export const setDefaultFont = (v: string): void => writeSetting(KEY_FONT, v);
export const setDefaultLine = (v: LineColor): void => writeSetting(KEY_LINE, v);
export const setDefaultMode = (v: ContentMode): void => writeSetting(KEY_MODE, v);
export const setDefaultCols = (v: number): void => writeSetting(KEY_COLS, String(normalizeCols(v)));
export const setDefaultRows = (v: number): void => writeSetting(KEY_ROWS, String(normalizeRows(v)));
export const setDefaultPages = (v: number): void => writeSetting(KEY_PAGES, String(normalizePages(v)));
export const setDefaultGap = (v: number): void => writeSetting(KEY_GAP, String(normalizeGap(v)));
export const setDefaultText = (v: string): void => writeSetting(KEY_TEXT, v);
export const setDefaultLoop = (v: boolean): void => writeSetting(KEY_LOOP, v ? '1' : '0');
export const setDefaultByRow = (v: boolean): void => writeSetting(KEY_BY_ROW, v ? '1' : '0');
