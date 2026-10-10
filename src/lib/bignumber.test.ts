import { BigNumber, parseBN, formatBN } from './bignumber';

describe('lib/bignumber', () => {
  test('parseBN 接受合法数字文本 (含正负号 / 小数 / 前后空格)', () => {
    expect(parseBN('0')?.toFixed()).toBe('0');
    expect(parseBN('  12.5 ')?.toFixed()).toBe('12.5');
    expect(parseBN('-3.25')?.toFixed()).toBe('-3.25');
    expect(parseBN('+8')?.toFixed()).toBe('8');
    expect(parseBN('.5')?.toFixed()).toBe('0.5');
    expect(parseBN('100.')?.toFixed()).toBe('100');
  });

  test('parseBN 非法输入一律返回 null', () => {
    expect(parseBN('')).toBeNull();
    expect(parseBN('   ')).toBeNull();
    expect(parseBN('abc')).toBeNull();
    expect(parseBN('1e3')).toBeNull();
    expect(parseBN('1,000')).toBeNull();
    expect(parseBN('1.2.3')).toBeNull();
    expect(parseBN('--1')).toBeNull();
    expect(parseBN(null)).toBeNull();
    expect(parseBN(undefined)).toBeNull();
  });

  test('formatBN 去尾零 / 四舍五入 / 不使用科学计数法', () => {
    expect(formatBN(new BigNumber('1.2300'))).toBe('1.23');
    expect(formatBN(new BigNumber('10'))).toBe('10');
    expect(formatBN(new BigNumber('0'))).toBe('0');
    expect(formatBN(new BigNumber('-0.000'))).toBe('0');
    expect(formatBN(new BigNumber('1.23456789012'))).toBe('1.2345678901');
    // 超过 1e21 依然用普通记法
    expect(formatBN(new BigNumber('1e21'))).toBe('1000000000000000000000');
  });

  test('formatBN 极小值退回完整精度而不是直接显示 0', () => {
    expect(formatBN(new BigNumber('1e-15'))).toBe('0.000000000000001');
    // 1 字节 => 约 8.271806e-25 YB, 不能显示成 0
    const oneByteInYb = new BigNumber(1).div(new BigNumber(1024).pow(8));
    expect(formatBN(oneByteInYb)).toBe('0.0000000000000000000000008271806125530277');
  });

  test('BigNumber 精确计算 (规避浮点误差)', () => {
    expect(new BigNumber('0.1').plus('0.2').toFixed()).toBe('0.3');
    expect(new BigNumber('0.3').minus('0.1').toFixed()).toBe('0.2');
    // 除法精确可还原 (1/8 是有限小数)
    expect(new BigNumber(1).div(8).times(8).toFixed()).toBe('1');
    // 无限循环小数按 DECIMAL_PLACES=40 截断
    expect(new BigNumber(1).div(3).toFixed()).toBe('0.' + '3'.repeat(40));
  });
});
