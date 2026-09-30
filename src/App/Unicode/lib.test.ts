import { ascii2Unicode, unicode2Ascii } from './lib';

describe('Unicode lib', () => {
  test('ascii2Unicode: 逐个字符转 &#十进制;', () => {
    expect(ascii2Unicode('A')).toBe('&#65;');
    expect(ascii2Unicode('AB')).toBe('&#65;&#66;');
    expect(ascii2Unicode('你')).toBe('&#20320;');
  });

  test('空/空白输入返回空串', () => {
    expect(ascii2Unicode('')).toBe('');
    expect(ascii2Unicode('   ')).toBe('');
    expect(unicode2Ascii('')).toBe('');
    expect(unicode2Ascii('   ')).toBe('');
  });

  test('unicode2Ascii: 还原 &#n; 序列', () => {
    expect(unicode2Ascii('&#65;&#66;')).toBe('AB');
    expect(unicode2Ascii('&#20320;')).toBe('你');
  });

  test('非 &#n; 文本返回空串', () => {
    expect(unicode2Ascii('hello')).toBe('');
  });

  test('往返一致', () => {
    for (const s of ['Hello', '你好 world', 'ABC123']) {
      expect(unicode2Ascii(ascii2Unicode(s))).toBe(s);
    }
  });
});
