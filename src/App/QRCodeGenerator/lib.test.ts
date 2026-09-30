import { getDefaultErrorLevel, setDefaultErrorLevel, getErrorLevelTip, getDefaultSize, setDefaultSize } from './lib';

describe('QRCodeGenerator lib', () => {
  beforeEach(() => localStorage.clear());

  test('默认容错等级 M, 可持久化; 非法等级回退 M', () => {
    expect(getDefaultErrorLevel()).toBe('M');
    setDefaultErrorLevel('H');
    expect(getDefaultErrorLevel()).toBe('H');
    setDefaultErrorLevel('X'); // 非法
    expect(getDefaultErrorLevel()).toBe('M');
  });

  test('getErrorLevelTip 返回对应提示, 未知名返回空串', () => {
    expect(getErrorLevelTip('M')).not.toBe('');
    expect(getErrorLevelTip('L')).not.toBe('');
    expect(getErrorLevelTip('H')).not.toBe('');
    expect(getErrorLevelTip('Q')).not.toBe('');
    expect(getErrorLevelTip('xx')).toBe('');
  });

  test('默认尺寸 160, 设置时最小钳到 160', () => {
    expect(getDefaultSize()).toBe(160);
    setDefaultSize(320);
    expect(getDefaultSize()).toBe(320);
    setDefaultSize(50); // 过小 → 钳 160
    expect(getDefaultSize()).toBe(160);
  });
});
