import { convertCurrency } from './lib';

describe('RMBConvert lib (人民币大写)', () => {
  test('0 / 空输入', () => {
    expect(convertCurrency('')).toBe('');
    expect(convertCurrency('0')).toBe('零元整');
  });

  test('整数金额', () => {
    expect(convertCurrency('1')).toBe('壹元整');
    expect(convertCurrency('10')).toBe('壹拾元整');
    expect(convertCurrency('100')).toBe('壹佰元整');
    expect(convertCurrency('10000')).toBe('壹万元整');
    expect(convertCurrency('100000000')).toBe('壹亿元整');
  });

  test('带小数金额', () => {
    expect(convertCurrency('1.5')).toBe('壹元伍角');
    expect(convertCurrency('1.05')).toBe('壹元伍分');
    expect(convertCurrency('0.5')).toBe('伍角');
    expect(convertCurrency('0.05')).toBe('伍分');
  });

  test('超范围返回空', () => {
    expect(convertCurrency('10000000000000000')).toBe('');
  });

  test('常见金额', () => {
    expect(convertCurrency('1234.56')).toContain('壹仟贰佰叁拾肆元');
    expect(convertCurrency('1234.56')).toContain('伍角陆分');
  });
});
