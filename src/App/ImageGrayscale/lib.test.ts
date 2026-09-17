import {
  autoThresholdOf, binarizePixels, clampByte, grayValue, grayscalePixels, histogramOf, normalizeMethod,
  normalizeMode, normalizeThreshold, normalizeThresholdMode, otsuThreshold, suffixOf,
} from './lib';
import { METHOD_DEFAULT, MODE_DEFAULT, THRESHOLD_DEFAULT } from './data';

describe('图片黑白化: 参数归一化', () => {
  it('clampByte', () => {
    expect(clampByte(-1)).toBe(0);
    expect(clampByte(128.5)).toBe(129);
    expect(clampByte(999)).toBe(255);
    expect(clampByte(NaN)).toBe(0);
  });

  it('normalizeMode / normalizeMethod / normalizeThresholdMode', () => {
    expect(MODE_DEFAULT).toBe('gray');
    expect(normalizeMode('binary')).toBe('binary');
    expect(normalizeMode('nope')).toBe('gray');
    expect(normalizeMode(undefined)).toBe('gray');
    expect(METHOD_DEFAULT).toBe('luma');
    expect(normalizeMethod('max')).toBe('max');
    expect(normalizeMethod('nope')).toBe('luma');
    expect(normalizeThresholdMode('manual')).toBe('manual');
    expect(normalizeThresholdMode('nope')).toBe('auto');
  });

  it('normalizeThreshold', () => {
    expect(THRESHOLD_DEFAULT).toBe(128);
    expect(normalizeThreshold(0)).toBe(0);
    expect(normalizeThreshold(255)).toBe(255);
    expect(normalizeThreshold(-5)).toBe(0);
    expect(normalizeThreshold(300)).toBe(255);
    expect(normalizeThreshold(199.6)).toBe(200);
    expect(normalizeThreshold('64')).toBe(64);
    expect(normalizeThreshold('')).toBe(128);
    expect(normalizeThreshold(NaN)).toBe(128);
  });

  it('suffixOf: 灰度与二值给出不同后缀', () => {
    expect(suffixOf('gray')).toBe('grayscale');
    expect(suffixOf('binary')).toBe('blackwhite');
  });
});

describe('图片黑白化: grayValue', () => {
  it('亮度算法按 Rec.709 加权', () => {
    expect(grayValue(255, 255, 255, 'luma')).toBe(255);
    expect(grayValue(0, 0, 0, 'luma')).toBe(0);
    expect(grayValue(255, 0, 0, 'luma')).toBe(54); // 0.2126*255 = 54.2
    expect(grayValue(0, 255, 0, 'luma')).toBe(182); // 0.7152*255 = 182.4
    expect(grayValue(0, 0, 255, 'luma')).toBe(18); // 0.0722*255 = 18.4
  });

  it('平均 / 最大值 / 最小值', () => {
    expect(grayValue(0, 0, 255, 'average')).toBe(85);
    expect(grayValue(10, 20, 31, 'average')).toBe(20); // 61/3 = 20.33
    expect(grayValue(10, 20, 31, 'max')).toBe(31);
    expect(grayValue(10, 20, 31, 'min')).toBe(10);
  });

  it('灰阶值永远落在 0~255 之间', () => {
    expect(grayValue(0, 0, 0, 'luma')).toBeGreaterThanOrEqual(0);
    expect(grayValue(255, 255, 255, 'average')).toBeLessThanOrEqual(255);
    expect(grayValue(-5, 999, 3, 'max')).toBe(255);
  });
});

