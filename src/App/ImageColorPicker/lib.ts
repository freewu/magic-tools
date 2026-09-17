// 图片取色: 坐标换算 / 像素读取 / 颜色格式转换 (纯函数, 不依赖 canvas / DOM, 便于单测)
import { LOUPE_SPAN, RECENT_MAX } from './data';
import type { Size } from '../../lib/image';

/** 图片内的像素坐标 */
export interface Point { x: number; y: number }
/** 一个像素的 RGBA 分量 */
export interface Rgb { r: number; g: number; b: number; a: number }
/** 矩形区域 (像素坐标) */
export interface Region { x: number; y: number; w: number; h: number }
/** 元素的显示矩形 (与 DOMRect 兼容, 便于测试时直接传对象) */
export interface RectLike { left: number; top: number; width: number; height: number }

/**
 * 把鼠标位置换算成图片像素坐标
 * - canvas 用 CSS `max-width: 100%` 缩放显示时, 需要用显示尺寸与原图尺寸的比例换算
 * - 落在图片之外返回 null
 */
export const toImagePoint = (
  rect: RectLike,
  size: Size,
  clientX: number,
  clientY: number,
): Point | null => {
  if (!(rect.width > 0) || !(rect.height > 0) || !(size.width > 0) || !(size.height > 0)) return null;
  const x = Math.floor((clientX - rect.left) / rect.width * size.width);
  const y = Math.floor((clientY - rect.top) / rect.height * size.height);
  if (x < 0 || y < 0 || x >= size.width || y >= size.height) return null;
  return { x, y };
};

/** 像素在 RGBA 数组中的起始下标 (越界返回 -1) */
export const pixelIndex = (size: Size, x: number, y: number): number => {
  if (x < 0 || y < 0 || x >= size.width || y >= size.height) return -1;
  return (y * size.width + x) * 4;
};

/** 读取指定像素的 RGBA (越界或数据不足返回 null) */
export const colorAt = (
  data: Uint8ClampedArray | number[],
  size: Size,
  x: number,
  y: number,
): Rgb | null => {
  const i = pixelIndex(size, x, y);
  if (i < 0 || i + 3 >= data.length) return null;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
};

/**
 * 放大镜取样区域: 以 (x, y) 为中心、边长 span 的正方形, 超出图片范围时整体平移贴边
 * 这样即使鼠标停在四个角上, 中心像素也始终落在区域正中
 */
export const loupeRegion = (size: Size, x: number, y: number, span: number = LOUPE_SPAN): Region => {
  const w = Math.min(Math.max(1, Math.round(span)), size.width);
  const h = Math.min(Math.max(1, Math.round(span)), size.height);
  const half = Math.floor(w / 2);
  const left = Math.min(Math.max(0, x - half), Math.max(0, size.width - w));
  const halfH = Math.floor(h / 2);
  const top = Math.min(Math.max(0, y - halfH), Math.max(0, size.height - h));
  return { x: left, y: top, w, h };
};

/** 从整张图片的数据里裁剪出区域数据 (越界部分补透明), 用于放大镜 */
export const cropPixels = (
  data: Uint8ClampedArray | number[],
  size: Size,
  region: Region,
): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(region.w * region.h * 4);
  for (let y = 0; y < region.h; y++) {
    for (let x = 0; x < region.w; x++) {
      const src = pixelIndex(size, region.x + x, region.y + y);
      const dst = (y * region.w + x) * 4;
      if (src < 0 || src + 3 >= data.length) continue;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
      out[dst + 3] = data[src + 3];
    }
  }
  return out;
};

/** 分量夹取到 0~255 的整数 */
const byte = (v: number): number => (Number.isFinite(v) ? Math.min(255, Math.max(0, Math.round(v))) : 0);

/** 十六进制颜色 (小写, #rrggbb); α 通道不参与, 因为取色以屏幕观感为准 */
export const rgbToHex = (c: Pick<Rgb, 'r' | 'g' | 'b'>): string =>
  '#' + [ c.r, c.g, c.b ].map((v) => byte(v).toString(16).padStart(2, '0')).join('');

/** CSS rgb() 写法 */
export const formatRgb = (c: Pick<Rgb, 'r' | 'g' | 'b'>): string =>
  `rgb(${byte(c.r)}, ${byte(c.g)}, ${byte(c.b)})`;

/** RGB -> HSL (h: 0~360, s / l: 0~100) */
export const rgbToHsl = (c: Pick<Rgb, 'r' | 'g' | 'b'>): { h: number; s: number; l: number } => {
  const r = byte(c.r) / 255;
  const g = byte(c.g) / 255;
  const b = byte(c.b) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: Math.round(l * 100) };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};

/** CSS hsl() 写法 */
export const formatHsl = (c: Pick<Rgb, 'r' | 'g' | 'b'>): string => {
  const { h, s, l } = rgbToHsl(c);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/**
 * 把一个颜色压入「最近取色」列表
 * - 已存在的颜色会被提到最前 (不重复占位)
 * - 超出 max 条时截断 (默认 12)
 */
export const pushRecent = (list: string[], hex: string, max: number = RECENT_MAX): string[] => {
  const h = hex.toLowerCase();
  const rest = list.map((v) => v.toLowerCase()).filter((v) => v !== h);
  const limit = Math.max(1, Math.round(max));
  return [ h, ...rest ].slice(0, limit);
};
