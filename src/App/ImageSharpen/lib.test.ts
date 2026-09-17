import {
  boxBlurChannel, clampByte, describeSharpen, normalizeAmount, normalizeRadius, normalizeThreshold, unsharpMask,
} from './lib';

/** 构造 w × h 的图片数据, pixels 为 [r, g, b, a] 平铺 */
const px = (pixels: number[][]): Uint8ClampedArray => new Uint8ClampedArray(pixels.flat());

/** 读取第 i 个像素 */
const at = (data: Uint8ClampedArray, i: number): number[] => Array.from(data.slice(i * 4, i * 4 + 4));

describe('图片锐化: 参数归一化', () => {
  it('clampByte', () => {
    expect(clampByte(-10)).toBe(0);
    expect(clampByte(0.4)).toBe(0);
    expect(clampByte(255.6)).toBe(255);
    expect(clampByte(Infinity)).toBe(0);
    expect(clampByte(NaN)).toBe(0);
  });

  it('normalizeRadius / normalizeAmount / normalizeThreshold', () => {
    expect(normalizeRadius(undefined)).toBe(1);
    expect(normalizeRadius(0)).toBe(1);
    expect(normalizeRadius(3.4)).toBe(3);
    expect(normalizeRadius(99)).toBe(5);
    expect(normalizeRadius('2')).toBe(2);
    expect(normalizeRadius('')).toBe(1);
    expect(normalizeAmount(undefined)).toBe(100);
    expect(normalizeAmount(-5)).toBe(0);
    expect(normalizeAmount(500)).toBe(300);
    expect(normalizeAmount(150.5)).toBe(151);
    expect(normalizeThreshold(undefined)).toBe(0);
    expect(normalizeThreshold(-1)).toBe(0);
    expect(normalizeThreshold(999)).toBe(255);
    expect(normalizeThreshold('12')).toBe(12);
  });

  it('describeSharpen 汇总当前参数', () => {
    expect(describeSharpen({ amount: 100, radius: 1, threshold: 0 })).toBe('100% · r1 · t0');
    expect(describeSharpen({})).toBe('100% · r1 · t0');
  });
});

describe('图片锐化: boxBlurChannel', () => {
  it('纯色图模糊后仍是原色', () => {
    const data = px([ [ 120, 120, 120, 255 ], [ 120, 120, 120, 255 ], [ 120, 120, 120, 255 ] ]);
    const out = boxBlurChannel(data, 3, 1, 1, 0);
    expect(Array.from(out)).toEqual([ 120, 120, 120 ]);
  });

  it('灰度跃变处按窗口平均, 边缘按最近像素补齐 (无黑边)', () => {
    const data = px([ [ 0, 0, 0, 255 ], [ 90, 90, 90, 255 ], [ 180, 180, 180, 255 ] ]);
    // 半径 1 的窗口 (各方向 3 个): x0 = [0,0,90]/3 = 30, x1 = [0,90,180]/3 = 90, x2 = [90,180,180]/3 = 150
    expect(Array.from(boxBlurChannel(data, 3, 1, 1, 0))).toEqual([ 30, 90, 150 ]);
    // 半径 2: 窗口扩大到 5 个 (边缘重复最近像素) -> x0 = [0,0,0,90,180]/5 = 54, x1 = [0,0,90,180,180]/5 = 90, x2 = [0,90,180,180,180]/5 = 126
    expect(Array.from(boxBlurChannel(data, 3, 1, 2, 0))).toEqual([ 54, 90, 126 ]);
  });

  it('只处理指定通道', () => {
    const data = px([ [ 0, 200, 100, 255 ] ]);
    expect(Array.from(boxBlurChannel(data, 1, 1, 1, 1))).toEqual([ 200 ]);
    expect(Array.from(boxBlurChannel(data, 1, 1, 1, 2))).toEqual([ 100 ]);
  });

  it('非法半径 / 通道不会崩溃', () => {
    const data = px([ [ 10, 20, 30, 255 ] ]);
    expect(boxBlurChannel(data, 1, 1, NaN, 9)).toHaveLength(1);
    expect(boxBlurChannel(data, 0, 0, 3, -1)).toHaveLength(1);
  });
});

