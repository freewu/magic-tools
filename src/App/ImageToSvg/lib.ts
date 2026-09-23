// 图片转 SVG: 参数归一化 / VTracer 参数映射 / SVG 后处理 (纯函数, 不依赖 wasm / DOM, 便于单测)
//
// 实际调用 VTracer WASM 的代码在 tracer.ts (动态 import, 不进首屏), 这里只负责"可测"的部分。
import {
  COLOR_MODES, HIERARCHICALS, MODES, PARAMS, TRACE_PIXEL_LIMIT,
  type ColorMode, type Hierarchical, type Mode, type ParamKey, type TraceConfig, DEFAULT_CONFIG,
} from './data';
import type { Size } from '../../lib/image';

/** 发送给 VTracer WASM 的配置 (字段名与 wasm 的 serde 定义一致, 缺一不可) */
export interface TraceRequest {
  binary: boolean;
  mode: Mode;
  hierarchical: Hierarchical;
  cornerThreshold: number;
  lengthThreshold: number;
  maxIterations: number;
  spliceThreshold: number;
  filterSpeckle: number;
  colorPrecision: number;
  layerDifference: number;
  pathPrecision: number;
}

export interface TraceResult {
  /** 注入 viewBox 后的 SVG 文本 */
  svg: string;
  /** SVG 字节数 (UTF-8) */
  bytes: number;
  /** <path> 数量 */
  paths: number;
  /** 实际送入矢量化的尺寸 */
  size: Size;
  /** 是否因为「最长边限制 / 像素总量上限」被缩小 */
  scaled: boolean;
  /** 耗时 (毫秒) */
  ms: number;
}

/** 数值夹取到参数的 [min, max] 并按 step 对齐 (非数字回退默认值) */
export const clampParam = (key: ParamKey, v: unknown): number => {
  const p = PARAMS[key];
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return p.def;
  const snapped = Math.round(n / p.step) * p.step;
  const fixed = Math.round(snapped * 100) / 100;
  return Math.min(p.max, Math.max(p.min, fixed));
};

/** 枚举归一化 (非法值回退默认) */
const pick = <T extends string>(allowed: readonly T[], v: unknown, fallback: T): T =>
  (allowed as readonly string[]).includes(v as string) ? v as T : fallback;

/**
 * 参数归一化: 枚举非法回退默认值, 数值按各自区间夹取并吸附到步长
 * 页面与会话恢复都走这里, 保证送入 wasm 的配置永远是合法且完整的
 */
export const normalizeConfig = (input?: Partial<TraceConfig> | null): TraceConfig => ({
  colorMode: pick<ColorMode>(COLOR_MODES, input?.colorMode, DEFAULT_CONFIG.colorMode),
  mode: pick<Mode>(MODES, input?.mode, DEFAULT_CONFIG.mode),
  hierarchical: pick<Hierarchical>(HIERARCHICALS, input?.hierarchical, DEFAULT_CONFIG.hierarchical),
  filterSpeckle: clampParam('filterSpeckle', input?.filterSpeckle ?? DEFAULT_CONFIG.filterSpeckle),
  colorPrecision: clampParam('colorPrecision', input?.colorPrecision ?? DEFAULT_CONFIG.colorPrecision),
  layerDifference: clampParam('layerDifference', input?.layerDifference ?? DEFAULT_CONFIG.layerDifference),
  cornerThreshold: clampParam('cornerThreshold', input?.cornerThreshold ?? DEFAULT_CONFIG.cornerThreshold),
  lengthThreshold: clampParam('lengthThreshold', input?.lengthThreshold ?? DEFAULT_CONFIG.lengthThreshold),
  maxIterations: clampParam('maxIterations', input?.maxIterations ?? DEFAULT_CONFIG.maxIterations),
  spliceThreshold: clampParam('spliceThreshold', input?.spliceThreshold ?? DEFAULT_CONFIG.spliceThreshold),
  pathPrecision: clampParam('pathPrecision', input?.pathPrecision ?? DEFAULT_CONFIG.pathPrecision),
});

/**
 * 界面参数 -> VTracer WASM 配置
 * 注意: wasm 侧的 Config 没有 serde 默认值, 11 个字段缺任意一个都会 panic, 所以这里全量给出
 */
