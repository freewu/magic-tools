import {
  KEY_FORMAT, KEY_LOCK, KEY_PERCENT, KEY_QUALITY,
  baseName, clampPixel, computeSize, dataUrlToBytes, extOf, fitWithin, formatBytes, formatScale, getDefaultFormat,
  getDefaultPercent, getDefaultQuality, getLockRatio, isLossy, isQuarterTurn, mimeOf, normalizeFormat, normalizeMode,
  normalizePercent, normalizeQuality, normalizeRotation, outputFileName, rotatedSize, scaleFactor, scaleSteps,
  setDefaultFormat, setDefaultPercent, setDefaultQuality, setLockRatio, sizeFromHeight, sizeFromPercent, sizeFromWidth,
} from './lib';
import { PERCENT_DEFAULT, QUALITY_DEFAULT, SIZE_MIN } from './data';

describe('图片调整', () => {
  describe('数值归一化', () => {
    it('比例裁剪到 1-400 并取整', () => {
      expect(normalizePercent(50)).toBe(50);
      expect(normalizePercent(0)).toBe(1);
      expect(normalizePercent(999)).toBe(400);
      expect(normalizePercent(33.6)).toBe(34);
      expect(normalizePercent('80')).toBe(80);
      expect(normalizePercent(null)).toBe(PERCENT_DEFAULT);
      expect(normalizePercent('')).toBe(PERCENT_DEFAULT);
      expect(normalizePercent('abc')).toBe(PERCENT_DEFAULT);
    });

    it('像素裁剪到 1-10000 并取整', () => {
      expect(clampPixel(800)).toBe(800);
      expect(clampPixel(0)).toBe(SIZE_MIN);
      expect(clampPixel(-5)).toBe(SIZE_MIN);
      expect(clampPixel(99999)).toBe(10000);
      expect(clampPixel(120.4)).toBe(120);
      expect(clampPixel(null)).toBe(SIZE_MIN);
    });

    it('格式 / 模式 / 质量回退', () => {
      expect(normalizeFormat('png')).toBe('PNG');
      expect(normalizeFormat('webp')).toBe('WebP');
      expect(normalizeFormat('WebP')).toBe('WebP');
      expect(normalizeFormat('jpeg')).toBe('JPEG');
      expect(normalizeFormat('JPEG')).toBe('JPEG');
      expect(normalizeMode('pixel')).toBe('pixel');
      expect(normalizeMode('other')).toBe('percent');
      expect(normalizeQuality(2)).toBe(1);
      expect(normalizeQuality(0.1)).toBe(0.5);
      expect(normalizeQuality('-')).toBe(QUALITY_DEFAULT);
    });

    it('旋转角度归一到 0 / 90 / 180 / 270', () => {
      expect(normalizeRotation(0)).toBe(0);
      expect(normalizeRotation(90)).toBe(90);
      expect(normalizeRotation(180)).toBe(180);
      expect(normalizeRotation(270)).toBe(270);
      expect(normalizeRotation(360)).toBe(0);
      expect(normalizeRotation(-90)).toBe(270);
      expect(normalizeRotation('90')).toBe(90);
      expect(normalizeRotation(45)).toBe(90);
      expect(normalizeRotation(null)).toBe(0);
      expect(normalizeRotation('abc')).toBe(0);
    });

    it('旋转后的尺寸与有损格式判定', () => {
      const size = { width: 1920, height: 1080 };
      expect(isQuarterTurn(0)).toBe(false);
      expect(isQuarterTurn(90)).toBe(true);
      expect(isQuarterTurn(180)).toBe(false);
      expect(isQuarterTurn(270)).toBe(true);
      expect(rotatedSize(size, 0)).toEqual(size);
      expect(rotatedSize(size, 180)).toEqual(size);
      expect(rotatedSize(size, 90)).toEqual({ width: 1080, height: 1920 });
      expect(rotatedSize(size, 270)).toEqual({ width: 1080, height: 1920 });
      expect(isLossy('PNG')).toBe(false);
      expect(isLossy('JPEG')).toBe(true);
      expect(isLossy('WebP')).toBe(true);
    });
  });

  describe('目标尺寸计算', () => {
    const orig = { width: 1920, height: 1080 };

    it('按比例缩放 (宽高各自四舍五入, 至少 1 像素)', () => {
      expect(sizeFromPercent(orig, 50)).toEqual({ width: 960, height: 540 });
      expect(sizeFromPercent(orig, 25)).toEqual({ width: 480, height: 270 });
      expect(sizeFromPercent(orig, 100)).toEqual(orig);
      expect(sizeFromPercent({ width: 3, height: 3 }, 1)).toEqual({ width: 1, height: 1 });
      expect(sizeFromPercent(orig, 33)).toEqual({ width: 634, height: 356 });
    });

    it('按宽度 / 按高度换算时保持原图宽高比', () => {
      expect(sizeFromWidth(800, orig)).toEqual({ width: 800, height: 450 });
      expect(sizeFromHeight(450, orig)).toEqual({ width: 800, height: 450 });
      // 极端比例至少保留 1 像素
      expect(sizeFromHeight(1, { width: 4000, height: 10 })).toEqual({ width: 400, height: 1 });
      expect(sizeFromWidth(1, { width: 4000, height: 10 })).toEqual({ width: 1, height: 1 });
    });

    it('fitWithin 等比缩到上限内', () => {
      expect(fitWithin({ width: 800, height: 600 }, 1000, 1000)).toEqual({ width: 800, height: 600 });
      expect(fitWithin({ width: 2000, height: 1000 }, 1000, 1000)).toEqual({ width: 1000, height: 500 });
      expect(fitWithin({ width: 1000, height: 3000 }, 1000, 1000)).toEqual({ width: 333, height: 1000 });
    });

    it('computeSize: 按比例 / 按像素', () => {
      expect(computeSize(orig, { mode: 'percent', percent: 50, width: 0, height: 0, noUpscale: false }))
        .toEqual({ width: 960, height: 540 });
      expect(computeSize(orig, { mode: 'pixel', percent: 50, width: 300, height: 300, noUpscale: false }))
        .toEqual({ width: 300, height: 300 });
    });

    it('computeSize: 不放大时等比缩回原图大小', () => {
      expect(computeSize(orig, { mode: 'percent', percent: 200, width: 0, height: 0, noUpscale: true })).toEqual(orig);
      // 4:3 的请求尺寸在 16:9 原图内等比缩回
      expect(computeSize(orig, { mode: 'pixel', percent: 50, width: 4000, height: 3000, noUpscale: true }))
        .toEqual({ width: 1440, height: 1080 });
      // 单边超出时整体等比缩回 (保持请求的宽高比)
      expect(computeSize(orig, { mode: 'pixel', percent: 50, width: 1920, height: 2160, noUpscale: true }))
        .toEqual({ width: 960, height: 1080 });
    });

    it('scaleFactor / formatScale', () => {
      expect(scaleFactor(orig, { width: 960, height: 540 })).toBe(0.5);
      expect(formatScale(orig, { width: 960, height: 540 })).toBe('50%');
      expect(formatScale(orig, { width: 640, height: 360 })).toBe('33.33%');
      expect(formatScale({ width: 0, height: 0 }, { width: 10, height: 10 })).toBe('100%');
    });
  });

  describe('逐级缩放', () => {
    it('中间步骤逐级不超过上一半, 末项为目标尺寸', () => {
      const steps = scaleSteps(4000, 4000, 100, 100);
      expect(steps).toEqual([
        { width: 2000, height: 2000 },
        { width: 1000, height: 1000 },
        { width: 500, height: 500 },
        { width: 250, height: 250 },
        { width: 125, height: 125 },
        { width: 100, height: 100 },
      ]);
    });

    it('未超过一半时只有一步 (即目标尺寸)', () => {
      expect(scaleSteps(1000, 500, 800, 400)).toEqual([ { width: 800, height: 400 } ]);
      // 放大与等尺寸同样只有一步
      expect(scaleSteps(100, 100, 200, 200)).toEqual([ { width: 200, height: 200 } ]);
      expect(scaleSteps(100, 100, 100, 100)).toEqual([ { width: 100, height: 100 } ]);
    });

    it('非等比目标尺寸也能收敛', () => {
      const steps = scaleSteps(3000, 1000, 300, 100);
      expect(steps[steps.length - 1]).toEqual({ width: 300, height: 100 });
      expect(steps.every((s) => s.width >= 300 && s.height >= 100)).toBe(true);
    });
  });

  describe('命名与格式', () => {
    it('baseName 去扩展名 / 清非法字符', () => {
      expect(baseName('photo.png')).toBe('photo');
      expect(baseName('my.photo.v2.jpeg')).toBe('my.photo.v2');
      expect(baseName('a b:c*d?.png')).toBe('a b_c_d_');
      expect(baseName('   ')).toBe('image');
      expect(baseName('.gitignore')).toBe('image');
      expect(baseName('无扩展名')).toBe('无扩展名');
    });

    it('outputFileName 带尺寸后缀', () => {
      expect(outputFileName('photo', { width: 800, height: 600 }, 'PNG')).toBe('photo_800x600.png');
      expect(outputFileName('photo', { width: 800, height: 600 }, 'JPEG')).toBe('photo_800x600.jpg');
      expect(outputFileName('photo', { width: 800, height: 600 }, 'WebP')).toBe('photo_800x600.webp');
      expect(outputFileName('', { width: 1, height: 1 }, 'PNG')).toBe('image_1x1.png');
    });

    it('扩展名 / MIME', () => {
      expect(extOf('PNG')).toBe('png');
      expect(extOf('JPEG')).toBe('jpg');
      expect(extOf('WebP')).toBe('webp');
      expect(mimeOf('PNG')).toBe('image/png');
      expect(mimeOf('JPEG')).toBe('image/jpeg');
      expect(mimeOf('WebP')).toBe('image/webp');
    });

    it('formatBytes', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(2048)).toBe('2.0 KB');
      expect(formatBytes(1024 * 1024 * 3)).toBe('3.00 MB');
    });

    it('dataUrlToBytes 解码 base64', () => {
      expect(Array.from(dataUrlToBytes('data:image/png;base64,aGk='))).toEqual([ 104, 105 ]);
      expect(dataUrlToBytes('data:image/png;base64,').length).toBe(0);
    });
  });

  describe('设置持久化', () => {
    beforeEach(() => localStorage.clear());

    it('默认值与写入读取一致', () => {
      expect(getDefaultPercent()).toBe(PERCENT_DEFAULT);
      expect(getDefaultFormat()).toBe('PNG');
      expect(getDefaultQuality()).toBe(QUALITY_DEFAULT);
      // 默认锁定宽高比
      expect(getLockRatio()).toBe(true);

      setDefaultPercent(75);
      setDefaultFormat('WebP');
      setDefaultQuality(0.8);
      setLockRatio(false);

      expect(localStorage.getItem(KEY_PERCENT)).toBe('75');
      expect(localStorage.getItem(KEY_FORMAT)).toBe('WebP');
      expect(localStorage.getItem(KEY_QUALITY)).toBe('0.8');
      expect(localStorage.getItem(KEY_LOCK)).toBe('0');

      expect(getDefaultPercent()).toBe(75);
      expect(getDefaultFormat()).toBe('WebP');
      expect(getDefaultQuality()).toBe(0.8);
      expect(getLockRatio()).toBe(false);
    });
  });
});
