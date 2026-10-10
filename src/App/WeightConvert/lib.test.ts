import { getTypeList, getDefaultType, getTypePlaceholder, getDefaultUnitType, setDefaultUnitType, getDefaultMSType, setDefaultMSType, getDefaultIUType, setDefaultIUType, getDefaultCNType, setDefaultCNType, toGram, fromGram } from './lib';
import { BigNumber } from '../../lib/bignumber';

describe('WeightConvert lib', () => {
  beforeEach(() => localStorage.clear());

  test('getTypeList 按制式过滤', () => {
    expect(getTypeList('ms').every((v) => v.type === 'ms')).toBe(true);
    expect(getTypeList('iu').length).toBeGreaterThan(0);
    expect(getTypeList('cn').length).toBeGreaterThan(0);
    expect(getTypeList('unknown')).toEqual([]);
  });

  test('getTypePlaceholder 命中/未命中', () => {
    expect(getTypePlaceholder('kg')).toBeDefined();
    expect(getTypePlaceholder('g')).toBeDefined();
    expect(getTypePlaceholder('missing')).toBeUndefined();
  });

  test('默认制式与各单位持久化', () => {
    expect(getDefaultType('ms')).toBe(getDefaultMSType());
    expect(getDefaultUnitType()).toBe('ms');
    setDefaultUnitType('cn');
    expect(getDefaultUnitType()).toBe('cn');
    setDefaultMSType('kg');
    expect(getDefaultMSType()).toBe('kg');
    setDefaultIUType('lb');
    setDefaultCNType('jin');
  });

  test('toGram / fromGram 使用 BigNumber 精确换算', () => {
    expect(toGram(new BigNumber(1), 'kg').toFixed()).toBe('1000');
    expect(toGram(new BigNumber(1), 't').toFixed()).toBe('1000000');
    expect(toGram(new BigNumber(1), 'mg').toFixed()).toBe('0.001');
    expect(toGram(new BigNumber(1), 'mcg').toFixed()).toBe('0.000001');
    expect(toGram(new BigNumber(1), 'ct').toFixed()).toBe('0.2');
    expect(toGram(new BigNumber(1), 'oz').toFixed()).toBe('28.349523125');
    expect(toGram(new BigNumber(1), 'lb').toFixed()).toBe('453.59237');
    expect(toGram(new BigNumber(1), 'gr').toFixed()).toBe('0.06479891');
    expect(toGram(new BigNumber(1), 'longton').toFixed()).toBe('1016000');
    expect(toGram(new BigNumber(1), 'shortton').toFixed()).toBe('907000');
    expect(toGram(new BigNumber(1), 'jin').toFixed()).toBe('500');
    expect(toGram(new BigNumber(1), 'li').toFixed()).toBe('0.05');
    expect(fromGram(new BigNumber('453.59237'), 'lb').toFixed()).toBe('1');
  });

  test('toGram 与 fromGram 互逆 (含小数)', () => {
    const g = toGram(new BigNumber('1.75'), 'lb');
    expect(fromGram(g, 'lb').toFixed()).toBe('1.75');
    const w = toGram(new BigNumber('3.5'), 'jin');
    expect(w.toFixed()).toBe('1750');
    expect(fromGram(w, 'jin').toFixed()).toBe('3.5');
  });
});
