import { uuEncodeText, uuDecodeText, uuEncodeBytes, uuDecodeToBytes } from './lib';

describe('UUencode 编解码', () => {
  it('编码向量 (与 Python binascii.b2a_uu 一致)', () => {
    expect(uuEncodeText('a')).toBe('!80  ');
    expect(uuEncodeText('ab')).toBe('"86( ');
    expect(uuEncodeText('cat')).toBe('#8V%T');
    expect(uuEncodeText('123456789')).toBe('),3(S-#4V-S@Y');
  });

  it('解码向量', () => {
    expect(uuDecodeText('!80  ')).toBe('a');
    expect(uuDecodeText('"86( ')).toBe('ab');
    expect(uuDecodeText('#8V%T')).toBe('cat');
    expect(uuDecodeText('),3(S-#4V-S@Y')).toBe('123456789');
  });

  it('空输入', () => {
    expect(uuEncodeText('')).toBe('');
    expect(uuDecodeText('')).toBe('');
  });

  it('UTF-8 中文字符往返一致', () => {
    const samples = ['MagicTools 中文测试', '你好，世界！😀', 'a', 'ab', 'abc', 'abcd'];
    for (const s of samples) {
      expect(uuDecodeText(uuEncodeText(s))).toBe(s);
    }
  });

  it('超过 45 字节自动换行 (每行前缀 M) 且往返一致', () => {
    const long = '1234567890'.repeat(10); // 100 字节
    const enc = uuEncodeText(long);
    const lines = enc.split('\n');
    expect(lines.length).toBe(3); // 45 + 45 + 10
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(61); // 前缀 1 + 45 字节 -> 60 字符
    }
    expect(lines[0].charCodeAt(0)).toBe(32 + 45); // 'M'
    expect(lines[1].charCodeAt(0)).toBe(32 + 45);
    expect(lines[2].charCodeAt(0)).toBe(32 + 10);
    expect(uuDecodeText(enc)).toBe(long);
  });

  it('兼容经典 begin/end 文件头尾', () => {
    const enc = uuEncodeText('Hello UUencode');
    const wrapped = `begin 644 data.txt\n${enc}\n\`\nend`;
    expect(uuDecodeText(wrapped)).toBe('Hello UUencode');
  });

  it('字节级编码', () => {
    // 0x00 0x01 ... 0x2f 二进制数据
    const bytes = Array.from({ length: 48 }, (_, i) => i);
    expect(uuDecodeToBytes(uuEncodeBytes(bytes))).toEqual(bytes);
  });

  it('非法字符解码抛错', () => {
    expect(() => uuDecodeText('@~!')).toThrow();
  });
});
