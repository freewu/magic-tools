import { xxEncodeText, xxDecodeText, xxEncodeBytes, xxDecodeToBytes } from './lib';

describe('XXencode 编解码', () => {
  it('编码向量 (与 npm xxencode 一致)', () => {
    expect(xxEncodeText('a')).toBe('-ME++');
    expect(xxEncodeText('ab')).toBe('0MK6+');
    expect(xxEncodeText('cat')).toBe('1Mq3o');
    expect(xxEncodeText('123456789')).toBe('7AH6nB1IqBnUt');
    expect(xxEncodeText('MagicTools 中文')).toBe('FHK3bOKBIPqxgQm1Yi8raZcQ+');
  });

  it('解码向量 (来自 npm xxencode 的输出)', () => {
    expect(xxDecodeText('-ME++')).toBe('a');
    expect(xxDecodeText('0MK6+')).toBe('ab');
    expect(xxDecodeText('1Mq3o')).toBe('cat');
    expect(xxDecodeText('7AH6nB1IqBnUt')).toBe('123456789');
    expect(xxDecodeText('FHK3bOKBIPqxgQm1Yi8raZcQ+')).toBe('MagicTools 中文');
  });

  it('空输入', () => {
    expect(xxEncodeText('')).toBe('');
    expect(xxDecodeText('')).toBe('');
  });

  it('无前缀纯数据行也能解码', () => {
    expect(xxDecodeText('Mq3o')).toBe('cat');
    expect(xxDecodeText('AH6nB1IqBnUt')).toBe('123456789');
  });

  it('UTF-8 中文字符往返一致', () => {
    const samples = ['MagicTools 中文测试', '你好，世界！😀', 'a', 'ab', 'abc', 'abcd'];
    for (const s of samples) {
      expect(xxDecodeText(xxEncodeText(s))).toBe(s);
    }
  });

  it('超过 45 字节自动换行 (每行前缀 I) 且往返一致', () => {
    const long = '1234567890'.repeat(10); // 100 字节
    const enc = xxEncodeText(long);
    const lines = enc.split('\n');
    expect(lines.length).toBe(3); // 45 + 45 + 10
    expect(lines[0][0]).toBe('h'); // 编码表[45]
    expect(lines[1][0]).toBe('h');
    expect(lines[2][0]).toBe('8'); // 编码表[10]
    expect(xxDecodeText(enc)).toBe(long);
  });

  it('兼容经典 begin/end 文件头尾', () => {
    const enc = xxEncodeText('Hello XXencode');
    const wrapped = `begin 644 data.txt\n${enc}\n\`\nend`;
    expect(xxDecodeText(wrapped)).toBe('Hello XXencode');
  });

  it('字节级编码', () => {
    const bytes = Array.from({ length: 48 }, (_, i) => i);
    expect(xxDecodeToBytes(xxEncodeBytes(bytes))).toEqual(bytes);
  });

  it('非法字符解码抛错', () => {
    expect(() => xxDecodeText('a=b=c')).toThrow(); // '=' 非法字符
    expect(() => xxDecodeText('Mq3o;')).toThrow(); // ';' 非法字符
    expect(() => xxDecodeText('Mq3')).toThrow();   // 长度不合法
  });
});
