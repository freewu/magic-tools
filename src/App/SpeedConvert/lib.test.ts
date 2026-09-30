import { getTypeList, getDefaultType, getTypePlaceholder, getDefaultUnitType, setDefaultUnitType, getDefaultMSType, setDefaultMSType, getDefaultIUType, setDefaultIUType, } from './lib';

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
});
