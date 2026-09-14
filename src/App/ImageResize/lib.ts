// 图片尺寸调整: 纯逻辑 (目标尺寸计算 / 逐级缩放步骤 / 文件命名 / 设置持久化)
// 说明: 与 DOM / Canvas 无关, 便于单测; 页面只负责把结果画到 canvas 上
import {
  DEFAULT_BASE, PERCENT_DEFAULT, PERCENT_MAX, PERCENT_MIN,
  QUALITY_DEFAULT, QUALITY_MAX, QUALITY_MIN, SIZE_MAX, SIZE_MIN,
} from './data';

/** 输出格式 */
export type OutputFormat = 'PNG' | 'JPEG';
export const OUTPUT_FORMATS: OutputFormat[] = [ 'PNG', 'JPEG' ];

/** 尺寸模式: percent = 按原图比例缩放; pixel = 指定宽高像素 */
export type SizeMode = 'percent' | 'pixel';
export const SIZE_MODES: SizeMode[] = [ 'percent', 'pixel' ];

/** 设置持久化 key */
export const KEY_PERCENT = 'image-resize.default-percent';
export const KEY_FORMAT = 'image-resize.default-format';
export const KEY_QUALITY = 'image-resize.jpeg-quality';
export const KEY_LOCK = 'image-resize.lock-ratio';

/** 宽高 (像素) */
export interface Size { width: number; height: number; }

export const isOutputFormat = (v: unknown): v is OutputFormat => OUTPUT_FORMATS.includes(v as OutputFormat);
export const isSizeMode = (v: unknown): v is SizeMode => SIZE_MODES.includes(v as SizeMode);

/** 像素取整并保证 >= SIZE_MIN */
export const clampPixel = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return SIZE_MIN;
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(n)));
};

/** 比例裁剪到 [PERCENT_MIN, PERCENT_MAX], 非法值回退默认 */
export const normalizePercent = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return PERCENT_DEFAULT;
  return Math.min(PERCENT_MAX, Math.max(PERCENT_MIN, Math.round(n)));
};

/** 非法格式回退 PNG */
export const normalizeFormat = (v: unknown): OutputFormat => (isOutputFormat(v) ? v : 'PNG');
/** 非法模式回退按比例 */
export const normalizeMode = (v: unknown): SizeMode => (isSizeMode(v) ? v : 'percent');

/** 质量裁剪到 [QUALITY_MIN, QUALITY_MAX], 非法值 (含 null / '' ) 回退默认 */
export const normalizeQuality = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return QUALITY_DEFAULT;
  return Math.min(QUALITY_MAX, Math.max(QUALITY_MIN, n));
};

/** 按比例算目标尺寸 (宽高各自四舍五入, 至少 1 像素) */
export const sizeFromPercent = (orig: Size, percent: number): Size => ({
  width: Math.max(1, Math.round(orig.width * percent / 100)),
  height: Math.max(1, Math.round(orig.height * percent / 100)),
});

/** 已知宽度, 按原图宽高比算高度 */
export const sizeFromWidth = (width: number, orig: Size): Size => {
  const w = clampPixel(width);
  if (orig.width <= 0 || orig.height <= 0) return { width: w, height: w };
  return { width: w, height: Math.max(1, Math.round(w * orig.height / orig.width)) };
};

/** 已知高度, 按原图宽高比算宽度 */
export const sizeFromHeight = (height: number, orig: Size): Size => {
  const h = clampPixel(height);
  if (orig.width <= 0 || orig.height <= 0) return { width: h, height: h };
  return { width: Math.max(1, Math.round(h * orig.width / orig.height)), height: h };
};

/** 等比缩放到不超过 maxW × maxH (本身未超限时原样返回) */
export const fitWithin = (size: Size, maxW: number, maxH: number): Size => {
  if (size.width <= maxW && size.height <= maxH) return size;
  const ratio = Math.min(maxW / size.width, maxH / size.height);
  return {
    width: Math.max(1, Math.round(size.width * ratio)),
    height: Math.max(1, Math.round(size.height * ratio)),
  };
};

