import { getTypeList, getDefaultType, getTypePlaceholder, getDefaultUnitType, setDefaultUnitType, getDefaultMSType, setDefaultMSType, getDefaultIUType, setDefaultIUType, getDefaultCNType, setDefaultCNType, getDefaultUSType, setDefaultUSType } from './lib';

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
});
