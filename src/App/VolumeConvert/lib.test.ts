import { getTypeList, getDefaultType, getTypePlaceholder, getDefaultUnitType, setDefaultUnitType, getDefaultMSType, setDefaultMSType, getDefaultIUType, setDefaultIUType, getDefaultCNType, setDefaultCNType, getDefaultUSType, setDefaultUSType, toMl, fromMl } from './lib';
import { BigNumber } from '../../lib/bignumber';

describe('VolumeConvert lib', () => {
  beforeEach(() => localStorage.clear());

  test('getTypeList 按制式过滤', () => {
    expect(getTypeList('ms').every((v) => v.type === 'ms')).toBe(true);
    expect(getTypeList('us').every((v) => v.type === 'us')).toBe(true);
    expect(getTypeList('cn').length).toBeGreaterThan(0);
    expect(getTypeList('??')).toEqual([]);
  });

  test('getTypePlaceholder 命中/未命中', () => {
    expect(getTypePlaceholder('l')).toBeDefined();
    expect(getTypePlaceholder('m3')).toBeDefined();
    expect(getTypePlaceholder('_')).toBeUndefined();
  });

  test('getDefaultType 制式分支 + 默认单位持久化', () => {
    expect(getDefaultType('ms')).toBe(getDefaultMSType());
    expect(getDefaultType('us')).toBe(getDefaultUSType());
    expect(getDefaultType('other')).toBe(getDefaultMSType());
    expect(getDefaultUnitType()).toBe('ms');
    setDefaultUnitType('us');
    expect(getDefaultUnitType()).toBe('us');
    setDefaultMSType('l');
    expect(getDefaultMSType()).toBe('l');
    setDefaultUSType('gal');
    setDefaultCNType('sheng');
  });

  test('toMl / fromMl 使用 BigNumber 精确换算', () => {
    expect(toMl(new BigNumber(1), 'l').toFixed()).toBe('1000');
    expect(toMl(new BigNumber(1), 'm3').toFixed()).toBe('1000000');
    expect(toMl(new BigNumber(1), 'mm3').toFixed()).toBe('0.001');
    expect(toMl(new BigNumber(1), 'us-gallon').toFixed()).toBe('3785.41178');
    expect(toMl(new BigNumber(1), 'iu-gallon').toFixed()).toBe('4546.09');
    expect(toMl(new BigNumber(1), 'us-ounce').toFixed()).toBe('29.5735295625');
    expect(toMl(new BigNumber(1), 'iu-ounce').toFixed()).toBe('28.4130625');
    expect(toMl(new BigNumber(1), 'dou').toFixed()).toBe('10000');
    expect(fromMl(new BigNumber('3785.41178'), 'us-gallon').toFixed()).toBe('1');
    expect(fromMl(new BigNumber(1000), 'l').toFixed()).toBe('1');
  });

  test('toMl 与 fromMl 互逆 (含小数)', () => {
    const ml = toMl(new BigNumber('18.9'), 'l');
    expect(ml.toFixed()).toBe('18900');
    expect(fromMl(ml, 'l').toFixed()).toBe('18.9');
    const oz = toMl(new BigNumber('1.5'), 'us-ounce');
    expect(fromMl(oz, 'us-ounce').toFixed()).toBe('1.5');
  });
});
