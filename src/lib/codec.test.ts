import { utf8ToBytes, bytesToUtf8, bytesToHex, hexToBytes, bytesToBase64, base64ToBytes, pkcs7Pad, pkcs7Unpad } from "./codec";

describe('通用编解码 (lib/codec)', () => {

  it('utf8 与 bytes 互转 (含中文/emoji)', () => {
    for(const text of ['Hello, 世界!', '中文测试 😀', 'a', '']) {
      expect(bytesToUtf8(utf8ToBytes(text))).toBe(text);
    }
  });

  it('hex 与 bytes 互转', () => {
    const bytes = utf8ToBytes('Hello, 世界!');
    expect(bytesToHex(hexToBytes(bytesToHex(bytes)))).toBe(bytesToHex(bytes));
    expect(bytesToHex(hexToBytes('0011223344556677'))).toBe('0011223344556677');
    expect(() => hexToBytes('zz')).toThrow();
    expect(() => hexToBytes('123')).toThrow();
    expect(() => hexToBytes('')).toThrow();
  });

  it('base64 与 bytes 互转', () => {
    expect(bytesToBase64(utf8ToBytes('Hello, 世界!'))).toBe('SGVsbG8sIOS4lueVjCE=');
    expect(bytesToBase64(utf8ToBytes('Hello'))).toBe('SGVsbG8=');
    expect(bytesToHex(base64ToBytes('SGVsbG8sIOS4lueVjCE='))).toBe(bytesToHex(utf8ToBytes('Hello, 世界!')));
    expect(() => base64ToBytes('!!!')).toThrow();
    expect(() => base64ToBytes('')).toThrow();
  });

  it('base64 无填充输入也能解析', () => {
    expect(base64ToBytes('SGVsbG8').toString()).toBe(utf8ToBytes('Hello').toString());
  });

  it('pkcs7 填充与去除', () => {
    expect(bytesToHex(pkcs7Pad(utf8ToBytes('Hello'), 8))).toBe('48656c6c6f030303');
    // 恰好整分组长度的数据会补一个完整分组
    const padded = pkcs7Pad(utf8ToBytes('12345678'), 8);
    expect(padded.length).toBe(16);
    expect(new Uint8Array(padded.slice(8)).every((b) => b === 8)).toBe(true);
    expect(bytesToUtf8(pkcs7Unpad(pkcs7Pad(utf8ToBytes('Hello'), 8), 8))).toBe('Hello');
    expect(bytesToUtf8(pkcs7Unpad(pkcs7Pad(utf8ToBytes(''), 8), 8))).toBe('');
    // 非法填充抛异常
    expect(() => pkcs7Unpad(hexToBytes('48656c6c6f123456'), 8)).toThrow();
    expect(() => pkcs7Unpad(hexToBytes('001122334455'), 8)).toThrow();
  });

});
