import {
  KEY_FORMAT, KEY_PARTS, KEY_QUALITY,
  axisBounds, extOf, findLayout, formatBytes, getDefaultFormat, getDefaultParts, getDefaultQuality,
  layoutKeyForParts, layoutsFor, mimeOf, normalizeFormat, normalizeParts, normalizeQuality, padNum,
  sanitizePrefix, scaleTileSize, setDefaultFormat, setDefaultParts, setDefaultQuality,
  tileFileName, tileRects,
} from './lib';
import { DEFAULT_PARTS, QUALITY_DEFAULT } from './data';

describe('图片分割', () => {
  describe('份数与布局', () => {
    it('份数选项为 2 / 3 / 4 / 6 / 9', () => {
      expect(layoutsFor(2)).toHaveLength(2);
      expect(layoutsFor(3)).toHaveLength(2);
      expect(layoutsFor(4)).toHaveLength(1);
      expect(layoutsFor(6)).toHaveLength(2);
      expect(layoutsFor(9)).toHaveLength(1);
      expect(layoutsFor(5)).toHaveLength(0);
    });

    it('每个布局的份数 = 行 × 列', () => {
      for (const parts of [ 2, 3, 4, 6, 9 ]) {
        for (const l of layoutsFor(parts)) expect(l.rows * l.cols).toBe(parts);
      }
    });

    it('findLayout 命中 key; 未命中回退该份数第一个布局', () => {
      expect(findLayout('3x3').cols).toBe(3);
      expect(findLayout('9x9', 3).key).toBe('1x3');
      expect(findLayout('9x9').key).toBe('1x2');
    });

    it('layoutKeyForParts: 支持则保留, 不支持则用该份数第一个', () => {
      expect(layoutKeyForParts(9, '2x2')).toBe('3x3');
      expect(layoutKeyForParts(4, '2x2')).toBe('2x2');
      expect(layoutKeyForParts(6, '2x3')).toBe('2x3');
    });

    it('normalizeParts 非法值回退默认', () => {
      expect(normalizeParts(6)).toBe(6);
      expect(normalizeParts(5)).toBe(DEFAULT_PARTS);
      expect(normalizeParts('x')).toBe(DEFAULT_PARTS);
      expect(normalizeParts(undefined)).toBe(DEFAULT_PARTS);
    });
  });

  describe('均分边界', () => {
    it('整除时等宽', () => {
      expect(axisBounds(300, 3)).toEqual([ 0, 100, 200, 300 ]);
    });

    it('不整除时余数分配到前几块, 各块差不超过 1 像素', () => {
      expect(axisBounds(100, 3)).toEqual([ 0, 33, 67, 100 ]);
      const b = axisBounds(101, 3);
      expect(b[0]).toBe(0);
      expect(b[3]).toBe(101);
      const widths = [ b[1] - b[0], b[2] - b[1], b[3] - b[2] ];
      expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    });

    it('总和恒为原长 (不丢像素)', () => {
      for (const total of [ 7, 64, 100, 999, 1024, 1025 ]) {
        for (const n of [ 2, 3, 4, 6, 9 ]) {
          const b = axisBounds(total, n);
          expect(b).toHaveLength(n + 1);
          expect(b[0]).toBe(0);
          expect(b[n]).toBe(total);
          let sum = 0;
          for (let i = 0; i < n; i++) sum += b[i + 1] - b[i];
          expect(sum).toBe(total);
        }
      }
    });

    it('边界单调不减 (总长小于份数时也不出现负宽)', () => {
      const b = axisBounds(2, 4);
      for (let i = 1; i < b.length; i++) expect(b[i]).toBeGreaterThanOrEqual(b[i - 1]);
      expect(b[b.length - 1]).toBe(2);
    });
  });

  describe('分块矩形', () => {
    it('数量与编号正确 (行优先, index 从 1 开始)', () => {
      const rects = tileRects(120, 120, findLayout('2x2'));
      expect(rects).toHaveLength(4);
      expect(rects.map((r) => r.index)).toEqual([ 1, 2, 3, 4 ]);
      expect(rects.map((r) => `${r.row}${r.col}`)).toEqual([ '00', '01', '10', '11' ]);
      expect(rects[3]).toMatchObject({ x: 60, y: 60, width: 60, height: 60 });
    });

    it('九宫格拼合后覆盖整图且互不重叠', () => {
      const w = 1000, h = 700;
      const rects = tileRects(w, h, findLayout('3x3'));
      expect(rects).toHaveLength(9);
      let area = 0;
      for (const r of rects) {
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.width).toBeLessThanOrEqual(w);
        expect(r.y + r.height).toBeLessThanOrEqual(h);
        area += r.width * r.height;
      }
      // 面积和 = 原图面积 (既不重叠也不缺失)
      expect(area).toBe(w * h);
    });

    it('2 份 / 3 份 / 6 份的两种方向尺寸不同', () => {
      const lr = tileRects(90, 60, findLayout('1x2'));
      expect(lr.map((r) => [ r.width, r.height ])).toEqual([ [ 45, 60 ], [ 45, 60 ] ]);
      const tb = tileRects(90, 60, findLayout('2x1'));
      expect(tb.map((r) => [ r.width, r.height ])).toEqual([ [ 90, 30 ], [ 90, 30 ] ]);
      const g6 = tileRects(90, 60, findLayout('2x3'));
      expect(g6).toHaveLength(6);
      expect(g6[0]).toMatchObject({ width: 30, height: 30 });
      const g6b = tileRects(90, 60, findLayout('3x2'));
      expect(g6b[0]).toMatchObject({ width: 45, height: 20 });
    });
  });

  describe('文件命名', () => {
    it('顺序编号按总份数补零', () => {
      expect(tileFileName('photo', { index: 1, row: 0, col: 0 }, 'seq', 'PNG', 9)).toBe('photo_1.png');
      expect(tileFileName('photo', { index: 9, row: 2, col: 2 }, 'seq', 'PNG', 9)).toBe('photo_9.png');
      expect(tileFileName('photo', { index: 1, row: 0, col: 0 }, 'seq', 'PNG', 12)).toBe('photo_01.png');
      expect(tileFileName('photo', { index: 12, row: 3, col: 1 }, 'seq', 'PNG', 12)).toBe('photo_12.png');
    });

    it('行列编号从 1 开始', () => {
      expect(tileFileName('photo', { index: 1, row: 0, col: 0 }, 'rc', 'PNG', 4)).toBe('photo_r1c1.png');
      expect(tileFileName('photo', { index: 4, row: 1, col: 1 }, 'rc', 'PNG', 4)).toBe('photo_r2c2.png');
    });

    it('JPEG 输出 .jpg', () => {
      expect(tileFileName('photo', { index: 2, row: 0, col: 1 }, 'seq', 'JPEG', 4)).toBe('photo_2.jpg');
      expect(extOf('JPEG')).toBe('jpg');
      expect(extOf('PNG')).toBe('png');
      expect(mimeOf('JPEG')).toBe('image/jpeg');
      expect(mimeOf('PNG')).toBe('image/png');
    });

    it('前缀去掉扩展名与非法字符, 空值回退 image', () => {
      expect(sanitizePrefix('a.b.png')).toBe('a.b');
      expect(sanitizePrefix('  my photo  ')).toBe('my photo');
      expect(sanitizePrefix('a/b:c*d?e"f<g>h|i')).toBe('abcdefghi');
      expect(sanitizePrefix('')).toBe('image');
      expect(sanitizePrefix('   ')).toBe('image');
      expect(sanitizePrefix('***')).toBe('image');
    });

    it('padNum 至少 1 位', () => {
      expect(padNum(3, 2)).toBe('03');
      expect(padNum(3, 0)).toBe('3');
      expect(padNum(12, 1)).toBe('12');
    });
  });

  describe('输出尺寸', () => {
    it('0 或负数保持原尺寸', () => {
      expect(scaleTileSize(100, 50, 0)).toEqual({ width: 100, height: 50, scale: 1 });
      expect(scaleTileSize(100, 50, -5).scale).toBe(1);
    });

    it('指定宽度时等比缩放 (高宽各自取整且不小于 1)', () => {
      const r = scaleTileSize(400, 300, 200);
      expect(r.width).toBe(200);
      expect(r.height).toBe(150);
      expect(scaleTileSize(400, 300, 500).scale).toBe(1);
      expect(scaleTileSize(400, 1, 1).height).toBe(1);
    });
  });

  describe('默认值与设置持久化', () => {
    it('默认份数 / 格式 / 质量', () => {
      localStorage.clear();
      expect(getDefaultParts()).toBe(4);
      expect(getDefaultFormat()).toBe('PNG');
      expect(getDefaultQuality()).toBeCloseTo(QUALITY_DEFAULT, 5);
    });

    it('写入后可读回', () => {
      localStorage.clear();
      setDefaultParts(9);
      setDefaultFormat('JPEG');
      setDefaultQuality(0.8);
      expect(getDefaultParts()).toBe(9);
      expect(getDefaultFormat()).toBe('JPEG');
      expect(getDefaultQuality()).toBeCloseTo(0.8, 5);
      localStorage.clear();
    });

    it('持久化非法值回退默认', () => {
      localStorage.clear();
      localStorage.setItem(KEY_PARTS, '5');
      localStorage.setItem(KEY_FORMAT, 'WEBP');
      localStorage.setItem(KEY_QUALITY, 'abc');
      expect(getDefaultParts()).toBe(4);
      expect(getDefaultFormat()).toBe('PNG');
      expect(getDefaultQuality()).toBeCloseTo(QUALITY_DEFAULT, 5);
      localStorage.clear();
    });

    it('质量超出范围会被裁剪', () => {
      expect(normalizeQuality(2)).toBe(1);
      expect(normalizeQuality(0.1)).toBe(0.5);
      expect(normalizeQuality('-')).toBe(QUALITY_DEFAULT);
      expect(normalizeFormat('png')).toBe('PNG');
      expect(normalizeFormat('bmp')).toBe('PNG');
    });
  });

  describe('工具函数', () => {
    it('formatBytes', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(2048)).toBe('2.0 KB');
      expect(formatBytes(1024 * 1024 * 3)).toBe('3.00 MB');
    });
  });
});
