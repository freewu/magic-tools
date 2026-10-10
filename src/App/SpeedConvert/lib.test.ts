import { getTypeList, getDefaultType, getTypePlaceholder, getDefaultUnitType, setDefaultUnitType, getDefaultMSType, setDefaultMSType, getDefaultIUType, setDefaultIUType, toKmh, fromKmh } from './lib';
import { BigNumber } from '../../lib/bignumber';

describe('SpeedConvert lib', () => {
  beforeEach(() => localStorage.clear());

  test('getTypeList 按制式过滤', () => {
    expect(getTypeList('ms').every((v) => v.type === 'ms')).toBe(true);
    expect(getTypeList('iu').length).toBeGreaterThan(0);
    expect(getTypeList('zz')).toEqual([]);
  });

  test('getTypePlaceholder 命中/未命中', () => {
    expect(getTypePlaceholder('kmh')).toBeDefined();
    expect(getTypePlaceholder('missing')).toBeUndefined();
  });

  test('默认制式与单位持久化', () => {
    expect(getDefaultType('ms')).toBe(getDefaultMSType());
    expect(getDefaultUnitType()).toBe('ms');
    setDefaultUnitType('iu');
    expect(getDefaultUnitType()).toBe('iu');
    setDefaultMSType('ms'); // 米/秒
    expect(getDefaultMSType()).toBe('ms');
    setDefaultIUType('mph');
  });

  test('toKmh / fromKmh 使用 BigNumber 精确换算', () => {
    expect(toKmh(new BigNumber(1), 'ms').toFixed()).toBe('3.6');
    expect(toKmh(new BigNumber(1), 'kms').toFixed()).toBe('3600');
    expect(toKmh(new BigNumber(1), 'knot').toFixed()).toBe('1.852');
    expect(toKmh(new BigNumber(1), 'mach').toFixed()).toBe('1224');
    expect(toKmh(new BigNumber(1), 'mph').toFixed()).toBe('1.6093');
    expect(toKmh(new BigNumber(1), 'fts').toFixed()).toBe('1.09728');
    expect(fromKmh(new BigNumber('3.6'), 'ms').toFixed()).toBe('1');
    expect(fromKmh(new BigNumber('1.852'), 'knot').toFixed()).toBe('1');
  });

  test('重力加速度 / 第一宇宙速度 等预设值换算正确', () => {
    // 第一宇宙速度 7.9 km/s = 28440 km/h
    expect(toKmh(new BigNumber('7.9'), 'kms').toFixed()).toBe('28440');
    // 光速 299792.458 km/s
    expect(toKmh(new BigNumber('299792.458'), 'kms').toFixed()).toBe('1079252848.8');
    // 1 马赫 = 1224 km/h
    expect(toKmh(new BigNumber(1), 'mach').toFixed()).toBe('1224');
  });

  test('toKmh 与 fromKmh 互逆 (含小数)', () => {
    const kmh = toKmh(new BigNumber('9.80665'), 'ms');
    expect(fromKmh(kmh, 'ms').toFixed()).toBe('9.80665');
    const k = toKmh(new BigNumber('1.5'), 'knot');
    expect(fromKmh(k, 'knot').toFixed()).toBe('1.5');
  });
});
