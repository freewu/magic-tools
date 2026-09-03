import { parseHexBytes, bccHex, bccXor, parseExpected } from './lib';

describe('BCC 校验 (XOR 异或累加)', () => {

  test('解析: 常用分隔符与 0x 前缀', () => {
    expect(parseHexBytes('01 02 03')).toEqual([1, 2, 3]);
    expect(parseHexBytes('0x01,0x02,0x03')).toEqual([1, 2, 3]);
    expect(parseHexBytes('AB cd')).toEqual([0xAB, 0xCD]);
    expect(parseHexBytes('01-02:03;04|05_06\n07')).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(parseHexBytes('1 2 F')).toEqual([1, 2, 15]); // 单字符按高位补 0
    expect(parseHexBytes('')).toEqual([]);
  });

  test('解析: 非法输入抛错', () => {
    expect(() => parseHexBytes('01 zz')).toThrow();
    expect(() => parseHexBytes('123')).toThrow();   // 3 位十六进制
    expect(() => parseHexBytes('0x')).toThrow();    // 空 0x 段
    expect(() => parseHexBytes('GG')).toThrow();    // 非十六进制字符
  });

  test('XOR 计算: 结果正确', () => {
    expect(bccXor([0x01, 0x02])).toBe(0x03);
    expect(bccXor([0x41, 0x42, 0x43])).toBe(0x40);  // 'ABC'
    expect(bccXor([0xAA, 0x55])).toBe(0xFF);
    expect(bccXor([0x01, 0x03, 0x00, 0x00, 0x00, 0x02])).toBe(0x00);
    expect(bccHex([0x01, 0x02])).toBe('03');
    expect(bccHex([0xAA, 0x55])).toBe('FF');
    expect(bccHex([])).toBe('00'); // 空数据 XOR 起始值
  });

  test('期望值解析', () => {
    expect(parseExpected('0x5A')).toBe(0x5A);
    expect(parseExpected('a')).toBe(0x0A);
    expect(parseExpected('')).toBe(-2);
    expect(parseExpected('123')).toBe(-1);
    expect(parseExpected('zz')).toBe(-1);
  });
});
