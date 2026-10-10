import { calcComplementaryColor, calcReadableTextColor, getDefaultColorPad, setDefaultColorPad, getDefaultBatchSwitch, setDefaultBatchSwitch, getDefaultOpacity, setDefaultOpacity, getDefaultPickMax, setDefaultPickMax } from './lib';

describe('Color lib', () => {
  beforeEach(() => localStorage.clear());

  test('calcComplementaryColor: 互补色 (红→青)', () => {
    expect(calcComplementaryColor('#FF0000')).toBe('#00FFFF');
    expect(calcComplementaryColor('#ff0000')).toBe('#00FFFF');
    expect(calcComplementaryColor('00FF00')).toBe('#FF00FF'); // 无 # 前缀
    expect(calcComplementaryColor('#000000')).toBe('#FFFFFF');
  });

  test('calcReadableTextColor: 优先使用反色', () => {
    expect(calcReadableTextColor('#000000')).toBe('#FFFFFF'); // 黑底 → 白字
    expect(calcReadableTextColor('#FFFFFF')).toBe('#000000'); // 白底 → 黑字
    expect(calcReadableTextColor('#FF0000')).toBe('#00FFFF'); // 红底 → 青色字
    expect(calcReadableTextColor('#0000FF')).toBe('#FFFF00'); // 蓝底 → 黄色字
    expect(calcReadableTextColor('#123456')).toBe('#EDCBA9'); // 深蓝底 → 反色
  });

  test('calcReadableTextColor: 反色对比度不足时回退黑/白', () => {
    expect(calcReadableTextColor('#808080')).toBe('#000000'); // 灰底反色仍是灰, 用黑字
    expect(calcReadableTextColor('#0066A3')).toBe('#FFFFFF'); // 深蓝底反色偏亮, 用白字更清晰
    expect(calcReadableTextColor('#CCC')).toBe('#333333'); // 三位简写
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
