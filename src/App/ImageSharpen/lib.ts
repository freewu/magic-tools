// 图片锐化: USM 钝化蒙版 (Unsharp Mask) 算法, 纯函数不依赖 canvas / DOM, 便于单测
import {
  AMOUNT_DEFAULT, AMOUNT_MAX, AMOUNT_MIN, RADIUS_DEFAULT, RADIUS_MAX, RADIUS_MIN, THRESHOLD_DEFAULT,
  THRESHOLD_MAX, THRESHOLD_MIN,
} from './data';

/** 数值夹取到 0~255 并四舍五入 (非数字回退 0) */
export const clampByte = (v: number): number => {
  if (!Number.isFinite(v)) return 0;
  return Math.min(255, Math.max(0, Math.round(v)));
};

/** 半径归一化: 非法值回退 1, 取整并夹取到 1~5 */
export const normalizeRadius = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return RADIUS_DEFAULT;
  return Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, Math.round(n)));
};

/** 强度归一化 (百分数): 非法值回退 100, 夹取到 0~300 */
export const normalizeAmount = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return AMOUNT_DEFAULT;
  return Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, Math.round(n)));
};

/** 阈值归一化: 非法值回退 0, 取整并夹取到 0~255 */
export const normalizeThreshold = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return THRESHOLD_DEFAULT;
  return Math.min(THRESHOLD_MAX, Math.max(THRESHOLD_MIN, Math.round(n)));
};

/** 下标夹取 (盒式模糊在边缘处按最近像素补齐, 不会产生黑边) */
const clampIdx = (i: number, n: number): number => (i < 0 ? 0 : i >= n ? n - 1 : i);

/**
 * 单通道盒式模糊 (均值滤波), 等价于半径为 r 的矩形核卷积
 * - 横向先算出「窗口和」存进 Uint16Array (255 × 11 = 2805, 不会溢出, 也没有中间舍入误差)
 * - 纵向再对窗口和求平均并取整
 * 复杂度 O(w × h), 与半径无关; 返回长度 w × h 的新数组
 */
export const boxBlurChannel = (
  data: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number = RADIUS_DEFAULT,
  channel = 0,
): Uint8ClampedArray => {
  const r = normalizeRadius(radius);
  const win = 2 * r + 1;
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  const ch = Math.min(3, Math.max(0, Math.round(channel)));
  const tmp = new Uint16Array(W * H);
  // 横向: 窗口和
  for (let y = 0; y < H; y++) {
    const row = y * W;
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += data[(row + clampIdx(i, W)) * 4 + ch];
    tmp[row] = sum;
    for (let x = 1; x < W; x++) {
      sum += data[(row + clampIdx(x + r, W)) * 4 + ch] - data[(row + clampIdx(x - r - 1, W)) * 4 + ch];
      tmp[row + x] = sum;
    }
  }
  // 纵向: 求平均
  const out = new Uint8ClampedArray(W * H);
  const total = win * win;
  for (let x = 0; x < W; x++) {
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += tmp[clampIdx(i, H) * W + x];
    out[x] = Math.round(sum / total);
    for (let y = 1; y < H; y++) {
      sum += tmp[clampIdx(y + r, H) * W + x] - tmp[clampIdx(y - r - 1, H) * W + x];
      out[y * W + x] = Math.round(sum / total);
    }
  }
  return out;
};

/** 锐化参数 */
export interface SharpenOptions {
  /** 半径 (像素, 1~5) */
  radius?: number;
  /** 强度 (%, 0~300) */
  amount?: number;
  /** 阈值 (0~255) */
  threshold?: number;
}

/** 需要锐化的像素个数 (数据长度不足时按可用像素处理) */
const pixelCountOf = (data: Uint8ClampedArray, w: number, h: number): number => {
  const need = w * h;
  const have = Math.floor(data.length / 4);
  return have >= need ? need : have;
};

/**
 * USM 钝化蒙版锐化: `输出 = 原图 + 强度 × (原图 − 模糊图)`
 * - 模糊图用盒式模糊近似高斯模糊 (USM 的经典近似做法), 半径越大影响的邻域越广
 * - 细节差值绝对值小于阈值的像素保持原样, 因此把阈值调高可以只锐化边缘、不放大平坦区域的噪点
 * - 逐通道计算, α 通道始终保持不变; 结果夹取到 0~255; 返回新数组, 原数组不被修改
 */
export const unsharpMask = (
  data: Uint8ClampedArray,
  w: number,
  h: number,
  options: SharpenOptions = {},
): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(data);
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  const count = pixelCountOf(data, W, H);
  if (count <= 0) return out;
  const radius = normalizeRadius(options.radius);
  const amount = normalizeAmount(options.amount);
  const threshold = normalizeThreshold(options.threshold);
  const k = amount / 100;
  if (k === 0) return out;
  const blurs: Uint8ClampedArray[] = [ 0, 1, 2 ].map((c) => boxBlurChannel(data, W, H, radius, c));
  for (let i = 0; i < count; i++) {
    const base = i * 4;
    for (let c = 0; c < 3; c++) {
      const src = data[base + c];
      const diff = src - blurs[c][i];
      // 阈值之内视为平坦区域 / 噪点, 保持原样
      out[base + c] = Math.abs(diff) > threshold ? clampByte(src + diff * k) : src;
    }
  }
  return out;
};

/** 锐化强度 / 半径的界面文案组合 (供统计标签使用) */
export const describeSharpen = (options: SharpenOptions): string =>
  `${normalizeAmount(options.amount)}% · r${normalizeRadius(options.radius)} · t${normalizeThreshold(options.threshold)}`;
