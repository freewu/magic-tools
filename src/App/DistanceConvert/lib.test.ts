import { getTypeList, getDefaultType, getTypePlaceholder, getDefaultUnitType, setDefaultUnitType, getDefaultMSType, setDefaultMSType, getDefaultIUType, setDefaultIUType, getDefaultCNType, setDefaultCNType, } from './lib';

describe('DistanceConvert lib', () => {
  beforeEach(() => localStorage.clear());

  test('getTypeList 按制式过滤', () => {
    expect(getTypeList('ms').every((v) => v.type === 'ms')).toBe(true);
    expect(getTypeList('iu').length).toBeGreaterThan(0);
    expect(getTypeList('nope')).toEqual([]);
  });

  test('getTypePlaceholder 命中/未命中', () => {
    expect(getTypePlaceholder('m')).toBeDefined();
    expect(getTypePlaceholder('km')).toBeDefined();
    expect(getTypePlaceholder('__')).toBeUndefined();
  });

  test('getDefaultType 制式分支 + 默认制式持久化', () => {
    expect(getDefaultType('xx')).toBe(getDefaultMSType());
    expect(getDefaultUnitType()).toBe('ms');
    setDefaultUnitType('cn');
    expect(getDefaultUnitType()).toBe('cn');
    setDefaultMSType('km');
    expect(getDefaultMSType()).toBe('km');
    setDefaultIUType('foot');
    expect(getDefaultIUType()).toBe('foot');
    setDefaultCNType('l'); // 常用单位存在即可
  });
});
