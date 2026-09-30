import { c2f, f2c, c2k, k2c, c2r, r2c, c2d, d2c, c2n, n2c, c2Re, re2c, c2Ra, ra2c, getDefaultType, setDefaultType, getTypePlaceholder } from './lib';

describe('TemperatureConvert lib', () => {
  beforeEach(() => localStorage.clear());

  test('摄氏 ↔ 华氏 (0/100℃ 基准)', () => {
    expect(c2f(0)).toBe(32);
    expect(c2f(100)).toBe(212);
    expect(f2c(32)).toBe(0);
    expect(f2c(212)).toBe(100);
  });

  test('摄氏 ↔ 开尔文 (绝对零度基准)', () => {
    expect(c2k(0)).toBe(273.15);
    expect(c2k(-273.15)).toBeCloseTo(0, 6);
    expect(k2c(273.15)).toBe(0);
    expect(k2c(0)).toBeCloseTo(-273.15, 6);
  });

  test('摄氏 ↔ 兰金', () => {
    expect(c2r(0)).toBeCloseTo(491.67, 6);
    expect(r2c(491.67)).toBeCloseTo(0, 6);
  });

  test('摄氏 ↔ 德利尔', () => {
    expect(c2d(100)).toBe(0);
    expect(c2d(0)).toBe(150);
    expect(d2c(0)).toBe(100);
    expect(d2c(150)).toBe(0);
  });

  test('摄氏 ↔ 牛顿', () => {
    expect(c2n(100)).toBe(33);
    expect(c2n(0)).toBe(0);
    expect(n2c(33)).toBe(100);
  });

  test('摄氏 ↔ 列氏 / 罗氏', () => {
    expect(c2Re(100)).toBe(80);
    expect(re2c(80)).toBe(100);
    expect(c2Ra(0)).toBe(7.5);
    expect(ra2c(7.5)).toBe(0);
  });

  test('温度类型提示与默认值持久化', () => {
    expect(getTypePlaceholder('c')).toBeDefined();
    expect(getTypePlaceholder('zz')).toBeUndefined();
    expect(getDefaultType()).toBe('c');
    setDefaultType('f');
    expect(getDefaultType()).toBe('f');
  });
});