/** 计算目标尺寸: 按比例 / 按像素, 可选「不放大」(超出原图时等比缩回原图大小) */
export const computeSize = (
  orig: Size,
  opts: { mode: SizeMode; percent: number; width: number; height: number; noUpscale: boolean },
): Size => {
  const raw: Size = opts.mode === 'percent'
    ? sizeFromPercent(orig, normalizePercent(opts.percent))
    : { width: clampPixel(opts.width), height: clampPixel(opts.height) };
  if (!opts.noUpscale) return raw;
  return fitWithin(raw, orig.width, orig.height);
};

/** 缩放比例 (结果宽 / 原图宽), 保留两位小数 */
export const scaleFactor = (orig: Size, size: Size): number => {
  if (orig.width <= 0) return 1;
  return Math.round((size.width / orig.width) * 10000) / 10000;
};

/** 缩放比例文案 (如 50% / 33.33%) */
export const formatScale = (orig: Size, size: Size): string => `${Math.round(scaleFactor(orig, size) * 10000) / 100}%`;

/**
 * 逐级缩放步骤 (不含原图, 末项必为目标尺寸)
 * 缩小超过一半时分多步进行, 避免一次性大比例缩放导致的锯齿与模糊
 */
export const scaleSteps = (origW: number, origH: number, targetW: number, targetH: number): Size[] => {
  const steps: Size[] = [];
  let cw = origW;
  let ch = origH;
  while (cw > targetW * 2 && ch > targetH * 2 && cw > 1 && ch > 1) {
    cw = Math.max(targetW, Math.round(cw / 2));
    ch = Math.max(targetH, Math.round(ch / 2));
    steps.push({ width: cw, height: ch });
  }
  const last = steps[steps.length - 1];
  if (!last || last.width !== targetW || last.height !== targetH) steps.push({ width: targetW, height: targetH });
  return steps;
};

/** 输出扩展名 */
export const extOf = (format: OutputFormat): string => (format === 'JPEG' ? 'jpg' : 'png');
/** 输出 MIME */
export const mimeOf = (format: OutputFormat): string => (format === 'JPEG' ? 'image/jpeg' : 'image/png');

/** 去掉扩展名与路径分隔符 / 非法字符, 生成文件名主体 */
export const baseName = (fileName: string): string => {
  const noExt = fileName.replace(/\.[^.\\/]+$/, '');
  const clean = noExt.replace(/[\\/:*?"<>|]+/g, '_').trim();
  return clean === '' ? DEFAULT_BASE : clean;
};

/** 输出文件名: 原名_宽x高.扩展名 */
export const outputFileName = (base: string, size: Size, format: OutputFormat): string =>
  `${base === '' ? DEFAULT_BASE : base}_${size.width}x${size.height}.${extOf(format)}`;

/** dataURL -> 字节数组 (base64 解码; 用于 JPEG 等需要原始字节的保存场景) */
export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

/** 字节数格式化 */
export const formatBytes = (n: number): string => {
  if (!Number.isFinite(n) || n <= 0) return '0 B';
  if (n < 1024) return `${Math.round(n)} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

// ---- 设置持久化 (localStorage 不可用时静默忽略) ----
const rawGet = (key: string): string | null => {
  try { return window.localStorage.getItem(key); } catch { return null; }
};
const rawSet = (key: string, value: string): void => {
  try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
};

export const getDefaultPercent = (): number => normalizePercent(rawGet(KEY_PERCENT));
export const setDefaultPercent = (v: number): void => rawSet(KEY_PERCENT, String(v));
export const getDefaultFormat = (): OutputFormat => normalizeFormat(rawGet(KEY_FORMAT));
export const setDefaultFormat = (v: OutputFormat): void => rawSet(KEY_FORMAT, v);
export const getDefaultQuality = (): number => normalizeQuality(rawGet(KEY_QUALITY));
export const setDefaultQuality = (v: number): void => rawSet(KEY_QUALITY, String(v));
/** 锁定宽高比: 未设置过时为 true */
export const getLockRatio = (): boolean => rawGet(KEY_LOCK) !== '0';
export const setLockRatio = (v: boolean): void => rawSet(KEY_LOCK, v ? '1' : '0');
