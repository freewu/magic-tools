// GIF 生成: 纯逻辑 (尺寸适配 / 帧合成 / 参数规范化 / 默认值持久化), 页面只负责交互与 canvas 预览
import { baseName, createCanvas, get2d, readPixels, type Size } from '../../lib/image';
import {
  GIF_COLORS_DEFAULT, GIF_COLORS_MAX, GIF_COLORS_MIN, GIF_DELAY_DEFAULT, GIF_DELAY_MAX, GIF_DITHERS,
  GIF_LOOP_INFINITE, type EncodeFrame, type GifDither,
} from '../../lib/gif';

/** 单帧最多容纳的图片数 (超出部分提示后忽略) */
export const MAX_IMAGES = 500;
/** 帧延时下限取 20ms: 主流浏览器会把小于 20ms 的 GIF 帧按 100ms 处理, 避免用户设了却看不到效果 */
export const DELAY_MIN = 20;
export const DELAY_MAX = GIF_DELAY_MAX;
export const DELAY_DEFAULT = GIF_DELAY_DEFAULT;
export const LOOP_MIN = 0;
export const LOOP_MAX = 100;
export const LOOP_DEFAULT = GIF_LOOP_INFINITE;
export const COLORS_MIN = GIF_COLORS_MIN;
export const COLORS_MAX = GIF_COLORS_MAX;
export const COLORS_DEFAULT = GIF_COLORS_DEFAULT;
export const DITHER_DEFAULT: GifDither = 'none';
/** 背景色为空串表示透明 */
export const BG_DEFAULT = '';

/** 多张图片尺寸不一致时如何放入画布 */
export type FitMode = 'contain' | 'cover' | 'stretch' | 'source';
export const FIT_MODES: readonly FitMode[] = [ 'contain', 'cover', 'stretch', 'source' ] as const;
export const FIT_DEFAULT: FitMode = 'contain';

/** 尺寸模式文案 (zh 原文, 页面用 im 翻译) */
export const FIT_TEXT: Record<FitMode, string> = {
  contain: '完整显示 (留白)',
  cover: '裁剪填满',
  stretch: '拉伸铺满',
  source: '跟随第一张图',
};
export const FIT_HINTS: Record<FitMode, string> = {
  contain: '图片整张放进画布, 比例不变, 空隙用背景色 / 透明填充',
  cover: '图片放大到铺满画布, 超出部分裁掉, 比例不变',
  stretch: '图片拉伸到画布尺寸, 比例可能变形',
  source: '画布尺寸跟随第一张图, 后面的图片按比例放入',
};

/** 抖动算法文案 (zh 原文, 页面用 im 翻译) */
export const DITHER_TEXT: Record<GifDither, string> = {
  none: '不抖动',
  'floyd-steinberg': 'Floyd-Steinberg',
  atkinson: 'Atkinson',
  stucki: 'Stucki',
};

const round = (v: number) => Math.round(v);

/** 取整并夹到区间; null / undefined / '' 视为未设置 -> fallback */
export const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  if (v === null || v === undefined || v === '') return fallback;
  const n = round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export const normalizeDelay = (v: unknown, fallback = DELAY_DEFAULT): number => clampInt(v, DELAY_MIN, DELAY_MAX, fallback);
export const normalizeLoop = (v: unknown, fallback = LOOP_DEFAULT): number => clampInt(v, LOOP_MIN, LOOP_MAX, fallback);
export const normalizeColors = (v: unknown, fallback = COLORS_DEFAULT): number => clampInt(v, COLORS_MIN, COLORS_MAX, fallback);

export const normalizeDither = (v: unknown): GifDither =>
  (GIF_DITHERS as readonly unknown[]).includes(v) ? (v as GifDither) : DITHER_DEFAULT;

export const normalizeFit = (v: unknown): FitMode =>
  (FIT_MODES as readonly unknown[]).includes(v) ? (v as FitMode) : FIT_DEFAULT;

/** 颜色规范化: 支持 #rgb / #rrggbb / #rrggbbaa, 返回小写 #rrggbb; 空串表示透明; 非法回退 fallback */
export const normalizeColor = (v: unknown, fallback = BG_DEFAULT): string => {
  const s = String(v ?? '').trim();
  if (s === '') return '';
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const [ r, g, b ] = [ s[1], s[2], s[3] ];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{8}$/.test(s)) return s.slice(0, 7).toLowerCase();
  return fallback;
};

