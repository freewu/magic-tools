import { getTypeList, getDefaultType, getTypePlaceholder, getDefaultUnitType, setDefaultUnitType, getDefaultMSType, setDefaultMSType, getDefaultIUType, setDefaultIUType, getDefaultCNType, setDefaultCNType } from './lib';

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
});
