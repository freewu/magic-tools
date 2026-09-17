import {
  clampByte, invertChannel, invertPixels, normalizeStrength,
} from './lib';
import { STRENGTH_DEFAULT } from './data';

describe('图片负片: clampByte', () => {
  it('夹取到 0~255 并四舍五入', () => {
    expect(clampByte(-5)).toBe(0);
    expect(clampByte(0)).toBe(0);
    expect(clampByte(12.4)).toBe(12);
    expect(clampByte(12.5)).toBe(13);
    expect(clampByte(255)).toBe(255);
    expect(clampByte(999)).toBe(255);
  });

  it('非数字回退 0 (不产生 NaN 像素)', () => {
    expect(clampByte(NaN)).toBe(0);
    expect(clampByte(Infinity)).toBe(0);
    expect(clampByte(-Infinity)).toBe(0);
  });
});

describe('图片负片: normalizeStrength', () => {
  it('默认 100, 并夹取到 0~100 且取整', () => {
    expect(STRENGTH_DEFAULT).toBe(100);
    expect(normalizeStrength(undefined)).toBe(100);
    expect(normalizeStrength(NaN)).toBe(100);
    expect(normalizeStrength(-20)).toBe(0);
    expect(normalizeStrength(150)).toBe(100);
    expect(normalizeStrength(63.4)).toBe(63);
    expect(normalizeStrength(63.6)).toBe(64);
  });

  it('接受数字字符串, 空白字符串回退默认', () => {
    expect(normalizeStrength('40')).toBe(40);
    expect(normalizeStrength('')).toBe(100);
    expect(normalizeStrength('  ')).toBe(100);
    expect(normalizeStrength('abc')).toBe(100);
  });
});

describe('图片负片: invertChannel', () => {
  it('0% 保留原值, 100% 完全反相', () => {
    expect(invertChannel(0, 0)).toBe(0);
    expect(invertChannel(200, 0)).toBe(200);
    expect(invertChannel(0, 100)).toBe(255);
    expect(invertChannel(255, 100)).toBe(0);
    expect(invertChannel(100, 100)).toBe(155);
  });

  it('中间强度: 按比例把负片叠在原图上 (新值 = 原值 + (255 - 2 × 原值) × 强度)', () => {
    // 50% 时任意灰度都趋于中灰 127.5 -> 128 (线性叠加的必然结果, 已在界面文案中说明)
    expect(invertChannel(0, 50)).toBe(128);
    expect(invertChannel(255, 50)).toBe(128);
    expect(invertChannel(128, 50)).toBe(128);
    // 远离 50% 时保留可辨认的明暗关系
    expect(invertChannel(200, 25)).toBe(164); // 200 + (255-400)*0.25 = 163.75 -> 164
    expect(invertChannel(255, 25)).toBe(191); // 255 + (255-510)*0.25 -> 191.25 -> 191
    expect(invertChannel(0, 25)).toBe(64);
  });

  it('越界输入先夹取再计算', () => {
    expect(invertChannel(-10, 100)).toBe(255);
    expect(invertChannel(999, 100)).toBe(0);
  });
});

describe('图片负片: invertPixels', () => {
  it('逐像素反相 RGB, α 通道保持不变', () => {
    const src = new Uint8ClampedArray([ 0, 128, 255, 255, 10, 20, 30, 128 ]);
    const out = invertPixels(src, 100);
    expect(Array.from(out)).toEqual([ 255, 127, 0, 255, 245, 235, 225, 128 ]);
    // 原数组不被修改 (纯函数)
    expect(Array.from(src)).toEqual([ 0, 128, 255, 255, 10, 20, 30, 128 ]);
  });

  it('强度 0 时输出与原值相同 (仍是新数组)', () => {
    const src = new Uint8ClampedArray([ 1, 2, 3, 4 ]);
    const out = invertPixels(src, 0);
    expect(Array.from(out)).toEqual([ 1, 2, 3, 4 ]);
    expect(out).not.toBe(src);
  });

  it('半透明像素只翻转颜色, 不改变 α', () => {
    const out = invertPixels(new Uint8ClampedArray([ 255, 255, 255, 0 ]), 100);
    expect(Array.from(out)).toEqual([ 0, 0, 0, 0 ]);
  });

  it('尾部不足 4 字节的数据原样复制, 输出等长', () => {
    const src = new Uint8ClampedArray([ 0, 0, 0, 255, 7, 8 ]);
    const out = invertPixels(src, 100);
    expect(out.length).toBe(src.length);
    expect(Array.from(out)).toEqual([ 255, 255, 255, 255, 7, 8 ]);
  });

  it('空数组安全', () => {
    expect(invertPixels(new Uint8ClampedArray(0), 100).length).toBe(0);
  });

  it('强度非法时按默认 100 处理', () => {
    const out = invertPixels(new Uint8ClampedArray([ 12, 34, 56, 78 ]), NaN);
    expect(Array.from(out)).toEqual([ 243, 221, 199, 78 ]);
  });
});