describe('图片锐化: unsharpMask', () => {
  it('纯色图锐化后不变 (细节为 0)', () => {
    const data = px([ [ 80, 80, 80, 255 ], [ 80, 80, 80, 255 ], [ 80, 80, 80, 255 ] ]);
    const out = unsharpMask(data, 3, 1, { radius: 1, amount: 200, threshold: 0 });
    expect(at(out, 1)).toEqual([ 80, 80, 80, 255 ]);
  });

  it('跃变处生成过冲 / 下冲 (边缘更锐利)', () => {
    const data = px([ [ 100, 100, 100, 255 ], [ 100, 100, 100, 255 ], [ 200, 200, 200, 255 ] ]);
    // 模糊值: [100, 133, 167] -> 差值 [0, -33, 33] -> 100% 叠加 -> [100, 67, 233]
    const out = unsharpMask(data, 3, 1, { radius: 1, amount: 100, threshold: 0 });
    expect(at(out, 0)).toEqual([ 100, 100, 100, 255 ]);
    expect(at(out, 1)).toEqual([ 67, 67, 67, 255 ]);
    expect(at(out, 2)).toEqual([ 233, 233, 233, 255 ]);
  });

  it('强度放大到 200% 时过冲更强并被夹取到 255', () => {
    const data = px([ [ 100, 100, 100, 255 ], [ 100, 100, 100, 255 ], [ 220, 220, 220, 255 ] ]);
    const out = unsharpMask(data, 3, 1, { radius: 1, amount: 200, threshold: 0 });
    // 模糊值 [100, 140, 180] -> 差值 [0, -40, 40] -> 200% -> [100, 20, 260 -> 255]
    expect(at(out, 1)).toEqual([ 20, 20, 20, 255 ]);
    expect(at(out, 2)).toEqual([ 255, 255, 255, 255 ]);
  });

  it('阈值大于细节差值时保持原样 (只锐化明显的边缘)', () => {
    const data = px([ [ 100, 100, 100, 255 ], [ 100, 100, 100, 255 ], [ 200, 200, 200, 255 ] ]);
    const out = unsharpMask(data, 3, 1, { radius: 1, amount: 100, threshold: 40 });
    expect(Array.from(out)).toEqual(Array.from(data));
    // 阈值 30 时 33 > 30, 重新参与锐化
    const out2 = unsharpMask(data, 3, 1, { radius: 1, amount: 100, threshold: 30 });
    expect(at(out2, 1)).toEqual([ 67, 67, 67, 255 ]);
  });

  it('强度 0 时输出与原图完全一致', () => {
    const data = px([ [ 10, 20, 30, 255 ], [ 200, 100, 50, 128 ] ]);
    expect(Array.from(unsharpMask(data, 2, 1, { amount: 0 }))).toEqual(Array.from(data));
  });

  it('α 通道不变, 原数组不被修改', () => {
    const data = px([ [ 100, 100, 100, 10 ], [ 100, 100, 100, 20 ], [ 200, 200, 200, 30 ] ]);
    const copy = Array.from(data);
    const out = unsharpMask(data, 3, 1, { radius: 1, amount: 100, threshold: 0 });
    expect(out[3]).toBe(10);
    expect(out[7]).toBe(20);
    expect(out[11]).toBe(30);
    expect(Array.from(data)).toEqual(copy);
  });

  it('数据长度不足时只处理可用像素, 不越界', () => {
    const data = px([ [ 10, 10, 10, 255 ], [ 200, 200, 200, 255 ] ]);
    const out = unsharpMask(data, 4, 4, { radius: 1, amount: 100 });
    expect(out).toHaveLength(data.length);
  });
});
