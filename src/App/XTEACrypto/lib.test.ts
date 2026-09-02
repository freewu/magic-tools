import { xteaEncrypt, xteaDecrypt, xteaEncryptText, xteaDecryptText } from "./lib";
import { hexToBytes, bytesToHex, bytesToUtf8, utf8ToBytes } from "../../lib/codec";

// 以 HEX 形式传递密文做互逆校验 (与页面编码输出/输入的行为一致)
const expectRoundTrip = (text :string, key :string, rounds :number) => {
  const cipher = xteaEncryptText(text, key, rounds);
  const plain = bytesToUtf8(xteaDecrypt(hexToBytes(bytesToHex(cipher)), utf8ToBytes(key), rounds));
  expect(plain).toBe(text);
}

describe('XTEA 加解密 (lib)', () => {

  it('与 PHP mcrypt xtea (npm xtea) 参考向量一致', () => {
    expect(bytesToHex(xteaEncryptText('Hello', '1234567890123456', 32))).toBe('ce413cc66ef918f0');
    expect(bytesToHex(xteaEncryptText('test vector 1', 'super secret key', 32))).toBe('df5394fcf357bfe274fc79109a3570cb');
    expect(bytesToHex(xteaEncryptText('00000000', 'super secret key', 32))).toBe('71b5b21ec4286b88bff0d8e210943e58');
    expect(bytesToHex(xteaEncryptText('Hello, world!', '1234567890123456', 32))).toBe('c0553954398068ca9ba33723e9c9ca96');
    expect(bytesToHex(xteaEncryptText('中文测试hello世界', '1234567890123456', 32))).toBe('ddc5df08d9ecd4860dc1f9dd1f41e24365eb6c379143cbdb');
  });

  it('64 轮分组向量与 Python 参考实现一致', () => {
    const cipher = xteaEncrypt(hexToBytes('0123456789abcdef'), hexToBytes('00112233445566778899aabbccddeeff'), 64);
    expect(bytesToHex(cipher)).toBe('22464feb44fd9ce6a6830f85d712c4e5');
  });

  it('加解密互逆 (字符串/多分组/中文)', () => {
    const samples = [
      'a',
      'Hello',
      'Hello, world!',
      '0123456789abcdef0123456789abcdef0123456789abcdef',
      '中文测试hello世界',
      '这是一个较长的中文测试字符串，用来验证多分组加解密是否正确。'
    ];
    for(const text of samples) {
      expectRoundTrip(text, '1234567890123456', 32);
    }
  });

  it('非默认轮数 (64 轮) 互逆', () => {
    expectRoundTrip('rounds-test-64-中文', 'abcdefghijklmnop', 64);
  });

  it('轮数不匹配时解密失败或得到非原文', () => {
    const cipher = xteaEncryptText('round-mismatch', 'abcdefghijklmnop', 32);
    try {
      const plain = bytesToUtf8(xteaDecrypt(hexToBytes(bytesToHex(cipher)), utf8ToBytes('abcdefghijklmnop'), 31));
      expect(plain).not.toBe('round-mismatch');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  it('密文长度不是 8 的倍数时解密抛异常', () => {
    expect(() => xteaDecrypt(hexToBytes('001122334455'), new Uint8Array(16), 32)).toThrow();
  });

});
