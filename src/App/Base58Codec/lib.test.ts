import { Base58Encode, Base58Decode } from './lib';

describe('Base58Codec lib', () => {
  test('已知向量: Base58 编码 (比特币地址/字符)', () => {
    expect(Base58Encode('hello')).toBe('Cn8eVZg');
    expect(Base58Encode('a')).toBe('2g');
  });

  test('空字符串编解码', () => {
    expect(Base58Encode('')).toBe('');
    expect(Base58Decode('')).toBe('');
  });

  test('编码→解码 往返一致 (含中文与特殊字符)', () => {
    const samples = ['Hello, 世界!', '0x1A2b', ' 空格 与\ttab\n'];
    for (const s of samples) {
      expect(Base58Decode(Base58Encode(s))).toBe(s);
    }
  });

  test('非法 Base58 输入解码报错 (字母表不含 0/O/I/l)', () => {
    expect(() => Base58Decode('0OIl')).toThrow();
  });
});
