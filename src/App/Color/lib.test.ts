import { calcComplementaryColor, getDefaultColorPad, setDefaultColorPad, getDefaultBatchSwitch, setDefaultBatchSwitch, getDefaultOpacity, setDefaultOpacity, getDefaultPickMax, setDefaultPickMax } from './lib';

describe('Color lib', () => {
  beforeEach(() => localStorage.clear());

  test('calcComplementaryColor: 互补色 (红→青)', () => {
    expect(calcComplementaryColor('#FF0000')).toBe('#00FFFF');
    expect(calcComplementaryColor('#ff0000')).toBe('#00FFFF');
    expect(calcComplementaryColor('00FF00')).toBe('#FF00FF'); // 无 # 前缀
    expect(calcComplementaryColor('#000000')).toBe('#FFFFFF');
  });

  test('默认取色盘 / 批量开关 / 透明度 / 取色上限持久化', () => {
    expect(getDefaultColorPad()).toBeDefined();
    setDefaultColorPad('home');
    expect(getDefaultColorPad()).toBe('home');

    expect(getDefaultBatchSwitch()).toBe(false);
    setDefaultBatchSwitch(true);
    expect(getDefaultBatchSwitch()).toBe(true);

    expect(getDefaultOpacity()).toBeGreaterThan(0);
    setDefaultOpacity(8);
    expect(getDefaultOpacity()).toBe(8);

    expect(getDefaultPickMax()).toBeGreaterThan(0);
    setDefaultPickMax(6);
    expect(getDefaultPickMax()).toBe(6);
  });
});
