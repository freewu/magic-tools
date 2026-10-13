import '@testing-library/jest-dom';
import { BEAD_BRANDS, DEFAULT_BRAND, getBrand } from './palette';
import { beadsOf } from './lib';

describe('拼豆品牌色卡', () => {
  test('内置 6 个品牌, 顺序与用色数稳定', () => {
    expect(BEAD_BRANDS.map((b) => b.key)).toEqual([ 'mard', 'coco', 'artkal-mini', 'artkal', 'perler', 'hama' ]);
    expect(BEAD_BRANDS.map((b) => b.colors.length)).toEqual([ 221, 291, 221, 176, 117, 89 ]);
    expect(DEFAULT_BRAND).toBe('mard');
  });

  test('豆子直径与档位', () => {
    expect(getBrand('mard')).toMatchObject({ mm: 2.6, size: 'mini' });
    expect(getBrand('coco')).toMatchObject({ mm: 2.6, size: 'mini' });
    expect(getBrand('artkal-mini')).toMatchObject({ mm: 2.6, size: 'mini' });
    expect(getBrand('artkal')).toMatchObject({ mm: 5, size: 'big' });
    expect(getBrand('perler')).toMatchObject({ mm: 5, size: 'big' });
    expect(getBrand('hama')).toMatchObject({ mm: 5, size: 'big' });
  });

  test('未知品牌回退默认色卡', () => {
    expect(getBrand('not-a-brand').key).toBe(DEFAULT_BRAND);
    expect(getBrand('').key).toBe(DEFAULT_BRAND);
  });

  test('色号取 label 首段, 颜色名取其余', () => {
    expect(getBrand('mard').colors[0]).toEqual({ code: 'A1', name: '', hex: '#F9F0CD' });
    expect(getBrand('coco').colors[0]).toEqual({ code: 'E01', name: '', hex: '#FFFFD5' });
    expect(getBrand('artkal-mini').colors[0]).toEqual({ code: 'MA1', name: '淡黄色', hex: '#FFF6D4' });
    expect(getBrand('artkal').colors[0]).toEqual({ code: 'S01', name: 'White', hex: '#FFFFFF' });
    expect(getBrand('perler').colors[0]).toEqual({ code: 'P01', name: 'White', hex: '#F1F1F1' });
    expect(getBrand('hama').colors[0]).toEqual({ code: 'H01', name: 'White', hex: '#ECEDED' });
  });

  test('所有条目都是合法色值 + 非空色号, 且色号不重复', () => {
    for (const brand of BEAD_BRANDS) {
      const codes = new Set<string>();
      for (const c of brand.colors) {
        expect(c.hex).toMatch(/^#[0-9A-F]{6}$/);
        expect(c.code.trim().length).toBeGreaterThan(0);
        expect(codes.has(c.code)).toBe(false);
        codes.add(c.code);
      }
      // 品牌色卡本身不能带重复色号, 否则用量清单会出现同名两行
      expect(codes.size).toBe(brand.colors.length);
    }
  });

  test('beadsOf: 带 Lab 且按品牌缓存', () => {
    const hama = getBrand('hama');
    const a = beadsOf(hama);
    const b = beadsOf(hama);
    expect(a).toBe(b);
    expect(a.length).toBe(hama.colors.length);
    for (const bead of a) {
      expect(bead).toMatchObject({ code: expect.any(String), hex: expect.stringMatching(/^#[0-9A-F]{6}$/) });
      expect(Number.isFinite(bead.lab.L)).toBe(true);
      expect(bead.index).toBeGreaterThanOrEqual(0);
    }
    expect(Object.is(a[0], b[0])).toBe(true);
  });
});
