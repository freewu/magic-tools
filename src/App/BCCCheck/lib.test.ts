import { parseHexBytes, bccHex, bccXor, parseExpected, strToUtf8Bytes, parseInput, byteToHex, byteToDec, byteToOct, byteToBin } from './lib';

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

  test('ASCII 输入: 文本按 UTF-8 编码为字节', () => {
    expect(strToUtf8Bytes('ABC')).toEqual([0x41, 0x42, 0x43]);
    expect(strToUtf8Bytes('中文')).toEqual([0xE4, 0xB8, 0xAD, 0xE6, 0x96, 0x87]);
    expect(strToUtf8Bytes('💩')).toEqual([0xF0, 0x9F, 0x92, 0xA9]);
    expect(strToUtf8Bytes('')).toEqual([]);
    expect(bccHex(strToUtf8Bytes('ABC'))).toBe('40'); // 'ABC' XOR = 0x40
  });

  test('parseInput: 按模式分发', () => {
    expect(parseInput('01 02', 'hex')).toEqual([1, 2]);
    expect(parseInput('AB', 'ascii')).toEqual([0x41, 0x42]);
    expect(parseInput('', 'ascii')).toEqual([]);
    expect(() => parseInput('01 zz', 'hex')).toThrow();
  });

  test('各进制格式化 (0x5A=90=0o132=0b1011010)', () => {
    expect(byteToHex(0x5A)).toBe('5A');
    expect(byteToDec(0x5A)).toBe('90');
    expect(byteToOct(0x5A)).toBe('132');
    expect(byteToBin(0x5A)).toBe('01011010');
    expect(byteToHex(0)).toBe('00');
    expect(byteToDec(0)).toBe('0');
    expect(byteToOct(0)).toBe('000');
    expect(byteToBin(0)).toBe('00000000');
    expect(byteToHex(0xFF)).toBe('FF');
    expect(byteToDec(0xFF)).toBe('255');
    expect(byteToOct(0xFF)).toBe('377');
    expect(byteToBin(0xFF)).toBe('11111111');
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