/** 颜色 -> [r, g, b, a]; 透明或非法返回 null */
export const parseColor = (v: unknown): [ number, number, number, number ] | null => {
  const hex = normalizeColor(v, '');
  if (hex === '') return null;
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255,
  ];
};

/**
 * 把 srcW×srcH 的图放进 dstW×dstH 画布的目标矩形
 * contain 居中留白; cover 放大后居中裁剪 (可能为负偏移); stretch 铺满; source 与 contain 相同 (画布已按首图定尺寸)
 */
export const fitRect = (
  srcW: number, srcH: number, dstW: number, dstH: number, mode: FitMode = FIT_DEFAULT,
): { x: number; y: number; width: number; height: number } | null => {
  if (!(srcW >= 1) || !(srcH >= 1) || !(dstW >= 1) || !(dstH >= 1)) return null;
  if (mode === 'stretch') return { x: 0, y: 0, width: round(dstW), height: round(dstH) };
  const scale = mode === 'cover'
    ? Math.max(dstW / srcW, dstH / srcH)
    : Math.min(dstW / srcW, dstH / srcH);
  // cover 用 ceil 保证盖满, contain 用 round 避免多出 1px 边
  const width = mode === 'cover' ? Math.ceil(srcW * scale) : round(srcW * scale);
  const height = mode === 'cover' ? Math.ceil(srcH * scale) : round(srcH * scale);
  return {
    x: Math.floor((dstW - width) / 2),
    y: Math.floor((dstH - height) / 2),
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
};

/** 画布尺寸: 「跟随第一张图」用首图尺寸, 其余用自定义尺寸 (非法尺寸回退 1) */
export const canvasSizeFor = (sources: readonly Size[], mode: FitMode, custom: Size): Size => {
  if (mode === 'source' && sources.length > 0) {
    const first = sources[0];
    return { width: Math.max(1, round(first.width)), height: Math.max(1, round(first.height)) };
  }
  return { width: Math.max(1, round(custom.width)), height: Math.max(1, round(custom.height)) };
};

/** 一帧图片: 已解码的元素 + 原始尺寸 */
export interface FrameSource {
  img: HTMLImageElement | HTMLCanvasElement;
  size: Size;
}

export interface BuildOptions {
  width: number;
  height: number;
  fit: FitMode;
  /** 每帧延时 (ms), 逐帧延时由页面在调用前写好 */
  delay: number;
  /** 背景色 ('' = 透明) */
  bg: string;
}

/**
 * 把每张图片按尺寸模式画进同尺寸画布并读出像素 (canvas 不可用返回 null)
 * @param delays 与 sources 一一对应的延时 (缺省用 opts.delay)
 */
export const buildFrames = (
  sources: readonly FrameSource[], opts: BuildOptions, delays?: readonly number[],
): EncodeFrame[] | null => {
  const { width, height, fit, bg } = opts;
  if (sources.length === 0) return [];
  const out: EncodeFrame[] = [];
  const fill = normalizeColor(bg, '');
  for (let i = 0; i < sources.length; i += 1) {
    // 每帧新建画布: 天然透明底, 不必 clearRect
    const canvas = createCanvas({ width, height });
    if (!canvas) return null;
    const ctx = get2d(canvas);
    if (!ctx) return null;
    if (fill !== '') {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, width, height);
    }
    const rect = fitRect(sources[i].size.width, sources[i].size.height, width, height, fit);
    if (rect) ctx.drawImage(sources[i].img, rect.x, rect.y, rect.width, rect.height);
    const pixels = readPixels(canvas);
    if (!pixels) return null;
    out.push({ data: new Uint8ClampedArray(pixels.data), delay: normalizeDelay(delays?.[i] ?? opts.delay) });
  }
  return out;
};

/** 输出文件名: 首图名 + .gif (无图时 animation.gif) */
export const defaultGifName = (sources: readonly { name: string }[]): string =>
  `${baseName(sources[0]?.name ?? '', 'animation')}.gif`;

/** 帧总时长 (ms) */
export const totalMs = (frames: readonly { delay: number }[]): number =>
  frames.reduce((sum, f) => sum + Math.max(0, Math.round(Number(f.delay) || 0)), 0);

