// 图片负片: 反相算法 (纯函数, 不依赖 canvas / DOM, 便于单测)
import { STRENGTH_DEFAULT, STRENGTH_MAX, STRENGTH_MIN } from './data';

/** 数值夹取到 0~255 并四舍五入 (非数字回退 0) */
export const clampByte = (v: number): number => {
  if (!Number.isFinite(v)) return 0;
  return Math.min(255, Math.max(0, Math.round(v)));
};

/** 强度归一化: 非法值回退默认, 结果取整并夹取到 0~100 */
export const normalizeStrength = (v: unknown): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return STRENGTH_DEFAULT;
  return Math.min(STRENGTH_MAX, Math.max(STRENGTH_MIN, Math.round(n)));
};

/**
 * 单通道反相并按强度混合: 0% = 原值, 100% = 完全反相 (255 - v)
 * 公式: out = v + (255 - 2v) × 强度, 即「按强度把负片叠在原图上」
 * 注意: 中间强度会降低对比度, 50% 时整幅图趋于中灰 (线性叠加的必然结果)
 * @param v        原通道值 (0~255, 越界会先夹取)
 * @param strength 强度 (%) 0~100
 */
export const invertChannel = (v: number, strength: number = STRENGTH_MAX): number => {
  const k = normalizeStrength(strength) / 100;
  const src = clampByte(v);
  return clampByte(src + (255 - 2 * src) * k);
};

/**
 * 逐像素反相 (RGBA 扁平数据, 每 4 个一组), 返回新数组
 * - RGB 三通道按强度反相, α 通道保持不变 (透明区域不会变成不透明)
 * - 长度不足 4 的尾部数据原样复制, 保证输出与输入等长
 */
export const invertPixels = (
  data: Uint8ClampedArray,
  strength: number = STRENGTH_MAX,
): Uint8ClampedArray => {
  const s = normalizeStrength(strength);
  const out = new Uint8ClampedArray(data.length);
  let i = 0;
  for (; i + 3 < data.length; i += 4) {
    out[i] = invertChannel(data[i], s);
    out[i + 1] = invertChannel(data[i + 1], s);
    out[i + 2] = invertChannel(data[i + 2], s);
    out[i + 3] = data[i + 3];
  }
  for (; i < data.length; i++) out[i] = data[i];
  return out;
};
