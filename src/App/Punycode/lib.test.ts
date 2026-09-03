import { punycodeEncode, punycodeDecode, encodeText, decodeText } from './lib';

describe('Punycode 编解码 (RFC 3492)', () => {

  // 向量与官方 punycode.js 2.3.1 输出一致
  test('编码: 常用向量', () => {
    expect(punycodeEncode('bücher')).toBe('bcher-kva');
    expect(punycodeEncode('münchen')).toBe('mnchen-3ya');
    expect(punycodeEncode('mañana')).toBe('maana-pta');
    expect(punycodeEncode('中文')).toBe('fiq228c');
    expect(punycodeEncode('中国')).toBe('fiqs8s');
    expect(punycodeEncode('示例')).toBe('fsq092h');
  });

  test('编码: 特殊字符与 emoji (代理对)', () => {
    expect(punycodeEncode('☃-⌘')).toBe('--dqo34k');
    expect(punycodeEncode('💩')).toBe('ls8h');
    expect(punycodeEncode('中文💩')).toBe('fiq228ceq6z');
  });

  test('解码: 常用向量 (含代理对)', () => {
    expect(punycodeDecode('bcher-kva')).toBe('bücher');
    expect(punycodeDecode('mnchen-3ya')).toBe('münchen');
    expect(punycodeDecode('maana-pta')).toBe('mañana');
    expect(punycodeDecode('fiq228c')).toBe('中文');
    expect(punycodeDecode('fiqs8s')).toBe('中国');
    expect(punycodeDecode('fsq092h')).toBe('示例');
    expect(punycodeDecode('--dqo34k')).toBe('☃-⌘');
    expect(punycodeDecode('ls8h')).toBe('💩');
  });

  test('编解码往返一致', () => {
    const samples = ['中文', 'bücher', 'mañana', '☃-⌘', '💩', '示例.测试', 'a中文b'];
    for (const s of samples) {
      expect(punycodeDecode(punycodeEncode(s))).toBe(s);
    }
  });

  test('域名分段: encodeText 加 xn-- 前缀', () => {
    expect(encodeText('中文')).toBe('xn--fiq228c');
    expect(encodeText('中文.中国')).toBe('xn--fiq228c.xn--fiqs8s');
    expect(encodeText('bücher.de')).toBe('xn--bcher-kva.de');
    expect(encodeText('abc.example.com')).toBe('abc.example.com'); // 纯 ASCII 不变
    expect(encodeText('München')).toBe('xn--Mnchen-3ya'); // 基础段大小写保留
  });

  test('域名分段: decodeText 去除 xn-- 前缀', () => {
    expect(decodeText('xn--fiq228c')).toBe('中文');
    expect(decodeText('xn--fiq228c.xn--fiqs8s')).toBe('中文.中国');
    expect(decodeText('xn--bcher-kva.de')).toBe('bücher.de');
    expect(decodeText('xn--MNCHEN-3YA')).toBe('MüNCHEN'); // 大小写原样保留 (IDNA 层才做 case folding)
    expect(decodeText('abc.example.com')).toBe('abc.example.com'); // 纯 ASCII 不变
    expect(decodeText('mnchen-3ya')).toBe('münchen'); // 无前缀的纯 Punycode
  });

  test('解码: 非法输入抛错', () => {
    expect(() => punycodeDecode('abc!')).toThrow(); // '!' 非 base32 字符
    expect(() => punycodeDecode('fiq228c!')).toThrow();
    expect(() => decodeText('xn--!!!')).toThrow();
    expect(punycodeDecode('')).toBe(''); // 空串原样返回
  });
});
