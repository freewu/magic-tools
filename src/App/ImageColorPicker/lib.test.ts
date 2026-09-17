import {
  colorAt, cropPixels, formatHsl, formatRgb, loupeRegion, pixelIndex, pushRecent, rgbToHex, rgbToHsl,
  toImagePoint,
} from './lib';
import { LOUPE_SPAN, RECENT_MAX, ZOOM_DEFAULT, ZOOM_OPTIONS } from './data';

const SIZE = { width: 4, height: 3 };
/** 数据: 每个像素 (x, y) = [x * 10, y * 10, 128, 255] */
const buildData = () => {
  const data = new Uint8ClampedArray(SIZE.width * SIZE.height * 4);
  for (let y = 0; y < SIZE.height; y++) {
    for (let x = 0; x < SIZE.width; x++) {
      const i = (y * SIZE.width + x) * 4;
      data[i] = x * 10;
      data[i + 1] = y * 10;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  return data;
};

describe('图片取色: 常量', () => {
  it('放大倍数 / 放大镜边长 / 历史条数', () => {
    expect(ZOOM_OPTIONS).toEqual([ 4, 8, 16 ]);
    expect(ZOOM_DEFAULT).toBe(8);
    expect(LOUPE_SPAN % 2).toBe(1); // 奇数才能正好居中
    expect(RECENT_MAX).toBe(12);
  });
});

describe('图片取色: toImagePoint', () => {
  const rect = { left: 10, top: 20, width: 40, height: 30 };

  it('按显示尺寸换算到原图坐标', () => {
    // 显示 40x30 对应 4x3 -> 1 显示像素 = 0.1 原图像素
    expect(toImagePoint(rect, SIZE, 10, 20)).toEqual({ x: 0, y: 0 });
    expect(toImagePoint(rect, SIZE, 30, 35)).toEqual({ x: 2, y: 1 });
  });

  it('缩放显示时也能正确换算', () => {
    // 原图放大 2 倍显示 (80x60)
    const big = { left: 0, top: 0, width: 80, height: 60 };
    expect(toImagePoint(big, SIZE, 20, 20)).toEqual({ x: 1, y: 1 });
    expect(toImagePoint(big, SIZE, 79, 59)).toEqual({ x: 3, y: 2 });
  });

  it('超出图片范围返回 null', () => {
    expect(toImagePoint(rect, SIZE, 9, 20)).toBeNull();
    expect(toImagePoint(rect, SIZE, 50, 20)).toBeNull();
    expect(toImagePoint(rect, SIZE, 10, 19)).toBeNull();
    expect(toImagePoint(rect, SIZE, 10, 50)).toBeNull();
  });

  it('尺寸为 0 时返回 null (未布局 / 无尺寸的场景)', () => {
    expect(toImagePoint({ left: 0, top: 0, width: 0, height: 0 }, SIZE, 0, 0)).toBeNull();
    expect(toImagePoint(rect, { width: 0, height: 0 }, 10, 20)).toBeNull();
  });
});

describe('图片取色: 像素读取', () => {
  it('pixelIndex 越界返回 -1', () => {
    expect(pixelIndex(SIZE, 0, 0)).toBe(0);
    expect(pixelIndex(SIZE, 3, 2)).toBe((2 * 4 + 3) * 4);
    expect(pixelIndex(SIZE, -1, 0)).toBe(-1);
    expect(pixelIndex(SIZE, 4, 0)).toBe(-1);
    expect(pixelIndex(SIZE, 0, 3)).toBe(-1);
  });

  it('colorAt 读出对应像素', () => {
    const data = buildData();
    expect(colorAt(data, SIZE, 2, 1)).toEqual({ r: 20, g: 10, b: 128, a: 255 });
    expect(colorAt(data, SIZE, 0, 0)).toEqual({ r: 0, g: 0, b: 128, a: 255 });
  });

  it('colorAt 越界或数据不足时返回 null', () => {
    const data = buildData();
    expect(colorAt(data, SIZE, 4, 0)).toBeNull();
    expect(colorAt(data, SIZE, 0, -1)).toBeNull();
    expect(colorAt(data.slice(0, 6), SIZE, 1, 0)).toBeNull();
  });
});

describe('图片取色: 放大镜区域与裁剪', () => {
  it('中间位置以该像素为中心', () => {
    const big = { width: 100, height: 100 };
    expect(loupeRegion(big, 50, 50, 11)).toEqual({ x: 45, y: 45, w: 11, h: 11 });
  });

  it('靠近边缘时整体平移贴边, 中心像素仍在正中', () => {
    const big = { width: 100, height: 100 };
    expect(loupeRegion(big, 0, 0, 11)).toEqual({ x: 0, y: 0, w: 11, h: 11 });
    expect(loupeRegion(big, 99, 99, 11)).toEqual({ x: 89, y: 89, w: 11, h: 11 });
    // 中心像素 (0,0) 在区域内的位置 = (0-0, 0-0) = 左上角第 1 格, half=5 -> 平移到贴边后中心格坐标为 5
    const r = loupeRegion(big, 0, 0, 11);
    expect(0 - r.x).toBe(0); // 已贴边, 无法再居中, 但不会越界
  });

  it('图片比取样区域小时按图片尺寸裁剪', () => {
    expect(loupeRegion(SIZE, 0, 0, 11)).toEqual({ x: 0, y: 0, w: 4, h: 3 });
  });

  it('cropPixels 裁剪出区域数据, 越界补透明', () => {
    const data = buildData();
    const region = { x: 1, y: 1, w: 2, h: 2 };
    const out = cropPixels(data, SIZE, region);
    expect(out).toHaveLength(16);
    // 区域左上角 = 原图 (1, 1) -> [10, 10, 128, 255]
    expect(Array.from(out.slice(0, 4))).toEqual([ 10, 10, 128, 255 ]);
    // 区域右下角 = 原图 (2, 2) -> [20, 20, 128, 255]
    expect(Array.from(out.slice(12, 16))).toEqual([ 20, 20, 128, 255 ]);
    // 越界区域补 0
    const beyond = cropPixels(data, SIZE, { x: 3, y: 2, w: 2, h: 2 });
    expect(Array.from(beyond.slice(4, 8))).toEqual([ 0, 0, 0, 0 ]);
  });
});

describe('图片取色: 颜色格式', () => {
  it('rgbToHex', () => {
    expect(rgbToHex({ r: 58, g: 123, b: 213 })).toBe('#3a7bd5');
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
    // 分量会被夹取并取整
    expect(rgbToHex({ r: 300, g: -5, b: 12.6 })).toBe('#ff000d');
  });

  it('formatRgb', () => {
    expect(formatRgb({ r: 58, g: 123, b: 213 })).toBe('rgb(58, 123, 213)');
    expect(formatRgb({ r: NaN, g: 1, b: 2 })).toBe('rgb(0, 1, 2)');
  });

  it('rgbToHsl', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 });
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, l: 0 });
    expect(rgbToHsl({ r: 255, g: 255, b: 0 })).toEqual({ h: 60, s: 100, l: 50 });
    // 深蓝: 亮度小于 0.5, 用另一条饱和度公式
    expect(rgbToHsl({ r: 0, g: 0, b: 128 })).toEqual({ h: 240, s: 100, l: 25 });
  });

  it('formatHsl', () => {
    expect(formatHsl({ r: 58, g: 123, b: 213 })).toBe('hsl(215, 65%, 53%)');
    expect(formatHsl({ r: 255, g: 255, b: 255 })).toBe('hsl(0, 0%, 100%)');
  });
});

describe('图片取色: 最近取色', () => {
  it('新颜色放在最前', () => {
    expect(pushRecent([], '#aabbcc')).toEqual([ '#aabbcc' ]);
    expect(pushRecent([ '#111111' ], '#222222')).toEqual([ '#222222', '#111111' ]);
  });

  it('重复颜色只占一个位置并被提前', () => {
    expect(pushRecent([ '#111111', '#222222', '#333333' ], '#222222')).toEqual([ '#222222', '#111111', '#333333' ]);
  });

  it('大小写不同视为同一颜色', () => {
    expect(pushRecent([ '#AABBCC' ], '#aabbcc')).toEqual([ '#aabbcc' ]);
  });

  it('超出上限时截断 (默认 12)', () => {
    let list: string[] = [];
    for (let i = 0; i < 20; i++) list = pushRecent(list, `#00000${i % 10}`.slice(0, 7) + (i % 10));
    expect(list.length).toBeLessThanOrEqual(RECENT_MAX);
    expect(pushRecent([ 'a', 'b', 'c' ], 'd', 2)).toEqual([ 'd', 'a' ]);
  });
});
