// 图片黑白化: 灰度 / 二值化算法 (纯函数, 不依赖 canvas / DOM, 便于单测)
import {
  GRAY_METHODS, METHOD_DEFAULT, MODES, MODE_DEFAULT, THRESHOLD_DEFAULT, THRESHOLD_MAX, THRESHOLD_MIN,
  THRESHOLD_MODES, type GrayMethod, type Mode, type ThresholdMode,
} from './data';

/** 数值夹取到 0~255 并四舍五入 (非数字回退 0) */
export const clampByte = (v: number): number => {
  if (!Number.isFinite(v)) return 0;
  return Math.min(255, Math.max(0, Math.round(v)));
};

/** 处理模式归一化 (非法值回退默认) */
export const normalizeMode = (v: unknown): Mode =>
  (MODES as readonly string[]).includes(v as string) ? v as Mode : MODE_DEFAULT;

/** 灰度算法归一化 (非法值回退默认) */
export const normalizeMethod = (v: unknown): GrayMethod =>
  (GRAY_METHODS as readonly string[]).includes(v as string) ? v as GrayMethod : METHOD_DEFAULT;

/** 阈值来源归一化 (非法值回退默认) */
export const normalizeThresholdMode = (v: unknown): ThresholdMode =>
  (THRESHOLD_MODES as readonly string[]).includes(v as string) ? v as ThresholdMode : 'auto';

/** 阈值归一化: 非法值回退 128, 取整并夹取到 0~255 */
export const normalizeThreshold = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return THRESHOLD_DEFAULT;
  return Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, Math.round(n)));
};

/**
 * 单个像素的灰度值
 * - luma: Rec.709 亮度 (0.2126R + 0.7152G + 0.0722B), 与人眼观感最接近, 也是 CSS filter: grayscale 的做法
 * - average: (R + G + B) / 3, 简单平均, 对纯色块比较"平"
 * - max / min: 取最亮 / 最暗的通道, 分别偏向提亮与压暗
 */
export const grayValue = (r: number, g: number, b: number, method: GrayMethod = METHOD_DEFAULT): number => {
  const rr = clampByte(r);
  const gg = clampByte(g);
  const bb = clampByte(b);
  switch (normalizeMethod(method)) {
    case 'average': return clampByte((rr + gg + bb) / 3);
    case 'max': return Math.max(rr, gg, bb);
    case 'min': return Math.min(rr, gg, bb);
    default: return clampByte(0.2126 * rr + 0.7152 * gg + 0.0722 * bb);
  }
};

/** 逐像素灰度化: RGB 三通道写为同一灰度值, α 保持不变; 返回新数组 */
export const grayscalePixels = (
  data: Uint8ClampedArray,
  method: GrayMethod = METHOD_DEFAULT,
): Uint8ClampedArray => {
  const m = normalizeMethod(method);
  const out = new Uint8ClampedArray(data.length);
  let i = 0;
  for (; i + 3 < data.length; i += 4) {
    const v = grayValue(data[i], data[i + 1], data[i + 2], m);
    out[i] = v;
    out[i + 1] = v;
    out[i + 2] = v;
    out[i + 3] = data[i + 3];
  }
  for (; i < data.length; i++) out[i] = data[i];
  return out;
};

/**
 * 逐像素二值化: 灰度值 > 阈值 的像素写为纯白 (255), 否则纯黑 (0); α 保持不变
 * 说明: 阈值 128 时 128 属于黑 (只有大于阈值才是白), 这样「阈值 = 分割点」的含义最直观
 */
export const binarizePixels = (
  data: Uint8ClampedArray,
  threshold: number = THRESHOLD_DEFAULT,
  method: GrayMethod = METHOD_DEFAULT,
): Uint8ClampedArray => {
  const t = normalizeThreshold(threshold);
  const m = normalizeMethod(method);
  const out = new Uint8ClampedArray(data.length);
  let i = 0;
  for (; i + 3 < data.length; i += 4) {
    const v = grayValue(data[i], data[i + 1], data[i + 2], m) > t ? 255 : 0;
    out[i] = v;
    out[i + 1] = v;
    out[i + 2] = v;
    out[i + 3] = data[i + 3];
  }
  for (; i < data.length; i++) out[i] = data[i];
  return out;
};

/** 灰度直方图 (256 桶; α 不参与统计) */
export const histogramOf = (data: Uint8ClampedArray, method: GrayMethod = METHOD_DEFAULT): number[] => {
  const m = normalizeMethod(method);
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i + 3 < data.length; i += 4) hist[grayValue(data[i], data[i + 1], data[i + 2], m)]++;
  return hist;
};

/**
 * Otsu 最大类间方差法自动阈值 (0~255)
 * - 取使「前景 / 背景两类之间方差最大」的灰度作为阈值
 * - 全图同色 (或没有像素) 时返回 0, 此时二值化结果为全黑 / 全白, 不会产生 NaN
 */
export const otsuThreshold = (hist: number[], total?: number): number => {
  const sum = hist.reduce((a, b) => a + b, 0);
  const n = total ?? sum;
  if (!(n > 0)) return 0;
  let weighted = 0;
  for (let i = 0; i < 256; i++) weighted += i * (hist[i] ?? 0);
  let weightBack = 0;
  let sumBack = 0;
  let best = 0;
  let bestVariance = -1;
  for (let t = 0; t < 256; t++) {
    weightBack += hist[t] ?? 0;
    if (weightBack === 0) continue;
    const weightFront = n - weightBack;
    if (weightFront === 0) break;
    sumBack += t * (hist[t] ?? 0);
    const meanBack = sumBack / weightBack;
    const meanFront = (weighted - sumBack) / weightFront;
    const variance = weightBack * weightFront * (meanBack - meanFront) * (meanBack - meanFront);
    // 取得更小的灰度作为阈值 (等价方差时取靠前者), 结果更稳定
    if (variance > bestVariance) {
      bestVariance = variance;
      best = t;
    }
  }
  return best;
};

/** 直接从像素数据求 Otsu 阈值 */
export const autoThresholdOf = (data: Uint8ClampedArray, method: GrayMethod = METHOD_DEFAULT): number =>
  otsuThreshold(histogramOf(data, method));

/** 输出文件名后缀 (灰度 / 二值不同) */
export const suffixOf = (mode: Mode): string => (normalizeMode(mode) === 'binary' ? 'blackwhite' : 'grayscale');