export const toRequest = (config: TraceConfig): TraceRequest => ({
  binary: config.colorMode === 'binary',
  mode: config.mode,
  hierarchical: config.hierarchical,
  cornerThreshold: config.cornerThreshold,
  lengthThreshold: config.lengthThreshold,
  maxIterations: config.maxIterations,
  spliceThreshold: config.spliceThreshold,
  filterSpeckle: config.filterSpeckle,
  colorPrecision: config.colorPrecision,
  layerDifference: config.layerDifference,
  pathPrecision: config.pathPrecision,
});

/**
 * VTracer 的 binary 模式按「红通道 < 128」判定前景, 对彩色原图并不等价于"亮度 < 128"。
 * 因此黑白二值前先把像素按 Rec.709 亮度转成灰度 (R = G = B), 让判定结果符合直觉。
 * 返回新的 Uint8Array (α 通道保持不变; VTracer 用 α = 0 判断透明区域)。
 */
export const toGrayPixels = (data: Uint8ClampedArray): Uint8Array => {
  const out = new Uint8Array(data.length);
  let i = 0;
  for (; i + 3 < data.length; i += 4) {
    const v = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
    out[i] = v;
    out[i + 1] = v;
    out[i + 2] = v;
    out[i + 3] = data[i + 3];
  }
  for (; i < data.length; i++) out[i] = data[i];
  return out;
};

/**
 * 计算实际送入矢量化的尺寸
 * - maxSide > 0: 最长边不超过 maxSide
 * - 兜底: 像素总量不超过 TRACE_PIXEL_LIMIT (原尺寸处理超大图会长时间占住主线程)
 * @returns size = 实际尺寸, scaled = 是否被缩小
 */
export const traceSizeOf = (size: Size, maxSide: number): { size: Size; scaled: boolean } => {
  const w = Math.max(1, Math.round(size?.width ?? 0));
  const h = Math.max(1, Math.round(size?.height ?? 0));
  let scale = 1;
  if (Number.isFinite(maxSide) && maxSide > 0) scale = Math.min(scale, maxSide / w, maxSide / h);
  if (w * h * scale * scale > TRACE_PIXEL_LIMIT) scale = Math.min(scale, Math.sqrt(TRACE_PIXEL_LIMIT / (w * h)));
  if (scale >= 1) return { size: { width: w, height: h }, scaled: false };
  return {
    size: { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) },
    scaled: true,
  };
};

/**
 * 给 VTracer 输出的 <svg> 补上 viewBox
 * (wasm 只写 width / height, 补 viewBox 后 SVG 才能"无级缩放"地嵌进任意容器)
 */
export const injectViewBox = (svg: string, width: number, height: number): string => {
  const text = String(svg ?? '');
  const start = text.indexOf('<svg');
  if (start < 0) return text;
  const end = text.indexOf('>', start);
  if (end < 0) return text;
  const tag = text.slice(start, end);
  if (/\sviewBox\s*=/.test(tag)) return text;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  return `${text.slice(0, end)} viewBox="0 0 ${w} ${h}"${text.slice(end)}`;
};

/** <path> 数量 (VTracer 每个色块输出一条 path) */
export const countPaths = (svg: string): number => (String(svg ?? '').match(/<path\b/g) ?? []).length;

/** SVG 文本的 UTF-8 字节数 */
export const svgBytes = (svg: string): number => {
  const text = String(svg ?? '');
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(text).length;
  // 无 TextEncoder 时按 code point 估算 (代理对算 2 个字节)
  let n = 0;
  for (const ch of text) n += ch.codePointAt(0)! > 0x7ff ? 3 : ch.codePointAt(0)! > 0x7f ? 2 : 1;
  return n;
};

/** SVG 文本 -> 预览用 dataURL */
export const svgDataUrl = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(String(svg ?? ''))}`;

/** 体积对比: SVG 相对原图的百分比 (原图体积为 0 时返回 0) */
export const sizeRatio = (svgBytesCount: number, originalBytes: number): number =>
  originalBytes > 0 ? (svgBytesCount / originalBytes) * 100 : 0;
