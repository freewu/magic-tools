import { BaseXEncode, BaseXDecode, getDefaultCode, setDefaultCode } from './lib';

describe('BaseX 编解码', () => {
  it('默认码型为 Base91', () => {
    localStorage.clear();
    expect(getDefaultCode()).toBe('Base91');
  });

  it('可设置并持久化默认码型', () => {
    setDefaultCode('Base58');
    expect(getDefaultCode()).toBe('Base58');
    setDefaultCode('Base91');
    localStorage.clear();
  });

  it('Base16: abc -> 616263', () => {
    expect(BaseXEncode('abc', 'Base16')).toBe('616263');
    expect(BaseXDecode('616263', 'Base16')).toBe('abc');
  });

  it('Base64: abc -> YWJj', () => {
    expect(BaseXEncode('abc', 'Base64')).toBe('YWJj');
    expect(BaseXDecode('YWJj', 'Base64')).toBe('abc');
  });

  it('Base91 中文往返一致', () => {
    const src = 'hello 中文 magic 🔧';
    expect(BaseXDecode(BaseXEncode(src, 'Base91'), 'Base91')).toBe(src);
  });

  it('各常用码型往返一致', () => {
    const src = 'The quick brown fox jumps over the lazy dog 0123456789';
    [ 'Base16', 'Base32', 'Base36', 'Base58', 'Base62', 'Base64', 'Base85-Ascii85', 'Base91' ].forEach((c) => {
      expect(BaseXDecode(BaseXEncode(src, c), c)).toBe(src);
    });
  });

  it('非法字符解码抛错', () => {
    expect(() => BaseXDecode('!!!不是Base16!!!', 'Base16')).toThrow();
  });
});