describe('图片黑白化: grayscalePixels', () => {
  it('RGB 写为同一灰度值, α 保持不变, 原数组不被修改', () => {
    const src = new Uint8ClampedArray([ 255, 0, 0, 255, 0, 0, 255, 128 ]);
    const out = grayscalePixels(src, 'luma');
    expect(Array.from(out)).toEqual([ 54, 54, 54, 255, 18, 18, 18, 128 ]);
    expect(Array.from(src)).toEqual([ 255, 0, 0, 255, 0, 0, 255, 128 ]);
  });

  it('已有灰度像素保持不变', () => {
    const out = grayscalePixels(new Uint8ClampedArray([ 100, 100, 100, 255 ]), 'average');
    expect(Array.from(out)).toEqual([ 100, 100, 100, 255 ]);
  });

  it('尾部不足 4 字节原样复制', () => {
    const out = grayscalePixels(new Uint8ClampedArray([ 255, 0, 0, 255, 9, 9 ]), 'luma');
    expect(Array.from(out)).toEqual([ 54, 54, 54, 255, 9, 9 ]);
  });

  it('非法算法回退亮度', () => {
    const out = grayscalePixels(new Uint8ClampedArray([ 0, 255, 0, 255 ]), 'x' as never);
    expect(out[0]).toBe(182);
  });
});

describe('图片黑白化: binarizePixels', () => {
  it('大于阈值的像素为纯白, 其余为纯黑 (阈值本身属于黑)', () => {
    const src = new Uint8ClampedArray([ 0, 0, 0, 255, 128, 128, 128, 255, 129, 129, 129, 255, 255, 255, 255, 255 ]);
    const out = binarizePixels(src, 128, 'luma');
    expect(Array.from(out)).toEqual([ 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255 ]);
  });

  it('阈值 0 时只有纯黑像素为黑', () => {
    const src = new Uint8ClampedArray([ 0, 0, 0, 255, 1, 1, 1, 255 ]);
    expect(Array.from(binarizePixels(src, 0, 'luma'))).toEqual([ 0, 0, 0, 255, 255, 255, 255, 255 ]);
  });

  it('α 保持不变, 半透明像素也能二值化', () => {
    const out = binarizePixels(new Uint8ClampedArray([ 255, 255, 255, 0 ]), 128, 'luma');
    expect(Array.from(out)).toEqual([ 255, 255, 255, 0 ]);
  });

  it('按选定算法灰度化后再比较阈值', () => {
    // 纯蓝: luma=18 (<=128 -> 黑), max=255 (>128 -> 白)
    const src = new Uint8ClampedArray([ 0, 0, 255, 255 ]);
    expect(Array.from(binarizePixels(src, 128, 'luma'))).toEqual([ 0, 0, 0, 255 ]);
    expect(Array.from(binarizePixels(src, 128, 'max'))).toEqual([ 255, 255, 255, 255 ]);
  });
});

describe('图片黑白化: 直方图与 Otsu', () => {
  it('histogramOf 统计 256 个桶, 只统计 RGB 中的灰度分布', () => {
    const src = new Uint8ClampedArray([ 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255 ]);
    const hist = histogramOf(src, 'luma');
    expect(hist).toHaveLength(256);
    expect(hist[0]).toBe(2);
    expect(hist[255]).toBe(1);
    expect(hist.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('otsuThreshold: 双峰图取两峰之间的灰度', () => {
    const hist = new Array(256).fill(0);
    hist[20] = 100;
    hist[200] = 100;
    expect(otsuThreshold(hist)).toBe(20);
  });

  it('otsuThreshold: 单峰 / 空直方图不产生 NaN', () => {
    const hist = new Array(256).fill(0);
    hist[50] = 100;
    expect(otsuThreshold(hist)).toBe(0);
    expect(otsuThreshold(new Array(256).fill(0))).toBe(0);
  });

  it('otsuThreshold: 偏斜双峰也能分开', () => {
    const hist = new Array(256).fill(0);
    hist[30] = 10;
    hist[220] = 90;
    // (30*10 + 220*90) / 100 = 201 -> 阈值落在 30 与 220 之间
    expect(otsuThreshold(hist)).toBe(30);
  });

  it('autoThresholdOf: 从像素数据直接得到阈值并可完成二值化', () => {
    // 一半像素接近黑 (10), 一半接近白 (240)
    const data = new Uint8ClampedArray(2 * 4);
    data.set([ 10, 10, 10, 255 ], 0);
    data.set([ 240, 240, 240, 255 ], 4);
    const t = autoThresholdOf(data, 'luma');
    expect(t).toBe(10);
    expect(Array.from(binarizePixels(data, t, 'luma'))).toEqual([ 0, 0, 0, 255, 255, 255, 255, 255 ]);
  });
});
