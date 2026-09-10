import { colorTypeList } from './data';

describe('colorTypeList', () => {
  it('AUTO 自动识别为第一项 (界面默认选中首项)', () => {
    expect(colorTypeList[0].value).toBe('AUTO');
    expect(colorTypeList[0].label).toBe('自动识别');
  });

  it('包含全部输入格式且顺序稳定', () => {
    expect(colorTypeList.map((item) => item.value)).toEqual([
      'AUTO', 'HEX', 'RGB', 'HSL', 'CMYK', 'HSV', 'LAB', 'LCH', 'XYZ',
    ]);
  });

  it('每项均有 placeholder 提示', () => {
    for (const item of colorTypeList) {
      expect(item.placeholder.length).toBeGreaterThan(0);
    }
  });
});