/** 移动列表项 (返回新数组, 越界时保持原顺序) */
export const moveItem = <T,>(list: readonly T[], index: number, delta: number): T[] => {
  const to = index + delta;
  if (!Number.isInteger(index) || index < 0 || index >= list.length || to < 0 || to >= list.length) return [ ...list ];
  const next = [ ...list ];
  const [ item ] = next.splice(index, 1);
  next.splice(to, 0, item);
  return next;
};

/** 删除列表项 (返回新数组) */
export const removeItem = <T,>(list: readonly T[], index: number): T[] =>
  index >= 0 && index < list.length ? [ ...list.slice(0, index), ...list.slice(index + 1) ] : [ ...list ];

/** 反转列表 (返回新数组) */
export const reverseItems = <T,>(list: readonly T[]): T[] => [ ...list ].reverse();

/** 改写某一帧的延时 (返回新数组) */
export const withDelay = <T extends { delay: number }>(list: readonly T[], index: number, delay: number): T[] => {
  if (index < 0 || index >= list.length) return [ ...list ];
  const next = [ ...list ];
  next[index] = { ...next[index], delay: normalizeDelay(delay) };
  return next;
};

/** 把所有帧的延时设为同一值 (返回新数组) */
export const withAllDelays = <T extends { delay: number }>(list: readonly T[], delay: number): T[] => {
  const d = normalizeDelay(delay);
  return list.map((item) => ({ ...item, delay: d }));
};

// ---- 默认值持久化 (工具页与设置页共享, 改动后广播) ----
export const DELAY_KEY = 'gif-generator:delay';
export const LOOP_KEY = 'gif-generator:loop';
export const COLORS_KEY = 'gif-generator:colors';
export const DITHER_KEY = 'gif-generator:dither';
export const FIT_KEY = 'gif-generator:fit';
export const BG_KEY = 'gif-generator:bg';
export const GIF_GEN_CHANGED = 'gif-generator:default-changed';

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 隐私模式 / 配额不足: 静默降级为「本次会话有效」
  }
};
const broadcast = (): void => {
  try {
    window.dispatchEvent(new Event(GIF_GEN_CHANGED));
  } catch {
    // 非浏览器环境忽略
  }
};

export interface GenDefaults {
  delay: number;
  loop: number;
  colors: number;
  dither: GifDither;
  fit: FitMode;
  bg: string;
}

export const getGenDefaults = (): GenDefaults => ({
  delay: normalizeDelay(read(DELAY_KEY)),
  loop: normalizeLoop(read(LOOP_KEY)),
  colors: normalizeColors(read(COLORS_KEY)),
  dither: normalizeDither(read(DITHER_KEY)),
  fit: normalizeFit(read(FIT_KEY)),
  bg: normalizeColor(read(BG_KEY), ''),
});

export const setGenDefault = <K extends keyof GenDefaults>(key: K, value: GenDefaults[K]): void => {
  const map: Record<keyof GenDefaults, string> = {
    delay: DELAY_KEY, loop: LOOP_KEY, colors: COLORS_KEY,
    dither: DITHER_KEY, fit: FIT_KEY, bg: BG_KEY,
  };
  write(map[key], String(value));
  broadcast();
};

// ---- 配置文件导入导出 (约定: getDefault<Item> / setDefault<Item> 成对) ----

/** 读取全部默认值 (配置导出用) */
export const getDefaultGen = (): GenDefaults => getGenDefaults();

/** 写回全部默认值 (配置导入用; 缺失项保持原值, 非法值自动规范化) */
export const setDefaultGen = (gen: Partial<GenDefaults> | null | undefined): void => {
  if (gen === null || typeof gen !== 'object') return;
  if (gen.delay !== undefined) setGenDefault('delay', normalizeDelay(gen.delay as number));
  if (gen.loop !== undefined) setGenDefault('loop', normalizeLoop(gen.loop as number));
  if (gen.colors !== undefined) setGenDefault('colors', normalizeColors(gen.colors as number));
  if (gen.dither !== undefined) setGenDefault('dither', normalizeDither(gen.dither as string));
  if (gen.fit !== undefined) setGenDefault('fit', normalizeFit(gen.fit as string));
  if (gen.bg !== undefined) setGenDefault('bg', normalizeColor(gen.bg as string, ''));
};
