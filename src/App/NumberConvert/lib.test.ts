import { translateDecimal } from './lib';

describe('NumberConvert lib', () => {
  test('translateDecimal 按进制转十进制', () => {
    expect(translateDecimal('1010', 'BIN')).toBe(10);
    expect(translateDecimal('17', 'OCT')).toBe(15);
    expect(translateDecimal('ff', 'HEX')).toBe(255);
    expect(translateDecimal('255', 'DEC')).toBe(255);
  });

  test('空/非法输入返回 NaN', () => {
    expect(translateDecimal('', 'HEX')).toBe(NaN);
    expect(translateDecimal('xyz', 'HEX')).toBe(NaN);
  });
});
