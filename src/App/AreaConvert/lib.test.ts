import { getTypeList, getDefaultType, getTypePlaceholder, getDefaultUnitType, setDefaultUnitType, getDefaultMSType, setDefaultMSType, getDefaultIUType, setDefaultIUType, getDefaultCNType, setDefaultCNType, getDefaultJPType, setDefaultJPType } from './lib';
import { typeList } from './data';

describe('AreaConvert lib', () => {
  beforeEach(() => localStorage.clear());

  test('getTypeList 按制式过滤, 未知制式返回空', () => {
    const ms = getTypeList('ms');
    expect(ms.length).toBeGreaterThan(0);
    expect(ms.every((v) => v.type === 'ms')).toBe(true);
    expect(getTypeList('iu').every((v) => v.type === 'iu')).toBe(true);
    expect(getTypeList('xx')).toEqual([]);
  });

  test('getTypePlaceholder 命中返回提示文字, 未命中返回 undefined', () => {
    expect(getTypePlaceholder('m2')).toBe(typeList.find((v) => v.value === 'm2')?.placeholder);
    expect(getTypePlaceholder('km2')).toBeDefined();
    expect(getTypePlaceholder('not-exist')).toBeUndefined();
  });

  test('getDefaultType 按制式返回对应默认单位, 未知制式回退公制', () => {
    expect(getDefaultType('ms')).toBe(getDefaultMSType());
    expect(getDefaultType('iu')).toBe(getDefaultIUType());
    expect(getDefaultType('cn')).toBe(getDefaultCNType());
    expect(getDefaultType('jp')).toBe(getDefaultJPType());
    expect(getDefaultType('xx')).toBe(getDefaultMSType());
  });

  test('默认制式与各制式默认单位可持久化, 无存储时回退内置默认', () => {
    expect(getDefaultUnitType()).toBe('ms');
    setDefaultUnitType('iu');
    expect(getDefaultUnitType()).toBe('iu');

    expect(getDefaultMSType()).toBe('m2');
    expect(getDefaultIUType()).not.toBe('');
    expect(getDefaultCNType()).toBeDefined();
    expect(getDefaultJPType()).toBeDefined();

    setDefaultMSType('km2');
    expect(getDefaultMSType()).toBe('km2');
  });
});
